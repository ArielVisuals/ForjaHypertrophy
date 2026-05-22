import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { trainingPrograms } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get("userId");
  if (!userId) return new Response("Missing userId", { status: 400 });

  const programs = await db
    .select()
    .from(trainingPrograms)
    .where(eq(trainingPrograms.userId, userId))
    .orderBy(desc(trainingPrograms.createdAt));

  return new Response(JSON.stringify(programs), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { action, ...data } = body;

  if (action === "create") {
    const [program] = await db.insert(trainingPrograms).values(data).returning();
    return new Response(JSON.stringify(program), { status: 200 });
  }

  if (action === "toggle") {
    const { programId, userId } = data;
    await db.update(trainingPrograms).set({ active: false }).where(eq(trainingPrograms.userId, userId));
    const [program] = await db.update(trainingPrograms).set({ active: true }).where(eq(trainingPrograms.id, programId)).returning();
    return new Response(JSON.stringify(program), { status: 200 });
  }

  if (action === "advance-week") {
    const { programId } = data;
    const [current] = await db.select().from(trainingPrograms).where(eq(trainingPrograms.id, programId));
    if (!current) return new Response("Not found", { status: 404 });
    const newWeek = Math.min((current.currentWeek ?? 1) + 1, current.durationWeeks ?? 12);
    const [updated] = await db.update(trainingPrograms).set({ currentWeek: newWeek }).where(eq(trainingPrograms.id, programId)).returning();
    return new Response(JSON.stringify(updated), { status: 200 });
  }

  return new Response("Invalid action", { status: 400 });
};

export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });
  await db.delete(trainingPrograms).where(eq(trainingPrograms.id, id));
  return new Response(null, { status: 204 });
};
