-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'BLOCKED';

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "tutorName" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "commission" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "invoiceRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "invoiceSent" BOOLEAN NOT NULL DEFAULT false;
