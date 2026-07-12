const QUEUE_KEY = "forja_offline_queue_v2";
const IDMAP_KEY  = "forja_offline_idmap_v2";

export type OpType = "create-session" | "add-set" | "complete-session";

interface Op {
  id: string;
  type: OpType;
  payload: Record<string, unknown>;
  tempSessionId?: string;
  createdAt: number;
}

function ls(): Storage | null {
  return typeof localStorage !== "undefined" ? localStorage : null;
}

function loadQueue(): Op[] {
  try {
    const raw = ls()?.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveQueue(ops: Op[]): void {
  try { ls()?.setItem(QUEUE_KEY, JSON.stringify(ops)); } catch {}
}

// Persistent OFFLINE_ → real ID map. Survives page reloads so complete-session
// can resolve its real session ID even if create-session was synced in a prior run.
function loadIdMap(): Map<string, string> {
  try {
    const raw = ls()?.getItem(IDMAP_KEY);
    return raw ? new Map(JSON.parse(raw)) : new Map();
  } catch { return new Map(); }
}

function saveIdMap(map: Map<string, string>): void {
  try { ls()?.setItem(IDMAP_KEY, JSON.stringify([...map])); } catch {}
}

export function enqueue(
  type: OpType,
  payload: Record<string, unknown>,
  tempSessionId?: string
): Promise<void> {
  const ops = loadQueue();
  ops.push({ id: crypto.randomUUID(), type, payload, tempSessionId, createdAt: Date.now() });
  saveQueue(ops);
  return Promise.resolve();
}

export function removeByTempSession(tempSessionId: string): Promise<void> {
  saveQueue(loadQueue().filter(op => op.tempSessionId !== tempSessionId));
  return Promise.resolve();
}

export function hasPendingOps(): boolean {
  return loadQueue().length > 0;
}

let syncing = false;

export async function syncQueue(): Promise<{ synced: number; failed: number; analysis?: string }> {
  if (syncing) return { synced: 0, failed: 0 };
  syncing = true;
  try {
    const ops = loadQueue();
    if (ops.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failIdx = -1;
    let capturedAnalysis: string | undefined;
    // Start with the persistent map — contains real IDs from previous sync runs
    const idMap = loadIdMap();

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      try {
        if (op.type === "create-session") {
          const res = await fetch("/api/workouts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(op.payload),
          });
          if (!res.ok) throw new Error(`create-session HTTP ${res.status}`);
          const data = await res.json();
          if (op.tempSessionId && data?.id) {
            idMap.set(op.tempSessionId, data.id);
            saveIdMap(idMap); // Persist immediately so later runs can resolve this ID
          }

        } else if (op.type === "add-set") {
          const payload = { ...op.payload };
          if (op.tempSessionId) {
            const realId = idMap.get(op.tempSessionId);
            if (realId) {
              payload.workoutSessionId = realId;
            } else if (String(payload.workoutSessionId).startsWith("OFFLINE_")) {
              failIdx = i;
              break;
            }
          }
          const res = await fetch("/api/workouts/sets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`add-set HTTP ${res.status}`);

        } else if (op.type === "complete-session") {
          const payload = { ...op.payload };
          if (op.tempSessionId) {
            const realId = idMap.get(op.tempSessionId);
            if (realId) {
              payload.sessionId = realId;
            } else if (String(payload.sessionId).startsWith("OFFLINE_")) {
              failIdx = i;
              break;
            }
          }
          const res = await fetch("/api/workouts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`complete-session HTTP ${res.status}`);
          // Capture El Arquitecto analysis from the completion response
          const respData = await res.json().catch(() => ({}));
          if (respData?.analysis) capturedAnalysis = respData.analysis;
        }

        synced++;
      } catch (e) {
        console.error("[FORJA offline] sync error at op", op.type, e);
        failIdx = i;
        break;
      }
    }

    const remaining = failIdx >= 0 ? ops.slice(failIdx) : [];
    saveQueue(remaining);
    // Clean up persistent ID map once queue is fully drained
    if (remaining.length === 0) saveIdMap(new Map());
    return { synced, failed: failIdx >= 0 ? ops.length - failIdx : 0, analysis: capturedAnalysis };
  } finally {
    syncing = false;
  }
}
