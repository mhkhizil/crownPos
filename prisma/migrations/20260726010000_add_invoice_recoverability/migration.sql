-- CreateEnum
CREATE TYPE "InvoiceRecoverability" AS ENUM ('LIKELY', 'DOUBTFUL', 'HOPELESS');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "recoverability" "InvoiceRecoverability" NOT NULL DEFAULT 'LIKELY';

-- CreateIndex
CREATE INDEX "Invoice_recoverability_idx" ON "Invoice"("recoverability");
