# Diseño — Updates Blue Lips (búsqueda, pendientes, consultorios, gastos, caja)

**Fecha:** 2026-07-16
**Estado:** aprobado para planificación

## Contexto

Cinco subsistemas solicitados. Tres ya existen parcialmente:

| Pedido | Estado actual |
|---|---|
| Buscador de pacientes + motor de búsqueda | No existe (placeholder vacío en el header del dashboard) |
| Pagos pendientes en módulo de paciente | Lógica existe (`getDebtors`, `getPatientBalance`), falta UI |
| Gestión de consultorios | No existe: ni action, ni página, ni entrada de menú |
| Módulo de gastos | Existe solo como diálogo dentro de Corte de Caja; actions `createExpense`/`deleteExpense`/`getDailyExpenses` |
| Módulo de caja / cortes diarios | Existe `/dashboard/payments/daily`, pero fijo a `new Date()` (solo hoy), sin historial ni cierre |

## Decisiones tomadas

1. **Búsqueda:** global multi-entidad tipo command palette (Ctrl/Cmd+K) — pacientes, citas, servicios, dentistas.
2. **Caja:** selector de fecha + historial + **cierre formal** (efectivo contado, diferencia, quién y cuándo). El cierre **solo deja registro**, no bloquea el día.
3. **Gastos:** página propia con historial y filtros. Sigue alimentando el Corte de Caja (fuente única de verdad).
4. **Pagos pendientes:** visibles en **ambos** lados (badge en la lista + bloque en la ficha).
5. **Permisos:** Gastos → ADMIN + RECEPCIONISTA. Consultorios → ADMIN. Dentista no ve Gastos ni Consultorios.
6. **Regla de deuda:** es deuda si la cita está **COMPLETADA** (servicio ya dado) **o** si dejó **apartado (DEPOSIT)**, y lo pagado < precio del servicio. Las citas futuras sin ningún pago **no** son deuda.

---

## 1. Motor de búsqueda global (Ctrl/Cmd+K)

**Archivos nuevos**
- `actions/search.ts` → `globalSearch(query: string)`
- `components/search/global-search.tsx` (client component)
- `components/ui/command.tsx` (shadcn)

**Archivos modificados**
- `app/dashboard/layout.tsx` — montar el buscador donde está `{/* Search or breadcrumbs */}`
- `package.json` — dependencia nueva: `cmdk`

**Diseño**
- `globalSearch(query)` ejecuta 4 consultas Prisma en paralelo (`Promise.all`):
  - Pacientes: `name` / `phone` / `email` con `contains`, `mode: 'insensitive'`
  - Citas: por nombre de paciente o servicio
  - Servicios: por `name`
  - Dentistas: por `name`
- Tope de **5 resultados por grupo**. Query vacía o < 2 caracteres → retorna vacío sin consultar.
- Client component: atajo Ctrl+K / Cmd+K, debounce ~250ms, resultados agrupados por tipo, navegación con teclado, clic → navega a la ficha correspondiente.
- **Filtrado por rol:** el rol DENTISTA no recibe resultados de entidades de configuración (servicios/dentistas); recibe pacientes y citas.
- **Sin full-text de Postgres.** Para el volumen de una clínica, `contains` + índices es suficiente. YAGNI.

---

## 2. Pagos pendientes del paciente

**Archivos nuevos**
- `lib/debt.ts` → helper puro con la regla de deuda (una sola definición reutilizable)

**Archivos modificados**
- `actions/patients.ts` → `getPatients()` incluye el saldo pendiente por paciente
- `actions/payments.ts` → `getPatientBalance` alineado a la regla de deuda
- `components/patients/patient-table.tsx` → badge rojo con el monto
- `app/dashboard/patients/[id]/page.tsx` → bloque rojo con desglose + acción de liquidar

**Regla de deuda (única fuente de verdad, en `lib/debt.ts`)**

```
esDeuda(cita) = (cita.status === 'COMPLETED' || tieneApartado(cita))
                && cita.status !== 'CANCELLED'
                && (precioServicio - totalPagado) > 0.01
```

- El saldo del paciente = suma de los saldos de sus citas que cumplan la regla.
- **Rendimiento:** el cálculo del saldo para la lista se hace en **una sola consulta** con `include` de pagos/servicio, no una consulta por paciente (evitar N+1).

**UI**
- Lista: badge rojo (`#E23B2E`, tokens de marca) con el monto. Sin deuda → sin badge.
- Ficha: bloque rojo arriba con total pendiente y desglose por cita (servicio, abonado vs total).

---

## 3. Gestión de consultorios (ADMIN)

**Archivos nuevos**
- `actions/consultories.ts` → `getConsultories`, `createConsultory`, `updateConsultory`, `deleteConsultory`
- `app/dashboard/consultories/page.tsx`
- `components/consultories/consultory-table.tsx`
- `components/consultories/consultory-dialog.tsx`

**Archivos modificados**
- `config/nav.ts` → entrada "Consultorios" dentro de **Configuración**, `roles: ["ADMIN"]`

**Diseño**
- Campos: `name` (requerido), `description` (opcional). Validación con Zod, como el resto de actions.
- Patrón espejo de Servicios/Dentistas (tabla + diálogo) para consistencia visual y de código.
- **Guard de borrado:** `Appointment.consultoryId` tiene FK `ON DELETE RESTRICT`. Antes de borrar, contar citas asociadas; si hay, devolver error legible: *"No se puede eliminar: el consultorio tiene N citas asociadas."* Nunca dejar que reviente la FK.

