'use client'

import { useState } from "react"
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { blockTimeSlot } from "@/actions/agenda"
import { Consultory } from "@prisma/client"

const formSchema = z.object({
    consultoryId: z.string().min(1, "Selecciona un consultorio"),
    date: z.string(),
    startTime: z.string(), // HH:mm
    endTime: z.string(),   // HH:mm
    notes: z.string().optional(),
})

interface BlockDialogProps {
    children?: React.ReactNode
    consultories: Consultory[]
    defaultDate?: Date
    defaultStartTime?: string
    defaultEndTime?: string
    defaultConsultoryId?: string
    onOpenChange?: (open: boolean) => void
    open?: boolean
}

export function BlockDialog({
    children,
    consultories,
    defaultDate = new Date(),
    defaultStartTime = "09:00",
    defaultEndTime = "10:00",
    defaultConsultoryId = "",
    onOpenChange,
    open: controlledOpen
}: BlockDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            consultoryId: defaultConsultoryId,
            date: defaultDate.toISOString().split('T')[0],
            startTime: defaultStartTime,
            endTime: defaultEndTime,
            notes: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const result = await blockTimeSlot(values)

            if (result?.error) {
                alert(result.error)
                return
            }

            setOpen(false)
            form.reset()
        } catch (error) {
            console.error(error)
            alert("Error al bloquear")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bloquear Consultorio</DialogTitle>
                    <DialogDescription>
                        Reserva un espacio para mantenimiento o indisponibilidad.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                        <FormField
                            control={form.control}
                            name="consultoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Consultorio</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {consultories.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Inicio</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fin</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Razón / Notas</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Mantenimiento" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Bloquear
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
