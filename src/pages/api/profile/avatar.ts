import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/profile/avatar
// Accepts multipart/form-data with field "file" (image)
// Converts to base64 data URL and stores directly in the DB (no external storage needed)
export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  const contentType = context.request.headers.get("content-type") ?? "";

  // ─── Legacy: client sends a JSON URL (old Cloudinary flow) ─────────────────
  if (contentType.includes("application/json")) {
    let body: Record<string, unknown>;
    try { body = await context.request.json(); } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const { avatarUrl } = body;
    if (typeof avatarUrl !== "string" || !avatarUrl.startsWith("https://")) {
      return json({ error: "URL de avatar inválida" }, 400);
    }
    const allowedHosts = ["res.cloudinary.com", "cloudinary.com"];
    const isAllowed = allowedHosts.some((h) => avatarUrl.includes(h));
    if (!isAllowed) return json({ error: "URL no permitida" }, 400);
    const [updated] = await db
      .update(users)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning({ avatarUrl: users.avatarUrl });
    return json({ success: true, avatarUrl: updated.avatarUrl });
  }

  // ─── Main: client sends the file as multipart/form-data ────────────────────
  if (!contentType.includes("multipart/form-data")) {
    return json({ error: "Se esperaba multipart/form-data" }, 400);
  }

  let formData: FormData;
  try { formData = await context.request.formData(); } catch {
    return json({ error: "Error al leer el formulario" }, 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return json({ error: "No se encontró el archivo 'file'" }, 400);
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return json({ error: "Solo se permiten imágenes JPG, PNG, WebP o GIF" }, 400);
  }

  // Limit to 2MB for base64 storage (becomes ~2.7MB in DB — manageable)
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return json({ error: "La imagen no puede superar 2MB para subida directa" }, 400);
  }

  // Convert to base64 data URL
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const avatarUrl = `data:${file.type};base64,${base64}`;

  const [updated] = await db
    .update(users)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning({ avatarUrl: users.avatarUrl });

  return json({ success: true, avatarUrl: updated.avatarUrl });
};
