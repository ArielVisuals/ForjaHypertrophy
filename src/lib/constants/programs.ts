// ─── Master Program Templates ─────────────────────────────────────────────────

export interface MasterProgram {
  name: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Elite";
  splitType: "Arnold" | "PPL" | "UpperLower" | "FullBody" | "BroSplit" | "Powerbuilding" | "UPLPPL";
  focus: "Hypertrophy" | "Strength" | "Powerbuilding";
  durationWeeks: number;
  features: string[];
}

export const MASTER_PROGRAMS: MasterProgram[] = [
  {
    name: "Arnold Split (Modern)",
    description:
      "La legendaria división de Arnold Schwarzenegger, optimizada para la ciencia moderna de la hipertrofia. Pecho/Espalda, Hombros/Brazos, Piernas.",
    level: "Advanced",
    splitType: "Arnold",
    focus: "Hypertrophy",
    durationWeeks: 8,
    features: ["Frecuencia 2x", "Volumen Alto", "Especialización de Brazos"],
  },
  {
    name: "Push Pull Legs (PPL)",
    description:
      "El estándar de oro para atletas naturales. Divide el cuerpo por patrones de movimiento para maximizar la recuperación y el crecimiento.",
    level: "Intermediate",
    splitType: "PPL",
    focus: "Hypertrophy",
    durationWeeks: 12,
    features: ["Balance Perfecto", "Auto-regulación RPE", "Escalable"],
  },
  {
    name: "Elite Upper/Lower",
    description:
      "Enfocado en la sobrecarga progresiva pesada. 4 días de entrenamiento intenso para quienes priorizan la densidad muscular.",
    level: "Intermediate",
    splitType: "UpperLower",
    focus: "Powerbuilding",
    durationWeeks: 10,
    features: ["Máxima Fuerza", "Alta Intensidad", "Recuperación Óptima"],
  },
  {
    name: "Full Body 3x",
    description:
      "Tres sesiones semanales de cuerpo completo con alta frecuencia por músculo. Ideal para maximizar la señal anabólica sin exceso de volumen.",
    level: "Beginner",
    splitType: "FullBody",
    focus: "Hypertrophy",
    durationWeeks: 8,
    features: ["Frecuencia 3x/semana", "Mínimo Equipamiento", "Ideal para Principiantes"],
  },
  {
    name: "5-Day Bro Split",
    description:
      "Un músculo por día, máximo volumen de aislamiento. La ruta clásica del culturismo tradicional para atletas que buscan especialización extrema.",
    level: "Advanced",
    splitType: "BroSplit",
    focus: "Hypertrophy",
    durationWeeks: 12,
    features: ["Especialización Total", "Máximo Volumen por Músculo", "Modo Culturismo"],
  },
  {
    name: "UPLPPL — Alta Frecuencia & Densidad",
    description:
      "Split híbrido Upper / Lower / Push / Pull / Legs con día de Mantenimiento y Lavado Metabólico a mitad de semana. 6 días activos de alta frecuencia y densidad máxima para disipar fatiga central sin dejar de progresar.",
    level: "Elite",
    splitType: "UPLPPL",
    focus: "Hypertrophy",
    durationWeeks: 12,
    features: ["Upper · Lower · Push · Pull · Legs", "Lavado Metabólico Mid-Week", "6 Días Activos + Silencio Térmico"],
  },
  {
    name: "Powerbuilding 531",
    description:
      "Combinación de fuerza con los levantamientos principales (squat, bench, deadlift) y trabajo de hipertrofia complementario. Gana fuerza y masa simultáneamente.",
    level: "Intermediate",
    splitType: "Powerbuilding",
    focus: "Powerbuilding",
    durationWeeks: 16,
    features: ["Squat · Bench · Deadlift · OHP", "Progresión Lineal 5/3/1", "Bloque de Hipertrofia"],
  },
];

// ─── Program Day Structure ────────────────────────────────────────────────────

export interface ProgramExercise {
  name: string;
  muscleGroup: string;
  targetSets: number;
  repRange: string;
  rirTarget: number;
  notes?: string;
}

export interface ProgramDaySchedule {
  dayNumber: number;
  name: string;
  shortName: string;
  focusMuscles: string[];
  exercises: ProgramExercise[];
  isRest: boolean;
}

// ─── Weekly Schedules (indexed 0=Sun, 1=Mon, ..., 6=Sat) ─────────────────────

