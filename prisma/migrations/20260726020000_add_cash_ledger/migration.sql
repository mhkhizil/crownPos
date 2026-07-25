-- CreateEnum
CREATE TYPE "CashLedgerDirection" AS ENUM ('INFLOW', 'OUTFLOW');

-- CreateEnum
CREATE TYPE "CashLedgerAccount" AS ENUM ('CASH', 'BANK');

-- CreateEnum
CREATE TYPE "CashLedgerCategory" AS ENUM ('CAPITAL', 'PERSONAL_DRAW', 'HOME_PURCHASE', 'BUSINESS_EXPENSE', 'OTHER');

-- CreateTable
CREATE TABLE "CashLedgerEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "entryDate" DATE NOT NULL,
    "direction" "CashLedgerDirection" NOT NULL,
    "account" "CashLedgerAccount" NOT NULL,
    "category" "CashLedgerCategory" NOT NULL,
    "amountMmk" DECIMAL(18,2) NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CashLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashLedgerEntry_entryDate_idx" ON "CashLedgerEntry"("entryDate");

-- CreateIndex
CREATE INDEX "CashLedgerEntry_account_entryDate_idx" ON "CashLedgerEntry"("account", "entryDate");

-- CreateIndex
CREATE INDEX "CashLedgerEntry_direction_idx" ON "CashLedgerEntry"("direction");

-- CreateIndex
CREATE INDEX "CashLedgerEntry_category_idx" ON "CashLedgerEntry"("category");

-- CreateIndex
CREATE INDEX "CashLedgerEntry_companyId_idx" ON "CashLedgerEntry"("companyId");

-- CreateIndex
CREATE INDEX "CashLedgerEntry_deletedAt_idx" ON "CashLedgerEntry"("deletedAt");

-- AddForeignKey
ALTER TABLE "CashLedgerEntry" ADD CONSTRAINT "CashLedgerEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashLedgerEntry" ADD CONSTRAINT "CashLedgerEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
