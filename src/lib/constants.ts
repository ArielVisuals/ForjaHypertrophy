/**
 * Constantes globales del proyecto Forja Hypertrophy App
 */

// Tipos de días de entrenamiento
export const DAY_TYPES = {
  PUSH_A: "PUSH_A",
  PULL_A: "PULL_A",
  LEGS_A: "LEGS_A",
  PUSH_B: "PUSH_B",
  PULL_B: "PULL_B",
  LEGS_B: "LEGS_B",
  REST: "REST",
} as const;

export type DayType = (typeof DAY_TYPES)[keyof typeof DAY_TYPES];

// Fases del mesociclo
export const PHASES = {
  ADAPTATION: "adaptation",
  INTENSIFICATION: "intensification",
  PEAK: "peak",
  DELOAD: "deload",
} as const;

export type Phase = (typeof PHASES)[keyof typeof PHASES];

// Grupos musculares
export const MUSCLE_GROUPS = {
  CHEST: "chest",
  BACK: "back",
  LEGS: "legs",
  SHOULDERS: "shoulders",
  ARMS: "arms",
  CORE: "core",
} as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[keyof typeof MUSCLE_GROUPS];

// Colores por grupo muscular
export const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: "#ef4444",
  back: "#3b82f6",
  legs: "#10b981",
  shoulders: "#f59e0b",
  arms: "#8b5cf6",
  core: "#ec4899",
};

