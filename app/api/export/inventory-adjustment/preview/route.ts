import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportInventoryAdjustments } from "@/lib/accurate/inventory";

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

    if (!credential || !credential.host) {
      return NextResponse.json(
        { error: "Credential not found or host not resolved" },
        { status: 404 }
      );
    }

    // Export data from Accurate
    const records = await exportInventoryAdjustments(
      {
        apiToken: credential.apiToken,
        signatureSecret: credential.signatureSecret,
        host: credential.host,
      },
      startDate,
      endDate
    );

    // Return only first 20 records for preview
    const preview = records.slice(0, 20);

    return NextResponse.json({ preview, total: records.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
