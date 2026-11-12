import { formatClinic } from "@/lib/timezone"
import { Section, SignatureBlock } from "@/components/print/document-parts"

export function ReturnSheetBody({ sheet }: {
    sheet: {
        date: Date
        procedures: string
        observations: string | null
        signature: string | null
        signerName: string | null
        signedAt: Date | null
        patient: { name: string }
        dentist: { name: string; specialty?: string | null }
        appointment?: { service: { name: string } } | null
    }
}) {
    return (
        <>
            <Section title="Datos de la atención">
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><p className="text-[11px] uppercase text-slate-500">Paciente</p><p>{sheet.patient.name}</p></div>
                    <div><p className="text-[11px] uppercase text-slate-500">Fecha</p><p>{formatClinic(sheet.date, "dd/MM/yyyy")}</p></div>
                    <div><p className="text-[11px] uppercase text-slate-500">Doctor que atendió</p><p>Dr. {sheet.dentist.name}</p></div>
                    {sheet.appointment && (
                        <div className="col-span-3"><p className="text-[11px] uppercase text-slate-500">Servicio de la cita</p><p>{sheet.appointment.service.name}</p></div>
                    )}
                </div>
            </Section>
            <Section title="Procedimientos realizados">
                <p className="whitespace-pre-line text-sm">{sheet.procedures}</p>
            </Section>
            {sheet.observations && (
                <Section title="Indicaciones / observaciones">
                    <p className="whitespace-pre-line text-sm">{sheet.observations}</p>
                </Section>
            )}
            <p className="mb-10 text-xs text-slate-600">
                Declaro que se me informó y recibí de conformidad el tratamiento descrito en esta hoja, así como las indicaciones posteriores.
            </p>
            <div className="flex justify-between gap-8">
                <SignatureBlock label="Firma del paciente o tutor" signature={sheet.signature} signerName={sheet.signerName} signedAt={sheet.signedAt} />
                <SignatureBlock label="Firma del doctor" signerName={`Dr. ${sheet.dentist.name}`} />
            </div>
        </>
    )
}
