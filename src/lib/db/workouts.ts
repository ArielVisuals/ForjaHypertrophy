/**
 * Queries y helpers para workouts usando Drizzle ORM
 */

import { db } from "./index";
import { workoutSessions, workoutSets, exercises as exercisesTable, workoutTemplates } from "./schema";
import { eq, and, desc, asc, sql, inArray, isNotNull, gte, count } from "drizzle-orm";

function calcEpleyOneRM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30));
}

function calcProgression(lastWeight: number, lastRpe: number | null): {
  weight: number;
  dir: "up" | "hold" | "down";
} {
  // rpe = 10 - rir; rpe ≤ 8 = RIR ≥ 2 → progress; rpe 9 = RIR 1 → hold; rpe 10 = RIR 0 → reduce
  if (lastRpe === null || lastRpe <= 8) {
    return { weight: Math.round((lastWeight + 2.5) * 4) / 4, dir: "up" };
  }
  if (lastRpe === 9) {
    return { weight: lastWeight, dir: "hold" };
  }
  return { weight: Math.max(0, Math.round((lastWeight - 2.5) * 4) / 4), dir: "down" };
}

/**
 * Obtener el historial de un ejercicio: última actuación + máximo histórico + 1RM estimado
 */
export async function getExercisePreviousPerformance(userId: string, exerciseId: string) {
  try {
    // Última sesión en la que se hizo este ejercicio (set con mayor peso de esa sesión)
    const lastPerf = await db
      .select({
        weightKg: workoutSets.weightKg,
        reps:     workoutSets.reps,
        rpe:      workoutSets.rpe,
        date:     workoutSessions.startedAt,
      })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.workoutSessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSets.exerciseId, exerciseId),
          eq(workoutSets.completed, true),
        )
      )
      .orderBy(desc(workoutSessions.startedAt), desc(workoutSets.weightKg))
      .limit(1);

    // Máximo histórico de peso (para detección de PRs en tiempo real)
    const maxPerf = await db
      .select({
        weightKg: workoutSets.weightKg,
        reps:     workoutSets.reps,
      })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.workoutSessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSets.exerciseId, exerciseId),
          eq(workoutSets.completed, true),
        )
      )
      .orderBy(desc(workoutSets.weightKg))
      .limit(1);

    const last = lastPerf[0];
    const max  = maxPerf[0];

    const lastWeight = last ? Number(last.weightKg) : null;
    const lastReps   = last ? last.reps : null;
    const maxWeight  = max  ? Number(max.weightKg)  : null;

    return {
      data: {
        lastWeight,
        lastReps,
        lastRpe:       last ? last.rpe : null,
        lastDate:      last ? last.date : null,
        maxWeight,
        estimatedOneRM:  lastWeight && lastReps ? calcEpleyOneRM(lastWeight, lastReps) : null,
        ...(() => {
          if (!lastWeight) return { suggestedWeight: null, progressionDir: null };
          const p = calcProgression(lastWeight, last?.rpe ?? null);
          return { suggestedWeight: p.weight, progressionDir: p.dir };
        })(),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching exercise history:", error);
    return { data: null, error };
  }
}

/**
 * Volumen semanal de sets completados por grupo muscular (últimos 7 días)
 * También devuelve la última vez que se entrenó cada músculo.
 */
export async function getWeeklyVolumeByMuscle(userId: string) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Sets completados esta semana por músculo
    const volumeRows = await db
      .select({
        muscleGroup: exercisesTable.muscleGroup,
        sets:        count(workoutSets.id),
      })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.workoutSessionId, workoutSessions.id))
      .innerJoin(exercisesTable,  eq(workoutSets.exerciseId, exercisesTable.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSets.completed, true),
          gte(workoutSessions.startedAt, sevenDaysAgo),
        )
      )
      .groupBy(exercisesTable.muscleGroup);

    // Última sesión por grupo muscular (all-time, para recovery insights)
    const lastTrainedRows = await db
      .select({
        muscleGroup: exercisesTable.muscleGroup,
        lastDate:    sql<string>`MAX(${workoutSessions.startedAt})`,
      })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.workoutSessionId, workoutSessions.id))
      .innerJoin(exercisesTable,  eq(workoutSets.exerciseId, exercisesTable.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSets.completed, true),
        )
      )
      .groupBy(exercisesTable.muscleGroup);

    const lastTrainedMap: Record<string, string> = {};
    for (const row of lastTrainedRows) {
      lastTrainedMap[row.muscleGroup] = row.lastDate;
    }

    const data = volumeRows.map(row => ({
      muscleGroup: row.muscleGroup,
      sets:        row.sets,
      lastTrained: lastTrainedMap[row.muscleGroup] ?? null,
    }));

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching weekly volume:", error);
    return { data: null, error };
  }
}

