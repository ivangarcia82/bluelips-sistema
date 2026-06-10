'use server'

import { prisma } from "@/lib/prisma"
import { Appointment, AppointmentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createAppointmentSchema = z.object({
    isNewPatient: z.boolean().default(true),
    patientId: z.string().optional(),
    patientName: z.string().optional(),
    patientPhone: z.string().optional(),
    dentistId: z.string().min(1, "Dentist is required"),
    serviceId: z.string().min(1, "Service is required"),
    consultoryId: z.string().min(1, "Consultory is required"),
    date: z.string(), // ISO string
    startTime: z.string(), // "HH:mm"
    duration: z.coerce.number().min(5), // minutes
    notes: z.string().optional(),
})

export async function fetchAppointments(dateInput: Date | string) {
    let date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

    // Ensure we have a valid date object
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        date = new Date()
    }

    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setHours(23, 59, 59, 999)

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                startTime: {
                    gte: start,
                    lte: end
                },
                status: {
                    not: "CANCELLED"
                }
            },
            include: {
                patient: true,
                service: true,
                dentist: true,
                consultory: true,
                payments: true
            }
        })
        return appointments
    } catch (error) {
        console.error("Error fetching appointments:", error)
        return []
    }
}

export async function fetchCancelledAppointments(dateInput: Date | string) {
    let date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

    if (!(date instanceof Date) || isNaN(date.getTime())) {
        date = new Date()
    }

    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setHours(23, 59, 59, 999)

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                startTime: {
                    gte: start,
                    lte: end
                },
                status: "CANCELLED"
            },
            include: {
                patient: true,
                service: true,
                dentist: true,
                consultory: true,
                payments: true
            },
            orderBy: {
                startTime: 'asc'
            }
        })
        return appointments
    } catch (error) {
        console.error("Error fetching cancelled appointments:", error)
        return []
    }
}

export async function updateAppointment(id: string, data: any) {
    // Destructure to remove non-model fields from 'rest'
    const {
        date,
        startTime,
        duration,
        isNewPatient,
        patientName,
        patientPhone,
        ...rest
    } = data

    let updateData: any = { ...rest }

    if (date && startTime && duration) {
        const startDateTime = new Date(`${date}T${startTime}:00`)
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000)

        // Check availability (exclude self)
        const conflicting = await prisma.appointment.findFirst({
            where: {
                id: { not: id },
                consultoryId: data.consultoryId,
                status: { not: "CANCELLED" },
                OR: [
                    {
                        startTime: { lt: endDateTime },
                        endTime: { gt: startDateTime }
                    }
                ]
            }
        })

        if (conflicting) {
            return { error: "Slot is already booked." }
        }

        updateData.date = startDateTime
        updateData.startTime = startDateTime
        updateData.endTime = endDateTime
    }

    try {
        await prisma.appointment.update({
            where: { id },
            data: updateData
        })
        revalidatePath("/dashboard/agenda")
        return { success: true }
    } catch (error) {
        console.error("Failed to update appointment:", error)
        return { error: "Failed to update appointment. Check console for details." }
    }
}

export async function cancelAppointment(id: string) {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: { payments: true }
        })

        if (!appointment) return { error: "Cita no encontrada" }

        const totalPaid = appointment.payments.reduce((sum, p) => sum + Number(p.amount), 0)

        if (totalPaid > 0) {
            return { error: "No se puede cancelar una cita con pagos registrados. Por favor elimine los pagos primero." }
        }

        await prisma.appointment.update({
            where: { id },
            data: { status: "CANCELLED" }
        })
        revalidatePath("/dashboard/agenda")
        return { success: true }
    } catch (error) {
        return { error: "Failed to cancel appointment" }
    }
}

