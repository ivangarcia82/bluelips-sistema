'use client'

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Combobox } from "@/components/ui/combobox"
import { PatientCombobox } from "@/components/patients/patient-combobox"
import { createAppointment, updateAppointment } from "@/actions/agenda"
import { Dentist, Service, Consultory, Patient, Appointment } from "@prisma/client"

const formSchema = z.object({
    isNewPatient: z.boolean().default(true),
    patientId: z.string().optional(),
    patientName: z.string().optional(),
    patientPhone: z.string().optional(),
    dentistId: z.string().min(1, "Dentist is required"),
    serviceId: z.string().min(1, "Service is required"),
    consultoryId: z.string().min(1, "Consultory is required"),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    duration: z.coerce.number().min(5),
}).refine((data) => {
    if (data.isNewPatient) {
        return !!data.patientName && data.patientName.length > 0;
    } else {
        return !!data.patientId && data.patientId.length > 0;
    }
}, {
    message: "Patient information is incomplete",
    path: ["patientName"],
});

interface AppointmentDialogProps {
    children?: React.ReactNode
    dentists: Dentist[]
    services: Service[]
    consultories: Consultory[]
    patients: Patient[]
    defaultDate?: Date
    defaultConsultoryId?: string
    defaultTime?: string
    defaultDuration?: number
    onOpenChange?: (open: boolean) => void
    open?: boolean
    appointment?: Appointment & { patient: Patient, service: Service } // Simplified type for now
}

export function AppointmentDialog({
    children,
    dentists,
    services,
    consultories,
    patients,
    defaultDate = new Date(),
    defaultConsultoryId,
    defaultTime,
    defaultDuration = 30, // Default to 30 if not provided
    onOpenChange,
    open: controlledOpen,
    appointment
}: AppointmentDialogProps) {
    if (!services) services = [];
    const [internalOpen, setInternalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            isNewPatient: !appointment,
            patientId: appointment?.patientId || "",
            patientName: "",
            patientPhone: "",
            dentistId: appointment?.dentistId || "",
            serviceId: appointment?.serviceId || "",
            consultoryId: appointment?.consultoryId || defaultConsultoryId || "",
            startTime: appointment ? format(new Date(appointment.startTime), "HH:mm") : (defaultTime || "09:00"),
            duration: appointment ? Math.round((new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) / 60000) : defaultDuration,
        },
    })

    // Reset when opening or when appointment changes
    useEffect(() => {
        if (open) {
            if (appointment) {
                form.reset({
                    isNewPatient: false,
                    patientId: appointment.patientId,
                    patientName: "", // Existing patient
                    patientPhone: "",
                    dentistId: appointment.dentistId,
                    serviceId: appointment.serviceId,
                    consultoryId: appointment.consultoryId,
                    startTime: format(new Date(appointment.startTime), "HH:mm"),
                    duration: Math.round((new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) / 60000),
                })
                // Find service category
                const s = services.find(ser => ser.id === appointment.serviceId)
                if (s) setSelectedCategory((s as any).category || 'General')
            } else {
                form.reset({
                    isNewPatient: true,
                    patientId: "",
                    patientName: "",
                    patientPhone: "",
                    dentistId: "",
                    serviceId: "",
                    consultoryId: defaultConsultoryId || "",
                    startTime: defaultTime || "09:00",
                    duration: defaultDuration,
                })
                setSelectedCategory("")
            }
        }
    }, [open, defaultConsultoryId, defaultTime, defaultDuration, form, appointment, services])

    async function onSubmit(values: any) {
        try {
            let result;
            if (appointment) {
                result = await updateAppointment(appointment.id, {
                    ...values,
                    date: format(new Date(appointment.date), "yyyy-MM-dd"), // Keep original date or allow moving?
                    // Ideally we should allow moving date too, but dialog prompt says "Agendar cita para el {defaultDate}".
                    // For now let's assume date is fixed or derived from defaultDate if new.
                    // Actually, if we edit, we might want to change date too?
                    // The current dialog title says "Agendar cita para el {defaultDate}".
                    // So we assume editing on the SAME day for now, or user cancels and rebooks.
                    // But wait, updateAppointment logic takes `date` field.
                    // If we pass `defaultDate` it will facilitate moving across time in the same day.
                })
            } else {
                result = await createAppointment({
                    ...values,
                    date: format(defaultDate, "yyyy-MM-dd"),
                })
            }

            if (result?.error) {
                alert(result.error)
                return
            }

            setOpen(false)
            if (!appointment) form.reset() // Only reset if new, keep values if just edited (or maybe reset too)
            form.reset()
        } catch (error) {
            console.error(error)
            alert("Algo salió mal")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Nueva Cita</DialogTitle>
                    <DialogDescription>
                        Agendar cita para el {format(defaultDate, "PPPP")}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-6">

                        <Tabs
                            value={form.watch("isNewPatient") ? "new" : "existing"}
                            className="w-full"
                            onValueChange={(val) => {
                                form.setValue("isNewPatient", val === "new")
                            }}
                        >
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="new">Nuevo Paciente</TabsTrigger>
                                <TabsTrigger value="existing">Paciente Existente</TabsTrigger>
                            </TabsList>
                            <TabsContent value="new" className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="patientName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Paciente</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Juan Pérez" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="patientPhone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teléfono (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="555-0123" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                            <TabsContent value="existing" className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="patientId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Seleccionar Paciente</FormLabel>
                                            <FormControl>
                                                <PatientCombobox
                                                    patients={patients ?? []}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Buscar paciente por nombre o teléfono..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                        </Tabs>

                        <div className="grid grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="dentistId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dentista</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={dentists.map((d) => ({ value: d.id, label: d.name }))}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Seleccionar dentista"
                                                searchPlaceholder="Buscar dentista..."
                                                emptyText="Sin dentistas."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="consultoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Consultorio</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={consultories.map((c) => ({ value: c.id, label: c.name }))}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Seleccionar consultorio"
                                                searchPlaceholder="Buscar consultorio..."
                                                emptyText="Sin consultorios."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="serviceId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Servicio</FormLabel>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Categoría</Label>
                                            <Combobox
                                                options={Array.from(new Set(services.map(s => (s as any).category || 'General'))).sort().map(cat => ({ value: cat as string, label: cat as string }))}
                                                value={selectedCategory}
                                                onChange={(val) => {
                                                    setSelectedCategory(val);
                                                    form.setValue("serviceId", ""); // Reset service when category changes
                                                }}
                                                placeholder="Seleccionar categoría"
                                                searchPlaceholder="Buscar categoría..."
                                                emptyText="Sin categorías."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Variante</Label>
                                            <Combobox
                                                options={services
                                                    .filter(s => ((s as any).category || 'General') === selectedCategory)
                                                    .map((s) => ({ value: s.id, label: s.name }))}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Seleccionar variante"
                                                searchPlaceholder="Buscar variante..."
                                                emptyText="Sin variantes."
                                                disabled={!selectedCategory}
                                            />
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hora</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duración (min)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cita
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
