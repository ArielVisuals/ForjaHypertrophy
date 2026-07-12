import type { APIRoute } from "astro";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword, verifyAgainstDecoy, issueSession } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

// Mensaje generico: no revela si el correo existe ni si la contraseña fallo
const INVALID = "Credenciales invalidas";

export const POST: APIRoute = async (context) => {
  const ip = context.clientAddress ?? "unknown";
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return json({ error: INVALID }, 400);
  const { email, password } = parsed.data;

  if (
    isRateLimited(`login:ip:${ip}`, 10, 10 * 60 * 1000) ||
    isRateLimited(`login:email:${email}`, 5, 10 * 60 * 1000)
  ) {
    return json({ error: "Demasiados intentos. Espera unos minutos." }, 429);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !user.passwordHash) {
    // Verificacion señuelo para no filtrar existencia por timing
    await verifyAgainstDecoy(password);
    return json({ error: INVALID }, 401);
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) return json({ error: INVALID }, 401);

  await issueSession(context, user.id);
  const redirect = user.role === "coach" ? "/coach" : user.onboardingCompleted ? "/dashboard" : "/onboarding";
  return json({ ok: true, redirect });
};
