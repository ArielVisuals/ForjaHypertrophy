import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface MuscleRecovery {
  muscleGroup: string;
  daysAgo: number | null;
  lastDate: string | null;
  status: "recovering" | "ready" | "fresh";
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: "PECHO", back: "ESPALDA", legs: "PIERNAS",
  shoulders: "HOMBROS", arms: "BRAZOS", core: "CORE",
};

const STATUS_CONFIG = {
  recovering: { label: "RECUPERANDO", color: "text-orange-400", dot: "bg-orange-500", bar: "bg-orange-500/60" },
  ready:      { label: "LISTO",       color: "text-blue-400",   dot: "bg-blue-500",   bar: "bg-blue-500/60"   },
  fresh:      { label: "DESCANSADO",  color: "text-emerald-400",dot: "bg-emerald-500",bar: "bg-emerald-500/60" },
};

export function RecoveryInsightsWidget() {
  const [data, setData] = useState<MuscleRecovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setLoading(true);
    fetch("/api/workouts?action=recovery")
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 animate-pulse">
        <div className="h-3 w-40 bg-white/5 rounded mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/[0.03] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 flex flex-col items-center justify-center gap-4 min-h-[160px]">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">ERROR AL CARGAR RECUPERACIÓN</p>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 flex flex-col items-center justify-center gap-3 min-h-[160px]">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">RECUPERACIÓN MUSCULAR</p>
        <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest text-center max-w-xs">
          Entrena grupos musculares para ver tu estado de recuperación aquí
        </p>
      </div>
    );
  }

  const readyCount = data.filter(d => d.status !== "recovering").length;

  return (
    <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">RECUPERACIÓN MUSCULAR</p>
          <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest mt-0.5">ESTADO POR GRUPO</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white tabular-nums">{readyCount}<span className="text-white/20">/6</span></p>
          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">LISTOS</p>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((muscle, i) => {
          const cfg = STATUS_CONFIG[muscle.status];
          const barWidth = muscle.daysAgo === null ? 100 :
            muscle.status === "recovering" ? Math.max(10, 100 - muscle.daysAgo * 50) :
            muscle.status === "ready" ? 60 : 100;

          return (
            <motion.div
              key={muscle.muscleGroup}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              {/* Dot */}
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />

              {/* Name */}
              <span className="text-[10px] font-black text-white uppercase tracking-tight w-16 shrink-0">
                {MUSCLE_LABELS[muscle.muscleGroup]}
              </span>

              {/* Recovery bar */}
              <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full ${cfg.bar}`}
                />
              </div>

              {/* Status + days */}
              <div className="flex items-center gap-2 shrink-0 w-32 justify-end">
                <span className={`text-[8px] font-black uppercase tracking-widest hidden sm:inline ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-[8px] font-bold text-white/25 tabular-nums">
                  {muscle.daysAgo === null ? "—" :
                   muscle.daysAgo === 0    ? "HOY" :
                   muscle.daysAgo === 1    ? "AYER" :
                   `${muscle.daysAgo}D`}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/[0.05]">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
