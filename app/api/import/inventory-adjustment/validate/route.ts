import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV, parseXLSX } from "@/lib/import/parser";
import { validateImportRows } from "@/lib/import/validator";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const credentialId = formData.get("credentialId") as string;

    if (!file || !credentialId) {
      return NextResponse.json(
        { error: "File and credential ID are required" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // Parse file based on extension
    const fileName = file.name.toLowerCase();
    let rows;

    if (fileName.endsWith(".csv")) {
      const content = await file.text();
      rows = await parseCSV(content);
    } else if (fileName.endsWith(".xlsx")) {
      const buffer = await file.arrayBuffer();
      rows = await parseXLSX(buffer);
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please use CSV or XLSX" },
        { status: 400 },
      );
    }

    // Validate rows
    const validationResult = await validateImportRows(rows, {
      apiToken: credential.apiToken,
      signatureSecret: credential.signatureSecret,
      host: credential.host,
    });

    // Format results for frontend
    const formattedResults = validationResult.results.map((result) => ({
      itemCode: result.row.itemCode,
      itemName: result.itemName,
      type: result.row.type,
      quantity: result.row.quantity,
      unit: result.row.unit,
      adjustmentDate: result.row.adjustmentDate,
      valid: result.valid,
      errors: result.errors,
    }));

    return NextResponse.json({
      valid: validationResult.valid,
      results: formattedResults,
      errors: validationResult.errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
