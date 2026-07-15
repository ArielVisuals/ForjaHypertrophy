import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { intakeForms, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const GET: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const [form] = await db
    .select()
    .from(intakeForms)
    .where(eq(intakeForms.userId, user.id))
    .limit(1);

  return json(form ?? null);
};

export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const { goals, health, lifestyle, availability } = await context.request.json();
  if (!goals || !health || !lifestyle || !availability) {
    return json({ error: "Faltan secciones del cuestionario" }, 400);
  }

  // El cuestionario se responde una sola vez
  const [existing] = await db
    .select({ id: intakeForms.id })
    .from(intakeForms)
    .where(eq(intakeForms.userId, user.id))
    .limit(1);
  if (existing) return json({ error: "El cuestionario ya fue enviado" }, 409);

  const [form] = await db
    .insert(intakeForms)
    .values({ userId: user.id, version: 2, goals, health, lifestyle, availability })
    .returning();

  await db
    .update(users)
    .set({ onboardingCompleted: true, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return json(form);
};
