/**
 * Queries de programas de entrenamiento (dias y ejercicios viven en DB,
 * no en constantes — el entrenador los asigna y edita).
 */

import { db } from "./index";
import { trainingPrograms, programDays, programExercises } from "./schema";
import { eq, and, asc, inArray, isNull, or, desc, count } from "drizzle-orm";

/** Dia de programa con su prescripcion, en la forma que consumen los componentes. */
export interface ScheduleDay {
  dayNumber: number;
  name: string;
  shortName: string;
  isRest: boolean;
  focusMuscles: string[];
  exercises: {
    name: string;
    muscleGroup: string;
    targetSets: number;
    repRange: string;
    rirTarget: number | null;
    notes: string | null;
  }[];
}

export interface ProgramWithSchedule {
  id: string;
  name: string;
  description: string | null;
  level: string | null;
  splitType: string | null;
  focus: string | null;
  durationWeeks: number;
  currentWeek: number;
  /** Indexado 0=Dom ... 6=Sab, siempre 7 entradas */
  schedule: ScheduleDay[];
}

/** Arma el schedule (7 dias, 0=Dom..6=Sab) de un programa desde DB. */
export async function getProgramSchedule(programId: string): Promise<ScheduleDay[]> {
  const days = await db
    .select()
    .from(programDays)
    .where(eq(programDays.programId, programId))
    .orderBy(asc(programDays.dayNumber));

  const dayIds = days.map(d => d.id);
  const exercises = dayIds.length
    ? await db
        .select()
        .from(programExercises)
        .where(inArray(programExercises.programDayId, dayIds))
        .orderBy(asc(programExercises.order))
    : [];

  const byDay = new Map<string, typeof exercises>();
  for (const ex of exercises) {
    if (!byDay.has(ex.programDayId)) byDay.set(ex.programDayId, []);
    byDay.get(ex.programDayId)!.push(ex);
  }

  // Siempre 7 entradas; si el programa no definio un dia, cuenta como descanso
  const schedule: ScheduleDay[] = Array.from({ length: 7 }, (_, dayNumber) => ({
    dayNumber,
    name: "Descanso",
    shortName: "Descanso",
    isRest: true,
    focusMuscles: [],
    exercises: [],
  }));

  for (const day of days) {
    const dayExercises = (byDay.get(day.id) ?? []).map(ex => ({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      targetSets: ex.targetSets,
      repRange: ex.repRange,
      rirTarget: ex.rirTarget,
      notes: ex.notes,
    }));
    schedule[day.dayNumber] = {
      dayNumber: day.dayNumber,
      name: day.name,
      shortName: day.shortName,
      isRest: day.isRest,
      // Derivado de los ejercicios: musculos foco unicos en orden de aparicion
      focusMuscles: [...new Set(dayExercises.map(ex => ex.muscleGroup))],
      exercises: dayExercises,
    };
  }

  return schedule;
}

// ─── Libreria y edicion (entrenador) ─────────────────────────────────────────

export interface ProgramLibraryItem {
  id: string;
  name: string;
  description: string | null;
  level: string | null;
  splitType: string | null;
  focus: string | null;
  durationWeeks: number;
  isMaster: boolean;
  trainingDays: number;
}

/** Plantillas disponibles para el coach: maestras + las suyas propias. */
export async function getProgramLibrary(coachId: string): Promise<ProgramLibraryItem[]> {
  const templates = await db
    .select()
    .from(trainingPrograms)
    .where(
      and(
        isNull(trainingPrograms.userId), // plantillas, no copias asignadas
        or(eq(trainingPrograms.isMaster, true), eq(trainingPrograms.createdBy, coachId))
      )
    )
    .orderBy(desc(trainingPrograms.isMaster), desc(trainingPrograms.createdAt));

  if (templates.length === 0) return [];

  const dayCounts = await db
    .select({ programId: programDays.programId, days: count() })
    .from(programDays)
    .where(and(inArray(programDays.programId, templates.map(t => t.id)), eq(programDays.isRest, false)))
    .groupBy(programDays.programId);
  const daysBy = new Map(dayCounts.map(d => [d.programId, Number(d.days)]));

  return templates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    level: t.level,
    splitType: t.splitType,
    focus: t.focus,
    durationWeeks: t.durationWeeks ?? 12,
    isMaster: !!t.isMaster,
    trainingDays: daysBy.get(t.id) ?? 0,
  }));
}

/** Plantilla con su schedule, o null. Solo maestras o propias del coach. */
export async function getTemplateDetail(coachId: string, programId: string): Promise<ProgramWithSchedule | null> {
  const [program] = await db
    .select()
    .from(trainingPrograms)
    .where(
      and(
        eq(trainingPrograms.id, programId),
        isNull(trainingPrograms.userId),
        or(eq(trainingPrograms.isMaster, true), eq(trainingPrograms.createdBy, coachId))
      )
    )
    .limit(1);
  if (!program) return null;

  return {
    id: program.id,
    name: program.name,
    description: program.description,
    level: program.level,
    splitType: program.splitType,
    focus: program.focus,
    durationWeeks: program.durationWeeks ?? 12,
    currentWeek: program.currentWeek ?? 1,
    schedule: await getProgramSchedule(program.id),
  };
}

