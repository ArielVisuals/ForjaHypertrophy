import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { shoppingListItems, shoppingLists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export const PUT: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const itemId = context.params.id;
  if (!itemId) return new Response("Missing item ID", { status: 400 });

  try {
    const data = await context.request.json();
    const isChecked = Boolean(data.isChecked);

    // Verify ownership via list
    const [item] = await db.select({ listId: shoppingListItems.listId }).from(shoppingListItems).where(eq(shoppingListItems.id, itemId));
    if (!item) return new Response("Item not found", { status: 404 });

    const [list] = await db.select({ userId: shoppingLists.userId }).from(shoppingLists).where(eq(shoppingLists.id, item.listId));
    if (!list || list.userId !== user.id) return new Response("Unauthorized", { status: 401 });

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
