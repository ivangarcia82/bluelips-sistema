import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getPatients } from "@/actions/patients"
import { PatientDialog } from "@/components/patients/patient-dialog"
import { PatientTable } from "@/components/patients/patient-table"

export default async function PatientsPage() {
    const patients = await getPatients()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
                <PatientDialog>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Patient
                    </Button>
                </PatientDialog>
            </div>

            <div className="border rounded-lg bg-white dark:bg-slate-950 shadow-sm">
                <PatientTable patients={patients} />
            </div>
        </div>
    )
}
