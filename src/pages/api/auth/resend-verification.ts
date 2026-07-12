import type { APIRoute } from "astro";
import { requireUser } from "@/lib/auth";
import { createEmailToken } from "@/lib/auth";
import { sendEmail, verificationEmail } from "@/lib/email";
import { isRateLimited } from "@/lib/rateLimit";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export const POST: APIRoute = async (context) => {
  const user = await requireUser(context);
  if (user instanceof Response) return user;

  if (user.emailVerifiedAt) return json({ ok: true, alreadyVerified: true });
  if (!user.email) return json({ error: "Tu cuenta no tiene correo" }, 400);

  if (isRateLimited(`verify:${user.id}`, 3, 60 * 60 * 1000)) {
    return json({ error: "Demasiados reenvios. Espera un momento." }, 429);
  }

  const token = await createEmailToken(user.id, "verify_email", 60 * 24);
  const verifyUrl = `${context.url.origin}/verify-email?token=${token}`;
  const { subject, html } = verificationEmail(verifyUrl);
  const sent = await sendEmail(user.email, subject, html);

  return sent ? json({ ok: true }) : json({ error: "No se pudo enviar el correo. Intenta mas tarde." }, 502);
};
