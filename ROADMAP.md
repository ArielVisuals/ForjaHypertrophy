# FORJA — Roadmap: Sistema Entrenador / Asesorado

Estado: propuesta para revision. Fecha: 2026-07-10.

## Vision general

Dos roles de usuario:

- **Atleta (asesorado)**: entrena, registra sesiones y comidas, ve su plan asignado.
- **Entrenador**: ve el registro diario de sus asesorados, asigna plan de entrenamiento, crea y asigna plan alimenticio, revisa el cuestionario de evaluacion inicial.

Relacion: cada atleta tiene exactamente un entrenador (`coach_id`). Por ahora existe un solo entrenador en el sistema, pero el modelo soporta varios sin cambios de esquema.

El flujo del alumno cambia de "autoservicio" a "asesorado":

| Hoy | Despues |
|---|---|
| El alumno elige un programa de `MASTER_PROGRAMS` en `ProgramManager` | El entrenador asigna el programa; el alumno solo lo ve y entrena |
| El alumno registra cualquier comida libre en Combustible | El alumno registra comidas del plan alimenticio que le asigno su entrenador |
| Cuenta nueva entra directo al dashboard | Cuenta nueva debe completar el Cuestionario de Evaluacion Inicial antes de acceder |

---

## Fase 0 — Fundacion (prerrequisito tecnico)

Sin esto, los roles no pueden ser seguros ni la migracion de auth sera barata.

### 0.1 Tabla `users` propia

Aunque hoy la identidad la da Clerk, creamos nuestra propia tabla. El `id` es texto y de momento coincide con el Clerk userId; en la Fase 2 se conserva el mismo id y solo se agregan credenciales. Esto desacopla todo el dominio de Clerk desde ya.

```
users
  id                    text PK          -- Clerk userId hoy; se conserva tras migrar
  email                 text unique not null
  displayName           text
  role                  text not null    -- 'athlete' | 'coach'
  coachId               text FK -> users.id (null para coaches)
  onboardingCompleted   boolean default false
  passwordHash          text             -- null hasta Fase 2
  createdAt / updatedAt timestamps
```

Nota: se usa columna `coachId` y no tabla intermedia porque la relacion es 1 entrenador -> N atletas. Si algun dia un atleta pudiera tener varios coaches, se migra a tabla `coach_athletes`.

### 0.2 Asegurar las APIs (critico)

Hoy `/api/programs`, `/api/nutrition`, `/api/workouts`, etc. reciben `userId` por query param y no verifican sesion: cualquier usuario autenticado (o no) puede leer/escribir datos de otro.

- Crear helper `requireUser(context)` que obtenga el userId desde la sesion de Clerk en el servidor (`context.locals.auth()`), nunca desde el cliente.
- Crear helper `requireCoachOf(coachId, athleteId)` para los endpoints del entrenador: valida que el atleta consultado tenga `coachId = sesion actual`.
- Refactorizar todos los endpoints en `src/pages/api/` para usar estos helpers y eliminar `userId` de query params / body.

### 0.3 Middleware por rol

Extender `src/middleware.ts`:

- Rutas de atleta: `/dashboard`, `/workout`, `/program`, `/progress`, `/nutrition`.
- Rutas de entrenador: `/coach/*`.
- Si `role = coach` intenta entrar a rutas de atleta se redirige a `/coach` y viceversa.
- Si `onboardingCompleted = false` y `role = athlete`, redirigir todo a `/onboarding`.

### 0.4 Alta del entrenador

Script de seed (o flag manual en DB) que marca la cuenta del entrenador colaborador con `role = 'coach'`. Todo registro nuevo por defecto es `role = 'athlete'` con `coachId` apuntando al unico coach existente (auto-asignacion mientras haya un solo entrenador).

---

## Fase 1 — Sistema Entrenador / Asesorado

### 1.1 Cuestionario de Evaluacion Inicial (`/onboarding`)

Formulario obligatorio en el primer inicio de sesion, multi-paso, con el diseño del sistema. Secciones:

1. **Objetivos y motivacion**: que quiere lograr (perder grasa, ganar musculo, salud), por que es importante, que le ha impedido lograrlo antes.
2. **Salud y estado fisico**: lesiones pasadas o actuales, enfermedades, medicamentos, nivel de actividad fisica reciente.
3. **Habitos de vida y nutricion**: alimentacion habitual, hidratacion, calidad del sueño, nivel de estres.
4. **Disponibilidad y preferencias**: dias por semana, tiempo por sesion, ejercicios que le gustan y que detesta.

