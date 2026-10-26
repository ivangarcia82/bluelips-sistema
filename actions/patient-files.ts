'use server'

import { put, del } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

// Las funciones de Vercel aceptan cuerpos de hasta 4.5 MB.
const MAX_FILE_SIZE = 4 * 1024 * 1024

export async function uploadPatientFile(patientId: string, formData: FormData) {
    try {
        const session = await auth()
        if (!session) return { error: 'No autorizado' }

        const file = formData.get('file')
        if (!(file instanceof File) || file.size === 0) return { error: 'Seleccione un archivo' }
        if (file.size > MAX_FILE_SIZE) return { error: 'El archivo supera 4 MB' }

        const blob = await put(`patients/${patientId}/${file.name}`, file, {
            access: 'private',
            addRandomSuffix: true,
            contentType: file.type || undefined,
        })

        await prisma.patientFile.create({
            data: {
                patientId,
                name: file.name,
                pathname: blob.pathname,
                contentType: file.type || 'application/octet-stream',
                size: file.size,
                uploadedBy: session.user?.name ?? session.user?.email ?? null,
            }
        })

        revalidatePath(`/dashboard/patients/${patientId}`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo subir el archivo' }
    }
}

export async function deletePatientFile(id: string) {
    try {
        const session = await auth()
        if (!session) return { error: 'No autorizado' }

        const file = await prisma.patientFile.findUnique({ where: { id } })
        if (!file) return { error: 'Archivo no encontrado' }

        await del(file.pathname)
        await prisma.patientFile.delete({ where: { id } })

        revalidatePath(`/dashboard/patients/${file.patientId}`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo eliminar el archivo' }
    }
}
