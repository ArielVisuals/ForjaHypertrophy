import type { APIRoute } from "astro";
import { createWorkout, completeWorkout, getWeeklyVolumeByMuscle, getWorkoutHistory, getStrengthTimeline, getMuscleRecovery, deleteWorkout, getSessionSets, updateWorkout } from "@/lib/db/workouts";
import { analyzeWorkout, type WorkoutExercise } from "@/lib/gemini";

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
    const { localDate, ...rest } = data;
    const { data: session, error } = await createWorkout({
      ...rest,
      date: localDate ?? new Date().toISOString().split("T")[0],
    });
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify(session), { status: 200 });
  }

  if (action === "complete") {
    const { sessionId, duration, overallRpe, notes, sessionName } = data;

    // 1. Mark workout as complete in DB immediately
    const { data: session, error } = await completeWorkout(sessionId, duration, overallRpe, notes);
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });

    // 2. Build payload for El Arquitecto
    let analysis: string | null = null;
    try {
      const { data: sets } = await getSessionSets(sessionId);
      if (sets && sets.length > 0) {
        // Group flat set rows by exercise
        const exerciseMap = new Map<string, WorkoutExercise>();
        for (const s of sets) {
          if (!exerciseMap.has(s.exerciseName)) {
            exerciseMap.set(s.exerciseName, { name: s.exerciseName, muscleGroup: s.muscleGroup, sets: [] });
          }
          exerciseMap.get(s.exerciseName)!.sets.push({ weightKg: s.weightKg, reps: s.reps, rpe: s.rpe });
        }

        // 3. Call Gemini — awaited here so summary screen receives analysis immediately
        analysis = await analyzeWorkout({
          sessionName: sessionName ?? session?.name ?? "Sesión",
          durationMinutes: duration,
          overallRpe,
          notes: notes ?? null,
          exercises: Array.from(exerciseMap.values()),
        });

        // 4. Persist analysis alongside the session
        if (analysis) await updateWorkout(sessionId, { analysisSummary: analysis });
      }
    } catch (err) {
      console.error("El Arquitecto pipeline error:", err);
      analysis = "Sala de control temporalmente fuera de línea. Registro guardado localmente.";
    }

    return json({ session, analysis });
  }

  if (action === "cancel") {
    const { sessionId } = data;
    const { error } = await deleteWorkout(sessionId);
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(null, { status: 204 });
  }

  return new Response("Invalid action", { status: 400 });
};