Esquema:

```
intake_forms
  id            uuid PK
  userId        text FK -> users.id, unique
  version       integer default 1     -- el cuestionario evolucionara
  goals         jsonb                 -- seccion 1
  health        jsonb                 -- seccion 2
  lifestyle     jsonb                 -- seccion 3
  availability  jsonb                 -- seccion 4
  submittedAt   timestamp
  reviewedAt    timestamp             -- cuando el coach lo marco como revisado
```

Se usa jsonb por seccion (no columnas por pregunta) para poder iterar preguntas sin migraciones; `version` permite saber que set de preguntas respondio cada quien. Al enviar, se marca `users.onboardingCompleted = true`.

- API: `POST /api/intake` (atleta, una sola vez), `GET /api/coach/athletes/:id/intake` (coach).
- UI de onboarding con guardado de borrador en `localStorage` para no perder respuestas.

### 1.2 Programas asignados por el entrenador

Hoy la estructura de dias/ejercicios vive en codigo (`SPLIT_SCHEDULES`). Para que el coach pueda crear programas propios, esa estructura pasa a la base de datos:

```
training_programs (existente, se extiende)
  + createdBy   text FK -> users.id   -- el coach autor
  + assignedTo  text                  -- renombrar semanticamente userId: el atleta
  + status      text                  -- 'draft' | 'assigned' | 'active' | 'completed'
  (isMaster se mantiene: plantillas de la Biblioteca de Hierro)

program_days
  id          uuid PK
  programId   uuid FK -> training_programs
  dayNumber   integer               -- 0..6
  name        text                  -- 'Push', 'Pull', ...
  isRest      boolean

program_exercises
  id          uuid PK
  programDayId uuid FK -> program_days
  order       integer
  exerciseId  uuid FK -> exercises (o nombre libre + muscleGroup)
  targetSets  integer
  repRange    text
  rirTarget   integer
  notes       text
```

Trabajo:

- Seed: migrar `MASTER_PROGRAMS` + `SPLIT_SCHEDULES` de `constants/programs.ts` a estas tablas como plantillas (`isMaster = true`). El coach puede clonar una plantilla y ajustarla, o crear desde cero.
- **Constructor de programas** en el dashboard del coach: crear programa, definir dias, agregar ejercicios con series/reps/RIR (reusar `ExerciseSelector`).
- Asignacion: el coach asigna el programa a un atleta; solo puede haber uno activo por atleta.
- **Sustituir la logica actual del alumno**: `ProgramManager.tsx` y `program.astro` dejan de ofrecer catalogo y activacion; pasan a vista de solo lectura del programa asignado (semana actual, calendario semanal, detalle de cada dia). Estado vacio: "Tu entrenador aun no te asigna un programa".
- `WorkoutTracker` lee el dia correspondiente desde `program_days`/`program_exercises` en lugar de `SPLIT_SCHEDULES`.

### 1.3 Plan alimenticio asignado

```
meal_plans
  id          uuid PK
  createdBy   text FK -> users.id    -- coach
  assignedTo  text FK -> users.id    -- atleta
  name        text
  notes       text
  active      boolean
  -- targets diarios del plan
  calories / proteinG / carbsG / fatsG  integer

meal_plan_meals
  id          uuid PK
  mealPlanId  uuid FK -> meal_plans
  slot        text        -- 'desayuno' | 'almuerzo' | 'comida' | 'cena' | 'snack'
  order       integer
  name        text
  description text        -- ingredientes / preparacion
  calories / proteinG / carbsG / fatsG  decimal
```

- `nutrition_logs` gana `mealPlanMealId` (FK nullable): el registro normal es marcar una comida del plan como consumida (macros se copian del plan).
- **Sustituir registro libre**: en `NutritionTracker`, la vista principal del alumno muestra las comidas del dia segun su plan y un boton "Registrar" por comida. Decision recomendada: permitir ademas un registro manual marcado como "fuera del plan" para que el coach vea la adherencia real; si se prohibe del todo, el alumno simplemente no reporta lo que comio de mas y se pierde informacion. (Confirmar con el entrenador.)
- `nutritionTargets` del alumno pasan a derivarse del `meal_plan` activo.
- **Constructor de plan alimenticio** en el dashboard del coach: CRUD de planes y comidas, asignacion al atleta.

### 1.4 Dashboard del Entrenador (`/coach`)

Area nueva completa, mismo lenguaje visual del sistema:

