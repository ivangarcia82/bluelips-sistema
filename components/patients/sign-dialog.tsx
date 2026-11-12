"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { SignaturePad } from "@/components/signature-pad"

type SignDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    defaultSignerName: string
    onSign: (signature: string, signerName: string) => Promise<boolean>
}

export function SignDialog({ open, onOpenChange, title, description, defaultSignerName, onSign }: SignDialogProps) {
    const [signature, setSignature] = useState<string | null>(null)
    const [signerName, setSignerName] = useState(defaultSignerName)
    const [isSaving, setIsSaving] = useState(false)

    async function handleSign() {
        if (!signature || !signerName.trim()) return
        setIsSaving(true)
        const ok = await onSign(signature, signerName.trim())
        setIsSaving(false)
        if (ok) {
            setSignature(null)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {/* key fuerza un lienzo limpio cada vez que se abre */}
                {open && <SignaturePad key="pad" onChange={setSignature} />}
                <div className="space-y-2">
                    <Label>Nombre de quien firma</Label>
                    <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Paciente o tutor" />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSign} disabled={!signature || !signerName.trim() || isSaving}>
                        {isSaving ? "Guardando..." : "Firmar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
