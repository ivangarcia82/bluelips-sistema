'use client'

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Switch } from "@/components/ui/switch"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createPayment } from "@/actions/payments"
import { PaymentType, PaymentMethod, Patient, Dentist, Service } from "@prisma/client"

const formSchema = z.object({
    amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
    type: z.nativeEnum(PaymentType),
    method: z.nativeEnum(PaymentMethod),
    notes: z.string().optional(),
    isPublic: z.boolean().default(false),
    patientId: z.string().optional(),
    dentistId: z.string().optional(),
    serviceId: z.string().optional(),
    invoiceRequested: z.boolean().default(false),
    commission: z.coerce.number().optional().default(0),
})

interface PaymentDialogProps {
    children?: React.ReactNode
    patientId?: string
    patients?: Patient[]
    dentists?: Dentist[]
    services?: (Omit<Service, "price"> & { price: number | any })[]
    appointmentId?: string
    defaultAmount?: number
    defaultServiceId?: string
    defaultDentistId?: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function PaymentDialog({
    children,
    patientId,
    patients = [],
    dentists = [],
    services = [],
    appointmentId,
    defaultAmount,
    defaultServiceId,
    defaultDentistId,
    open: controlledOpen,
    onOpenChange
}: PaymentDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: 0,
            type: PaymentType.FULL_PAYMENT,
            method: PaymentMethod.CASH,
            notes: "",
            isPublic: false,
            patientId: patientId || "",
            dentistId: "",
            serviceId: "",
        },
    })

    const method = form.watch("method")

    // Auto-calculate commission if Card is selected (example 3.5%) - Optional feature
    useEffect(() => {
        if (method === PaymentMethod.CARD) {
            // const amount = form.getValues("amount")
            // form.setValue("commission", amount * 0.035) 
        } else {
            form.setValue("commission", 0)
        }
    }, [method, form])
    const serviceId = form.watch("serviceId")
    useEffect(() => {
        if (serviceId && !defaultAmount) {
            const service = services.find(s => s.id === serviceId)
            if (service) {
                form.setValue("amount", Number(service.price))
            }
        }
    }, [serviceId, services, form, defaultAmount])

    // Reset when opening
    useEffect(() => {
        if (open) {
            const defaultService = services.find(s => s.id === defaultServiceId)
            if (defaultService) {
                setSelectedCategory((defaultService as any).category || 'General')
            }

            form.reset({
                amount: defaultAmount || 0,
                type: PaymentType.FULL_PAYMENT,
                method: PaymentMethod.CASH,
                notes: "",
                isPublic: !patientId,
                patientId: patientId || "",
                dentistId: defaultDentistId || "",
                serviceId: defaultServiceId || "",
            })
        }
    }, [open, patientId, form, defaultAmount, defaultServiceId, defaultDentistId])

    async function onSubmit(values: any) {
        try {
            const result = await createPayment({
                ...values,
                appointmentId
            })

            if (result.error) {
                alert(result.error)
                return
            }

            setOpen(false)
            form.reset()
        } catch (error) {
            console.error(error)
            alert("Algo salió mal")
        }
    }

    const isPublic = form.watch("isPublic")

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Registrar Cobro</DialogTitle>
                    <DialogDescription>
                        Registra un nuevo pago o abono.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-6">

                        {/* Patient Selection Logic */}
                        {!patientId && (
                            <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                                <FormField
                                    control={form.control}
                                    name="isPublic"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white dark:bg-slate-950">
                                            <div className="space-y-0.5">
                                                <FormLabel>Público en General</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {!isPublic && (
                                    <FormField
                                        control={form.control}
                                        name="patientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Seleccionar Paciente</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Buscar paciente..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {patients.map((p) => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="dentistId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dentista (Opcional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {dentists.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="serviceId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Servicio (Opcional)</FormLabel>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Categoría</Label>
                                            <Select
                                                onValueChange={(val) => {
                                                    setSelectedCategory(val);
                                                    form.setValue("serviceId", "");
                                                }}
                                                value={selectedCategory}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from(new Set(services.map(s => (s as any).category || 'General'))).sort().map(cat => (
                                                        <SelectItem key={cat as string} value={cat as string}>
                                                            {cat as string}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Variante</Label>
                                            <Select
                                                onValueChange={(val) => {
                                                    field.onChange(val);
                                                    const service = services.find(s => s.id === val);
                                                    if (service) {
                                                        form.setValue("amount", Number(service.price));
                                                    }
                                                }}
                                                value={field.value}
                                                disabled={!selectedCategory}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {services
                                                        .filter(s => ((s as any).category || 'General') === selectedCategory)
                                                        .map((s) => (
                                                            <SelectItem key={s.id} value={s.id}>
                                                                {s.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Pago</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={PaymentType.DEPOSIT}>Abono / Anticipo</SelectItem>
                                                <SelectItem value={PaymentType.FULL_PAYMENT}>Pago Completo</SelectItem>
                                                <SelectItem value={PaymentType.BALANCE_SETTLEMENT}>Liquidación</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="method"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Método</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={PaymentMethod.CASH}>Efectivo</SelectItem>
                                                <SelectItem value={PaymentMethod.CARD}>Tarjeta</SelectItem>
                                                <SelectItem value={PaymentMethod.TRANSFER}>Transferencia</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {method === PaymentMethod.CARD && (
                            <FormField
                                control={form.control}
                                name="commission"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Comisión (%) o Monto</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="invoiceRequested"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white dark:bg-slate-950">
                                    <div className="space-y-0.5">
                                        <FormLabel>Requiere Factura</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Comentarios opcionales..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Registrar Pago
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
