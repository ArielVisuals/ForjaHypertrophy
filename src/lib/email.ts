/**
 * Correos transaccionales via API REST de Resend (sin SDK).
 *
 * Sin dominio verificado en Resend, los correos solo llegan a la direccion
 * dueña de la cuenta usando el remitente onboarding@resend.dev. Al verificar
 * un dominio propio, definir EMAIL_FROM (ej. "FORJA <hola@tudominio.com>").
 *
 * El envio nunca debe tumbar el flujo que lo dispara: los errores se
 * registran y se devuelve false.
 */

const FROM_FALLBACK = "FORJA <onboarding@resend.dev>";

function apiKey(): string | undefined {
  return import.meta.env?.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
}

function fromAddress(): string {
  return import.meta.env?.EMAIL_FROM ?? process.env.EMAIL_FROM ?? FROM_FALLBACK;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = apiKey();
  if (!key) {
    console.warn("[email] RESEND_API_KEY no definida — correo no enviado:", subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromAddress(), to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error("[email] Resend respondio", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Error enviando correo:", err);
    return false;
  }
}

// ─── Plantillas (HTML simple, compatible con clientes de correo) ─────────────

function shell(title: string, body: string, ctaLabel: string, ctaUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#000000;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0A0A0B;border:1px solid #26262a;border-radius:24px;padding:40px 32px;">
          <tr><td align="center" style="padding-bottom:24px;">
            <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-1px;">FORJA</span>
          </td></tr>
          <tr><td align="center" style="padding-bottom:12px;">
            <span style="font-size:20px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:-0.5px;">${title}</span>
          </td></tr>
          <tr><td align="center" style="padding-bottom:28px;">
            <span style="font-size:13px;color:#9ca3af;line-height:1.6;">${body}</span>
          </td></tr>
          <tr><td align="center" style="padding-bottom:28px;">
            <a href="${ctaUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:2px;text-decoration:none;padding:14px 32px;border-radius:12px;">${ctaLabel}</a>
          </td></tr>
          <tr><td align="center">
            <span style="font-size:11px;color:#4b5563;line-height:1.5;">Si no fuiste tu, ignora este correo. El enlace caduca pronto y solo funciona una vez.</span>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function verificationEmail(verifyUrl: string): { subject: string; html: string } {
  return {
    subject: "Verifica tu correo en FORJA",
    html: shell(
      "Verifica tu correo",
      "Confirma que esta direccion es tuya para asegurar tu cuenta.",
      "Verificar correo",
      verifyUrl
    ),
  };
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: "Restablece tu contraseña de FORJA",
    html: shell(
      "Restablece tu contraseña",
      "Recibimos una solicitud para cambiar tu contraseña. El enlace caduca en 30 minutos.",
      "Crear nueva contraseña",
      resetUrl
    ),
  };
}
