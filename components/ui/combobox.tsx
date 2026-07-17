'use client'

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
    value: string
    label: string
    /** Optional second line shown under the label (also searchable). */
    sublabel?: string | null
    /** Extra text to match against when searching (not shown). */
    keywords?: string
}

interface ComboboxProps {
    options: ComboboxOption[]
    value?: string
    onChange: (value: string) => void
    /** Text shown in the trigger when nothing is selected. */
    placeholder?: string
    /** Text shown inside the search box. */
    searchPlaceholder?: string
    /** Text shown when the search yields no matches. */
    emptyText?: string
    disabled?: boolean
    className?: string
    id?: string
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    emptyText = "Sin resultados.",
    disabled,
    className,
    id,
}: ComboboxProps) {
    const [open, setOpen] = useState(false)
    const selected = options.find((o) => o.value === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn("w-full justify-between font-normal", className)}
                >
                    <span className={cn("truncate", !selected && "text-muted-foreground")}>
                        {selected ? selected.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
            >
                <Command
                    filter={(itemValue, search) =>
                        itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                    }
                >
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((o) => (
                                <CommandItem
                                    key={o.value}
                                    // cmdk searches against this string; the unique value
                                    // keeps items distinct even when labels repeat.
                                    value={`${o.label} ${o.sublabel ?? ""} ${o.keywords ?? ""} ${o.value}`}
                                    onSelect={() => {
                                        onChange(o.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === o.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="flex flex-col">
                                        <span>{o.label}</span>
                                        {o.sublabel && (
                                            <span className="text-muted-foreground text-xs">
                                                {o.sublabel}
                                            </span>
                                        )}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
