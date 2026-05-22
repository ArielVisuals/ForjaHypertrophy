/**
 * Componente de estadísticas dinámicas del dashboard (Rediseño Minimalista Premium)
 */

import { useState } from "react";
import NumberTicker from "../ui/NumberTicker";

interface DashboardStatsProps {
  userId: string;
  initialStats: {
    currentStreak: number;
    totalWorkouts: number;
    workoutsThisMonth: number;
  };
}

export function DashboardStats({ initialStats }: DashboardStatsProps) {
  const [stats] = useState(initialStats);

  const statCards = [
    {
      id: "01",
      label: "RACHA ACTUAL",
      value: stats.currentStreak,
      suffix: "DÍAS",
      description: "CONSISTENCIA EN EL ENTRENAMIENTO PARA RESULTADOS ÓPTIMOS",
      color: "from-orange-500/20"
    },
    {
      id: "02",
      label: "ADHERENCIA",
      value: Math.min(100, Math.round((stats.workoutsThisMonth / 16) * 100)),
      suffix: "%",
      description: "CUMPLIMIENTO DEL PLAN MENSUAL DE HIPERTROFIA",
      color: "from-emerald-500/20"
    },
    {
      id: "03",
      label: "WORKOUTS",
      value: stats.totalWorkouts,
      suffix: "TOTAL",
      description: "VOLUMEN DE ENTRENAMIENTO ACUMULADO EN TU FORJA",
      color: "from-blue-500/20"
    },
    {
      id: "04",
      label: "SESIONES MES",
      value: stats.workoutsThisMonth,
      suffix: "LOG",
      description: "ENTRENAMIENTOS REGISTRADOS EN EL CICLO ACTUAL",
      color: "from-purple-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {statCards.map((card) => (
        <div 
          key={card.id}
          className="group relative aspect-[4/3] md:aspect-auto md:min-h-[240px] lg:aspect-square rounded-[2rem] md:rounded-[3rem] bg-[#0A0A0B] border border-white/10 overflow-hidden flex flex-col p-6 md:p-8 transition-all duration-500 hover:scale-[1.02] hover:border-white/20"
        >
          {/* Subtle Grain Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
          
          {/* Subtle Glow */}
          <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${card.color} to-transparent blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>

          {/* ID (Top) */}
          <div className="text-[10px] font-bold text-white/30 tracking-[0.2em] mb-auto">
            ({card.id})
          </div>

          {/* Main Content (Center) */}
          <div className="flex-grow flex flex-col items-center justify-center text-center space-y-2">
            <h3 className="text-xs font-black text-white/40 tracking-[0.3em] uppercase">
              {card.label}
            </h3>
            <div className="flex items-baseline gap-2">
              <NumberTicker
                value={card.value}
                className="text-6xl md:text-7xl font-black text-white tracking-tighter"
              />
              <span className="text-xs font-bold text-white/20 tracking-widest">{card.suffix}</span>
            </div>
          </div>

          {/* Description (Bottom) */}
          <div className="mt-auto">
            <p className="text-[9px] font-bold text-white/30 leading-relaxed tracking-wider uppercase text-center max-w-[200px] mx-auto">
              {card.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
