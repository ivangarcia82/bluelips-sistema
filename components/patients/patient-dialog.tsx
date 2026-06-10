'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Patient } from "@prisma/client"
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
import { createPatient, updatePatient } from "@/actions/patients"
import { format, differenceInYears } from "date-fns"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    address: z.string().optional(),
    tutorName: z.string().optional(),
    tutorPhone: z.string().optional(),
})

interface PatientDialogProps {
    children?: React.ReactNode
    patient?: Patient
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function PatientDialog({ children, patient, open: controlledOpen, onOpenChange }: PatientDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const form = useForm<z.infer<typeof formSchema>>({
        // @ts-ignore
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: patient?.name || "",
            email: patient?.email || "",
            phone: patient?.phone || "",
            birthDate: patient?.birthDate ? format(new Date(patient.birthDate), "yyyy-MM-dd") : "",
            address: patient?.address || "",
            tutorName: patient?.tutorName || "",
            tutorPhone: patient?.tutorPhone || "",
        },
    })

    const birthDate = form.watch("birthDate")
    const isMinor = birthDate ? differenceInYears(new Date(), new Date(birthDate)) < 18 : false

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (patient) {
                await updatePatient(patient.id, values)
            } else {
                await createPatient(values)
            }
            setOpen(false)
            form.reset()
        } catch (error) {
            console.error(error)
            alert("Something went wrong")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{patient ? "Editar Paciente" : "Agregar Paciente"}</DialogTitle>
                    <DialogDescription>
                        {patient ? "Actualizar detalles del paciente." : "Agregar un nuevo paciente al sistema."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Juan Pérez" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Correo (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="correo@ejemplo.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="555-000-0000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="birthDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Nacimiento</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {isMinor && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-900 grid gap-4">
                                <h4 className="font-medium text-yellow-800 dark:text-yellow-500">Datos del Tutor</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="tutorName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-yellow-800 dark:text-yellow-500">Nombre</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Padre/Madre" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="tutorPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-yellow-800 dark:text-yellow-500">Teléfono</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="555..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Calle Principal #123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {patient ? "Actualizar" : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
