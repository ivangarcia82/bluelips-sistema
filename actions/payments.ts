'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { PaymentType, PaymentMethod } from "@prisma/client"

export async function createPayment(data: {
    amount: number
    type: PaymentType
    method: PaymentMethod
    patientId?: string
    isPublic?: boolean
    appointmentId?: string
    dentistId?: string
    serviceId?: string
    notes?: string
    commission?: number
    invoiceRequested?: boolean
}) {
    try {
        let finalPatientId = data.patientId

        // Handle "Publico en General"
        if (data.isPublic || !finalPatientId) {
            let publicPatient = await prisma.patient.findFirst({
                where: { name: "Publico en General" }
            })

            if (!publicPatient) {
                publicPatient = await prisma.patient.create({
                    data: {
                        name: "Publico en General",
                        phone: "0000000000",
                        notes: "Cliente predeterminado"
                    }
                })
            }
            finalPatientId = publicPatient.id
        }

        if (!finalPatientId) {
            return { error: 'Patient is required' }
        }

        let finalAppointmentId = data.appointmentId

        // If a service is selected but no appointment exists (Manual Charge),
        // we create a "Completed" appointment to track the DEBT (Service Price).
        if (data.serviceId && !finalAppointmentId) {
            // ... (existing logic for manual charge, unchanged)
            // We need a consultory and dentist to create an appointment
            let consultory = await prisma.consultory.findFirst()

            // AUTOMATIC FIX: Create default consultory if missing
            if (!consultory) {
                consultory = await prisma.consultory.create({
                    data: {
                        name: "Consultorio General",
                        description: "Generado automáticamente para cobros manuales"
                    }
                })
            }

            let finalDentistId = data.dentistId
            if (!finalDentistId) {
                let firstDentist = await prisma.dentist.findFirst()
                // AUTOMATIC FIX: Create default dentist if missing
                if (!firstDentist) {
                    const user = await prisma.user.create({
                        data: {
                            email: `dentist-${Date.now()}@system.local`,
                            name: "Dentista General",
                            role: 'DENTIST'
                        }
                    })
                    firstDentist = await prisma.dentist.create({
                        data: {
                            name: "Dentista General",
                            userId: user.id
                        }
                    })
                }
                finalDentistId = firstDentist.id
            }

            if (consultory && finalDentistId) {
                const newAppt = await prisma.appointment.create({
                    data: {
                        patientId: finalPatientId,
                        dentistId: finalDentistId,
                        consultoryId: consultory.id,
                        serviceId: data.serviceId,
                        date: new Date(),
                        startTime: new Date(),
                        endTime: new Date(new Date().getTime() + 30 * 60000), // Default 30 min duration
                        status: 'COMPLETED',
                        notes: data.notes || "Cobro Manual"
                    }
                })
                finalAppointmentId = newAppt.id
            }
        }

        // VALIDATION: Check for overpayment (and handle treatment changes)
        // If the treatment changed at charge time, we reassign the appointment's
        // service so the balance reflects what was actually performed. We only
        // persist that reassignment once the payment passes validation.
        let reassignServiceId: string | null = null
        if (finalAppointmentId) {
            const appointment = await prisma.appointment.findUnique({
                where: { id: finalAppointmentId },
                include: { service: true, payments: true }
            })

            if (appointment) {
                // Effective service = the one selected in the charge, if different
                // from the appointment's current one (i.e. the treatment changed).
                let effectiveService = appointment.service
                if (data.serviceId && data.serviceId !== appointment.serviceId) {
                    const newService = await prisma.service.findUnique({
                        where: { id: data.serviceId }
                    })
                    if (newService) {
                        effectiveService = newService
                        reassignServiceId = newService.id
                    }
                }

                if (effectiveService) {
                    const totalCost = Number(effectiveService.price)
                    const totalPaid = appointment.payments.reduce((sum, p) => sum + Number(p.amount), 0)
                    const remaining = totalCost - totalPaid

                    // Allow 0.1 tolerance for floating point
                    if (data.amount > remaining + 0.1) {
                        return { error: `El pago excede el saldo restante de $${remaining.toFixed(2)}` }
                    }
                }
            }
        }

        // Calculate Commission
        let commissionAmount = 0
        let targetDentistId = data.dentistId

        if (!targetDentistId && finalAppointmentId) {
            const appt = await prisma.appointment.findUnique({
                where: { id: finalAppointmentId },
                select: { dentistId: true }
            })
            if (appt) targetDentistId = appt.dentistId
        }

        if (targetDentistId) {
            const dentist = await prisma.dentist.findUnique({
                where: { id: targetDentistId },
                select: { commissionPercentage: true }
            })
            if (dentist && dentist.commissionPercentage > 0) {
                commissionAmount = (data.amount * dentist.commissionPercentage) / 100
            }
        }

        // Treatment changed: update the appointment to the new service so the
        // recorded treatment, cost and future balances all match the charge.
        if (reassignServiceId && finalAppointmentId) {
            await prisma.appointment.update({
                where: { id: finalAppointmentId },
                data: { serviceId: reassignServiceId }
            })
        }

        await prisma.payment.create({
            data: {
                amount: new Prisma.Decimal(data.amount),
                type: data.type,
                method: data.method,
                patientId: finalPatientId,
                appointmentId: finalAppointmentId,
                dentistId: targetDentistId,
                serviceId: data.serviceId,
                notes: data.notes,
                commission: new Prisma.Decimal(commissionAmount),
                commissionPaid: false,
                invoiceRequested: data.invoiceRequested || false,
                invoiceSent: false
            }
        })
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/agenda')
        revalidatePath('/dashboard/payments')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Error al registrar el pago' }
    }
}

