"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Eraser } from "lucide-react"

type SignaturePadProps = {
    onChange: (dataUrl: string | null) => void
}

/**
 * Lienzo para firmar con dedo, stylus o mouse. Entrega la firma como PNG
 * (data URL) o null cuando está vacío.
 */
export function SignaturePad({ onChange }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)
    const [isEmpty, setIsEmpty] = useState(true)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        // Ajusta la resolución real al tamaño en pantalla para trazos nítidos.
        const ratio = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * ratio
        canvas.height = rect.height * ratio
        const ctx = canvas.getContext("2d")!
        ctx.scale(ratio, ratio)
        ctx.lineWidth = 2.2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = "#0f172a"
    }, [])

    function point(e: React.PointerEvent<HTMLCanvasElement>) {
        const rect = e.currentTarget.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function start(e: React.PointerEvent<HTMLCanvasElement>) {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        drawing.current = true
        const ctx = e.currentTarget.getContext("2d")!
        const { x, y } = point(e)
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + 0.1, y + 0.1)
        ctx.stroke()
    }

    function move(e: React.PointerEvent<HTMLCanvasElement>) {
        if (!drawing.current) return
        const ctx = e.currentTarget.getContext("2d")!
        const { x, y } = point(e)
        ctx.lineTo(x, y)
        ctx.stroke()
    }

    function end() {
        if (!drawing.current) return
        drawing.current = false
        setIsEmpty(false)
        onChange(canvasRef.current!.toDataURL("image/png"))
    }

    function clear() {
        const canvas = canvasRef.current!
        canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height)
        setIsEmpty(true)
        onChange(null)
    }

    return (
        <div className="space-y-2">
            <div className="relative rounded-md border-2 border-dashed bg-white">
                <canvas
                    ref={canvasRef}
                    className="h-48 w-full touch-none cursor-crosshair"
                    onPointerDown={start}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerLeave={end}
                />
                {isEmpty && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                        Firme aquí
                    </span>
                )}
                <div className="pointer-events-none absolute bottom-8 left-6 right-6 border-b border-slate-300" />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={isEmpty}>
                <Eraser className="mr-2 h-4 w-4" /> Borrar firma
            </Button>
        </div>
    )
}
