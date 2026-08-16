import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function migrate() {
  console.log("Applying social schema migrations...");

  // 1. Add new columns to users table (nullable, safe for existing data)
  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username text,
      ADD COLUMN IF NOT EXISTS avatar_url text,
      ADD COLUMN IF NOT EXISTS bio text;
  `;
  console.log("✓ Added username, avatar_url, bio to users");

  // 2. Add unique constraint on username (only affects non-null values, safe)
  await sql`
    ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_username_unique;
  `;
  await sql`
    ALTER TABLE users
      ADD CONSTRAINT users_username_unique UNIQUE (username);
  `;
  console.log("✓ Added UNIQUE constraint to username");

  // 3. Create friendships table
  await sql`
    CREATE TABLE IF NOT EXISTS friendships (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      requester_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE (requester_id, addressee_id)
    );
  `;
  console.log("✓ Created friendships table");

  // 4. Create personal_records table
  await sql`
    CREATE TABLE IF NOT EXISTS personal_records (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      weight_kg decimal(6,2) NOT NULL,
      reps integer NOT NULL,
      estimated_max decimal(6,2) NOT NULL,
      achieved_at timestamptz NOT NULL,
      workout_set_id uuid REFERENCES workout_sets(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE (user_id, exercise_id)
    );
  `;
  console.log("✓ Created personal_records table");

  // 5. Create exercise_rank_tiers table (empty, populated in future phase)
  await sql`
    CREATE TABLE IF NOT EXISTS exercise_rank_tiers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      gender text NOT NULL DEFAULT 'all',
      tier text NOT NULL,
      min_weight_kg decimal(6,2) NOT NULL,
      created_at timestamptz DEFAULT now(),
      UNIQUE (exercise_id, gender, tier)
    );
  `;
  console.log("✓ Created exercise_rank_tiers table");

  console.log("\n✅ All social schema migrations applied successfully!");
  await sql.end();
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
