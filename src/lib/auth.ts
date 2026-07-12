/**
 * Auth propia de FORJA: email + contraseña.
 *
 * - Contraseñas con argon2id (parametros OWASP).
 * - Access token JWT (HS256, 15 min) en cookie httpOnly.
 * - Refresh token opaco (30 dias) en cookie httpOnly; en DB solo vive su
 *   hash sha256 (tabla sessions), revocable en logout.
 * - El middleware renueva el access token en silencio mientras la sesion
 *   de la tabla siga vigente.
 *
 * La identidad NUNCA viaja desde el cliente: toda la app consume estos
 * helpers (requireUser / requireCoach / requireCoachOf).
 */

import type { APIContext } from "astro";
import { SignJWT, jwtVerify } from "jose";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { createHash, randomBytes } from "node:crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";

export type AppUser = typeof users.$inferSelect;

const ACCESS_COOKIE = "forja_access";
const REFRESH_COOKIE = "forja_refresh";
const ACCESS_TTL_S = 15 * 60;              // 15 minutos
const REFRESH_TTL_S = 30 * 24 * 60 * 60;   // 30 dias

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

function authSecret(): Uint8Array {
  const secret = import.meta.env?.AUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no esta definida");
  return new TextEncoder().encode(secret);
}

const isProd = () => (import.meta.env?.PROD ?? process.env.NODE_ENV === "production") as boolean;

// ─── Contraseñas ──────────────────────────────────────────────────────────────

/** argon2id con parametros recomendados por OWASP (19 MiB, t=2, p=1). */
export function hashPassword(password: string): Promise<string> {
  return argonHash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await argonVerify(passwordHash, password);
  } catch {
    return false;
  }
}

// Hash señuelo: iguala el tiempo de respuesta cuando el email no existe
const DECOY_HASH_PROMISE = hashPassword(randomBytes(16).toString("hex"));
export async function verifyAgainstDecoy(password: string): Promise<void> {
  await verifyPassword(await DECOY_HASH_PROMISE, password);
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_S}s`)
    .sign(authSecret());
}

async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, authSecret(), { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function setAuthCookies(context: APIContext, accessToken: string, refreshToken?: string) {
  const base = { httpOnly: true, sameSite: "lax" as const, secure: isProd(), path: "/" };
  context.cookies.set(ACCESS_COOKIE, accessToken, { ...base, maxAge: ACCESS_TTL_S });
  if (refreshToken) {
    context.cookies.set(REFRESH_COOKIE, refreshToken, { ...base, maxAge: REFRESH_TTL_S });
  }
}

function clearAuthCookies(context: APIContext) {
  const base = { path: "/" };
  context.cookies.delete(ACCESS_COOKIE, base);
  context.cookies.delete(REFRESH_COOKIE, base);
}

// ─── Sesiones ─────────────────────────────────────────────────────────────────

/** Crea la sesion en DB y deja access + refresh en cookies. Se usa en login/registro. */
export async function issueSession(context: APIContext, userId: string): Promise<void> {
  const refreshToken = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    userId,
    refreshTokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_S * 1000),
  });
  setAuthCookies(context, await signAccessToken(userId), refreshToken);
}

/** Revoca la sesion del refresh actual y limpia cookies. */
export async function destroySession(context: APIContext): Promise<void> {
  const refreshToken = context.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.refreshTokenHash, sha256(refreshToken)));
  }
  clearAuthCookies(context);
}

async function loadUser(userId: string): Promise<AppUser | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

/**
 * Usuario de la sesion actual, o null. Verifica el access token; si expiro,
 * renueva en silencio contra la sesion vigente del refresh token.
 * Cachea en locals para no repetir trabajo en el mismo request.
 */
export async function getSessionUser(context: APIContext): Promise<AppUser | null> {
  if (context.locals.user) return context.locals.user;

  // 1. Access token vigente
  const accessToken = context.cookies.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    const userId = await verifyAccessToken(accessToken);
    if (userId) {
      const user = await loadUser(userId);
      if (user) {
        context.locals.user = user;
        return user;
      }
    }
  }

  // 2. Renovacion silenciosa via refresh token
  const refreshToken = context.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.refreshTokenHash, sha256(refreshToken)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    clearAuthCookies(context);
    return null;
  }

  const user = await loadUser(session.userId);
  if (!user) {
    clearAuthCookies(context);
    return null;
  }

  setAuthCookies(context, await signAccessToken(user.id));
  context.locals.user = user;
  return user;
}

// ─── Guards para API routes ───────────────────────────────────────────────────

/**
 * Devuelve el usuario autenticado o una Response 401 lista para retornar. Uso:
 *   const user = await requireUser(context);
 *   if (user instanceof Response) return user;
 */
export async function requireUser(context: APIContext): Promise<AppUser | Response> {
  const user = await getSessionUser(context);
  return user ?? json({ error: "No autorizado" }, 401);
}

/** Como requireUser, pero exige rol de entrenador. */
export async function requireCoach(context: APIContext): Promise<AppUser | Response> {
  const user = await requireUser(context);
  if (user instanceof Response) return user;
  return user.role === "coach" ? user : json({ error: "Requiere rol de entrenador" }, 403);
}

/**
 * Exige que la sesion sea un entrenador y que el atleta consultado le pertenezca.
 * Devuelve el atleta o una Response 403/404 lista para retornar.
 */
export async function requireCoachOf(context: APIContext, athleteId: string): Promise<AppUser | Response> {
  const coach = await requireCoach(context);
  if (coach instanceof Response) return coach;

  const [athlete] = await db.select().from(users).where(eq(users.id, athleteId)).limit(1);
  if (!athlete) return json({ error: "Atleta no encontrado" }, 404);
  if (athlete.coachId !== coach.id) return json({ error: "Este atleta no es tu asesorado" }, 403);
  return athlete;
}