/**
 * Obtener todos los ejercicios
 */
export async function getExercises() {
  try {
    const data = await db
      .select()
      .from(exercisesTable)
      .orderBy(exercisesTable.name);
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return { data: null, error };
  }
}

export async function createExercise(name: string, muscleGroup: string) {
  try {
    const [data] = await db
      .insert(exercisesTable)
      .values({ name: name.trim(), muscleGroup })
      .returning();
    return { data, error: null };
  } catch (error) {
    console.error("Error creating exercise:", error);
    return { data: null, error };
  }
}

/**
 * Devuelve la sesión solo si pertenece al usuario — verificación de ownership
 * previa a cualquier lectura/mutación por sessionId que venga del cliente.
 */
export async function getOwnedSession(sessionId: string, userId: string) {
  try {
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
      .limit(1);
    return { data: session ?? null, error: null };
  } catch (error) {
    console.error("Error fetching owned session:", error);
    return { data: null, error };
  }
}

export async function getSessionSets(sessionId: string) {
  try {
    const rows = await db
      .select({
        exerciseName: exercisesTable.name,
        muscleGroup:  exercisesTable.muscleGroup,
        setNumber:    workoutSets.setNumber,
        reps:         workoutSets.reps,
        weightKg:     workoutSets.weightKg,
        rpe:          workoutSets.rpe,
      })
      .from(workoutSets)
      .innerJoin(exercisesTable, eq(workoutSets.exerciseId, exercisesTable.id))
      .where(and(
        eq(workoutSets.workoutSessionId, sessionId),
        eq(workoutSets.completed, true),
      ))
      .orderBy(exercisesTable.name, asc(workoutSets.setNumber));

    return { data: rows.map(r => ({ ...r, weightKg: Number(r.weightKg ?? 0) })), error: null };
  } catch (error) {
    console.error("Error fetching session sets:", error);
    return { data: null, error };
  }
}

/**
 * Agregar un set a una sesión de workout
 */
export async function addWorkoutSet(set: typeof workoutSets.$inferInsert) {
  try {
    const [data] = await db
      .insert(workoutSets)
      .values(set)
      .returning();

    return { data, error: null };
  } catch (error) {
    console.error("Error adding workout set:", error);
    return { data: null, error };
  }
}

/**
 * Obtener todos los workouts del usuario
 */
export async function getUserWorkouts(userId: string, limit?: number) {
  try {
    const query = db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.date));

    if (limit) {
      query.limit(limit);
    }

    const data = await query;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return { data: null, error };
  }
}

/**
 * Obtener workout por ID con sus ejercicios y sets
 */
export async function getWorkoutById(workoutId: string) {
  try {
    const data = await db.query.workoutSessions.findFirst({
      where: eq(workoutSessions.id, workoutId),
      with: {
        // Nota: Necesitaremos configurar relaciones en el schema para usar 'with'
        // Por ahora lo hacemos manualmente para no complicar el schema inicial
      }
    });

    if (!data) return { data: null, error: new Error("Workout not found") };

    // Obtener sets relacionados
    const sets = await db
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.workoutSessionId, workoutId))
      .innerJoin(exercisesTable, eq(workoutSets.exerciseId, exercisesTable.id));

    return { data: { ...data, sets }, error: null };
  } catch (error) {
    console.error("Error fetching workout:", error);
    return { data: null, error };
  }
}

/**
 * Obtener workouts de una semana específica
 */
export async function getWorkoutsByWeek(userId: string, weekNumber: number) {
  try {
    const data = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.weekNumber, weekNumber)
        )
      )
      .orderBy(asc(workoutSessions.date));

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching workouts by week:", error);
    return { data: null, error };
  }
}

