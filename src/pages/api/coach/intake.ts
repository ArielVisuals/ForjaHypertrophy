import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { intakeForms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireCoachOf } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

/** Marca el cuestionario inicial de un asesorado como revisado. */
export const POST: APIRoute = async (context) => {
  const { athleteId } = await context.request.json();
  if (!athleteId) return json({ error: "Missing athleteId" }, 400);

  const athlete = await requireCoachOf(context, athleteId);
  if (athlete instanceof Response) return athlete;

  const [form] = await db
    .update(intakeForms)
    .set({ reviewedAt: new Date() })
    .where(eq(intakeForms.userId, athleteId))
    .returning();

  if (!form) return json({ error: "El atleta no ha enviado su cuestionario" }, 404);
  return json(form);
};
