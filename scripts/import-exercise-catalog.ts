/**
 * Importa el catalogo de ejercicios de github.com/hasaneyldrm/exercises-dataset
 * (1,324 ejercicios con GIF de tecnica, instrucciones en español, musculo
 * objetivo/secundarios y equipo; medios © Gym Visual, con permiso y atribucion).
 *
 * - Upsert idempotente por sourceId en la tabla exercises.
 * - Enriquecimiento: los ejercicios base en español de los programas maestros
 *   reciben el GIF e instrucciones de su equivalente del dataset (mapeo curado).
 *
 * Uso: pnpm db:import-exercises
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { exercises } from "../src/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";

const DATASET_URL =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";

interface DatasetExercise {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  target: string;
  secondary_muscles: string[];
  instruction_steps: Record<string, string[]>;
  image: string;
  gif_url: string;
}

// body_part del dataset -> grupo muscular de FORJA
const BODY_PART_MAP: Record<string, string> = {
  chest: "chest",
  back: "back",
  shoulders: "shoulders",
  neck: "shoulders",
  "upper arms": "arms",
  "lower arms": "arms",
  "upper legs": "legs",
  "lower legs": "legs",
  waist: "core",
  cardio: "cardio",
};

// Ejercicios base (español) -> nombre exacto en el dataset (con respaldos en orden)
const MASTER_MAP: Record<string, string[]> = {
  "Aperturas en Cable": ["cable middle fly", "cable standing fly"],
  "Crunch con Cable": ["cable kneeling crunch"],
  "Curl Concentrado": ["dumbbell concentration curl", "barbell standing concentration curl"],
  "Curl Martillo": ["dumbbell hammer curl"],
  "Curl Predicador": ["barbell preacher curl"],
  "Curl de Barra": ["barbell curl"],
  "Curl de Femoral": ["lever lying leg curl", "lever seated leg curl", "lever kneeling leg curl"],
  "Dominadas": ["pull-up", "pull up"],
  "Elevaciones Frontales": ["dumbbell front raise"],
  "Elevaciones Laterales": ["dumbbell lateral raise"],
  "Elevación de Pantorra": ["lever standing calf raise", "barbell standing calf raise"],
  "Extensiones en Polea": ["cable pushdown"],
  "Extensiones sobre Cabeza": ["barbell standing overhead triceps extension", "dumbbell standing triceps extension"],
  "Extensión de Cuádricep": ["lever leg extension"],
  "Face Pulls": ["cable standing rear delt row (with rope)", "cable rear delt row (with rope)"],
  "Fondos en Paralelas": ["chest dip", "triceps dip"],
  "Jalón al Pecho": ["cable lat pulldown full range of motion", "cable bar lateral pulldown"],
  "Peso Muerto": ["barbell deadlift"],
  "Peso Muerto Piernas Rígidas": ["barbell stiff leg deadlift", "barbell straight leg deadlift"],
  "Peso Muerto Rumano": ["barbell romanian deadlift"],
  "Plancha": ["front plank", "weighted front plank", "front plank with twist"],
  "Prensa de Piernas": ["sled 45° leg press", "sled 45в° leg press", "lever leg press"],
  "Press Arnold": ["dumbbell arnold press"],
  "Press Declinado": ["barbell decline bench press"],
  "Press Inclinado DB": ["dumbbell incline bench press"],
  "Press Inclinado con Barra": ["barbell incline bench press"],
  "Press Militar": ["barbell standing military press", "barbell standing wide military press"],
  "Press de Banca": ["barbell bench press"],
  "Remo con Barra": ["barbell bent over row"],
  "Remo con Mancuerna": ["dumbbell bent over row"],
  "Remo en Polea": ["cable seated row"],
  "Sentadilla": ["barbell full squat", "barbell squat"],
  "Sentadilla Búlgara": ["dumbbell single leg split squat", "barbell single leg split squat", "band single leg split squat"],
  "Skull Crushers": ["barbell lying triceps extension skull crusher", "barbell lying triceps extension"],
};

console.log("Descargando dataset...");
const res = await fetch(DATASET_URL);
if (!res.ok) {
  console.error("No se pudo descargar el dataset:", res.status);
  process.exit(1);
}
const dataset = (await res.json()) as DatasetExercise[];
console.log(`Dataset: ${dataset.length} ejercicios`);

const byName = new Map(dataset.map(e => [e.name.toLowerCase(), e]));

function toRow(e: DatasetExercise) {
  return {
    name: e.name,
    muscleGroup: BODY_PART_MAP[e.body_part] ?? "full_body",
    equipment: e.equipment,
    sourceId: e.id,
    gifUrl: e.gif_url,
    imageUrl: e.image,
    bodyPart: e.body_part,
    target: e.target,
    secondaryMuscles: e.secondary_muscles ?? [],
    instructionSteps: e.instruction_steps?.es ?? e.instruction_steps?.en ?? [],
  };
}

// 1. Upsert del catalogo completo (lotes)
let upserted = 0;
const BATCH = 100;
for (let i = 0; i < dataset.length; i += BATCH) {
  const rows = dataset.slice(i, i + BATCH).map(toRow);
  await db
    .insert(exercises)
    .values(rows)
    .onConflictDoUpdate({
      target: exercises.sourceId,
      set: {
        name: (await import("drizzle-orm")).sql`excluded.name`,
        muscleGroup: (await import("drizzle-orm")).sql`excluded.muscle_group`,
        equipment: (await import("drizzle-orm")).sql`excluded.equipment`,
        gifUrl: (await import("drizzle-orm")).sql`excluded.gif_url`,
        imageUrl: (await import("drizzle-orm")).sql`excluded.image_url`,
        bodyPart: (await import("drizzle-orm")).sql`excluded.body_part`,
        target: (await import("drizzle-orm")).sql`excluded.target`,
        secondaryMuscles: (await import("drizzle-orm")).sql`excluded.secondary_muscles`,
        instructionSteps: (await import("drizzle-orm")).sql`excluded.instruction_steps`,
      },
    });
  upserted += rows.length;
  process.stdout.write(`\rUpsert: ${upserted}/${dataset.length}`);
}
console.log("\nCatalogo importado.");

// 2. Enriquecer los ejercicios base en español con su equivalente
let enriched = 0;
let missing: string[] = [];
for (const [spanishName, candidates] of Object.entries(MASTER_MAP)) {
  const match = candidates.map(c => byName.get(c.toLowerCase())).find(Boolean);
  if (!match) {
    missing.push(`${spanishName} (sin match: ${candidates.join(" | ")})`);
    continue;
  }
  // Solo filas propias (sourceId NULL) con ese nombre; crea la fila si no existe
  const [existing] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(eq(exercises.name, spanishName), isNull(exercises.sourceId)))
    .limit(1);

  const media = {
    gifUrl: match.gif_url,
    imageUrl: match.image,
    bodyPart: match.body_part,
    target: match.target,
    secondaryMuscles: match.secondary_muscles ?? [],
    instructionSteps: match.instruction_steps?.es ?? [],
  };

  if (existing) {
    await db.update(exercises).set(media).where(eq(exercises.id, existing.id));
  } else {
    await db.insert(exercises).values({
      name: spanishName,
      muscleGroup: BODY_PART_MAP[match.body_part] ?? "full_body",
      equipment: match.equipment,
      ...media,
    });
  }
  enriched++;
}

console.log(`Ejercicios base enriquecidos: ${enriched}/${Object.keys(MASTER_MAP).length}`);
if (missing.length) console.log("SIN MATCH:\n  " + missing.join("\n  "));
process.exit(0);
