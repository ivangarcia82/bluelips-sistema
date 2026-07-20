import { fromZonedTime, formatInTimeZone } from "date-fns-tz"

/**
 * Zona horaria de la clínica. Todas las horas de las citas se interpretan y
 * muestran en esta zona, sin importar dónde corra el servidor (Vercel = UTC)
 * ni el navegador. Cámbiala aquí si la clínica está en otra zona.
 */
export const CLINIC_TZ = "America/Merida" // GMT-6 (Yucatán, sin horario de verano)

/**
 * Convierte una fecha/hora de "reloj de pared" de la clínica al instante UTC
 * real que se guarda en la BD.
 * @param dateStr "YYYY-MM-DD"
 * @param timeStr "HH:mm"
 */
export function clinicWallTimeToUtc(dateStr: string, timeStr: string): Date {
    return fromZonedTime(`${dateStr}T${timeStr}:00`, CLINIC_TZ)
}

/** Hora (0-23) del instante, vista en la zona de la clínica. */
export function clinicHour(d: Date | string): number {
    return Number(formatInTimeZone(new Date(d), CLINIC_TZ, "H"))
}

/** Minutos (0-59) del instante, vistos en la zona de la clínica. */
export function clinicMinute(d: Date | string): number {
    return Number(formatInTimeZone(new Date(d), CLINIC_TZ, "m"))
}

/** Formatea un instante en la zona de la clínica (tokens de date-fns). */
export function formatClinic(d: Date | string, fmt: string): string {
    return formatInTimeZone(new Date(d), CLINIC_TZ, fmt)
}

/** Fecha de hoy ("YYYY-MM-DD") según el calendario de la clínica. */
export function clinicToday(): string {
    return formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd")
}

/**
 * Rango UTC [start, end) que cubre un día completo del calendario de la clínica.
 * @param dateStr "YYYY-MM-DD"
 */
export function clinicDayRangeUtc(dateStr: string): { start: Date; end: Date } {
    const start = clinicWallTimeToUtc(dateStr, "00:00")
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
    return { start, end }
}
