'use client'

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Consultory } from "@prisma/client"
import { toast } from "sonner"
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
import { Textarea } from "@/components/ui/textarea"
import { createConsultory, updateConsultory } from "@/actions/consultories"

const formSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ConsultoryDialogProps {
    children?: React.ReactNode
    consultory?: Consultory
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ConsultoryDialog({ children, consultory, open: controlledOpen, onOpenChange }: ConsultoryDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: consultory?.name || "",
            description: consultory?.description || "",
        },
    })

    // Resincroniza el formulario con el consultorio actual cada vez que se abre
    useEffect(() => {
        if (open) {
            form.reset({
                name: consultory?.name || "",
                description: consultory?.description || "",
            })
        }
    }, [open, consultory, form])

    async function onSubmit(values: FormValues) {
        const result = consultory
            ? await updateConsultory(consultory.id, values)
            : await createConsultory(values)

        if (result && "error" in result) {
            toast.error(result.error)
            return
        }

        toast.success(consultory ? "Consultorio actualizado" : "Consultorio creado")
        setOpen(false)
        form.reset()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{consultory ? "Editar consultorio" : "Nuevo consultorio"}</DialogTitle>
                    <DialogDescription>
                        {consultory ? "Actualiza los datos del consultorio." : "Agrega un consultorio al sistema."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Consultorio 1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Planta baja, con rayos X..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className="bg-[#22B8DC] text-white hover:bg-[#0E97BC]"
                            >
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {consultory ? "Actualizar" : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
