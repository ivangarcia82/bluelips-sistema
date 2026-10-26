"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { saveMedicalHistory, signMedicalHistory } from "@/actions/patients"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { FileDown, Lock, PenLine, ShieldCheck } from "lucide-react"
import { SignDialog } from "@/components/patients/sign-dialog"
import { formatClinic } from "@/lib/timezone"
import { CONDITIONS } from "@/lib/medical-history"

const formSchema = z.object({
    gender: z.string().optional().nullable(),
    occupation: z.string().optional().nullable(),
    homePhone: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    consultationReason: z.string().optional().nullable(),
    allergies: z.boolean().default(false),
    heartProblems: z.boolean().default(false),
    hypertension: z.boolean().default(false),
    hypotension: z.boolean().default(false),
    venerealDiseases: z.boolean().default(false),
    rheumaticFever: z.boolean().default(false),
    hepatitis: z.boolean().default(false),
    ulcers: z.boolean().default(false),
    headache: z.boolean().default(false),
    hiv: z.boolean().default(false),
    epilepsy: z.boolean().default(false),
    arthritis: z.boolean().default(false),
    cancer: z.boolean().default(false),
    diabetes: z.boolean().default(false),
    nervousAlterations: z.boolean().default(false),
    renalAlterations: z.boolean().default(false),
    sinusitis: z.boolean().default(false),
    pregnancy: z.boolean().default(false),
    otherConditions: z.string().optional().nullable(),
    underMedicalTreatment: z.boolean().default(false),
    medicalTreatmentDetails: z.string().optional().nullable(),
    smokes: z.boolean().default(false),
    smokesWhat: z.string().optional().nullable(),
    smokesHowMuch: z.string().optional().nullable(),
    lastDentalVisit: z.string().optional().nullable(),
    referralSource: z.string().optional().nullable(),
})

type MedicalHistoryFormProps = {
    patient: any
    medicalHistory: any | null
}


