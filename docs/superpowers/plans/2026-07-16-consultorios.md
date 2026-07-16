# Gestión de Consultorios — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir al ADMIN crear, editar y eliminar consultorios desde Configuración, con un guard que impida borrar consultorios que tienen citas.

**Architecture:** Espejo exacto del patrón existente de Servicios: un archivo de server actions con CRUD (`actions/consultories.ts`), un diálogo de formulario reutilizable para crear/editar, una tabla cliente, y una página server component que los une. Se agrega la entrada al menú en `config/nav.ts` restringida a ADMIN.

**Tech Stack:** Next.js 16 (App Router, server actions), Prisma 7, React 19, react-hook-form + Zod, shadcn/ui, sonner (toasts), lucide-react.

## Global Constraints

- **Rol:** Consultorios es exclusivo de `ADMIN`. Va dentro del grupo "Configuración" en `config/nav.ts`.
- **Idioma:** toda la UI nueva va **en español** (el proyecto tiene idioma mixto; lo nuevo se escribe en español).
- **Guard de borrado:** `Appointment.consultoryId` tiene FK `ON DELETE RESTRICT`. Nunca dejar que reviente: contar citas antes de borrar y devolver un mensaje legible.
- **Errores al usuario:** usar `toast` de `sonner` (ya instalado y con `<Toaster />` montado en `app/layout.tsx`). **No usar `alert()`.**
- **Retorno de actions:** seguir el contrato existente — `{ success: true }` o `{ error: string }`. Nunca lanzar excepciones al cliente.
- **Sin tests:** el proyecto no tiene framework de tests. Verificación = `npx tsc --noEmit` + `npm run lint` + prueba en el navegador.
- **Modelo existente (no modificar):** `Consultory { id, name, description?, appointments[], createdAt, updatedAt }`.

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `actions/consultories.ts` (crear) | CRUD de consultorios + guard de borrado. Única puerta a la BD. |
| `components/consultories/consultory-dialog.tsx` (crear) | Formulario crear/editar (controlado o no). Solo formulario. |
| `components/consultories/consultory-table.tsx` (crear) | Render de la lista + acciones editar/eliminar. Solo presentación e interacción. |
| `app/dashboard/consultories/page.tsx` (crear) | Server component: carga datos y compone tabla + botón nuevo. |
| `config/nav.ts` (modificar) | Agregar entrada "Consultorios" en Configuración, `roles: ["ADMIN"]`. |

---

### Task 1: Server actions de consultorios

**Files:**
- Create: `actions/consultories.ts`

**Interfaces:**
- Consumes: `prisma` de `@/lib/prisma`.
- Produces:
  - `getConsultories(): Promise<Consultory[]>`
  - `createConsultory(data: { name: string; description?: string }): Promise<{ success: true } | { error: string }>`
  - `updateConsultory(id: string, data: { name: string; description?: string }): Promise<{ success: true } | { error: string }>`
  - `deleteConsultory(id: string): Promise<{ success: true } | { error: string }>`

- [ ] **Step 1: Crear el archivo de actions**

```ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const consultorySchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().optional(),
})

export async function getConsultories() {
    return await prisma.consultory.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { appointments: true } }
        }
    })
}

export async function createConsultory(data: { name: string; description?: string }) {
    const parsed = consultorySchema.safeParse(data)
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    try {
        await prisma.consultory.create({ data: parsed.data })
        revalidatePath('/dashboard/consultories')
        return { success: true as const }
    } catch (error) {
        console.error("createConsultory:", error)
        return { error: 'No se pudo crear el consultorio.' }
    }
}

export async function updateConsultory(id: string, data: { name: string; description?: string }) {
    const parsed = consultorySchema.safeParse(data)
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    try {
        await prisma.consultory.update({
            where: { id },
            data: parsed.data,
        })
        revalidatePath('/dashboard/consultories')
        return { success: true as const }
    } catch (error) {
        console.error("updateConsultory:", error)
        return { error: 'No se pudo actualizar el consultorio.' }
    }
}

export async function deleteConsultory(id: string) {
    try {
        const appointmentCount = await prisma.appointment.count({
            where: { consultoryId: id }
        })

        if (appointmentCount > 0) {
            return {
                error: `No se puede eliminar: el consultorio tiene ${appointmentCount} cita(s) asociada(s).`
            }
        }

        await prisma.consultory.delete({ where: { id } })
        revalidatePath('/dashboard/consultories')
        return { success: true as const }
    } catch (error) {
        console.error("deleteConsultory:", error)
        return { error: 'No se pudo eliminar el consultorio.' }
    }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit 2>&1 | grep "actions/consultories"`
