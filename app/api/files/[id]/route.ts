import { get } from "@vercel/blob"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Los archivos de pacientes son privados en Blob: solo se sirven a usuarios con sesión.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return new Response("No autorizado", { status: 401 })

    const { id } = await params
    const file = await prisma.patientFile.findUnique({ where: { id } })
    if (!file) return new Response("No encontrado", { status: 404 })

    const result = await get(file.pathname, { access: "private" })
    if (!result || result.statusCode !== 200) return new Response("No encontrado", { status: 404 })

    const download = new URL(request.url).searchParams.has("download")
    const disposition = `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.name)}`

    return new Response(result.stream, {
        headers: {
            "Content-Type": file.contentType,
            "Content-Disposition": disposition,
            "Cache-Control": "private, no-store",
        },
    })
}
