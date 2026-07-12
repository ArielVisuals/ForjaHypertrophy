import { pgTable, text, timestamp, uuid, integer, decimal, boolean, jsonb, date, type AnyPgColumn } from "drizzle-orm/pg-core";

// Tabla de usuarios — identidad propia de la app (email + contraseña).
// Ids nuevos son uuid; las cuentas de la era Clerk conservan su id original.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  displayName: text("display_name"),
  role: text("role").notNull().default("athlete"), // 'athlete' | 'coach'
  coachId: text("coach_id").references((): AnyPgColumn => users.id), // null para coaches
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  passwordHash: text("password_hash"), // argon2id; null = cuenta migrada sin contraseña aun
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Sesiones de auth propia: el refresh token viaja opaco en cookie httpOnly
// y aqui solo se guarda su hash (sha256). Rotacion en cada refresh; revocable.
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  refreshTokenHash: text("refresh_token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Cuestionario de Evaluacion Inicial — una sola vez por usuario al crear cuenta.
// Secciones en jsonb para poder iterar preguntas sin migraciones; `version`
// indica que set de preguntas respondio cada quien.
export const intakeForms = pgTable("intake_forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  version: integer("version").notNull().default(1),
  goals: jsonb("goals").notNull(),         // objetivos y motivacion
  health: jsonb("health").notNull(),       // salud y estado fisico
  lifestyle: jsonb("lifestyle").notNull(), // habitos de vida y nutricion
  availability: jsonb("availability").notNull(), // disponibilidad y preferencias
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }), // cuando el coach lo reviso
});

