import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getDentists } from "@/actions/dentists"
import { DentistDialog } from "@/components/dentists/dentist-dialog"
import { DentistTable } from "@/components/dentists/dentist-table"

import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DentistsPage() {
    const session = await auth()
    if ((session?.user as any)?.role !== 'ADMIN') {
        redirect('/dashboard/agenda')
    }
    const dentists = await getDentists()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dentists</h2>
                <DentistDialog>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Dentist
                    </Button>
                </DentistDialog>
            </div>

            <div className="border rounded-lg bg-white dark:bg-slate-950 shadow-sm">
                <DentistTable dentists={dentists} />
            </div>
        </div>
    )
}
