import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { nutritionLogs, nutritionTargets, nutritionStaples } from "@/lib/db/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getWeeklyNutritionSummary } from "@/lib/db/nutrition";
import { getActiveMealPlan, getPlanMealForUser } from "@/lib/db/mealPlans";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const GET: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;
  const { url } = context;

  // Weekly summary: last 7 days grouped by date
  if (url.searchParams.get("action") === "weekly") {
    return json(await getWeeklyNutritionSummary(user.id));
  }

  // Use client-supplied local date + tz offset so "today" means the user's calendar day,
  // not UTC midnight (which would bleed yesterday's late-night logs into today).
  const dateParam = url.searchParams.get("date");     // "YYYY-MM-DD" in client's local tz
  const tzOffset  = parseInt(url.searchParams.get("tzOffset") ?? "0"); // minutes behind UTC

  let todayStart: Date;
  let todayEnd: Date;
  if (dateParam) {
    const [y, m, d] = dateParam.split("-").map(Number);
    todayStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) + tzOffset * 60 * 1000);
    todayEnd   = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  } else {
    todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
  }

  const [logs, targetsRows, staples, plan] = await Promise.all([
    db.select()
      .from(nutritionLogs)
      .where(and(
        eq(nutritionLogs.userId, user.id),
        gte(nutritionLogs.loggedAt, todayStart),
        lt(nutritionLogs.loggedAt, todayEnd),
      ))
      .orderBy(desc(nutritionLogs.loggedAt)),

    db.select()
      .from(nutritionTargets)
      .where(and(eq(nutritionTargets.userId, user.id), eq(nutritionTargets.active, true)))
      .limit(1),

    db.select()
      .from(nutritionStaples)
      .where(eq(nutritionStaples.userId, user.id))
      .orderBy(desc(nutritionStaples.createdAt)),

    getActiveMealPlan(user.id),
  ]);

  return json({ logs, targets: targetsRows[0] ?? null, staples, plan });
};

export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const body = await context.request.json();

  if (body.action === "update-targets") {
    // Con plan alimenticio activo, las metas las define el entrenador
    const activePlan = await getActiveMealPlan(user.id);
    if (activePlan) {
      return json({ error: "Tus metas las define el plan de tu entrenador" }, 409);
    }
    const { calories, proteinG, carbsG, fatsG } = body;
    await db.update(nutritionTargets).set({ active: false }).where(eq(nutritionTargets.userId, user.id));
    const [data] = await db
      .insert(nutritionTargets)
      .values({ userId: user.id, calories, proteinG, carbsG, fatsG, active: true })
      .returning();
    return json(data);
  }

  if (body.action === "add-staple") {
    const { name, calories, proteinG, carbsG, fatsG } = body;
    const [data] = await db
      .insert(nutritionStaples)
      .values({ userId: user.id, name, calories: calories.toString(), proteinG: proteinG.toString(), carbsG: carbsG.toString(), fatsG: fatsG.toString() })
      .returning();
    return json(data);
  }

  if (body.action === "log-plan-meal") {
    const meal = await getPlanMealForUser(body.mealPlanMealId, user.id);
    if (!meal) return json({ error: "Comida fuera de tu plan activo" }, 404);
    const [data] = await db
      .insert(nutritionLogs)
      .values({
        userId: user.id,
        mealName: meal.name,
        calories: meal.calories,
        proteinG: meal.proteinG,
        carbsG: meal.carbsG,
        fatsG: meal.fatsG,
        mealPlanMealId: meal.id,
      })
      .returning();
    return json(data);
  }

  const { mealName, calories, proteinG, carbsG, fatsG } = body;
  if (!mealName || calories == null) return json({ error: "Missing mealName or calories" }, 400);
  const [data] = await db
    .insert(nutritionLogs)
    .values({ userId: user.id, mealName, calories, proteinG, carbsG, fatsG })
    .returning();
  return json(data);
};

export const DELETE: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const id       = context.url.searchParams.get("id");
  const stapleId = context.url.searchParams.get("stapleId");

  if (stapleId) {
    await db
      .delete(nutritionStaples)
      .where(and(eq(nutritionStaples.id, stapleId), eq(nutritionStaples.userId, user.id)));
    return new Response(null, { status: 204 });
  }

  if (!id) return json({ error: "Missing id" }, 400);
  await db
    .delete(nutritionLogs)
    .where(and(eq(nutritionLogs.id, id), eq(nutritionLogs.userId, user.id)));
  return new Response(null, { status: 204 });
};
