'use client'

import { useState } from "react"
import { Consultory } from "@prisma/client"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2 } from "lucide-react"
import { ConsultoryDialog } from "./consultory-dialog"
import { deleteConsultory } from "@/actions/consultories"

type ConsultoryWithCount = Consultory & { _count: { appointments: number } }

interface ConsultoryTableProps {
    consultories: ConsultoryWithCount[]
}

export function ConsultoryTable({ consultories }: ConsultoryTableProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function handleDelete(consultory: ConsultoryWithCount) {
        if (!confirm(`¿Eliminar "${consultory.name}"? Esta acción no se puede deshacer.`)) return

        setDeletingId(consultory.id)
        const result = await deleteConsultory(consultory.id)
        setDeletingId(null)

        if (result && "error" in result) {
            toast.error(result.error)
            return
        }
        toast.success("Consultorio eliminado")
    }

    if (consultories.length === 0) {
        return (
            <div className="p-10 text-center text-sm text-muted-foreground">
                Aún no hay consultorios. Crea el primero para poder agendar citas.
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Citas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {consultories.map((consultory) => (
                    <TableRow key={consultory.id}>
                        <TableCell className="font-medium">{consultory.name}</TableCell>
                        <TableCell className="max-w-[280px] truncate text-muted-foreground">
                            {consultory.description || "—"}
                        </TableCell>
                        <TableCell className="text-right">{consultory._count.appointments}</TableCell>
                        <TableCell className="flex items-center justify-end gap-2 text-right">
                            <ConsultoryDialog consultory={consultory}>
                                <Button variant="ghost" size="icon" aria-label={`Editar ${consultory.name}`}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </ConsultoryDialog>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Eliminar ${consultory.name}`}
                                disabled={deletingId === consultory.id}
                                onClick={() => handleDelete(consultory)}
                            >
                                {deletingId === consultory.id
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Trash2 className="h-4 w-4 text-[#E23B2E]" />}
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
