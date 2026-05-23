import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { bodyMeasurements, workoutSets, workoutSessions, exercises } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get("userId");
  if (!userId) return new Response("Missing userId", { status: 400 });

  const measurements = await db
    .select()
    .from(bodyMeasurements)
    .where(eq(bodyMeasurements.userId, userId))
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
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSets.completed, true)))
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

  return new Response(JSON.stringify({ measurements, prs }), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const [data] = await db.insert(bodyMeasurements).values(body).returning();
  return new Response(JSON.stringify(data), { status: 200 });
};
