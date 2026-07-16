'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const consultorySchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().optional(),
})

export async function getConsultories() {
    return await prisma.consultory.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { appointments: true } }
        }
    })
}

export async function createConsultory(data: { name: string; description?: string }) {
    const parsed = consultorySchema.safeParse(data)
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    try {
        await prisma.consultory.create({ data: parsed.data })
        revalidatePath('/dashboard/consultories')
        return { success: true as const }
    } catch (error) {
        console.error("createConsultory:", error)
        return { error: 'No se pudo crear el consultorio.' }
    }
}

export async function updateConsultory(id: string, data: { name: string; description?: string }) {
    const parsed = consultorySchema.safeParse(data)
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    try {
        await prisma.consultory.update({
            where: { id },
            data: parsed.data,
        })
        revalidatePath('/dashboard/consultories')
        return { success: true as const }
    } catch (error) {
        console.error("updateConsultory:", error)
        return { error: 'No se pudo actualizar el consultorio.' }
    }
}

export async function deleteConsultory(id: string) {
    try {
        const appointmentCount = await prisma.appointment.count({
            where: { consultoryId: id }
        })

        if (appointmentCount > 0) {
            return {
                error: `No se puede eliminar: el consultorio tiene ${appointmentCount} cita(s) asociada(s).`
            }
        }

        await prisma.consultory.delete({ where: { id } })
        revalidatePath('/dashboard/consultories')
        return { success: true as const }
    } catch (error) {
        console.error("deleteConsultory:", error)
        return { error: 'No se pudo eliminar el consultorio.' }
    }
}
