"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveInventoryAdjustment } from "@/lib/accurate/inventory";
import { refreshSession, refreshAccessToken } from "@/lib/accurate/client";
import dayjs from "dayjs";

interface BorrowItem {
    itemCode: string;
    itemName: string;
    quantity: number;
}

interface BorrowRequest {
    credentialId: string;
    borrowerEmail: string;
    items: BorrowItem[];
    notes?: string;
}

function parseStaffInfo(email: string): { name: string; department: string } {
    const localPart = email.split("@")[0];
    const parts = localPart.split(".");
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    if (parts.length >= 3) {
        const department = capitalize(parts[parts.length - 1]);
        const nameParts = parts.slice(0, -1).map(capitalize);
        return { name: nameParts.join(" "), department };
    } else if (parts.length === 2) {
        return { name: parts.map(capitalize).join(" "), department: "" };
    } else {
        return { name: capitalize(parts[0]), department: "" };
    }
}

// Helper to ensure valid Accurate session
async function ensureCredentialSession(credentialId: string, userId: string) {
    let credential = await prisma.accurateCredentials.findFirst({
        where: { id: credentialId, userId },
    });

    if (!credential) throw new Error("Credential not found");

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
            } catch {
                if (credential.refreshToken) {
                    const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(
                        credential.refreshToken,
                        process.env.ACCURATE_CLIENT_ID!,
                        process.env.ACCURATE_CLIENT_SECRET!
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
                    throw new Error("Session expired. Please reconnect to Accurate.");
                }
            }
        } else {
            throw new Error("Credential not fully configured.");
        }
    }

    return credential;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: BorrowRequest;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { credentialId, borrowerEmail, items, notes } = body;

    if (!credentialId || !borrowerEmail || !items?.length) {
        return NextResponse.json({ error: "credentialId, borrowerEmail, and items are required" }, { status: 400 });
    }

    try {
        const { name: borrowerName, department: borrowerDept } = parseStaffInfo(borrowerEmail);

        // Create borrowing session
        const borrowingSession = await prisma.borrowingSession.create({
            data: {
                userId: session.user.id,
                credentialId,
                borrowerEmail: borrowerEmail.toLowerCase().trim(),
                borrowerName,
                borrowerDept,
                status: "active",
                notes,
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

        // Create ADJUSTMENT_OUT in Accurate
        let adjustmentId: number | null = null;
        try {
            const credential = await ensureCredentialSession(credentialId, session.user.id);

            const description = `Peminjaman by ${borrowerName || borrowerEmail}${borrowerDept ? ` | Dept: ${borrowerDept}` : ""} | Email: ${borrowerEmail}`;

            const adjustmentData = {
                transDate: dayjs().format("YYYY-MM-DD"),
                description,
                detailItem: items.map((item) => ({
                    itemNo: item.itemCode,
                    quantity: item.quantity,
                    itemAdjustmentType: "ADJUSTMENT_OUT" as const,
                })),
            };

            console.log("[peminjaman/borrow] Creating ADJUSTMENT_OUT:", JSON.stringify(adjustmentData));

            const result = await saveInventoryAdjustment(
                {
                    apiToken: credential.apiToken,
                    signatureSecret: credential.signatureSecret,
                    host: credential.host!,
                    session: credential.session!,
                },
                adjustmentData
            );

            adjustmentId = result.id;

            // Update session with adjustment ID
            await prisma.borrowingSession.update({
                where: { id: borrowingSession.id },
                data: { adjustmentOutId: adjustmentId },
            });
        } catch (accErr: any) {
            console.error("[peminjaman/borrow] Accurate adjustment failed (session still created):", accErr.message);
            // Don't fail the whole operation — the local record is created even if Accurate fails
        }

        return NextResponse.json({
            success: true,
            sessionId: borrowingSession.id,
            adjustmentId,
            borrowerName,
            borrowerDept,
            itemCount: items.length,
        });
    } catch (error: any) {
        console.error("[peminjaman/borrow] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to create borrowing session" }, { status: 500 });
    }
}
