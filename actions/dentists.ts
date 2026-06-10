'use server'

import { prisma } from "@/lib/prisma"
import { Dentist } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function getDentists() {
    return await prisma.dentist.findMany({
        orderBy: { name: 'asc' }
    })
}


export async function createDentist(data: { name: string; specialty: string; email?: string; phone?: string; color: string; commissionPercentage: number }) {
    try {
        await prisma.dentist.create({
            data
        })
        revalidatePath('/dashboard/dentists')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to create dentist' }
    }
}

export async function updateDentist(id: string, data: { name: string; specialty: string; email?: string; phone?: string; color: string; commissionPercentage: number }) {
    try {
        await prisma.dentist.update({
            where: { id },
            data
        })
        revalidatePath('/dashboard/dentists')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to update dentist' }
    }
}

export async function deleteDentist(id: string) {
    try {
        await prisma.dentist.delete({
            where: { id }
        })
        revalidatePath('/dashboard/dentists')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to delete dentist' }
    }
}
