import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// import.meta.env existe bajo Vite/Astro; process.env cubre scripts (tsx/node)
const connectionString = import.meta.env?.DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in your environment variables');
}

// Para queries de una sola vez (Serverless)
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
