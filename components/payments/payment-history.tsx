'use client'

import { Payment } from "@prisma/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"

interface PaymentHistoryProps {
    payments: (Payment & { appointment?: { service: { name: string } } | null })[]
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {payments.map((payment) => (
                    <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.date), "PP p")}</TableCell>
                        <TableCell className="capitalize">{payment.type.toLowerCase().replace('_', ' ')}</TableCell>
                        <TableCell className="capitalize">{payment.method.toLowerCase()}</TableCell>
                        <TableCell>{payment.appointment?.service?.name || "-"}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                            +${String(payment.amount)}
                        </TableCell>
                    </TableRow>
                ))}
                {payments.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            No payments recorded yet.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}