export async function getDailyBalance(date: Date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const payments = await prisma.payment.findMany({
        where: {
            createdAt: { gte: start, lte: end }
        }
    })

    const byMethod = payments.reduce((acc, curr) => {
        const method = curr.method
        if (!acc[method]) acc[method] = 0
        acc[method] += Number(curr.amount)
        return acc
    }, {} as Record<string, number>)

    const total = payments.reduce((acc, curr) => acc + Number(curr.amount), 0)

    return { total, byMethod }
}

export async function getPendingInvoices() {
    return await prisma.payment.findMany({
        where: {
            invoiceRequested: true,
            invoiceSent: false
        },
        include: {
            patient: true,
            service: true,
            dentist: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    })
}

export async function getRecentPayments() {
    return await prisma.payment.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
            patient: true,
            dentist: true,
            service: true
        }
    })
}

export async function getPatientPayments(patientId: string) {
    return await prisma.payment.findMany({
        where: { patientId },
        orderBy: { date: 'desc' },
        include: {
            appointment: {
                include: {
                    service: true
                }
            }
        }
    })
}

export async function getPatientBalance(patientId: string) {
    const appointments = await prisma.appointment.findMany({
        where: { patientId, status: { not: 'CANCELLED' } },
        include: { service: true }
    })

    const payments = await prisma.payment.findMany({
        where: { patientId }
    })

    const totalCost = appointments.reduce((acc, curr) => acc + Number(curr.service.price), 0)
    const totalPaid = payments.reduce((acc, curr) => acc + Number(curr.amount), 0)

    return {
        totalCost,
        totalPaid,
        balance: totalCost - totalPaid
    }
}

export async function getDebtors() {
    const appointments = await prisma.appointment.findMany({
        where: {
            status: { not: 'CANCELLED' }
        },
        include: {
            patient: true,
            service: true,
            dentist: true,
            payments: true
        }
    })

    const debts = appointments.map(appt => {
        const totalCost = appt.service ? Number(appt.service.price) : 0
        const totalPaid = appt.payments.reduce((acc, curr) => acc + Number(curr.amount), 0)
        const balance = totalCost - totalPaid
        const hasDeposit = appt.payments.some(p => p.type === 'DEPOSIT')

        return {
            appointmentId: appt.id,
            patient: appt.patient,
            service: appt.service,
            dentist: appt.dentist,
            date: appt.date,
            totalCost,
            totalPaid,
            balance,
            hasDeposit
        }
    })
        .filter(debt => debt.balance > 0.1 && debt.hasDeposit) // Tolerance for floating point
        .sort((a, b) => b.balance - a.balance)

    return debts
}

