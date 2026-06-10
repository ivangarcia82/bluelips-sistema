'use client'

import { Dentist } from "@prisma/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { DentistDialog } from "./dentist-dialog"
import { deleteDentist } from "@/actions/dentists"

interface DentistTableProps {
    dentists: Dentist[]
}

export function DentistTable({ dentists }: DentistTableProps) {

    async function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this dentist?")) {
            await deleteDentist(id)
        }
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="w-[100px]">Color</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {dentists.map((dentist) => (
                    <TableRow key={dentist.id}>
                        <TableCell className="font-medium">{dentist.name}</TableCell>
                        <TableCell>{dentist.specialty}</TableCell>
                        <TableCell>{dentist.email}</TableCell>
                        <TableCell>{dentist.phone}</TableCell>
                        <TableCell>
                            <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: dentist.color }} />
                        </TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                            <DentistDialog dentist={dentist}>
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </DentistDialog>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(dentist.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
