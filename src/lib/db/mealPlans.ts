/**
 * Planes alimenticios: el entrenador los diseña y asigna; el atleta
 * registra las comidas del plan desde Combustible.
 */

import { db } from "./index";
import { mealPlans, mealPlanMeals, nutritionTargets } from "./schema";
import { eq, and, asc } from "drizzle-orm";
import { MEAL_SLOTS, type Ingredient } from "../constants/nutrition";

export interface MealPlanMeal {
  id: string;
  slot: string;
  order: number;
  name: string;
  ingredients: Ingredient[];
  description: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export interface ActiveMealPlan {
  id: string;
  name: string;
  notes: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  meals: MealPlanMeal[];
}

/** Plan alimenticio activo de un atleta con sus comidas ordenadas por franja. */
export async function getActiveMealPlan(athleteId: string): Promise<ActiveMealPlan | null> {
  const [plan] = await db
    .select()
    .from(mealPlans)
    .where(and(eq(mealPlans.assignedTo, athleteId), eq(mealPlans.active, true)))
    .limit(1);
  if (!plan) return null;

  const meals = await db
    .select()
    .from(mealPlanMeals)
    .where(eq(mealPlanMeals.mealPlanId, plan.id))
    .orderBy(asc(mealPlanMeals.order));

  const slotRank = new Map(MEAL_SLOTS.map((s, i) => [s as string, i]));
  meals.sort((a, b) => (slotRank.get(a.slot) ?? 99) - (slotRank.get(b.slot) ?? 99) || a.order - b.order);

  return {
    id: plan.id,
    name: plan.name,
    notes: plan.notes,
    calories: plan.calories,
    proteinG: plan.proteinG,
    carbsG: plan.carbsG,
    fatsG: plan.fatsG,
    meals: meals.map(m => ({
      id: m.id,
      slot: m.slot,
      order: m.order,
      name: m.name,
      ingredients: Array.isArray(m.ingredients) ? (m.ingredients as Ingredient[]) : [],
      description: m.description,
      calories: Number(m.calories),
      proteinG: Number(m.proteinG ?? 0),
      carbsG: Number(m.carbsG ?? 0),
      fatsG: Number(m.fatsG ?? 0),
    })),
  };
}

export interface MealPlanDraft {
  name: string;
  notes?: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  meals: {
    slot: string;
    name: string;
    ingredients?: Ingredient[];
    description?: string | null;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
  }[];
}

/**
 * Guarda el plan activo de un atleta (reemplaza el anterior) y sincroniza
 * sus objetivos diarios (nutrition_targets) con las metas del plan.
 */
export async function saveMealPlan(coachId: string, athleteId: string, draft: MealPlanDraft) {
  // Un solo plan activo por atleta: desactiva los anteriores
  await db
    .update(mealPlans)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(mealPlans.assignedTo, athleteId));

  const [plan] = await db
    .insert(mealPlans)
    .values({
      createdBy: coachId,
      assignedTo: athleteId,
      name: draft.name,
      notes: draft.notes ?? null,
      active: true,
      calories: draft.calories,
      proteinG: draft.proteinG,
      carbsG: draft.carbsG,
      fatsG: draft.fatsG,
    })
    .returning();

  const meals = draft.meals.filter(m => m.name.trim());
  if (meals.length > 0) {
    await db.insert(mealPlanMeals).values(
      meals.map((m, order) => ({
        mealPlanId: plan.id,
        slot: m.slot,
        order,
        name: m.name.trim(),
        ingredients: (m.ingredients ?? []).filter(i => i.name.trim()),
        description: m.description?.trim() || null,
        calories: m.calories.toString(),
        proteinG: m.proteinG.toString(),
        carbsG: m.carbsG.toString(),
        fatsG: m.fatsG.toString(),
      }))
    );
  }

  // Los objetivos diarios del atleta ahora los define el plan
  await db.update(nutritionTargets).set({ active: false }).where(eq(nutritionTargets.userId, athleteId));
  await db.insert(nutritionTargets).values({
    userId: athleteId,
    calories: draft.calories,
    proteinG: draft.proteinG,
    carbsG: draft.carbsG,
    fatsG: draft.fatsG,
    active: true,
  });

  return plan;
}

/** Desactiva el plan activo de un atleta (vuelve a registro libre). */
export async function deactivateMealPlan(athleteId: string) {
  const updated = await db
    .update(mealPlans)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(mealPlans.assignedTo, athleteId), eq(mealPlans.active, true)))
    .returning({ id: mealPlans.id });
  return updated.length > 0;
}

/** Comida del plan ACTIVO del propio usuario, o null — para registrar consumo. */
export async function getPlanMealForUser(mealId: string, userId: string) {
  const [row] = await db
    .select({
      id: mealPlanMeals.id,
      name: mealPlanMeals.name,
      calories: mealPlanMeals.calories,
      proteinG: mealPlanMeals.proteinG,
      carbsG: mealPlanMeals.carbsG,
      fatsG: mealPlanMeals.fatsG,
    })
    .from(mealPlanMeals)
    .innerJoin(mealPlans, eq(mealPlanMeals.mealPlanId, mealPlans.id))
    .where(and(eq(mealPlanMeals.id, mealId), eq(mealPlans.assignedTo, userId), eq(mealPlans.active, true)))
    .limit(1);
  return row ?? null;
}
