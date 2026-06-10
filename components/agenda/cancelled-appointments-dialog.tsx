'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface CancelledAppointmentsDialogProps {
    appointments: any[]
}

export function CancelledAppointmentsDialog({ appointments }: CancelledAppointmentsDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Canceladas</span>
                    {appointments.length > 0 && (
                        <span className="ml-1 rounded-full bg-red-800 text-white px-2 py-0.5 text-xs">
                            {appointments.length}
                        </span>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Citas Canceladas</DialogTitle>
                    <DialogDescription>
                        Registro de citas canceladas para el día seleccionado.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative w-full overflow-auto max-h-[60vh]">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hora</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Paciente</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Servicio</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Dentista</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Notas</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {appointments.map((apt) => (
                                <tr key={apt.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">
                                        {format(new Date(apt.startTime), "HH:mm")}
                                    </td>
                                    <td className="p-4 align-middle">{apt.patient.name}</td>
                                    <td className="p-4 align-middle">{apt.service.name}</td>
                                    <td className="p-4 align-middle">{apt.dentist.name}</td>
                                    <td className="p-4 align-middle text-muted-foreground text-xs">{apt.notes || '-'}</td>
                                </tr>
                            ))}
                            {appointments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        No hay citas canceladas para este día.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </DialogContent>
        </Dialog>
    )
}
