import ExcelJS from "exceljs";

export interface ImportRow {
  itemCode: string;
  type: string;
  quantity: number;
  unit: string;
  adjustmentDate: string;
  referenceNumber?: string;
}

/**
 * Parse CSV file content
 */
export async function parseCSV(content: string): Promise<ImportRow[]> {
  const lines = content.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error(
      "CSV file must have at least a header row and one data row",
    );
  }

  // Parse header
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  // Find column indices
  const itemCodeIdx = headers.findIndex(
    (h) => h.includes("itemcode") || h.includes("item code"),
  );
  const typeIdx = headers.findIndex((h) => h.includes("type"));
  const quantityIdx = headers.findIndex((h) => h.includes("quantity"));
  const unitIdx = headers.findIndex((h) => h.includes("unit"));
  const dateIdx = headers.findIndex((h) => h.includes("date"));
  const refIdx = headers.findIndex((h) => h.includes("reference"));

  if (
    itemCodeIdx === -1 ||
    typeIdx === -1 ||
    quantityIdx === -1 ||
    unitIdx === -1 ||
    dateIdx === -1
  ) {
    throw new Error(
      "CSV must contain columns: itemCode, type, quantity, unit, adjustmentDate",
    );
  }

  // Parse data rows
  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]
      .split(",")
      .map((v) => v.trim().replace(/^"|"$/g, ""));

    if (values.length < headers.length) continue; // Skip incomplete rows

    rows.push({
      itemCode: values[itemCodeIdx],
      type: values[typeIdx],
      quantity: parseFloat(values[quantityIdx]),
      unit: values[unitIdx],
      adjustmentDate: values[dateIdx],
      referenceNumber: refIdx !== -1 ? values[refIdx] : undefined,
    });
  }

  return rows;
}

/**
 * Parse XLSX file content
 */
export async function parseXLSX(buffer: ArrayBuffer): Promise<ImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("XLSX file must contain at least one worksheet");
  }

  const rows: ImportRow[] = [];
  const headers: string[] = [];

  // Read header row
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber - 1] = cell.value?.toString().toLowerCase() || "";
  });

  // Find column indices
  const itemCodeIdx = headers.findIndex(
    (h) => h.includes("itemcode") || h.includes("item code"),
  );
  const typeIdx = headers.findIndex((h) => h.includes("type"));
  const quantityIdx = headers.findIndex((h) => h.includes("quantity"));
  const unitIdx = headers.findIndex((h) => h.includes("unit"));
  const dateIdx = headers.findIndex((h) => h.includes("date"));
  const refIdx = headers.findIndex((h) => h.includes("reference"));

  if (
    itemCodeIdx === -1 ||
    typeIdx === -1 ||
    quantityIdx === -1 ||
    unitIdx === -1 ||
    dateIdx === -1
  ) {
    throw new Error(
      "XLSX must contain columns: itemCode, type, quantity, unit, adjustmentDate",
    );
  }

  // Read data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const values: any[] = [];
    row.eachCell((cell, colNumber) => {
      values[colNumber - 1] = cell.value;
    });

    if (values.length === 0) return; // Skip empty rows

    rows.push({
      itemCode: values[itemCodeIdx]?.toString() || "",
      type: values[typeIdx]?.toString() || "",
      quantity: parseFloat(values[quantityIdx]?.toString() || "0"),
      unit: values[unitIdx]?.toString() || "",
      adjustmentDate: values[dateIdx]?.toString() || "",
      referenceNumber: refIdx !== -1 ? values[refIdx]?.toString() : undefined,
    });
  });

  return rows;
}
