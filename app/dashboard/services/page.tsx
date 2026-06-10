import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getServices } from "@/actions/services"
import { ServiceDialog } from "@/components/services/service-dialog"
import { ServiceTable } from "@/components/services/service-table"

import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function ServicesPage() {
    const session = await auth()
    if ((session?.user as any)?.role !== 'ADMIN') {
        redirect('/dashboard/agenda')
    }
    const services = await getServices()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Services</h2>
                <ServiceDialog>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Service
                    </Button>
                </ServiceDialog>
            </div>

            <div className="border rounded-lg bg-white dark:bg-slate-950 shadow-sm">
                <ServiceTable services={services.map((s: any) => ({
                    ...s,
                    price: s.price.toNumber()
                }))} />
            </div>
        </div>
    )
}
