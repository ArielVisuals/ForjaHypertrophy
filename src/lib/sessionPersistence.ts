const SESSION_KEY = "forja_active_session_v2";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface PersistedSession {
  sessionId: string;
  sessionName: string;
  elapsedTime: number;
  savedAt: number;
  exercises: any[];
}

function ls(): Storage | null {
  return typeof localStorage !== "undefined" ? localStorage : null;
}

export function saveActiveSession(data: PersistedSession): Promise<void> {
  try { ls()?.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
  return Promise.resolve();
}

export function getActiveSession(): Promise<PersistedSession | null> {
  try {
    const raw = ls()?.getItem(SESSION_KEY);
    if (!raw) return Promise.resolve(null);
    const data: PersistedSession = JSON.parse(raw);
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      ls()?.removeItem(SESSION_KEY);
      return Promise.resolve(null);
    }
    return Promise.resolve(data);
  } catch {
    return Promise.resolve(null);
  }
}

export function clearActiveSession(): Promise<void> {
  ls()?.removeItem(SESSION_KEY);
  return Promise.resolve();
}
