import { Calendar, Users, Package, DollarSign, BarChart, Settings, UserCog, Building2, Boxes } from "lucide-react"

export interface NavItem {
    title: string
    href?: string
    disabled?: boolean
    external?: boolean
    icon?: any
    label?: string
    roles?: string[]
    items?: NavItem[]
}

export const navItems: NavItem[] = [
    {
        title: "Agenda",
        href: "/dashboard/agenda",
        icon: Calendar,
        roles: ["ADMIN", "RECEPTIONIST", "DENTIST"],
    },
    {
        title: "Pacientes",
        href: "/dashboard/patients",
        icon: Users,
        roles: ["ADMIN", "RECEPTIONIST", "DENTIST"],
    },
    {
        title: "Insumos",
        href: "/dashboard/supplies",
        icon: Boxes,
        roles: ["ADMIN", "RECEPTIONIST", "DENTIST"],
    },
    {
        title: "Cobros",
        icon: DollarSign,
        roles: ["ADMIN", "RECEPTIONIST", "DENTIST"],
        items: [
            {
                title: "General",
                href: "/dashboard/payments",
                icon: DollarSign,
            },
            {
                title: "Corte de Caja",
                href: "/dashboard/payments/daily",
                icon: BarChart,
            }
        ]
    },
    {
        title: "Analíticas",
        icon: BarChart,
        roles: ["ADMIN"],
        items: [
            {
                title: "General",
                href: "/dashboard/analytics",
                icon: BarChart,
            },
            {
                title: "Cancelaciones",
                href: "/dashboard/analytics/cancellations",
                icon: BarChart,
            }
        ]
    },
    {
        title: "Configuración",
        icon: Settings,
        roles: ["ADMIN"],
        items: [
            {
                title: "Consultorios",
                href: "/dashboard/consultories",
                icon: Building2,
            },
            {
                title: "Servicios",
                href: "/dashboard/services",
                icon: Package,
            },
            {
                title: "Dentistas",
                href: "/dashboard/dentists",
                icon: UserCog,
            },
            {
                title: "Usuarios",
                href: "/dashboard/users",
                icon: Users,
            },
        ]
    },
]
