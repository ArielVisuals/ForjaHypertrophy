/**
 * Siembra los programas maestros (Biblioteca de Hierro) en la base de datos,
 * migrando MASTER_PROGRAMS + SPLIT_SCHEDULES de src/lib/constants/programs.ts
 * a las tablas training_programs / program_days / program_exercises.
 *
 * Idempotente: se salta plantillas maestras que ya existen (por nombre).
 * Ademas hace backfill: programas de usuario sin dias reciben una copia de
 * los dias de la plantilla maestra con su mismo splitType.
 *
 * Uso: pnpm db:seed
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { trainingPrograms, programDays, programExercises } from "../src/lib/db/schema";
import { MASTER_PROGRAMS, SPLIT_SCHEDULES, type ProgramDaySchedule } from "../src/lib/constants/programs";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no esta definida");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL, { prepare: false });
const db = drizzle(client);

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

/** Inserta los 7 dias (incluyendo descansos) y sus ejercicios para un programa. */
async function insertSchedule(programId: string, schedule: (ProgramDaySchedule | null)[]) {
  for (let dayNumber = 0; dayNumber < 7; dayNumber++) {
    const day = schedule[dayNumber];
    const [dayRow] = await db
      .insert(programDays)
      .values({
        programId,
        dayNumber,
        name: day && !day.isRest ? day.name : `Descanso ${DAY_NAMES[dayNumber]}`,
        shortName: day && !day.isRest ? day.shortName : "Descanso",
        isRest: !day || day.isRest,
      })
      .returning();

    if (day && !day.isRest && day.exercises.length > 0) {
      await db.insert(programExercises).values(
        day.exercises.map((ex, order) => ({
          programDayId: dayRow.id,
          order,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          targetSets: ex.targetSets,
          repRange: ex.repRange,
          rirTarget: ex.rirTarget,
          notes: ex.notes ?? null,
        }))
      );
    }
  }
}

// 1. Plantillas maestras
let created = 0;
for (const master of MASTER_PROGRAMS) {
  const schedule = SPLIT_SCHEDULES[master.splitType];
  if (!schedule) {
    console.warn(`Sin schedule para splitType ${master.splitType} (${master.name}) — se omite`);
    continue;
  }

  const [existing] = await db
    .select({ id: trainingPrograms.id })
    .from(trainingPrograms)
    .where(and(eq(trainingPrograms.name, master.name), eq(trainingPrograms.isMaster, true)))
    .limit(1);
  if (existing) continue;

  const [program] = await db
    .insert(trainingPrograms)
    .values({
      userId: null,
      name: master.name,
      description: master.description,
      level: master.level,
      splitType: master.splitType,
      focus: master.focus,
      durationWeeks: master.durationWeeks,
      isMaster: true,
      active: false,
    })
    .returning();

  await insertSchedule(program.id, schedule);
  created++;
  console.log(`Plantilla creada: ${master.name}`);
}

// 2. Backfill: programas de usuario sin dias -> copiar de la plantilla por splitType
const userPrograms = await db
  .select()
  .from(trainingPrograms)
  .where(eq(trainingPrograms.isMaster, false));

const withDays = userPrograms.length
  ? await db
      .select({ programId: programDays.programId })
      .from(programDays)
      .where(inArray(programDays.programId, userPrograms.map(p => p.id)))
  : [];
const hasDays = new Set(withDays.map(r => r.programId));

let backfilled = 0;
for (const program of userPrograms) {
  if (hasDays.has(program.id)) continue;
  const schedule = program.splitType ? SPLIT_SCHEDULES[program.splitType] : null;
  if (!schedule) {
    console.warn(`Programa de usuario sin schedule conocido: ${program.name} (${program.splitType}) — se omite`);
    continue;
  }
  await insertSchedule(program.id, schedule);
  backfilled++;
  console.log(`Backfill de dias: ${program.name} (${program.splitType})`);
}

console.log(`\nListo. Plantillas nuevas: ${created}. Programas con backfill: ${backfilled}.`);
await client.end();
