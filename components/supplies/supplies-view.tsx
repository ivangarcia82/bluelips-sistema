"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, CalendarClock, Edit, Layers, PackageX, Plus, Search, Trash2, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    addSupplyStock,
    consumeSupplyStock,
    createSupply,
    deleteSupply,
    discardSupplyBatch,
    updateSupply,
    type SupplyAlertLevel,
} from "@/actions/supplies"
import { clinicToday, formatClinic } from "@/lib/timezone"
import { cn } from "@/lib/utils"

export type SupplyItem = {
    id: string
    name: string
    category: string
    unit: string
    minStock: number
    notes: string | null
    stock: number
    nextExpiry: string | null
    expiredQty: number
    expiringQty: number
    alerts: SupplyAlertLevel[]
    batches: { id: string; lot: string | null; quantity: number; expiryDate: string | null }[]
}

export type MovementItem = {
    id: string
    supplyName: string
    unit: string
    type: "IN" | "OUT"
    quantity: number
    reason: string | null
    userName: string | null
    createdAt: string
}

const ALERT_BADGES: Record<SupplyAlertLevel, { label: string; className: string }> = {
    out: { label: "Sin stock", className: "bg-red-100 text-red-800" },
    low: { label: "Bajo mínimo", className: "bg-amber-100 text-amber-800" },
    expired: { label: "Caducado", className: "bg-red-100 text-red-800" },
    expiring: { label: "Por caducar", className: "bg-orange-100 text-orange-800" },
}

type Dialogs =
    | { kind: "supply"; supply: SupplyItem | null }
    | { kind: "in" | "out" | "batches"; supply: SupplyItem }
    | null

