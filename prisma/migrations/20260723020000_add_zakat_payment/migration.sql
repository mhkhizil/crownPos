-- CreateEnum
CREATE TYPE "ZakatNisabStyle" AS ENUM ('GOLD', 'SILVER');

-- CreateEnum
CREATE TYPE "ZakatPeriodType" AS ENUM ('MONTH', 'YEAR', 'CUSTOM');

-- CreateTable
CREATE TABLE "ZakatPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "periodType" "ZakatPeriodType" NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "amountPaidMmk" DECIMAL(18,2) NOT NULL,
    "paidAt" DATE NOT NULL,
    "nisabStyle" "ZakatNisabStyle",
    "calculatedDueMmk" DECIMAL(18,2),
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ZakatPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ZakatPayment_periodStart_periodEnd_idx" ON "ZakatPayment"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "ZakatPayment_year_month_idx" ON "ZakatPayment"("year", "month");

-- CreateIndex
CREATE INDEX "ZakatPayment_paidAt_idx" ON "ZakatPayment"("paidAt");

-- CreateIndex
CREATE INDEX "ZakatPayment_companyId_idx" ON "ZakatPayment"("companyId");

-- CreateIndex
CREATE INDEX "ZakatPayment_deletedAt_idx" ON "ZakatPayment"("deletedAt");

-- AddForeignKey
ALTER TABLE "ZakatPayment" ADD CONSTRAINT "ZakatPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZakatPayment" ADD CONSTRAINT "ZakatPayment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
