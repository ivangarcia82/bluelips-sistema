import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
    title: "Iniciar sesión · Blue Lips",
    description: "Acceso al sistema de gestión dental Blue Lips.",
}

export default async function LoginPage() {
    const session = await auth()
    if (session) {
        redirect("/dashboard")
    }

    return (
        <main className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]">
            {/* ---------- Panel de marca (la sonrisa Blue Lips) ---------- */}
            <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#27BEE0] via-[#1AA6CC] to-[#0C6E89] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
                {/* Atmósfera */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#0A5E76]/40 blur-2xl" />

                {/* Firma: la sonrisa Blue Lips (grin hacia arriba) */}
                <svg
                    aria-hidden
                    viewBox="0 0 320 180"
                    className="bl-float pointer-events-none absolute -bottom-8 left-1/2 w-[34rem] max-w-[92%] -translate-x-1/2 text-white/15"
                >
                    {/* sonrisa */}
                    <path d="M26 54 Q160 196 294 54 Q160 112 26 54 Z" fill="currentColor" />
                    {/* dientes (sutiles) */}
                    <g className="text-white/25">
                        <path d="M104 78 L120 73" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
                        <path d="M152 84 L168 84" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
                        <path d="M200 73 L216 78" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
                    </g>
                </svg>

                {/* Encabezado de marca */}
                <div className="bl-fade-up relative z-10 flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm">
                        <Image src="/logo.png" alt="" width={40} height={40} className="h-9 w-9 object-contain" />
                    </span>
                    <span className="text-lg font-semibold tracking-tight text-white">Blue Lips</span>
                </div>

                {/* Mensaje */}
                <div className="bl-fade-up relative z-10 max-w-md" style={{ animationDelay: "80ms" }}>
                    <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-5xl">
                        Bienvenido
                        <br />
                        de vuelta.
                    </h1>
                    <p className="mt-5 text-base leading-relaxed text-white/85">
                        El sistema que mantiene tu consultorio en orden — agenda, pacientes,
                        cobros y comisiones, en un solo lugar.
                    </p>

                    <ul className="mt-8 flex flex-wrap gap-2">
                        {["Agenda", "Pacientes", "Cobros", "Reportes"].map((chip) => (
                            <li
                                key={chip}
                                className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm"
                            >
                                {chip}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Pie de marca */}
                <p className="bl-fade-up relative z-10 text-sm text-white/60" style={{ animationDelay: "160ms" }}>
                    Sistema de gestión dental
                </p>
            </section>

            {/* ---------- Panel del formulario ---------- */}
            <section className="relative flex flex-col items-center justify-center bg-[#F4FBFD] px-5 py-10 sm:px-8">
                {/* Acento cian superior solo en móvil */}
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#27BEE0] to-[#0C6E89] lg:hidden" />

                <div className="bl-rise w-full max-w-sm">
                    {/* Logo */}
                    <div className="mb-8 flex flex-col items-center text-center">
                        <Image
                            src="/logo.png"
                            alt="Blue Lips"
                            width={132}
                            height={132}
                            priority
                            className="h-20 w-auto object-contain"
                        />
                        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
                            Iniciar sesión
                        </h2>
                        <p className="mt-1.5 text-sm text-slate-500">
                            Ingresa con tu cuenta para entrar al panel.
                        </p>
                    </div>

                    {/* Tarjeta del formulario */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_-12px_rgba(12,110,137,0.25)] sm:p-7">
                        <LoginForm />
                    </div>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        © {new Date().getFullYear()} Blue Lips · Sistema Dental
                    </p>
                </div>
            </section>
        </main>
    )
}
