
import { exportToCSV, ExportRecord } from "../lib/export/exporters";

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
    description: "Test record",
  }));
};

const runBenchmark = (count: number) => {
  console.log(`Generating ${count} records...`);
  const records = generateRecords(count);

  console.log("Running exportToCSV...");
  const start = process.hrtime();
  try {
    const csv = exportToCSV(records);
    const end = process.hrtime(start);
    const duration = (end[0] * 1000 + end[1] / 1e6).toFixed(2);
    console.log(`Success! Length: ${csv.length}. Time: ${duration}ms`);
  } catch (error: any) {
    console.error(`Failed with ${count} records:`, error.message);
  }
};

// Start small and increase
const sizes = [1000, 10000, 100000, 200000, 500000];

for (const size of sizes) {
    runBenchmark(size);
}
