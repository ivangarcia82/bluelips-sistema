"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Download, FileText, ImageIcon, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { deletePatientFile, uploadPatientFile } from "@/actions/patient-files"
import { formatClinic } from "@/lib/timezone"

const MAX_FILE_SIZE = 4 * 1024 * 1024

export type PatientFileItem = {
    id: string
    name: string
    contentType: string
    size: number
    uploadedBy: string | null
    createdAt: string
}

function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function PatientFiles({ patientId, files }: { patientId: string; files: PatientFileItem[] }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    async function handleFiles(list: FileList | null) {
        if (!list?.length) return
        setIsUploading(true)
        for (const file of Array.from(list)) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name} supera 4 MB`)
                continue
            }
            const formData = new FormData()
            formData.append("file", file)
            const res = await uploadPatientFile(patientId, formData)
            if (res.error) toast.error(`${file.name}: ${res.error}`)
            else toast.success(`${file.name} subido`)
        }
        setIsUploading(false)
        if (inputRef.current) inputRef.current.value = ""
    }

    async function handleDelete(file: PatientFileItem) {
        if (!confirm(`¿Eliminar ${file.name}?`)) return
        const res = await deletePatientFile(file.id)
        if (res.error) toast.error(res.error)
        else toast.success("Archivo eliminado")
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                    <CardTitle>Archivos</CardTitle>
                    <CardDescription>Radiografías, estudios, consentimientos escaneados y otros documentos (máx. 4 MB c/u).</CardDescription>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => handleFiles(e.target.files)}
                />
                <Button size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                    <Upload className="mr-2 h-4 w-4" /> {isUploading ? "Subiendo..." : "Subir archivo"}
                </Button>
            </CardHeader>
            <CardContent>
                {files.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay archivos cargados.</p>
                ) : (
                    <div className="divide-y">
                        {files.map((file) => {
                            const Icon = file.contentType.startsWith("image/") ? ImageIcon : FileText
                            return (
                                <div key={file.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <a href={`/api/files/${file.id}`} target="_blank" rel="noreferrer" className="block truncate font-medium hover:underline">
                                            {file.name}
                                        </a>
                                        <p className="text-xs text-muted-foreground">
                                            {formatSize(file.size)} · {formatClinic(file.createdAt, "dd/MM/yyyy HH:mm")}
                                            {file.uploadedBy && ` · ${file.uploadedBy}`}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" asChild aria-label="Descargar">
                                        <a href={`/api/files/${file.id}?download`}><Download className="h-4 w-4" /></a>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(file)} aria-label="Eliminar">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
