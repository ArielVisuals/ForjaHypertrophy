/**
 * ShimmerButton - Botón con efecto shimmer (Magic UI)
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function ShimmerButton({
  children,
  className,
  shimmerColor = "#ffffff",
  shimmerSize = "0.1em",
  borderRadius = "0.75rem",
  background = "linear-gradient(to right, #3b82f6, #8b5cf6)",
  shimmerDuration = "2s",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  background?: string;
  shimmerDuration?: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={
        {
          "--shimmer-color": shimmerColor,
          "--shimmer-size": shimmerSize,
          "--border-radius": borderRadius,
          background,
          "--shimmer-duration": shimmerDuration,
        } as React.CSSProperties
      }
      className={cn(
        "group relative overflow-hidden rounded-[--border-radius] px-6 py-3 font-semibold text-white transition-all duration-300",
        "shadow-[0_0_0_2px_rgba(255,255,255,0.1)_inset,0_0_20px_rgba(59,130,246,0.3)]",
        "hover:shadow-[0_0_0_2px_rgba(255,255,255,0.2)_inset,0_0_30px_rgba(59,130,246,0.5)]",
        className
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 -top-[20px] flex h-[calc(100%+40px)] w-full justify-center blur-[12px]">
        <div className="relative h-full w-8 bg-white/30"></div>
      </div>
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>

      {/* Shimmer effect */}
      <div
        className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-13deg)_translateX(100%)]"
        style={{
          transition: `transform ${shimmerDuration} cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <div className="relative h-full w-10 bg-white/20"></div>
      </div>
    </motion.button>
  );
}
