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
      ALTER TABLE \"CheckoutSession\"
        ADD CONSTRAINT \"CheckoutSession_credentialId_fkey\"
        FOREIGN KEY (\"credentialId\") REFERENCES \"AccurateCredentials\"(\"id\")
        ON DELETE RESTRICT ON UPDATE CASCADE;
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
      \"credentialId\" TEXT NOT NULL,
      \"itemCode\" TEXT NOT NULL,
      \"itemName\" TEXT NOT NULL,
      \"totalStock\" INTEGER NOT NULL,
      \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \"updatedAt\" TIMESTAMP(3) NOT NULL,
      CONSTRAINT \"BorrowableItem_pkey\" PRIMARY KEY (\"id\")
    )
  \`);

  await prisma.\$executeRawUnsafe(\`
    CREATE UNIQUE INDEX IF NOT EXISTS \"BorrowableItem_credentialId_itemCode_key\"
    ON \"BorrowableItem\"(\"credentialId\", \"itemCode\")
  \`);

  await prisma.\$executeRawUnsafe(\`
    CREATE TABLE IF NOT EXISTS \"BorrowingSession\" (
      \"id\" TEXT NOT NULL,
      \"userId\" TEXT NOT NULL,
      \"credentialId\" TEXT NOT NULL,
      \"borrowerEmail\" TEXT NOT NULL,
      \"borrowerName\" TEXT,
      \"borrowerDept\" TEXT,
      \"status\" TEXT NOT NULL DEFAULT 'active',
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
    DO \\\$\\\$ BEGIN
      ALTER TABLE \"BorrowableItem\"
        ADD CONSTRAINT \"BorrowableItem_credentialId_fkey\"
        FOREIGN KEY (\"credentialId\") REFERENCES \"AccurateCredentials\"(\"id\")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END \\\$\\\$
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
      ALTER TABLE \"BorrowingSession\"
        ADD CONSTRAINT \"BorrowingSession_credentialId_fkey\"
        FOREIGN KEY (\"credentialId\") REFERENCES \"AccurateCredentials\"(\"id\")
        ON DELETE RESTRICT ON UPDATE CASCADE;
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
