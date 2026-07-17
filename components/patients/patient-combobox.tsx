'use client'

import { Combobox } from "@/components/ui/combobox"

export interface PatientComboboxOption {
    id: string
    name: string
    phone?: string | null
}

interface PatientComboboxProps {
    patients: PatientComboboxOption[]
    value?: string
    onChange: (patientId: string) => void
    placeholder?: string
    disabled?: boolean
}

export function PatientCombobox({
    patients,
    value,
    onChange,
    placeholder = "Buscar paciente por nombre o teléfono...",
    disabled,
}: PatientComboboxProps) {
    return (
        <Combobox
            options={patients.map((p) => ({
                value: p.id,
                label: p.name,
                sublabel: p.phone,
            }))}
            value={value}
            onChange={onChange}
            placeholder="Buscar paciente..."
            searchPlaceholder={placeholder}
            emptyText="No se encontraron pacientes."
            disabled={disabled}
        />
    )
}
