import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está definida");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  // Obtener los ids de los atletas
  const athletes = await sql`
    SELECT id, email, display_name FROM users WHERE role = 'athlete'
  `;

  if (athletes.length === 0) {
    console.log("No se encontraron atletas para eliminar.");
    process.exit(0);
  }

  const athleteIds = athletes.map(a => a.id);
  console.log("Atletas a eliminar:", athletes);

  // Eliminar en orden para evitar problemas de FK
  // 1. workout_sets (a través de workout_sessions)
  const sessions = await sql`
    SELECT id FROM workout_sessions WHERE user_id IN ${sql(athleteIds)}
  `;
  if (sessions.length > 0) {
    const sessionIds = sessions.map(s => s.id);
    const delSets = await sql`
      DELETE FROM workout_sets WHERE workout_session_id IN ${sql(sessionIds)} RETURNING id
    `;
    console.log(`Eliminados ${delSets.length} registros de workout_sets`);
  }

  // 2. workout_sessions
  const delSessions = await sql`
    DELETE FROM workout_sessions WHERE user_id IN ${sql(athleteIds)} RETURNING id
  `;
  console.log(`Eliminados ${delSessions.length} registros de workout_sessions`);

  // 3. workout_templates
  const delTemplates = await sql`
    DELETE FROM workout_templates WHERE user_id IN ${sql(athleteIds)} RETURNING id
  `;
  console.log(`Eliminados ${delTemplates.length} registros de workout_templates`);

  // 4. training_programs (ejercicios del programa, días del programa, programa)
  const programs = await sql`
    SELECT id FROM training_programs WHERE user_id IN ${sql(athleteIds)}
  `;
  if (programs.length > 0) {
    const programIds = programs.map(p => p.id);
    const days = await sql`
      SELECT id FROM program_days WHERE program_id IN ${sql(programIds)}
    `;
    if (days.length > 0) {
      const dayIds = days.map(d => d.id);
      const delProgEx = await sql`
        DELETE FROM program_exercises WHERE program_day_id IN ${sql(dayIds)} RETURNING id
      `;
      console.log(`Eliminados ${delProgEx.length} registros de program_exercises`);

      const delProgDays = await sql`
        DELETE FROM program_days WHERE id IN ${sql(dayIds)} RETURNING id
      `;
      console.log(`Eliminados ${delProgDays.length} registros de program_days`);
    }
    const delPrograms = await sql`
      DELETE FROM training_programs WHERE id IN ${sql(programIds)} RETURNING id
    `;
    console.log(`Eliminados ${delPrograms.length} registros de training_programs`);
  }

  // 5. body_measurements
  const delMeasurements = await sql`
    DELETE FROM body_measurements WHERE user_id IN ${sql(athleteIds)} RETURNING id
  `;
  console.log(`Eliminados ${delMeasurements.length} registros de body_measurements`);

  // 6. meal_plans y meal_plan_meals
  const plans = await sql`
    SELECT id FROM meal_plans WHERE assigned_to IN ${sql(athleteIds)}
  `;
  if (plans.length > 0) {
    const planIds = plans.map(p => p.id);
    const delMealPlanMeals = await sql`
      DELETE FROM meal_plan_meals WHERE meal_plan_id IN ${sql(planIds)} RETURNING id
    `;
    console.log(`Eliminados ${delMealPlanMeals.length} registros de meal_plan_meals`);
    const delMealPlans = await sql`
      DELETE FROM meal_plans WHERE id IN ${sql(planIds)} RETURNING id
    `;
    console.log(`Eliminados ${delMealPlans.length} registros de meal_plans`);
  }

  // 7. nutrition_logs
  const delNutLogs = await sql`
    DELETE FROM nutrition_logs WHERE user_id IN ${sql(athleteIds)} RETURNING id
  `;
  console.log(`Eliminados ${delNutLogs.length} registros de nutrition_logs`);

  // 8. nutrition_targets
  const delNutTargets = await sql`
    DELETE FROM nutrition_targets WHERE user_id IN ${sql(athleteIds)} RETURNING id
  `;
  console.log(`Eliminados ${delNutTargets.length} registros de nutrition_targets`);

  // 9. nutrition_staples
  const delNutStaples = await sql`
    DELETE FROM nutrition_staples WHERE user_id IN ${sql(athleteIds)} RETURNING id
  `;
  console.log(`Eliminados ${delNutStaples.length} registros de nutrition_staples`);

  // 10. intake_forms
  const delIntake = await sql`
    DELETE FROM intake_forms WHERE user_id IN ${sql(athleteIds)} RETURNING id
  `;
  console.log(`Eliminados ${delIntake.length} registros de intake_forms`);

  // 11. email_tokens
  const delTokens = await sql`
    DELETE FROM email_tokens WHERE user_id IN ${sql(athleteIds)} RETURNING id
  `;
  console.log(`Eliminados ${delTokens.length} registros de email_tokens`);

  // 12. sessions
  const delSessionsAuth = await sql`
    DELETE FROM sessions WHERE user_id IN ${sql(athleteIds)} RETURNING id
  `;
  console.log(`Eliminados ${delSessionsAuth.length} registros de sessions`);

  // 13. users
  const delUsers = await sql`
    DELETE FROM users WHERE id IN ${sql(athleteIds)} AND role = 'athlete' RETURNING id, email, display_name
  `;
  console.log(`Eliminados ${delUsers.length} registros de usuarios (atletas):`);
  console.table(delUsers);

  console.log("Limpieza completada exitosamente.");
} catch (err) {
  console.error("Error durante la eliminación:", err);
} finally {
  await sql.end();
}
