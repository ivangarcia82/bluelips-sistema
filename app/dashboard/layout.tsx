import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { UserNav } from "@/components/dashboard/user-nav"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900">
            <DashboardSidebar userRole={(session?.user as any)?.role || "RECEPTIONIST"} />

            <div className="flex flex-1 flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px] dark:bg-slate-950">
                    <MobileNav />
                    <div className="w-full flex-1">
                        {/* Search or breadcrumbs */}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="mr-2 text-sm text-gray-500 hidden md:block">
                            {session.user?.name} ({(session.user as any).role})
                        </div>
                        <UserNav user={session.user || {}} />
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
