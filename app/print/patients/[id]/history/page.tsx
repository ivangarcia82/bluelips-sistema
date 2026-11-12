import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DocumentHeader, MedicalHistoryContent, PatientData, UnsignedNotice } from "@/components/print/document-parts"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const name = (await prisma.patient.findUnique({ where: { id }, select: { name: true } }))?.name
    return { title: `Historia clínica - ${name ?? ""}` }
}

export default async function PrintMedicalHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const patient = await prisma.patient.findUnique({ where: { id }, include: { medicalHistory: true } })
    if (!patient) notFound()

    return (
        <>
            <DocumentHeader title="Historia Clínica" subtitle={patient.name} />
            {!patient.medicalHistory?.signedAt && <UnsignedNotice />}
            <PatientData patient={patient} />
            <MedicalHistoryContent history={patient.medicalHistory} />
        </>
    )
}
