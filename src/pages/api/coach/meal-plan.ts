import type { APIRoute } from "astro";
import { requireCoachOf } from "@/lib/auth";
import { getActiveMealPlan, saveMealPlan, deactivateMealPlan, type MealPlanDraft } from "@/lib/db/mealPlans";
import { MEAL_SLOTS } from "@/lib/constants/nutrition";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const num = (v: unknown, max = 10000) => Math.min(max, Math.max(0, Math.round(Number(v) || 0)));

function parseDraft(body: any): MealPlanDraft | null {
  if (!body?.name?.trim() || !Array.isArray(body.meals)) return null;
  return {
    name: String(body.name).trim(),
    notes: body.notes?.trim() || null,
    calories: num(body.calories),
    proteinG: num(body.proteinG, 1000),
    carbsG: num(body.carbsG, 2000),
    fatsG: num(body.fatsG, 1000),
    meals: body.meals
      .filter((m: any) => m?.name?.trim())
      .map((m: any) => ({
        slot: (MEAL_SLOTS as readonly string[]).includes(m.slot) ? m.slot : "comida",
        name: String(m.name).trim(),
        description: m.description?.trim() || null,
        calories: num(m.calories),
        proteinG: num(m.proteinG, 1000),
        carbsG: num(m.carbsG, 2000),
        fatsG: num(m.fatsG, 1000),
      })),
  };
}

export const GET: APIRoute = async (context) => {
  const athleteId = context.url.searchParams.get("athleteId");
  if (!athleteId) return json({ error: "Missing athleteId" }, 400);

  const athlete = await requireCoachOf(context, athleteId);
  if (athlete instanceof Response) return athlete;

  return json(await getActiveMealPlan(athleteId));
};

export const POST: APIRoute = async (context) => {
  const body = await context.request.json();
  const { action, athleteId } = body;
  if (!athleteId) return json({ error: "Missing athleteId" }, 400);

  const athlete = await requireCoachOf(context, athleteId);
  if (athlete instanceof Response) return athlete;

  if (action === "save") {
    const draft = parseDraft(body);
    if (!draft) return json({ error: "El plan necesita nombre y comidas" }, 400);
    if (draft.meals.length === 0) return json({ error: "Agrega al menos una comida" }, 400);
    // requireCoachOf ya validó pertenencia; el coach de la sesión es quien firma
    const coachId = athlete.coachId!;
    const plan = await saveMealPlan(coachId, athleteId, draft);
    return json(plan);
  }

  if (action === "deactivate") {
    const ok = await deactivateMealPlan(athleteId);
    if (!ok) return json({ error: "El atleta no tiene plan activo" }, 404);
    return new Response(null, { status: 204 });
  }

  return json({ error: "Invalid action" }, 400);
};