---

## 4. Módulo de gastos (ADMIN + RECEPCIONISTA)

**Archivos nuevos**
- `app/dashboard/expenses/page.tsx`
- `components/expenses/expense-table.tsx`
- `components/expenses/expense-filters.tsx`

**Archivos modificados**
- `actions/expenses.ts` → `getExpenses({ from, to, category, dentistId })`, `getExpenseCategories()`
- `config/nav.ts` → entrada "Gastos", `roles: ["ADMIN", "RECEPTIONIST"]`

**Diseño**
- Tabla: fecha, descripción, categoría, dentista (si aplica), monto, acción eliminar.
- Filtros: rango de fechas (default: mes en curso), categoría, dentista. Total de lo filtrado al pie.
- `category` es texto libre en el modelo `Expense`. `getExpenseCategories()` devuelve las categorías **distintas ya usadas** para poblar el filtro. **No** se agrega un catálogo de categorías (fuera de alcance).
- Reutiliza el `ExpenseDialog` existente (no duplicar el formulario).
- Los gastos siguen siendo la misma tabla que consume el Corte de Caja.

---

## 5. Módulo de caja / cortes diarios

**Migración nueva** (aditiva)

```prisma
model CashClosing {
  id           String   @id @default(cuid())
  date         DateTime @unique              // normalizada a inicio del día
  expectedCash Decimal  @db.Decimal(10, 2)
  countedCash  Decimal  @db.Decimal(10, 2)
  difference   Decimal  @db.Decimal(10, 2)
  notes        String?
  closedBy     User     @relation(fields: [closedById], references: [id])
  closedById   String
  closedAt     DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```
(+ relación inversa `cashClosings CashClosing[]` en `User`)

**Archivos nuevos**
- `actions/cash.ts` → `getCashClosing(date)`, `closeCash({ date, countedCash, notes })`, `getCashClosings({ from, to })`
- `components/payments/close-cash-dialog.tsx`
- `components/payments/closings-history.tsx`

**Archivos modificados**
- `app/dashboard/payments/daily/page.tsx` → selector de fecha, sección de cierre, historial

**Diseño**
- La página deja de usar `new Date()` fijo: lee la fecha de un **search param** (`?date=YYYY-MM-DD`, default hoy) para que sea enlazable y navegable.
- **Esperado en efectivo** = pagos del día con `method = CASH` − **todos** los gastos del día.
  - *Supuesto explícito:* el modelo `Expense` **no tiene campo de método de pago**, así que no se puede saber si un gasto salió de caja o del banco. Se asume que **todo gasto sale de la caja**, que es exactamente el supuesto que ya hace hoy `app/dashboard/payments/daily/page.tsx` (marca los gastos como "Efectivo" con un comentario al respecto). Se mantiene esa consistencia en lugar de agregar un campo nuevo.
  - Si más adelante hace falta distinguir, se agrega `method` a `Expense` en su propia iteración (fuera de alcance aquí).
- **Diferencia** = `countedCash − expectedCash`. Negativa = falta dinero; positiva = sobra. Se calcula al vuelo y se guarda en el registro.
- `closeCash` hace **upsert por fecha** (`date` es único): re-cerrar el día actualiza el registro. Guarda `closedById` del usuario en sesión y `closedAt`.
- **No bloquea** el día: se pueden seguir registrando cobros/gastos con esa fecha.
- Historial: lista de cierres recientes (fecha, contado, diferencia, quién cerró).
- Permisos: cerrar caja → ADMIN + RECEPCIONISTA.

---

## Orden de implementación

Los 5 subsistemas son independientes entre sí (salvo que Caja lee los gastos, que ya existen). Cada uno se implementa y se verifica **por separado**, en este orden — de lo aislado a lo que toca más piezas:

1. **Consultorios** — CRUD independiente, patrón ya establecido.
2. **Gastos** — independiente, reutiliza diálogo existente.
3. **Pagos pendientes** — introduce `lib/debt.ts`, toca lista + ficha.
4. **Caja** — requiere migración de BD. Se apoya en (2).
5. **Búsqueda** — requiere dependencia nueva (`cmdk`), toca el layout.

Cada pieza es entregable por sí sola: si se detiene el trabajo después de cualquiera de ellas, lo construido queda funcionando y verificado.

## Fuera de alcance (YAGNI)

- Full-text search / motor de búsqueda externo.
- Catálogo administrable de categorías de gasto.
- Bloqueo/reapertura del día al cerrar caja.
- Refactor del idioma mixto de la app (ej. la página de Pacientes está en inglés). Se puede atacar aparte.

## Verificación

Cada pieza se valida en el navegador con el servidor de dev y datos reales:
- Consultorios: crear, editar, borrar; intentar borrar uno con citas → error legible.
- Gastos: crear gasto, filtrar por rango/categoría, verificar que el total cuadre y que aparezca en el Corte de Caja.
- Pendientes: paciente con apartado → badge y bloque en rojo; cita futura sin pago → sin deuda.
- Caja: cambiar fecha, cerrar caja, verificar diferencia y registro; re-cerrar → actualiza.
- Búsqueda: Ctrl+K, buscar paciente/servicio, navegar con teclado, verificar filtrado por rol.