Expected: sin salida (ningún error en el archivo).

- [ ] **Step 3: Commit**

```bash
git add actions/consultories.ts
git commit -m "feat(consultorios): server actions CRUD con guard de borrado"
```

---

### Task 2: Diálogo de crear/editar consultorio

**Files:**
- Create: `components/consultories/consultory-dialog.tsx`

**Interfaces:**
- Consumes: `createConsultory`, `updateConsultory` de Task 1.
- Produces: `<ConsultoryDialog children? consultory? open? onOpenChange? />` — `consultory` presente = modo edición.

- [ ] **Step 1: Crear el componente**

```tsx
'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Consultory } from "@prisma/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createConsultory, updateConsultory } from "@/actions/consultories"

const formSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().optional(),
})

interface ConsultoryDialogProps {
    children?: React.ReactNode
    consultory?: Consultory
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ConsultoryDialog({ children, consultory, open: controlledOpen, onOpenChange }: ConsultoryDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const form = useForm<any>({
        // @ts-ignore
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: consultory?.name || "",
            description: consultory?.description || "",
        },
    })

    async function onSubmit(values: any) {
        const result = consultory
            ? await updateConsultory(consultory.id, values)
            : await createConsultory(values)

        if (result && "error" in result) {
            toast.error(result.error)
            return
        }

        toast.success(consultory ? "Consultorio actualizado" : "Consultorio creado")
        setOpen(false)
        form.reset()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{consultory ? "Editar consultorio" : "Nuevo consultorio"}</DialogTitle>
                    <DialogDescription>
                        {consultory ? "Actualiza los datos del consultorio." : "Agrega un consultorio al sistema."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Consultorio 1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Planta baja, con rayos X..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className="bg-[#22B8DC] text-white hover:bg-[#0E97BC]"
                            >
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {consultory ? "Actualizar" : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit 2>&1 | grep "consultory-dialog"`
Expected: sin salida.

- [ ] **Step 3: Commit**

```bash
git add components/consultories/consultory-dialog.tsx
git commit -m "feat(consultorios): diálogo de crear/editar"
```

---

### Task 3: Tabla de consultorios

**Files:**
- Create: `components/consultories/consultory-table.tsx`

**Interfaces:**
- Consumes: `deleteConsultory` (Task 1), `<ConsultoryDialog />` (Task 2).
- Produces: `<ConsultoryTable consultories={ConsultoryWithCount[]} />` donde
  `ConsultoryWithCount = Consultory & { _count: { appointments: number } }`.

- [ ] **Step 1: Crear el componente**

