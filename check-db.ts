
import { prisma } from "./lib/prisma"

async function main() {
    const consultories = await prisma.consultory.findMany()
    console.log("Consultories:", consultories)

    const recentPayment = await prisma.payment.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { appointment: true, patient: true }
    })
    console.log("Last Payment:", JSON.stringify(recentPayment, null, 2))
}

main()
