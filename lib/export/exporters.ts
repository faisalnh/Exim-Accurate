import ExcelJS from "exceljs";

export interface ExportRecord {
  adjustmentNumber: string;
  date: string;
  itemName: string;
  itemCode: string;
  type: string;
  quantity: number;
  unit: string;
  warehouse?: string;
  description?: string;
}

/**
 * Export records to CSV format
 */
export function exportToCSV(records: ExportRecord[]): string {
  if (records.length === 0) {
    return "";
  }

  // CSV headers
  const headers = [
    "Adjustment Number",
    "Date",
    "Item Name",
    "Item Code",
    "Type",
    "Quantity",
    "Unit",
    "Warehouse",
    "Description",
  ];

  // Build CSV rows
  const rows = records.map((record) => [
    record.adjustmentNumber,
    record.date,
    record.itemName,
    record.itemCode,
    record.type,
    record.quantity.toString(),
    record.unit,
    record.warehouse || "",
    record.description || "",
  ]);

  // Escape CSV values
  const escape = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Build CSV content
  const csvContent = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Export records to XLSX format (returns Buffer)
 */
export async function exportToXLSX(records: ExportRecord[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Inventory Adjustments");

  // Define columns
  worksheet.columns = [
    { header: "Adjustment Number", key: "adjustmentNumber", width: 20 },
    { header: "Date", key: "date", width: 15 },
    { header: "Item Name", key: "itemName", width: 30 },
    { header: "Item Code", key: "itemCode", width: 20 },
    { header: "Type", key: "type", width: 15 },
    { header: "Quantity", key: "quantity", width: 12 },
    { header: "Unit", key: "unit", width: 12 },
    { header: "Warehouse", key: "warehouse", width: 20 },
    { header: "Description", key: "description", width: 30 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data rows
  records.forEach((record) => {
    worksheet.addRow({
      adjustmentNumber: record.adjustmentNumber,
      date: record.date,
      itemName: record.itemName,
      itemCode: record.itemCode,
      type: record.type,
      quantity: record.quantity,
      unit: record.unit,
      warehouse: record.warehouse || "",
      description: record.description || "",
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export records to JSON format
 */
export function exportToJSON(records: ExportRecord[]): string {
  return JSON.stringify(records, null, 2);
}
