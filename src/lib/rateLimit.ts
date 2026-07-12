/**
 * Rate limiting en memoria (ventana deslizante). Suficiente para frenar
 * fuerza bruta casual; en serverless cada instancia tiene su propio contador,
 * asi que es best-effort. Para garantias duras, mover a Redis/Upstash.
 */

const buckets = new Map<string, number[]>();

/** true si la clave excedio `limit` intentos en los ultimos `windowMs`. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter(t => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);

  // Limpieza ocasional para no crecer sin limite
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every(t => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return false;
}
