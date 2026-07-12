import type { APIRoute } from "astro";
import { requireCoach, requireCoachOf } from "@/lib/auth";
import {
  getProgramLibrary,
  getTemplateDetail,
  createCoachTemplate,
  updateCoachTemplate,
  deleteCoachTemplate,
  assignProgramToAthlete,
  type ProgramDraft,
} from "@/lib/db/programs";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

/** Valida y normaliza el draft del constructor. */
function parseDraft(body: any): ProgramDraft | null {
  if (!body?.name?.trim() || !Array.isArray(body.schedule) || body.schedule.length !== 7) return null;
  return {
    name: String(body.name).trim(),
    description: body.description?.trim() || null,
    level: body.level || null,
    focus: body.focus || null,
    durationWeeks: Math.min(52, Math.max(1, Number(body.durationWeeks) || 8)),
    schedule: body.schedule.map((d: any, i: number) => ({
      dayNumber: i,
      name: String(d?.name ?? "").trim(),
      shortName: String(d?.shortName ?? d?.name ?? "").trim(),
      isRest: !!d?.isRest,
      exercises: Array.isArray(d?.exercises)
        ? d.exercises
            .filter((ex: any) => ex?.name?.trim())
            .map((ex: any) => ({
              name: String(ex.name).trim(),
              muscleGroup: String(ex.muscleGroup ?? "full_body"),
              targetSets: Math.min(12, Math.max(1, Number(ex.targetSets) || 3)),
              repRange: String(ex.repRange ?? "8-12").trim(),
              rirTarget: ex.rirTarget == null ? null : Math.min(5, Math.max(0, Number(ex.rirTarget))),
              notes: ex.notes?.trim() || null,
            }))
        : [],
    })),
  };
}

export const GET: APIRoute = async (context) => {
  const coach = await requireCoach(context);
  if (coach instanceof Response) return coach;

  const id = context.url.searchParams.get("id");
  if (id) {
    const detail = await getTemplateDetail(coach.id, id);
    if (!detail) return json({ error: "Not found" }, 404);
    return json(detail);
  }

  return json(await getProgramLibrary(coach.id));
};

export const POST: APIRoute = async (context) => {
  const coach = await requireCoach(context);
  if (coach instanceof Response) return coach;

  const body = await context.request.json();
  const { action } = body;

  if (action === "create") {
    const draft = parseDraft(body);
    if (!draft) return json({ error: "Draft invalido: requiere nombre y 7 dias" }, 400);
    const program = await createCoachTemplate(coach.id, draft);
    return json(program);
  }

  if (action === "update") {
    const draft = parseDraft(body);
    if (!draft || !body.programId) return json({ error: "Draft invalido" }, 400);
    const program = await updateCoachTemplate(coach.id, body.programId, draft);
    if (!program) return json({ error: "Solo puedes editar tus propias plantillas" }, 403);
    return json(program);
  }

  if (action === "delete") {
    if (!body.programId) return json({ error: "Missing programId" }, 400);
    const ok = await deleteCoachTemplate(coach.id, body.programId);
    if (!ok) return json({ error: "Solo puedes eliminar tus propias plantillas" }, 403);
    return new Response(null, { status: 204 });
  }

  if (action === "assign") {
    const { programId, athleteId } = body;
    if (!programId || !athleteId) return json({ error: "Missing programId or athleteId" }, 400);

    const athlete = await requireCoachOf(context, athleteId);
    if (athlete instanceof Response) return athlete;

    const assigned = await assignProgramToAthlete(coach.id, programId, athleteId);
    if (!assigned) return json({ error: "Plantilla no encontrada" }, 404);
    return json(assigned);
  }

  return json({ error: "Invalid action" }, 400);
};
