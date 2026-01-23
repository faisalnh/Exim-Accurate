import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportInventoryAdjustments } from "@/lib/accurate/inventory";
import { refreshSession, refreshAccessToken } from "@/lib/accurate/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const credentialId = searchParams.get("credentialId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!credentialId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Fetch credentials
    const credential = await prisma.accurateCredentials.findFirst({
      where: {
        id: credentialId,
        userId: session.user.id,
      },
    });

    if (!credential || !credential.host || !credential.dbId) {
      return NextResponse.json(
        { error: "Credential not found or not properly configured. Please reconnect to Accurate." },
        { status: 404 }
      );
    }

    // Get client credentials from env
    const clientId = process.env.ACCURATE_CLIENT_ID;
    const clientSecret = process.env.ACCURATE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing ACCURATE_CLIENT_ID or ACCURATE_CLIENT_SECRET environment variables");
    }

    let currentAccessToken = credential.apiToken;
    let currentRefreshToken = credential.refreshToken;

    // Refresh access token if we have a refresh token
    if (currentRefreshToken) {
      console.log("[preview] Refreshing access token...");
      try {
        const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(
          currentRefreshToken,
          clientId,
          clientSecret
        );
        currentAccessToken = accessToken;
        if (newRefreshToken) {
          currentRefreshToken = newRefreshToken;
        }

        // Update the credential with new tokens
        await prisma.accurateCredentials.update({
          where: { id: credential.id },
          data: {
            apiToken: currentAccessToken,
            refreshToken: currentRefreshToken,
          },
        });
      } catch (tokenError: any) {
        console.error("[preview] Token refresh failed:", tokenError.message);
        return NextResponse.json(
          { error: "Session expired. Please reconnect to Accurate." },
          { status: 401 }
        );
      }
    }

    // Refresh session before making API calls
    console.log("[preview] Refreshing session before API calls...");
    const { session: freshSession, host: freshHost } = await refreshSession(
      currentAccessToken,
      credential.dbId
    );

    // Update the credential with fresh session
    await prisma.accurateCredentials.update({
      where: { id: credential.id },
      data: { session: freshSession, host: freshHost },
    });

    // Export data from Accurate with fresh session (limit to 20 for preview)
    const records = await exportInventoryAdjustments(
      {
        apiToken: currentAccessToken,
        signatureSecret: credential.signatureSecret,
        host: freshHost,
        session: freshSession,
      },
      startDate,
      endDate,
      20
    );

    // Return the preview records
    return NextResponse.json({ preview: records, total: records.length });
  } catch (err: any) {
    console.error("[preview] Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
