
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const services = [
    // CONSULTAS
    { category: "Consulta", name: "General", price: 300, duration: 30 },
    { category: "Consulta", name: "Especialista", price: 600, duration: 30 },
    { category: "Consulta", name: "Diseño de Sonrisa", price: 600, duration: 45 },

    // LIMPIEZAS
    { category: "Limpieza", name: "General", price: 600, duration: 45 },
    { category: "Limpieza", name: "Profunda", price: 1000, duration: 60 },
    { category: "Limpieza", name: "Retiro de Brackets", price: 800, duration: 60 },

    // ORTODONCIA
    { category: "Ortodoncia", name: "Retenedor", price: 800, duration: 30 },
    { category: "Ortodoncia", name: "Placa Hawley", price: 1500, duration: 30 },

    // BLANQUEAMIENTO
    { category: "Blanqueamiento", name: "Blanqueamiento", price: 2500, duration: 60 },

    // ENDODONCIA
    { category: "Endodoncia", name: "Molar / General", price: 2500, duration: 90 }, // Asumido
    { category: "Endodoncia", name: "Anterior", price: 2000, duration: 90 },

    // RESTAURACIÓN (Resinas)
    { category: "Restauración", name: "Levantamiento / Núcleo", price: 1000, duration: 60 },
    { category: "Restauración", name: "Ionomero Adulto", price: 600, duration: 45 },
    { category: "Restauración", name: "Resina Mini", price: 600, duration: 45 },
    { category: "Restauración", name: "Resina Pequeña", price: 700, duration: 45 },
    { category: "Restauración", name: "Resina Mediana (Clase 2)", price: 800, duration: 60 },
    { category: "Restauración", name: "Resina Grande (Clase 2 Grande)", price: 1000, duration: 60 },
    { category: "Restauración", name: "Sellado Dentinario", price: 600, duration: 30 },

    // INCRUSTACIONES
    { category: "Incrustación", name: "Premolar", price: 2000, duration: 90 },
    { category: "Incrustación", name: "Molar", price: 2500, duration: 90 },

    // CORONAS
    { category: "Corona", name: "Resina", price: 3000, duration: 90 },
    { category: "Corona", name: "Zirconia", price: 5000, duration: 90 },
    { category: "Corona", name: "Disilicato", price: 6000, duration: 90 },
    { category: "Corona", name: "Provisional", price: 1000, duration: 45 },

    // PUENTE FIJO
    { category: "Puente Fijo", name: "Resina Reforzada", price: 4500, duration: 90 },
    { category: "Puente Fijo", name: "Metal Porcelana (Unidad)", price: 3000, duration: 90 },
    { category: "Puente Fijo", name: "Zirconia (Unidad)", price: 4500, duration: 90 },

    // OTROS
    { category: "Otros", name: "Curación", price: 600, duration: 30 },
    { category: "Otros", name: "Cementación", price: 600, duration: 30 },
    { category: "Otros", name: "Guarda Rígida", price: 800, duration: 30 },
    { category: "Otros", name: "Guarda Impresa 3D", price: 2500, duration: 30 },

    // ESTÉTICA
    { category: "Estética", name: "Resina Estética", price: 2000, duration: 60 },
    { category: "Estética", name: "Carilla Resina Directa", price: 2500, duration: 90 },
    { category: "Estética", name: "Carilla Resina Inyectada", price: 2500, duration: 90 },
    { category: "Estética", name: "Carilla Resina Indirecta", price: 3000, duration: 90 },
    { category: "Estética", name: "Carilla Disilicato", price: 6000, duration: 90 },

    // CIRUGÍA / EXTRACCIONES
    { category: "Cirugía", name: "Extracción Infantil Tópica", price: 600, duration: 30 },
    { category: "Cirugía", name: "Extracción Premolares Orto", price: 600, duration: 45 },
    { category: "Cirugía", name: "Extracción Adulto Movilidad 3", price: 600, duration: 45 },
    { category: "Cirugía", name: "Extracción Adulto", price: 700, duration: 60 },
    { category: "Cirugía", name: "Extracción Complicada (Sutura)", price: 1000, duration: 90 },
    { category: "Cirugía", name: "Muelas de Juicio (Especialista)", price: 2500, duration: 90 },
    { category: "Cirugía", name: "Muelas de Juicio (General)", price: 2000, duration: 90 },

    // PRÓTESIS REMOVIBLE
    { category: "Prótesis Removible", name: "Placa Total Convencional", price: 6000, duration: 60 },
    { category: "Prótesis Removible", name: "Placa Total Dientes Tiziano", price: 8000, duration: 60 },
    { category: "Prótesis Removible", name: "Placa Total Premium", price: 10000, duration: 60 },

    // PRÓTESIS COMBINADA
    { category: "Prótesis Combinada", name: "Mantenedor", price: 3500, duration: 60 },
    { category: "Prótesis Combinada", name: "Mantenedor 2-3 piezas", price: 4500, duration: 60 },
    { category: "Prótesis Combinada", name: "Bilateral 2-3 piezas", price: 5000, duration: 60 },
    { category: "Prótesis Combinada", name: "Bilateral 4-6 piezas", price: 6000, duration: 60 },
    { category: "Prótesis Combinada", name: "Bilateral 7-9 piezas", price: 9000, duration: 60 },
    { category: "Prótesis Combinada", name: "Bilateral 9 a Casi Total", price: 10000, duration: 60 },

    // PRÓTESIS PRX
    { category: "Prótesis PRX", name: "Mantenedor Espacio", price: 2500, duration: 45 },
    { category: "Prótesis PRX", name: "Mantenedor 2 piezas", price: 3000, duration: 45 },
    { category: "Prótesis PRX", name: "Mantenedor 3 piezas", price: 3500, duration: 45 },
    { category: "Prótesis PRX", name: "Mantenedor 4 piezas", price: 4000, duration: 45 },
    { category: "Prótesis PRX", name: "Mantenedor 5 piezas", price: 4500, duration: 45 },
    { category: "Prótesis PRX", name: "Bilateral 2-5 piezas", price: 6000, duration: 60 },
    { category: "Prótesis PRX", name: "Bilateral 6-8 piezas", price: 8000, duration: 60 },
    { category: "Prótesis PRX", name: "Bilateral 9 a Casi Total", price: 9000, duration: 60 },

    // PRÓTESIS ACRÍLICO
    { category: "Prótesis Acrílico", name: "Parcial 2-3 piezas", price: 3000, duration: 60 },
    { category: "Prótesis Acrílico", name: "Parcial 4-5 piezas", price: 4500, duration: 60 },
    { category: "Prótesis Acrílico", name: "Parcial 6-8 piezas", price: 5500, duration: 60 },
    { category: "Prótesis Acrílico", name: "Parcial 9 a Casi Total", price: 6000, duration: 60 },
]

async function main() {
    console.log('Seed starting via ts-node...')

    try {
        const deleted = await prisma.service.deleteMany({})
        console.log(`Deleted ${deleted.count} existing services.`)
    } catch (e) {
        console.warn("Could not delete all services (probably in use). Creating new ones anyway.")
    }

    for (const service of services) {
        await prisma.service.create({
            data: service
        })
    }

    console.log('Seed completed successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
