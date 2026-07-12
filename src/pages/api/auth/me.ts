import type { APIRoute } from "astro";
import { getSessionUser } from "@/lib/auth";

/** Perfil minimo del usuario autenticado (para hooks de cliente). */
export const GET: APIRoute = async (context) => {
  const user = await getSessionUser(context);
  const body = user
    ? { id: user.id, email: user.email, displayName: user.displayName, role: user.role }
    : null;
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};
