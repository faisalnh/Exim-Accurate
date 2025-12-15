import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportInventoryAdjustments } from "@/lib/accurate/inventory";
import {
  exportToCSV,
  exportToXLSX,
  exportToJSON,
} from "@/lib/export/exporters";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { credentialId, startDate, endDate, format } = body;

    if (!credentialId || !startDate || !endDate || !format) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Create export job
    const exportJob = await prisma.exportJob.create({
      data: {
        userId: session.user.id,
        type: "inventory_adjustment",
        status: "running",
      },
    });

    try {
      // Export data from Accurate
      const records = await exportInventoryAdjustments(
        {
          apiToken: credential.apiToken,
          signatureSecret: credential.signatureSecret,
          host: credential.host,
        },
        startDate,
        endDate,
      );

      // Generate file based on format
      let fileContent: Buffer | string;
      let contentType: string;
      let extension: string;

      if (format === "csv") {
        fileContent = exportToCSV(records);
        contentType = "text/csv";
        extension = "csv";
      } else if (format === "xlsx") {
        fileContent = await exportToXLSX(records);
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        extension = "xlsx";
      } else if (format === "json") {
        fileContent = exportToJSON(records);
        contentType = "application/json";
        extension = "json";
      } else {
        throw new Error("Invalid format");
      }

      // Update export job
      await prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: "done",
          completedAt: new Date(),
        },
      });

      // Return file
      const filename = `inventory-adjustment-${startDate}-to-${endDate}.${extension}`;

      return new NextResponse(fileContent as BodyInit, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (err: any) {
      // Update export job on error
      await prisma.exportJob.update({
        where: { id: exportJob.id },
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
