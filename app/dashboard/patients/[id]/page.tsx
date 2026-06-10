import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Calendar, FileText, Activity, HeartPulse } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MedicalHistoryForm } from "@/components/patients/medical-history-form"
import { OdontogramView } from "@/components/patients/odontogram-view"

export default async function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
            appointments: {
                include: {
                    dentist: true,
                    service: true
                },
                orderBy: { date: 'desc' }
            },
            payments: {
                orderBy: { createdAt: 'desc' },
                include: {
                    service: true
                }
            },
            medicalHistory: true,
            odontogram: true
        }
    })

    if (!patient) {
        notFound()
    }

    const patientDemographics = {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        homePhone: patient.homePhone,
        gender: patient.gender,
        occupation: patient.occupation,
        address: patient.address,
        tutorName: patient.tutorName,
        tutorPhone: patient.tutorPhone,
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/patients">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{patient.name}</h2>
                    <p className="text-muted-foreground">{patient.email || 'Sin email'} • {patient.phone || 'Sin teléfono'}</p>
                    {(patient.tutorName) && (
                        <div className="mt-2 text-sm bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded border border-yellow-200 dark:border-yellow-900 inline-block">
                            <span className="font-semibold text-yellow-800 dark:text-yellow-500">Tutor: </span>
                            <span className="text-yellow-800 dark:text-yellow-500">{patient.tutorName}</span>
                            {patient.tutorPhone && <span className="text-yellow-800 dark:text-yellow-500 ml-2">• {patient.tutorPhone}</span>}
                        </div>
                    )}
                </div>
            </div>

            <Tabs defaultValue="odontogram" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="odontogram" className="flex items-center gap-2">
                        <HeartPulse className="h-4 w-4" />
                        Odontograma
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Historia Clínica
                    </TabsTrigger>
                    <TabsTrigger value="appointments" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Citas
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Pagos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="odontogram">
                    <OdontogramView patientId={patient.id} conditions={patient.odontogram} />
                </TabsContent>

                <TabsContent value="history">
                    <MedicalHistoryForm patient={patientDemographics as any} medicalHistory={patient.medicalHistory} />
                </TabsContent>

                <TabsContent value="appointments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Citas</CardTitle>
                            <CardDescription>Citas pasadas y futuras</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {patient.appointments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No hay citas registradas.</p>
                                ) : (
                                    patient.appointments.map((appt: any) => (
                                        <div key={appt.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{format(appt.date, "dd MMMM yyyy", { locale: es })}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(appt.startTime, "HH:mm")} - {appt.service?.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Dr. {appt.dentist?.name}</p>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${appt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                appt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {appt.status}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Servicios y Pagos</CardTitle>
                            <CardDescription>Pagos realizados y servicios recibidos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {patient.payments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No hay pagos registrados.</p>
                                ) : (
                                    patient.payments.map((payment: any) => (
                                        <div key={payment.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{payment.service?.name || "Pago General"}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(payment.createdAt, "dd MMM yyyy HH:mm", { locale: es })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">${Number(payment.amount).toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground uppercase">{payment.method}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
