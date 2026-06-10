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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
            await createExpense(values)
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona una categoría" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un dentista" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {dentists.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
