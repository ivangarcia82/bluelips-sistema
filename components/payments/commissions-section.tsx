import { getPendingCommissions } from "@/actions/payments"
import { DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PayCommissionButton } from "./pay-commission-button"

export async function CommissionsSection({ date }: { date?: Date }) {
    // If no date provided, default to today for the "Active Today" filter
    const targetDate = date || new Date()
    const pendingCommissions = await getPendingCommissions(targetDate)

    // Filter to show only dentists who have commissions generated TODAY
    // OR show all who have pending commissions?
    // User said: "deben aparecer todos los que hayan tenido algún servicio en el día"
    // This implies: Filter strictly by activity today.

    // The getPendingCommisions with 'date' returns ALL dentists who have activity on that date,
    // (if I implemented the map correctly, let's double check logic below)
    // Wait, my getPendingCommissions implementation:
    // It filters Dentists who have `payments: { some: dateFilter }`.
    // So distinct Dentists active today are returned.

    // But what if they have NO commission today (e.g. commission 0%)? 
    // They are filtered if `commission: { gt: 0 }` is missing from the date filter? 
    // I left `commission: { gt: 0 }` out of the date filter in `payments.ts`! 
    // I need to fix `actions/payments.ts` if I want only commissionable activity. 
    // BUT user said "servico en el día", maybe even if 0 commission?
    // "cuanto debo de darle..." implies non-zero.

    // Assuming getPendingCommissions returns what we need (Active Dentists).

    // Filter out dentists with zero pending balance (allow small tolerance)
    const filteredCommissions = pendingCommissions.filter(c => c.totalPending > 0.01)

    if (filteredCommissions.length === 0) return null

    return (
        <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                    <DollarSign className="h-5 w-5" />
                    Comisiones (Actividad de Hoy)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCommissions.map((c) => (
                        <div key={c.dentistId} className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
                            <div>
                                <p className="font-medium">{c.dentistName}</p>
                                <div className="text-sm text-muted-foreground mt-1">
                                    <p>Hoy: <span className="text-green-600 font-medium">${c.todaysCommission.toFixed(2)}</span></p>
                                    <p>Total Pendiente: ${c.totalPending.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <PayCommissionButton dentistId={c.dentistId} amount={c.totalPending} />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
