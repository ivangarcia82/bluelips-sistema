import { DatePicker } from "@/components/date-picker"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AgendaGrid } from "@/components/agenda/agenda-grid"
import { prisma } from "@/lib/prisma"
import { fetchAppointments } from "@/actions/agenda"
import { AppointmentDialog } from "@/components/agenda/appointment-dialog"
import { BlockDialog } from "@/components/agenda/block-dialog"

export default async function AgendaPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>
}) {
    const params = await searchParams
    const date = params.date ? new Date(params.date) : new Date()

    const [consultories, dentists, servicesRaw, appointments, patients] = await Promise.all([
        prisma.consultory.findMany({ orderBy: { name: 'asc' } }),
        prisma.dentist.findMany(),
        prisma.service.findMany(),
        fetchAppointments(date.toISOString()),
        prisma.patient.findMany({ orderBy: { name: 'asc' } })
    ])

    const services = servicesRaw.map((s: any) => ({
        ...s,
        price: s.price.toNumber()
    }))

    const appointmentsSanitized = appointments.map((apt: any) => ({
        ...apt,
        service: {
            ...apt.service,
            price: Number(apt.service.price)
        },
        payments: (apt.payments || []).map((p: any) => ({
            ...p,
            amount: Number(p.amount),
            commission: p.commission ? Number(p.commission) : 0
        }))
    }))

    return (
        <div className="flex flex-col gap-4 h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Agenda</h2>
                <div className="flex items-center gap-2">
                    <DatePicker />
                    <AppointmentDialog
                        dentists={dentists}
                        services={services}
                        consultories={consultories}
                        patients={patients}
                        defaultDate={date}
                    >
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Cita
                        </Button>
                    </AppointmentDialog>
                    <BlockDialog consultories={consultories} defaultDate={date}>
                        <Button variant="outline">Bloquear</Button>
                    </BlockDialog>
                </div>
            </div>

            <div className="flex-1 overflow-hidden border rounded-lg bg-white dark:bg-slate-950 shadow-sm">
                <AgendaGrid
                    consultories={consultories}
                    date={date}
                    appointments={appointmentsSanitized}
                    dentists={dentists}
                    services={services}
                    patients={patients}
                />
            </div>
        </div>
    )
}
