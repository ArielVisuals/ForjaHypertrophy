/**
 * Stat - Componente para mostrar métricas y estadísticas
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  footer?: ReactNode;
  gradient?: "indigo" | "emerald" | "orange" | "blue" | "purple";
  className?: string;
}

export function Stat({
  label,
  value,
  icon,
  trend,
  footer,
  gradient = "indigo",
  className,
}: StatProps) {
  const gradientStyles = {
    indigo: "from-indigo-500/20 to-purple-500/20",
    emerald: "from-emerald-500/20 to-teal-500/20",
    orange: "from-orange-500/20 to-red-500/20",
    blue: "from-blue-500/20 to-cyan-500/20",
    purple: "from-purple-500/20 to-pink-500/20",
  };

  const trendColors = {
    up: "text-emerald-400",
    down: "text-red-400",
    neutral: "text-[--color-text-secondary]",
  };

  return (
    <div className={cn("card-elevated p-6 space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-[--color-text-secondary]">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            {value}
          </div>
        </div>
        {icon && (
          <div
            className={cn(
              "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
              gradientStyles[gradient]
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {(trend || footer) && (
        <div className="pt-4 border-t border-[--color-border]">
          {trend && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[--color-text-tertiary]">Cambio</span>
              <span
                className={cn("font-semibold", trendColors[trend.direction])}
              >
                {trend.direction === "up" && "+"}
                {trend.value}
              </span>
            </div>
          )}
          {footer && !trend && footer}
        </div>
      )}
    </div>
  );
}
