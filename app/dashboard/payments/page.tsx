
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, CreditCard, Users, DollarSign, Wallet, FileText, CheckCircle2 } from "lucide-react"
import { PaymentDialog } from "@/components/payments/payment-dialog"
import { prisma } from "@/lib/prisma"
import { getRecentPayments, getDebtors, getDailyBalance, getPendingInvoices } from "@/actions/payments"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { InvoiceButton } from "@/components/payments/invoice-button"

export default async function PaymentsPage() {
    const today = new Date()
    const [dentists, servicesRaw, patients, recentPayments, debtors, dailyBalance, pendingInvoices] = await Promise.all([
        prisma.dentist.findMany(),
        prisma.service.findMany(),
        prisma.patient.findMany({ orderBy: { name: 'asc' } }),
        getRecentPayments(),
        getDebtors(),
        getDailyBalance(today),
        getPendingInvoices()
    ]) as [any[], any[], any[], any[], any[], any, any[]] // Temporary casting to resolve persistent type inference issues

    const services = servicesRaw.map(service => ({
        ...service,
        price: service.price.toNumber()
    }))

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Cobros y Finanzas</h2>
                    <p className="text-muted-foreground">Administra pagos y cuentas por cobrar.</p>
                </div>
                <PaymentDialog
                    dentists={dentists}
                    services={services}
                    patients={patients}
                >
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Registrar Cobro
                    </Button>
                </PaymentDialog>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-slate-900 text-white dark:bg-slate-950">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">Corte del Día</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">
                            ${dailyBalance.total.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 space-y-1">
                            <div className="flex justify-between">
                                <span>Efectivo:</span>
                                <span>${(dailyBalance.byMethod['CASH'] || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tarjeta:</span>
                                <span>${(dailyBalance.byMethod['CARD'] || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Transf:</span>
                                <span>${(dailyBalance.byMethod['TRANSFER'] || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${debtors.reduce((acc, curr) => acc + curr.balance, 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Total pendiente de {debtors.length} pacientes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingInvoices.length}</div>
                        <p className="text-xs text-muted-foreground">Solicitudes sin enviar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Venta Rápida</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="mt-0">
                            <PaymentDialog
                                dentists={dentists}
                                services={services}
                                patients={patients}
                            >
                                <Button variant="secondary" size="sm" className="w-full">Cobrar a Público</Button>
                            </PaymentDialog>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Cobro rápido sin cita previa</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="history" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
                    <TabsTrigger value="debtors">
                        Cuentas por Cobrar
                        {debtors.length > 0 && (
                            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                {debtors.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="invoices">
                        Facturas Pendientes
                        {pendingInvoices.length > 0 && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                {pendingInvoices.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Transacciones</CardTitle>
                            <CardDescription>Pagos recientes recibidos de todos los pacientes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Paciente</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Método</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Factura</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Comisión</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {recentPayments.map((payment) => (
                                            <tr key={payment.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">{format(payment.createdAt, "dd/MM/yyyy HH:mm")}</td>
                                                <td className="p-4 align-middle font-medium">{payment.patient.name}</td>
                                                <td className="p-4 align-middle capitalize">
                                                    {payment.method === 'CASH' ? 'Efectivo' :
                                                        payment.method === 'CARD' ? 'Tarjeta' : 'Transferencia'}
                                                </td>
                                                <td className="p-4 align-middle capitalize">
                                                    {payment.type === 'DEPOSIT' ? 'Abono' :
                                                        payment.type === 'FULL_PAYMENT' ? 'Completo' : 'Liquidación'}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {payment.invoiceRequested ? (
                                                        payment.invoiceSent ?
                                                            <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-100 rounded px-2 py-0.5">Enviada</span> :
                                                            <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-100 rounded px-2 py-0.5">Pendiente</span>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {Number(payment.commission) > 0 ? `$${Number(payment.commission).toFixed(2)}` : '-'}
                                                </td>
                                                <td className="p-4 align-middle text-right font-bold">${Number(payment.amount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="debtors">
                    {/* ... (keep existing debtors table) ... */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cuentas por Cobrar</CardTitle>
                            <CardDescription>Servicios con saldos pendientes por liquidar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Paciente</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Servicio</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Costo</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Abonado</th>
                                            <th className="h-12 px-4 text-right align-middle font-bold text-red-600">Restante</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {debtors.map((d) => (
                                            <tr key={d.appointmentId} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">{format(d.date, "dd/MM/yyyy")}</td>
                                                <td className="p-4 align-middle font-medium">{d.patient.name}</td>
                                                <td className="p-4 align-middle text-muted-foreground">{d.service?.name || 'Servicio'}</td>
                                                <td className="p-4 align-middle text-right">${d.totalCost.toFixed(2)}</td>
                                                <td className="p-4 align-middle text-right">${d.totalPaid.toFixed(2)}</td>
                                                <td className="p-4 align-middle text-right font-bold text-red-600">${d.balance.toFixed(2)}</td>
                                                <td className="p-4 align-middle text-right">
                                                    <PaymentDialog
                                                        patientId={d.patient.id}
                                                        dentists={dentists}
                                                        services={services}
                                                        patients={patients}
                                                        appointmentId={d.appointmentId}
                                                        defaultAmount={d.balance}
                                                        defaultServiceId={d.service?.id}
                                                        defaultDentistId={d.dentist?.id}
                                                    >
                                                        <Button size="sm" variant="default">Liquidar</Button>
                                                    </PaymentDialog>
                                                </td>
                                            </tr>
                                        ))}
                                        {debtors.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                    No hay cuentas por cobrar pendientes.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invoices">
                    <Card>
                        <CardHeader>
                            <CardTitle>Solicitudes de Factura</CardTitle>
                            <CardDescription>Cobros que requieren facturación y aún no han sido enviados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha Pago</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Paciente</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Monto</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Notas</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {pendingInvoices.map((inv) => (
                                            <tr key={inv.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">{format(inv.createdAt, "dd/MM/yyyy HH:mm")}</td>
                                                <td className="p-4 align-middle font-medium">{inv.patient.name}</td>
                                                <td className="p-4 align-middle font-bold">${Number(inv.amount).toFixed(2)}</td>
                                                <td className="p-4 align-middle text-muted-foreground text-xs">{inv.notes || '-'}</td>
                                                <td className="p-4 align-middle text-right">
                                                    <InvoiceButton paymentId={inv.id} />
                                                </td>
                                            </tr>
                                        ))}
                                        {pendingInvoices.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                    No hay facturas pendientes.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
