import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Measurement {
  id: string;
  measuredAt: string;
  weightKg: number;
  bodyFatPercentage?: number;
  shouldersCm?: number;
  chestCm?: number;
  armLeftCm?: number;
  armRightCm?: number;
  waistCm?: number;
  hipsCm?: number;
  thighLeftCm?: number;
  thighRightCm?: number;
  sleepQuality?: number;
  energyLevel?: number;
  photoUrl?: string | null;
}

interface MeasurementTimelineProps {
  measurements: Measurement[];
}

function delta(current: number | undefined, prev: number | undefined, lowerIsBetter = false) {
  if (current == null || prev == null || Number(current) === 0 || Number(prev) === 0) return null;
  const diff = Number(current) - Number(prev);
  if (Math.abs(diff) < 0.01) return null;
  const positive = lowerIsBetter ? diff < 0 : diff > 0;
  return { value: diff, positive };
}

function DeltaBadge({ d }: { d: { value: number; positive: boolean } | null }) {
  if (!d) return <span className="text-[8px] font-bold text-white/15">—</span>;
  return (
    <span className={`text-[9px] font-black ${d.positive ? "text-emerald-400" : "text-red-400"}`}>
      {d.positive ? "+" : ""}{d.value.toFixed(1)}
    </span>
  );
}

function MetricRow({
  label,
  value,
  unit,
  d,
}: {
  label: string;
  value: number | undefined;
  unit: string;
  d: { value: number; positive: boolean } | null;
}) {
  if (value == null || Number(value) === 0) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[9px] font-black text-white/25 uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-3">
        <DeltaBadge d={d} />
        <span className="text-sm font-black text-white tabular-nums">
          {Number(value).toFixed(1)}<span className="text-white/20 text-[9px] ml-0.5">{unit}</span>
        </span>
      </div>
    </div>
  );
}

