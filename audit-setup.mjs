/**
 * Crea usuarios temporales SOLO para la auditoría Lighthouse:
 * - lh-coach@audit.forja (coach)
 * - lh-atleta@audit.forja (atleta asignado al coach de prueba)
 * Se eliminan con audit-cleanup.mjs al terminar.
 */
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import { randomUUID } from "node:crypto";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const PASSWORD = process.env.AUDIT_PASSWORD;
if (!PASSWORD) throw new Error("AUDIT_PASSWORD requerida");

try {
  const passwordHash = await hash(PASSWORD, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const coachId = `lhaudit_${randomUUID()}`;
  const athleteId = `lhaudit_${randomUUID()}`;

  await sql`
    INSERT INTO users (id, email, display_name, role, coach_id, onboarding_completed, password_hash, email_verified_at)
    VALUES (${coachId}, 'lh-coach@audit.forja', 'LH Coach', 'coach', NULL, true, ${passwordHash}, now())
  `;
  await sql`
    INSERT INTO users (id, email, display_name, role, coach_id, onboarding_completed, password_hash, email_verified_at)
    VALUES (${athleteId}, 'lh-atleta@audit.forja', 'LH Atleta', 'athlete', ${coachId}, false, ${passwordHash}, now())
  `;
  console.log(JSON.stringify({ coachId, athleteId }));
} finally {
  await sql.end();
}