// Ejercicios principales por grupo muscular
export const EXERCISE_LIBRARY = {
  chest: [
    {
      name: "Press Banca Plano",
      equipment: "Barra",
      difficulty: "intermediate",
      cues: [
        "Escápulas retraídas y deprimidas",
        "Barra a línea de pezones",
        "Codos 45° del torso",
        "Empuje explosivo, descenso controlado 2-3s",
      ],
    },
    {
      name: "Press Inclinado con Mancuernas",
      equipment: "Mancuernas",
      difficulty: "intermediate",
      cues: [
        "Banco 30-45°",
        "Trayectoria ligeramente convergente",
        "Estiramiento completo abajo",
        "No chocar mancuernas arriba",
      ],
    },
    {
      name: "Aperturas en Contractora",
      equipment: "Máquina",
      difficulty: "beginner",
      cues: [
        "Escápulas fijas en respaldo",
        "Contracción máxima al final",
        "Codos ligeramente flexionados",
        "Fase excéntrica controlada",
      ],
    },
  ],
  back: [
    {
      name: "Dominadas Pronadas",
      equipment: "Peso corporal",
      difficulty: "advanced",
      cues: [
        "Agarre ancho pronado",
        "Pecho hacia la barra",
        "Escápulas deprimidas inicio",
        "Barbilla sobre barra",
      ],
    },
    {
      name: "Jalón al Pecho",
      equipment: "Polea",
      difficulty: "beginner",
      cues: [
        "Inclinación leve hacia atrás",
        "Barra a esternón superior",
        "Codos hacia bolsillos traseros",
        "No balanceo",
      ],
    },
    {
      name: "Remo con Barra",
      equipment: "Barra",
      difficulty: "intermediate",
      cues: [
        "Torso 45° respecto al suelo",
        "Barra a ombligo",
        "Retracción escapular al final",
        "Columna neutra",
      ],
    },
    {
      name: "Peso Muerto Rumano",
      equipment: "Barra",
      difficulty: "intermediate",
      cues: [
        "Bisagra de cadera",
        "Rodillas ligeramente flexionadas",
        "Barra pegada a piernas",
        "Estiramiento isquios sin redondear espalda",
      ],
    },
  ],
  legs: [
    {
      name: "Sentadilla con Barra",
      equipment: "Barra",
      difficulty: "intermediate",
      cues: [
        "Profundidad muslo paralelo o bajo",
        "Rodillas alineadas con pies",
        "Peso en mediopié",
        "Torso erguido, core activado",
      ],
    },
    {
      name: "Prensa de Piernas",
      equipment: "Máquina",
      difficulty: "beginner",
      cues: [
        "Pies ancho hombros",
        "Rodillas 90° abajo",
        "No despegar glúteos",
        "Empuje con talones",
      ],
    },
    {
      name: "Extensiones de Cuádriceps",
      equipment: "Máquina",
      difficulty: "beginner",
      cues: [
        "Rodillas alineadas con pivote",
        "Extensión completa arriba",
        "Descenso controlado",
        "Punto de máxima tensión 1s",
      ],
    },
    {
      name: "Curl Femoral Acostado",
      equipment: "Máquina",
      difficulty: "beginner",
      cues: [
        "Cadera pegada al banco",
        "Rodillas fuera del borde",
        "Flexión completa",
        "No arquear espalda baja",
      ],
    },
  ],
  shoulders: [
    {
      name: "Press Militar con Barra",
      equipment: "Barra",
      difficulty: "intermediate",
      cues: [
        "Barra desde clavículas",
        "Trayectoria vertical",
        "Cabeza pasa entre brazos",
        "Core activado, no hiperextensión lumbar",
      ],
    },
    {
      name: "Elevaciones Laterales",
      equipment: "Mancuernas",
      difficulty: "beginner",
      cues: [
        "Codos ligeramente flexionados",
        "Levantar hasta altura hombros",
        "No balanceo",
        "Deltoides laterales arriba, no trapecios",
      ],
    },
    {
      name: "Face Pulls",
      equipment: "Polea",
      difficulty: "beginner",
      cues: [
        "Polea alta",
        "Cuerda hacia frente",
        "Retracción escapular máxima",
        "Rotación externa hombros",
      ],
    },
  ],
  arms: [
    {
      name: "Curl con Barra Z",
      equipment: "Barra Z",
      difficulty: "beginner",
      cues: [
        "Codos pegados al torso",
        "No balanceo",
        "Contracción pico arriba",
        "Descenso controlado completo",
      ],
    },
    {
      name: "Curl Martillo",
      equipment: "Mancuernas",
      difficulty: "beginner",
      cues: [
        "Agarre neutro",
        "Codos fijos",
        "Alternado o simultáneo",
        "Énfasis braquial y antebrazo",
      ],
    },
    {
      name: "Press Francés",
      equipment: "Barra Z",
      difficulty: "intermediate",
      cues: [
        "Codos apuntando al techo",
        "No abrir codos",
        "Descenso controlado a frente",
        "Extensión completa sin bloqueo",
      ],
    },
    {
      name: "Fondos en Paralelas",
      equipment: "Peso corporal",
      difficulty: "intermediate",
      cues: [
        "Inclinación hacia adelante (pecho) o vertical (tríceps)",
        "Descenso hasta 90°",
        "Codos pegados al cuerpo",
        "Empuje explosivo",
      ],
    },
  ],
  core: [
    {
      name: "Plancha Frontal",
      equipment: "Peso corporal",
      difficulty: "beginner",
      cues: [
        "Codos bajo hombros",
        "Línea recta cabeza-talones",
        "Core activado",
        "No dejar caer cadera",
      ],
    },
    {
      name: "Rueda Abdominal",
      equipment: "Rueda AB",
      difficulty: "advanced",
      cues: [
        "Inicio arrodillado",
        "Extensión controlada",
        "No arquear espalda baja",
        "Retorno con abdomen",
      ],
    },
  ],
};

// Rangos de series óptimos por músculo por semana
export const OPTIMAL_WEEKLY_SETS: Record<MuscleGroup, { min: number; max: number }> = {
  chest: { min: 12, max: 18 },
  back: { min: 14, max: 20 },
  legs: { min: 15, max: 22 },
  shoulders: { min: 12, max: 18 },
  arms: { min: 10, max: 16 },
  core: { min: 8, max: 12 },
};

