'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getOdontogramConditions(patientId: string) {
    try {
        return await prisma.odontogramCondition.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' }
        })
    } catch (error) {
        console.error(error)
        return []
    }
}

export async function saveOdontogramCondition(params: {
    patientId: string;
    toothId: number;
    type: string;
    condition: string;
    notes?: string;
}) {
    try {
        await prisma.odontogramCondition.upsert({
            where: {
                patientId_toothId_type: {
                    patientId: params.patientId,
                    toothId: params.toothId,
                    type: params.type,
                }
            },
            create: {
                patientId: params.patientId,
                toothId: params.toothId,
                type: params.type,
                condition: params.condition,
                notes: params.notes || null
            },
            update: {
                condition: params.condition,
                notes: params.notes || null,
                updatedAt: new Date(),
            }
        })
        
        revalidatePath(`/dashboard/patients/${params.patientId}`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to save odontogram condition' }
    }
}

export async function clearOdontogramCondition(params: {
    patientId: string;
    toothId: number;
    type: string;
}) {
    try {
        await prisma.odontogramCondition.delete({
            where: {
                patientId_toothId_type: {
                    patientId: params.patientId,
                    toothId: params.toothId,
                    type: params.type,
                }
            }
        })
        
        revalidatePath(`/dashboard/patients/${params.patientId}`)
        return { success: true }
    } catch (error) {
        // If it doesn't exist, it's fine, we are just clearing it anyway.
        return { success: true }
    }
}
