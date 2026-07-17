import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AppointmentDialog } from "@/components/agenda/appointment-dialog"
import { prisma } from "@/lib/prisma"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  const [dentists, servicesRaw, consultories] = await Promise.all([
    prisma.dentist.findMany(),
    prisma.service.findMany(),
    prisma.consultory.findMany()
  ])

  const services = servicesRaw.map((s) => ({
    ...s,
    price: s.price.toNumber()
  })) as any

  const today = new Date()

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto flex flex-col items-center justify-center gap-6 px-4 py-8 md:px-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Blue Lips Sistema Dental</h1>
          <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
            Maneja de forma eficiente tu consultorio dental.
          </p>
        </div>
        <div className="flex gap-4">
          <AppointmentDialog
            dentists={dentists}
            services={services}
            consultories={consultories}
            patients={[]}
            defaultDate={today}
          >
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">Agendar Cita</Button>
          </AppointmentDialog>
          <Link href="/login">
            <Button variant="outline" size="lg">Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
