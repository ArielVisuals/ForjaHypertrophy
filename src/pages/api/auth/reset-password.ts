import type { APIRoute } from "astro";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { consumeEmailToken, hashPassword, revokeAllSessions } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const schema = z.object({
  token: z.string().min(20).max(128),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres").max(128),
});

export const POST: APIRoute = async (context) => {
  const parsed = schema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, 400);
  }
  const { token, password } = parsed.data;

  const userId = await consumeEmailToken(token, "reset_password");
  if (!userId) {
    return json({ error: "El enlace expiro o ya fue usado. Solicita uno nuevo." }, 400);
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Cambiar la contraseña cierra todas las sesiones abiertas
  await revokeAllSessions(userId);

  return json({ ok: true });
};
