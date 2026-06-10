'use client'

import { Patient } from "@prisma/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, User } from "lucide-react"
import { PatientDialog } from "./patient-dialog"
import { deletePatient } from "@/actions/patients"
import { format } from "date-fns"
import Link from "next/link"

interface PatientTableProps {
    patients: Patient[]
}

export function PatientTable({ patients }: PatientTableProps) {

    async function handleDelete(id: string) {
        if (confirm("¿Estás seguro de quitar este paciente?")) {
            await deletePatient(id)
        }
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Fecha Nacimiento</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {patients.map((patient) => (
                    <TableRow key={patient.id}>
                        <TableCell className="font-medium">
                            <Link href={`/dashboard/patients/${patient.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                                {patient.name}
                            </Link>
                        </TableCell>
                        <TableCell>{patient.email}</TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>{patient.birthDate ? format(new Date(patient.birthDate), "P") : "-"}</TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                            <PatientDialog patient={patient}>
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </PatientDialog>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(patient.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
