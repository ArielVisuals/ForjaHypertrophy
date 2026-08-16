import type { APIRoute } from "astro";
import { addWorkoutSet, getOwnedSession } from "@/lib/db/workouts";
import { requireUser } from "@/lib/auth";
import { updatePersonalRecordIfBetter } from "@/lib/db/personalRecords";

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

  // ─── Auto-PR: si el set está completado con ejercicio y peso, verificar récord ───
  let isNewRecord = false;
  if (
    data &&
    body.completed === true &&
    body.exerciseId &&
    body.weightKg > 0 &&
    body.reps >= 1 &&
    body.reps <= 12
  ) {
    try {
      const prResult = await updatePersonalRecordIfBetter(
        user.id,
        body.exerciseId,
        Number(body.weightKg),
        Number(body.reps),
        data.id,
        new Date()
      );
      isNewRecord = prResult.isNewRecord;
    } catch {
      // PR tracking falla silenciosamente, no bloquear el guardado del set
    }
  }

  return json({ ...data, isNewRecord });
};
