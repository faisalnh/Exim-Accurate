import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV, parseXLSX } from "@/lib/import/parser";
import { validateImportRows } from "@/lib/import/validator";
import { saveInventoryAdjustment } from "@/lib/accurate/inventory";

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

    // Validate rows first
    const validationResult = await validateImportRows(rows, {
      apiToken: credential.apiToken,
      signatureSecret: credential.signatureSecret,
      host: credential.host,
    });

    if (!validationResult.valid) {
      return NextResponse.json(
        { error: "Validation failed", errors: validationResult.errors },
        { status: 400 },
      );
    }

    // Create import job
    const importJob = await prisma.importJob.create({
      data: {
        userId: session.user.id,
        type: "inventory_adjustment",
        status: "running",
      },
    });

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      // Group rows by date and reference number
      const groupedRows = new Map<string, typeof rows>();

      for (const row of rows) {
        const key = `${row.adjustmentDate}_${row.referenceNumber || "default"}`;
        if (!groupedRows.has(key)) {
          groupedRows.set(key, []);
        }
        groupedRows.get(key)!.push(row);
      }

      // Import each group as a separate adjustment
      for (const [key, groupRows] of groupedRows.entries()) {
        try {
          // Find item IDs for all rows in this group
          const detailItems = [];

          for (const row of groupRows) {
            const validatedRow = validationResult.results.find(
              (r) => r.row.itemCode === row.itemCode,
            );

            if (!validatedRow?.itemId) {
              throw new Error(`Item ID not found for ${row.itemCode}`);
            }

            detailItems.push({
              itemId: validatedRow.itemId,
              quantity: row.quantity,
              type: row.type,
            });
          }

          // Save to Accurate
          await saveInventoryAdjustment(
            {
              apiToken: credential.apiToken,
              signatureSecret: credential.signatureSecret,
              host: credential.host,
            },
            {
              transDate: groupRows[0].adjustmentDate,
              number: groupRows[0].referenceNumber,
              detailItem: detailItems,
            },
          );

          successCount++;
        } catch (err: any) {
          failedCount++;
          errors.push(`Failed to import group ${key}: ${err.message}`);
        }
      }

      // Update import job
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          status: failedCount === 0 ? "done" : "error",
          completedAt: new Date(),
          errorMessage: errors.length > 0 ? errors.join("; ") : null,
        },
      });

      return NextResponse.json({
        success: true,
        successCount,
        failedCount,
        errors,
      });
    } catch (err: any) {
      // Update import job on error
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          status: "error",
          errorMessage: err.message,
          completedAt: new Date(),
        },
      });
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