/**
 * Crear un nuevo workout
 */
export async function createWorkout(workout: typeof workoutSessions.$inferInsert) {
  try {
    const [data] = await db
      .insert(workoutSessions)
      .values(workout)
      .returning();

    return { data, error: null };
  } catch (error) {
    console.error("Error creating workout:", error);
    return { data: null, error };
  }
}

/**
 * Actualizar un workout
 */
export async function updateWorkout(workoutId: string, updates: Partial<typeof workoutSessions.$inferInsert>) {
  try {
    const [data] = await db
      .update(workoutSessions)
      .set(updates)
      .where(eq(workoutSessions.id, workoutId))
      .returning();

    return { data, error: null };
  } catch (error) {
    console.error("Error updating workout:", error);
    return { data: null, error };
  }
}

/**
 * Eliminar un workout
 */
export async function deleteWorkout(workoutId: string) {
  try {
    await db.delete(workoutSessions).where(eq(workoutSessions.id, workoutId));
    return { error: null };
  } catch (error) {
    console.error("Error deleting workout:", error);
    return { error };
  }
}

/**
 * Marcar workout como completado
 */
export async function completeWorkout(
  workoutId: string,
  duration: number,
  overallRpe: number,
  notes?: string,
  analysisSummary?: string,
) {
  return updateWorkout(workoutId, {
    completed: true,
    durationMinutes: duration,
    overallRpe,
    completedAt: new Date(),
    ...(notes ? { notes } : {}),
    ...(analysisSummary ? { analysisSummary } : {}),
  });
}

/**
 * Recovery status: días desde última sesión por grupo muscular
 */
export async function getMuscleRecovery(userId: string) {
  const MUSCLES = ["chest", "back", "legs", "shoulders", "arms", "core"];
  try {
    const rows = await db
      .select({
        muscleGroup: exercisesTable.muscleGroup,
        lastDate:    sql<string>`MAX(${workoutSessions.startedAt})`,
      })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.workoutSessionId, workoutSessions.id))
      .innerJoin(exercisesTable,  eq(workoutSets.exerciseId, exercisesTable.id))
      .where(and(eq(workoutSessions.userId, userId), eq(workoutSets.completed, true)))
      .groupBy(exercisesTable.muscleGroup);

    const map: Record<string, string> = {};
    for (const r of rows) map[r.muscleGroup] = r.lastDate;

    const now = Date.now();
    return {
      data: MUSCLES.map(m => {
        const last = map[m];
        const daysAgo = last
          ? Math.floor((now - new Date(last).getTime()) / 86400000)
          : null;
        const status =
          daysAgo === null ? "fresh" :
          daysAgo <= 1     ? "recovering" :
          daysAgo <= 2     ? "ready" : "fresh";
        return { muscleGroup: m, daysAgo, lastDate: last ?? null, status };
      }),
      error: null,
    };
  } catch (error) {
    console.error("Error fetching muscle recovery:", error);
    return { data: null, error };
  }
}

/**
 * Obtener estadísticas de workouts completados
 */
export async function getWorkoutStats(userId: string) {
  try {
    const data = await db
      .select({
        id: workoutSessions.id,
        date: workoutSessions.date,
        completed: workoutSessions.completed,
        durationMinutes: workoutSessions.durationMinutes,
        overallRpe: workoutSessions.overallRpe,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.completed, true)
        )
      )
      .orderBy(desc(workoutSessions.date));

    // Calcular estadísticas
    const totalWorkouts = data.length;
    const totalMinutes = data.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
    const avgRpe = data.length > 0
      ? data.reduce((sum, w) => sum + (w.overallRpe || 0), 0) / data.length
      : 0;

    return {
      data: {
        totalWorkouts,
        totalMinutes,
        avgRpe: Math.round(avgRpe * 10) / 10,
        workouts: data,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching workout stats:", error);
    return { data: null, error };
  }
}

/**
 * Obtener streak de días consecutivos
 */
export async function getWorkoutStreak(userId: string) {
  try {
    const data = await db
      .select({ date: workoutSessions.date })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.completed, true)
        )
      )
      .orderBy(desc(workoutSessions.date));

    if (!data || data.length === 0) {
      return { streak: 0, error: null };
    }

    // Calcular streak
    let streak = 1;
    for (let i = 1; i < data.length; i++) {
      const prevDate = new Date(data[i - 1].date);
      const currDate = new Date(data[i].date);
      
      const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return { streak, error: null };
  } catch (error) {
    console.error("Error fetching workout streak:", error);
    return { streak: 0, error };
  }
}

