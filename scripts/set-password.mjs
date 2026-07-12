/**
 * Establece la contraseña de un usuario existente (migracion desde Clerk).
 * Los usuarios creados en la era Clerk no tienen password_hash; con esto
 * pueden iniciar sesion en la auth propia sin perder sus datos.
 *
 * Uso: pnpm auth:set-password correo@ejemplo.com "MiContraseñaSegura"
 */
import postgres from "postgres";
import { hash } from "@node-rs/argon2";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Uso: pnpm auth:set-password <email> "<contraseña>"');
  process.exit(1);
}
if (password.length < 8) {
  console.error("La contraseña necesita al menos 8 caracteres");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no esta definida");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const [user] = await sql`
    UPDATE users
    SET password_hash = ${passwordHash}, updated_at = now()
    WHERE lower(email) = ${email.toLowerCase()}
    RETURNING id, email
  `;
  if (!user) {
    console.error(`No existe usuario con email ${email}`);
    process.exit(1);
  }
  console.log(`Contraseña establecida para ${user.email} (${user.id})`);
} finally {
  await sql.end();
}
