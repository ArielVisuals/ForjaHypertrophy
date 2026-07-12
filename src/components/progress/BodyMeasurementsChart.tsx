import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion } from "framer-motion";

interface Measurement {
  measuredAt: string;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  armLeftCm: number | null;
  armRightCm: number | null;
  chestCm: number | null;
  waistCm: number | null;
  thighLeftCm: number | null;
}

type Metric = "weight" | "bodyfat" | "arms" | "chest" | "waist" | "legs";

const METRICS: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: "weight",  label: "PESO",    unit: "kg",  color: "#3b82f6" },
  { key: "bodyfat", label: "GRASA",   unit: "%",   color: "#f97316" },
  { key: "arms",    label: "BRAZOS",  unit: "cm",  color: "#10b981" },
  { key: "chest",   label: "PECHO",   unit: "cm",  color: "#8b5cf6" },
  { key: "waist",   label: "CINTURA", unit: "cm",  color: "#f43f5e" },
  { key: "legs",    label: "PIERNAS", unit: "cm",  color: "#06b6d4" },
];

function getValue(m: Measurement, key: Metric): number | null {
  switch (key) {
    case "weight":  return m.weightKg ? Number(m.weightKg) : null;
    case "bodyfat": return m.bodyFatPercentage ? Number(m.bodyFatPercentage) : null;
    case "arms":    return m.armLeftCm && m.armRightCm
                      ? Math.round((Number(m.armLeftCm) + Number(m.armRightCm)) / 2 * 10) / 10
                      : null;
    case "chest":   return m.chestCm ? Number(m.chestCm) : null;
    case "waist":   return m.waistCm ? Number(m.waistCm) : null;
    case "legs":    return m.thighLeftCm ? Number(m.thighLeftCm) : null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

interface Props { initialData?: Measurement[] }

export function BodyMeasurementsChart({ initialData = [] }: Props) {
  const [data, setData] = useState<Measurement[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const [activeMetric, setActiveMetric] = useState<Metric>("weight");

  useEffect(() => {
    if (initialData.length > 0) return;
    fetch("/api/progress")
      .then(r => r.json())
      .then(res => setData(res.measurements ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const metric = METRICS.find(m => m.key === activeMetric)!;

  const chartData = [...data]
    .reverse()
    .map(m => ({ date: formatDate(m.measuredAt), value: getValue(m, activeMetric) }))
    .filter(d => d.value !== null);

  const current = chartData.at(-1)?.value ?? null;
  const first   = chartData.at(0)?.value ?? null;
  const delta   = current !== null && first !== null ? Math.round((current - first) * 10) / 10 : null;

  if (loading) {
    return (
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 animate-pulse">
        <div className="h-4 w-48 bg-white/5 rounded mb-8" />
        <div className="h-52 bg-white/[0.03] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">EVOLUCIÓN CORPORAL</p>
          <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest mt-0.5">{data.length} MEDICIONES REGISTRADAS</p>
        </div>
        {current !== null && (
          <div className="text-right">
            <p className="text-2xl font-black text-white tabular-nums">
              {current}{metric.unit}
            </p>
            {delta !== null && (
              <p className={`text-[8px] font-black uppercase tracking-widest ${
                activeMetric === "waist" || activeMetric === "bodyfat"
                  ? (delta < 0 ? "text-emerald-400" : "text-orange-400")
                  : (delta > 0 ? "text-emerald-400" : "text-orange-400")
              }`}>
                {delta > 0 ? "+" : ""}{delta}{metric.unit} TOTAL
              </p>
            )}
          </div>
        )}
      </div>

      {/* Metric selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border ${
              activeMetric === m.key
                ? "border-transparent text-black"
                : "bg-transparent border-white/10 text-white/30 hover:text-white hover:border-white/20"
            }`}
            style={activeMetric === m.key ? { backgroundColor: m.color } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length < 2 ? (
        <div className="h-52 flex items-center justify-center">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
            Necesitas al menos 2 mediciones para ver la evolución
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="h-52"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 900, fontFamily: "inherit" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 900, fontFamily: "inherit" }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={v => `${v}${metric.unit}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "1rem",
                  padding: "8px 14px",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}
                itemStyle={{ color: metric.color, fontSize: 14, fontWeight: 900 }}
                formatter={(v: number) => [`${v}${metric.unit}`, metric.label]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={metric.color}
                strokeWidth={2}
                dot={{ fill: metric.color, strokeWidth: 0, r: 3 }}
                activeDot={{ fill: metric.color, r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
