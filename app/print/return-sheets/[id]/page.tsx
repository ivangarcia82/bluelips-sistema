import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DocumentHeader, UnsignedNotice } from "@/components/print/document-parts"
import { ReturnSheetBody } from "@/components/print/return-sheet-body"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const name = (await prisma.returnSheet.findUnique({ where: { id }, select: { patient: { select: { name: true } } } }))?.patient.name
    return { title: `Hoja de devolución - ${name ?? ""}` }
}

export default async function PrintReturnSheetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const sheet = await prisma.returnSheet.findUnique({
        where: { id },
        include: { patient: true, dentist: true, appointment: { include: { service: true } } },
    })
    if (!sheet) notFound()

    return (
        <>
            <DocumentHeader title="Hoja de Devolución" subtitle={sheet.patient.name} />
            {!sheet.signedAt && <UnsignedNotice />}
            <ReturnSheetBody sheet={sheet} />
        </>
    )
}