```tsx
'use client'

import { useState } from "react"
import { Consultory } from "@prisma/client"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2 } from "lucide-react"
import { ConsultoryDialog } from "./consultory-dialog"
import { deleteConsultory } from "@/actions/consultories"

type ConsultoryWithCount = Consultory & { _count: { appointments: number } }

interface ConsultoryTableProps {
    consultories: ConsultoryWithCount[]
}

export function ConsultoryTable({ consultories }: ConsultoryTableProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function handleDelete(consultory: ConsultoryWithCount) {
        if (!confirm(`¿Eliminar "${consultory.name}"? Esta acción no se puede deshacer.`)) return

        setDeletingId(consultory.id)
        const result = await deleteConsultory(consultory.id)
        setDeletingId(null)

        if (result && "error" in result) {
            toast.error(result.error)
            return
        }
        toast.success("Consultorio eliminado")
    }

    if (consultories.length === 0) {
        return (
            <div className="p-10 text-center text-sm text-muted-foreground">
                Aún no hay consultorios. Crea el primero para poder agendar citas.
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Citas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {consultories.map((consultory) => (
                    <TableRow key={consultory.id}>
                        <TableCell className="font-medium">{consultory.name}</TableCell>
                        <TableCell className="max-w-[280px] truncate text-muted-foreground">
                            {consultory.description || "—"}
                        </TableCell>
                        <TableCell className="text-right">{consultory._count.appointments}</TableCell>
                        <TableCell className="flex items-center justify-end gap-2 text-right">
                            <ConsultoryDialog consultory={consultory}>
                                <Button variant="ghost" size="icon" aria-label={`Editar ${consultory.name}`}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </ConsultoryDialog>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Eliminar ${consultory.name}`}
                                disabled={deletingId === consultory.id}
                                onClick={() => handleDelete(consultory)}
                            >
                                {deletingId === consultory.id
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Trash2 className="h-4 w-4 text-[#E23B2E]" />}
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit 2>&1 | grep "consultory-table"`
Expected: sin salida.

- [ ] **Step 3: Commit**

```bash
git add components/consultories/consultory-table.tsx
git commit -m "feat(consultorios): tabla con acciones y estado vacío"
```

---

### Task 4: Página y entrada de menú

**Files:**
- Create: `app/dashboard/consultories/page.tsx`
- Modify: `config/nav.ts`

**Interfaces:**
- Consumes: `getConsultories` (Task 1), `<ConsultoryTable />` (Task 3), `<ConsultoryDialog />` (Task 2).
- Produces: ruta `/dashboard/consultories` visible en el menú solo para ADMIN.

- [ ] **Step 1: Crear la página**

```tsx
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getConsultories } from "@/actions/consultories"
import { ConsultoryDialog } from "@/components/consultories/consultory-dialog"
import { ConsultoryTable } from "@/components/consultories/consultory-table"

export default async function ConsultoriesPage() {
    const consultories = await getConsultories()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Consultorios</h2>
                    <p className="text-muted-foreground">
                        Administra los consultorios disponibles para agendar citas.
                    </p>
                </div>
                <ConsultoryDialog>
                    <Button className="bg-[#22B8DC] text-white hover:bg-[#0E97BC]">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo consultorio
                    </Button>
                </ConsultoryDialog>
            </div>

            <div className="rounded-lg border bg-white shadow-sm dark:bg-slate-950">
                <ConsultoryTable consultories={consultories} />
            </div>
        </div>
    )
}
```

- [ ] **Step 2: Agregar la entrada al menú**

En `config/nav.ts`, dentro del grupo `"Configuración"`, agregar el ítem **antes** de "Servicios" (orden: Consultorios, Servicios, Dentistas, Usuarios). El grupo ya tiene `roles: ["ADMIN"]`, así que hereda la restricción.

Importar el ícono `Building2` en la línea de imports de `lucide-react` y agregar:

```ts
{
    title: "Consultorios",
    href: "/dashboard/consultories",
    icon: Building2,
},
```

- [ ] **Step 3: Verificar tipos y lint**

Run: `npx tsc --noEmit 2>&1 | grep -E "consultor|nav.ts"`
Expected: sin salida.

Run: `npm run lint`
Expected: sin errores nuevos.

- [ ] **Step 4: Verificar en el navegador**

Con el servidor de dev corriendo y sesión de ADMIN (`admin@bluelips.com` / `admin123`):

1. Ir a `/dashboard/consultories` → debe listar los 4 consultorios existentes con su conteo de citas.
2. Confirmar que "Consultorios" aparece en el menú bajo **Configuración**.
3. **Crear:** "Consultorio 5" → toast "Consultorio creado", aparece en la tabla.
4. **Editar:** cambiar su descripción → toast "Consultorio actualizado", se refleja.
5. **Eliminar sin citas:** borrar "Consultorio 5" → toast "Consultorio eliminado", desaparece.
6. **Guard de borrado:** intentar borrar un consultorio **con citas** → toast rojo *"No se puede eliminar: el consultorio tiene N cita(s) asociada(s)."* y **no** se borra.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/consultories/page.tsx config/nav.ts
git commit -m "feat(consultorios): página y entrada de menú (solo ADMIN)"
```

---

## Verificación final del subsistema

- [ ] `npx tsc --noEmit` sin errores nuevos.
- [ ] `npm run lint` sin errores nuevos.
- [ ] CRUD completo probado en el navegador (crear, editar, borrar).
- [ ] Guard de borrado probado con un consultorio que tiene citas.
- [ ] La entrada de menú **no** aparece para un usuario RECEPCIONISTA o DENTISTA.