const ARNOLD_SCHEDULE: (ProgramDaySchedule | null)[] = [
  // Sunday — Rest
  null,
  // Monday — Chest + Back
  {
    dayNumber: 1, name: "Pecho + Espalda", shortName: "Chest/Back",
    focusMuscles: ["chest", "back"],
    isRest: false,
    exercises: [
      { name: "Press de Banca",       muscleGroup: "chest", targetSets: 4, repRange: "6-10", rirTarget: 2 },
      { name: "Remo con Barra",       muscleGroup: "back",  targetSets: 4, repRange: "6-10", rirTarget: 2 },
      { name: "Press Inclinado DB",   muscleGroup: "chest", targetSets: 3, repRange: "8-12", rirTarget: 2 },
      { name: "Dominadas",            muscleGroup: "back",  targetSets: 3, repRange: "6-10", rirTarget: 2 },
      { name: "Aperturas en Cable",   muscleGroup: "chest", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Face Pulls",           muscleGroup: "back",  targetSets: 3, repRange: "15-20", rirTarget: 1 },
    ],
  },
  // Tuesday — Shoulders + Arms
  {
    dayNumber: 2, name: "Hombros + Brazos", shortName: "Shoulders/Arms",
    focusMuscles: ["shoulders", "arms"],
    isRest: false,
    exercises: [
      { name: "Press Militar",          muscleGroup: "shoulders", targetSets: 4, repRange: "6-10", rirTarget: 2 },
      { name: "Curl de Barra",          muscleGroup: "arms",      targetSets: 4, repRange: "8-12", rirTarget: 2 },
      { name: "Elevaciones Laterales",  muscleGroup: "shoulders", targetSets: 4, repRange: "12-15", rirTarget: 1 },
      { name: "Extensiones en Polea",   muscleGroup: "arms",      targetSets: 3, repRange: "10-15", rirTarget: 1 },
      { name: "Curl Martillo",          muscleGroup: "arms",      targetSets: 3, repRange: "10-12", rirTarget: 2 },
      { name: "Skull Crushers",         muscleGroup: "arms",      targetSets: 3, repRange: "10-12", rirTarget: 2 },
    ],
  },
  // Wednesday — Legs
  {
    dayNumber: 3, name: "Piernas", shortName: "Legs",
    focusMuscles: ["legs", "core"],
    isRest: false,
    exercises: [
      { name: "Sentadilla",            muscleGroup: "legs", targetSets: 4, repRange: "6-10", rirTarget: 2 },
      { name: "Peso Muerto Rumano",    muscleGroup: "legs", targetSets: 4, repRange: "8-12", rirTarget: 2 },
      { name: "Prensa de Piernas",     muscleGroup: "legs", targetSets: 3, repRange: "10-15", rirTarget: 2 },
      { name: "Curl de Femoral",       muscleGroup: "legs", targetSets: 3, repRange: "10-15", rirTarget: 1 },
      { name: "Elevación de Pantorra", muscleGroup: "legs", targetSets: 4, repRange: "12-20", rirTarget: 1 },
    ],
  },
  // Thursday — Chest + Back
  {
    dayNumber: 4, name: "Pecho + Espalda", shortName: "Chest/Back",
    focusMuscles: ["chest", "back"],
    isRest: false,
    exercises: [
      { name: "Press de Banca",           muscleGroup: "chest", targetSets: 4, repRange: "8-12", rirTarget: 2 },
      { name: "Remo en Polea",            muscleGroup: "back",  targetSets: 4, repRange: "10-12", rirTarget: 2 },
      { name: "Fondos en Paralelas",      muscleGroup: "chest", targetSets: 3, repRange: "8-12", rirTarget: 2 },
      { name: "Jalón al Pecho",           muscleGroup: "back",  targetSets: 3, repRange: "10-12", rirTarget: 2 },
      { name: "Press Declinado",          muscleGroup: "chest", targetSets: 3, repRange: "10-15", rirTarget: 1 },
    ],
  },
  // Friday — Shoulders + Arms
  {
    dayNumber: 5, name: "Hombros + Brazos", shortName: "Shoulders/Arms",
    focusMuscles: ["shoulders", "arms"],
    isRest: false,
    exercises: [
      { name: "Press Arnold",           muscleGroup: "shoulders", targetSets: 4, repRange: "8-12", rirTarget: 2 },
      { name: "Curl Predicador",        muscleGroup: "arms",      targetSets: 3, repRange: "10-12", rirTarget: 2 },
      { name: "Elevaciones Frontales",  muscleGroup: "shoulders", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Extensiones sobre Cabeza", muscleGroup: "arms",   targetSets: 3, repRange: "10-15", rirTarget: 1 },
      { name: "Curl Concentrado",       muscleGroup: "arms",      targetSets: 3, repRange: "12-15", rirTarget: 1 },
    ],
  },
  // Saturday — Legs
  {
    dayNumber: 6, name: "Piernas", shortName: "Legs",
    focusMuscles: ["legs"],
    isRest: false,
    exercises: [
      { name: "Sentadilla Búlgara",     muscleGroup: "legs", targetSets: 4, repRange: "8-12", rirTarget: 2 },
      { name: "Peso Muerto",            muscleGroup: "legs", targetSets: 4, repRange: "5-8",  rirTarget: 2 },
      { name: "Extensión de Cuádricep", muscleGroup: "legs", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Curl de Femoral",        muscleGroup: "legs", targetSets: 3, repRange: "12-15", rirTarget: 1 },
    ],
  },
];

const PPL_SCHEDULE: (ProgramDaySchedule | null)[] = [
  // Sunday — Rest
  null,
  // Monday — Push
  {
    dayNumber: 1, name: "Push (Empuje)", shortName: "Push",
    focusMuscles: ["chest", "shoulders", "arms"],
    isRest: false,
    exercises: [
      { name: "Press de Banca",         muscleGroup: "chest",     targetSets: 4, repRange: "6-10", rirTarget: 2 },
      { name: "Press Militar",          muscleGroup: "shoulders", targetSets: 3, repRange: "8-12", rirTarget: 2 },
      { name: "Press Inclinado DB",     muscleGroup: "chest",     targetSets: 3, repRange: "8-12", rirTarget: 2 },
      { name: "Elevaciones Laterales",  muscleGroup: "shoulders", targetSets: 4, repRange: "12-15", rirTarget: 1 },
      { name: "Extensiones en Polea",   muscleGroup: "arms",      targetSets: 3, repRange: "10-15", rirTarget: 1 },
      { name: "Skull Crushers",         muscleGroup: "arms",      targetSets: 3, repRange: "10-12", rirTarget: 2 },
    ],
  },
  // Tuesday — Pull
  {
    dayNumber: 2, name: "Pull (Tirón)", shortName: "Pull",
    focusMuscles: ["back", "arms"],
    isRest: false,
    exercises: [
      { name: "Remo con Barra",      muscleGroup: "back", targetSets: 4, repRange: "6-10", rirTarget: 2 },
      { name: "Dominadas",           muscleGroup: "back", targetSets: 4, repRange: "6-10", rirTarget: 2 },
      { name: "Remo en Polea",       muscleGroup: "back", targetSets: 3, repRange: "10-12", rirTarget: 2 },
      { name: "Face Pulls",          muscleGroup: "back", targetSets: 3, repRange: "15-20", rirTarget: 1 },
      { name: "Curl de Barra",       muscleGroup: "arms", targetSets: 3, repRange: "8-12",  rirTarget: 2 },
      { name: "Curl Martillo",       muscleGroup: "arms", targetSets: 3, repRange: "10-12", rirTarget: 2 },
    ],
  },
  // Wednesday — Legs
  {
    dayNumber: 3, name: "Piernas", shortName: "Legs",
    focusMuscles: ["legs", "core"],
    isRest: false,
    exercises: [
      { name: "Sentadilla",            muscleGroup: "legs", targetSets: 4, repRange: "6-10", rirTarget: 2 },
      { name: "Peso Muerto Rumano",    muscleGroup: "legs", targetSets: 4, repRange: "8-12", rirTarget: 2 },
      { name: "Prensa de Piernas",     muscleGroup: "legs", targetSets: 3, repRange: "10-15", rirTarget: 2 },
      { name: "Curl de Femoral",       muscleGroup: "legs", targetSets: 3, repRange: "10-15", rirTarget: 1 },
      { name: "Elevación de Pantorra", muscleGroup: "legs", targetSets: 4, repRange: "12-20", rirTarget: 1 },
    ],
  },
  // Thursday — Push
  {
    dayNumber: 4, name: "Push (Empuje)", shortName: "Push",
    focusMuscles: ["chest", "shoulders", "arms"],
    isRest: false,
    exercises: [
      { name: "Press Inclinado con Barra", muscleGroup: "chest",     targetSets: 4, repRange: "8-12", rirTarget: 2 },
      { name: "Press Arnold",              muscleGroup: "shoulders", targetSets: 3, repRange: "8-12", rirTarget: 2 },
      { name: "Aperturas en Cable",        muscleGroup: "chest",     targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Elevaciones Laterales",     muscleGroup: "shoulders", targetSets: 4, repRange: "15-20", rirTarget: 1 },
      { name: "Fondos en Paralelas",       muscleGroup: "arms",      targetSets: 3, repRange: "8-12",  rirTarget: 2 },
    ],
  },
  // Friday — Pull
  {
    dayNumber: 5, name: "Pull (Tirón)", shortName: "Pull",
    focusMuscles: ["back", "arms"],
    isRest: false,
    exercises: [
      { name: "Peso Muerto",        muscleGroup: "back", targetSets: 4, repRange: "4-6",  rirTarget: 2, notes: "Foco en explosividad" },
      { name: "Jalón al Pecho",     muscleGroup: "back", targetSets: 4, repRange: "10-12", rirTarget: 2 },
      { name: "Remo con Mancuerna", muscleGroup: "back", targetSets: 3, repRange: "10-12", rirTarget: 2 },
      { name: "Curl Predicador",    muscleGroup: "arms", targetSets: 3, repRange: "10-15", rirTarget: 1 },
      { name: "Curl Concentrado",   muscleGroup: "arms", targetSets: 3, repRange: "12-15", rirTarget: 1 },
    ],
  },
  // Saturday — Legs
  {
    dayNumber: 6, name: "Piernas", shortName: "Legs",
    focusMuscles: ["legs"],
    isRest: false,
    exercises: [
      { name: "Sentadilla Búlgara",     muscleGroup: "legs", targetSets: 4, repRange: "8-12", rirTarget: 2 },
      { name: "Peso Muerto Piernas Rígidas", muscleGroup: "legs", targetSets: 4, repRange: "10-12", rirTarget: 2 },
      { name: "Extensión de Cuádricep", muscleGroup: "legs", targetSets: 4, repRange: "12-15", rirTarget: 1 },
      { name: "Curl de Femoral",        muscleGroup: "legs", targetSets: 3, repRange: "12-15", rirTarget: 1 },
    ],
  },
];

const UPPER_LOWER_SCHEDULE: (ProgramDaySchedule | null)[] = [
  // Sunday — Rest
  null,
  // Monday — Upper A
  {
    dayNumber: 1, name: "Tren Superior A", shortName: "Upper A",
    focusMuscles: ["chest", "back", "shoulders", "arms"],
    isRest: false,
    exercises: [
      { name: "Press de Banca",         muscleGroup: "chest",     targetSets: 4, repRange: "4-6",  rirTarget: 2, notes: "Pesado — fuerza" },
      { name: "Remo con Barra",         muscleGroup: "back",      targetSets: 4, repRange: "4-6",  rirTarget: 2 },
      { name: "Press Militar",          muscleGroup: "shoulders", targetSets: 3, repRange: "6-10", rirTarget: 2 },
      { name: "Dominadas",              muscleGroup: "back",      targetSets: 3, repRange: "6-10", rirTarget: 2 },
      { name: "Curl de Barra",          muscleGroup: "arms",      targetSets: 3, repRange: "8-12", rirTarget: 2 },
      { name: "Extensiones en Polea",   muscleGroup: "arms",      targetSets: 3, repRange: "10-15", rirTarget: 1 },
    ],
  },
  // Tuesday — Lower A
  {
    dayNumber: 2, name: "Tren Inferior A", shortName: "Lower A",
    focusMuscles: ["legs", "core"],
    isRest: false,
    exercises: [
      { name: "Sentadilla",            muscleGroup: "legs", targetSets: 4, repRange: "4-6",  rirTarget: 2, notes: "Pesado — fuerza" },
      { name: "Peso Muerto Rumano",    muscleGroup: "legs", targetSets: 3, repRange: "8-12", rirTarget: 2 },
      { name: "Prensa de Piernas",     muscleGroup: "legs", targetSets: 3, repRange: "10-15", rirTarget: 2 },
      { name: "Curl de Femoral",       muscleGroup: "legs", targetSets: 3, repRange: "10-15", rirTarget: 1 },
      { name: "Elevación de Pantorra", muscleGroup: "legs", targetSets: 4, repRange: "12-20", rirTarget: 1 },
    ],
  },
  // Wednesday — Rest
  null,
  // Thursday — Upper B
  {
    dayNumber: 4, name: "Tren Superior B", shortName: "Upper B",
    focusMuscles: ["chest", "back", "shoulders", "arms"],
    isRest: false,
    exercises: [
      { name: "Press Inclinado DB",       muscleGroup: "chest",     targetSets: 4, repRange: "8-12", rirTarget: 2, notes: "Hipertrofia" },
      { name: "Remo en Polea",            muscleGroup: "back",      targetSets: 4, repRange: "10-12", rirTarget: 2 },
      { name: "Elevaciones Laterales",    muscleGroup: "shoulders", targetSets: 4, repRange: "12-15", rirTarget: 1 },
      { name: "Jalón al Pecho",           muscleGroup: "back",      targetSets: 3, repRange: "10-12", rirTarget: 2 },
      { name: "Curl Martillo",            muscleGroup: "arms",      targetSets: 3, repRange: "10-12", rirTarget: 2 },
      { name: "Skull Crushers",           muscleGroup: "arms",      targetSets: 3, repRange: "10-12", rirTarget: 2 },
    ],
  },
  // Friday — Lower B
  {
    dayNumber: 5, name: "Tren Inferior B", shortName: "Lower B",
    focusMuscles: ["legs"],
    isRest: false,
    exercises: [
      { name: "Peso Muerto",             muscleGroup: "legs", targetSets: 4, repRange: "4-6",  rirTarget: 2, notes: "Pesado — fuerza" },
      { name: "Sentadilla Búlgara",      muscleGroup: "legs", targetSets: 4, repRange: "8-12", rirTarget: 2 },
      { name: "Extensión de Cuádricep",  muscleGroup: "legs", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Curl de Femoral",         muscleGroup: "legs", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Elevación de Pantorra",   muscleGroup: "legs", targetSets: 4, repRange: "15-20", rirTarget: 1 },
    ],
  },
  // Saturday — Rest
  null,
];

const FULLBODY_SCHEDULE: (ProgramDaySchedule | null)[] = [
  // Sunday — Rest
  null,
  // Monday — Full Body A
  {
    dayNumber: 1, name: "Cuerpo Completo A", shortName: "Full A",
    focusMuscles: ["chest", "back", "legs", "shoulders"],
    isRest: false,
    exercises: [
      { name: "Sentadilla",            muscleGroup: "legs",      targetSets: 3, repRange: "5-8",  rirTarget: 2, notes: "Movimiento principal" },
      { name: "Press de Banca",        muscleGroup: "chest",     targetSets: 3, repRange: "5-8",  rirTarget: 2 },
      { name: "Remo con Barra",        muscleGroup: "back",      targetSets: 3, repRange: "5-8",  rirTarget: 2 },
      { name: "Press Militar",         muscleGroup: "shoulders", targetSets: 2, repRange: "8-12", rirTarget: 2 },
      { name: "Curl de Barra",         muscleGroup: "arms",      targetSets: 2, repRange: "10-12", rirTarget: 1 },
      { name: "Plancha",               muscleGroup: "core",      targetSets: 3, repRange: "30-60s", rirTarget: 1 },
    ],
  },
  // Tuesday — Rest
  null,
  // Wednesday — Full Body B
  {
    dayNumber: 3, name: "Cuerpo Completo B", shortName: "Full B",
    focusMuscles: ["legs", "back", "chest", "arms"],
    isRest: false,
    exercises: [
      { name: "Peso Muerto",           muscleGroup: "legs",      targetSets: 3, repRange: "4-6",  rirTarget: 2, notes: "Movimiento principal" },
      { name: "Press Inclinado DB",    muscleGroup: "chest",     targetSets: 3, repRange: "8-12", rirTarget: 2 },
      { name: "Dominadas",             muscleGroup: "back",      targetSets: 3, repRange: "6-10", rirTarget: 2 },
      { name: "Elevaciones Laterales", muscleGroup: "shoulders", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Extensiones en Polea",  muscleGroup: "arms",      targetSets: 2, repRange: "10-15", rirTarget: 1 },
      { name: "Crunch con Cable",      muscleGroup: "core",      targetSets: 3, repRange: "12-15", rirTarget: 1 },
    ],
  },
  // Thursday — Rest
  null,
  // Friday — Full Body C
  {
    dayNumber: 5, name: "Cuerpo Completo C", shortName: "Full C",
    focusMuscles: ["legs", "chest", "back", "shoulders", "arms"],
    isRest: false,
    exercises: [
      { name: "Prensa de Piernas",     muscleGroup: "legs",      targetSets: 4, repRange: "10-15", rirTarget: 2 },
      { name: "Aperturas en Cable",    muscleGroup: "chest",     targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Jalón al Pecho",        muscleGroup: "back",      targetSets: 3, repRange: "10-12", rirTarget: 2 },
      { name: "Face Pulls",            muscleGroup: "shoulders", targetSets: 3, repRange: "15-20", rirTarget: 1 },
      { name: "Curl Martillo",         muscleGroup: "arms",      targetSets: 3, repRange: "10-12", rirTarget: 1 },
      { name: "Elevación de Pantorra", muscleGroup: "legs",      targetSets: 4, repRange: "15-20", rirTarget: 1 },
    ],
  },
  // Saturday — Rest
  null,
];

const BROSPLIT_SCHEDULE: (ProgramDaySchedule | null)[] = [
  // Sunday — Rest
  null,
  // Monday — Chest
  {
    dayNumber: 1, name: "Pecho", shortName: "Chest",
    focusMuscles: ["chest"],
    isRest: false,
    exercises: [
      { name: "Press de Banca",          muscleGroup: "chest", targetSets: 4, repRange: "6-10",  rirTarget: 2 },
      { name: "Press Inclinado con Barra", muscleGroup: "chest", targetSets: 4, repRange: "8-12",  rirTarget: 2 },
      { name: "Press Inclinado DB",      muscleGroup: "chest", targetSets: 3, repRange: "10-12", rirTarget: 1 },
      { name: "Aperturas en Cable",      muscleGroup: "chest", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Fondos en Paralelas",     muscleGroup: "chest", targetSets: 3, repRange: "8-15",  rirTarget: 2 },
    ],
  },
  // Tuesday — Back
  {
    dayNumber: 2, name: "Espalda", shortName: "Back",
    focusMuscles: ["back"],
    isRest: false,
    exercises: [
      { name: "Peso Muerto",           muscleGroup: "back", targetSets: 4, repRange: "4-6",   rirTarget: 2, notes: "Fuerza base" },
      { name: "Remo con Barra",        muscleGroup: "back", targetSets: 4, repRange: "6-10",  rirTarget: 2 },
      { name: "Dominadas",             muscleGroup: "back", targetSets: 4, repRange: "6-10",  rirTarget: 2 },
      { name: "Jalón al Pecho",        muscleGroup: "back", targetSets: 3, repRange: "10-12", rirTarget: 2 },
      { name: "Remo con Mancuerna",    muscleGroup: "back", targetSets: 3, repRange: "10-12", rirTarget: 1 },
    ],
  },
  // Wednesday — Shoulders
  {
    dayNumber: 3, name: "Hombros", shortName: "Shoulders",
    focusMuscles: ["shoulders"],
    isRest: false,
    exercises: [
      { name: "Press Militar",          muscleGroup: "shoulders", targetSets: 4, repRange: "6-10",  rirTarget: 2 },
      { name: "Press Arnold",           muscleGroup: "shoulders", targetSets: 3, repRange: "8-12",  rirTarget: 2 },
      { name: "Elevaciones Laterales",  muscleGroup: "shoulders", targetSets: 5, repRange: "12-20", rirTarget: 1 },
      { name: "Elevaciones Frontales",  muscleGroup: "shoulders", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Face Pulls",             muscleGroup: "shoulders", targetSets: 4, repRange: "15-20", rirTarget: 1 },
    ],
  },
  // Thursday — Arms
  {
    dayNumber: 4, name: "Brazos", shortName: "Arms",
    focusMuscles: ["arms"],
    isRest: false,
    exercises: [
      { name: "Curl de Barra",           muscleGroup: "arms", targetSets: 4, repRange: "8-12",  rirTarget: 2 },
      { name: "Skull Crushers",          muscleGroup: "arms", targetSets: 4, repRange: "8-12",  rirTarget: 2 },
      { name: "Curl Predicador",         muscleGroup: "arms", targetSets: 3, repRange: "10-12", rirTarget: 1 },
      { name: "Extensiones en Polea",    muscleGroup: "arms", targetSets: 3, repRange: "10-15", rirTarget: 1 },
      { name: "Curl Martillo",           muscleGroup: "arms", targetSets: 3, repRange: "10-12", rirTarget: 1 },
      { name: "Extensiones sobre Cabeza", muscleGroup: "arms", targetSets: 3, repRange: "10-15", rirTarget: 1 },
    ],
  },
  // Friday — Legs
  {
    dayNumber: 5, name: "Piernas", shortName: "Legs",
    focusMuscles: ["legs", "core"],
    isRest: false,
    exercises: [
      { name: "Sentadilla",              muscleGroup: "legs", targetSets: 4, repRange: "6-10",  rirTarget: 2 },
      { name: "Peso Muerto Rumano",      muscleGroup: "legs", targetSets: 4, repRange: "8-12",  rirTarget: 2 },
      { name: "Prensa de Piernas",       muscleGroup: "legs", targetSets: 3, repRange: "10-15", rirTarget: 2 },
      { name: "Extensión de Cuádricep",  muscleGroup: "legs", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Curl de Femoral",         muscleGroup: "legs", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Elevación de Pantorra",   muscleGroup: "legs", targetSets: 5, repRange: "15-20", rirTarget: 1 },
    ],
  },
  // Saturday — Rest
  null,
];

const POWERBUILDING_SCHEDULE: (ProgramDaySchedule | null)[] = [
  // Sunday — Rest
  null,
  // Monday — Squat Day
  {
    dayNumber: 1, name: "Día de Sentadilla", shortName: "Squat Day",
    focusMuscles: ["legs", "core"],
    isRest: false,
    exercises: [
      { name: "Sentadilla",            muscleGroup: "legs", targetSets: 5, repRange: "3-5",   rirTarget: 2, notes: "Principal — 5/3/1" },
      { name: "Peso Muerto Rumano",    muscleGroup: "legs", targetSets: 4, repRange: "8-12",  rirTarget: 2 },
      { name: "Prensa de Piernas",     muscleGroup: "legs", targetSets: 3, repRange: "10-15", rirTarget: 2 },
      { name: "Curl de Femoral",       muscleGroup: "legs", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Plancha",               muscleGroup: "core", targetSets: 3, repRange: "30-60s", rirTarget: 1 },
    ],
  },
  // Tuesday — Bench Day
  {
    dayNumber: 2, name: "Día de Press de Banca", shortName: "Bench Day",
    focusMuscles: ["chest", "arms"],
    isRest: false,
    exercises: [
      { name: "Press de Banca",        muscleGroup: "chest", targetSets: 5, repRange: "3-5",   rirTarget: 2, notes: "Principal — 5/3/1" },
      { name: "Press Inclinado DB",    muscleGroup: "chest", targetSets: 4, repRange: "8-12",  rirTarget: 2 },
      { name: "Aperturas en Cable",    muscleGroup: "chest", targetSets: 3, repRange: "12-15", rirTarget: 1 },
      { name: "Curl de Barra",         muscleGroup: "arms",  targetSets: 3, repRange: "8-12",  rirTarget: 2 },
      { name: "Extensiones en Polea",  muscleGroup: "arms",  targetSets: 3, repRange: "10-15", rirTarget: 1 },
    ],
  },
  // Wednesday — Rest
  null,
  // Thursday — Deadlift Day
  {
    dayNumber: 4, name: "Día de Peso Muerto", shortName: "Deadlift Day",
    focusMuscles: ["back", "legs"],
    isRest: false,
    exercises: [
      { name: "Peso Muerto",           muscleGroup: "back", targetSets: 5, repRange: "3-5",   rirTarget: 2, notes: "Principal — 5/3/1" },
      { name: "Remo con Barra",        muscleGroup: "back", targetSets: 4, repRange: "6-10",  rirTarget: 2 },
      { name: "Jalón al Pecho",        muscleGroup: "back", targetSets: 3, repRange: "10-12", rirTarget: 2 },
      { name: "Face Pulls",            muscleGroup: "back", targetSets: 3, repRange: "15-20", rirTarget: 1 },
      { name: "Extensión de Cuádricep", muscleGroup: "legs", targetSets: 3, repRange: "12-15", rirTarget: 1 },
    ],
  },
  // Friday — OHP Day
  {
    dayNumber: 5, name: "Día de Press Militar", shortName: "OHP Day",
    focusMuscles: ["shoulders", "arms"],
    isRest: false,
    exercises: [
      { name: "Press Militar",         muscleGroup: "shoulders", targetSets: 5, repRange: "3-5",   rirTarget: 2, notes: "Principal — 5/3/1" },
      { name: "Elevaciones Laterales", muscleGroup: "shoulders", targetSets: 4, repRange: "12-20", rirTarget: 1 },
      { name: "Press Arnold",          muscleGroup: "shoulders", targetSets: 3, repRange: "8-12",  rirTarget: 2 },
      { name: "Skull Crushers",        muscleGroup: "arms",      targetSets: 3, repRange: "8-12",  rirTarget: 2 },
      { name: "Curl Martillo",         muscleGroup: "arms",      targetSets: 3, repRange: "10-12", rirTarget: 1 },
    ],
  },
  // Saturday — Rest
  null,
];

// ─── UPLPPL — Split Personalizado (UP + PPL Híbrido de Alta Frecuencia) ──────
// Índices 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
const UPLPPL_SCHEDULE: (ProgramDaySchedule | null)[] = [
  // [0] Domingo — SILENCIO TÉRMICO ABSOLUTO
  null,

  // [1] Lunes — UPPER (Fuerza / Torso Pesado)
  {
    dayNumber: 1,
    name: "Upper — Torso Pesado",
    shortName: "Upper",
    focusMuscles: ["chest", "back", "shoulders", "arms"],
    isRest: false,
    exercises: [
      {
        name: "Press Inclinado en Máquina",
        muscleGroup: "chest",
        targetSets: 4, repRange: "5-8", rirTarget: 2,
        notes: "Asiento 2 hoyitos arriba / Respaldo 3 hoyitos abajo. Pausa estática 1s abajo.",
      },
      {
        name: "Dominadas Lastradas",
        muscleGroup: "back",
        targetSets: 4, repRange: "5-8", rirTarget: 2,
        notes: "Cinturón + cadena corta pegada a la pelvis para evitar balanceo.",
      },
      {
        name: "Press Plano con Mancuernas",
        muscleGroup: "chest",
        targetSets: 3, repRange: "8-12", rirTarget: 2,
        notes: "Densidad pectoral y control excéntrico.",
      },
      {
        name: "Remo Pendlay con Déficit",
        muscleGroup: "back",
        targetSets: 4, repRange: "5-8", rirTarget: 2,
        notes: "Ganchos de potencia obligatorios. Torso estrictamente paralelo al suelo.",
      },
      {
        name: "Elevaciones Laterales",
        muscleGroup: "shoulders",
        targetSets: 4, repRange: "12-20", rirTarget: 1,
        notes: "Dropset en bloque 4 fases: Mancuernas + Máquina al fallo absoluto.",
      },
      {
        name: "Extensión Tras Nuca en Polea (Barra Z)",
        muscleGroup: "arms",
        targetSets: 3, repRange: "10-15", rirTarget: 1,
        notes: "Superset 6A — Isquemia final de brazos.",
      },
      {
        name: "Curl Martillo en Polea Baja con Cuerda",
        muscleGroup: "arms",
        targetSets: 3, repRange: "10-15", rirTarget: 1,
        notes: "Superset 6B — Tensión mecánica constante.",
      },
    ],
  },

  // [2] Martes — LOWER (Fuerza / Tren Inferior Pesado)
  {
    dayNumber: 2,
    name: "Lower — Tren Inferior Pesado",
    shortName: "Lower",
    focusMuscles: ["legs"],
    isRest: false,
    exercises: [
      {
        name: "Peso Muerto Rumano (RDL)",
        muscleGroup: "legs",
        targetSets: 4, repRange: "5-8", rirTarget: 2,
        notes: "Ganchos + cinturón mandatorios. Bisagra de cadera pura.",
      },
      {
        name: "Sentadilla Smith",
        muscleGroup: "legs",
        targetSets: 4, repRange: "6-10", rirTarget: 2,
        notes: "Recorrido vertical estricto. Profundidad Grass to Ass, rompiendo el paralelo.",
      },
      {
        name: "Prensa 45°",
        muscleGroup: "legs",
        targetSets: 3, repRange: "10-15", rirTarget: 2,
        notes: "Control excéntrico lento. Gestión de flujo y resíntesis de ATP.",
      },
      {
        name: "Curl de Pierna Sentado",
        muscleGroup: "legs",
        targetSets: 4, repRange: "10-12", rirTarget: 1,
        notes: "Torso inclinado al frente para estirar el isquio. Fase excéntrica 3s.",
      },
      {
        name: "Máquina de Aductores",
        muscleGroup: "legs",
        targetSets: 3, repRange: "12-15", rirTarget: 1,
        notes: "Blindaje de la cara interna del muslo.",
      },
      {
        name: "Pantorrilla en Máquina de Pie",
        muscleGroup: "legs",
        targetSets: 4, repRange: "12-20", rirTarget: 1,
        notes: "Pausa estática 2s en el fondo para anular el tendón de Aquiles.",
      },
    ],
  },

  // [3] Miércoles — MANTENIMIENTO, NÚCLEO Y LAVADO METABÓLICO
  {
    dayNumber: 3,
    name: "Mantenimiento + Lavado Metabólico",
    shortName: "Lavado",
    focusMuscles: ["shoulders", "arms", "core"],
    isRest: false,
    exercises: [
      {
        name: "Elevaciones Laterales",
        muscleGroup: "shoulders",
        targetSets: 4, repRange: "12-20", rirTarget: 1,
        notes: "Saldar deuda de hombro. Dropset 4 fases al fallo.",
      },
      {
        name: "Extensión Tras Nuca en Polea",
        muscleGroup: "arms",
        targetSets: 3, repRange: "10-15", rirTarget: 1,
        notes: "Superset 2A — Bombeo y reparación.",
      },
      {
        name: "Curl Martillo en Polea Baja con Cuerda",
        muscleGroup: "arms",
        targetSets: 3, repRange: "10-15", rirTarget: 1,
        notes: "Superset 2B — Cero carga pesada sobre el SNC.",
      },
      {
        name: "Crunch en Polea Alta",
        muscleGroup: "core",
        targetSets: 4, repRange: "12-15", rirTarget: 1,
        notes: "Aislamiento del recto abdominal. Cadera completamente inmovilizada.",
      },
      {
        name: "Elevación de Piernas en Silla Romana",
        muscleGroup: "core",
        targetSets: 3, repRange: "10-15", rirTarget: 1,
        notes: "Abdomen inferior. Enrollar la pelvis hacia el esternón.",
      },
      {
        name: "Cardio Zona 2 / Elíptica",
        muscleGroup: "core",
        targetSets: 1, repRange: "15-20 min", rirTarget: 0,
        notes: "110 BPM estrictos. Trance Blanco. Oxigenación de tejidos y barrido de ácido láctico.",
      },
    ],
  },

  // [4] Jueves — PUSH (Hipertrofia / Empuje)
  {
    dayNumber: 4,
    name: "Push — Empuje Hipertrofia",
    shortName: "Push",
    focusMuscles: ["chest", "shoulders", "arms"],
    isRest: false,
    exercises: [
      {
        name: "Press Inclinado en Máquina",
        muscleGroup: "chest",
        targetSets: 4, repRange: "8-12", rirTarget: 2,
        notes: "Mismo ajuste geométrico. Búsqueda de reps en el umbral de fallo fisiológico.",
      },
      {
        name: "Peck Deck",
        muscleGroup: "chest",
        targetSets: 4, repRange: "10-15", rirTarget: 1,
        notes: "Codos altos. Contracción máxima + remate con repeticiones parciales.",
      },
      {
        name: "Fondos en Paralelas Lastrados",
        muscleGroup: "chest",
        targetSets: 3, repRange: "8-12", rirTarget: 2,
        notes: "Cinturón de lastre. Torso inclinado al frente — porción inferior del pecho.",
      },
      {
        name: "Press Militar con Mancuernas",
        muscleGroup: "shoulders",
        targetSets: 4, repRange: "8-12", rirTarget: 2,
        notes: "Poder frontal para deltoides anterior. Rest-Pause táctico.",
      },
      {
        name: "Extensión Unilateral Cruzada en Polea",
        muscleGroup: "arms",
        targetSets: 3, repRange: "12-15", rirTarget: 1,
        notes: "Aislamiento puro. Vaciado de glucógeno de la cabeza lateral del tríceps.",
      },
    ],
  },

  // [5] Viernes — PULL (Hipertrofia / Tracción)
  {
    dayNumber: 5,
    name: "Pull — Expansión Dorsal",
    shortName: "Pull",
    focusMuscles: ["back", "shoulders", "arms"],
    isRest: false,
    exercises: [
      {
        name: "Dominadas Lastradas",
        muscleGroup: "back",
        targetSets: 4, repRange: "5-8", rirTarget: 2,
        notes: "Calidad de recorrido y estiramiento total.",
      },
      {
        name: "Remo Pendlay con Déficit",
        muscleGroup: "back",
        targetSets: 4, repRange: "5-8", rirTarget: 2,
        notes: "Ganchos obligatorios. Aniquilación de romboides y trapecio medio.",
      },
      {
        name: "Jalón Unilateral Hincado en Polea",
        muscleGroup: "back",
        targetSets: 3, repRange: "10-12", rirTarget: 2,
        notes: "Vector alineado para dorsal inferior. Maximizar el estiramiento.",
      },
      {
        name: "Peck Inverso en Máquina",
        muscleGroup: "shoulders",
        targetSets: 3, repRange: "12-15", rirTarget: 1,
        notes: "Blindaje trasero. Deltoides posterior. Dropset final.",
      },
      {
        name: "Curl Bayesiano en Cable",
        muscleGroup: "arms",
        targetSets: 3, repRange: "10-12", rirTarget: 1,
        notes: "Superset 5A — Máximo estiramiento con hombro extendido hacia atrás.",
      },
      {
        name: "Curl Martillo en Polea Baja con Cuerda",
        muscleGroup: "arms",
        targetSets: 3, repRange: "10-12", rirTarget: 1,
        notes: "Superset 5B — Enfoque en el braquial.",
      },
    ],
  },

  // [6] Sábado — LEGS + ABS (Volumen / Cierre)
  {
    dayNumber: 6,
    name: "Legs + Abs — Cierre Semanal",
    shortName: "Legs+Abs",
    focusMuscles: ["legs", "core"],
    isRest: false,
    exercises: [
      {
        name: "Curl Femoral Acostado",
        muscleGroup: "legs",
        targetSets: 3, repRange: "10-15", rirTarget: 1,
        notes: "Pre-activación y pre-fatiga de isquiotibiales. Parciales al fallo.",
      },
      {
        name: "Sentadilla Péndulo",
        muscleGroup: "legs",
        targetSets: 4, repRange: "8-12", rirTarget: 2,
        notes: "Cinturón. Profundidad máxima controlada, peleando en el fondo.",
      },
      {
        name: "Peso Muerto Rumano (RDL)",
        muscleGroup: "legs",
        targetSets: 4, repRange: "8-12", rirTarget: 2,
        notes: "Consolidación de bisagra pesada bajo fatiga acumulada.",
      },
      {
        name: "Curl de Pierna Sentado",
        muscleGroup: "legs",
        targetSets: 3, repRange: "10-12", rirTarget: 1,
        notes: "Tortura por estiramiento excéntrico 3s.",
      },
      {
        name: "Extensión de Piernas",
        muscleGroup: "legs",
        targetSets: 3, repRange: "12-15", rirTarget: 1,
        notes: "Vaciado residual de cuádriceps. Rest-Pause estricto.",
      },
      {
        name: "Máquina de Abducción",
        muscleGroup: "legs",
        targetSets: 3, repRange: "12-15", rirTarget: 1,
        notes: "Torso al frente para enfocar el glúteo medio.",
      },
      {
        name: "Pantorrilla en Máquina / Prensa",
        muscleGroup: "legs",
        targetSets: 4, repRange: "15-20", rirTarget: 1,
        notes: "Pausa 2s abajo al fallo por lactato.",
      },
      {
        name: "Crunch en Polea Alta",
        muscleGroup: "core",
        targetSets: 3, repRange: "12-15", rirTarget: 1,
        notes: "Blindaje final de núcleo.",
      },
      {
        name: "Cardio Zona 2 / Elíptica",
        muscleGroup: "core",
        targetSets: 1, repRange: "15-20 min", rirTarget: 0,
        notes: "110 BPM. Plomería biológica obligatoria para iniciar el fin de semana.",
      },
    ],
  },
];

export const SPLIT_SCHEDULES: Record<string, (ProgramDaySchedule | null)[]> = {
  Arnold:        ARNOLD_SCHEDULE,
  PPL:           PPL_SCHEDULE,
  UpperLower:    UPPER_LOWER_SCHEDULE,
  FullBody:      FULLBODY_SCHEDULE,
  BroSplit:      BROSPLIT_SCHEDULE,
  Powerbuilding: POWERBUILDING_SCHEDULE,
  UPLPPL:        UPLPPL_SCHEDULE,
};

/**
 * Devuelve el plan del día para el split dado, basado en el día de la semana actual.
 * Retorna null si es día de descanso o el split no está definido.
 */
export function getTodaysProgramDay(splitType: string): ProgramDaySchedule | null {
  const schedule = SPLIT_SCHEDULES[splitType];
  if (!schedule) return null;
  const dayOfWeek = new Date().getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
  return schedule[dayOfWeek] ?? null;
}

/**
 * Etiquetas de display para grupos musculares.
 */
export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest:     "Pecho",
  back:      "Espalda",
  legs:      "Piernas",
  shoulders: "Hombros",
  arms:      "Brazos",
  core:      "Core",
  full_body: "Cuerpo Completo",
};

/**
 * Rangos óptimos de sets semanales para hipertrofia por grupo muscular.
 */
export const WEEKLY_VOLUME_TARGETS: Record<string, { min: number; max: number }> = {
  chest:     { min: 10, max: 20 },
  back:      { min: 10, max: 20 },
  legs:      { min: 12, max: 20 },
  shoulders: { min: 10, max: 16 },
  arms:      { min: 8,  max: 15 },
  core:      { min: 8,  max: 15 },
  full_body: { min: 8,  max: 16 },
};
