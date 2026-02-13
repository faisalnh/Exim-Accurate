/*
  Warnings:

  - You are about to drop the column `isApproved` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isApproved",
DROP COLUMN "name",
DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "KioskSyncData" (
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

-- CreateIndex
CREATE UNIQUE INDEX "KioskSyncData_userId_year_month_key" ON "KioskSyncData"("userId", "year", "month");

-- AddForeignKey
ALTER TABLE "KioskSyncData" ADD CONSTRAINT "KioskSyncData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