/**
 * Historial de sesiones completadas con desglose por ejercicio
 */
export async function getWorkoutHistory(userId: string, limit = 20) {
  try {
    const sessions = await db
      .select({
        id:              workoutSessions.id,
        name:            workoutSessions.name,
        startedAt:       workoutSessions.startedAt,
        durationMinutes: workoutSessions.durationMinutes,
        overallRpe:      workoutSessions.overallRpe,
        notes:           workoutSessions.notes,
        analysisSummary: workoutSessions.analysisSummary,
      })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.completed, true)))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(limit);

    if (sessions.length === 0) return { data: [], error: null };

    const sessionIds = sessions.map(s => s.id);

    const sets = await db
      .select({
        sessionId:    workoutSets.workoutSessionId,
        exerciseName: exercisesTable.name,
        muscleGroup:  exercisesTable.muscleGroup,
        reps:         workoutSets.reps,
        weightKg:     workoutSets.weightKg,
      })
      .from(workoutSets)
      .innerJoin(exercisesTable, eq(workoutSets.exerciseId, exercisesTable.id))
      .where(and(inArray(workoutSets.workoutSessionId, sessionIds), eq(workoutSets.completed, true)));

    type ExGroup = { name: string; muscleGroup: string; sets: number; volume: number; topWeight: number };
    const bySession: Record<string, ExGroup[]> = {};

    for (const set of sets) {
      if (!bySession[set.sessionId]) bySession[set.sessionId] = [];
      const weight = Number(set.weightKg || 0);
      const ex = bySession[set.sessionId].find(e => e.name === set.exerciseName);
      if (ex) {
        ex.sets   += 1;
        ex.volume += weight * set.reps;
        ex.topWeight = Math.max(ex.topWeight, weight);
      } else {
        bySession[set.sessionId].push({ name: set.exerciseName, muscleGroup: set.muscleGroup, sets: 1, volume: weight * set.reps, topWeight: weight });
      }
    }

    const data = sessions.map(s => {
      const exercises  = bySession[s.id] ?? [];
      const totalSets   = exercises.reduce((a, e) => a + e.sets, 0);
      const totalVolume = Math.round(exercises.reduce((a, e) => a + e.volume, 0));
      return { id: s.id, name: s.name, startedAt: s.startedAt, durationMinutes: s.durationMinutes, overallRpe: s.overallRpe, notes: s.notes, analysisSummary: s.analysisSummary, totalSets, totalVolume, exercises };
    });

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching workout history:", error);
    return { data: null, error };
  }
}

/**
 * Sets de la última sesión en la que se realizó un ejercicio (para mostrar como referencia inline)
 */
export async function getLastSessionSets(userId: string, exerciseId: string) {
  try {
    const lastRow = await db
      .select({ sessionId: workoutSets.workoutSessionId })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.workoutSessionId, workoutSessions.id))
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSets.exerciseId, exerciseId),
        eq(workoutSets.completed, true),
      ))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(1);

    if (!lastRow[0]) return { data: [], error: null };

    const sets = await db
      .select({
        setNumber: workoutSets.setNumber,
        reps:      workoutSets.reps,
        weightKg:  workoutSets.weightKg,
        rpe:       workoutSets.rpe,
      })
      .from(workoutSets)
      .where(and(
        eq(workoutSets.workoutSessionId, lastRow[0].sessionId),
        eq(workoutSets.exerciseId, exerciseId),
        eq(workoutSets.completed, true),
      ))
      .orderBy(asc(workoutSets.setNumber));

    return { data: sets.map(s => ({ ...s, weightKg: Number(s.weightKg ?? 0) })), error: null };
  } catch (error) {
    console.error("Error fetching last session sets:", error);
    return { data: null, error };
  }
}

