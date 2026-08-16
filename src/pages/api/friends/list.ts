import type { APIRoute } from "astro";
import { requireUser } from "@/lib/auth";
import { getFriends, getPendingRequests, getSentRequests, searchUsersByUsername } from "@/lib/db/friends";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/friends/list?search=query
// Devuelve: friends[], pendingIn[], pendingOut[], searchResults[]
export const GET: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const url = new URL(context.request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";

  const [friends, pendingIn, pendingOut, searchResults] = await Promise.all([
    getFriends(user.id),
    getPendingRequests(user.id),
    getSentRequests(user.id),
    search.length >= 2 ? searchUsersByUsername(search, user.id) : Promise.resolve([]),
  ]);

  return json({ friends, pendingIn, pendingOut, searchResults });
};
