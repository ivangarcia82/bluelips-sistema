'use client'

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { payCommissions } from "@/actions/payments"
import { toast } from "sonner"
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

interface PayCommissionButtonProps {
    dentistId: string
    amount: number
}

export function PayCommissionButton({ dentistId, amount }: PayCommissionButtonProps) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    async function handlePay() {
        setLoading(true)
        try {
            const res = await payCommissions(dentistId, amount)
            if (res.error) throw new Error(res.error)
            toast.success("Comisiones pagadas correctamente")
            setOpen(false)
        } catch (error) {
            console.error(error)
            toast.error("Error al registrar el pago")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="mt-2 w-full border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                    Pagar Ahora
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Pago de Comisiones</AlertDialogTitle>
                    <AlertDialogDescription>
                        Estás a punto de registrar un pago de comisiones por <b>${amount.toFixed(2)}</b>.
                        Esto generará un egreso en la caja del día y marcará los pagos correspondientes como pagados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePay} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Pago
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
