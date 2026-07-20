'use client'

import { useState, useEffect, useRef } from "react"
import { Consultory, Appointment, Dentist, Service, Patient } from "@prisma/client"
import { format, differenceInMinutes } from "date-fns"
import { clinicHour, clinicMinute, formatClinic } from "@/lib/timezone"
import { AppointmentDialog } from "./appointment-dialog"
import { PaymentDialog } from "@/components/payments/payment-dialog"
import { BlockDialog } from "./block-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cancelAppointment, updateAppointment } from "@/actions/agenda"
import { Pencil, Trash2, Ban, DollarSign, GripVertical } from "lucide-react"

type AppointmentWithDetails = Appointment & {
    patient: Patient
    service: Service
    dentist: Dentist
}

interface AgendaGridProps {
    consultories: Consultory[]
    date: Date
    appointments: AppointmentWithDetails[]
    dentists: Dentist[]
    services: (Omit<Service, "price"> & { price: number | any })[]
    patients: Patient[]
}

export function AgendaGrid({ consultories, date, appointments, dentists, services, patients }: AgendaGridProps) {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8 AM to 8 PM
    const startHour = 8

    // State for payment modal
    const [paymentAppt, setPaymentAppt] = useState<AppointmentWithDetails | null>(null)
    const [paymentOpen, setPaymentOpen] = useState(false)

    // State for editing appointment
    const [editAppt, setEditAppt] = useState<AppointmentWithDetails | null>(null)
    const [editOpen, setEditOpen] = useState(false)

    // Current Time Indicator state
    const [currentTime, setCurrentTime] = useState(new Date())

    // Selection Interaction State
    const [selection, setSelection] = useState<{ consultoryId: string, startHour: number, endHour: number, anchorEl: HTMLElement | null } | null>(null)
    const [isSelecting, setIsSelecting] = useState(false)
    const [selectionDialog, setSelectionDialog] = useState<{ startTime: string, duration: number, consultoryId: string, date: Date } | null>(null)
    const [blockDialog, setBlockDialog] = useState<{ startTime: string, endTime: string, consultoryId: string } | null>(null)

    // Drag-to-reschedule state
    const dragRef = useRef<{ apt: AppointmentWithDetails; moved: boolean } | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragPreview, setDragPreview] = useState<{ aptId: string; consultoryId: string; top: number; height: number } | null>(null)

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000) // Update every minute
        return () => clearInterval(timer)
    }, [])

    const handlePaymentClick = (appt: AppointmentWithDetails) => {
        setPaymentAppt(appt)
        setPaymentOpen(true)
    }

    const handleEditClick = (appt: AppointmentWithDetails) => {
        setEditAppt(appt)
        setEditOpen(true)
    }

    const handleCancelClick = async (id: string) => {
        if (confirm("¿Estás seguro de cancelar esta cita?")) {
            await cancelAppointment(id)
        }
    }

    const getAppointmentStyle = (apt: AppointmentWithDetails) => {
        const start = new Date(apt.startTime)
        const end = new Date(apt.endTime)

        const startMinutes = (clinicHour(start) - startHour) * 60 + clinicMinute(start)
        const duration = differenceInMinutes(end, start)
        const heightPerMinute = 80 / 60

        return {
            top: `${startMinutes * heightPerMinute}px`,
            height: `${duration * heightPerMinute}px`,
        }
    }

    const getCurrentTimeTop = () => {
        const now = currentTime
        // Only show the "now" line when viewing today's date.
        if (formatClinic(now, "yyyy-MM-dd") !== formatClinic(date, "yyyy-MM-dd")) return null
        const currentHour = clinicHour(now)
        if (currentHour < startHour || currentHour > 20) return null

        const startMinutes = (currentHour - startHour) * 60 + clinicMinute(now)
        const heightPerMinute = 80 / 60
        return startMinutes * heightPerMinute
    }

    // --- Interaction Handlers ---

    const handleMouseDown = (consultoryId: string, hour: number, e: React.MouseEvent) => {
        // Start selection
        if (e.button !== 0) return // Only left click
        setIsSelecting(true)
        setSelection({
            consultoryId,
            startHour: hour,
            endHour: hour + 1, // Default 1 hour
            anchorEl: null
        })
    }

    const handleMouseEnter = (consultoryId: string, hour: number) => {
        if (!isSelecting || !selection) return
        if (selection.consultoryId !== consultoryId) return // Stay in same column

        // Update selection range
        if (hour >= selection.startHour) {
            setSelection(prev => prev ? ({ ...prev, endHour: hour + 1 }) : null)
        } else {
            setSelection(prev => prev ? ({ ...prev, startHour: hour }) : null)
        }
    }

    const handleMouseUp = () => {
        if (isSelecting) {
            setIsSelecting(false)
        }
    }

    const handleAgendarSelection = () => {
        if (!selection) return
        const startTimeStr = `${selection.startHour.toString().padStart(2, '0')}:00`
        const duration = (selection.endHour - selection.startHour) * 60

        setSelectionDialog({
            startTime: startTimeStr,
            duration,
            consultoryId: selection.consultoryId,
            date
        })
        setSelection(null)
    }

    const handleBlockSelection = () => {
        if (!selection) return
        const startTimeStr = `${selection.startHour.toString().padStart(2, '0')}:00`
        const endTimeStr = `${selection.endHour.toString().padStart(2, '0')}:00`

        setBlockDialog({
            startTime: startTimeStr,
            endTime: endTimeStr,
            consultoryId: selection.consultoryId
        })
        setSelection(null)
    }

    // --- Drag to reschedule ---
    const HEIGHT_PER_MIN = 80 / 60
    const SNAP_MIN = 15

    // Resolve the grid cell under the pointer -> { consultoryId, hour, minute (snapped) }
    const resolveDrop = (clientX: number, clientY: number) => {
        const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
        const cell = el?.closest("[data-slot-consultory]") as HTMLElement | null
        if (!cell) return null
        const consultoryId = cell.getAttribute("data-slot-consultory")!
        const hour = Number(cell.getAttribute("data-slot-hour"))
        const rect = cell.getBoundingClientRect()
        const rawMin = ((clientY - rect.top) / rect.height) * 60
        const minute = Math.max(0, Math.min(45, Math.round(rawMin / SNAP_MIN) * SNAP_MIN))
        return { consultoryId, hour, minute }
    }

    const startDrag = (e: React.PointerEvent, apt: AppointmentWithDetails) => {
        e.preventDefault()
        e.stopPropagation()
        dragRef.current = { apt, moved: false }
        setIsDragging(true)
        const durationMin = differenceInMinutes(new Date(apt.endTime), new Date(apt.startTime))

        const onMove = (ev: PointerEvent) => {
            if (!dragRef.current) return
            dragRef.current.moved = true
            const drop = resolveDrop(ev.clientX, ev.clientY)
            if (!drop) return
            const top = (drop.hour - startHour) * 80 + drop.minute * HEIGHT_PER_MIN
            setDragPreview({ aptId: apt.id, consultoryId: drop.consultoryId, top, height: durationMin * HEIGHT_PER_MIN })
        }

        const onUp = async (ev: PointerEvent) => {
            document.removeEventListener("pointermove", onMove)
            document.removeEventListener("pointerup", onUp)
            const info = dragRef.current
            dragRef.current = null
            setIsDragging(false)
            setDragPreview(null)
            if (!info || !info.moved) return
            const drop = resolveDrop(ev.clientX, ev.clientY)
            if (!drop) return
            // Skip if dropped on the same spot
            if (drop.consultoryId === apt.consultoryId && drop.hour === clinicHour(apt.startTime) && drop.minute === clinicMinute(apt.startTime)) return
            const startTime = `${String(drop.hour).padStart(2, "0")}:${String(drop.minute).padStart(2, "0")}`
            const res = await updateAppointment(apt.id, {
                date: formatClinic(apt.startTime, "yyyy-MM-dd"),
                startTime,
                duration: durationMin,
                consultoryId: drop.consultoryId,
            })
            if (res?.error) alert(res.error)
        }

        document.addEventListener("pointermove", onMove)
        document.addEventListener("pointerup", onUp)
    }

    const timeIndicatorTop = getCurrentTimeTop()

    return (
        <div
            className={`flex h-full flex-col bg-white dark:bg-slate-950 rounded-lg shadow-sm border overflow-hidden select-none ${isDragging ? "cursor-grabbing" : ""}`}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Header: Consultories */}
            <div className="flex border-b border-gray-200 dark:border-gray-800">
                <div className="w-16 flex-none border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-xs text-muted-foreground font-medium">
                    GMT-6
                </div>
                {consultories.map((consultory) => (
                    <div key={consultory.id} className="flex-1 border-r border-gray-200 dark:border-gray-800 px-4 py-3 text-center font-semibold text-sm text-gray-700 dark:text-gray-300 last:border-r-0">
                        {consultory.name}
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="flex flex-1 overflow-auto relative scrollbar-hide">
                <div className="flex w-full min-w-[800px] relative">

                    {/* Time Column */}
                    <div className="w-16 flex-none border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
                        {hours.map((hour) => (
                            <div key={hour} className="h-20 border-b border-gray-100 dark:border-gray-900 px-2 py-1 text-xs text-right text-gray-500 relative box-border">
                                <span className="-top-3 relative px-1">
                                    {format(new Date().setHours(hour, 0), "h a")}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Columns per Consultory */}
                    {consultories.map((consultory) => {
                        const consulAppointments = appointments.filter(a => a.consultoryId === consultory.id)

                        // Check selection
                        const isSelectionCol = selection?.consultoryId === consultory.id
                        const selectionTop = isSelectionCol && selection ? (selection.startHour - 8) * 80 : 0
                        const selectionHeight = isSelectionCol && selection ? (selection.endHour - selection.startHour) * 80 : 0

                        return (
                            <div key={consultory.id} className="flex-1 border-r border-gray-200 dark:border-gray-800 relative last:border-r-0 min-w-[150px] bg-white dark:bg-slate-950">
                                {/* Grid lines */}
                                {hours.map((hour) => (
                                    <div
                                        key={`${consultory.id}-${hour}`}
                                        data-slot-consultory={consultory.id}
                                        data-slot-hour={hour}
                                        className="h-20 border-b border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                        onMouseDown={(e) => handleMouseDown(consultory.id, hour, e)}
                                        onMouseEnter={() => handleMouseEnter(consultory.id, hour)}
                                    />
                                ))}

                                {/* Appointments */}
                                {consulAppointments.map(apt => {
                                    const isBlocked = (apt.status as any) === "BLOCKED"

                                    return (
                                        <DropdownMenu key={apt.id}>
                                            <DropdownMenuTrigger asChild>
                                                <div
                                                    className="absolute left-1 right-1 rounded-md border-l-4 px-3 py-2 text-xs overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer z-10"
                                                    style={{
                                                        ...getAppointmentStyle(apt),
                                                        backgroundColor: isBlocked ? '#f3f4f6' : apt.dentist.color + '1A',
                                                        borderLeftColor: isBlocked ? '#9ca3af' : apt.dentist.color,
                                                        borderTopWidth: '1px',
                                                        borderRightWidth: '1px',
                                                        borderBottomWidth: '1px',
                                                        borderColor: isBlocked ? '#e5e7eb' : apt.dentist.color + '40',
                                                        opacity: dragPreview?.aptId === apt.id ? 0.4 : undefined,
                                                        pointerEvents: isDragging ? 'none' : undefined,
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                >
                                                    {/* Drag handle: arrastrar para reprogramar */}
                                                    <div
                                                        onPointerDown={(e) => startDrag(e, apt)}
                                                        className="absolute top-0.5 right-0.5 z-20 cursor-grab rounded p-0.5 text-gray-400 hover:bg-black/5 hover:text-gray-600"
                                                        title="Arrastra para mover la cita"
                                                    >
                                                        <GripVertical className="h-3.5 w-3.5" />
                                                    </div>
                                                    {isBlocked ? (
                                                        <div className="flex items-center justify-center h-full text-gray-500 font-medium italic">
                                                            <Ban className="h-3 w-3 mr-1" />
                                                            {apt.notes || "Bloqueado"}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col h-full">
                                                            <div className="font-bold text-sm truncate" style={{ color: apt.dentist.color }}>
                                                                {apt.patient.name}
                                                            </div>
                                                            <div className="truncate text-gray-600 dark:text-gray-300 font-medium">
                                                                {apt.service.name}
                                                            </div>
                                                            <div className="mt-auto flex items-center justify-between text-[10px] text-gray-500">
                                                                <span>{formatClinic(apt.startTime, "h:mm a")} - {formatClinic(apt.endTime, "h:mm a")}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {!isBlocked && (
                                                    <>
                                                        {(() => {
                                                            const totalPaid = (apt as any).payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
                                                            const price = Number((apt.service as any).price || 0)
                                                            const isFullyPaid = totalPaid >= price
                                                            const isPast = new Date(apt.endTime) < new Date()
                                                            const hasAnyPayment = totalPaid > 0

                                                            return (
                                                                <>
                                                                    {!isFullyPaid && (
                                                                        <DropdownMenuItem onClick={() => handlePaymentClick(apt)}>
                                                                            <DollarSign className="mr-2 h-4 w-4" />
                                                                            Cobrar
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {!isPast && !hasAnyPayment && (
                                                                        <DropdownMenuItem onClick={() => handleEditClick(apt)}>
                                                                            <Pencil className="mr-2 h-4 w-4" />
                                                                            Editar
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </>
                                                            )
                                                        })()}
                                                    </>
                                                )}
                                                {(!((apt as any).payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) > 0) || isBlocked) && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleCancelClick(apt.id)}
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {isBlocked ? "Desbloquear" : "Cancelar Cita"}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )
                                })}

                                {/* Drop preview while dragging */}
                                {dragPreview && dragPreview.consultoryId === consultory.id && (
                                    <div
                                        className="absolute left-1 right-1 z-30 rounded-md border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none"
                                        style={{ top: `${dragPreview.top}px`, height: `${dragPreview.height}px` }}
                                    />
                                )}

                                {/* Selection Overlay */}
                                {isSelectionCol && selection && (
                                    <div
                                        className="absolute left-1 right-1 bg-blue-500/20 border-2 border-blue-500 rounded-md z-20 pointer-events-none flex items-center justify-center text-blue-700 font-semibold text-sm shadow-lg overflow-visible"
                                        style={{
                                            top: `${selectionTop}px`,
                                            height: `${selectionHeight}px`
                                        }}
                                    >
                                        {!isSelecting && (
                                            <div className="absolute -right-[160px] top-0 bg-white dark:bg-slate-800 shadow-xl rounded-lg p-2 border flex flex-col gap-1 pointer-events-auto z-50 animate-in fade-in zoom-in-95 duration-200 w-40">
                                                <button
                                                    onClick={handleAgendarSelection}
                                                    className="text-sm px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md font-medium text-left"
                                                >
                                                    Agendar Cita
                                                </button>

                                                <button
                                                    onClick={handleBlockSelection}
                                                    className="text-sm px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md font-medium text-left"
                                                >
                                                    Bloquear Horario
                                                </button>

                                                <div className="h-px bg-gray-100 dark:bg-slate-700 my-1" />

                                                <button
                                                    className="text-sm px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-md text-left"
                                                    onClick={() => setSelection(null)}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                        <span className="bg-white/80 dark:bg-black/50 px-2 py-1 rounded text-xs select-none">
                                            {format(new Date().setHours(selection.startHour, 0), "h a")} - {format(new Date().setHours(selection.endHour, 0), "h a")}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {/* Current Time Indicator Overlay */}
                    {timeIndicatorTop !== null && (
                        <div
                            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                            style={{ top: `${timeIndicatorTop}px` }}
                        >
                            <div className="w-16 flex justify-end pr-2">
                                <span className="text-[10px] font-bold text-red-500 bg-white dark:bg-slate-950 px-1 rounded-sm">
                                    {formatClinic(currentTime, "HH:mm")}
                                </span>
                            </div>
                            <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]">
                                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 -mt-[3px]" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Selection Dialog (Appointment) */}
            {selectionDialog && (
                <AppointmentDialog
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectionDialog(null)
                        }
                    }}
                    dentists={dentists}
                    services={services}
                    consultories={consultories}
                    patients={patients}
                    defaultDate={selectionDialog.date}
                    defaultConsultoryId={selectionDialog.consultoryId}
                    defaultTime={selectionDialog.startTime}
                    defaultDuration={selectionDialog.duration}
                />
            )}

            {/* Block Dialog */}
            {blockDialog && (
                <BlockDialog
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) {
                            setBlockDialog(null)
                        }
                    }}
                    consultories={consultories}
                    defaultDate={date}
                    defaultConsultoryId={blockDialog.consultoryId}
                    defaultStartTime={blockDialog.startTime}
                    defaultEndTime={blockDialog.endTime}
                />
            )}

            {/* Shared Payment Dialog */}
            {paymentAppt && (
                <PaymentDialog
                    open={paymentOpen}
                    onOpenChange={setPaymentOpen}
                    patientId={paymentAppt.patient.id}
                    appointmentId={paymentAppt.id}
                    defaultAmount={Number(paymentAppt.service.price)}
                    defaultServiceId={paymentAppt.serviceId}
                    defaultDentistId={paymentAppt.dentistId}
                    patients={patients}
                    dentists={dentists}
                    services={services}
                />
            )}

            {/* Shared Edit Dialog */}
            {editAppt && (
                <AppointmentDialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    appointment={editAppt as any}
                    dentists={dentists}
                    services={services}
                    consultories={consultories}
                    patients={patients}
                    defaultDate={date}
                />
            )}
        </div>
    )
}
