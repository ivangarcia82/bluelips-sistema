'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

export async function getServices() {
    return await prisma.service.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function createService(data: { name: string; description?: string; price: number; duration: number }) {
    try {
        await prisma.service.create({
            data: {
                ...data,
                price: new Prisma.Decimal(data.price)
            }
        })
        revalidatePath('/dashboard/services')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to create service' }
    }
}

export async function updateService(id: string, data: { name: string; description?: string; price: number; duration: number }) {
    try {
        await prisma.service.update({
            where: { id },
            data: {
                ...data,
                price: new Prisma.Decimal(data.price)
            }
        })
        revalidatePath('/dashboard/services')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to update service' }
    }
}

export async function deleteService(id: string) {
    try {
        await prisma.service.delete({
            where: { id }
        })
        revalidatePath('/dashboard/services')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to delete service' }
    }
}
