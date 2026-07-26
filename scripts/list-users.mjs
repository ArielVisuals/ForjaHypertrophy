import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está definida");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  const users = await sql`
    SELECT id, email, display_name as displayName, role, coach_id as coachId, created_at as createdAt FROM users
  `;
  const coaches = users.filter(u => u.role === 'coach');
  const athletes = users.filter(u => u.role === 'athlete');

  console.log("=== COACHES ===");
  console.table(coaches);
  console.log("\n=== ATHLETES ===");
  console.table(athletes);
} catch (err) {
  console.error("Error al consultar usuarios:", err);
} finally {
  await sql.end();
}
