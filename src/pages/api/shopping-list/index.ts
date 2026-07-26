import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { shoppingLists, shoppingListItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export const GET: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  try {
    // Buscar la lista más reciente del usuario
    const [latestList] = await db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.userId, user.id))
      .orderBy(desc(shoppingLists.createdAt))
      .limit(1);

    if (!latestList) {
      return new Response(JSON.stringify({ list: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const items = await db
      .select()
      .from(shoppingListItems)
      .where(eq(shoppingListItems.listId, latestList.id));

    return new Response(JSON.stringify({ list: latestList, items }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("[API/shopping-list/index] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};