export async function markInvoiceAsSent(paymentId: string) {
    try {
        await prisma.payment.update({
            where: { id: paymentId },
            data: { invoiceSent: true }
        })
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error("Error updating invoice status:", error)
        return { error: 'Error al actualizar el estado de la factura' }
    }
}


export async function cancelPayment(id: string) {
    try {
        await prisma.payment.delete({ where: { id } })
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/payments/daily')
        return { success: true }
    } catch (error) {
        console.error("Failed to cancel payment:", error)
        return { error: 'Error al cancelar el pago' }
    }
}

export async function payCommissions(dentistId: string, amount: number) {
    try {
        // 1. Create Expense
        await prisma.expense.create({
            data: {
                amount: new Prisma.Decimal(amount),
                description: "Pago de Comisiones",
                category: "PAGO_DENTISTA",
                dentistId: dentistId,
                date: new Date()
            }
        })

        // 2. Mark payments as commissionPaid
        await prisma.payment.updateMany({
            where: {
                dentistId: dentistId,
                commissionPaid: false,
                commission: { gt: 0 }
            },
            data: {
                commissionPaid: true
            }
        })


        revalidatePath('/dashboard/payments/daily')
        return { success: true }
    } catch (error) {
        console.error("Failed to pay commissions:", error)
        return { error: 'Error al registrar el pago de comisiones' }
    }
}

export async function getPendingCommissions(date?: Date) {
    let dateFilter = {}
    if (date) {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        dateFilter = {
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    }

    const dentists = await prisma.dentist.findMany({
        where: {
            payments: {
                some: {
                    // If date provided, filtering dentists active that day (with commissions)
                    // Or filtering dentists with ANY pending commission?
                    // User said: "todos los que hayan tenido algún servicio en el día"
                    // So we filter dentists who have PAYMENTS (activity) on this date relative to commissions.
                    // But we likely want to see ALL pending for them, or just today's?
                    // "cuanto debo de darle..." -> usually total.
                    // But "mis dentistas... que hayan tenido algún servicio en el día".
                    // So we find Dentists active TODAY.
                    ...(date ? dateFilter : {
                        commissionPaid: false,
                        commission: { gt: 0 }
                    })
                }
            }
        },
        include: {
            payments: {
                where: {
                    commissionPaid: false,
                    commission: { gt: 0 }
                }
            }
        }
    })

    // Filter dentists strictly if they have no activity today (if date is set)?
    // The query above `where` clause does this if we put `dateFilter` inside `payments.some`.
    // However, we want to know their TOTAL pending, but only list those active today.
    // So the `findMany` `where` filters the Dentists.
    // The `include.payments` fetches ALL pending payments for them (so we can pay full debt).

    // Wait, if I filter `payments.some(dateFilter)`, I get dentists active today.
    // Then `include.payments` gets all their pending stuff.

    // Let's verify the `some` clause usage.
    // If I use `commissionPaid: false` in `some`, I get dentists with debts.
    // If I add `date` to `some`, I get dentists with activity TODAY.
    // I should probably combine them if the user implies "active today AND has commission".

    // Re-reading user: "appear everyone who had a service in the day".
    // Does "service" mean "commissionable payment"? Yes likely.

    // Implementing: Filter Dentists by Activity Today. Include ALL pending debt.

    return dentists.map(dentist => {
        const allPending = dentist.payments
        // Calculate strictly today's generated commission for display if needed
        const todaysPending = date
            ? allPending.filter(p => {
                const pDate = new Date(p.date)
                const start = new Date(date); start.setHours(0, 0, 0, 0)
                const end = new Date(date); end.setHours(23, 59, 59, 999)
                return pDate >= start && pDate <= end
            })
            : allPending

        return {
            dentistId: dentist.id,
            dentistName: dentist.name,
            totalPending: allPending.reduce((acc, curr) => acc + Number(curr.commission), 0),
            todaysCommission: todaysPending.reduce((acc, curr) => acc + Number(curr.commission), 0),
            paymentCount: allPending.length
        }
    })
}
