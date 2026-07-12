import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { bodyMeasurements, workoutSets, workoutSessions, exercises } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const GET: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const measurements = await db
    .select()
    .from(bodyMeasurements)
    .where(eq(bodyMeasurements.userId, user.id))
    .orderBy(desc(bodyMeasurements.measuredAt));

  // All completed sets ordered by weight desc — group client-side for one PR per exercise
  const allSets = await db
    .select({
      weightKg:     workoutSets.weightKg,
      reps:         workoutSets.reps,
      date:         workoutSessions.startedAt,
      exerciseName: exercises.name,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSets.workoutSessionId, workoutSessions.id))
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(and(eq(workoutSessions.userId, user.id), eq(workoutSets.completed, true)))
    .orderBy(desc(workoutSets.weightKg));

  // One record per exercise: highest weight set
  const seen = new Map<string, { exerciseName: string; maxWeight: number; reps: number; date: string }>();
  for (const s of allSets) {
    if (!seen.has(s.exerciseName)) {
      seen.set(s.exerciseName, {
        exerciseName: s.exerciseName,
        maxWeight:    Number(s.weightKg ?? 0),
        reps:         s.reps,
        date:         s.date?.toISOString() ?? new Date().toISOString(),
      });
    }
  }
  const prs = Array.from(seen.values());

  return json({ measurements, prs });
};

export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  // userId siempre viene de la sesión, nunca del cliente
  const { userId: _ignored, ...fields } = await context.request.json();
  const [data] = await db
    .insert(bodyMeasurements)
    .values({ ...fields, userId: user.id })
    .returning();
  return json(data);
};
