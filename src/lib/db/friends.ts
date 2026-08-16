import { db } from "@/lib/db";
import { friendships, users, personalRecords, exercises } from "@/lib/db/schema";
import { eq, or, and, ne } from "drizzle-orm";

export type FriendshipStatus = "pending" | "accepted" | "blocked";

// ─── Enviar solicitud de amistad ─────────────────────────────────────────────
export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  if (requesterId === addresseeId) {
    throw new Error("No puedes enviarte una solicitud a ti mismo");
  }

  // Verificar que no exista ya una relación
  const existing = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, requesterId), eq(friendships.addresseeId, addresseeId)),
        and(eq(friendships.requesterId, addresseeId), eq(friendships.addresseeId, requesterId))
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { error: "Ya existe una relación entre estos usuarios", existing: existing[0] };
  }

  const [request] = await db
    .insert(friendships)
    .values({ requesterId, addresseeId, status: "pending" })
    .returning();

  return { success: true, friendship: request };
}

// ─── Aceptar / Rechazar solicitud ────────────────────────────────────────────
export async function respondToFriendRequest(
  requesterId: string,
  addresseeId: string, // must be the currently authed user
  action: "accept" | "reject"
) {
  if (action === "reject") {
    await db
      .delete(friendships)
      .where(
        and(
          eq(friendships.requesterId, requesterId),
          eq(friendships.addresseeId, addresseeId),
          eq(friendships.status, "pending")
        )
      );
    return { success: true, action: "rejected" };
  }

  const [updated] = await db
    .update(friendships)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(
      and(
        eq(friendships.requesterId, requesterId),
        eq(friendships.addresseeId, addresseeId),
        eq(friendships.status, "pending")
      )
    )
    .returning();

  return { success: true, action: "accepted", friendship: updated };
}

// ─── Obtener lista de amigos aceptados ───────────────────────────────────────
export async function getFriends(userId: string) {
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(friendships)
    .innerJoin(
      users,
      or(
        and(eq(friendships.requesterId, userId), eq(users.id, friendships.addresseeId)),
        and(eq(friendships.addresseeId, userId), eq(users.id, friendships.requesterId))
      )
    )
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))
      )
    );

  return rows;
}

// ─── Solicitudes pendientes (recibidas) ──────────────────────────────────────
export async function getPendingRequests(userId: string) {
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
      requestedAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.requesterId))
    .where(
      and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending"))
    );

  return rows;
}

// ─── Solicitudes enviadas (pendientes) ───────────────────────────────────────
export async function getSentRequests(userId: string) {
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
      sentAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.addresseeId))
    .where(
      and(eq(friendships.requesterId, userId), eq(friendships.status, "pending"))
    );

  return rows;
}

// ─── Estado de relación entre dos usuarios ───────────────────────────────────
export async function getFriendshipStatus(
  userId: string,
  targetId: string
): Promise<{ status: FriendshipStatus | "none"; direction: "sent" | "received" | null }> {
  const [row] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, targetId)),
        and(eq(friendships.requesterId, targetId), eq(friendships.addresseeId, userId))
      )
    )
    .limit(1);

  if (!row) return { status: "none", direction: null };

  const direction = row.requesterId === userId ? "sent" : "received";
  return { status: row.status as FriendshipStatus, direction };
}

// ─── Buscar usuarios por username ────────────────────────────────────────────
export async function searchUsersByUsername(query: string, currentUserId: string) {
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(and(ne(users.id, currentUserId)))
    .limit(10);

  // Filter client-side for case-insensitive partial match
  // (for production with large user bases, use pg_trgm index instead)
  const q = query.toLowerCase();
  return rows.filter(
    (u) =>
      u.username?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q)
  );
}

// ─── Perfil público (para amigos) ────────────────────────────────────────────
export async function getPublicProfile(username: string, viewerId?: string) {
  const [profile] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!profile) return null;

  // Check friendship status if viewer is provided
  let friendshipStatus: ReturnType<typeof getFriendshipStatus> extends Promise<infer T> ? T : never =
    { status: "none", direction: null };

  if (viewerId && viewerId !== profile.id) {
    friendshipStatus = await getFriendshipStatus(viewerId, profile.id);
  }

  return { profile, friendshipStatus };
}
