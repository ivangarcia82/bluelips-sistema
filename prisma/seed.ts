import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const user = await prisma.user.upsert({
        where: { email: 'admin@bluelips.com' },
        update: {},
        create: {
            email: 'admin@bluelips.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
        },
    })

    console.log({ user })

    // Seed Consultories
    const consultories = ['Consultorio 1', 'Consultorio 2', 'Consultorio 3', 'Consultorio 4']
    for (const name of consultories) {
        await prisma.consultory.upsert({
            where: { id: name.toLowerCase().replace(' ', '-') },
            update: { name },
            create: { name, id: name.toLowerCase().replace(' ', '-') }
        })
    }

    // Seed Common Services
    const services = [
        { name: 'Limpieza Dental', price: 500, duration: 30 },
        { name: 'Extracción Simple', price: 800, duration: 45 },
        { name: 'Resina', price: 600, duration: 45 },
        { name: 'Consulta General', price: 300, duration: 30 },
    ]

    for (const service of services) {
        // Simple name-based check to avoid duplicates if running multiple times
        const existing = await prisma.service.findFirst({ where: { name: service.name } })
        if (!existing) {
            await prisma.service.create({ data: service })
        }
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
