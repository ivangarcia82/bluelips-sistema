'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getPatients() {
    return await prisma.patient.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function createPatient(data: { name: string; email?: string; phone?: string; birthDate?: string; address?: string; tutorName?: string; tutorPhone?: string }) {
    try {
        await prisma.patient.create({
            data: {
                ...data,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined
            }
        })
        revalidatePath('/dashboard/patients')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to create patient' }
    }
}

export async function updatePatient(id: string, data: { name: string; email?: string; phone?: string; birthDate?: string; address?: string; tutorName?: string; tutorPhone?: string }) {
    try {
        await prisma.patient.update({
            where: { id },
            data: {
                ...data,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined
            }
        })
        revalidatePath('/dashboard/patients')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to update patient' }
    }
}

export async function deletePatient(id: string) {
    try {
        await prisma.patient.delete({
            where: { id }
        })
        revalidatePath('/dashboard/patients')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to delete patient' }
    }
}

export async function saveMedicalHistory(patientId: string, payload: { general: any, history: any }) {
    try {
        const { general, history } = payload
        
        await prisma.patient.update({
            where: { id: patientId },
            data: {
                ...general,
                medicalHistory: {
                    upsert: {
                        create: history,
                        update: history
                    }
                }
            }
        })

        revalidatePath(`/dashboard/patients/${patientId}`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to save medical history' }
    }
}
