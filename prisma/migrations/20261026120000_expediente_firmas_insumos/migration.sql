-- CreateEnum
CREATE TYPE "SupplyMovementType" AS ENUM ('IN', 'OUT');

-- AlterTable
ALTER TABLE "MedicalHistory" ADD COLUMN     "signature" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "signerName" TEXT;

-- CreateTable
CREATE TABLE "ReturnSheet" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procedures" TEXT NOT NULL,
    "observations" TEXT,
    "signature" TEXT,
    "signerName" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientFile" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "unit" TEXT NOT NULL DEFAULT 'pza',
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyBatch" (
    "id" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "lot" TEXT,
    "expiryDate" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyMovement" (
    "id" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "type" "SupplyMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplyMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReturnSheet_patientId_idx" ON "ReturnSheet"("patientId");

-- CreateIndex
CREATE INDEX "PatientFile_patientId_idx" ON "PatientFile"("patientId");

-- CreateIndex
CREATE INDEX "SupplyBatch_supplyId_idx" ON "SupplyBatch"("supplyId");

-- CreateIndex
CREATE INDEX "SupplyMovement_supplyId_idx" ON "SupplyMovement"("supplyId");

-- AddForeignKey
ALTER TABLE "ReturnSheet" ADD CONSTRAINT "ReturnSheet_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnSheet" ADD CONSTRAINT "ReturnSheet_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnSheet" ADD CONSTRAINT "ReturnSheet_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientFile" ADD CONSTRAINT "PatientFile_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyBatch" ADD CONSTRAINT "SupplyBatch_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyMovement" ADD CONSTRAINT "SupplyMovement_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

