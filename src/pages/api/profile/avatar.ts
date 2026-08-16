import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/profile/avatar
// Body: { avatarUrl: string }  — URL devuelta por Cloudinary tras el upload directo
// El upload real ocurre cliente → Cloudinary directamente (evita límite 4.5MB de Vercel)
export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { avatarUrl } = body;

  if (typeof avatarUrl !== "string" || !avatarUrl.startsWith("https://")) {
    return json({ error: "URL de avatar inválida" }, 400);
  }

  // Solo aceptar URLs de Cloudinary o del propio dominio
  const allowedHosts = ["res.cloudinary.com", "cloudinary.com"];
  const isAllowed = allowedHosts.some((h) => avatarUrl.includes(h));
  if (!isAllowed) {
    return json({ error: "Solo se permiten URLs de Cloudinary" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning({ avatarUrl: users.avatarUrl });

  return json({ success: true, avatarUrl: updated.avatarUrl });
};
