import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveHost } from "@/lib/accurate/client";

function redirectWithStatus(req: NextRequest, search: string) {
  return NextResponse.redirect(
    new URL(`/dashboard/credentials?${search}`, req.url)
  );
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(
      new URL("/login?callbackUrl=/dashboard/credentials", req.url)
    );
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return redirectWithStatus(
      req,
      `status=error&message=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return redirectWithStatus(
      req,
      "status=error&message=Missing%20authorization%20code"
    );
  }

  const clientId = process.env.ACCURATE_CLIENT_ID;
  const clientSecret = process.env.ACCURATE_CLIENT_SECRET;
  const redirectUri = process.env.ACCURATE_REDIRECT_URI;
  const appKey = process.env.ACCURATE_APP_KEY;
  const signatureSecret = process.env.ACCURATE_SIGNATURE_SECRET;

  if (!clientId || !clientSecret || !redirectUri || !appKey || !signatureSecret) {
    return redirectWithStatus(
      req,
      "status=error&message=Accurate%20OAuth%20env%20vars%20missing"
    );
  }

  try {
    // Use Basic Auth for client credentials as per OAuth 2.0 spec
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenResponse = await fetch(
      "https://account.accurate.id/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      throw new Error(text || "Failed to exchange code for token");
    }

    const tokenJson = await tokenResponse.json();
    console.log("[OAuth callback] Token response:", JSON.stringify(tokenJson, null, 2));

    const apiToken =
      tokenJson.access_token || tokenJson.api_token || tokenJson.token;
    const refreshToken = tokenJson.refresh_token;

    if (!apiToken) {
      throw new Error("API token not found in token response");
    }

    const { host, session: accurateSession, dbId } = await resolveHost(apiToken);

    await prisma.accurateCredentials.create({
      data: {
        userId: session.user.id,
        appKey,
        signatureSecret,
        apiToken,
        refreshToken,
        host,
        session: accurateSession,
        dbId,
      },
    });

    return redirectWithStatus(req, "status=connected");
  } catch (err: any) {
    const message = err?.message || "Unexpected OAuth error";
    return redirectWithStatus(
      req,
      `status=error&message=${encodeURIComponent(message)}`
    );
  }
}
