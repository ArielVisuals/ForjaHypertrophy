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

  const prsData = await db
    .select({
      weightKg: workoutSets.weightKg,
      reps: workoutSets.reps,
      date: workoutSets.createdAt,
      exerciseName: exercises.name
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSets.workoutSessionId, workoutSessions.id))
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(eq(workoutSessions.userId, userId))
    .orderBy(desc(workoutSets.weightKg));

  return new Response(JSON.stringify({ measurements, prs: prsData }), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const [data] = await db.insert(bodyMeasurements).values(body).returning();
  return new Response(JSON.stringify(data), { status: 200 });
};
