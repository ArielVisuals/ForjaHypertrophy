import type { APIRoute } from "astro";
import { destroySession } from "@/lib/auth";

export const POST: APIRoute = async (context) => {
  await destroySession(context);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};