export async function blockTimeSlot(data: {
    consultoryId: string,
    date: string,
    startTime: string,
    endTime: string, // or duration
    notes?: string
}) {
    const startDateTime = new Date(`${data.date}T${data.startTime}:00`)
    const endDateTime = new Date(`${data.date}T${data.endTime}:00`)

    // Check availability
    const conflicting = await prisma.appointment.findFirst({
        where: {
            consultoryId: data.consultoryId,
            status: { not: "CANCELLED" },
            OR: [
                {
                    startTime: { lt: endDateTime },
                    endTime: { gt: startDateTime }
                }
            ]
        }
    })

    if (conflicting) {
        return { error: "Slot is already booked." }
    }

    // We need a dummy dentist/service or make them optional in schema?
    // Schema says dentistId/serviceId/patientId are required.
    // I should create a 'SYSTEM' user/dentist/patient for blocks?
    // Or just pick the first one?
    // Better: Update schema to make them optional? NO, schema changes already done.
    // I will use a placeholder "BLOCK" entity if possible or just picking one.
    // Actually, for "Blocked", we probably want a specific "System" or "Admin" patient/dentist.

    // Let's find or create a 'BLOCK' patient/dentist.
    let blockPatient = await prisma.patient.findFirst({ where: { name: "BLOQUEO" } })
    if (!blockPatient) {
        blockPatient = await prisma.patient.create({ data: { name: "BLOQUEO", notes: "Espacio bloqueado" } })
    }

    // Just use the first dentist for now or a specific one?
    // Using first dentist might accept 'availability' check but it's bound to a dentist.
    // Consultory block should ideally block ALL dentists if it's the ROOM being blocked.
    // But the system has Consultory model.
    // So if we block the Consultory, it blocks for everyone.
    // We just need ANY dentist id to satisfy relation.
    const dentist = await prisma.dentist.findFirst()
    const service = await prisma.service.findFirst() // Maybe create a 'Blocked' service with 0 price?

    if (!dentist || !service) return { error: "Configuration missing (Dentist/Service)" }

    await prisma.appointment.create({
        data: {
            date: startDateTime,
            startTime: startDateTime,
            endTime: endDateTime,
            consultoryId: data.consultoryId,
            dentistId: dentist.id,
            serviceId: service.id,
            patientId: blockPatient.id,
            status: AppointmentStatus.BLOCKED,
            notes: data.notes
        }
    })

    revalidatePath("/dashboard/agenda")
    return { success: true }
}

export async function createAppointment(data: z.infer<typeof createAppointmentSchema>) {
    const validated = createAppointmentSchema.parse(data)

    // Construct Date objects
    // data.date is YYYY-MM-DD
    const [hours, minutes] = validated.startTime.split(':').map(Number)

    // Create base date in UTC/Local correctly
    // For simplicity in this demo, we assume the input date string is local date YYYY-MM-DD
    const startDateTime = new Date(`${validated.date}T${validated.startTime}:00`)
    const endDateTime = new Date(startDateTime.getTime() + validated.duration * 60000)

    // Check availability
    const conflicting = await prisma.appointment.findFirst({
        where: {
            consultoryId: validated.consultoryId,
            status: { not: "CANCELLED" },
            OR: [
                {
                    startTime: { lt: endDateTime },
                    endTime: { gt: startDateTime }
                }
            ]
        }
    })

    if (conflicting) {
        return { error: "Slot is already booked in this consultory." }
    }

    let patientId = validated.patientId

    if (validated.isNewPatient) {
        if (!validated.patientName) {
            return { error: "Patient name is required for new patients." }
        }
        const patient = await prisma.patient.create({
            data: {
                name: validated.patientName,
                phone: validated.patientPhone
            }
        })
        patientId = patient.id
    }

    if (!patientId) {
        // Fallback or error if neither provided (though validation should catch)
        return { error: "Patient identification failed." }
    }

    await prisma.appointment.create({
        data: {
            date: startDateTime, // Keeping the reference date
            startTime: startDateTime,
            endTime: endDateTime,
            consultoryId: validated.consultoryId,
            dentistId: validated.dentistId,
            serviceId: validated.serviceId,
            patientId: patientId,
            notes: validated.notes,
            status: "CONFIRMED"
        }
    })

    revalidatePath("/dashboard/agenda")
    return { success: true }
}

export async function getDentists() {
    return await prisma.dentist.findMany()
}

export async function getServices() {
    return await prisma.service.findMany()
}
