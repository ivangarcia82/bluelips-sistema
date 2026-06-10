'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { markInvoiceAsSent } from "@/actions/payments"
import { toast } from "sonner"

export function InvoiceButton({ paymentId }: { paymentId: string }) {
    const [loading, setLoading] = useState(false)

    const handleMarkAsSent = async () => {
        setLoading(true)
        try {
            const result = await markInvoiceAsSent(paymentId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Factura marcada como enviada")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsSent}
            disabled={loading}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Enviando...
                </>
            ) : (
                <>
                    <Check className="mr-1 h-3 w-3" />
                    Marcar Enviada
                </>
            )}
        </Button>
    )
}
