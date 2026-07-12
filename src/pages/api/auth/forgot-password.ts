import type { APIRoute } from "astro";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createEmailToken } from "@/lib/auth";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { isRateLimited } from "@/lib/rateLimit";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

// Respuesta identica exista o no la cuenta: no revela correos registrados
const GENERIC = { ok: true, message: "Si el correo existe, enviamos instrucciones" };

export const POST: APIRoute = async (context) => {
  const ip = context.clientAddress ?? "unknown";
  const parsed = z
    .object({ email: z.string().trim().toLowerCase().email().max(254) })
    .safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return json(GENERIC);
  const { email } = parsed.data;

  if (
    isRateLimited(`forgot:ip:${ip}`, 5, 15 * 60 * 1000) ||
    isRateLimited(`forgot:email:${email}`, 3, 15 * 60 * 1000)
  ) {
    return json(GENERIC); // misma respuesta: sin señal para el atacante
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const token = await createEmailToken(user.id, "reset_password", 30);
    const resetUrl = `${context.url.origin}/reset-password?token=${token}`;
    const { subject, html } = passwordResetEmail(resetUrl);
    await sendEmail(email, subject, html);
  }

  return json(GENERIC);
};