export interface ProgramDraft {
  name: string;
  description?: string | null;
  level?: string | null;
  focus?: string | null;
  durationWeeks: number;
  schedule: {
    dayNumber: number;
    name: string;
    shortName: string;
    isRest: boolean;
    exercises: {
      name: string;
      muscleGroup: string;
      targetSets: number;
      repRange: string;
      rirTarget?: number | null;
      notes?: string | null;
    }[];
  }[];
}

/** Inserta los 7 dias + ejercicios de un draft para un programa. */
async function insertScheduleRows(programId: string, schedule: ProgramDraft["schedule"]) {
  for (const day of schedule) {
    const [dayRow] = await db
      .insert(programDays)
      .values({
        programId,
        dayNumber: day.dayNumber,
        name: day.name || (day.isRest ? "Descanso" : `Dia ${day.dayNumber}`),
        shortName: day.shortName || (day.isRest ? "Descanso" : day.name),
        isRest: day.isRest,
      })
      .returning();

    const exercises = day.isRest ? [] : day.exercises.filter(ex => ex.name.trim());
    if (exercises.length > 0) {
      await db.insert(programExercises).values(
        exercises.map((ex, order) => ({
          programDayId: dayRow.id,
          order,
          name: ex.name.trim(),
          muscleGroup: ex.muscleGroup,
          targetSets: ex.targetSets,
          repRange: ex.repRange,
          rirTarget: ex.rirTarget ?? null,
          notes: ex.notes?.trim() || null,
        }))
      );
    }
  }
}

/** Crea una plantilla propia del coach. */
export async function createCoachTemplate(coachId: string, draft: ProgramDraft) {
  const [program] = await db
    .insert(trainingPrograms)
    .values({
      userId: null,
      createdBy: coachId,
      isMaster: false,
      active: false,
      name: draft.name,
      description: draft.description ?? null,
      level: draft.level ?? null,
      focus: draft.focus ?? null,
      splitType: "Custom",
      durationWeeks: draft.durationWeeks,
    })
    .returning();
  await insertScheduleRows(program.id, draft.schedule);
  return program;
}

/** Actualiza una plantilla propia (reemplaza dias y ejercicios). */
export async function updateCoachTemplate(coachId: string, programId: string, draft: ProgramDraft) {
  const [program] = await db
    .update(trainingPrograms)
    .set({
      name: draft.name,
      description: draft.description ?? null,
      level: draft.level ?? null,
      focus: draft.focus ?? null,
      durationWeeks: draft.durationWeeks,
    })
    .where(
      and(
        eq(trainingPrograms.id, programId),
        isNull(trainingPrograms.userId),
        eq(trainingPrograms.createdBy, coachId),
        eq(trainingPrograms.isMaster, false)
      )
    )
    .returning();
  if (!program) return null;

  await db.delete(programDays).where(eq(programDays.programId, programId)); // cascade borra ejercicios
  await insertScheduleRows(programId, draft.schedule);
  return program;
}

/** Elimina una plantilla propia del coach (nunca maestras ni copias asignadas). */
export async function deleteCoachTemplate(coachId: string, programId: string) {
  const deleted = await db
    .delete(trainingPrograms)
    .where(
      and(
        eq(trainingPrograms.id, programId),
        isNull(trainingPrograms.userId),
        eq(trainingPrograms.createdBy, coachId),
        eq(trainingPrograms.isMaster, false)
      )
    )
    .returning({ id: trainingPrograms.id });
  return deleted.length > 0;
}

/**
 * Asigna una plantilla a un atleta: clona programa + dias + ejercicios,
 * desactiva cualquier programa activo previo y activa la copia.
 */
export async function assignProgramToAthlete(coachId: string, templateId: string, athleteId: string) {
  const template = await getTemplateDetail(coachId, templateId);
  if (!template) return null;

  await db
    .update(trainingPrograms)
    .set({ active: false })
    .where(eq(trainingPrograms.userId, athleteId));

  const [assigned] = await db
    .insert(trainingPrograms)
    .values({
      userId: athleteId,
      createdBy: coachId,
      isMaster: false,
      active: true,
      currentWeek: 1,
      name: template.name,
      description: template.description,
      level: template.level,
      splitType: template.splitType,
      focus: template.focus,
      durationWeeks: template.durationWeeks,
    })
    .returning();

  await insertScheduleRows(
    assigned.id,
    template.schedule.map(d => ({
      dayNumber: d.dayNumber,
      name: d.name,
      shortName: d.shortName,
      isRest: d.isRest,
      exercises: d.exercises.map(ex => ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        targetSets: ex.targetSets,
        repRange: ex.repRange,
        rirTarget: ex.rirTarget,
        notes: ex.notes,
      })),
    }))
  );

  return assigned;
}

/** Programa activo del usuario con su schedule completo, o null si no tiene. */
export async function getActiveProgramWithSchedule(userId: string): Promise<ProgramWithSchedule | null> {
  const [program] = await db
    .select()
    .from(trainingPrograms)
    .where(and(eq(trainingPrograms.userId, userId), eq(trainingPrograms.active, true)))
    .limit(1);

  if (!program) return null;

  return {
    id: program.id,
    name: program.name,
    description: program.description,
    level: program.level,
    splitType: program.splitType,
    focus: program.focus,
    durationWeeks: program.durationWeeks ?? 12,
    currentWeek: program.currentWeek ?? 1,
    schedule: await getProgramSchedule(program.id),
  };
}
