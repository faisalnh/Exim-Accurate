import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(
      new URL("/login?callbackUrl=/dashboard/credentials", req.url)
    );
  }

  const clientId = process.env.ACCURATE_CLIENT_ID;
  const redirectUri = process.env.ACCURATE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Accurate OAuth is not configured" },
      { status: 500 }
    );
  }

  // Scopes for inventory adjustment operations
  const scopes = [
    "item_adjustment_view",
    "item_adjustment_save",
    "item_adjustment_delete",
    "item_view",
    "warehouse_view",
    "unit_view",
  ].join(" ");

  const authorizeUrl = new URL("https://account.accurate.id/oauth/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", scopes);

  const state = req.nextUrl.searchParams.get("state");
  if (state) {
    authorizeUrl.searchParams.set("state", state);
  }

  return NextResponse.redirect(authorizeUrl.toString());
}
