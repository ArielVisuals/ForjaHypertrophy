import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DayData {
  date: string;
  kcal: number;
  prot: number;
  carbs: number;
  fats: number;
}

interface NutritionWeeklyChartProps {
  userId: string;
  targetKcal?: number;
  targetProt?: number;
}

const DAY_ABBR = ["D", "L", "M", "X", "J", "V", "S"];

export function NutritionWeeklyChart({ userId, targetKcal = 2800, targetProt = 200 }: NutritionWeeklyChartProps) {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kcal" | "prot">("kcal");

  useEffect(() => {
    fetch(`/api/nutrition?action=weekly&userId=${userId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDays(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="h-32 animate-pulse bg-white/[0.02] rounded-2xl" />;
  if (days.length === 0) return null;

  const target = view === "kcal" ? targetKcal : targetProt;
  const maxVal = Math.max(target * 1.2, ...days.map(d => view === "kcal" ? d.kcal : d.prot));

  const totalKcal  = days.reduce((a, d) => a + d.kcal, 0);
  const avgKcal    = Math.round(totalKcal / 7);
  const totalProt  = days.reduce((a, d) => a + d.prot, 0);
  const avgProt    = Math.round(totalProt / 7);
  const daysLogged = days.filter(d => d.kcal > 0).length;

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();

  return (
    <div className="space-y-5">

      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">SEMANA NUTRICIONAL</p>
          <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest mt-0.5">{daysLogged}/7 DÍAS REGISTRADOS</p>
        </div>
        <div className="flex gap-1 p-0.5 bg-white/5 rounded-xl">
          <button
            onClick={() => setView("kcal")}
            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${view === "kcal" ? "bg-blue-600 text-white" : "text-white/30 hover:text-white"}`}
          >KCAL</button>
          <button
            onClick={() => setView("prot")}
            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${view === "prot" ? "bg-emerald-600 text-white" : "text-white/30 hover:text-white"}`}
          >PROT</button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center">
          <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">PROMEDIO/DÍA</p>
          <p className="text-lg font-black text-white tabular-nums">
            {view === "kcal" ? avgKcal : avgProt}
            <span className="text-[9px] text-white/20 ml-0.5">{view === "kcal" ? "KCAL" : "G"}</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center">
          <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">META/DÍA</p>
          <p className="text-lg font-black text-white/40 tabular-nums">
            {target}
            <span className="text-[9px] text-white/15 ml-0.5">{view === "kcal" ? "KCAL" : "G"}</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center">
          <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">ADHERENCIA</p>
          <p className={`text-lg font-black tabular-nums ${daysLogged >= 5 ? "text-emerald-400" : daysLogged >= 3 ? "text-blue-400" : "text-white/40"}`}>
            {Math.round((daysLogged / 7) * 100)}%
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-28">
        {days.map((day, i) => {
          const val     = view === "kcal" ? day.kcal : day.prot;
          const pct     = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const atTarget = val >= target * 0.9;
          const isToday  = day.date === todayStr;
          const dayLabel = DAY_ABBR[new Date(day.date + "T12:00:00").getDay()];

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                {val > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full rounded-t-lg ${
                      isToday
                        ? view === "kcal" ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        : atTarget
                        ? view === "kcal" ? "bg-blue-600/60" : "bg-emerald-600/60"
                        : "bg-white/10"
                    }`}
                  />
                )}
                {val === 0 && (
                  <div className="w-full h-1 rounded-full bg-white/[0.05]" />
                )}
              </div>

              {/* Target line marker */}
              <div className="w-full relative" style={{ height: "1px" }}>
                <div className="absolute inset-0 border-t border-dashed border-white/[0.08]" />
              </div>

              <span className={`text-[8px] font-black uppercase tracking-wider ${isToday ? "text-white" : "text-white/20"}`}>
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Target line note */}
      <p className="text-[7px] font-bold text-white/15 uppercase tracking-widest text-center">
        META DIARIA: {target} {view === "kcal" ? "KCAL" : "G PROTEÍNA"}
      </p>
    </div>
  );
}
