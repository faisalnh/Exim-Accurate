import ExcelJS from "exceljs";

export interface ImportRow {
  itemCode: string;
  itemName?: string;
  type: string;
  quantity: number;
  unit: string;
  adjustmentDate: string;
  referenceNumber?: string;
  warehouse?: string;
  description?: string;
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
  const itemNameIdx = headers.findIndex(
    (h) => h.includes("itemname") || h.includes("item name"),
  );
  const typeIdx = headers.findIndex((h) => h.includes("type"));
  const quantityIdx = headers.findIndex((h) => h.includes("quantity"));
  const unitIdx = headers.findIndex((h) => h.includes("unit"));
  const dateIdx = headers.findIndex((h) => h.includes("date"));
  const refIdx = headers.findIndex(
    (h) =>
      h.includes("reference") ||
      h.includes("adjustment number") ||
      h.includes("adjustment no"),
  );
  const warehouseIdx = headers.findIndex((h) => h.includes("warehouse"));
  const descriptionIdx = headers.findIndex((h) => h.includes("description"));

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

  const normalizeDate = (dateStr: string) => {
    // If already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // If DD/MM/YYYY
    const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, "0");
      const month = dmyMatch[2].padStart(2, "0");
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }

    return dateStr; // Return as is, validator will catch it
  };

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]
      .split(",")
      .map((v) => v.trim().replace(/^"|"$/g, ""));

    if (values.length < headers.length) continue; // Skip incomplete rows

    rows.push({
      itemCode: values[itemCodeIdx],
      itemName: itemNameIdx !== -1 ? values[itemNameIdx] : undefined,
      type: values[typeIdx],
      quantity: parseFloat(values[quantityIdx]),
      unit: values[unitIdx],
      adjustmentDate: normalizeDate(values[dateIdx]),
      referenceNumber: refIdx !== -1 ? values[refIdx] : undefined,
      warehouse: warehouseIdx !== -1 ? values[warehouseIdx] : undefined,
      description: descriptionIdx !== -1 ? values[descriptionIdx] : undefined,
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
  const itemNameIdx = headers.findIndex(
    (h) => h.includes("itemname") || h.includes("item name"),
  );
  const typeIdx = headers.findIndex((h) => h.includes("type"));
  const quantityIdx = headers.findIndex((h) => h.includes("quantity"));
  const unitIdx = headers.findIndex((h) => h.includes("unit"));
  const dateIdx = headers.findIndex((h) => h.includes("date"));
  const refIdx = headers.findIndex(
    (h) =>
      h.includes("reference") ||
      h.includes("adjustment number") ||
      h.includes("adjustment no"),
  );
  const warehouseIdx = headers.findIndex((h) => h.includes("warehouse"));
  const descriptionIdx = headers.findIndex((h) => h.includes("description"));

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
  const normalizeDate = (dateStr: string) => {
    // If already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // If DD/MM/YYYY
    const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, "0");
      const month = dmyMatch[2].padStart(2, "0");
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }

    return dateStr;
  };

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const values: any[] = [];
    row.eachCell((cell, colNumber) => {
      values[colNumber - 1] = cell.value;
    });

    if (values.length === 0) return; // Skip empty rows

    let adjustmentDate = values[dateIdx]?.toString() || "";
    if (values[dateIdx] instanceof Date) {
      const d = values[dateIdx] as Date;
      adjustmentDate = d.toISOString().split("T")[0];
    } else {
      adjustmentDate = normalizeDate(adjustmentDate);
    }

    rows.push({
      itemCode: values[itemCodeIdx]?.toString() || "",
      itemName: itemNameIdx !== -1 ? values[itemNameIdx]?.toString() : undefined,
      type: values[typeIdx]?.toString() || "",
      quantity: parseFloat(values[quantityIdx]?.toString() || "0"),
      unit: values[unitIdx]?.toString() || "",
      adjustmentDate,
      referenceNumber: refIdx !== -1 ? values[refIdx]?.toString() : undefined,
      warehouse: warehouseIdx !== -1 ? values[warehouseIdx]?.toString() : undefined,
      description: descriptionIdx !== -1 ? values[descriptionIdx]?.toString() : undefined,
    });
  });

  return rows;
}
