/**
 * Queries del dashboard del entrenador. Todas reciben coachId ya autorizado
 * (el middleware bloquea /coach a no-coaches; la pertenencia del atleta se
 * valida en cada pagina/endpoint).
 */

import { db } from "./index";
import { users, workoutSessions, intakeForms, trainingPrograms } from "./schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";

export interface AthleteOverview {
  id: string;
  displayName: string | null;
  email: string | null;
  createdAt: Date | null;
  lastSessionAt: Date | null;
  sessionsLast7d: number;
  intakeSubmittedAt: Date | null;
  intakeReviewedAt: Date | null;
  activeProgram: { name: string; currentWeek: number; durationWeeks: number } | null;
}

/** Lista de asesorados del coach con señales de actividad y estado del cuestionario. */
export async function getAthletesOverview(coachId: string): Promise<AthleteOverview[]> {
  const athletes = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.coachId, coachId), eq(users.role, "athlete")));

  if (athletes.length === 0) return [];
  const ids = athletes.map(a => a.id);

  const [sessionStats, intakes, programs] = await Promise.all([
    db
      .select({
        userId: workoutSessions.userId,
        lastSessionAt: sql<Date | null>`MAX(${workoutSessions.completedAt})`,
        sessionsLast7d: sql<number>`COUNT(*) FILTER (WHERE ${workoutSessions.completedAt} > NOW() - INTERVAL '7 days')`,
      })
      .from(workoutSessions)
      .where(and(inArray(workoutSessions.userId, ids), eq(workoutSessions.completed, true)))
      .groupBy(workoutSessions.userId),

    db
      .select({
        userId: intakeForms.userId,
        submittedAt: intakeForms.submittedAt,
        reviewedAt: intakeForms.reviewedAt,
      })
      .from(intakeForms)
      .where(inArray(intakeForms.userId, ids)),

    db
      .select({
        userId: trainingPrograms.userId,
        name: trainingPrograms.name,
        currentWeek: trainingPrograms.currentWeek,
        durationWeeks: trainingPrograms.durationWeeks,
      })
      .from(trainingPrograms)
      .where(and(inArray(trainingPrograms.userId, ids), eq(trainingPrograms.active, true))),
  ]);

  const statsBy = new Map(sessionStats.map(s => [s.userId, s]));
  const intakeBy = new Map(intakes.map(i => [i.userId, i]));
  const programBy = new Map(programs.map(p => [p.userId, p]));

  return athletes.map(a => {
    const stats = statsBy.get(a.id);
    const intake = intakeBy.get(a.id);
    const program = programBy.get(a.id);
    return {
      ...a,
      lastSessionAt: stats?.lastSessionAt ? new Date(stats.lastSessionAt) : null,
      sessionsLast7d: Number(stats?.sessionsLast7d ?? 0),
      intakeSubmittedAt: intake?.submittedAt ?? null,
      intakeReviewedAt: intake?.reviewedAt ?? null,
      activeProgram: program
        ? { name: program.name, currentWeek: program.currentWeek ?? 1, durationWeeks: program.durationWeeks ?? 12 }
        : null,
    };
  });
}

/** Atleta del coach, o null si no existe o no le pertenece. */
export async function getOwnedAthlete(coachId: string, athleteId: string) {
  const [athlete] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, athleteId), eq(users.coachId, coachId)))
    .limit(1);
  return athlete ?? null;
}

/** Cuestionario inicial del atleta, o null. */
export async function getAthleteIntake(athleteId: string) {
  const [form] = await db
    .select()
    .from(intakeForms)
    .where(eq(intakeForms.userId, athleteId))
    .limit(1);
  return form ?? null;
}
