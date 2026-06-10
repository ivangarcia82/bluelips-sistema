'use client'

import { Service } from "@prisma/client"
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
import { ServiceDialog } from "./service-dialog"
import { deleteService } from "@/actions/services"

interface ServiceTableProps {
    services: Service[]
}

export function ServiceTable({ services }: ServiceTableProps) {

    async function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this service?")) {
            await deleteService(id)
        }
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Duration (min)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {services.map((service) => (
                    <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{service.description}</TableCell>
                        <TableCell className="text-right">${String(service.price)}</TableCell>
                        <TableCell className="text-right">{service.duration}</TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                            <ServiceDialog service={service}>
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </ServiceDialog>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
