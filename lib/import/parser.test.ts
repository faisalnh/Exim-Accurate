import { parseCSV } from './parser';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('parseCSV - standard case', async () => {
  const content = `itemCode,itemName,type,quantity,unit,adjustmentDate,reference,warehouse,description
ITM-001,Item One,ADD,10,PCS,2023-01-01,REF001,Main,Initial stock`;

  const result = await parseCSV(content);
  assert.equal(result.length, 1);
  assert.equal(result[0].itemCode, 'ITM-001');
  assert.equal(result[0].itemName, 'Item One');
  assert.equal(result[0].type, 'ADD');
  assert.equal(result[0].quantity, 10);
  assert.equal(result[0].unit, 'PCS');
  assert.equal(result[0].adjustmentDate, '2023-01-01');
  assert.equal(result[0].referenceNumber, 'REF001');
  assert.equal(result[0].warehouse, 'Main');
  assert.equal(result[0].description, 'Initial stock');
});

test('parseCSV - quoted fields', async () => {
  const content = `itemCode,type,quantity,unit,adjustmentDate
"ITM-002","REMOVE","5","PCS","2023-01-02"`;

  const result = await parseCSV(content);
  assert.equal(result.length, 1);
  assert.equal(result[0].itemCode, 'ITM-002');
  assert.equal(result[0].type, 'REMOVE');
  assert.equal(result[0].quantity, 5);
  assert.equal(result[0].unit, 'PCS');
  assert.equal(result[0].adjustmentDate, '2023-01-02');
});

test('parseCSV - flexible header matching', async () => {
  const content = `Item Code,Type,Quantity,Unit,Date
ITM-003,ADJUSTMENT,2,KG,03/01/2023`;

  const result = await parseCSV(content);
  assert.equal(result.length, 1);
  assert.equal(result[0].itemCode, 'ITM-003');
  assert.equal(result[0].type, 'ADJUSTMENT');
  assert.equal(result[0].quantity, 2);
  assert.equal(result[0].unit, 'KG');
  assert.equal(result[0].adjustmentDate, '2023-01-03'); // Normalized date
});

test('parseCSV - empty lines and whitespace', async () => {
  const content = `
itemCode,type,quantity,unit,adjustmentDate

ITM-004,ADD,1,PCS,2023-01-04

`;

  const result = await parseCSV(content);
  assert.equal(result.length, 1);
  assert.equal(result[0].itemCode, 'ITM-004');
});

test('parseCSV - missing required columns', async () => {
  const content = `itemCode,quantity,unit
ITM-005,1,PCS`;

  await assert.rejects(async () => {
    await parseCSV(content);
  }, /CSV must contain columns/);
});

test('parseCSV - skip incomplete rows', async () => {
  const content = `itemCode,type,quantity,unit,adjustmentDate
ITM-006,ADD,1,PCS,2023-01-06
INCOMPLETE_ROW,ADD,1,PCS`;

  const result = await parseCSV(content);
  assert.equal(result.length, 1);
  assert.equal(result[0].itemCode, 'ITM-006');
});
