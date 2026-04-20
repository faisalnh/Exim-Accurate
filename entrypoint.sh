#!/bin/sh

echo "Ensuring database schema is up to date..."

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create KioskSyncData table if it doesn't exist
  await prisma.\$executeRawUnsafe(\`
    CREATE TABLE IF NOT EXISTS \"KioskSyncData\" (
      \"id\" TEXT NOT NULL,
      \"userId\" TEXT NOT NULL,
      \"year\" INTEGER NOT NULL,
      \"month\" INTEGER NOT NULL,
      \"totalCheckouts\" INTEGER NOT NULL DEFAULT 0,
      \"uniqueUsers\" INTEGER NOT NULL DEFAULT 0,
      \"topUsers\" JSONB NOT NULL DEFAULT '[]',
      \"topItems\" JSONB NOT NULL DEFAULT '[]',
      \"dailyData\" JSONB NOT NULL DEFAULT '[]',
      \"lastSyncAt\" TIMESTAMP(3) NOT NULL,
      \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \"updatedAt\" TIMESTAMP(3) NOT NULL,
      CONSTRAINT \"KioskSyncData_pkey\" PRIMARY KEY (\"id\")
    )
  \`);

  await prisma.\$executeRawUnsafe(\`
    CREATE UNIQUE INDEX IF NOT EXISTS \"KioskSyncData_userId_year_month_key\"
    ON \"KioskSyncData\"(\"userId\", \"year\", \"month\")
  \`);

  await prisma.\$executeRawUnsafe(\`
    DO \\\$\\\$ BEGIN
      ALTER TABLE \"KioskSyncData\"
        ADD CONSTRAINT \"KioskSyncData_userId_fkey\"
        FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END \\\$\\\$
  \`);

  // Self Checkout Tables
  await prisma.\$executeRawUnsafe(\`
    CREATE TABLE IF NOT EXISTS \"CheckoutSession\" (
      \"id\" TEXT NOT NULL,
      \"staffEmail\" TEXT NOT NULL,
      \"staffName\" TEXT,
      \"staffDept\" TEXT,
      \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \"completedAt\" TIMESTAMP(3),
      \"status\" TEXT NOT NULL DEFAULT 'pending',
      \"errorMessage\" TEXT,
      \"credentialId\" TEXT NOT NULL,
      \"adjustmentId\" INTEGER,
      CONSTRAINT \"CheckoutSession_pkey\" PRIMARY KEY (\"id\")
    )
  \`);

  await prisma.\$executeRawUnsafe(\`
    CREATE TABLE IF NOT EXISTS \"CheckoutItem\" (
      \"id\" TEXT NOT NULL,
      \"sessionId\" TEXT NOT NULL,
      \"itemCode\" TEXT NOT NULL,
      \"itemName\" TEXT,
      \"quantity\" INTEGER NOT NULL DEFAULT 1,
      \"scannedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \"CheckoutItem_pkey\" PRIMARY KEY (\"id\")
    )
  \`);

  await prisma.\$executeRawUnsafe(\`
    DO \\\$\\\$ BEGIN
      ALTER TABLE \"CheckoutSession\" DROP CONSTRAINT IF EXISTS \"CheckoutSession_credentialId_fkey\";
      ALTER TABLE \"CheckoutSession\"
        ADD CONSTRAINT \"CheckoutSession_credentialId_fkey\"
        FOREIGN KEY (\"credentialId\") REFERENCES \"AccurateCredentials\"(\"id\")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END \\\$\\\$
  \`);

  await prisma.\$executeRawUnsafe(\`
    DO \\\$\\\$ BEGIN
      ALTER TABLE \"CheckoutItem\"
        ADD CONSTRAINT \"CheckoutItem_sessionId_fkey\"
        FOREIGN KEY (\"sessionId\") REFERENCES \"CheckoutSession\"(\"id\")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END \\\$\\\$
  \`);

  // Peminjaman (Borrowing) Tables
  await prisma.\$executeRawUnsafe(\`
    CREATE TABLE IF NOT EXISTS \"BorrowableItem\" (
      \"id\" TEXT NOT NULL,
      \"userId\" TEXT NOT NULL,
      \"itemCode\" TEXT NOT NULL,
      \"itemName\" TEXT NOT NULL,
      \"totalStock\" INTEGER NOT NULL,
      \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \"updatedAt\" TIMESTAMP(3) NOT NULL,
      CONSTRAINT \"BorrowableItem_pkey\" PRIMARY KEY (\"id\")
    )
  \`);

  await prisma.\$executeRawUnsafe(\`
    WITH ranked_items AS (
      SELECT
        \"id\",
        ROW_NUMBER() OVER (
          PARTITION BY \"userId\", \"itemCode\"
          ORDER BY
            \"totalStock\" DESC,
            \"updatedAt\" DESC,
            \"createdAt\" DESC,
            \"id\" ASC
        ) AS row_num
      FROM \"BorrowableItem\"
    )
    DELETE FROM \"BorrowableItem\"
    WHERE \"id\" IN (
      SELECT \"id\"
      FROM ranked_items
      WHERE row_num > 1
    )
  \`);

  await prisma.\$executeRawUnsafe(\`
    DROP INDEX IF EXISTS \"BorrowableItem_credentialId_itemCode_key\"
  \`);

  await prisma.\$executeRawUnsafe(\`
    ALTER TABLE \"BorrowableItem\" DROP CONSTRAINT IF EXISTS \"BorrowableItem_credentialId_fkey\"
  \`);

  await prisma.\$executeRawUnsafe(\`
    ALTER TABLE \"BorrowableItem\" DROP COLUMN IF EXISTS \"credentialId\"
  \`);

  await prisma.\$executeRawUnsafe(\`
    CREATE TABLE IF NOT EXISTS \"BorrowingSession\" (
      \"id\" TEXT NOT NULL,
      \"userId\" TEXT NOT NULL,
      \"credentialId\" TEXT NOT NULL,
      \"borrowerEmail\" TEXT NOT NULL,
      \"borrowerName\" TEXT,
      \"borrowerDept\" TEXT,
      \"type\" TEXT NOT NULL DEFAULT 'borrow',
      \"status\" TEXT NOT NULL DEFAULT 'active',
      \"startsAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \"dueAt\" TIMESTAMP(3),
      \"borrowedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \"returnedAt\" TIMESTAMP(3),
      \"notes\" TEXT,
      \"adjustmentOutId\" INTEGER,
      \"adjustmentInId\" INTEGER,
      CONSTRAINT \"BorrowingSession_pkey\" PRIMARY KEY (\"id\")
    )
  \`);

  await prisma.\$executeRawUnsafe(\`
    CREATE TABLE IF NOT EXISTS \"BorrowingItem\" (
      \"id\" TEXT NOT NULL,
      \"sessionId\" TEXT NOT NULL,
      \"itemCode\" TEXT NOT NULL,
      \"itemName\" TEXT NOT NULL,
      \"quantity\" INTEGER NOT NULL DEFAULT 1,
      \"returnedQty\" INTEGER NOT NULL DEFAULT 0,
      \"returnedAt\" TIMESTAMP(3),
      CONSTRAINT \"BorrowingItem_pkey\" PRIMARY KEY (\"id\")
    )
  \`);

  await prisma.\$executeRawUnsafe(\`
    CREATE TABLE IF NOT EXISTS \"BorrowingActivity\" (
      \"id\" TEXT NOT NULL,
      \"userId\" TEXT NOT NULL,
      \"credentialId\" TEXT NOT NULL,
      \"sessionId\" TEXT,
      \"itemCode\" TEXT NOT NULL,
      \"itemName\" TEXT NOT NULL,
      \"borrowerEmail\" TEXT NOT NULL,
      \"borrowerName\" TEXT,
      \"borrowerDept\" TEXT,
      \"activityType\" TEXT NOT NULL,
      \"quantity\" INTEGER NOT NULL DEFAULT 1,
      \"occurredAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \"scheduleStart\" TIMESTAMP(3),
      \"scheduleEnd\" TIMESTAMP(3),
      \"details\" TEXT,
      CONSTRAINT \"BorrowingActivity_pkey\" PRIMARY KEY (\"id\")
    )
  \`);

  await prisma.\$executeRawUnsafe(\`
    ALTER TABLE \"BorrowingSession\"
      ADD COLUMN IF NOT EXISTS \"type\" TEXT NOT NULL DEFAULT 'borrow'
  \`);

  await prisma.\$executeRawUnsafe(\`
    ALTER TABLE \"BorrowingSession\"
      ADD COLUMN IF NOT EXISTS \"startsAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  \`);

  await prisma.\$executeRawUnsafe(\`
    ALTER TABLE \"BorrowingSession\"
      ADD COLUMN IF NOT EXISTS \"dueAt\" TIMESTAMP(3)
  \`);

  await prisma.\$executeRawUnsafe(\`
    CREATE INDEX IF NOT EXISTS \"BorrowingActivity_credentialId_occurredAt_idx\"
    ON \"BorrowingActivity\"(\"credentialId\", \"occurredAt\")
  \`);

  await prisma.\$executeRawUnsafe(\`
    CREATE INDEX IF NOT EXISTS \"BorrowingActivity_credentialId_itemCode_occurredAt_idx\"
    ON \"BorrowingActivity\"(\"credentialId\", \"itemCode\", \"occurredAt\")
  \`);

  // Foreign Keys for Borrowing
  await prisma.\$executeRawUnsafe(\`
    DO \\\$\\\$ BEGIN
      ALTER TABLE \"BorrowableItem\"
        ADD CONSTRAINT \"BorrowableItem_userId_fkey\"
        FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END \\\$\\\$
  \`);

  await prisma.\$executeRawUnsafe(\`
    CREATE UNIQUE INDEX IF NOT EXISTS \"BorrowableItem_userId_itemCode_key\"
    ON \"BorrowableItem\"(\"userId\", \"itemCode\")
  \`);

  await prisma.\$executeRawUnsafe(\`
    DO \\\$\\\$ BEGIN
      ALTER TABLE \"BorrowingSession\"
        ADD CONSTRAINT \"BorrowingSession_userId_fkey\"
        FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END \\\$\\\$
  \`);

  await prisma.\$executeRawUnsafe(\`
    DO \\\$\\\$ BEGIN
      ALTER TABLE \"BorrowingSession\" DROP CONSTRAINT IF EXISTS \"BorrowingSession_credentialId_fkey\";
      ALTER TABLE \"BorrowingSession\"
        ADD CONSTRAINT \"BorrowingSession_credentialId_fkey\"
        FOREIGN KEY (\"credentialId\") REFERENCES \"AccurateCredentials\"(\"id\")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END \\\$\\\$
  \`);

  await prisma.\$executeRawUnsafe(\`
    DO \\\$\\\$ BEGIN
      ALTER TABLE \"BorrowingItem\"
        ADD CONSTRAINT \"BorrowingItem_sessionId_fkey\"
        FOREIGN KEY (\"sessionId\") REFERENCES \"BorrowingSession\"(\"id\")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END \\\$\\\$
  \`);

  await prisma.\$executeRawUnsafe(\`
    DO \\\$\\\$ BEGIN
      ALTER TABLE \"BorrowingActivity\"
        ADD CONSTRAINT \"BorrowingActivity_userId_fkey\"
        FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END \\\$\\\$
  \`);

  await prisma.\$executeRawUnsafe(\`
    DO \\\$\\\$ BEGIN
      ALTER TABLE \"BorrowingActivity\" DROP CONSTRAINT IF EXISTS \"BorrowingActivity_credentialId_fkey\";
      ALTER TABLE \"BorrowingActivity\"
        ADD CONSTRAINT \"BorrowingActivity_credentialId_fkey\"
        FOREIGN KEY (\"credentialId\") REFERENCES \"AccurateCredentials\"(\"id\")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END \\\$\\\$
  \`);

  await prisma.\$executeRawUnsafe(\`
    DO \\\$\\\$ BEGIN
      ALTER TABLE \"BorrowingActivity\" DROP CONSTRAINT IF EXISTS \"BorrowingActivity_sessionId_fkey\";
      ALTER TABLE \"BorrowingActivity\"
        ADD CONSTRAINT \"BorrowingActivity_sessionId_fkey\"
        FOREIGN KEY (\"sessionId\") REFERENCES \"BorrowingSession\"(\"id\")
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END \\\$\\\$
  \`);

  console.log('✅ Database schema ready');
  await prisma.\$disconnect();
}

main().catch(e => {
  console.error('DB setup error:', e.message);
  process.exit(1);
});
"

echo "Starting application..."
exec "$@"
