'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const expenseSchema = z.object({
    amount: z.string().transform((val) => Number(val)),
    description: z.string().min(1, "Descripción requerida"),
    category: z.string().min(1, "Categoría requerida"),
    dentistId: z.string().optional().or(z.literal("")),
})

export async function createExpense(data: z.infer<typeof expenseSchema>) {
    try {
        await prisma.expense.create({
            data: {
                amount: data.amount,
                description: data.description,
                category: data.category,
                dentistId: data.dentistId === "" ? null : data.dentistId,
            }
        })
        revalidatePath("/dashboard/payments/daily")
        return { success: true }
    } catch (error) {
        console.error("Failed to create expense:", error)
        return { success: false, error: "Failed to create expense" }
    }
}

export async function deleteExpense(id: string) {
    try {
        await prisma.expense.delete({ where: { id } })
        revalidatePath("/dashboard/payments/daily")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete expense:", error)
        return { success: false, error: "Failed to delete expense" }
    }
}

export async function getDailyExpenses(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return await prisma.expense.findMany({
        where: {
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: {
            dentist: true
        },
        orderBy: {
            date: 'desc'
        }
    })
}
