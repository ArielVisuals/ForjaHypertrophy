# 🏋️ FORJA Hypertrophy App

Aplicación web completa para seguimiento de entrenamiento de hipertrofia con plan personalizado de 12 semanas.

## 🚀 Stack Tecnológico

- **Framework:** Astro 4.x con React islands
- **UI Components:** Magic UI + Radix UI (animaciones modernas)
- **Styling:** Tailwind CSS v4
- **Backend:** Supabase (Auth + Database + Storage)
- **Package Manager:** pnpm
- **TypeScript:** Strict mode
- **State Management:** Zustand
- **Charts:** Recharts
- **Date Management:** date-fns
- **Forms:** React Hook Form + Zod validation
- **Animations:** Framer Motion

## 📁 Estructura del Proyecto

```
/
├── src/
│   ├── components/          # Componentes React
│   │   ├── dashboard/       # Componentes del dashboard
│   │   ├── workout/         # Componentes workout logger
│   │   ├── progress/        # Componentes de progreso
│   │   ├── ui/              # Componentes UI reutilizables
│   │   └── shared/          # Componentes compartidos
│   ├── layouts/             # Layouts de Astro
│   ├── lib/
│   │   ├── db/              # Queries de base de datos
│   │   ├── constants.ts     # Constantes del proyecto
│   │   ├── supabase.ts      # Cliente de Supabase
│   │   └── utils.ts         # Funciones de utilidad
│   ├── pages/               # Rutas de Astro
│   ├── store/               # Stores de Zustand
│   ├── types/               # Tipos TypeScript
│   └── styles/
│       └── global.css       # Estilos globales + tema
├── supabase/
│   └── migrations/          # Migraciones SQL
├── public/                  # Assets estáticos
└── package.json
```

## 🗄️ Base de Datos

### Tablas Principales

- **users** - Perfil de usuario con datos físicos y objetivos
- **workouts** - Registro de sesiones de entrenamiento
- **exercises** - Ejercicios realizados en cada workout
- **body_measurements** - Medidas corporales y fotos
- **nutrition_log** - Registro diario de nutrición
- **personal_records** - Récords personales
- **program_template** - Template del programa de 12 semanas
- **achievements** - Logros desbloqueados

### Vistas

- **weekly_summary** - Resumen de progreso semanal
- **weight_progress** - Progreso de peso corporal
- **volume_by_muscle** - Volumen por grupo muscular

## 🎨 Design System

### Colores (Dark Theme)

```css
--color-bg-primary: #0a0a0a
--color-bg-secondary: #1a1a1a
--color-bg-card: #252525

--color-accent-primary: #3b82f6 (azul)
--color-accent-success: #10b981 (verde)
--color-accent-warning: #f59e0b (amarillo)
--color-accent-danger: #ef4444 (rojo)

/* Grupos Musculares */
--color-muscle-chest: #ef4444
--color-muscle-back: #3b82f6
--color-muscle-legs: #10b981
--color-muscle-shoulders: #f59e0b
--color-muscle-arms: #8b5cf6
```

### Tipografía

- **Headers:** Inter Bold
- **Body:** Inter Regular
- **Números/Stats:** JetBrains Mono

## 🔧 Configuración Inicial

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia `.env.example` a `.env`
3. Completa las variables de entorno:

```env
PUBLIC_SUPABASE_URL=tu-proyecto-url.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Ejecutar migraciones

```bash
# Para desarrollo local con Supabase CLI
supabase start
supabase db reset

# Para proyecto en la nube
supabase link --project-ref tu-project-ref
supabase db push
```

### 4. Generar tipos de TypeScript

```bash
pnpm run generate:types
```

### 5. Iniciar servidor de desarrollo

```bash
pnpm dev
```

## 📝 Scripts Disponibles

```bash
pnpm dev              # Iniciar servidor de desarrollo
pnpm build            # Build para producción
pnpm preview          # Preview del build
pnpm db:push          # Push migraciones a Supabase
pnpm db:reset         # Reset base de datos local
pnpm generate:types   # Generar tipos desde schema
```

## 🎯 Funcionalidades Core (Sprint 1 - MVP)

### ✅ Completado

- [x] Inicialización proyecto Astro + TypeScript
- [x] Configuración Tailwind con design system
- [x] Setup Supabase (schema + RLS)
- [x] Cliente Supabase y helpers de autenticación
- [x] Tipos TypeScript completos
- [x] Constantes y utilidades del proyecto
- [x] Helpers de base de datos (workouts)

### 🔄 Pendiente

- [ ] Sistema de autenticación (login/signup)
- [ ] Layout principal con navegación
- [ ] Dashboard con stats y gráficos
- [ ] Workout Logger funcional
- [ ] Componentes UI reutilizables (Magic UI)
- [ ] Seed data con 16 días de progreso

## 🚦 Próximos Pasos

### 1. Crear Sistema de Autenticación

Implementar páginas de login, signup y reset password usando Supabase Auth.

### 2. Desarrollar Layout Principal

Crear MainLayout con navegación responsive y header con usuario.

### 3. Dashboard

Implementar dashboard con:
- Stats clave (días consecutivos, adherencia, próxima sesión)
- Gráfico de progreso de peso
- PRs recientes
- Calendario semanal

### 4. Workout Logger

Desarrollar el logger de entrenamientos con:
- Pre-workout check
- Registro de ejercicios y series
- Timer de descanso
- Post-workout summary

### 5. Seed Data

Poblar la base de datos con los 16 días de progreso real del usuario.

## 📚 Recursos

- [Astro Documentation](https://docs.astro.build)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Magic UI](https://magicui.design)
- [Recharts](https://recharts.org)

## 🤝 Contribución

Este es un proyecto personal. Para sugerencias o mejoras, crear un issue.

## 📄 Licencia

MIT
