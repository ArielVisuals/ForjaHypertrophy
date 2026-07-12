import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Session {
  id: string;
  startedAt: string;
  totalVolume: number;
  name: string;
}

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const WEEKS = 16;

function toLocalDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - ((day + 6) % 7);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function ActivityHeatmap() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const load = () => {
    setError(false);
    setLoading(true);
    fetch("/api/workouts?action=history")
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((data: Session[]) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Build date → {volume, name[]} map
  const dateMap = new Map<string, { volume: number; names: string[] }>();
  for (const s of sessions) {
    const key = toLocalDateStr(new Date(s.startedAt));
    const prev = dateMap.get(key);
    if (prev) {
      prev.volume += s.totalVolume ?? 0;
      prev.names.push(s.name);
    } else {
      dateMap.set(key, { volume: s.totalVolume ?? 0, names: [s.name] });
    }
  }

  // Build grid: WEEKS columns, each column = Mon-Sun
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toLocalDateStr(today);

  const currentMonday = getMonday(new Date());
  const startMonday = new Date(currentMonday);
  startMonday.setDate(startMonday.getDate() - (WEEKS - 1) * 7);

  // Compute max volume for intensity scaling
  let maxVol = 0;
  for (const v of dateMap.values()) maxVol = Math.max(maxVol, v.volume);

  // Build weeks array
  const weeks: { date: Date; str: string }[][] = [];
  const monthLabels: { label: string; colIndex: number }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < WEEKS; w++) {
    const week: { date: Date; str: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startMonday);
      date.setDate(startMonday.getDate() + w * 7 + d);
      week.push({ date, str: toLocalDateStr(date) });
    }
    weeks.push(week);

    const monthOfWeek = week[0].date.getMonth();
    if (monthOfWeek !== lastMonth) {
      monthLabels.push({
        label: week[0].date.toLocaleDateString("es-ES", { month: "short" }).toUpperCase(),
        colIndex: w,
      });
      lastMonth = monthOfWeek;
    }
  }

  const intensityClass = (vol: number) => {
    if (maxVol === 0) return "bg-blue-600/60";
    const ratio = vol / maxVol;
    if (ratio > 0.8) return "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]";
    if (ratio > 0.5) return "bg-blue-600/80";
    if (ratio > 0.2) return "bg-blue-600/50";
    return "bg-blue-600/25";
  };

  const trainingDays = dateMap.size;
  const thisWeekDays = weeks[WEEKS - 1]?.filter(c => dateMap.has(c.str)).length ?? 0;

  return (
    <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">HISTORIAL DE ACTIVIDAD</p>
          <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest mt-0.5">ÚLTIMAS {WEEKS} SEMANAS</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-lg font-black text-white tabular-nums">{trainingDays}</p>
            <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">DÍAS ACTIVOS</p>
          </div>
          <div className="w-[1px] h-6 bg-white/10" />
          <div>
            <p className="text-lg font-black text-blue-400 tabular-nums">{thisWeekDays}/7</p>
            <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">ESTA SEM</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse bg-white/[0.02] rounded-2xl" />
      ) : error ? (
        <div className="h-24 flex items-center justify-center gap-4">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Error al cargar actividad</p>
          <button
            onClick={load}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black text-white/30 uppercase tracking-widest hover:text-white/60 transition-all"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="relative overflow-x-auto pb-1">
          {/* Month labels row */}
          <div className="flex mb-1.5" style={{ gap: "3px" }}>
            {/* Day label offset */}
            <div className="w-5 shrink-0" />
            <div className="flex flex-1" style={{ gap: "3px" }}>
              {weeks.map((_, wi) => {
                const ml = monthLabels.find(m => m.colIndex === wi);
                return (
                  <div key={wi} className="flex-1 min-w-[10px]">
                    {ml && (
                      <span className="text-[7px] font-black text-white/15 uppercase tracking-widest whitespace-nowrap">{ml.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid: 7 rows (days) × WEEKS columns */}
          <div className="flex" style={{ gap: "0px" }}>
            {/* Day labels */}
            <div className="flex flex-col justify-between w-5 shrink-0 pr-1.5" style={{ gap: "3px" }}>
              {DAY_LABELS.map(d => (
                <div key={d} className="text-[7px] font-black text-white/15 uppercase tracking-widest" style={{ lineHeight: "10px", height: "10px" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex flex-1" style={{ gap: "3px" }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col flex-1" style={{ gap: "3px" }}>
                  {week.map(({ date, str }, di) => {
                    const isFuture = date > today;
                    const isToday  = str === todayStr;
                    const data     = dateMap.get(str);
                    const trained  = !!data && !isFuture;

                    return (
                      <motion.div
                        key={di}
                        style={{ height: "10px", minWidth: "10px" }}
                        className={`rounded-[2px] cursor-default transition-all ${
                          isFuture
                            ? "bg-white/[0.02]"
                            : trained
                            ? intensityClass(data!.volume)
                            : isToday
                            ? "bg-white/10 ring-1 ring-white/20"
                            : "bg-white/[0.04]"
                        } ${isToday && !trained ? "ring-1 ring-white/20" : ""}`}
                        onMouseEnter={e => {
                          if (isFuture) return;
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          const dateLabel = date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
                          setTooltip({
                            text: trained
                              ? `${dateLabel}: ${data!.names[0]}${data!.names.length > 1 ? ` +${data!.names.length - 1}` : ""}`
                              : `${dateLabel}: Sin entrenar`,
                            x: rect.left,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="fixed z-50 px-3 py-1.5 rounded-lg bg-[#1a1a1b] border border-white/15 text-[9px] font-black text-white uppercase tracking-widest pointer-events-none shadow-xl"
              style={{ top: tooltip.y - 36, left: tooltip.x, transform: "translateX(-50%)" }}
            >
              {tooltip.text}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2">
        <span className="text-[7px] font-black text-white/15 uppercase tracking-widest">MENOS</span>
        {["bg-white/[0.04]", "bg-blue-600/25", "bg-blue-600/50", "bg-blue-600/80", "bg-blue-500"].map((cls, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${cls}`} />
        ))}
        <span className="text-[7px] font-black text-white/15 uppercase tracking-widest">MÁS</span>
      </div>
    </div>
  );
}