export function MedicalHistoryForm({ patient, medicalHistory }: MedicalHistoryFormProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [signOpen, setSignOpen] = useState(false)

    const isSigned = !!medicalHistory?.signedAt
    const isLocked = isSigned && !isEditing

    async function handleSign(signature: string, signerName: string) {
        const res = await signMedicalHistory(patient.id, signature, signerName)
        if (res.error) {
            toast.error(res.error)
            return false
        }
        toast.success("Historia clínica firmada")
        setIsEditing(false)
        return true
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            gender: patient.gender || "",
            occupation: patient.occupation || "",
            homePhone: patient.homePhone || "",
            phone: patient.phone || "",
            consultationReason: medicalHistory?.consultationReason || "",
            allergies: medicalHistory?.allergies ?? false,
            heartProblems: medicalHistory?.heartProblems ?? false,
            hypertension: medicalHistory?.hypertension ?? false,
            hypotension: medicalHistory?.hypotension ?? false,
            venerealDiseases: medicalHistory?.venerealDiseases ?? false,
            rheumaticFever: medicalHistory?.rheumaticFever ?? false,
            hepatitis: medicalHistory?.hepatitis ?? false,
            ulcers: medicalHistory?.ulcers ?? false,
            headache: medicalHistory?.headache ?? false,
            hiv: medicalHistory?.hiv ?? false,
            epilepsy: medicalHistory?.epilepsy ?? false,
            arthritis: medicalHistory?.arthritis ?? false,
            cancer: medicalHistory?.cancer ?? false,
            diabetes: medicalHistory?.diabetes ?? false,
            nervousAlterations: medicalHistory?.nervousAlterations ?? false,
            renalAlterations: medicalHistory?.renalAlterations ?? false,
            sinusitis: medicalHistory?.sinusitis ?? false,
            pregnancy: medicalHistory?.pregnancy ?? false,
            otherConditions: medicalHistory?.otherConditions || "",
            underMedicalTreatment: medicalHistory?.underMedicalTreatment ?? false,
            medicalTreatmentDetails: medicalHistory?.medicalTreatmentDetails || "",
            smokes: medicalHistory?.smokes ?? false,
            smokesWhat: medicalHistory?.smokesWhat || "",
            smokesHowMuch: medicalHistory?.smokesHowMuch || "",
            lastDentalVisit: medicalHistory?.lastDentalVisit || "",
            referralSource: medicalHistory?.referralSource || "",
        },
    })

    const watchUnderTreatment = form.watch("underMedicalTreatment")
    const watchSmokes = form.watch("smokes")

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSaving(true)
        const toastId = toast.loading("Guardando historia clínica...")
        
        try {
            const general = {
                gender: values.gender,
                occupation: values.occupation,
                homePhone: values.homePhone,
                phone: values.phone,
            }
            
            const history = {
                consultationReason: values.consultationReason,
                allergies: values.allergies,
                heartProblems: values.heartProblems,
                hypertension: values.hypertension,
                hypotension: values.hypotension,
                venerealDiseases: values.venerealDiseases,
                rheumaticFever: values.rheumaticFever,
                hepatitis: values.hepatitis,
                ulcers: values.ulcers,
                headache: values.headache,
                hiv: values.hiv,
                epilepsy: values.epilepsy,
                arthritis: values.arthritis,
                cancer: values.cancer,
                diabetes: values.diabetes,
                nervousAlterations: values.nervousAlterations,
                renalAlterations: values.renalAlterations,
                sinusitis: values.sinusitis,
                pregnancy: values.pregnancy,
                otherConditions: values.otherConditions,
                underMedicalTreatment: values.underMedicalTreatment,
                medicalTreatmentDetails: values.medicalTreatmentDetails,
                smokes: values.smokes,
                smokesWhat: values.smokesWhat,
                smokesHowMuch: values.smokesHowMuch,
                lastDentalVisit: values.lastDentalVisit,
                referralSource: values.referralSource,
            }

            const res = await saveMedicalHistory(patient.id, { general, history })
            
            if (res.error) throw new Error(res.error)
            
            toast.success("Historia clínica guardada. Falta la firma del paciente.", { id: toastId })
            setIsEditing(false)
            setSignOpen(true)
        } catch (error) {
            toast.error("Ocurrió un error al guardar", { id: toastId })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
            <SignatureStatus
                patientId={patient.id}
                medicalHistory={medicalHistory}
                isEditing={isEditing}
                onEdit={() => setIsEditing(true)}
                onSign={() => setSignOpen(true)}
            />
            <SignDialog
                open={signOpen}
                onOpenChange={setSignOpen}
                title="Firma de la historia clínica"
                description="El paciente (o su tutor) confirma que la información es verídica. Una vez firmada, la historia no podrá modificarse sin volver a firmar."
                defaultSignerName={patient.tutorName || patient.name || ""}
                onSign={handleSign}
            />
            <fieldset disabled={isLocked} className="space-y-6 disabled:opacity-90">
            <Card>
                <CardHeader>
                    <CardTitle>Datos Generales</CardTitle>
                    <CardDescription>Información complementaria del paciente</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Sexo</Label>
                        <Combobox
                            options={[
                                { value: "Femenino", label: "Femenino" },
                                { value: "Masculino", label: "Masculino" },
                                { value: "Otro", label: "Otro" },
                            ]}
                            value={form.watch("gender") || ""}
                            onChange={(val) => form.setValue("gender", val)}
                            placeholder="Seleccione..."
                            searchPlaceholder="Buscar..."
                            emptyText="Sin opciones."
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Ocupación</Label>
                        <Input {...form.register("occupation")} />
                    </div>

                    <div className="space-y-2">
                        <Label>Celular</Label>
                        <Input {...form.register("phone")} />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Teléfono de Casa</Label>
                        <Input {...form.register("homePhone")} />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label>Motivo de la consulta</Label>
                        <Textarea {...form.register("consultationReason")} rows={2} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Afecciones Médicas</CardTitle>
                    <CardDescription>Marque si presenta alguna de las siguientes afecciones</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                        {CONDITIONS.map((cond) => (
                            <div key={cond.name} className="flex items-center space-x-2">
                                <Switch 
                                    id={cond.name}
                                    checked={form.watch(cond.name as any)}
                                    onCheckedChange={(val) => form.setValue(cond.name as any, val)}
                                />
                                <Label htmlFor={cond.name} className="font-normal cursor-pointer text-sm">
                                    {cond.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 space-y-2">
                        <Label>Otras afecciones</Label>
                        <Input {...form.register("otherConditions")} placeholder="Especifique..." />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Cuestionario Médico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center space-x-2 min-w-[250px]">
                            <Switch 
                                id="underMedicalTreatment"
                                checked={watchUnderTreatment}
                                onCheckedChange={(val) => form.setValue("underMedicalTreatment", val)}
                            />
                            <Label htmlFor="underMedicalTreatment">¿Bajo tratamiento médico actualmente?</Label>
                        </div>
                        {watchUnderTreatment && (
                            <div className="flex-1">
                                <Input {...form.register("medicalTreatmentDetails")} placeholder="¿Cuál?" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center space-x-2 min-w-[250px]">
                            <Switch 
                                id="smokes"
                                checked={watchSmokes}
                                onCheckedChange={(val) => form.setValue("smokes", val)}
                            />
                            <Label htmlFor="smokes">¿Fuma?</Label>
                        </div>
                        {watchSmokes && (
                            <div className="flex-1 flex gap-2">
                                <Input {...form.register("smokesWhat")} placeholder="¿Cuál? (ej. Tabaco, Vape)" />
                                <Input {...form.register("smokesHowMuch")} placeholder="¿Cuánto?" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>¿Cuánto fue su última consulta dental?</Label>
                        <Input {...form.register("lastDentalVisit")} />
                    </div>

                    <div className="space-y-2">
                        <Label>¿Cómo se enteró del consultorio?</Label>
                        <Input {...form.register("referralSource")} />
                    </div>
                </CardContent>
            </Card>

            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground border">
                <strong>Declaración:</strong> Declaro que he contestado todas las preguntas con honestidad y según mi conocimiento, así mismo he sido informado que los datos proporcionados en la presente historia clínica son confidenciales, para el uso del profesional de salud, y amparada por el secreto profesional.
            </div>

            {!isLocked && (
                <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? "Guardando..." : isSigned ? "Guardar cambios y volver a firmar" : "Guardar Historia Clínica"}
                </Button>
            )}
            </fieldset>
        </form>
    )
}

function SignatureStatus({ patientId, medicalHistory, isEditing, onEdit, onSign }: {
    patientId: string
    medicalHistory: any | null
    isEditing: boolean
    onEdit: () => void
    onSign: () => void
}) {
    const printLink = (
        <Button type="button" variant="outline" size="sm" asChild>
            <a href={`/print/patients/${patientId}/history`} target="_blank" rel="noreferrer">
                <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
            </a>
        </Button>
    )

    if (!medicalHistory) {
        return (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                Llene la historia clínica y guárdela; después el paciente deberá firmarla.
            </div>
        )
    }

    if (medicalHistory.signedAt && isEditing) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/10 dark:text-amber-400">
                <PenLine className="h-5 w-5 shrink-0" />
                Editando una historia firmada. Al guardar se eliminará la firma actual y el paciente deberá firmar de nuevo.
            </div>
        )
    }

    if (medicalHistory.signedAt) {
        return (
            <div className="flex flex-col gap-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm sm:flex-row sm:items-center dark:bg-emerald-900/10">
                <div className="flex flex-1 items-center gap-3 text-emerald-900 dark:text-emerald-400">
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold">Firmada por {medicalHistory.signerName}</p>
                        <p>{formatClinic(medicalHistory.signedAt, "dd/MM/yyyy HH:mm")} · <Lock className="inline h-3 w-3" /> Bloqueada para edición</p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={medicalHistory.signature} alt="Firma" className="ml-auto hidden h-14 rounded bg-white px-2 sm:block" />
                </div>
                <div className="flex gap-2">
                    {printLink}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                                <PenLine className="mr-2 h-4 w-4" /> Editar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Editar historia firmada?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Si guarda cambios, la firma actual se eliminará y el paciente tendrá que volver a firmar.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={onEdit}>Editar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center dark:bg-amber-900/10">
            <div className="flex flex-1 items-center gap-3 text-amber-900 dark:text-amber-400">
                <PenLine className="h-5 w-5 shrink-0" />
                <p><span className="font-semibold">Pendiente de firma.</span> La historia clínica aún no ha sido firmada por el paciente.</p>
            </div>
            <div className="flex gap-2">
                {printLink}
                <Button type="button" size="sm" onClick={onSign}>
                    <PenLine className="mr-2 h-4 w-4" /> Firmar
                </Button>
            </div>
        </div>
    )
}
