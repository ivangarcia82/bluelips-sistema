"use client"

import { useState } from "react"
import { toast } from "sonner"
import { FileDown, Lock, PenLine, Plus, Trash2, Pencil, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SignDialog } from "@/components/patients/sign-dialog"
import { createReturnSheet, deleteReturnSheet, signReturnSheet, updateReturnSheet } from "@/actions/return-sheets"
import { clinicToday, formatClinic } from "@/lib/timezone"

export type ReturnSheetItem = {
    id: string
    date: string
    procedures: string
    observations: string | null
    dentistId: string
    dentistName: string
    appointmentId: string | null
    signature: string | null
    signerName: string | null
    signedAt: string | null
}

type Option = { id: string; label: string }

type ReturnSheetsProps = {
    patientId: string
    defaultSignerName: string
    sheets: ReturnSheetItem[]
    dentists: Option[]
    appointments: (Option & { dentistId: string; date: string })[]
}

const NO_APPOINTMENT = "none"

export function ReturnSheets({ patientId, defaultSignerName, sheets, dentists, appointments }: ReturnSheetsProps) {
    const [editing, setEditing] = useState<ReturnSheetItem | "new" | null>(null)
    const [signing, setSigning] = useState<ReturnSheetItem | null>(null)

    async function handleDelete(sheet: ReturnSheetItem) {
        if (!confirm("¿Eliminar esta hoja de devolución?")) return
        const res = await deleteReturnSheet(sheet.id)
        if (res.error) toast.error(res.error)
        else toast.success("Hoja eliminada")
    }

    async function handleSign(signature: string, signerName: string) {
        if (!signing) return false
        const res = await signReturnSheet(signing.id, signature, signerName)
        if (res.error) {
            toast.error(res.error)
            return false
        }
        toast.success("Hoja de devolución firmada")
        return true
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                    <CardTitle>Hojas de devolución</CardTitle>
                    <CardDescription>El doctor registra lo que se realizó y el paciente firma de conformidad.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setEditing("new")}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva hoja
                </Button>
            </CardHeader>
            <CardContent>
                {sheets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay hojas de devolución registradas.</p>
                ) : (
                    <div className="divide-y">
                        {sheets.map((sheet) => (
                            <div key={sheet.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start">
                                <div className="flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">{formatClinic(sheet.date, "dd/MM/yyyy")}</p>
                                        <span className="text-sm text-muted-foreground">· Dr. {sheet.dentistName}</span>
                                        {sheet.signedAt ? (
                                            <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-800">
                                                <Lock className="h-3 w-3" /> Firmada
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pendiente de firma</Badge>
                                        )}
                                    </div>
                                    <p className="whitespace-pre-line text-sm">{sheet.procedures}</p>
                                    {sheet.observations && (
                                        <p className="whitespace-pre-line text-sm text-muted-foreground">Indicaciones: {sheet.observations}</p>
                                    )}
                                    {sheet.signedAt && (
                                        <p className="text-xs text-muted-foreground">
                                            Firmó {sheet.signerName} el {formatClinic(sheet.signedAt, "dd/MM/yyyy HH:mm")}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`/print/return-sheets/${sheet.id}`} target="_blank" rel="noreferrer">
                                            <FileDown className="mr-2 h-4 w-4" /> PDF
                                        </a>
                                    </Button>
                                    {!sheet.signedAt && (
                                        <>
                                            <Button variant="outline" size="sm" onClick={() => setEditing(sheet)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Editar
                                            </Button>
                                            <Button size="sm" onClick={() => setSigning(sheet)}>
                                                <PenLine className="mr-2 h-4 w-4" /> Firmar
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(sheet)} aria-label="Eliminar">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {editing && (
                <ReturnSheetDialog
                    patientId={patientId}
                    sheet={editing === "new" ? null : editing}
                    dentists={dentists}
                    appointments={appointments}
                    onClose={() => setEditing(null)}
                    onSaved={(id) => {
                        setEditing(null)
                        if (editing === "new") {
                            const created = { id } as ReturnSheetItem
                            setSigning(created)
                        }
                    }}
                />
            )}

            <SignDialog
                open={!!signing}
                onOpenChange={(open) => !open && setSigning(null)}
                title="Firma de hoja de devolución"
                description="El paciente confirma que recibió el tratamiento descrito. Una vez firmada, la hoja no podrá modificarse."
                defaultSignerName={defaultSignerName}
                onSign={handleSign}
            />
        </Card>
    )
}

function ReturnSheetDialog({ patientId, sheet, dentists, appointments, onClose, onSaved }: {
    patientId: string
    sheet: ReturnSheetItem | null
    dentists: Option[]
    appointments: ReturnSheetsProps["appointments"]
    onClose: () => void
    onSaved: (id: string) => void
}) {
    const [dentistId, setDentistId] = useState(sheet?.dentistId ?? "")
    const [appointmentId, setAppointmentId] = useState(sheet?.appointmentId ?? NO_APPOINTMENT)
    const [date, setDate] = useState(sheet ? formatClinic(sheet.date, "yyyy-MM-dd") : clinicToday())
    const [procedures, setProcedures] = useState(sheet?.procedures ?? "")
    const [observations, setObservations] = useState(sheet?.observations ?? "")
    const [isSaving, setIsSaving] = useState(false)

    // Al elegir la cita se propone su doctor y fecha; ambos se pueden cambiar.
    function handleAppointment(value: string) {
        setAppointmentId(value)
        const appt = appointments.find((a) => a.id === value)
        if (appt) {
            setDentistId(appt.dentistId)
            setDate(formatClinic(appt.date, "yyyy-MM-dd"))
        }
    }

    async function handleSave() {
        setIsSaving(true)
        const data = {
            dentistId,
            appointmentId: appointmentId === NO_APPOINTMENT ? null : appointmentId,
            date,
            procedures: procedures.trim(),
            observations: observations.trim() || null,
        }
        const res = sheet ? await updateReturnSheet(sheet.id, data) : await createReturnSheet(patientId, data)
        setIsSaving(false)
        if (res.error) {
            toast.error(res.error)
            return
        }
        toast.success(sheet ? "Hoja actualizada" : "Hoja creada. Falta la firma del paciente.")
        onSaved(sheet?.id ?? (res as { id?: string }).id ?? "")
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5" />
                        {sheet ? "Editar hoja de devolución" : "Nueva hoja de devolución"}
                    </DialogTitle>
                    <DialogDescription>Puede cambiar al doctor que atendió mientras la hoja no esté firmada.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    {appointments.length > 0 && (
                        <div className="space-y-2">
                            <Label>Cita (opcional)</Label>
                            <Select value={appointmentId} onValueChange={handleAppointment}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_APPOINTMENT}>Sin cita vinculada</SelectItem>
                                    {appointments.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Doctor que atendió</Label>
                            <Select value={dentistId} onValueChange={setDentistId}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                <SelectContent>
                                    {dentists.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Procedimientos realizados</Label>
                        <Textarea rows={4} value={procedures} onChange={(e) => setProcedures(e.target.value)} placeholder="Describa qué se le hizo al paciente..." />
                    </div>
                    <div className="space-y-2">
                        <Label>Indicaciones / observaciones</Label>
                        <Textarea rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Cuidados, medicamentos, próxima cita..." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!dentistId || !date || !procedures.trim() || isSaving}>
                        {isSaving ? "Guardando..." : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
