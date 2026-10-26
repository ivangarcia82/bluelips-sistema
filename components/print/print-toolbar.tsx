"use client"

import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"

export function PrintToolbar() {
    return (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-white/95 px-6 py-3 backdrop-blur print:hidden">
            <p className="text-sm text-slate-500">
                Para exportar en PDF elija <strong>“Guardar como PDF”</strong> como impresora.
            </p>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={() => window.close()}>
                    <X className="mr-2 h-4 w-4" /> Cerrar
                </Button>
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
                </Button>
            </div>
        </div>
    )
}
