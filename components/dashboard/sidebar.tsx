'use client'

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { navItems, NavItem } from "@/config/nav"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface SidebarProps {
    userRole?: string
}

export function DashboardSidebar({ userRole = "ADMIN" }: SidebarProps) {
    const pathname = usePathname()

    return (
        <aside className="hidden w-64 flex-col border-r bg-white dark:bg-slate-950 md:flex">
            <div className="flex h-auto justify-center items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Image src="/logo.png" alt="Blue Lips Logo" width={100} height={100} className="rounded-full" />
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
                    {navItems.map((item) => (
                        <SidebarItem key={item.title} item={item} pathname={pathname} userRole={userRole} />
                    ))}
                </nav>
            </div>
        </aside >
    )
}

function SidebarItem({ item, pathname, userRole }: { item: NavItem, pathname: string, userRole: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const Icon = item.icon

    // Filter by role
    if (item.roles && !item.roles.includes(userRole)) {
        return null
    }

    if (item.items) {
        return (
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
                <CollapsibleTrigger asChild>
                    <button
                        className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 transition-all hover:text-primary",
                            isOpen ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            {item.title}
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1">
                    {item.items.map((subItem) => (
                        <SidebarItem key={subItem.title} item={subItem} pathname={pathname} userRole={userRole} />
                    ))}
                </CollapsibleContent>
            </Collapsible>
        )
    }

    return (
        <Link
            href={item.href || "#"}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                pathname === item.href
                    ? "bg-blue-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                    : "text-muted-foreground"
            )}
        >
            <Icon className="h-4 w-4" />
            {item.title}
        </Link>
    )
}
