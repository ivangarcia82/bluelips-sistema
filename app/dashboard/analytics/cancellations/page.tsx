'use client'

import { useState, useEffect } from "react"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { DateRange } from "react-day-picker"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCancelledAppointments } from "@/actions/analytics"
import { es } from "date-fns/locale"

export default function CancellationsPage() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    })
    const [cancellations, setCancellations] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function fetchParams() {
            if (date?.from && date?.to) {
                setLoading(true)
                try {
                    const data = await getCancelledAppointments(date.from, date.to)
                    setCancellations(data)
                } catch (error) {
                    console.error("Failed to fetch cancellations", error)
                } finally {
                    setLoading(false)
                }
            }
        }
        fetchParams()
    }, [date])

    const totalLost = cancellations.reduce((acc, curr) => acc + curr.price, 0)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Registro de Cancelaciones</h2>
                    <p className="text-muted-foreground">Historial de citas canceladas y pérdidas estimadas.</p>
                </div>
                <DatePickerWithRange date={date} setDate={setDate} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Canceladas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cancellations.length}</div>
                        <p className="text-xs text-muted-foreground">En el periodo seleccionado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pérdida Estimada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">${totalLost.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Valor total de servicios cancelados</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalle de Cancelaciones</CardTitle>
                    <CardDescription>Lista detallada de citas canceladas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hora</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Paciente</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Servicio</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Dentista</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Monto Perdido</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Motivo/Notas</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">Cargando...</td>
                                    </tr>
                                ) : cancellations.length > 0 ? (
                                    cancellations.map((apt) => (
                                        <tr key={apt.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">{format(new Date(apt.date), "dd/MM/yyyy")}</td>
                                            <td className="p-4 align-middle">{format(new Date(apt.startTime), "HH:mm")}</td>
                                            <td className="p-4 align-middle font-medium">{apt.patient.name}</td>
                                            <td className="p-4 align-middle">{apt.service.name}</td>
                                            <td className="p-4 align-middle">{apt.dentist.name}</td>
                                            <td className="p-4 align-middle text-right font-bold text-red-600">${apt.price.toFixed(2)}</td>
                                            <td className="p-4 align-middle text-muted-foreground text-xs max-w-[200px] truncate" title={apt.notes}>{apt.notes || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">No hay cancelaciones en este periodo.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
