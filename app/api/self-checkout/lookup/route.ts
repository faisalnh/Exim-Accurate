"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findItemByCode } from "@/lib/accurate/inventory";
import { refreshSession, refreshAccessToken } from "@/lib/accurate/client";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const credentialId = searchParams.get("credentialId");

    if (!code) {
        return NextResponse.json({ error: "Item code is required" }, { status: 400 });
    }

    if (!credentialId) {
        return NextResponse.json({ error: "Credential ID is required" }, { status: 400 });
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

        // Ensure we have a valid session
        if (!credential.session || !credential.host) {
            // Try to refresh session
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
                    // If session refresh fails, try token refresh first
                    if (credential.refreshToken) {
                        const appKey = credential.appKey;
                        const signatureSecret = credential.signatureSecret;
                        const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(
                            credential.refreshToken,
                            appKey,
                            signatureSecret
                        );

                        // Update token and try session again
                        credential = await prisma.accurateCredentials.update({
                            where: { id: credential.id },
                            data: {
                                apiToken: accessToken,
                                refreshToken: newRefreshToken || credential.refreshToken,
                            },
                        });

                        // Now try to get session again
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
                return NextResponse.json(
                    { error: "Credential not fully configured. Please reconnect to Accurate." },
                    { status: 400 }
                );
            }
        }

        // Search for item by code
        const item = await findItemByCode(
            {
                apiToken: credential.apiToken,
                signatureSecret: credential.signatureSecret,
                host: credential.host!,
                session: credential.session!,
            },
            code
        );

        if (!item) {
            return NextResponse.json({ error: "Item not found", code }, { status: 404 });
        }

        return NextResponse.json({
            itemCode: item.no,
            itemName: item.name,
            itemId: item.id,
        });
    } catch (error: any) {
        console.error("[self-checkout/lookup] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to lookup item" },
            { status: 500 }
        );
    }
}
