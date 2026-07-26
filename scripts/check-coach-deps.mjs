import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está definida");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  const coachEmail = 'arielvisuals.me@gmail.com';
  const [coach] = await sql`SELECT id FROM users WHERE email = ${coachEmail} AND role = 'coach'`;
  
  if (!coach) {
    console.log("No coach found with that email.");
  } else {
    const athletes = await sql`SELECT id, email, display_name FROM users WHERE coach_id = ${coach.id}`;
    console.log(`Athletes assigned to coach ${coachEmail}:`);
    console.table(athletes);
  }
} finally {
  await sql.end();
}
