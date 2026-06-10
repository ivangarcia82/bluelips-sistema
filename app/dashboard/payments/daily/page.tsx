import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getDailyBalance, getRecentPayments } from "@/actions/payments"
import { getDailyExpenses } from "@/actions/expenses"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { ExpenseDialog } from "@/components/payments/expense-dialog"
import { TransactionActions } from "@/components/payments/transaction-actions"
import { CommissionsSection } from "@/components/payments/commissions-section"

export default async function DailyBalancePage() {
    const today = new Date()
    const [dailyIncome, dailyExpenses, dentists] = await Promise.all([
        getDailyBalance(today),
        getDailyExpenses(today),
        prisma.dentist.findMany()
    ])

    const totalIncome = dailyIncome.total
    const totalExpenses = dailyExpenses.reduce((acc: any, curr: any) => acc + Number(curr.amount), 0)
    const netBalance = totalIncome - totalExpenses

    // Combine payments and expenses for a unified activity feed
    const transactions = [
        ...Object.values((dailyIncome as any).details || {}).flat().map((p: any) => ({
            id: p.id,
            type: 'INCOME',
            amount: Number(p.amount),
            description: `Cobro a ${p.patient.name}`,
            time: p.createdAt,
            method: p.method,
            category: 'Ingreso'
        })),
        ...dailyExpenses.map((e: any) => ({
            id: e.id,
            type: 'EXPENSE',
            amount: Number(e.amount),
            description: e.description + (e.dentist ? ` (${e.dentist.name})` : ''),
            time: e.date,
            method: 'Efectivo', // Assuming expenses are paid in cash/transfer but mostly cash for "Caja"
            category: e.category
        }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Corte de Caja</h2>
                    <p className="text-muted-foreground">Resumen de ingresos y egresos del día: {format(today, "PPP", { locale: es })}</p>
                </div>
                <ExpenseDialog dentists={dentists} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Ingresos Totales</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                            ${totalIncome.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-800 dark:text-red-400">Egresos Totales</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                            ${totalExpenses.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 text-white dark:bg-slate-950 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">Balance Neto</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-blue-400" : "text-red-400"}`}>
                            ${netBalance.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <CommissionsSection date={today} />

            <Card>
                <CardHeader>
                    <CardTitle>Actividad del Día</CardTitle>
                    <CardDescription>Detalle cronológico de movimientos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hora</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Descripción</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Categoría</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Monto</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-muted-foreground">No hay actividad hoy.</td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">{format(new Date(t.time), "HH:mm")}</td>
                                            <td className="p-4 align-middle font-medium">{t.description}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${t.type === 'INCOME'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                                    }`}>
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className={`p-4 align-middle text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-700' : 'text-red-700'
                                                }`}>
                                                {t.type === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <TransactionActions id={t.id} type={t.type as any} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
