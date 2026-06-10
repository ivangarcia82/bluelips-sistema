'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { Role } from "@prisma/client"

const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.nativeEnum(Role),
})

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                // Exclude password
            }
        })
        return { users }
    } catch (error) {
        console.error("Error fetching users:", error)
        return { error: "Failed to fetch users" }
    }
}

export async function createUser(data: z.infer<typeof createUserSchema>) {
    const validated = createUserSchema.safeParse(data)

    if (!validated.success) {
        return { error: "Invalid data" }
    }

    const { name, email, password, role } = validated.data

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return { error: "User with this email already exists" }
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role
            }
        })

        revalidatePath("/dashboard/users")
        return { success: true }
    } catch (error) {
        console.error("Error creating user:", error)
        return { error: "Failed to create user" }
    }
}

export async function deleteUser(id: string) {
    try {
        await prisma.user.delete({
            where: { id }
        })
        revalidatePath("/dashboard/users")
        return { success: true }
    } catch (error) {
        return { error: "Failed to delete user" }
    }
}
