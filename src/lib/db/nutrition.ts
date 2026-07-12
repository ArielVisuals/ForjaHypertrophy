/**
 * Queries de nutricion compartidas entre la vista del atleta (API) y el
 * dashboard del entrenador (SSR).
 */

import { db } from "./index";
import { nutritionLogs, nutritionTargets } from "./schema";
import { eq, and, gte, desc } from "drizzle-orm";

export interface DailyNutrition {
  date: string; // YYYY-MM-DD
  kcal: number;
  prot: number;
  carbs: number;
  fats: number;
}

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Ultimos 7 dias agrupados por fecha (incluye dias sin registros en cero). */
export async function getWeeklyNutritionSummary(userId: string): Promise<DailyNutrition[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const logs = await db
    .select()
    .from(nutritionLogs)
    .where(and(eq(nutritionLogs.userId, userId), gte(nutritionLogs.loggedAt, sevenDaysAgo)))
    .orderBy(desc(nutritionLogs.loggedAt));

  const byDate: Record<string, DailyNutrition> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    byDate[key] = { date: key, kcal: 0, prot: 0, carbs: 0, fats: 0 };
  }
  for (const log of logs) {
    const key = dateKey(new Date(log.loggedAt as Date));
    if (byDate[key]) {
      byDate[key].kcal  += Number(log.calories);
      byDate[key].prot  += Number(log.proteinG ?? 0);
      byDate[key].carbs += Number(log.carbsG   ?? 0);
      byDate[key].fats  += Number(log.fatsG    ?? 0);
    }
  }
  return Object.values(byDate);
}

/** Objetivos diarios activos del usuario, o null. */
export async function getActiveNutritionTargets(userId: string) {
  const [target] = await db
    .select()
    .from(nutritionTargets)
    .where(and(eq(nutritionTargets.userId, userId), eq(nutritionTargets.active, true)))
    .limit(1);
  return target ?? null;
}
