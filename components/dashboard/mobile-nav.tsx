'use client'

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { navItems } from "@/config/nav"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useState } from "react"

export function MobileNav() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 text-lg font-medium">
                    <Link
                        href="#"
                        className="flex items-center gap-2 text-lg font-semibold mb-4"
                    >
                        <Image src="/logo.png" alt="Blue Lips Logo" width={100} height={100} className="rounded-full" />
                    </Link>
                    {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href || "#"}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                                    pathname === item.href && "bg-muted text-primary"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>
            </SheetContent>
        </Sheet>
    )
}
