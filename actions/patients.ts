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
        // La firma solo se escribe con signMedicalHistory. Cualquier edición
        // invalida la firma anterior: la historia debe volver a firmarse.
        const { signature, signerName, signedAt, ...history } = payload.history
        const unsigned = { ...history, signature: null, signerName: null, signedAt: null }

        await prisma.patient.update({
            where: { id: patientId },
            data: {
                ...payload.general,
                medicalHistory: {
                    upsert: {
                        create: unsigned,
                        update: unsigned
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

export async function signMedicalHistory(patientId: string, signature: string, signerName: string) {
    try {
        if (!signature.startsWith('data:image/png;base64,')) {
            return { error: 'Firma inválida' }
        }
        const history = await prisma.medicalHistory.findUnique({ where: { patientId } })
        if (!history) return { error: 'Primero guarde la historia clínica' }
        if (history.signedAt) return { error: 'La historia clínica ya está firmada' }

        await prisma.medicalHistory.update({
            where: { patientId },
            data: { signature, signerName, signedAt: new Date() }
        })

        revalidatePath(`/dashboard/patients/${patientId}`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Failed to sign medical history' }
    }
}
