"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter, useSearchParams } from "next/navigation"

// Parse "YYYY-MM-DD" as a plain calendar day (local), avoiding the UTC
// off-by-one of `new Date("YYYY-MM-DD")`.
function parseLocalDate(s: string): Date {
    const [y, m, d] = s.split("-").map(Number)
    return new Date(y, (m || 1) - 1, d || 1)
}

export function DatePicker() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const dateParam = searchParams.get("date")
    const date = dateParam && /^\d{4}-\d{2}-\d{2}/.test(dateParam) ? parseLocalDate(dateParam) : new Date()

    const [open, setOpen] = React.useState(false)

    const handleSelect = (newDate: Date | undefined) => {
        if (newDate) {
            const params = new URLSearchParams(searchParams)
            // Format from local calendar fields, not UTC, so the day doesn't shift.
            params.set("date", format(newDate, "yyyy-MM-dd"))
            router.push(`?${params.toString()}`)
            setOpen(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    mode="single"
                    selected={date}
                    defaultMonth={date}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
