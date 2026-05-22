import type { APIRoute } from "astro";
import { getWorkoutTemplates, saveWorkoutTemplate, deleteWorkoutTemplate } from "@/lib/db/workouts";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get("userId");
  if (!userId) return new Response("Missing userId", { status: 400 });
  const { data, error } = await getWorkoutTemplates(userId);
  if (error) return json({ error: String(error) }, 500);
  return json(data);
};

export const POST: APIRoute = async ({ request }) => {
  const { userId, name, exercises } = await request.json();
  if (!userId || !name || !exercises) return new Response("Missing fields", { status: 400 });
  const { data, error } = await saveWorkoutTemplate(userId, name, exercises);
  if (error) return json({ error: String(error) }, 500);
  return json(data);
};

export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });
  const { error } = await deleteWorkoutTemplate(id);
  if (error) return json({ error: String(error) }, 500);
  return new Response(null, { status: 204 });
};
