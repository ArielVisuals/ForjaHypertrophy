import type { APIRoute } from "astro";
import { requireUser } from "@/lib/auth";
import { respondToFriendRequest } from "@/lib/db/friends";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// PATCH /api/friends/respond
// Body: { requesterId: string, action: 'accept' | 'reject' }
// Solo el addressee (usuario actual) puede responder
export const PATCH: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { requesterId, action } = body;

  if (typeof requesterId !== "string" || !requesterId.trim()) {
    return json({ error: "requesterId es requerido" }, 400);
  }

  if (action !== "accept" && action !== "reject") {
    return json({ error: "action debe ser 'accept' o 'reject'" }, 400);
  }

  const result = await respondToFriendRequest(requesterId, user.id, action);
  return json(result);
};
