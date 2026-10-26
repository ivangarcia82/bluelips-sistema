import Image from "next/image"
import { differenceInYears } from "date-fns"
import { formatClinic } from "@/lib/timezone"
import { CONDITIONS } from "@/lib/medical-history"

type PatientLike = {
    name: string
    birthDate: Date | null
    gender: string | null
    phone: string | null
    homePhone?: string | null
    email: string | null
    address: string | null
    occupation: string | null
    tutorName: string | null
    tutorPhone: string | null
}

export function DocumentHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <header className="mb-6 flex items-center gap-4 border-b-2 border-[#22B8DC] pb-4">
            <Image src="/logo.png" alt="Blue Lips" width={64} height={64} className="rounded-full" />
            <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#22B8DC]">Blue Lips · Clínica Dental</p>
                <h1 className="text-2xl font-bold">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
            <p className="self-end text-xs text-slate-500">Impreso: {formatClinic(new Date(), "dd/MM/yyyy HH:mm")}</p>
        </header>
    )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-6 break-inside-avoid-page">
            <h2 className="mb-2 border-b pb-1 text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h2>
            {children}
        </section>
    )
}

function Field({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <p className="text-[11px] uppercase text-slate-500">{label}</p>
            <p className="min-h-5 text-sm">{value || "—"}</p>
        </div>
    )
}

export function PatientData({ patient }: { patient: PatientLike }) {
    const age = patient.birthDate ? `${differenceInYears(new Date(), patient.birthDate)} años` : null
    return (
        <Section title="Datos del paciente">
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                <div className="col-span-2"><Field label="Nombre" value={patient.name} /></div>
                <Field label="Edad" value={age} />
                <Field label="Fecha de nacimiento" value={patient.birthDate ? formatClinic(patient.birthDate, "dd/MM/yyyy") : null} />
                <Field label="Sexo" value={patient.gender} />
                <Field label="Ocupación" value={patient.occupation} />
                <Field label="Celular" value={patient.phone} />
                <Field label="Teléfono de casa" value={patient.homePhone} />
                <Field label="Email" value={patient.email} />
                <div className="col-span-3"><Field label="Domicilio" value={patient.address} /></div>
                {patient.tutorName && (
                    <>
                        <div className="col-span-2"><Field label="Tutor" value={patient.tutorName} /></div>
                        <Field label="Teléfono del tutor" value={patient.tutorPhone} />
                    </>
                )}
            </div>
        </Section>
    )
}

type MedicalHistoryLike = Record<string, unknown> & {
    consultationReason: string | null
    otherConditions: string | null
    underMedicalTreatment: boolean
    medicalTreatmentDetails: string | null
    smokes: boolean
    smokesWhat: string | null
    smokesHowMuch: string | null
    lastDentalVisit: string | null
    referralSource: string | null
    signature: string | null
    signerName: string | null
    signedAt: Date | null
}

export function MedicalHistoryContent({ history }: { history: MedicalHistoryLike | null }) {
    if (!history) {
        return <Section title="Historia clínica"><p className="text-sm text-slate-500">Sin historia clínica registrada.</p></Section>
    }
    const yesNo = (v: boolean) => (v ? "Sí" : "No")
    return (
        <>
            <Section title="Motivo de la consulta">
                <p className="text-sm">{history.consultationReason || "—"}</p>
            </Section>
            <Section title="Afecciones médicas">
                <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm">
                    {CONDITIONS.map((c) => (
                        <div key={c.name} className="flex justify-between border-b border-dotted py-0.5">
                            <span>{c.label}</span>
                            <span className={history[c.name] ? "font-bold text-red-600" : "text-slate-500"}>{yesNo(!!history[c.name])}</span>
                        </div>
                    ))}
                </div>
                <p className="mt-2 text-sm"><span className="text-slate-500">Otras afecciones:</span> {history.otherConditions || "—"}</p>
            </Section>
            <Section title="Cuestionario médico">
                <div className="space-y-1 text-sm">
                    <p><span className="text-slate-500">¿Bajo tratamiento médico?</span> {yesNo(history.underMedicalTreatment)}{history.medicalTreatmentDetails ? ` — ${history.medicalTreatmentDetails}` : ""}</p>
                    <p><span className="text-slate-500">¿Fuma?</span> {yesNo(history.smokes)}{history.smokes ? ` — ${[history.smokesWhat, history.smokesHowMuch].filter(Boolean).join(", ")}` : ""}</p>
                    <p><span className="text-slate-500">Última consulta dental:</span> {history.lastDentalVisit || "—"}</p>
                    <p><span className="text-slate-500">¿Cómo se enteró del consultorio?</span> {history.referralSource || "—"}</p>
                </div>
            </Section>
            <p className="mb-6 text-xs text-slate-600">
                <strong>Declaración:</strong> Declaro que he contestado todas las preguntas con honestidad y según mi conocimiento, así mismo he sido informado que los datos proporcionados en la presente historia clínica son confidenciales, para el uso del profesional de salud, y amparada por el secreto profesional.
            </p>
            <SignatureBlock
                label="Firma del paciente o tutor"
                signature={history.signature}
                signerName={history.signerName}
                signedAt={history.signedAt}
            />
        </>
    )
}

export function SignatureBlock({ label, signature, signerName, signedAt }: {
    label: string
    signature?: string | null
    signerName?: string | null
    signedAt?: Date | null
}) {
    return (
        <div className="w-72 break-inside-avoid text-center">
            <div className="flex h-24 items-end justify-center border-b border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {signature && <img src={signature} alt="Firma" className="max-h-24" />}
            </div>
            <p className="mt-1 text-sm font-medium">{signerName || label}</p>
            <p className="text-xs text-slate-500">
                {signedAt ? `Firmado electrónicamente el ${formatClinic(signedAt, "dd/MM/yyyy HH:mm")}` : label}
            </p>
        </div>
    )
}

export function UnsignedNotice() {
    return (
        <p className="mb-4 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
            Documento pendiente de firma.
        </p>
    )
}
