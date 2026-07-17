/** Elimina los usuarios de auditoría y todos sus datos dependientes. */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
try {
  const users = await sql`SELECT id, email FROM users WHERE email LIKE '%@audit.forja'`;
  for (const u of users) {
    await sql`DELETE FROM sessions WHERE user_id = ${u.id}`;
    await sql`DELETE FROM email_tokens WHERE user_id = ${u.id}`;
    await sql`DELETE FROM intake_forms WHERE user_id = ${u.id}`;
    await sql`DELETE FROM nutrition_logs WHERE user_id = ${u.id}`;
    await sql`DELETE FROM nutrition_targets WHERE user_id = ${u.id}`.catch(() => {});
    await sql`DELETE FROM meal_plan_meals WHERE meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = ${u.id})`;
    await sql`DELETE FROM meal_plans WHERE user_id = ${u.id}`;
    await sql`DELETE FROM workout_sets WHERE session_id IN (SELECT id FROM workout_sessions WHERE user_id = ${u.id})`.catch(() => {});
    await sql`DELETE FROM workout_sessions WHERE user_id = ${u.id}`.catch(() => {});
    const programs = await sql`SELECT id FROM training_programs WHERE user_id = ${u.id} OR created_by = ${u.id}`;
    for (const p of programs) {
      await sql`DELETE FROM program_exercises WHERE program_day_id IN (SELECT id FROM program_days WHERE program_id = ${p.id})`;
      await sql`DELETE FROM program_days WHERE program_id = ${p.id}`;
      await sql`DELETE FROM training_programs WHERE id = ${p.id}`;
    }
  }
  // atletas reales adoptados por el coach de prueba (no debería pasar): soltarlos
  await sql`UPDATE users SET coach_id = NULL WHERE coach_id IN (SELECT id FROM users WHERE email LIKE '%@audit.forja')`;
  const res = await sql`DELETE FROM users WHERE email LIKE '%@audit.forja' RETURNING email`;
  console.log("eliminados:", res.map(r => r.email).join(", ") || "ninguno");
} finally {
  await sql.end();
}