// Frases motivacionales del usuario
export const MOTIVATIONAL_QUOTES = [
  "Soy el mejor, cuestión de tiempo",
  "No puedo rendirme, hoy no",
  "Soy capaz, es normal para mí",
  "Cada rep me acerca a mi meta",
  "El dolor es temporal, el progreso es permanente",
  "No hay límites, solo barreras mentales",
  "Hoy es el día para romper récords",
  "La consistencia vence al talento",
  "Forja tu mejor versión, rep a rep",
];

// Badges y logros
export const ACHIEVEMENTS = {
  FIRST_PULLUP: {
    id: "first_pullup",
    name: "Primera Dominada",
    description: "Completaste tu primera dominada completa",
    icon: "🎖️",
  },
  HUNDRED_KG_CLUB: {
    id: "100kg_club",
    name: "100kg Club",
    description: "Suma de los 3 grandes alcanzó 100kg",
    icon: "💪",
  },
  CONSISTENCY_KING: {
    id: "consistency_30",
    name: "Consistency King",
    description: "30 días consecutivos entrenando",
    icon: "👑",
  },
  PERFECT_TECHNIQUE: {
    id: "perfect_technique",
    name: "Técnica Perfecta",
    description: "5 sesiones seguidas con RPE<9 y sin notas técnicas negativas",
    icon: "⭐",
  },
  VOLUME_BEAST: {
    id: "volume_1000",
    name: "Volumen Beast",
    description: "1000 series completadas",
    icon: "🔥",
  },
  PROGRESSIVE_OVERLOAD: {
    id: "progressive_overload",
    name: "Sobrecarga Progresiva",
    description: "Aumentaste peso en un ejercicio 4 semanas seguidas",
    icon: "📈",
  },
  NUTRITION_WARRIOR: {
    id: "nutrition_warrior",
    name: "Nutrition Warrior",
    description: "14 días seguidos con adherencia >90%",
    icon: "🥗",
  },
};

// Configuración de RPE (Rate of Perceived Exertion)
export const RPE_SCALE = [
  { value: 10, label: "Max esfuerzo", description: "No podrías hacer ni 1 rep más" },
  { value: 9.5, label: "Fallo casi seguro", description: "Podrías intentar 1 rep más pero fallarías" },
  { value: 9, label: "1 RIR", description: "Podrías hacer 1 rep más" },
  { value: 8.5, label: "1-2 RIR", description: "Entre 1 y 2 reps más" },
  { value: 8, label: "2 RIR", description: "Podrías hacer 2 reps más" },
  { value: 7, label: "3 RIR", description: "Podrías hacer 3 reps más" },
  { value: 6, label: "4 RIR", description: "Podrías hacer 4 reps más" },
];

// Configuración de descansos entre series (segundos)
export const REST_PERIODS = {
  STRENGTH: { min: 180, max: 300 }, // 3-5 min para fuerza
  HYPERTROPHY: { min: 60, max: 120 }, // 1-2 min para hipertrofia
  ENDURANCE: { min: 30, max: 60 }, // 30s-1min para resistencia
};

// Protocolo de mediciones
export const MEASUREMENT_PROTOCOL = [
  "Tomar medidas en ayunas",
  "Post-baño (sin retención de líquidos)",
  "Misma hora del día (preferible mañana)",
  "Relajado (no contraído)",
  "Cinta métrica firme pero sin apretar",
];

// Ángulos para fotos de progreso
export const PHOTO_ANGLES = [
  { id: "front", name: "Frontal", description: "De frente, brazos relajados a los lados" },
  { id: "side", name: "Lateral", description: "Perfil derecho, brazos relajados" },
  { id: "back", name: "Posterior", description: "De espaldas, brazos relajados" },
  { id: "front_flex", name: "Frontal Flexionado", description: "Doble bíceps frontal" },
];
