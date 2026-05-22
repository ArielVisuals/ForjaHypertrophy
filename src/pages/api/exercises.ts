import type { APIRoute } from "astro";
import { getExercises, getExercisePreviousPerformance, getLastSessionSets, getExerciseTimeline, createExercise } from "@/lib/db/workouts";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { name, muscleGroup } = body;
  if (!name || !muscleGroup) return new Response("Missing name or muscleGroup", { status: 400 });
  const { data, error } = await createExercise(name, muscleGroup);
  if (error) return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
};

export const GET: APIRoute = async ({ url }) => {
  const action = url.searchParams.get("action");

  if (action === "history") {
    const userId = url.searchParams.get("userId");
    const exerciseId = url.searchParams.get("exerciseId");
    if (!userId || !exerciseId)
      return new Response("Missing userId or exerciseId", { status: 400 });

    const { data, error } = await getExercisePreviousPerformance(userId, exerciseId);
    if (error)
      return new Response(JSON.stringify({ error: String(error) }), { status: 500 });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "last-sets") {
    const userId = url.searchParams.get("userId");
    const exerciseId = url.searchParams.get("exerciseId");
    if (!userId || !exerciseId)
      return new Response("Missing userId or exerciseId", { status: 400 });

    const { data, error } = await getLastSessionSets(userId, exerciseId);
    if (error)
      return new Response(JSON.stringify({ error: String(error) }), { status: 500 });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "timeline") {
    const userId     = url.searchParams.get("userId");
    const exerciseId = url.searchParams.get("exerciseId");
    if (!userId || !exerciseId)
      return new Response("Missing userId or exerciseId", { status: 400 });

    const { data, error } = await getExerciseTimeline(userId, exerciseId);
    if (error)
      return new Response(JSON.stringify({ error: String(error) }), { status: 500 });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await getExercises();
  if (error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
