
import { config } from "dotenv"
config()

async function main() {
    console.log("DEBUG: DATABASE_URL=", process.env.DATABASE_URL)
    const { prisma } = await import("../lib/prisma")
    const { getAnalyticsData } = await import("../lib/actions/analytics")

    console.log("Starting Analytics Verification...")

    // 1. Create a dummy expense for verify
    const expenseAmount = 500
    const cat = "TEST_CATEGORY_" + Date.now()

    await prisma.expense.create({
        data: {
            amount: expenseAmount,
            category: cat,
            description: "Test Expense for Analytics",
            date: new Date()
        }
    })
    console.log("1. Created Expense:", cat)

    // 2. Fetch Analytics
    const data = await getAnalyticsData()
    console.log("2. Fetched Analytics Data")

    // 3. Verify total expenses
    // Note: there might be other expenses, so we just check if our cat is there
    const categoryData = data.expenses.byCategory.find(c => c.name.includes(cat.replace('_', ' ')))

    if (!categoryData) {
        console.error("FAILED: Created category not found in analytics data.")
        console.log("Received Categories:", data.expenses.byCategory.map(c => c.name))
        process.exit(1)
    }

    if (Math.abs(categoryData.value - expenseAmount) > 0.01) {
        console.error(`FAILED: Expense amount mismatch. Expected ${expenseAmount}, got ${categoryData.value}`)
        process.exit(1)
    }

    console.log("SUCCESS: Analytics includes new expense.")

    // Cleanup
    const exp = await prisma.expense.findFirst({ where: { category: cat } })
    if (exp) await prisma.expense.delete({ where: { id: exp.id } })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        const { prisma } = await import("../lib/prisma")
        await prisma.$disconnect()
    })