/**
 * Timeline de progresión para un ejercicio específico (para el drawer de detalle)
 */
export async function getExerciseTimeline(userId: string, exerciseId: string) {
  try {
    const rows = await db
      .select({
        date:         sql<string>`DATE(${workoutSessions.startedAt})`,
        maxWeight:    sql<number>`MAX(CAST(${workoutSets.weightKg} AS REAL))`,
        totalVolume:  sql<number>`SUM(CAST(${workoutSets.weightKg} AS REAL) * ${workoutSets.reps})`,
        estimated1RM: sql<number>`ROUND(MAX(CAST(${workoutSets.weightKg} AS REAL) * (1.0 + ${workoutSets.reps} / 30.0)))`,
        totalSets:    sql<number>`COUNT(*)`,
      })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.workoutSessionId, workoutSessions.id))
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSets.exerciseId, exerciseId),
        eq(workoutSets.completed, true),
        isNotNull(workoutSets.weightKg),
      ))
      .groupBy(sql`DATE(${workoutSessions.startedAt})`)
      .orderBy(sql`DATE(${workoutSessions.startedAt})`)
      .limit(20);

    return {
      data: rows.map(r => ({
        date:         r.date,
        maxWeight:    Number(r.maxWeight),
        totalVolume:  Math.round(Number(r.totalVolume)),
        estimated1RM: Number(r.estimated1RM),
        totalSets:    Number(r.totalSets),
      })),
      error: null,
    };
  } catch (error) {
    console.error("Error fetching exercise timeline:", error);
    return { data: null, error };
  }
}

/**
 * Progresión de 1RM estimado por ejercicio a lo largo del tiempo
 */
export async function getStrengthTimeline(userId: string) {
  try {
    const rows = await db
      .select({
        exerciseId:   exercisesTable.id,
        exerciseName: exercisesTable.name,
        muscleGroup:  exercisesTable.muscleGroup,
        date:         sql<string>`DATE(${workoutSessions.startedAt})`,
        estimated1RM: sql<number>`ROUND(MAX(CAST(${workoutSets.weightKg} AS REAL) * (1.0 + ${workoutSets.reps} / 30.0)))`,
      })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.workoutSessionId, workoutSessions.id))
      .innerJoin(exercisesTable,  eq(workoutSets.exerciseId, exercisesTable.id))
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSets.completed, true),
        isNotNull(workoutSets.weightKg),
      ))
      .groupBy(
        exercisesTable.id,
        exercisesTable.name,
        exercisesTable.muscleGroup,
        sql`DATE(${workoutSessions.startedAt})`,
      )
      .orderBy(exercisesTable.name, sql`DATE(${workoutSessions.startedAt})`);

    const byExercise: Record<string, { id: string; name: string; muscleGroup: string; points: { date: string; oneRM: number }[] }> = {};
    for (const row of rows) {
      if (!byExercise[row.exerciseId]) {
        byExercise[row.exerciseId] = { id: row.exerciseId, name: row.exerciseName, muscleGroup: row.muscleGroup, points: [] };
      }
      byExercise[row.exerciseId].points.push({ date: row.date, oneRM: Number(row.estimated1RM) });
    }

    const data = Object.values(byExercise);
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching strength timeline:", error);
    return { data: null, error };
  }
}

// ─── Weekly Digest ────────────────────────────────────────────────────────────

