import postgres from "postgres";

const athleteEmail = process.argv[2];
const coachEmail = process.argv[3];

if (!athleteEmail || !coachEmail) {
  console.error("Uso: node --env-file=.env scripts/assign-athlete.mjs <email_atleta> <email_coach>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está definida");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  // Buscar al coach
  const [coach] = await sql`
    SELECT id, email, display_name FROM users WHERE email = ${coachEmail} AND role = 'coach'
  `;

  if (!coach) {
    console.error(`Error: No se encontró ningún coach con el correo ${coachEmail}`);
    process.exit(1);
  }

  // Buscar al atleta y actualizar su coach
  const [athlete] = await sql`
    UPDATE users
    SET coach_id = ${coach.id}, updated_at = now()
    WHERE email = ${athleteEmail} AND role = 'athlete'
    RETURNING id, email, display_name
  `;

  if (!athlete) {
    console.error(`Error: No se encontró ningún atleta con el correo ${athleteEmail}`);
    process.exit(1);
  }

  console.log(`¡Asignación exitosa!`);
  console.log(`Atleta: ${athlete.display_name} (${athlete.email})`);
  console.log(`Ahora asignado al Coach: ${coach.display_name} (${coach.email})`);
} catch (err) {
  console.error("Error al asignar atleta:", err);
} finally {
  await sql.end();
}
