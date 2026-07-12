import type { APIRoute } from "astro";
import { z } from "zod";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, issueSession } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { timingSafeEqual } from "node:crypto";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Correo invalido").max(254),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres").max(128),
  displayName: z.string().trim().min(1, "Tu nombre es obligatorio").max(60),
  coachCode: z.string().trim().max(64).optional(),
});

/** Comparacion en tiempo constante contra el codigo de invitacion de coach. */
function isValidCoachCode(code: string): boolean {
  const expected = import.meta.env?.COACH_INVITE_CODE ?? process.env.COACH_INVITE_CODE;
  if (!expected) return false;
  const a = Buffer.from(code);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const POST: APIRoute = async (context) => {
  const ip = context.clientAddress ?? "unknown";
  if (isRateLimited(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return json({ error: "Demasiados intentos. Espera un momento." }, 429);
  }

  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, 400);
  }
  const { email, password, displayName, coachCode } = parsed.data;

  // Registro como entrenador: requiere el codigo de invitacion correcto
  const asCoach = coachCode != null && coachCode !== "";
  if (asCoach && !isValidCoachCode(coachCode)) {
    return json({ error: "Codigo de entrenador invalido" }, 403);
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return json({ error: "Ese correo ya tiene una cuenta" }, 409);

  // Mientras exista un solo entrenador, todo atleta nuevo se le asigna
  const [coach] = asCoach
    ? [undefined]
    : await db.select({ id: users.id }).from(users).where(eq(users.role, "coach")).limit(1);

  const [user] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      email,
      displayName,
      role: asCoach ? "coach" : "athlete",
      coachId: coach?.id ?? null,
      passwordHash: await hashPassword(password),
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  // Carrera: otro request registro el mismo correo primero
  if (!user) return json({ error: "Ese correo ya tiene una cuenta" }, 409);

  // El primer entrenador adopta a los atletas que aun no tienen coach
  if (asCoach) {
    await db
      .update(users)
      .set({ coachId: user.id, updatedAt: new Date() })
      .where(and(eq(users.role, "athlete"), isNull(users.coachId)));
  }

  await issueSession(context, user.id);
  return json({ ok: true, redirect: asCoach ? "/coach" : "/onboarding" });
};
