import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { sendFriendRequest } from "@/lib/db/friends";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/friends/request
// Body: { targetUsername: string }
export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { targetUsername } = body;
  if (typeof targetUsername !== "string" || !targetUsername.trim()) {
    return json({ error: "targetUsername es requerido" }, 400);
  }

  // Buscar al usuario destino por username
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, targetUsername.trim().toLowerCase()))
    .limit(1);

  if (!target) {
    return json({ error: "Usuario no encontrado" }, 404);
  }

  if (target.id === user.id) {
    return json({ error: "No puedes enviarte una solicitud a ti mismo" }, 400);
  }

  const result = await sendFriendRequest(user.id, target.id);

  if ("error" in result) {
    return json({ error: result.error }, 409);
  }

  return json({ success: true, friendship: result.friendship }, 201);
};