export function SuppliesView({ supplies, movements }: { supplies: SupplyItem[]; movements: MovementItem[] }) {
    const [dialog, setDialog] = useState<Dialogs>(null)
    const [query, setQuery] = useState("")
    const [filter, setFilter] = useState<SupplyAlertLevel | "all">("all")

    const counts = useMemo(() => {
        const c: Record<SupplyAlertLevel, number> = { out: 0, low: 0, expired: 0, expiring: 0 }
        supplies.forEach((s) => s.alerts.forEach((a) => c[a]++))
        return c
    }, [supplies])

    const visible = supplies.filter((s) => {
        if (filter !== "all" && !s.alerts.includes(filter)) return false
        const q = query.trim().toLowerCase()
        return !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    })

    async function handleDelete(supply: SupplyItem) {
        if (!confirm(`¿Eliminar ${supply.name} y todo su historial?`)) return
        const res = await deleteSupply(supply.id)
        if (res.error) toast.error(res.error)
        else toast.success("Insumo eliminado")
    }

    const summary: { level: SupplyAlertLevel; label: string; icon: typeof AlertTriangle; tone: string }[] = [
        { level: "out", label: "Sin stock", icon: PackageX, tone: "text-red-600" },
        { level: "low", label: "Bajo mínimo", icon: TrendingDown, tone: "text-amber-600" },
        { level: "expired", label: "Caducados", icon: AlertTriangle, tone: "text-red-600" },
        { level: "expiring", label: "Caducan en 30 días", icon: CalendarClock, tone: "text-orange-600" },
    ]

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Insumos</h2>
                <Button onClick={() => setDialog({ kind: "supply", supply: null })}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo insumo
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {summary.map(({ level, label, icon: Icon, tone }) => (
                    <button
                        key={level}
                        type="button"
                        onClick={() => setFilter(filter === level ? "all" : level)}
                        className={cn(
                            "rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-slate-400 dark:bg-slate-950",
                            filter === level && "ring-2 ring-[#22B8DC]"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{label}</span>
                            <Icon className={cn("h-4 w-4", counts[level] > 0 ? tone : "text-slate-300")} />
                        </div>
                        <p className={cn("mt-1 text-2xl font-bold", counts[level] > 0 ? tone : "text-slate-400")}>{counts[level]}</p>
                    </button>
                ))}
            </div>

            <div className="rounded-lg border bg-white shadow-sm dark:bg-slate-950">
                <div className="flex flex-wrap items-center gap-2 border-b p-3">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar insumo o categoría..." className="pl-8" />
                    </div>
                    {filter !== "all" && (
                        <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
                            Quitar filtro: {ALERT_BADGES[filter].label}
                        </Button>
                    )}
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Insumo</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Mínimo</TableHead>
                            <TableHead>Próx. caducidad</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visible.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                    {supplies.length === 0 ? "Aún no hay insumos. Agregue el primero." : "Ningún insumo coincide."}
                                </TableCell>
                            </TableRow>
                        ) : visible.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell>{s.category}</TableCell>
                                <TableCell className="text-right tabular-nums">{s.stock} {s.unit}</TableCell>
                                <TableCell className="text-right tabular-nums">{s.minStock}</TableCell>
                                <TableCell>{s.nextExpiry ? formatClinic(s.nextExpiry, "dd/MM/yyyy") : "—"}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {s.alerts.length === 0 ? (
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">OK</Badge>
                                        ) : s.alerts.map((a) => (
                                            <Badge key={a} variant="secondary" className={ALERT_BADGES[a].className}>{ALERT_BADGES[a].label}</Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" title="Entrada" onClick={() => setDialog({ kind: "in", supply: s })}>
                                            <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Salida" onClick={() => setDialog({ kind: "out", supply: s })} disabled={s.stock === 0}>
                                            <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Lotes" onClick={() => setDialog({ kind: "batches", supply: s })}>
                                            <Layers className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Editar" onClick={() => setDialog({ kind: "supply", supply: s })}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Eliminar" onClick={() => handleDelete(s)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Movimientos recientes</CardTitle></CardHeader>
                <CardContent>
                    {movements.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin movimientos.</p>
                    ) : (
                        <div className="divide-y text-sm">
                            {movements.map((m) => (
                                <div key={m.id} className="flex items-center gap-3 py-2">
                                    {m.type === "IN"
                                        ? <ArrowDownToLine className="h-4 w-4 shrink-0 text-emerald-600" />
                                        : <ArrowUpFromLine className="h-4 w-4 shrink-0 text-red-600" />}
                                    <span className="flex-1">
                                        <span className="font-medium">{m.type === "IN" ? "+" : "−"}{m.quantity} {m.unit}</span> {m.supplyName}
                                        {m.reason && <span className="text-muted-foreground"> · {m.reason}</span>}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatClinic(m.createdAt, "dd/MM/yyyy HH:mm")}{m.userName && ` · ${m.userName}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {dialog?.kind === "supply" && <SupplyDialog supply={dialog.supply} onClose={() => setDialog(null)} />}
            {(dialog?.kind === "in" || dialog?.kind === "out") && (
                <StockDialog kind={dialog.kind} supply={dialog.supply} onClose={() => setDialog(null)} />
            )}
            {dialog?.kind === "batches" && <BatchesDialog supply={dialog.supply} onClose={() => setDialog(null)} />}
        </div>
    )
}

function SupplyDialog({ supply, onClose }: { supply: SupplyItem | null; onClose: () => void }) {
    const [name, setName] = useState(supply?.name ?? "")
    const [category, setCategory] = useState(supply?.category ?? "General")
    const [unit, setUnit] = useState(supply?.unit ?? "pza")
    const [minStock, setMinStock] = useState(String(supply?.minStock ?? 0))
    const [notes, setNotes] = useState(supply?.notes ?? "")
    const [isSaving, setIsSaving] = useState(false)

    async function handleSave() {
        setIsSaving(true)
        const data = { name: name.trim(), category: category.trim() || "General", unit: unit.trim() || "pza", minStock: Math.max(0, parseInt(minStock) || 0), notes }
        const res = supply ? await updateSupply(supply.id, data) : await createSupply(data)
        setIsSaving(false)
        if (res.error) return toast.error(res.error)
        toast.success(supply ? "Insumo actualizado" : "Insumo creado")
        onClose()
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>{supply ? "Editar insumo" : "Nuevo insumo"}</DialogTitle>
                    <DialogDescription>El stock se maneja con entradas y salidas.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Anestesia lidocaína 2%" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Categoría</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Anestésicos" /></div>
                        <div className="space-y-2"><Label>Unidad</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pza, caja, cartucho" /></div>
                    </div>
                    <div className="space-y-2">
                        <Label>Stock mínimo</Label>
                        <Input type="number" min={0} value={minStock} onChange={(e) => setMinStock(e.target.value)} />
                        <p className="text-xs text-muted-foreground">Se alerta cuando el stock llega a este número o menos.</p>
                    </div>
                    <div className="space-y-2"><Label>Notas</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Proveedor, ubicación..." /></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!name.trim() || isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function StockDialog({ kind, supply, onClose }: { kind: "in" | "out"; supply: SupplyItem; onClose: () => void }) {
    const [quantity, setQuantity] = useState("")
    const [lot, setLot] = useState("")
    const [expiryDate, setExpiryDate] = useState("")
    const [reason, setReason] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const qty = parseInt(quantity) || 0

    async function handleSave() {
        setIsSaving(true)
        const res = kind === "in"
            ? await addSupplyStock(supply.id, { quantity: qty, lot, expiryDate: expiryDate || null, reason })
            : await consumeSupplyStock(supply.id, { quantity: qty, reason })
        setIsSaving(false)
        if (res.error) return toast.error(res.error)
        toast.success(kind === "in" ? "Entrada registrada" : "Salida registrada")
        onClose()
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>{kind === "in" ? "Entrada" : "Salida"} · {supply.name}</DialogTitle>
                    <DialogDescription>
                        Stock actual: {supply.stock} {supply.unit}
                        {kind === "out" && " · se descuenta primero del lote que caduca antes"}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="space-y-2"><Label>Cantidad ({supply.unit})</Label><Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus /></div>
                    {kind === "in" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Lote (opcional)</Label><Input value={lot} onChange={(e) => setLot(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Caducidad</Label><Input type="date" min={clinicToday()} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Motivo (opcional)</Label>
                        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={kind === "in" ? "Compra a proveedor" : "Uso en consultorio"} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={qty <= 0 || isSaving}>{isSaving ? "Guardando..." : "Registrar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function BatchesDialog({ supply, onClose }: { supply: SupplyItem; onClose: () => void }) {
    const today = clinicToday()

    async function handleDiscard(batchId: string) {
        if (!confirm("¿Dar de baja este lote completo?")) return
        const res = await discardSupplyBatch(batchId)
        if (res.error) return toast.error(res.error)
        toast.success("Lote dado de baja")
        onClose()
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Lotes · {supply.name}</DialogTitle>
                    <DialogDescription>Lotes con existencia, ordenados por caducidad.</DialogDescription>
                </DialogHeader>
                {supply.batches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin existencias.</p>
                ) : (
                    <div className="divide-y text-sm">
                        {supply.batches.map((b) => {
                            const expiry = b.expiryDate ? formatClinic(b.expiryDate, "yyyy-MM-dd") : null
                            const expired = expiry !== null && expiry < today
                            return (
                                <div key={b.id} className="flex items-center gap-3 py-2">
                                    <div className="flex-1">
                                        <p className="font-medium">{b.quantity} {supply.unit}{b.lot && <span className="text-muted-foreground"> · Lote {b.lot}</span>}</p>
                                        <p className={cn("text-xs", expired ? "font-semibold text-red-600" : "text-muted-foreground")}>
                                            {b.expiryDate ? `${expired ? "Caducó" : "Caduca"} el ${formatClinic(b.expiryDate, "dd/MM/yyyy")}` : "Sin caducidad"}
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleDiscard(b.id)}>Dar de baja</Button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
