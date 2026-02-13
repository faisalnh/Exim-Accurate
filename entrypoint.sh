#!/bin/sh

echo "Syncing database schema..."
npx prisma db push --skip-generate 2>&1 || true

# Fallback: create KioskSyncData table directly if it doesn't exist
echo "Ensuring KioskSyncData table exists..."
npx prisma db execute --stdin <<'SQL'
CREATE TABLE IF NOT EXISTS "KioskSyncData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalCheckouts" INTEGER NOT NULL DEFAULT 0,
    "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
    "topUsers" JSONB NOT NULL DEFAULT '[]',
    "topItems" JSONB NOT NULL DEFAULT '[]',
    "dailyData" JSONB NOT NULL DEFAULT '[]',
    "lastSyncAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KioskSyncData_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "KioskSyncData_userId_year_month_key" ON "KioskSyncData"("userId", "year", "month");
DO $$ BEGIN
    ALTER TABLE "KioskSyncData" ADD CONSTRAINT "KioskSyncData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
SQL

if [ $? -eq 0 ]; then
    echo "✅ Database ready"
else
    echo "⚠️  SQL fallback had issues, continuing anyway..."
fi

echo "Starting application..."
exec "$@"
