
import { exportToCSV, ExportRecord } from "../lib/export/exporters";
import assert from "node:assert";

// Legacy implementation for verification (copy-pasted from original)
function exportToCSV_Legacy(records: ExportRecord[]): string {
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

const generateRecords = (count: number): ExportRecord[] => {
  return Array.from({ length: count }, (_, i) => ({
    adjustmentNumber: `ADJ-${i}`,
    date: "2023-01-01",
    itemName: `Item ${i}`,
    itemCode: `CODE-${i}`,
    type: "Correction",
    quantity: i,
    unit: "pcs",
    warehouse: "Main",
    description: i % 2 === 0 ? "Test record" : 'Test "complex" record, with comma',
  }));
};

console.log("Generating test data...");
// Use a small count for correctness check, but enough to cover cases
const records = generateRecords(1000);

console.log("Running legacy export...");
const legacyOutput = exportToCSV_Legacy(records);

console.log("Running current export...");
const currentOutput = exportToCSV(records);

console.log("Verifying equality...");
if (currentOutput !== legacyOutput) {
    console.error("Mismatch found!");
    console.error("Length legacy:", legacyOutput.length);
    console.error("Length current:", currentOutput.length);
    // Find first diff
    for(let i=0; i<legacyOutput.length; i++) {
        if(legacyOutput[i] !== currentOutput[i]) {
            console.error(`Diff at index ${i}: '${legacyOutput[i]}' vs '${currentOutput[i]}'`);
            console.error(`Context: ...${legacyOutput.substring(i-20, i+20)}...`);
            break;
        }
    }
    process.exit(1);
}

console.log("Verification passed!");
