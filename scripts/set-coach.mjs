/**
 * Marca una cuenta existente como entrenador y le asigna los atletas sin coach.
 * La cuenta debe haber iniciado sesión al menos una vez (para que exista en `users`).
 *
 * Uso: pnpm coach:set correo@ejemplo.com
 */
import postgres from "postgres";

const email = process.argv[2];
if (!email) {
  console.error("Uso: pnpm coach:set <email>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está definida (el script se ejecuta con --env-file=.env)");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  const [coach] = await sql`
    UPDATE users
    SET role = 'coach', coach_id = NULL, updated_at = now()
    WHERE email = ${email}
    RETURNING id, email
  `;

  if (!coach) {
    console.error(`No existe usuario con email ${email}. Debe iniciar sesión al menos una vez.`);
    process.exit(1);
  }

  const assigned = await sql`
    UPDATE users
    SET coach_id = ${coach.id}, updated_at = now()
    WHERE role = 'athlete' AND coach_id IS NULL
    RETURNING id
  `;

  console.log(`Entrenador configurado: ${coach.email} (${coach.id})`);
  console.log(`Atletas asignados: ${assigned.length}`);
} finally {
  await sql.end();
}
