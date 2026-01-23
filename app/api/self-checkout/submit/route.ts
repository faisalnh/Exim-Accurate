"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveInventoryAdjustment } from "@/lib/accurate/inventory";
import { refreshSession, refreshAccessToken } from "@/lib/accurate/client";
import dayjs from "dayjs";

interface CheckoutItem {
    itemCode: string;
    itemName?: string;
    quantity: number;
}

interface CheckoutRequest {
    credentialId: string;
    staffEmail: string;
    items: CheckoutItem[];
}

// Parse staff name and department from email
function parseStaffInfo(email: string): { name: string; department: string } {
    // Example email formats:
    // firstname.lastname@company.com -> Name: Firstname Lastname
    // firstname.lastname.dept@company.com -> Name: Firstname Lastname, Dept: dept
    // firstname@dept.company.com -> Name: Firstname, Dept: dept

    const localPart = email.split("@")[0];
    const parts = localPart.split(".");

    // Capitalize first letter of each word
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    if (parts.length >= 3) {
        // Assume last part might be department
        const department = capitalize(parts[parts.length - 1]);
        const nameParts = parts.slice(0, -1).map(capitalize);
        return { name: nameParts.join(" "), department };
    } else if (parts.length === 2) {
        // firstname.lastname format
        return { name: parts.map(capitalize).join(" "), department: "" };
    } else {
        return { name: capitalize(parts[0]), department: "" };
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: CheckoutRequest;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { credentialId, staffEmail, items } = body;

    if (!credentialId) {
        return NextResponse.json({ error: "Credential ID is required" }, { status: 400 });
    }

    if (!staffEmail || !staffEmail.includes("@")) {
        return NextResponse.json({ error: "Valid staff email is required" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    try {
        // Get credentials
        let credential = await prisma.accurateCredentials.findFirst({
            where: {
                id: credentialId,
                userId: session.user.id,
            },
        });

        if (!credential) {
            return NextResponse.json({ error: "Credential not found" }, { status: 404 });
        }

        // Parse staff info from email
        const { name: staffName, department: staffDept } = parseStaffInfo(staffEmail);

        // Create checkout session in database
        const checkoutSession = await prisma.checkoutSession.create({
            data: {
                staffEmail,
                staffName,
                staffDept,
                credentialId,
                status: "pending",
                items: {
                    create: items.map((item) => ({
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        quantity: item.quantity,
                    })),
                },
            },
            include: { items: true },
        });

        // Ensure we have a valid session
        if (!credential.session || !credential.host) {
            if (credential.dbId) {
                try {
                    const { host, session: newSession } = await refreshSession(
                        credential.apiToken,
                        credential.dbId
                    );
                    credential = await prisma.accurateCredentials.update({
                        where: { id: credential.id },
                        data: { host, session: newSession },
                    });
                } catch (sessionErr: any) {
                    if (credential.refreshToken) {
                        const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(
                            credential.refreshToken,
                            credential.appKey,
                            credential.signatureSecret
                        );

                        credential = await prisma.accurateCredentials.update({
                            where: { id: credential.id },
                            data: {
                                apiToken: accessToken,
                                refreshToken: newRefreshToken || credential.refreshToken,
                            },
                        });

                        const { host, session: newSession } = await refreshSession(
                            accessToken,
                            credential.dbId!
                        );
                        credential = await prisma.accurateCredentials.update({
                            where: { id: credential.id },
                            data: { host, session: newSession },
                        });
                    } else {
                        await prisma.checkoutSession.update({
                            where: { id: checkoutSession.id },
                            data: { status: "failed", errorMessage: "Session expired" },
                        });
                        throw new Error("Session expired. Please reconnect to Accurate.");
                    }
                }
            } else {
                await prisma.checkoutSession.update({
                    where: { id: checkoutSession.id },
                    data: { status: "failed", errorMessage: "Credential not configured" },
                });
                return NextResponse.json(
                    { error: "Credential not fully configured. Please reconnect to Accurate." },
                    { status: 400 }
                );
            }
        }

        // Build description with staff info
        const descriptionParts = [`Self Checkout by ${staffName || staffEmail}`];
        if (staffDept) {
            descriptionParts.push(`Dept: ${staffDept}`);
        }
        descriptionParts.push(`Email: ${staffEmail}`);
        const description = descriptionParts.join(" | ");

        // Create inventory adjustment in Accurate (ADJUSTMENT_OUT = taking items out)
        const adjustmentData = {
            transDate: dayjs().format("YYYY-MM-DD"),
            description,
            detailItem: items.map((item) => ({
                itemNo: item.itemCode,
                quantity: item.quantity,
                itemAdjustmentType: "ADJUSTMENT_OUT" as const,
            })),
        };

        console.log("[self-checkout/submit] Creating adjustment:", JSON.stringify(adjustmentData));

        const result = await saveInventoryAdjustment(
            {
                apiToken: credential.apiToken,
                signatureSecret: credential.signatureSecret,
                host: credential.host!,
                session: credential.session!,
            },
            adjustmentData
        );

        // Update checkout session as completed
        await prisma.checkoutSession.update({
            where: { id: checkoutSession.id },
            data: {
                status: "completed",
                completedAt: new Date(),
                adjustmentId: result.id,
            },
        });

        return NextResponse.json({
            success: true,
            sessionId: checkoutSession.id,
            adjustmentId: result.id,
            adjustmentNumber: result.r,
            staffName,
            staffDept,
            itemCount: items.length,
        });
    } catch (error: any) {
        console.error("[self-checkout/submit] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to submit checkout" },
            { status: 500 }
        );
    }
}
