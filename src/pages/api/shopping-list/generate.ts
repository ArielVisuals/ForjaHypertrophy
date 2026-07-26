import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { shoppingLists, shoppingListItems, mealPlans, mealPlanMeals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { generateShoppingList, type ShoppingListItemRaw } from "@/lib/gemini";

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const data = await request.json();
    const timeframe = data.timeframe === 'month' ? 'month' : 'week';

    // 1. Obtener el plan activo del usuario
    const [activePlan] = await db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.assignedTo, session.userId), eq(mealPlans.active, true)));

    if (!activePlan) {
      return new Response(JSON.stringify({ error: "No active meal plan found" }), { status: 400 });
    }

    // 2. Obtener todas las comidas del plan
    const meals = await db
      .select()
      .from(mealPlanMeals)
      .where(eq(mealPlanMeals.mealPlanId, activePlan.id));

    // 3. Extraer ingredientes
    const rawIngredients: ShoppingListItemRaw[] = [];
    for (const meal of meals) {
      const ingredients = meal.ingredients as { name: string; qty: number; unit: string }[];
      if (Array.isArray(ingredients)) {
        for (const item of ingredients) {
          if (item.name && item.qty) {
            rawIngredients.push({
              name: item.name,
              qty: Number(item.qty),
              unit: item.unit || 'pza'
            });
          }
        }
      }
    }

    if (rawIngredients.length === 0) {
      return new Response(JSON.stringify({ error: "No ingredients found in meal plan" }), { status: 400 });
    }

    // 4. Generar lista con IA
    const aiGeneratedList = await generateShoppingList(rawIngredients, timeframe);

    if (!aiGeneratedList || aiGeneratedList.length === 0) {
      return new Response(JSON.stringify({ error: "Failed to generate list via AI" }), { status: 500 });
    }

    // 5. Guardar en BD
    // Primero, buscar si ya existe una lista para no acumular basura (opcional, por ahora creamos nueva)
    const [newList] = await db
      .insert(shoppingLists)
      .values({
        userId: session.userId,
        type: timeframe
      })
      .returning();

    const itemsToInsert = aiGeneratedList.map(item => ({
      listId: newList.id,
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      category: item.category,
      isChecked: false
    }));

    await db.insert(shoppingListItems).values(itemsToInsert);

    return new Response(JSON.stringify({ success: true, listId: newList.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("[API/shopping-list/generate] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};
