'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
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
import { createDentist, updateDentist } from "@/actions/dentists"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    specialty: z.string().min(1, "Specialty is required"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    color: z.string().min(1, "Color is required"),
    commissionPercentage: z.coerce.number().min(0).max(100).default(0),
})

interface DentistDialogProps {
    children?: React.ReactNode
    dentist?: Dentist
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function DentistDialog({ children, dentist, open: controlledOpen, onOpenChange }: DentistDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: dentist?.name || "",
            specialty: dentist?.specialty || "",
            email: dentist?.email || "",
            phone: dentist?.phone || "",
            color: dentist?.color || "#3b82f6",
            // @ts-ignore
            commissionPercentage: dentist?.commissionPercentage || 0,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (dentist) {
                await updateDentist(dentist.id, values)
            } else {
                await createDentist(values)
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{dentist ? "Edit Dentist" : "Add Dentist"}</DialogTitle>
                    <DialogDescription>
                        {dentist ? "Update dentist details." : "Add a new dentist to the system."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="grid gap-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Dr. Smith" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="specialty"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Specialty</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Orthodontist" {...field} />
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
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="email@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123-456-7890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="commissionPercentage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comisión (%)</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" max="100" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <Input type="color" className="w-12 h-10 p-1" {...field} />
                                            <Input placeholder="#000000" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {dentist ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
