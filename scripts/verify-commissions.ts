
import { config } from "dotenv"
config() // Load .env

// Dynamic imports to ensure dotenv loads first
async function main() {
    console.log("DEBUG: DATABASE_URL=", process.env.DATABASE_URL)
    const { prisma } = await import("../lib/prisma")
    const { createPayment, payCommissions, getPendingCommissions } = await import("../actions/payments")
    const { createDentist } = await import("../actions/dentists")

    console.log("Starting Commission Verification...")

    // 1. Create a Dentist with Commission
    console.log("1. Creating Dentist...")
    const dentistName = `Test Dentist ${Date.now()}`
    const dentist = await prisma.dentist.create({
        data: {
            name: dentistName,
            specialty: "General",
            color: "#ff0000",
            commissionPercentage: 10 // 10% Commission
        }
    })
    console.log(`   Dentist Created: ${dentist.name} (ID: ${dentist.id})`)

    // 2. Create a Patient (needed for payment)
    const patient = await prisma.patient.create({
        data: {
            name: `Test Patient ${Date.now()}`,
            phone: "5555555555"
        }
    })
    console.log(`   Patient Created: ${patient.name}`)

    // 3. Create a Payment (Should trigger commission)
    console.log("2. Creating Payment...")
    const amount = 1000
    const expectedCommission = 100
    await createPayment({
        amount: amount,
        type: "FULL_PAYMENT",
        method: "CASH",
        patientId: patient.id,
        dentistId: dentist.id,
        notes: "Test Payment for Commission"
    })
    console.log("   Payment Created.")

    // 4. Verify Pending Commission
    console.log("3. Verifying Pending Commission...")
    const pending = await getPendingCommissions()
    const dentistPending = pending.find(p => p.dentistId === dentist.id)

    if (!dentistPending) {
        console.error("   FAILED: No pending commission found for dentist.")
        process.exit(1)
    }

    if (Math.abs(dentistPending.totalPending - expectedCommission) > 0.01) {
        console.error(`   FAILED: Expected commission ${expectedCommission}, got ${dentistPending.totalPending}`)
        process.exit(1)
    }
    console.log(`   SUCCESS: Found pending commission of $${dentistPending.totalPending}`)

    // 5. Pay Commission
    console.log("4. Paying Commission...")
    try {
        const payResult = await payCommissions(dentist.id, dentistPending.totalPending)
        if (payResult.error) {
            console.error(`   FAILED: ${payResult.error}`)
            // process.exit(1) // Don't exit here if it's just revalidate error
        }
    } catch (e: any) {
        if (e.message.includes("Invariant: static generation store missing")) {
            console.log("   (Ignored expected revalidatePath error in script)")
        } else {
            console.error(e)
            process.exit(1)
        }
    }
    console.log("   Commission Paid (DB updated).")

    // 6. Verify Payment is Cleared
    console.log("5. Verifying Clearance...")
    const pendingAfter = await getPendingCommissions()
    const dentistPendingAfter = pendingAfter.find(p => p.dentistId === dentist.id)

    if (dentistPendingAfter) {
        console.error("   FAILED: Commission still pending after payment.")
        process.exit(1)
    }
    console.log("   SUCCESS: No pending commissions found.")

    // 7. Verify Expense Created
    const expense = await prisma.expense.findFirst({
        where: {
            dentistId: dentist.id,
            category: "PAGO_DENTISTA"
        },
        orderBy: { createdAt: 'desc' }
    })

    if (!expense) {
        console.error("   FAILED: No expense record found.")
        process.exit(1)
    }
    if (Math.abs(Number(expense.amount) - expectedCommission) > 0.01) {
        console.error(`   FAILED: Expense amount mismatch. Expected ${expectedCommission}, got ${expense.amount}`)
        process.exit(1)
    }
    console.log(`   SUCCESS: Expense found for $${expense.amount}`)

    // 8. Verify Display Filtering (Zero Pending)
    console.log("6. Verifying Display Filtering...")
    const pendingFinal = await getPendingCommissions() // No date filter = get all pending
    const dentistPendingFinal = pendingFinal.find(p => p.dentistId === dentist.id)

    // totalPending should be 0 because we paid it
    if (dentistPendingFinal && dentistPendingFinal.totalPending > 0.01) {
        console.error(`   FAILED: Dentist still has pending balance ${dentistPendingFinal.totalPending}`)
        process.exit(1)
    }

    // If logic is correct, getPendingCommissions might still return the dentist but with 0 balance
    // The UI handles filtering.
    // We confirm here that totalPending IS zero.
    if (dentistPendingFinal && Math.abs(dentistPendingFinal.totalPending) < 0.01) {
        console.log("   SUCCESS: Dentist has 0 pending balance (will be hidden in UI).")
    } else if (!dentistPendingFinal) {
        // If they are not returned at all by getPendingCommissions, that's also fine (means they have no unpaid payments)
        console.log("   SUCCESS: Dentist not returned in pending list (Hidden in UI).")
    }

    console.log("Verification Complete: ALL TESTS PASSED")

    // Cleanup
    await prisma.expense.delete({ where: { id: expense.id } })
    await prisma.payment.deleteMany({ where: { patientId: patient.id } })
    await prisma.patient.delete({ where: { id: patient.id } })
    await prisma.dentist.delete({ where: { id: dentist.id } })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