- `/coach` — lista de asesorados con resumen: ultima sesion, adherencia semanal (sesiones completadas vs planeadas, comidas registradas), alertas (sin entrenar X dias, cuestionario sin revisar).
- `/coach/athletes/[id]` — detalle del atleta:
  - Registro de entrenamiento diario: sesiones, sets, pesos, RPE, notas y el analisis de El Arquitecto (reusar componentes de `progress/` como `WorkoutHistoryPanel`).
  - Cuestionario inicial completo con boton "Marcar como revisado".
  - Nutricion: plan asignado vs registrado por dia.
  - Acciones: asignar/cambiar programa, asignar/editar plan alimenticio.
- `/coach/programs` — constructor y biblioteca de programas (1.2).
- `/coach/nutrition` — constructor de planes alimenticios (1.3).
- APIs bajo `/api/coach/*`, todas protegidas con `requireCoachOf`.

### Orden sugerido de entrega (Fase 1)

1. Fase 0 completa (users, seguridad de APIs, middleware, seed del coach).
2. Cuestionario inicial + gate de onboarding (1.1) — valor inmediato para el entrenador y no depende del resto.
3. Migracion de programas a DB + vista read-only del alumno (1.2a).
4. Dashboard coach: lista de atletas + detalle con registro diario + intake (1.4 parcial).
5. Constructor de programas + asignacion (1.2b).
6. Planes alimenticios: constructor, asignacion y nuevo flujo de registro del alumno (1.3).

---

## Fase 2 — Auth propia con JWT (salir de Clerk)

Registro e inicio de sesion solo con correo y contraseña.

### 2.1 Backend de credenciales

- `users.passwordHash` con **argon2id** (paquete `@node-rs/argon2`), parametros OWASP.
- Validacion con zod: email valido, contraseña minimo 8+ caracteres verificada contra listas de contraseñas comunes (no reglas arbitrarias de simbolos, alineado a NIST 800-63B).
- Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`.
- Rate limiting en login/register (por IP y por cuenta) para frenar fuerza bruta.
- Verificacion de correo por token firmado de un solo uso (recomendado; requiere proveedor de email tipo Resend).

### 2.2 Sesiones

- **Access token JWT** de vida corta (15 min) + **refresh token** opaco con rotacion, guardado hasheado en tabla `sessions` (permite revocar).
- Ambos en cookies `httpOnly; Secure; SameSite=Lax; Path=/` — nunca en localStorage.
- Firma HS256 con secreto en env var, o EdDSA si se preve otro consumidor del token.
- Reemplazar `clerkMiddleware` por middleware propio: verifica el JWT, popula `context.locals.user` con `{ id, role, coachId, onboardingCompleted }`. Como toda la app ya usara `requireUser` (Fase 0), el cambio queda contenido en el middleware y los helpers.

### 2.3 Migracion de usuarios

- Los ids de `users` no cambian (ya son texto). Los datos historicos quedan intactos.
- Usuarios existentes: al no tener `passwordHash`, en su primer login post-migracion se les pide establecer contraseña mediante enlace enviado a su correo (ya lo tenemos en `users.email`).
- Retirar `@clerk/astro`, `@clerk/themes`, `useAuth` pasa a consumir `/api/auth/me`, y limpiar `UserMenu`, `LandingHeader`, `MobileMenu`, `MainLayout`, `dashboard.astro`, `index.astro`, `global.css`.

### 2.4 UI de autenticacion

- Rediseñar el modal/paginas de login y registro con el lenguaje visual de FORJA (fondo oscuro, tipografia black condensada, acentos azules), sustituyendo los componentes de Clerk.
- Flujos: registro, login, olvido de contraseña (token por email), establecer contraseña (migrados).

### 2.5 Recuperacion y hardening

- Reset de contraseña con token de un solo uso y expiracion corta.
- Header `Cache-Control: no-store` en respuestas de auth, comparacion en tiempo constante, mensajes de error genericos ("credenciales invalidas") para no revelar si el correo existe.
- Logout que revoca el refresh token en DB.

---

## Decisiones abiertas (no bloquean el arranque)

1. Comidas fuera del plan: permitidas y marcadas, o bloqueadas por completo. Recomendacion: permitidas y marcadas, para medir adherencia real.
2. Registro de cuentas en Fase 2: abierto (cualquiera se registra y se auto-asigna al coach) o por invitacion del coach. Con un solo entrenador y cupo limitado, por invitacion es mas sano; abierto es menos friccion.
3. Que puede editar el atleta de su programa asignado: nada, o sustituir un ejercicio puntual (por equipo no disponible). Recomendacion: permitir sustitucion con registro visible para el coach.
