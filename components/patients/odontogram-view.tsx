"use client"

import { useState } from "react"
import { saveOdontogramCondition, clearOdontogramCondition } from "@/actions/odontogram"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const ADULT_TOP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const ADULT_BOTTOM = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

const PEDIATRIC_TOP = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
const PEDIATRIC_BOTTOM = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]

const CONDITIONS = [
    { value: "SANO", label: "Sano", color: "bg-white dark:bg-slate-800" },
    { value: "CARIES", label: "Caries", color: "bg-red-500 text-white" },
    { value: "RESINA", label: "Resina / Obturación", color: "bg-blue-500 text-white" },
    { value: "AUSENTE", label: "Ausente / Extracción", color: "bg-gray-400 text-white" },
    { value: "CORONA", label: "Corona", color: "bg-amber-500 text-white" },
    { value: "IMPLANTE", label: "Implante", color: "bg-purple-500 text-white" },
]

export function OdontogramView({ patientId, conditions }: { patientId: string, conditions: any[] }) {
    const [activeTab, setActiveTab] = useState("ADULT")
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [notes, setNotes] = useState("")
    
    // Derived state for quick lookup
    const conditionMap = conditions.reduce((acc, curr) => {
        if (!acc[curr.type]) acc[curr.type] = {}
        acc[curr.type][curr.toothId] = curr
        return acc
    }, {} as Record<string, Record<number, any>>)

    const handleToothClick = (tooth: number) => {
        setSelectedTooth(tooth)
        const existing = conditionMap[activeTab]?.[tooth]
        setNotes(existing?.notes || "")
    }

    const handleSaveCondition = async (conditionValue: string) => {
        if (!selectedTooth) return

        setIsSaving(true)
        const toastId = toast.loading("Guardando...")

        try {
            if (conditionValue === "SANO") {
                await clearOdontogramCondition({
                    patientId,
                    toothId: selectedTooth,
                    type: activeTab
                })
            } else {
                await saveOdontogramCondition({
                    patientId,
                    toothId: selectedTooth,
                    type: activeTab,
                    condition: conditionValue,
                    notes: notes
                })
            }
            toast.success("Condición guardada", { id: toastId })
            setSelectedTooth(null)
        } catch (e) {
            toast.error("Error al guardar", { id: toastId })
        } finally {
            setIsSaving(false)
        }
    }

    const getToothStyle = (toothId: number, type: string) => {
        const cond = conditionMap[type]?.[toothId]
        if (!cond) return "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
        
        const matched = CONDITIONS.find(c => c.value === cond.condition)
    return matched ? `${matched.color} border-transparent text-white` : "bg-white text-slate-800 border-slate-300"
    }

    const ToothRow = ({ teeth, type, pos }: { teeth: number[], type: string, pos: "TOP" | "BOTTOM" }) => (
        <div className="relative w-[640px] h-[220px] mx-auto my-4 shrink-0">
            {teeth.map((t, i) => {
                const styleName = getToothStyle(t, type)
                
                const u = (i - (teeth.length - 1) / 2) / ((teeth.length - 1) / 2); // Rango de -1 a 1
                const rx = 290;
                const ry = 130;
                
                const x = u * rx; 
                const y = Math.pow(Math.abs(u), 1.5) * ry; // Curva

                // Cálculo para no desbordar el contenedor:
                const finalY = pos === "TOP" ? y : ry - y;

                // Derivada
                const dy = 1.6 * Math.pow(Math.abs(u), 0.6) * ry * Math.sign(u); 
                let rotation = Math.atan2(dy, rx) * (180 / Math.PI);
                if (pos === "BOTTOM") rotation = -rotation;

                const toothShape = "rounded-[20%_20%_45%_45%]" 

                return (
                    <div 
                        key={t} 
                        className="absolute left-1/2 top-6 flex flex-col items-center z-10 pointer-events-none hover:z-50"
                        style={{ 
                            transform: `translate(calc(-50% + ${x}px), ${finalY}px) rotate(${rotation}deg)`
                        }}
                    >
                        {pos === "TOP" && (
                            <span className="text-xs text-slate-500 mb-1 font-bold">{t}</span>
                        )}
                        
                        <button 
                            onClick={() => handleToothClick(t)}
                            className={`w-9 h-12 border-2 flex items-center justify-center font-bold text-sm drop-shadow-sm ${toothShape} ${styleName} transition-all duration-200 hover:scale-125 overflow-hidden relative pointer-events-auto cursor-pointer`}
                            title={`Diente ${t}`}
                        >
                            <div className="absolute top-0 right-1 w-1/3 h-full bg-gradient-to-r from-transparent to-white/30 rounded-full" />
                        </button>

                        {pos === "BOTTOM" && (
                            <span className="text-xs text-slate-500 mt-1 font-bold" style={{ transform: `rotate(180deg)` }}>{t}</span>
                        )}
                    </div>
                )
            })}
        </div>
    )

    const activeConditions = conditions.filter(c => c.type === activeTab)

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-6">
                    <TabsList className="grid w-[400px] grid-cols-2">
                        <TabsTrigger value="ADULT">Adulto</TabsTrigger>
                        <TabsTrigger value="PEDIATRIC">Pediátrico</TabsTrigger>
                    </TabsList>
                </div>
                
                <Card className="bg-slate-50 dark:bg-slate-900/50 border shadow-inner flex min-h-[400px] rounded-3xl mx-auto max-w-4xl overflow-x-auto py-10 w-full hidden-scrollbar">
                    <CardContent className="p-0 sm:p-2 min-w-max mx-auto flex flex-col items-center justify-center w-full">
                        <TabsContent value="ADULT" className="m-0 w-full flex flex-col items-center gap-16">
                            <ToothRow teeth={ADULT_TOP} type="ADULT" pos="TOP" />
                            <ToothRow teeth={ADULT_BOTTOM} type="ADULT" pos="BOTTOM" />
                        </TabsContent>
                        
                        <TabsContent value="PEDIATRIC" className="m-0 w-full flex flex-col items-center gap-16">
                            <ToothRow teeth={PEDIATRIC_TOP} type="PEDIATRIC" pos="TOP" />
                            <ToothRow teeth={PEDIATRIC_BOTTOM} type="PEDIATRIC" pos="BOTTOM" />
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>

            <div className="flex justify-center gap-4 flex-wrap text-sm pt-4">
                {CONDITIONS.map(cond => (
                    <div key={cond.value} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border ${cond.color}`} />
                        <span>{cond.label}</span>
                    </div>
                ))}
            </div>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Historial de Notas Clínicas (Dentición {activeTab === 'ADULT' ? 'Adulta' : 'Pediátrica'})</CardTitle>
                </CardHeader>
                <CardContent>
                    {activeConditions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay notas registradas para esta dentición.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeConditions.map(cond => (
                                <div key={cond.id} className="border p-4 rounded-lg flex gap-4 bg-card shadow-sm">
                                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg ${getToothStyle(cond.toothId, cond.type)}`}>
                                        {cond.toothId}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <p className="font-semibold">{CONDITIONS.find(c => c.value === cond.condition)?.label || cond.condition}</p>
                                        <p className="text-xs text-muted-foreground my-1">{format(new Date(cond.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                                        {cond.notes && <p className="text-sm italic border-t pt-1 mt-1 text-slate-700 dark:text-slate-300">{cond.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedTooth} onOpenChange={(open) => !open && setSelectedTooth(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Diente {selectedTooth}</DialogTitle>
                        <DialogDescription>
                            Registra la condición actual del diente. Selecciona "Sano" para limpiarlo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Notas descriptivas (opcional)</Label>
                            <Textarea 
                                placeholder="Especifique cara, detalles de la resina, etc..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                        
                        <Label className="block pt-2">Selecciona la condición:</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {CONDITIONS.map(cond => (
                                <Button 
                                    key={cond.value}
                                    variant="outline" 
                                    onClick={() => handleSaveCondition(cond.value)}
                                    disabled={isSaving}
                                    className={`justify-start hover:${cond.color.split(' ')[0]} ${cond.value !== 'SANO' ? 'hover:text-white' : ''}`}
                                >
                                    <div className={`w-3 h-3 rounded-full mr-2 ${cond.color} ${cond.value === 'SANO' ? 'border' : ''}`} />
                                    {cond.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