export async function getWeeklyDigest(userId: string) {
  try {
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const sessions = await db
      .select({
        id: workoutSessions.id,
        durationMinutes: workoutSessions.durationMinutes,
        overallRpe: workoutSessions.overallRpe,
        name: workoutSessions.name,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.completed, true),
          gte(workoutSessions.startedAt, monday),
        )
      );

    const sessionIds = sessions.map(s => s.id);
    let totalVolume  = 0;
    let totalSets    = 0;

    if (sessionIds.length > 0) {
      const sets = await db
        .select({
          weightKg: workoutSets.weightKg,
          reps:     workoutSets.reps,
        })
        .from(workoutSets)
        .where(
          and(
            inArray(workoutSets.workoutSessionId, sessionIds),
            eq(workoutSets.completed, true),
          )
        );
      totalSets = sets.length;
      totalVolume = sets.reduce((acc, s) => acc + Number(s.weightKg ?? 0) * s.reps, 0);
    }

    const avgRpe = sessions.length
      ? Math.round(sessions.filter(s => s.overallRpe).reduce((a, s) => a + (s.overallRpe ?? 0), 0) / sessions.filter(s => s.overallRpe).length * 10) / 10
      : null;

    return {
      data: {
        sessionsThisWeek: sessions.length,
        totalVolume:      Math.round(totalVolume),
        totalSets,
        avgRpe,
        weekStart:        monday.toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching weekly digest:", error);
    return { data: null, error };
  }
}

// ─── Workout Templates ────────────────────────────────────────────────────────

export async function getWorkoutTemplates(userId: string) {
  try {
    const data = await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.userId, userId))
      .orderBy(desc(workoutTemplates.createdAt));
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { data: null, error };
  }
}

export async function saveWorkoutTemplate(
  userId: string,
  name: string,
  exercises: { id: string; name: string; muscleGroup: string }[]
) {
  try {
    const [data] = await db
      .insert(workoutTemplates)
      .values({ userId, name, exercises })
      .returning();
    return { data, error: null };
  } catch (error) {
    console.error("Error saving template:", error);
    return { data: null, error };
  }
}

export async function deleteWorkoutTemplate(id: string, userId: string) {
  try {
    await db
      .delete(workoutTemplates)
      .where(and(eq(workoutTemplates.id, id), eq(workoutTemplates.userId, userId)));
    return { error: null };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { error };
  }
}

export interface TodaySessionSummary {
  id: string;
  name: string;
  date: string;        // "YYYY-MM-DD" in user's local timezone — for client-side "is today?" check
  completedAt: Date;
  durationMinutes: number | null;
  overallRpe: number | null;
  analysisSummary: string | null;
  exercises: {
    name: string;
    muscleGroup: string;
    sets: { weightKg: number; reps: number; rpe: number | null }[];
  }[];
}

/**
 * Devuelve la sesión completada más reciente del usuario.
 * El cliente compara session.date con la fecha local del browser para
 * determinar si es "hoy" — evita cualquier problema de timezone servidor vs usuario.
 */
export async function getTodayCompletedSession(
  userId: string
): Promise<{ data: TodaySessionSummary | null; error: unknown }> {
  try {
    const session = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          isNotNull(workoutSessions.completedAt)
        )
      )
      .orderBy(desc(workoutSessions.completedAt))
      .limit(1)
      .then(rows => rows[0] ?? null);

    if (!session) return { data: null, error: null };

    const sets = await db
      .select({
        exerciseName: exercisesTable.name,
        muscleGroup:  exercisesTable.muscleGroup,
        weightKg:     workoutSets.weightKg,
        reps:         workoutSets.reps,
        rpe:          workoutSets.rpe,
        setNumber:    workoutSets.setNumber,
      })
      .from(workoutSets)
      .innerJoin(exercisesTable, eq(workoutSets.exerciseId, exercisesTable.id))
      .where(
        and(
          eq(workoutSets.workoutSessionId, session.id),
          eq(workoutSets.completed, true)
        )
      )
      .orderBy(asc(workoutSets.setNumber));

    // Group sets by exercise name
    const exerciseMap = new Map<string, TodaySessionSummary["exercises"][0]>();
    for (const s of sets) {
      if (!exerciseMap.has(s.exerciseName)) {
        exerciseMap.set(s.exerciseName, {
          name: s.exerciseName,
          muscleGroup: s.muscleGroup,
          sets: [],
        });
      }
      exerciseMap.get(s.exerciseName)!.sets.push({
        weightKg: Number(s.weightKg ?? 0),
        reps: s.reps,
        rpe: s.rpe,
      });
    }

    return {
      data: {
        id: session.id,
        name: session.name,
        date: session.date,          // "YYYY-MM-DD" stored from client's local timezone
        completedAt: session.completedAt!,
        durationMinutes: session.durationMinutes,
        overallRpe: session.overallRpe,
        analysisSummary: session.analysisSummary ?? null,
        exercises: Array.from(exerciseMap.values()),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching today session:", error);
    return { data: null, error };
  }
}
