'use client'

import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteUser } from "@/actions/users"
import { Badge } from "@/components/ui/badge"

interface UserTableProps {
    users: any[]
}

export function UserTable({ users }: UserTableProps) {
    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este usuario?")) {
            await deleteUser(id)
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "ADMIN":
                return <Badge variant="destructive">Admin</Badge>
            case "RECEPTIONIST":
                return <Badge variant="secondary">Recepción</Badge>
            case "DENTIST":
                return <Badge variant="outline">Dentista</Badge>
            default:
                return <Badge>{role}</Badge>
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Fecha Creación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{format(new Date(user.createdAt), "P", { locale: es })}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(user.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No se encontraron usuarios.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
