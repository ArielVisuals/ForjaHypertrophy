import type { APIRoute } from "astro";
import { getExercises, getExercisePreviousPerformance, getLastSessionSets, getExerciseTimeline, createExercise, getExerciseTechnique } from "@/lib/db/workouts";
import { requireUser } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const { name, muscleGroup } = await context.request.json();
  if (!name || !muscleGroup) return json({ error: "Missing name or muscleGroup" }, 400);
  const { data, error } = await createExercise(name, muscleGroup);
  if (error) return json({ error: String(error) }, 500);
  return json(data);
};

export const GET: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const action     = context.url.searchParams.get("action");
  const exerciseId = context.url.searchParams.get("exerciseId");

  if (action === "technique") {
    const name = context.url.searchParams.get("name");
    if (!exerciseId && !name) return json({ error: "Missing exerciseId or name" }, 400);
    const { data, error } = await getExerciseTechnique({ id: exerciseId ?? undefined, name: name ?? undefined });
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  if (action === "history" || action === "last-sets" || action === "timeline") {
    if (!exerciseId) return json({ error: "Missing exerciseId" }, 400);

    const fetchers = {
      "history":   getExercisePreviousPerformance,
      "last-sets": getLastSessionSets,
      "timeline":  getExerciseTimeline,
    } as const;

    const { data, error } = await fetchers[action](user.id, exerciseId);
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  const { data, error } = await getExercises();
  if (error) return json({ error: String(error) }, 500);
  return json(data);
};
