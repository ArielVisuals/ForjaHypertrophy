import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { trainingPrograms } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getActiveProgramWithSchedule } from "@/lib/db/programs";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// El atleta solo LEE su programa (lo asigna el entrenador) y avanza de semana.

export const GET: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  if (context.url.searchParams.get("action") === "active") {
    const program = await getActiveProgramWithSchedule(user.id);
    return json(program);
  }

  const programs = await db
    .select()
    .from(trainingPrograms)
    .where(eq(trainingPrograms.userId, user.id))
    .orderBy(desc(trainingPrograms.createdAt));

  return json(programs);
};

export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const { action, programId } = await context.request.json();

  if (action === "advance-week") {
    const [current] = await db
      .select()
      .from(trainingPrograms)
      .where(and(eq(trainingPrograms.id, programId), eq(trainingPrograms.userId, user.id)));
    if (!current) return json({ error: "Not found" }, 404);
    const newWeek = Math.min((current.currentWeek ?? 1) + 1, current.durationWeeks ?? 12);
    const [updated] = await db
      .update(trainingPrograms)
      .set({ currentWeek: newWeek })
      .where(eq(trainingPrograms.id, programId))
      .returning();
    return json(updated);
  }

  return json({ error: "Invalid action" }, 400);
};
