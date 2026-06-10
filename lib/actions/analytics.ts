'use server'

import { prisma } from "@/lib/prisma"
import { AppointmentStatus } from "@prisma/client"
import { startOfMonth, subMonths, endOfMonth, eachDayOfInterval, format, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"

export async function getAnalyticsData() {
    const today = new Date()
    const startOfCurrentMonth = startOfMonth(today)
    const startOfPreviousMonth = startOfMonth(subMonths(today, 1))
    const endOfPreviousMonth = endOfMonth(subMonths(today, 1))

    // 1. KPI: Total Revenue (Current Month vs Previous Month)
    const currentMonthRevenue = await prisma.payment.aggregate({
        _sum: {
            amount: true
        },
        where: {
            date: {
                gte: startOfCurrentMonth
            }
        }
    })

    const previousMonthRevenue = await prisma.payment.aggregate({
        _sum: {
            amount: true
        },
        where: {
            date: {
                gte: startOfPreviousMonth,
                lte: endOfPreviousMonth
            }
        }
    })

    // 2. KPI: Total Appointments (Current Month vs Previous Month)
    const currentMonthAppointments = await prisma.appointment.count({
        where: {
            date: {
                gte: startOfCurrentMonth
            }
        }
    })

    const previousMonthAppointments = await prisma.appointment.count({
        where: {
            date: {
                gte: startOfPreviousMonth,
                lte: endOfPreviousMonth
            }
        }
    })

    // 3. KPI: New Patients (Current Month vs Previous Month)
    const currentMonthPatients = await prisma.patient.count({
        where: {
            createdAt: {
                gte: startOfCurrentMonth
            }
        }
    })

    const previousMonthPatients = await prisma.patient.count({
        where: {
            createdAt: {
                gte: startOfPreviousMonth,
                lte: endOfPreviousMonth
            }
        }
    })

    // 4. Chart: Revenue History (Daily for current month)
    // We get all payments for this month and aggregate per day
    const paymentsThisMonth = await prisma.payment.findMany({
        where: {
            date: {
                gte: startOfCurrentMonth
            }
        },
        select: {
            date: true,
            amount: true
        }
    })

    const daysInMonth = eachDayOfInterval({
        start: startOfCurrentMonth,
        end: today
    })

    const revenueChartData = daysInMonth.map(day => {
        const dayStart = startOfDay(day)
        const dayEnd = endOfDay(day)

        const dailyTotal = paymentsThisMonth
            .filter(p => p.date >= dayStart && p.date <= dayEnd)
            .reduce((sum, p) => sum + Number(p.amount), 0)

        return {
            name: format(day, "d MMM", { locale: es }),
            total: dailyTotal
        }
    })

    // 5. Chart: Appointment Status Distribution
    const appointmentsByStatus = await prisma.appointment.groupBy({
        by: ['status'],
        _count: {
            id: true
        }
    })

    const statusChartData = appointmentsByStatus.map(item => ({
        name: item.status,
        value: item._count.id
    }))

    // 6. Chart: Top Services (All time or this month? Let's do All Time for now, or maybe last 3 months to be relevant. Let's do This Year)
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    const topServicesRaw = await prisma.appointment.groupBy({
        by: ['serviceId'],
        _count: {
            id: true // Count usages
        },
        where: {
            date: {
                gte: startOfYear
            }
        },
        orderBy: {
            _count: {
                id: 'desc'
            }
        },
        take: 5
    })

    // Need to fetch service names
    const serviceIds = topServicesRaw.map(item => item.serviceId)
    const services = await prisma.service.findMany({
        where: {
            id: {
                in: serviceIds
            }
        },
        select: {
            id: true,
            name: true
        }
    })

    const topServicesData = topServicesRaw.map(item => {
        const service = services.find(s => s.id === item.serviceId)
        return {
            name: service?.name || "Desconocido",
            value: item._count.id
        }
    })

    // 7. Chart: Expenses by Category (Current Month)
    const expensesByCategoryRaw = await prisma.expense.groupBy({
        by: ['category'],
        _sum: {
            amount: true
        },
        where: {
            date: {
                gte: startOfCurrentMonth
            }
        }
    })

    const expensesChartData = expensesByCategoryRaw.map(item => ({
        name: item.category.replace('_', ' '), // Simple formatting
        value: Number(item._sum.amount) || 0
    }))

    const totalExpenses = expensesChartData.reduce((acc, curr) => acc + curr.value, 0)

    return {
        revenue: {
            current: Number(currentMonthRevenue._sum.amount) || 0,
            previous: Number(previousMonthRevenue._sum.amount) || 0
        },
        expenses: {
            total: totalExpenses,
            byCategory: expensesChartData
        },
        appointments: {
            current: currentMonthAppointments,
            previous: previousMonthAppointments
        },
        patients: {
            current: currentMonthPatients,
            previous: previousMonthPatients
        },
        revenueChartData,
        statusChartData,
        topServicesData
    }
}
