import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getConsultories } from "@/actions/consultories"
import { ConsultoryDialog } from "@/components/consultories/consultory-dialog"
import { ConsultoryTable } from "@/components/consultories/consultory-table"

export default async function ConsultoriesPage() {
    const consultories = await getConsultories()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Consultorios</h2>
                    <p className="text-muted-foreground">
                        Administra los consultorios disponibles para agendar citas.
                    </p>
                </div>
                <ConsultoryDialog>
                    <Button className="bg-[#22B8DC] text-white hover:bg-[#0E97BC]">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo consultorio
                    </Button>
                </ConsultoryDialog>
            </div>

            <div className="rounded-lg border bg-white shadow-sm dark:bg-slate-950">
                <ConsultoryTable consultories={consultories} />
            </div>
        </div>
    )
}
