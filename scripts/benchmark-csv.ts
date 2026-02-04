import { parseCSV } from '../lib/import/parser';
import { performance } from 'perf_hooks';

function generateCSV(rows: number): string {
  const header = "itemCode,itemName,type,quantity,unit,adjustmentDate,reference,warehouse,description";
  const lines = [header];
  for (let i = 0; i < rows; i++) {
    lines.push(`ITM-${i},Item ${i},ADJUSTMENT_IN,${Math.floor(Math.random() * 100)},PCS,2023-01-01,REF-${i},Main Warehouse,Description for item ${i}`);
  }
  return lines.join('\n');
}

async function runBenchmark() {
  const rowCount = 200000;
  console.log(`Generating CSV with ${rowCount} rows...`);
  const content = generateCSV(rowCount);
  const sizeMB = content.length / 1024 / 1024;
  console.log(`CSV size: ${sizeMB.toFixed(2)} MB`);

  // Warmup
  await parseCSV(generateCSV(100));

  if (global.gc) {
    global.gc();
  }

  const startMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  const result = await parseCSV(content);

  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  console.log(`Parsed ${result.length} rows`);
  console.log(`Time: ${(endTime - startTime).toFixed(2)} ms`);
  console.log(`Memory usage (approx): ${((endMemory - startMemory) / 1024 / 1024).toFixed(2)} MB`);
}

runBenchmark().catch(console.error);
