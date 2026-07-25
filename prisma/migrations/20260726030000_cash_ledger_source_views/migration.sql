-- AlterEnum
ALTER TYPE "CashLedgerCategory" ADD VALUE 'BUSINESS_COLLECTION';
ALTER TYPE "CashLedgerCategory" ADD VALUE 'BUSINESS_SUPPLIER_PAYMENT';

-- CreateEnum
CREATE TYPE "CashLedgerSource" AS ENUM ('MANUAL', 'BUSINESS');

-- AlterTable
ALTER TABLE "CashLedgerEntry" ADD COLUMN "source" "CashLedgerSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "CashLedgerEntry" ADD COLUMN "sourceRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CashLedgerEntry_sourceRef_key" ON "CashLedgerEntry"("sourceRef");
CREATE INDEX "CashLedgerEntry_source_idx" ON "CashLedgerEntry"("source");
