'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface StatusPieChartProps {
    data: {
        name: string
        value: number
    }[]
}

const COLORS = {
    COMPLETED: '#22c55e', // green-500
    PENDING: '#eab308',   // yellow-500
    CONFIRMED: '#3b82f6', // blue-500
    CANCELLED: '#ef4444', // red-500
}

const STATUS_LABELS: Record<string, string> = {
    COMPLETED: 'Completada',
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    CANCELLED: 'Cancelada',
}

export function StatusPieChart({ data }: StatusPieChartProps) {
    const chartData = data.map(item => ({
        ...item,
        fill: COLORS[item.name as keyof typeof COLORS] || '#94a3b8' // slate-400 fallback
    }))

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Estado de Citas</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [value, "Citas"]} />
                            <Legend
                                formatter={(value) => STATUS_LABELS[value as string] || value}
                                verticalAlign="bottom"
                                height={36}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
