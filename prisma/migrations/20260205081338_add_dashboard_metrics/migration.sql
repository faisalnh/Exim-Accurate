-- AlterTable
ALTER TABLE "ExportJob" ADD COLUMN "credentialId" TEXT;
ALTER TABLE "ExportJob" ADD COLUMN "format" TEXT;
ALTER TABLE "ExportJob" ADD COLUMN "recordCount" INTEGER;

-- AlterTable
ALTER TABLE "ImportJob" ADD COLUMN "credentialId" TEXT;
ALTER TABLE "ImportJob" ADD COLUMN "format" TEXT;
ALTER TABLE "ImportJob" ADD COLUMN "fileName" TEXT;
ALTER TABLE "ImportJob" ADD COLUMN "recordCount" INTEGER;
ALTER TABLE "ImportJob" ADD COLUMN "successCount" INTEGER;
ALTER TABLE "ImportJob" ADD COLUMN "failedCount" INTEGER;

-- AddForeignKey
ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "AccurateCredentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "AccurateCredentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
