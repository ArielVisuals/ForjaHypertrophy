/**
 * Badge - Componente para etiquetas y estados
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all";

  const variantStyles = {
    default: "bg-[--color-bg-tertiary] text-[--color-text-secondary] border border-[--color-border]",
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20",
    outline: "bg-transparent text-[--color-text-secondary] border border-[--color-border]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
