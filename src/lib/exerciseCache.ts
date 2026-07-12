const KEY = "forja_exercises_v1";

export type CachedExercise = { id: string; name: string; muscleGroup?: string; muscle_group?: string; created_at?: string };

/**
 * Fetches the exercises list from the API when online and writes to localStorage.
 * When offline, serves the last cached version.
 */
export async function fetchExercisesCached(): Promise<CachedExercise[]> {
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const res = await fetch("/api/exercises");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem(KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch {}
  }

  // Offline — serve from localStorage
  try {
    const cached = localStorage.getItem(KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}
