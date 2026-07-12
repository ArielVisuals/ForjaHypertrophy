import type { APIRoute } from "astro";
import { addWorkoutSet, getOwnedSession } from "@/lib/db/workouts";
import { requireUser } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const body = await context.request.json();
  if (!body.workoutSessionId) return json({ error: "Missing workoutSessionId" }, 400);

  // El set solo puede agregarse a una sesión del propio usuario
  const { data: session } = await getOwnedSession(body.workoutSessionId, user.id);
  if (!session) return json({ error: "Not found" }, 404);

  const { data, error } = await addWorkoutSet(body);
  if (error) return json({ error }, 500);
  return json(data);
};
