import { Suspense } from "react"
import { getAnalyticsData } from "@/lib/actions/analytics"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
    title: "Analíticas | Blue Lips",
    description: "Analíticas y estadísticas de la clínica",
}

import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AnalyticsPage() {
    const session = await auth()
    if ((session?.user as any)?.role !== 'ADMIN') {
        redirect('/dashboard/agenda')
    }

    const data = await getAnalyticsData()

    return (
        <div className="flex flex-col gap-4 p-4 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight">Analíticas</h1>
            <Suspense fallback={<AnalyticsSkeleton />}>
                <AnalyticsView data={data} />
            </Suspense>
        </div>
    )
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="h-[400px] col-span-4" />
                <div className="col-span-3 space-y-4">
                    <Skeleton className="h-[200px]" />
                    <Skeleton className="h-[200px]" />
                </div>
            </div>
        </div>
    )
}
