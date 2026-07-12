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
        targetSets: 3, repRange: "5-8", rirTarget: 2,
        notes: "Asiento 2 hoyitos arriba / Respaldo 3 hoyitos abajo. Pausa 1s abajo. Serie 3 al Fallo Absoluto.",
      },
      {
        name: "Dominadas Lastradas",
        muscleGroup: "back",
        targetSets: 3, repRange: "5-8", rirTarget: 2,
        notes: "Cinturón + cadena corta pegada a la pelvis. Serie 3 al Fallo Absoluto.",
      },
      {
        name: "Press Plano con Mancuernas",
        muscleGroup: "chest",
        targetSets: 2, repRange: "8-12", rirTarget: 1,
        notes: "Ambas al Fallo por densidad pectoral.",
      },
      {
        name: "Remo Pendlay con Déficit",
        muscleGroup: "back",
        targetSets: 3, repRange: "5-8", rirTarget: 2,
        notes: "Ganchos de potencia obligatorios. Torso paralelo al suelo. Serie 3 al Fallo Técnico.",
      },
      {
        name: "Elevaciones Laterales",
        muscleGroup: "shoulders",
        targetSets: 2, repRange: "12-20", rirTarget: 1,
        notes: "Patrón 4 Fases en dropset: Mancuernas + Máquina al Fallo Absoluto.",
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
        targetSets: 3, repRange: "5-8", rirTarget: 2,
        notes: "Ganchos + cinturón obligatorios. Bisagra de cadera pura. Serie 3 al Fallo Técnico.",
      },
      {
        name: "Sentadilla Smith",
        muscleGroup: "legs",
        targetSets: 3, repRange: "6-10", rirTarget: 2,
        notes: "Profundidad Grass to Ass. Serie 3 al Fallo en los soportes.",
      },
      {
        name: "Prensa 45°",
        muscleGroup: "legs",
        targetSets: 3, repRange: "10-15", rirTarget: 1,
        notes: "Control excéntrico lento. Serie 3 al Fallo Absoluto.",
      },
      {
        name: "Curl de Pierna Sentado",
        muscleGroup: "legs",
        targetSets: 3, repRange: "10-12", rirTarget: 1,
        notes: "Torso al frente para estirar el isquio. Excéntrica 3s. Ambas al Fallo.",
      },
      {
        name: "Máquina de Aductores / Cerrar Piernas",
        muscleGroup: "legs",
        targetSets: 3, repRange: "12-15", rirTarget: 1,
        notes: "Al Fallo por blindaje interno del muslo.",
      },
      {
        name: "Pantorrilla en Máquina de Pie o Prensa",
        muscleGroup: "legs",
        targetSets: 3, repRange: "12-20", rirTarget: 1,
        notes: "Pausa estática 2s en el fondo al Fallo. Anular el tendón de Aquiles.",
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
        targetSets: 2, repRange: "12-20", rirTarget: 1,
        notes: "Saldar deuda de hombro. Patrón 4 Fases en dropset al fallo.",
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
        targetSets: 3, repRange: "12-15", rirTarget: 1,
        notes: "Aislamiento de recto abdominal. Cadera inmovilizada. Serie 3 al Fallo con Rest-Pause.",
      },
      {
        name: "Elevación de Piernas en Silla Romana",
        muscleGroup: "core",
        targetSets: 3, repRange: "10-15", rirTarget: 1,
        notes: "Al Fallo Técnico + Parciales. Enrollar la pelvis hacia el esternón.",
      },
      {
        name: "Cardio Zona 2 / Elíptica",
        muscleGroup: "core",
        targetSets: 1, repRange: "15-20 min", rirTarget: 0,
        notes: "110 BPM estrictos. Trance Blanco. Plomería biológica de tejidos.",
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
        targetSets: 3, repRange: "8-12", rirTarget: 2,
        notes: "Misma geometría. Serie 3 al Fallo Absoluto.",
      },
      {
        name: "Peck Deck",
        muscleGroup: "chest",
        targetSets: 2, repRange: "10-15", rirTarget: 1,
        notes: "Ambas al Fallo Absoluto con repeticiones parciales. Codos altos.",
      },
      {
        name: "Fondos en Paralelas Lastrados",
        muscleGroup: "chest",
        targetSets: 2, repRange: "8-12", rirTarget: 1,
        notes: "+5 kg de lastre. Ambas al Fallo con torso al frente — porción inferior del pecho.",
      },
      {
        name: "Press Militar con Mancuernas",
        muscleGroup: "shoulders",
        targetSets: 2, repRange: "8-12", rirTarget: 1,
        notes: "Ambas al Fallo + uso de Rest-Pause.",
      },
      {
        name: "Extensión Unilateral Cruzada en Polea",
        muscleGroup: "arms",
        targetSets: 2, repRange: "12-15", rirTarget: 1,
        notes: "2 series por brazo. Al Fallo Tembloroso + parciales. Vaciado de cabeza lateral del tríceps.",
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
        targetSets: 3, repRange: "5-8", rirTarget: 2,
        notes: "7.5 kg de lastre. Serie 3 al Fallo Absoluto.",
      },
      {
        name: "Remo Pendlay con Déficit",
        muscleGroup: "back",
        targetSets: 3, repRange: "5-8", rirTarget: 2,
        notes: "65 kg con ganchos de potencia. Serie 3 al Fallo Técnico.",
      },
      {
        name: "Jalón Unilateral Hincado en Polea",
        muscleGroup: "back",
        targetSets: 2, repRange: "10-12", rirTarget: 1,
        notes: "2 series por brazo. Ambas al Fallo + parciales en estiramiento. Dorsal inferior.",
      },
      {
        name: "Peck Inverso en Máquina",
        muscleGroup: "shoulders",
        targetSets: 2, repRange: "12-15", rirTarget: 1,
        notes: "Serie 2 al Fallo Absoluto + Dropset. Deltoides posterior.",
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
        targetSets: 2, repRange: "10-15", rirTarget: 1,
        notes: "Serie 2 al Fallo Absoluto + parciales para pre-activación de isquiotibiales.",
      },
      {
        name: "Sentadilla Péndulo",
        muscleGroup: "legs",
        targetSets: 3, repRange: "8-12", rirTarget: 2,
        notes: "Cinturón. Profundidad máxima. Serie 3 al Fallo en los soportes.",
      },
      {
        name: "Peso Muerto Rumano (RDL)",
        muscleGroup: "legs",
        targetSets: 3, repRange: "8-12", rirTarget: 2,
        notes: "Consolidación de bisagra bajo fatiga acumulada. Serie 3 al Fallo Técnico.",
      },
      {
        name: "Curl de Pierna Sentado",
        muscleGroup: "legs",
        targetSets: 2, repRange: "10-12", rirTarget: 1,
        notes: "Ambas al Fallo + parciales con excéntrica 3s.",
      },
      {
        name: "Extensión de Piernas",
        muscleGroup: "legs",
        targetSets: 2, repRange: "12-15", rirTarget: 1,
        notes: "Serie 2 al Fallo con Rest-Pause. Vaciado residual de cuádriceps.",
      },
      {
        name: "Máquina de Abducción / Abrir Piernas",
        muscleGroup: "legs",
        targetSets: 3, repRange: "12-15", rirTarget: 1,
        notes: "Al Fallo con parciales. Torso al frente — glúteo medio.",
      },
      {
        name: "Pantorrilla en Máquina o Prensa",
        muscleGroup: "legs",
        targetSets: 3, repRange: "15-20", rirTarget: 1,
        notes: "Pausa 2s abajo al Fallo por lactato.",
      },
      {
        name: "Crunch en Polea Alta",
        muscleGroup: "core",
        targetSets: 3, repRange: "12-15", rirTarget: 1,
        notes: "Blindaje abdominal final.",
      },
      {
        name: "Cardio Zona 2 / Elíptica",
        muscleGroup: "core",
        targetSets: 1, repRange: "15-20 min", rirTarget: 0,
        notes: "110 BPM. Lavado metabólico obligatorio para iniciar el fin de semana.",
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
  cardio:    "Cardio",
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
