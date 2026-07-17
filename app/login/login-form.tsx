'use client'

import { useActionState, useState } from "react"
import { Eye, EyeOff, Lock, Mail, LoaderCircle, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticate } from "./actions"

export function LoginForm() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined)
    const [showPassword, setShowPassword] = useState(false)

    return (
        <form action={formAction} className="space-y-5">
            {/* Correo */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Correo electrónico</Label>
                <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="tucorreo@bluelips.com"
                        className="h-11 pl-10 focus-visible:border-[#22B8DC] focus-visible:ring-[#22B8DC]/30"
                    />
                </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Contraseña</Label>
                <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="h-11 px-10 focus-visible:border-[#22B8DC] focus-visible:ring-[#22B8DC]/30"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-[#22B8DC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22B8DC]/40"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Error */}
            {errorMessage && (
                <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-[#E23B2E]/25 bg-[#E23B2E]/5 px-3 py-2.5 text-sm text-[#C32C20]"
                >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Entrar */}
            <Button
                type="submit"
                disabled={isPending}
                className="group h-11 w-full bg-[#22B8DC] text-white shadow-sm transition-all hover:bg-[#0E97BC] hover:shadow-md disabled:opacity-70"
            >
                {isPending ? (
                    <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Entrando…
                    </>
                ) : (
                    <>
                        Entrar
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                )}
            </Button>

            <p className="pt-1 text-center text-xs text-slate-400">
                ¿Problemas para entrar? Contacta a tu administrador.
            </p>
        </form>
    )
}
