'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { Dentist } from "@prisma/client"
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
import { Combobox } from "@/components/ui/combobox"
import { createExpense } from "@/actions/expenses"
import { toast } from "sonner"

const formSchema = z.object({
    amount: z.string().min(1, "Monto requerido"),
    description: z.string().min(1, "Descripción requerida"),
    category: z.string().min(1, "Categoría requerida"),
    dentistId: z.string().optional(),
})

interface ExpenseDialogProps {
    children?: React.ReactNode
    dentists: Dentist[]
}

const CATEGORIES = [
    { value: "PAGO_DENTISTA", label: "Pago a Dentista" },
    { value: "PAGO_PERSONAL", label: "Pago a Personal" },
    { value: "GASTO_OPERATIVO", label: "Gasto Operativo" },
    { value: "INSUMOS", label: "Insumos/Materiales" },
    { value: "OTRO", label: "Otro" },
]

export function ExpenseDialog({ children, dentists }: ExpenseDialogProps) {
    const [open, setOpen] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: "",
            description: "",
            category: "GASTO_OPERATIVO",
            dentistId: undefined,
        },
    })

    const category = form.watch("category")

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await createExpense({ ...values, amount: Number(values.amount) })
            toast.success("Egreso registrado correctamente")
            setOpen(false)
            form.reset()
        } catch (error) {
            console.error(error)
            toast.error("Error al registrar egreso")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="destructive">
                        <Plus className="mr-2 h-4 w-4" /> Registrar Egreso
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Egreso</DialogTitle>
                    <DialogDescription>
                        Registra un pago a dentista, personal o gasto operativo.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                                        <Input placeholder="Detalle del gasto..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <FormControl>
                                        <Combobox
                                            options={CATEGORIES.map((cat) => ({ value: cat.value, label: cat.label }))}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Selecciona una categoría"
                                            searchPlaceholder="Buscar categoría..."
                                            emptyText="Sin categorías."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {category === "PAGO_DENTISTA" && (
                            <FormField
                                control={form.control}
                                name="dentistId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dentista Recibe</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={dentists.map((d) => ({ value: d.id, label: d.name }))}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Selecciona un dentista"
                                                searchPlaceholder="Buscar dentista..."
                                                emptyText="Sin dentistas."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting} variant="destructive">
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Registrar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
