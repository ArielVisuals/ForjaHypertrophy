/**
 * Componente de gráficas de progreso (Rediseño Premium FORJA)
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

interface ProgressChartsProps {
  measurements: any[];
}

export function ProgressCharts({ measurements }: ProgressChartsProps) {
  if (!measurements || measurements.length === 0) return null;

  const chartData = [...measurements]
    .reverse()
    .map((m) => ({
      date: new Date(m.measuredAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      peso: Number(m.weightKg),
      grasa: m.bodyFatPercentage ? Number(m.bodyFatPercentage) : null,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A0A0B] border border-white/20 backdrop-blur-3xl rounded-2xl p-4 shadow-2xl">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8 mb-1">
              <span className="text-xs font-bold text-white uppercase tracking-tight">{entry.name}:</span>
              <span style={{ color: entry.color }} className="text-sm font-black tracking-tighter">
                {entry.value} {entry.dataKey === 'peso' ? 'KG' : '%'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 relative overflow-hidden">
      <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-10">Historial de Composición</h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 10, fontWeight: 800 }} 
            dy={10}
          />
          <YAxis 
            yAxisId="left" 
            hide 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 2 }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="peso"
            name="Peso"
            stroke="#3b82f6"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorPeso)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
