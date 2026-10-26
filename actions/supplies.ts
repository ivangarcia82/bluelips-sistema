'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { clinicWallTimeToUtc } from "@/lib/timezone"

// Días antes de la caducidad en que un lote empieza a alertar.
const EXPIRY_WARNING_DAYS = 30

export type SupplyAlertLevel = "expired" | "expiring" | "low" | "out"

export async function getSupplies() {
    const supplies = await prisma.supply.findMany({
        include: { batches: { where: { quantity: { gt: 0 } }, orderBy: { expiryDate: 'asc' } } },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    const now = new Date()
    const warnLimit = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000)

    return supplies.map((s) => {
        const stock = s.batches.reduce((sum, b) => sum + b.quantity, 0)
        const nextExpiry = s.batches.find((b) => b.expiryDate)?.expiryDate ?? null
        const expiredQty = s.batches.filter((b) => b.expiryDate && b.expiryDate < now).reduce((sum, b) => sum + b.quantity, 0)
        const expiringQty = s.batches
            .filter((b) => b.expiryDate && b.expiryDate >= now && b.expiryDate <= warnLimit)
            .reduce((sum, b) => sum + b.quantity, 0)

        const alerts: SupplyAlertLevel[] = []
        if (stock === 0) alerts.push("out")
        else if (stock <= s.minStock) alerts.push("low")
        if (expiredQty > 0) alerts.push("expired")
        if (expiringQty > 0) alerts.push("expiring")

        return {
            id: s.id,
            name: s.name,
            category: s.category,
            unit: s.unit,
            minStock: s.minStock,
            notes: s.notes,
            stock,
            nextExpiry: nextExpiry?.toISOString() ?? null,
            expiredQty,
            expiringQty,
            alerts,
            batches: s.batches.map((b) => ({
                id: b.id,
                lot: b.lot,
                quantity: b.quantity,
                expiryDate: b.expiryDate?.toISOString() ?? null,
            })),
        }
    })
}

export async function getSupplyMovements(limit = 30) {
    const movements = await prisma.supplyMovement.findMany({
        include: { supply: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
    })
    return movements.map((m) => ({
        id: m.id,
        supplyName: m.supply.name,
        unit: m.supply.unit,
        type: m.type,
        quantity: m.quantity,
        reason: m.reason,
        userName: m.userName,
        createdAt: m.createdAt.toISOString(),
    }))
}

type SupplyInput = { name: string; category: string; unit: string; minStock: number; notes?: string | null }

export async function createSupply(data: SupplyInput) {
    try {
        await prisma.supply.create({ data: { ...data, notes: data.notes || null } })
        revalidatePath('/dashboard/supplies')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo crear el insumo' }
    }
}

export async function updateSupply(id: string, data: SupplyInput) {
    try {
        await prisma.supply.update({ where: { id }, data: { ...data, notes: data.notes || null } })
        revalidatePath('/dashboard/supplies')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo actualizar el insumo' }
    }
}

export async function deleteSupply(id: string) {
    try {
        await prisma.supply.delete({ where: { id } })
        revalidatePath('/dashboard/supplies')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo eliminar el insumo' }
    }
}

async function currentUserName() {
    const session = await auth()
    return session?.user?.name ?? session?.user?.email ?? null
}

// Entrada de stock: crea un lote con su caducidad.
export async function addSupplyStock(supplyId: string, data: { quantity: number; lot?: string | null; expiryDate?: string | null; reason?: string | null }) {
    try {
        if (!Number.isInteger(data.quantity) || data.quantity <= 0) return { error: 'Cantidad inválida' }
        const userName = await currentUserName()

        await prisma.$transaction([
            prisma.supplyBatch.create({
                data: {
                    supplyId,
                    quantity: data.quantity,
                    lot: data.lot || null,
                    expiryDate: data.expiryDate ? clinicWallTimeToUtc(data.expiryDate, "23:59") : null,
                },
            }),
            prisma.supplyMovement.create({
                data: { supplyId, type: 'IN', quantity: data.quantity, reason: data.reason || 'Entrada', userName },
            }),
        ])
        revalidatePath('/dashboard/supplies')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo registrar la entrada' }
    }
}

// Salida de stock: descuenta primero de los lotes que caducan antes (FEFO).
// Los lotes caducados no se usan: deben darse de baja con discardSupplyBatch.
export async function consumeSupplyStock(supplyId: string, data: { quantity: number; reason?: string | null }) {
    try {
        if (!Number.isInteger(data.quantity) || data.quantity <= 0) return { error: 'Cantidad inválida' }
        const userName = await currentUserName()

        return await prisma.$transaction(async (tx) => {
            const batches = await tx.supplyBatch.findMany({
                where: { supplyId, quantity: { gt: 0 }, OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] },
                orderBy: [{ expiryDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
            })
            const available = batches.reduce((sum, b) => sum + b.quantity, 0)
            if (available < data.quantity) return { error: `Solo hay ${available} disponibles sin caducar` }

            let remaining = data.quantity
            for (const batch of batches) {
                if (remaining === 0) break
                const take = Math.min(batch.quantity, remaining)
                await tx.supplyBatch.update({ where: { id: batch.id }, data: { quantity: batch.quantity - take } })
                remaining -= take
            }
            await tx.supplyMovement.create({
                data: { supplyId, type: 'OUT', quantity: data.quantity, reason: data.reason || 'Salida', userName },
            })
            revalidatePath('/dashboard/supplies')
            return { success: true }
        })
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo registrar la salida' }
    }
}

// Retira un lote completo (p. ej. caducado) dejando registro del movimiento.
export async function discardSupplyBatch(batchId: string) {
    try {
        const batch = await prisma.supplyBatch.findUnique({ where: { id: batchId } })
        if (!batch || batch.quantity === 0) return { error: 'Lote no encontrado' }
        const userName = await currentUserName()

        await prisma.$transaction([
            prisma.supplyBatch.update({ where: { id: batchId }, data: { quantity: 0 } }),
            prisma.supplyMovement.create({
                data: { supplyId: batch.supplyId, type: 'OUT', quantity: batch.quantity, reason: `Baja de lote${batch.lot ? ` ${batch.lot}` : ''} (caducado/dañado)`, userName },
            }),
        ])
        revalidatePath('/dashboard/supplies')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'No se pudo dar de baja el lote' }
    }
}
