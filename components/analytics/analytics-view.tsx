'use client'

import { StatsCards } from "./stats-cards"
import { RevenueChart } from "./revenue-chart"
import { StatusPieChart } from "./status-pie-chart"
import { TopServices } from "./top-services"

interface AnalyticsViewProps {
    data: {
        revenue: { current: number; previous: number }
        appointments: { current: number; previous: number }
        patients: { current: number; previous: number }
        revenueChartData: { name: string; total: number }[]
        statusChartData: { name: string; value: number }[]
        topServicesData: { name: string; value: number }[]
        expenses: {
            total: number
            byCategory: { name: string; value: number }[]
        }
    }
}

export function AnalyticsView({ data }: AnalyticsViewProps) {
    return (
        <div className="space-y-4">
            <StatsCards data={data} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <RevenueChart data={data.revenueChartData} />
                <div className="col-span-3 space-y-4">
                    <StatusPieChart data={data.statusChartData} />
                    <TopServices data={data.topServicesData} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Placeholder for Expenses Chart - I will create a component for this */}
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight">Gastos por Categoría</h3>
                        <p className="text-sm text-muted-foreground">Distribución de gastos este mes (Total: ${data.expenses?.total.toFixed(2)})</p>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="space-y-4">
                            {data.expenses?.byCategory.map((item) => (
                                <div key={item.name} className="flex items-center">
                                    <div className="w-full flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{item.name}</span>
                                            <span className="text-sm text-muted-foreground">${item.value.toFixed(2)}</span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-500"
                                                style={{ width: `${(item.value / (data.expenses?.total || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!data.expenses?.byCategory || data.expenses.byCategory.length === 0) && (
                                <p className="text-sm text-muted-foreground">No hay gastos registrados este mes.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
