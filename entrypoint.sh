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
