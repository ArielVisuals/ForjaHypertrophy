import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { shoppingListItems, shoppingLists } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const itemId = params.id;
  if (!itemId) return new Response("Missing item ID", { status: 400 });

  try {
    const data = await request.json();
    const isChecked = Boolean(data.isChecked);

    // Verify ownership via list
    const [item] = await db.select({ listId: shoppingListItems.listId }).from(shoppingListItems).where(eq(shoppingListItems.id, itemId));
    if (!item) return new Response("Item not found", { status: 404 });

    const [list] = await db.select({ userId: shoppingLists.userId }).from(shoppingLists).where(eq(shoppingLists.id, item.listId));
    if (!list || list.userId !== session.userId) return new Response("Unauthorized", { status: 401 });

    // Update item
    await db
      .update(shoppingListItems)
      .set({ isChecked })
      .where(eq(shoppingListItems.id, itemId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("[API/shopping-list/check] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};
