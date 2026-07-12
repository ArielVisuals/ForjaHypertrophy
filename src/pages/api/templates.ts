import type { APIRoute } from "astro";
import { getWorkoutTemplates, saveWorkoutTemplate, deleteWorkoutTemplate } from "@/lib/db/workouts";
import { requireUser } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const GET: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const { data, error } = await getWorkoutTemplates(user.id);
  if (error) return json({ error: String(error) }, 500);
  return json(data);
};

export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const { name, exercises } = await context.request.json();
  if (!name || !exercises) return json({ error: "Missing fields" }, 400);
  const { data, error } = await saveWorkoutTemplate(user.id, name, exercises);
  if (error) return json({ error: String(error) }, 500);
  return json(data);
};

export const DELETE: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const id = context.url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);
  const { error } = await deleteWorkoutTemplate(id, user.id);
  if (error) return json({ error: String(error) }, 500);
  return new Response(null, { status: 204 });
};
