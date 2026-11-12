'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { clinicWallTimeToUtc } from "@/lib/timezone"

type ReturnSheetInput = {
    dentistId: string
    appointmentId?: string | null
    date: string // "YYYY-MM-DD" en calendario de la clínica
    procedures: string
    observations?: string | null
}

export async function createReturnSheet(patientId: string, data: ReturnSheetInput) {
    try {
        const sheet = await prisma.returnSheet.create({
            data: {
                patientId,
                dentistId: data.dentistId,
                appointmentId: data.appointmentId || null,
                date: clinicWallTimeToUtc(data.date, "12:00"),
                procedures: data.procedures,
                observations: data.observations || null,
            }
        })
        revalidatePath(`/dashboard/patients/${patientId}`)
        return { success: true, id: sheet.id }
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo crear la hoja de devolución' }
    }
}

// Se puede editar todo (incluido el doctor que atendió) solo mientras no esté firmada.
export async function updateReturnSheet(id: string, data: ReturnSheetInput) {
    try {
        const sheet = await prisma.returnSheet.findUnique({ where: { id } })
        if (!sheet) return { error: 'Hoja no encontrada' }
        if (sheet.signedAt) return { error: 'La hoja ya fue firmada y no puede modificarse' }

        await prisma.returnSheet.update({
            where: { id },
            data: {
                dentistId: data.dentistId,
                appointmentId: data.appointmentId || null,
                date: clinicWallTimeToUtc(data.date, "12:00"),
                procedures: data.procedures,
                observations: data.observations || null,
            }
        })
        revalidatePath(`/dashboard/patients/${sheet.patientId}`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo actualizar la hoja de devolución' }
    }
}

export async function signReturnSheet(id: string, signature: string, signerName: string) {
    try {
        if (!signature.startsWith('data:image/png;base64,')) {
            return { error: 'Firma inválida' }
        }
        const sheet = await prisma.returnSheet.findUnique({ where: { id } })
        if (!sheet) return { error: 'Hoja no encontrada' }
        if (sheet.signedAt) return { error: 'La hoja ya está firmada' }

        await prisma.returnSheet.update({
            where: { id },
            data: { signature, signerName, signedAt: new Date() }
        })
        revalidatePath(`/dashboard/patients/${sheet.patientId}`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo firmar la hoja de devolución' }
    }
}

export async function deleteReturnSheet(id: string) {
    try {
        const sheet = await prisma.returnSheet.findUnique({ where: { id } })
        if (!sheet) return { error: 'Hoja no encontrada' }
        if (sheet.signedAt) return { error: 'Una hoja firmada no puede eliminarse' }

        await prisma.returnSheet.delete({ where: { id } })
        revalidatePath(`/dashboard/patients/${sheet.patientId}`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo eliminar la hoja de devolución' }
    }
}