// Tabla de ejercicios
export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(), // 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body'
  equipment: text("equipment"),
  instructions: text("instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de sesiones de workout (anteriormente 'workouts' en algunos contextos, unificamos a workout_sessions)
export const workoutSessions = pgTable("workout_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  programId: uuid("program_id"),
  name: text("name").notNull(),
  date: date("date").notNull(), // Añadido para compatibilidad con la lógica anterior
  weekNumber: integer("week_number"), // Añadido para compatibilidad
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes"),
  overallRpe: integer("overall_rpe"), // Añadido para compatibilidad
  completed: boolean("completed").default(false), // Añadido para compatibilidad
  notes: text("notes"),
  analysisSummary: text("analysis_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de sets
export const workoutSets = pgTable("workout_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutSessionId: uuid("workout_session_id")
    .references(() => workoutSessions.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: uuid("exercise_id")
    .references(() => exercises.id, { onDelete: "cascade" })
    .notNull(),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull(),
  weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
  restSeconds: integer("rest_seconds"),
  rpe: integer("rpe"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de templates de workout
export const workoutTemplates = pgTable("workout_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  exercises: jsonb("exercises").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de programas de entrenamiento (Mesociclos)
export const trainingPrograms = pgTable("training_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"), // NULL si es un "Master Template" global
  name: text("name").notNull(),
  description: text("description"),
  
  // Metadatos Técnicos
  level: text("level"), // 'Beginner', 'Intermediate', 'Advanced', 'Elite'
  splitType: text("split_type"), // 'PPL', 'Arnold', 'UpperLower', 'FullBody', 'BroSplit'
  focus: text("focus"), // 'Hypertrophy', 'Strength', 'Powerbuilding', 'WeakPoint'
  
  durationWeeks: integer("duration_weeks").default(8),
  currentWeek: integer("current_week").default(1),
  active: boolean("active").default(false),
  isMaster: boolean("is_master").default(false), // Indica si es de la "Biblioteca de Hierro"
  createdBy: text("created_by"), // coach autor; NULL para plantillas maestras del seed

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Dias de un programa (0=Dom ... 6=Sab). Los dias de descanso se guardan con isRest.
export const programDays = pgTable("program_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id")
    .references(() => trainingPrograms.id, { onDelete: "cascade" })
    .notNull(),
  dayNumber: integer("day_number").notNull(), // 0-6, indexado como Date.getDay()
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  isRest: boolean("is_rest").notNull().default(false),
});

// Prescripcion de ejercicios de cada dia
export const programExercises = pgTable("program_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  programDayId: uuid("program_day_id")
    .references(() => programDays.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  targetSets: integer("target_sets").notNull(),
  repRange: text("rep_range").notNull(),
  rirTarget: integer("rir_target"),
  notes: text("notes"),
});

// Tabla de medidas corporales (Expandida para Hypertrofia)
export const bodyMeasurements = pgTable("body_measurements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  // Composición Básica
  weightKg: decimal("weight_kg", { precision: 5, scale: 2 }).notNull(),
  bodyFatPercentage: decimal("body_fat_percentage", { precision: 4, scale: 2 }),
  
  // Tren Superior
  neckCm: decimal("neck_cm", { precision: 5, scale: 2 }),
  shouldersCm: decimal("shoulders_cm", { precision: 5, scale: 2 }),
  chestCm: decimal("chest_cm", { precision: 5, scale: 2 }),
  
  // Brazos (Simetría)
  armLeftCm: decimal("arm_left_cm", { precision: 5, scale: 2 }),
  armRightCm: decimal("arm_right_cm", { precision: 5, scale: 2 }),
  forearmLeftCm: decimal("forearm_left_cm", { precision: 5, scale: 2 }),
  forearmRightCm: decimal("forearm_right_cm", { precision: 5, scale: 2 }),
  
  // Tronco y Cadera
  waistCm: decimal("waist_cm", { precision: 5, scale: 2 }),
  hipsCm: decimal("hips_cm", { precision: 5, scale: 2 }),
  
  // Piernas (Simetría)
  thighLeftCm: decimal("thigh_left_cm", { precision: 5, scale: 2 }),
  thighRightCm: decimal("thigh_right_cm", { precision: 5, scale: 2 }),
  calfLeftCm: decimal("calf_left_cm", { precision: 5, scale: 2 }),
  calfRightCm: decimal("calf_right_cm", { precision: 5, scale: 2 }),
  
  // Biofeedback (1-10)
  sleepQuality: integer("sleep_quality"),
  energyLevel: integer("energy_level"),
  stressLevel: integer("stress_level"),

  // Foto de progreso (base64 comprimida client-side)
  photoUrl: text("photo_url"),

  measuredAt: timestamp("measured_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Plan alimenticio asignado por el entrenador a un atleta
export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: text("created_by").notNull(), // coach
  assignedTo: text("assigned_to")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(), // atleta
  name: text("name").notNull(),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  // Metas diarias del plan (sincronizan nutrition_targets al guardar)
  calories: integer("calories").notNull(),
  proteinG: integer("protein_g").notNull(),
  carbsG: integer("carbs_g").notNull(),
  fatsG: integer("fats_g").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Comidas del plan, agrupadas por franja del dia
export const mealPlanMeals = pgTable("meal_plan_meals", {
  id: uuid("id").primaryKey().defaultRandom(),
  mealPlanId: uuid("meal_plan_id")
    .references(() => mealPlans.id, { onDelete: "cascade" })
    .notNull(),
  slot: text("slot").notNull(), // 'desayuno' | 'almuerzo' | 'comida' | 'cena' | 'snack'
  order: integer("order").notNull(),
  name: text("name").notNull(),
  description: text("description"), // ingredientes / preparacion
  calories: decimal("calories", { precision: 7, scale: 2 }).notNull(),
  proteinG: decimal("protein_g", { precision: 6, scale: 2 }),
  carbsG: decimal("carbs_g", { precision: 6, scale: 2 }),
  fatsG: decimal("fats_g", { precision: 6, scale: 2 }),
});

// Tabla de logs de nutrición
export const nutritionLogs = pgTable("nutrition_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  mealName: text("meal_name").notNull(),
  calories: decimal("calories", { precision: 7, scale: 2 }).notNull(),
  proteinG: decimal("protein_g", { precision: 6, scale: 2 }),
  carbsG: decimal("carbs_g", { precision: 6, scale: 2 }),
  fatsG: decimal("fats_g", { precision: 6, scale: 2 }),
  // Comida del plan que registra; NULL = registro libre (fuera del plan)
  mealPlanMealId: uuid("meal_plan_meal_id").references(() => mealPlanMeals.id, { onDelete: "set null" }),
  loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de objetivos nutricionales (Metas diarias)
export const nutritionTargets = pgTable("nutrition_targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  calories: integer("calories").notNull().default(2500),
  proteinG: integer("protein_g").notNull().default(180),
  carbsG: integer("carbs_g").notNull().default(300),
  fatsG: integer("fats_g").notNull().default(70),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de comidas frecuentes (Staples)
export const nutritionStaples = pgTable("nutrition_staples", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  calories: decimal("calories", { precision: 7, scale: 2 }).notNull(),
  proteinG: decimal("protein_g", { precision: 6, scale: 2 }),
  carbsG: decimal("carbs_g", { precision: 6, scale: 2 }),
  fatsG: decimal("fats_g", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});



