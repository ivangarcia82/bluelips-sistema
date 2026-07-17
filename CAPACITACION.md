# 🦷 Guía de Capacitación — Blue Lips Sistema Dental

> **Roles del sistema:** **ADMIN** (todo) · **RECEPCIONISTA** (operación diaria) · **DENTISTA** (agenda, pacientes, cobros).
> 🟦 marca quién necesita cada tema.

---

## Módulo 0 — Introducción y acceso (todos) · ~15 min
1. **Qué es el sistema** y para qué sirve cada rol (admin / recepcionista / dentista).
2. **Iniciar sesión:** entrar a la URL → botón **"Iniciar Sesión"** → email y contraseña.
3. **Recorrido de la pantalla:** menú lateral izquierdo, encabezado con tu nombre y rol, menú de usuario (arriba a la derecha).
4. **Modo claro/oscuro** y **cerrar sesión** (menú de usuario).
5. **Importante:** el menú **cambia según el rol** — un recepcionista no ve "Analíticas" ni "Configuración".

---

## Módulo 1 — Configuración inicial (🟦 solo ADMIN) · ~30 min
> Esto va **primero** porque sin servicios, dentistas y usuarios, lo demás no funciona.

**1.1 Servicios** (`Configuración → Servicios`)
- Crear/editar/eliminar servicios: **nombre, precio, duración, categoría**.
- Explicar que el **precio** del servicio es lo que define la deuda del paciente en los cobros.

**1.2 Dentistas** (`Configuración → Dentistas`)
- Crear dentista: **nombre, especialidad**.
- **Color** → es el color con que aparece en la agenda (para distinguir visualmente).
- **% de comisión** → clave: define cuánto se le paga al dentista en el Corte de Caja.

**1.3 Usuarios** (`Configuración → Usuarios`)
- Crear cuentas de acceso al sistema y asignar **rol** (ADMIN / RECEPCIONISTA / DENTISTA).
- Eliminar usuarios.
- 🔑 Recalcar: **cada persona del equipo debe tener su propio usuario** (no compartir el admin).

---

## Módulo 2 — Pacientes (🟦 todos) · ~35 min
**2.1 Lista de pacientes** (`Pacientes`)
- Buscar, crear, editar, eliminar paciente.
- Datos: nombre, correo, **teléfonos (casa y de tutor)**, género, ocupación, etc.

**2.2 Ficha del paciente** (clic en un paciente)
- **Historia clínica** (cuestionario médico): alergias, problemas cardiacos, hipertensión, diabetes, embarazo, tabaquismo, tratamientos en curso, etc. → cómo llenarla y guardarla.
- **Odontograma**: marcar condiciones **diente por diente** (dentición adulto/infantil), agregar notas y borrar condiciones.
- **Historial de pagos / saldo** del paciente.

**Práctica:** crear un paciente de prueba, llenarle la historia clínica y marcar 2–3 dientes en el odontograma.

---

## Módulo 3 — Agenda (🟦 todos) · ~30 min
**3.1 Vista de agenda** (`Agenda`)
- Navegar por fecha, leer la cuadrícula por dentista/consultorio, identificar colores.

**3.2 Agendar cita**
- Crear cita: **paciente, dentista, servicio, consultorio, fecha y hora**.
- **Estados de la cita:** Pendiente → Confirmada → Completada (o Cancelada).

**3.3 Bloquear horario**
- **Bloquear** un espacio (comida, junta, vacaciones del dentista) para que no se agende ahí.

**3.4 Cancelaciones**
- Cancelar una cita y dónde se ven las **citas canceladas**.

**3.5 Agendado público**
- En la página de inicio hay un botón **"Agendar Cita"** para que el público reserve sin entrar al sistema — explicar cómo llega esa cita a la agenda.

**Práctica:** agendar una cita con el paciente de prueba, confirmarla y bloquear un horario.

---

## Módulo 4 — Cobros / General (🟦 todos, sobre todo RECEPCIÓN) · ~40 min
> El corazón operativo. Tómalo con calma.

**4.1 Registrar un pago** (`Cobros → General`)
- **Tipos de pago:**
  - **Apartado/Abono (DEPÓSITO)** → pago parcial, deja **saldo pendiente**.
  - **Pago completo**.
  - **Liquidación de saldo** → saldar lo que debía.
- **Métodos:** Efectivo, Tarjeta, Transferencia.
- **"Público en General"** → cobro rápido sin registrar paciente.
- **Cobro manual por servicio** → genera la deuda automáticamente.

**4.2 Deudores y saldos**
- Ver **lista de deudores** (pacientes que dejaron apartado y aún deben).
- Consultar el **saldo de un paciente** y liquidar.

**4.3 Facturación**
- Marcar una venta con **factura solicitada** y marcarla como **enviada**.

**4.4 Cancelar un pago** (corrección de errores).

**Práctica:** cobrar un **apartado** a un paciente, ver que aparece en deudores, y luego **liquidar** el saldo.

---

## Módulo 5 — Corte de Caja (🟦 RECEPCIÓN / ADMIN) · ~25 min
**5.1 Corte diario** (`Cobros → Corte de Caja`)
- Ver el **balance del día** (ingresos por método de pago).

**5.2 Gastos del día**
- Registrar y eliminar **gastos** (categorías).

**5.3 Comisiones de dentistas**
- Ver **comisiones pendientes** por dentista (según su % configurado).
- **Pagar comisión** → se registra como gasto y marca esos pagos como comisión pagada.

**Práctica:** registrar un gasto, revisar la comisión generada por el cobro del Módulo 4 y pagarla.

---

## Módulo 6 — Analíticas (🟦 solo ADMIN) · ~15 min
- **General:** gráficas de ingresos, tarjetas de estadísticas, servicios más vendidos, estados de citas.
- **Cancelaciones:** análisis de citas canceladas en un rango de fechas.

---

## Módulo 7 — Cierre: rutina diaria por rol · ~15 min
- **Recepcionista:** abre agenda → registra/confirma citas → cobra → al final del día hace **Corte de Caja**.
- **Dentista:** revisa su agenda → marca citas como completadas → actualiza odontograma/historia clínica.
- **Admin:** configura catálogos, paga comisiones, revisa analíticas.
- **Buenas prácticas:** cada quien con su usuario, cancelar en vez de borrar, registrar pagos en el momento.
- **Ronda de preguntas.**

---

## ⚠️ Puntos críticos a recalcar
- El **% de comisión del dentista** debe quedar bien desde Configuración, o el Corte de Caja saldrá mal.
- Un **apartado** crea deuda → hay que darle seguimiento en **Deudores**.
- **No compartir** la cuenta de admin; crear un usuario por persona.
- **Cancelar** citas/pagos en lugar de intentar borrarlos.

---

## 🔑 Acceso de administrador (para la sesión)
- **URL:** http://localhost:3000
- **Email:** `admin@bluelips.com`
- **Contraseña:** `admin123`
- Login directo: http://localhost:3000/api/auth/signin

> ⚠️ Cambiar la contraseña `admin123` antes de uso real o si terceros verán el sistema.
