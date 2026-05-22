import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { nutritionLogs, nutritionTargets, nutritionStaples } from "@/lib/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get("userId");
  if (!userId) return new Response("Missing userId", { status: 400 });

  // Weekly summary: last 7 days grouped by date
  if (url.searchParams.get("action") === "weekly") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logs = await db
      .select()
      .from(nutritionLogs)
      .where(and(eq(nutritionLogs.userId, userId), gte(nutritionLogs.loggedAt, sevenDaysAgo)))
      .orderBy(desc(nutritionLogs.loggedAt));

    const byDate: Record<string, { kcal: number; prot: number; carbs: number; fats: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      byDate[key] = { kcal: 0, prot: 0, carbs: 0, fats: 0 };
    }
    for (const log of logs) {
      const d   = new Date(log.loggedAt as Date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (byDate[key]) {
        byDate[key].kcal  += Number(log.calories);
        byDate[key].prot  += Number(log.proteinG ?? 0);
        byDate[key].carbs += Number(log.carbsG   ?? 0);
        byDate[key].fats  += Number(log.fatsG    ?? 0);
      }
    }
    const result = Object.entries(byDate).map(([date, totals]) => ({ date, ...totals }));
    return new Response(JSON.stringify(result), { status: 200 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [logs, targetsRows, staples] = await Promise.all([
    db.select()
      .from(nutritionLogs)
      .where(and(eq(nutritionLogs.userId, userId), gte(nutritionLogs.loggedAt, today)))
      .orderBy(desc(nutritionLogs.loggedAt)),

    db.select()
      .from(nutritionTargets)
      .where(and(eq(nutritionTargets.userId, userId), eq(nutritionTargets.active, true)))
      .limit(1),

    db.select()
      .from(nutritionStaples)
      .where(eq(nutritionStaples.userId, userId))
      .orderBy(desc(nutritionStaples.createdAt)),
  ]);

  return new Response(
    JSON.stringify({ logs, targets: targetsRows[0] ?? null, staples }),
    { status: 200 }
  );
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  if (body.action === "update-targets") {
    const { userId, calories, proteinG, carbsG, fatsG } = body;
    await db.update(nutritionTargets).set({ active: false }).where(eq(nutritionTargets.userId, userId));
    const [data] = await db
      .insert(nutritionTargets)
      .values({ userId, calories, proteinG, carbsG, fatsG, active: true })
      .returning();
    return new Response(JSON.stringify(data), { status: 200 });
  }

  if (body.action === "add-staple") {
    const { userId, name, calories, proteinG, carbsG, fatsG } = body;
    const [data] = await db
      .insert(nutritionStaples)
      .values({ userId, name, calories: calories.toString(), proteinG: proteinG.toString(), carbsG: carbsG.toString(), fatsG: fatsG.toString() })
      .returning();
    return new Response(JSON.stringify(data), { status: 200 });
  }

  const [data] = await db.insert(nutritionLogs).values(body).returning();
  return new Response(JSON.stringify(data), { status: 200 });
};

export const DELETE: APIRoute = async ({ url }) => {
  const id    = url.searchParams.get("id");
  const stapleId = url.searchParams.get("stapleId");

  if (stapleId) {
    await db.delete(nutritionStaples).where(eq(nutritionStaples.id, stapleId));
    return new Response(null, { status: 204 });
  }

  if (!id) return new Response("Missing id", { status: 400 });
  await db.delete(nutritionLogs).where(eq(nutritionLogs.id, id));
  return new Response(null, { status: 204 });
};
