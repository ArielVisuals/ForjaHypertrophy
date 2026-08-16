import { db } from "@/lib/db";
import { personalRecords, exercises, workoutSets } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// ─── Fórmula de Epley para estimar 1RM ───────────────────────────────────────
// Estándar de la industria: weight × (1 + reps / 30)
// Solo aplica para reps >= 1 y <= 12 (más de 12 reps la estimación pierde precisión)
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  if (reps > 12) return weightKg; // No estimar para sets muy altos en reps
  return parseFloat((weightKg * (1 + reps / 30)).toFixed(2));
}

// ─── Obtener todos los PRs de un usuario ─────────────────────────────────────
export async function getPersonalRecords(userId: string) {
  const rows = await db
    .select({
      id: personalRecords.id,
      exerciseId: personalRecords.exerciseId,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
      weightKg: personalRecords.weightKg,
      reps: personalRecords.reps,
      estimatedMax: personalRecords.estimatedMax,
      achievedAt: personalRecords.achievedAt,
    })
    .from(personalRecords)
    .innerJoin(exercises, eq(exercises.id, personalRecords.exerciseId))
    .where(eq(personalRecords.userId, userId))
    .orderBy(desc(personalRecords.updatedAt));

  return rows;
}

// ─── Actualizar PR si el nuevo set es mejor ──────────────────────────────────
// Llamar después de guardar cada set en el workout tracker.
// Devuelve true si se estableció un nuevo PR.
export async function updatePersonalRecordIfBetter(
  userId: string,
  exerciseId: string,
  weightKg: number,
  reps: number,
  workoutSetId: string,
  achievedAt: Date
): Promise<{ isNewRecord: boolean; estimatedMax: number; previous?: number }> {
  // Solo PRs con reps entre 1 y 12
  if (reps < 1 || reps > 12 || weightKg <= 0) {
    return { isNewRecord: false, estimatedMax: 0 };
  }

  const newEstimated = estimateOneRepMax(weightKg, reps);

  // Buscar PR existente para este ejercicio
  const [existing] = await db
    .select()
    .from(personalRecords)
    .where(
      and(
        eq(personalRecords.userId, userId),
        eq(personalRecords.exerciseId, exerciseId)
      )
    )
    .limit(1);

  if (!existing) {
    // Primer registro — crear PR
    await db.insert(personalRecords).values({
      userId,
      exerciseId,
      weightKg: weightKg.toString(),
      reps,
      estimatedMax: newEstimated.toString(),
      achievedAt,
      workoutSetId,
    });
    return { isNewRecord: true, estimatedMax: newEstimated };
  }

  const currentMax = parseFloat(existing.estimatedMax);

  if (newEstimated > currentMax) {
    // Nuevo PR — actualizar
    await db
      .update(personalRecords)
      .set({
        weightKg: weightKg.toString(),
        reps,
        estimatedMax: newEstimated.toString(),
        achievedAt,
        workoutSetId,
        updatedAt: new Date(),
      })
      .where(eq(personalRecords.id, existing.id));

    return { isNewRecord: true, estimatedMax: newEstimated, previous: currentMax };
  }

  return { isNewRecord: false, estimatedMax: currentMax };
}

// ─── Obtener PR de un ejercicio específico ───────────────────────────────────
export async function getExercisePR(userId: string, exerciseId: string) {
  const [row] = await db
    .select()
    .from(personalRecords)
    .where(
      and(
        eq(personalRecords.userId, userId),
        eq(personalRecords.exerciseId, exerciseId)
      )
    )
    .limit(1);

  return row ?? null;
}
