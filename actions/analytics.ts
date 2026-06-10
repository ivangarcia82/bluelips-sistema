'use server'

import { prisma } from "@/lib/prisma"

export async function getCancelledAppointments(startDate: Date, endDate: Date) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                status: "CANCELLED",
                startTime: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                patient: true,
                service: true,
                dentist: true
            },
            orderBy: {
                startTime: 'desc'
            }
        })

        return appointments.map(apt => ({
            ...apt,
            service: {
                ...apt.service,
                price: Number(apt.service.price)
            },
            price: Number(apt.service.price)
        }))
    } catch (error) {
        console.error("Error fetching cancelled appointments:", error)
        return []
    }
}
