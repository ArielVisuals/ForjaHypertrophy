import type { APIRoute } from "astro";
import { createWorkout, completeWorkout, getWeeklyVolumeByMuscle, getWorkoutHistory, getStrengthTimeline, getMuscleRecovery, deleteWorkout, getSessionSets } from "@/lib/db/workouts";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const GET: APIRoute = async ({ url }) => {
  const action = url.searchParams.get("action");
  const userId = url.searchParams.get("userId");
  if (!userId) return new Response("Missing userId", { status: 400 });

  if (action === "volume") {
    const { data, error } = await getWeeklyVolumeByMuscle(userId);
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  if (action === "history") {
    const { data, error } = await getWorkoutHistory(userId);
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  if (action === "strength") {
    const { data, error } = await getStrengthTimeline(userId);
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  if (action === "recovery") {
    const { data, error } = await getMuscleRecovery(userId);
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  if (action === "session-sets") {
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) return new Response("Missing sessionId", { status: 400 });
    const { data, error } = await getSessionSets(sessionId);
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  return new Response("Unknown action", { status: 400 });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { action, ...data } = body;

  if (action === "create") {
    const { data: session, error } = await createWorkout({
      ...data,
      date: new Date().toISOString().split("T")[0]
    });
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify(session), { status: 200 });
  }

  if (action === "complete") {
    const { sessionId, duration, overallRpe, notes } = data;
    const { data: session, error } = await completeWorkout(sessionId, duration, overallRpe, notes);
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify(session), { status: 200 });
  }

  if (action === "cancel") {
    const { sessionId } = data;
    const { error } = await deleteWorkout(sessionId);
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(null, { status: 204 });
  }

  return new Response("Invalid action", { status: 400 });
};
