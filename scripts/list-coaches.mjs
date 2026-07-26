import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está definida");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  const coaches = await sql`
    SELECT id, email, display_name, role FROM users WHERE role = 'coach'
  `;
  console.log("Coaches found:");
  console.table(coaches);
} finally {
  await sql.end();
}
