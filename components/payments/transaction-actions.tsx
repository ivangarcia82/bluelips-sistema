'use client'

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cancelPayment } from "@/actions/payments"
import { deleteExpense } from "@/actions/expenses"
import { toast } from "sonner"

interface TransactionActionsProps {
    id: string
    type: 'INCOME' | 'EXPENSE'
}

export function TransactionActions({ id, type }: TransactionActionsProps) {
    const [loading, setLoading] = useState(false)

    async function handleCancel() {
        setLoading(true)
        try {
            if (type === 'INCOME') {
                const res = await cancelPayment(id)
                if (res.error) throw new Error(res.error)
                toast.success("Pago cancelado correctamente")
            } else {
                const res = await deleteExpense(id)
                if (!res.success) throw new Error(res.error)
                toast.success("Egreso eliminado correctamente")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al cancelar la operación")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción eliminará el registro permanentemente.
                        {type === 'INCOME' && " El saldo del paciente se actualizará automáticamente."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} disabled={loading} className="bg-red-600 hover:bg-red-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
