import postgres from "postgres";

const email = process.argv[2];
if (!email) {
  console.error("Uso: node --env-file=.env scripts/remove-coach.mjs <email>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está definida");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  const [coach] = await sql`SELECT id, role FROM users WHERE email = ${email}`;

  if (!coach) {
    console.error(`No existe usuario con email ${email}.`);
    process.exit(1);
  }

  if (coach.role !== 'coach') {
    console.error(`El usuario ${email} no tiene el rol de entrenador.`);
    process.exit(1);
  }

  console.log(`Eliminando rol de entrenador para: ${email} (${coach.id})`);

  // 1. Desvincular atletas
  const unassigned = await sql`
    UPDATE users
    SET coach_id = NULL
    WHERE coach_id = ${coach.id}
    RETURNING id
  `;
  console.log(`Atletas desvinculados: ${unassigned.length}`);

  // 2. Opción A: Borrar el usuario completamente
  // const deleted = await sql`DELETE FROM users WHERE id = ${coach.id} RETURNING id`;
  // console.log(`Usuario eliminado: ${deleted.length > 0}`);

  // Opción B: Cambiar rol a atleta (más seguro si tiene historial)
  const updated = await sql`
    UPDATE users
    SET role = 'athlete', updated_at = now()
    WHERE id = ${coach.id}
    RETURNING id
  `;
  console.log(`Rol actualizado a 'athlete' para el usuario.`);

} catch (error) {
  console.error("Error al procesar:", error);
} finally {
  await sql.end();
}