export function MeasurementTimeline({ measurements }: MeasurementTimelineProps) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [photoExpanded, setPhotoExpanded] = useState(false);

  if (measurements.length === 0) return null;

  // Sorted oldest → newest for logical forward navigation
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
  );

  const navigate = (next: number) => {
    setDir(next > index ? 1 : -1);
    setIndex(next);
    setPhotoExpanded(false);
  };

  const cur  = sorted[index];
  const prev = sorted[index - 1];
  const base = sorted[0];
  const isBase = index === 0;

  const avgArms = (m: Measurement) => {
    const l = Number(m.armLeftCm ?? 0);
    const r = Number(m.armRightCm ?? 0);
    if (l === 0 && r === 0) return undefined;
    return l > 0 && r > 0 ? (l + r) / 2 : l || r;
  };
  const avgThighs = (m: Measurement) => {
    const l = Number(m.thighLeftCm ?? 0);
    const r = Number(m.thighRightCm ?? 0);
    if (l === 0 && r === 0) return undefined;
    return l > 0 && r > 0 ? (l + r) / 2 : l || r;
  };

  const vTaper = (m: Measurement) =>
    Number(m.shouldersCm ?? 0) > 0 && Number(m.waistCm ?? 0) > 0
      ? (Number(m.shouldersCm) / Number(m.waistCm)).toFixed(2)
      : null;

  const METRICS = [
    {
      label: "PESO",
      value: Number(cur.weightKg),
      unit: "KG",
      d: delta(cur.weightKg, prev?.weightKg),
      db: delta(cur.weightKg, base.weightKg),
    },
    {
      label: "% GRASA",
      value: Number(cur.bodyFatPercentage ?? 0) || undefined,
      unit: "%",
      d: delta(cur.bodyFatPercentage, prev?.bodyFatPercentage, true),
      db: delta(cur.bodyFatPercentage, base.bodyFatPercentage, true),
    },
    {
      label: "HOMBROS",
      value: Number(cur.shouldersCm ?? 0) || undefined,
      unit: "CM",
      d: delta(cur.shouldersCm, prev?.shouldersCm),
      db: delta(cur.shouldersCm, base.shouldersCm),
    },
    {
      label: "PECHO",
      value: Number(cur.chestCm ?? 0) || undefined,
      unit: "CM",
      d: delta(cur.chestCm, prev?.chestCm),
      db: delta(cur.chestCm, base.chestCm),
    },
    {
      label: "BRAZOS (PROM)",
      value: avgArms(cur),
      unit: "CM",
      d: delta(avgArms(cur), avgArms(prev ?? {}  as Measurement)),
      db: delta(avgArms(cur), avgArms(base)),
    },
    {
      label: "CINTURA",
      value: Number(cur.waistCm ?? 0) || undefined,
      unit: "CM",
      d: delta(cur.waistCm, prev?.waistCm, true),
      db: delta(cur.waistCm, base.waistCm, true),
    },
    {
      label: "MUSLOS (PROM)",
      value: avgThighs(cur),
      unit: "CM",
      d: delta(avgThighs(cur), avgThighs(prev ?? {} as Measurement)),
      db: delta(avgThighs(cur), avgThighs(base)),
    },
  ].filter(m => m.value != null && m.value > 0);

  if (METRICS.length === 0) return null;

  return (
    <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">CHECKPOINTS CORPORALES</p>
          <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest mt-0.5">{sorted.length} SESIONES REGISTRADAS</p>
        </div>
        <div className="flex items-center gap-2">
          {!isBase && (
            <span className="text-[8px] font-black text-white/15 uppercase tracking-widest">
              VS BASE: {new Date(base.measuredAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>

      {/* Navigator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(index - 1)}
          disabled={index === 0}
          className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/20 transition-all disabled:opacity-15 disabled:cursor-not-allowed"
        >
          ←
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: dir * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 text-center"
          >
            <p className="text-base font-black text-white uppercase tracking-tighter">
              {new Date(cur.measuredAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
            </p>
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">
              CHECKPOINT {index + 1} / {sorted.length}
              {isBase && " · BASE"}
            </p>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() => navigate(index + 1)}
          disabled={index === sorted.length - 1}
          className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/20 transition-all disabled:opacity-15 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>

      {/* Foto de progreso del checkpoint */}
      <AnimatePresence mode="wait">
        {cur.photoUrl && (
          <motion.div
            key={`photo-${index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              onClick={() => setPhotoExpanded(v => !v)}
              className="w-full rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all relative group"
            >
              <img
                src={cur.photoUrl}
                alt="Foto de progreso"
                className={`w-full object-cover transition-all duration-500 ${photoExpanded ? "max-h-[70vh]" : "max-h-48"}`}
                style={{ objectPosition: "top" }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end justify-end p-3">
                <span className="text-[8px] font-black text-white/0 group-hover:text-white/60 uppercase tracking-widest transition-all">
                  {photoExpanded ? "COMPRIMIR" : "EXPANDIR"}
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Columns: current values + deltas */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`metrics-${index}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-6"
        >
          {/* Left: metrics */}
          <div>
            {METRICS.map(m => (
              <MetricRow
                key={m.label}
                label={m.label}
                value={m.value}
                unit={m.unit}
                d={isBase ? null : m.d}
              />
            ))}
            {vTaper(cur) && (
              <div className="flex items-center justify-between py-2.5 mt-1">
                <span className="text-[9px] font-black text-blue-400/50 uppercase tracking-widest">V-TAPER RATIO</span>
                <span className="text-sm font-black text-blue-400 tabular-nums">{vTaper(cur)}</span>
              </div>
            )}
          </div>

          {/* Right: vs baseline summary (only from checkpoint 2 onward) */}
          {!isBase && (
            <div className="mt-4 sm:mt-0 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-0">
              <p className="text-[7px] font-black text-white/15 uppercase tracking-[0.35em] mb-3">DESDE EL INICIO</p>
              {METRICS.filter(m => m.db !== null).map(m => (
                <div key={m.label} className="flex items-center justify-between py-1.5">
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <DeltaBadge d={m.db ?? null} />
                    <span className="text-[8px] font-black text-white/20">{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dot navigation */}
      {sorted.length > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {sorted.map((m, i) => (
            <button
              key={i}
              onClick={() => navigate(i)}
              className="relative flex items-center justify-center"
            >
              <span className={`rounded-full transition-all ${
                i === index
                  ? "w-4 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/15 hover:bg-white/30"
              }`} />
              {m.photoUrl && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
