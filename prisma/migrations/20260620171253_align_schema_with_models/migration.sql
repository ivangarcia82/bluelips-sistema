-- AlterTable
ALTER TABLE "Dentist" ADD COLUMN     "commissionPercentage" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "gender" TEXT,
ADD COLUMN     "homePhone" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "tutorPhone" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "commissionPaid" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "dentistId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalHistory" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consultationReason" TEXT,
    "allergies" BOOLEAN NOT NULL DEFAULT false,
    "heartProblems" BOOLEAN NOT NULL DEFAULT false,
    "hypertension" BOOLEAN NOT NULL DEFAULT false,
    "hypotension" BOOLEAN NOT NULL DEFAULT false,
    "venerealDiseases" BOOLEAN NOT NULL DEFAULT false,
    "rheumaticFever" BOOLEAN NOT NULL DEFAULT false,
    "hepatitis" BOOLEAN NOT NULL DEFAULT false,
    "ulcers" BOOLEAN NOT NULL DEFAULT false,
    "headache" BOOLEAN NOT NULL DEFAULT false,
    "hiv" BOOLEAN NOT NULL DEFAULT false,
    "epilepsy" BOOLEAN NOT NULL DEFAULT false,
    "arthritis" BOOLEAN NOT NULL DEFAULT false,
    "cancer" BOOLEAN NOT NULL DEFAULT false,
    "diabetes" BOOLEAN NOT NULL DEFAULT false,
    "nervousAlterations" BOOLEAN NOT NULL DEFAULT false,
    "renalAlterations" BOOLEAN NOT NULL DEFAULT false,
    "sinusitis" BOOLEAN NOT NULL DEFAULT false,
    "pregnancy" BOOLEAN NOT NULL DEFAULT false,
    "otherConditions" TEXT,
    "underMedicalTreatment" BOOLEAN NOT NULL DEFAULT false,
    "medicalTreatmentDetails" TEXT,
    "smokes" BOOLEAN NOT NULL DEFAULT false,
    "smokesWhat" TEXT,
    "smokesHowMuch" TEXT,
    "lastDentalVisit" TEXT,
    "referralSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdontogramCondition" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "toothId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ADULT',
    "condition" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdontogramCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicalHistory_patientId_key" ON "MedicalHistory"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "OdontogramCondition_patientId_toothId_type_key" ON "OdontogramCondition"("patientId", "toothId", "type");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalHistory" ADD CONSTRAINT "MedicalHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdontogramCondition" ADD CONSTRAINT "OdontogramCondition_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
