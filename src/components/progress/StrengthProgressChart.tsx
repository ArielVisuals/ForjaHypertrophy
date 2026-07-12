import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MUSCLE_GROUP_LABELS } from "@/lib/constants/programs";

interface StrengthPoint {
  date: string;
  oneRM: number;
}

interface ExerciseStrength {
  id: string;
  name: string;
  muscleGroup: string;
  points: StrengthPoint[];
}

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).toUpperCase();
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A0A0B] border border-white/15 rounded-2xl px-4 py-3 shadow-2xl">
      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">{payload[0].payload.date}</p>
      <p className="text-xl font-black text-blue-400 tabular-nums">{payload[0].value} KG</p>
      <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">1RM ESTIMADO</p>
    </div>
  );
};

export function StrengthProgressChart() {
  const [exercises, setExercises] = useState<ExerciseStrength[]>([]);
  const [selected, setSelected]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  const load = () => {
    setError(false);
    setLoading(true);
    fetch("/api/workouts?action=strength")
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((data: ExerciseStrength[]) => {
        const sorted = [...data].sort((a, b) => b.points.length - a.points.length);
        setExercises(sorted);
        if (sorted.length > 0) setSelected(sorted[0].id);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const exercise = exercises.find(e => e.id === selected);

  const chartData = exercise
    ? exercise.points.map(p => ({ date: formatChartDate(p.date), oneRM: p.oneRM }))
    : [];

  const maxRM  = exercise ? Math.max(...exercise.points.map(p => p.oneRM)) : 0;
  const firstRM = exercise?.points[0]?.oneRM ?? 0;
  const lastRM  = exercise?.points[exercise.points.length - 1]?.oneRM ?? 0;
  const delta   = lastRM - firstRM;

  if (loading) {
    return (
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 animate-pulse">
        <div className="h-4 w-48 bg-white/5 rounded mb-8" />
        <div className="h-48 bg-white/[0.03] rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 flex flex-col items-center justify-center gap-4 min-h-[160px]">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">ERROR AL CARGAR PROGRESIÓN</p>
        <button onClick={load} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-all">Reintentar</button>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="p-10 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 text-center">
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">SIN DATOS DE FUERZA</p>
        <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest mt-2">Completa entrenamientos con peso para ver la progresión</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">PROGRESIÓN DE FUERZA</p>
          <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest mt-0.5">1RM ESTIMADO (FÓRMULA EPLEY)</p>
        </div>

        {/* Exercise selector */}
        <select
          value={selected ?? ""}
          onChange={e => setSelected(e.target.value)}
          className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black text-white uppercase tracking-wider outline-none cursor-pointer max-w-xs"
        >
          {exercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      {exercise && (
        <div className="flex items-center gap-6">
          <div>
            <p className="text-3xl font-black text-white tabular-nums">{lastRM} KG</p>
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-0.5">1RM ACTUAL</p>
          </div>
          <div className="w-[1px] h-10 bg-white/10" />
          <div>
            <p className={`text-xl font-black tabular-nums ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {delta >= 0 ? "+" : ""}{delta} KG
            </p>
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-0.5">PROGRESIÓN</p>
          </div>
          <div className="w-[1px] h-10 bg-white/10" />
          <div>
            <p className="text-xl font-black text-blue-400 tabular-nums">{maxRM} KG</p>
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-0.5">RÉCORD</p>
          </div>
          <div className="ml-auto hidden sm:block">
            <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[8px] font-black text-white/30 uppercase tracking-widest">
              {MUSCLE_GROUP_LABELS[exercise.muscleGroup] ?? exercise.muscleGroup}
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 800 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 800 }}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 2 }} />
            <Line
              type="monotone"
              dataKey="oneRM"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }}
              activeDot={{ fill: "#60a5fa", r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-[9px] font-black text-white/15 uppercase tracking-[0.3em]">
            Necesitas al menos 2 sesiones para ver la gráfica
          </p>
        </div>
      )}

      {/* Exercise chips */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.05]">
        {exercises.map(ex => (
          <button
            key={ex.id}
            onClick={() => setSelected(ex.id)}
            className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
              selected === ex.id
                ? "bg-blue-600 text-white"
                : "bg-white/[0.04] text-white/30 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            {ex.name.split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>
    </div>
  );
}
