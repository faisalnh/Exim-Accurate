import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveHost } from "@/lib/accurate/client";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credentials = await prisma.accurateCredentials.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      appKey: true,
      host: true,
      createdAt: true,
    },
  });

  return NextResponse.json(credentials);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { appKey, signatureSecret, apiToken } = body;

    if (!appKey || !signatureSecret || !apiToken) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Resolve host from API token
    let host: string;
    try {
      host = await resolveHost(apiToken);
    } catch (err: any) {
      return NextResponse.json(
        { error: `Failed to resolve host: ${err.message}` },
        { status: 400 }
      );
    }

    // Save credentials
    const credential = await prisma.accurateCredentials.create({
      data: {
        userId: session.user.id,
        appKey,
        signatureSecret,
        apiToken,
        host,
      },
    });

    return NextResponse.json({
      id: credential.id,
      appKey: credential.appKey,
      host: credential.host,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    await prisma.accurateCredentials.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete credential" },
      { status: 500 }
    );
  }
}
