import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPublicProfile, getFriendshipStatus } from "@/lib/db/friends";
import { getPersonalRecords } from "@/lib/db/personalRecords";
import { getSessionUser } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/users/[username]
// Devuelve el perfil público. Los PRs solo se incluyen si son amigos.
export const GET: APIRoute = async (context) => {
  const username = context.params.username;
  if (!username) return json({ error: "Username requerido" }, 400);

  // Obtener viewer (puede ser null si no está autenticado)
  const viewer = await getSessionUser(context).catch(() => null);

  const result = await getPublicProfile(username, viewer?.id);
  if (!result) return json({ error: "Usuario no encontrado" }, 404);

  const { profile, friendshipStatus } = result;

  // Solo incluir PRs si son amigos mutuos (o si se está viendo el propio perfil)
  const isSelf = viewer?.id === profile.id;
  const isFriend = friendshipStatus.status === "accepted";
  const canViewRecords = isSelf || isFriend;

  const records = canViewRecords ? await getPersonalRecords(profile.id) : [];

  return json({
    profile,
    friendshipStatus,
    records,
    canViewRecords,
  });
};
