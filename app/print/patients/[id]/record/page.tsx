import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatClinic } from "@/lib/timezone"
import { DocumentHeader, MedicalHistoryContent, PatientData, Section } from "@/components/print/document-parts"
import { ReturnSheetBody } from "@/components/print/return-sheet-body"

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    BLOCKED: "Bloqueo",
}

const TOOTH_CONDITIONS: Record<string, string> = {
    CARIES: "Caries",
    RESINA: "Resina / Obturación",
    AUSENTE: "Ausente / Extracción",
    CORONA: "Corona",
    IMPLANTE: "Implante",
}

const METHOD_LABELS: Record<string, string> = { CASH: "Efectivo", CARD: "Tarjeta", TRANSFER: "Transferencia" }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const name = (await prisma.patient.findUnique({ where: { id }, select: { name: true } }))?.name
    return { title: `Expediente - ${name ?? ""}` }
}

// Expediente completo: datos, historia clínica, odontograma, hojas de devolución, citas y pagos.
export default async function PrintPatientRecordPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
            medicalHistory: true,
            odontogram: { orderBy: [{ type: "asc" }, { toothId: "asc" }] },
            returnSheets: { include: { dentist: true, patient: true, appointment: { include: { service: true } } }, orderBy: { date: "desc" } },
            appointments: { include: { dentist: true, service: true }, orderBy: { startTime: "desc" } },
            payments: { include: { service: true }, orderBy: { date: "desc" } },
        },
    })
    if (!patient) notFound()

    const totalPaid = patient.payments.reduce((sum, p) => sum + Number(p.amount), 0)

    return (
        <>
            <DocumentHeader title="Expediente Clínico" subtitle={patient.name} />
            <PatientData patient={patient} />
            <MedicalHistoryContent history={patient.medicalHistory} />

            <div className="mt-8" />
            <Section title="Odontograma">
                {patient.odontogram.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin hallazgos registrados.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead><tr className="text-left text-[11px] uppercase text-slate-500"><th className="py-1">Diente</th><th>Dentición</th><th>Condición</th><th>Notas</th></tr></thead>
                        <tbody>
                            {patient.odontogram.map((c) => (
                                <tr key={c.id} className="border-t">
                                    <td className="py-1">{c.toothId}</td>
                                    <td>{c.type === "PEDIATRIC" ? "Temporal" : "Permanente"}</td>
                                    <td>{TOOTH_CONDITIONS[c.condition] ?? c.condition}</td>
                                    <td>{c.notes || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Section>

            {patient.returnSheets.length > 0 && (
                <div className="break-before-page">
                    <h2 className="mb-4 text-lg font-bold">Hojas de devolución</h2>
                    {patient.returnSheets.map((sheet) => (
                        <div key={sheet.id} className="mb-8 break-inside-avoid border-b pb-6 last:border-0">
                            <ReturnSheetBody sheet={sheet} />
                        </div>
                    ))}
                </div>
            )}

            <div className="break-before-page" />
            <Section title="Citas">
                {patient.appointments.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin citas.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead><tr className="text-left text-[11px] uppercase text-slate-500"><th className="py-1">Fecha</th><th>Servicio</th><th>Doctor</th><th>Estado</th></tr></thead>
                        <tbody>
                            {patient.appointments.map((a) => (
                                <tr key={a.id} className="border-t">
                                    <td className="py-1">{formatClinic(a.startTime, "dd/MM/yyyy HH:mm")}</td>
                                    <td>{a.service?.name}</td>
                                    <td>Dr. {a.dentist?.name}</td>
                                    <td>{STATUS_LABELS[a.status] ?? a.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Section>
            <Section title="Pagos">
                {patient.payments.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin pagos.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead><tr className="text-left text-[11px] uppercase text-slate-500"><th className="py-1">Fecha</th><th>Concepto</th><th>Método</th><th className="text-right">Monto</th></tr></thead>
                        <tbody>
                            {patient.payments.map((p) => (
                                <tr key={p.id} className="border-t">
                                    <td className="py-1">{formatClinic(p.date, "dd/MM/yyyy")}</td>
                                    <td>{p.service?.name || "Pago general"}</td>
                                    <td>{METHOD_LABELS[p.method] ?? p.method}</td>
                                    <td className="text-right">${Number(p.amount).toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr className="border-t-2 font-bold"><td colSpan={3} className="py-1">Total pagado</td><td className="text-right">${totalPaid.toFixed(2)}</td></tr>
                        </tbody>
                    </table>
                )}
            </Section>
        </>
    )
}
