import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrintToolbar } from "@/components/print/print-toolbar"

// Documentos para imprimir o guardar como PDF desde el navegador.
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session) redirect("/login")

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white">
            <style>{`
                @page { size: letter; margin: 14mm 14mm 16mm; }
                @media print {
                    html, body { background: #fff !important; }
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
            <PrintToolbar />
            <div className="mx-auto max-w-[216mm] bg-white px-10 py-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
                {children}
            </div>
        </div>
    )
}
