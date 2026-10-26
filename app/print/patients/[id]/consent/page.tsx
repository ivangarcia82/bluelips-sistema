import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatClinic } from "@/lib/timezone"
import { DocumentHeader, PatientData, Section } from "@/components/print/document-parts"

function Blank({ className = "" }: { className?: string }) {
    return <span className={`inline-block border-b border-slate-800 ${className}`}>&nbsp;</span>
}

function Lines({ count }: { count: number }) {
    return (
        <div className="space-y-5 pt-2">
            {Array.from({ length: count }).map((_, i) => <div key={i} className="border-b border-slate-400" />)}
        </div>
    )
}

function SignatureLine({ label }: { label: string }) {
    return (
        <div className="text-center">
            <div className="h-14 border-b border-slate-800" />
            <p className="mt-1 text-xs">{label}</p>
            <p className="text-[10px] text-slate-500">Nombre y firma</p>
        </div>
    )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const name = (await prisma.patient.findUnique({ where: { id }, select: { name: true } }))?.name
    return { title: `Consentimiento informado - ${name ?? ""}` }
}

// Carta de consentimiento informado lista para imprimir. El texto es una
// plantilla general; la clínica debe validarlo con su asesor legal.
export default async function PrintConsentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const patient = await prisma.patient.findUnique({ where: { id } })
    if (!patient) notFound()

    const signer = patient.tutorName ? `${patient.tutorName} (tutor de ${patient.name})` : patient.name

    return (
        <div className="text-sm leading-relaxed">
            <DocumentHeader title="Carta de Consentimiento Informado" subtitle="Tratamiento odontológico" />

            <p className="mb-4 text-right">
                Lugar: <Blank className="w-48" /> &nbsp; Fecha: {formatClinic(new Date(), "dd/MM/yyyy")}
            </p>

            <PatientData patient={patient} />

            <Section title="Procedimiento a realizar">
                <p>Diagnóstico: <Blank className="w-[calc(100%-6rem)]" /></p>
                <p className="mt-3">Tratamiento / procedimiento autorizado:</p>
                <Lines count={2} />
                <p className="mt-3">Odontólogo tratante: <Blank className="w-[calc(100%-10rem)]" /></p>
            </Section>

            <Section title="Declaración">
                <div className="space-y-2 text-justify">
                    <p>
                        Yo, <strong>{signer}</strong>, en pleno uso de mis facultades, declaro que el odontólogo tratante me ha explicado de forma clara y comprensible
                        el diagnóstico, la naturaleza y el propósito del tratamiento arriba descrito, así como las alternativas existentes y las consecuencias de no realizarlo.
                    </p>
                    <p>
                        Se me han informado los beneficios esperados y los riesgos y posibles complicaciones, entre ellos: dolor, inflamación, sangrado, sensibilidad,
                        infección, reacciones a la anestesia o a los materiales, y la posibilidad de requerir tratamientos adicionales. Entiendo que la odontología no es
                        una ciencia exacta y que no se me puede garantizar un resultado específico.
                    </p>
                    <p>Riesgos específicos explicados para este procedimiento:</p>
                    <Lines count={2} />
                    <p className="pt-2">
                        Autorizo al odontólogo y a su equipo a realizar el procedimiento, la administración de anestesia local y las medidas que resulten necesarias
                        para atender cualquier contingencia o urgencia derivada del mismo. Me comprometo a seguir las indicaciones y cuidados posteriores, y a informar
                        verazmente mi estado de salud.
                    </p>
                    <p>
                        He tenido la oportunidad de hacer preguntas y todas fueron respondidas a mi satisfacción. Sé que puedo revocar este consentimiento en cualquier
                        momento antes de iniciar el procedimiento. Por lo anterior, otorgo mi consentimiento de manera libre y voluntaria.
                    </p>
                </div>
            </Section>

            <div className="mt-12 grid grid-cols-2 gap-x-12 gap-y-10 break-inside-avoid">
                <SignatureLine label={patient.tutorName ? "Tutor o representante legal" : "Paciente"} />
                <SignatureLine label="Odontólogo tratante" />
                <SignatureLine label="Testigo" />
                <SignatureLine label="Testigo" />
            </div>
        </div>
    )
}
