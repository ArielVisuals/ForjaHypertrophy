import type { APIRoute } from "astro";
import { createWorkout, completeWorkout, getWeeklyVolumeByMuscle, getWorkoutHistory, getStrengthTimeline, getMuscleRecovery, deleteWorkout, getSessionSets, getOwnedSession, updateWorkout } from "@/lib/db/workouts";
import { analyzeWorkout, type WorkoutExercise } from "@/lib/gemini";
import { requireUser } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const GET: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const action = context.url.searchParams.get("action");

  if (action === "volume") {
    const { data, error } = await getWeeklyVolumeByMuscle(user.id);
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  if (action === "history") {
    const { data, error } = await getWorkoutHistory(user.id);
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  if (action === "strength") {
    const { data, error } = await getStrengthTimeline(user.id);
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  if (action === "recovery") {
    const { data, error } = await getMuscleRecovery(user.id);
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  if (action === "session-sets") {
    const sessionId = context.url.searchParams.get("sessionId");
    if (!sessionId) return json({ error: "Missing sessionId" }, 400);
    const { data: session } = await getOwnedSession(sessionId, user.id);
    if (!session) return json({ error: "Not found" }, 404);
    const { data, error } = await getSessionSets(sessionId);
    if (error) return json({ error: String(error) }, 500);
    return json(data);
  }

  return json({ error: "Unknown action" }, 400);
};

export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const body = await context.request.json();
  const { action, ...data } = body;

  if (action === "create") {
    const { name, programId, weekNumber, localDate } = data;
    if (!name) return json({ error: "Missing name" }, 400);
    const { data: session, error } = await createWorkout({
      userId: user.id,
      name,
      programId,
      weekNumber,
      date: localDate ?? new Date().toISOString().split("T")[0],
    });
    if (error) return json({ error }, 500);
    return json(session);
  }

  if (action === "complete") {
    const { sessionId, duration, overallRpe, notes, sessionName, exerciseNotes } = data;

    const { data: owned } = await getOwnedSession(sessionId, user.id);
    if (!owned) return json({ error: "Not found" }, 404);

    // 1. Mark workout as complete in DB immediately
    const { data: session, error } = await completeWorkout(sessionId, duration, overallRpe, notes);
    if (error) return json({ error }, 500);

    // 2. Build payload for El Arquitecto
    let analysis: string | null = null;
    try {
      const { data: sets } = await getSessionSets(sessionId);
      if (sets && sets.length > 0) {
        // Build per-exercise notes lookup from client payload
        const notesLookup = new Map<string, string>();
        if (Array.isArray(exerciseNotes)) {
          for (const en of exerciseNotes as { name: string; notes: string }[]) {
            if (en.name && en.notes) notesLookup.set(en.name, en.notes);
          }
        }

        // Group flat set rows by exercise, merging in any per-exercise notes
        const exerciseMap = new Map<string, WorkoutExercise>();
        for (const s of sets) {
          if (!exerciseMap.has(s.exerciseName)) {
            const exNotes = notesLookup.get(s.exerciseName);
            exerciseMap.set(s.exerciseName, {
              name: s.exerciseName,
              muscleGroup: s.muscleGroup,
              ...(exNotes ? { notes: exNotes } : {}),
              sets: [],
            });
          }
          exerciseMap.get(s.exerciseName)!.sets.push({ weightKg: s.weightKg, reps: s.reps, rpe: s.rpe });
        }

        // 3. Call El Arquitecto — awaited so summary screen receives analysis immediately
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
      console.error("[Arquitecto] pipeline error:", err);
    }

    return json({ session, analysis });
  }

  if (action === "cancel") {
    const { sessionId } = data;
    const { data: owned } = await getOwnedSession(sessionId, user.id);
    if (!owned) return json({ error: "Not found" }, 404);
    const { error } = await deleteWorkout(sessionId);
    if (error) return json({ error }, 500);
    return new Response(null, { status: 204 });
  }

  return json({ error: "Invalid action" }, 400);
};
