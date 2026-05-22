import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { MUSCLE_GROUP_LABELS } from "@/lib/constants/programs";

interface TimelinePoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  estimated1RM: number;
  totalSets: number;
}

interface ExerciseHistoryDrawerProps {
  userId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  historicalMax?: number;
  estimatedOneRM?: number;
  onClose: () => void;
}

function fmt(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function ExerciseHistoryDrawer({
  userId,
  exerciseId,
  exerciseName,
  muscleGroup,
  historicalMax,
  estimatedOneRM,
  onClose,
}: ExerciseHistoryDrawerProps) {
  const [data, setData] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"1rm" | "vol">("1rm");

  useEffect(() => {
    fetch(`/api/exercises?action=timeline&exerciseId=${exerciseId}&userId=${userId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [exerciseId, userId]);

  const chartData = data.map(p => ({
    date:  fmt(p.date),
    "1RM": p.estimated1RM,
    "VOL": Math.round(p.totalVolume / 1000 * 10) / 10,
  }));

  const metric     = view === "1rm" ? "1RM" : "VOL";
  const unit       = view === "1rm" ? "KG" : "T";
  const chartColor = "#3b82f6";

  const trend = data.length >= 2
    ? data[data.length - 1].estimated1RM - data[0].estimated1RM
    : null;

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, maxHeight: "85vh", overflowY: "auto" }}
      >
        <div className="bg-[#0A0A0B] border-t border-white/10 rounded-t-[2.5rem] p-6 sm:p-8 space-y-6">

          {/* Handle */}
          <div className="flex justify-center -mt-2 mb-2">
            <div className="w-10 h-1 rounded-full bg-white/10" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">
                {MUSCLE_GROUP_LABELS[muscleGroup] ?? muscleGroup}
              </p>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{exerciseName}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/20 transition-all"
            >
              ✕
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">RÉCORD</p>
              <p className="text-lg font-black text-white tabular-nums">
                {historicalMax ?? "--"}<span className="text-[9px] text-white/20 ml-0.5">KG</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-blue-500/15 text-center">
              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">1RM EST.</p>
              <p className="text-lg font-black text-blue-400 tabular-nums">
                {estimatedOneRM ?? "--"}<span className="text-[9px] text-blue-400/50 ml-0.5">KG</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">SESIONES</p>
              <p className="text-lg font-black text-white tabular-nums">{data.length}</p>
            </div>
          </div>

          {/* Chart */}
          {loading ? (
            <div className="h-40 animate-pulse bg-white/[0.02] rounded-2xl" />
          ) : data.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Sin historial registrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* View toggle */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1 p-0.5 bg-white/5 rounded-xl">
                  <button
                    onClick={() => setView("1rm")}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${view === "1rm" ? "bg-blue-600 text-white" : "text-white/30 hover:text-white"}`}
                  >1RM Est.</button>
                  <button
                    onClick={() => setView("vol")}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${view === "vol" ? "bg-blue-600 text-white" : "text-white/30 hover:text-white"}`}
                  >Volumen</button>
                </div>
                {trend !== null && (
                  <span className={`text-[9px] font-black uppercase tracking-widest ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {trend >= 0 ? "+" : ""}{trend} KG TOTAL
                  </span>
                )}
              </div>

              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="exGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 8, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v}${unit}`}
                  />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "8px 12px" }}
                    labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}
                    itemStyle={{ color: "#3b82f6", fontSize: 10, fontWeight: 900 }}
                    formatter={(v: any) => [`${v} ${unit}`, metric]}
                  />
                  <Area
                    type="monotone"
                    dataKey={metric}
                    stroke={chartColor}
                    strokeWidth={2}
                    fill="url(#exGrad)"
                    dot={{ fill: chartColor, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: chartColor }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent sessions table */}
          {data.length > 0 && (
            <div className="space-y-2">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.35em]">ÚLTIMAS SESIONES</p>
              <div className="space-y-1">
                {[...data].reverse().slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-tight">{fmt(p.date)}</p>
                      <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{p.totalSets} SETS</p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[10px] font-black text-white tabular-nums">{p.maxWeight} KG</p>
                        <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">TOP SET</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400 tabular-nums">{p.estimated1RM} KG</p>
                        <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">1RM EST.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
