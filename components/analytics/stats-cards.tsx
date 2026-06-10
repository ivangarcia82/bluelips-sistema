import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Calendar } from "lucide-react"

interface StatsCardsProps {
    data: {
        revenue: { current: number; previous: number }
        appointments: { current: number; previous: number }
        patients: { current: number; previous: number }
    }
}

export function StatsCards({ data }: StatsCardsProps) {
    const revenueChange = calculateChange(data.revenue.current, data.revenue.previous)
    const appointmentsChange = calculateChange(data.appointments.current, data.appointments.previous)
    const patientsChange = calculateChange(data.patients.current, data.patients.previous)

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Ingresos Totales (Mes)
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ${data.revenue.current.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {revenueChange > 0 ? "+" : ""}{revenueChange}% respecto al mes pasado
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Citas (Mes)
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {data.appointments.current}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {appointmentsChange > 0 ? "+" : ""}{appointmentsChange}% respecto al mes pasado
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Nuevos Pacientes
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {data.patients.current}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {patientsChange > 0 ? "+" : ""}{patientsChange}% respecto al mes pasado
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

function calculateChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
}
