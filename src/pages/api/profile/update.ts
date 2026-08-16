import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/;

export const PATCH: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const updates: Partial<{ displayName: string; username: string; bio: string }> = {};

  // displayName — máx 60 chars
  if (typeof body.displayName === "string") {
    const name = body.displayName.trim();
    if (name.length < 1 || name.length > 60) {
      return json({ error: "El nombre debe tener entre 1 y 60 caracteres" }, 400);
    }
    updates.displayName = name;
  }

  // username — 3-30 chars, solo letras minúsculas, dígitos, puntos, guiones
  if (typeof body.username === "string") {
    const handle = body.username.trim().toLowerCase();
    if (!USERNAME_RE.test(handle)) {
      return json({
        error: "El username solo puede contener letras minúsculas, números, puntos y guiones. Mínimo 3 y máximo 30 caracteres."
      }, 400);
    }

    // Verificar unicidad
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, handle))
      .limit(1);

    if (existing && existing.id !== user.id) {
      return json({ error: "Este username ya está en uso" }, 409);
    }

    updates.username = handle;
  }

  // bio — máx 160 chars
  if (typeof body.bio === "string") {
    const bio = body.bio.trim();
    if (bio.length > 160) {
      return json({ error: "La bio no puede superar 160 caracteres" }, 400);
    }
    updates.bio = bio;
  }

  if (Object.keys(updates).length === 0) {
    return json({ error: "No hay campos para actualizar" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning({ id: users.id, displayName: users.displayName, username: users.username, bio: users.bio, avatarUrl: users.avatarUrl });

  return json({ success: true, user: updated });
};
