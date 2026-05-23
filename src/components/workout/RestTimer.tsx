import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";

interface RestTimerProps {
  duration: number;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function RestTimer({ duration, onComplete, onSkip }: RestTimerProps) {
  const [totalDuration, setTotalDuration] = useState(duration);
  const [timeLeft, setTimeLeft]           = useState(duration);
  const [isRunning, setIsRunning]         = useState(true);
  const intervalRef  = useRef<number | null>(null);
  // Stable refs so interval never restarts when parent re-renders
  const onCompleteRef = useRef(onComplete);
  const onSkipRef     = useRef(onSkip);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onSkipRef.current     = onSkip;     }, [onSkip]);

  const R = 72;
  const circumference = 2 * Math.PI * R;
  const progress    = timeLeft / totalDuration;
  const dashOffset  = circumference * (1 - progress);
  const isUrgent    = timeLeft <= 10;
  const ringColor   = isUrgent ? "#f97316" : "#3b82f6";

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]); // ← solo isRunning; onComplete via ref

  const adjustTime = useCallback((delta: number) => {
    setTimeLeft(prev => Math.max(5, prev + delta));
    setTotalDuration(prev => Math.max(5, prev + delta));
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const overlay = (
    <motion.div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      {/* Card — absolute centering so width never depends on a flex parent */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28, delay: 0.05 }}
        style={{ width: "min(384px, calc(100vw - 2rem))" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="w-full p-8 rounded-[2.5rem] bg-[#0D0D0F] border border-white/10 shadow-2xl shadow-black/80 flex flex-col items-center gap-6">

          <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.4em]">DESCANSO</p>

          {/* Ring + time */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
              <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
              <motion.circle
                cx="90" cy="90" r={R}
                fill="none"
                stroke={ringColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ filter: `drop-shadow(0 0 12px ${ringColor}99)` }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className={`text-6xl font-black tabular-nums leading-none transition-colors duration-300 ${isUrgent ? "text-orange-400" : "text-white"}`}>
                {fmt(timeLeft)}
              </span>
              {!isRunning && timeLeft > 0 && (
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">PAUSA</span>
              )}
              {timeLeft === 0 && (
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">LISTO</span>
              )}
            </div>
          </div>

          {/* Adjust */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => adjustTime(-30)}
              className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 text-white/40 font-black text-sm hover:text-white hover:border-white/20 transition-all"
            >
              −30
            </button>
            <span className="text-[8px] font-black text-white/15 uppercase tracking-widest">AJUSTAR</span>
            <button
              onClick={() => adjustTime(30)}
              className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 text-white/40 font-black text-sm hover:text-white hover:border-white/20 transition-all"
            >
              +30
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setIsRunning(r => !r)}
              className="flex-1 py-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white/50 font-black text-[10px] uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
            >
              {isRunning ? "PAUSAR" : "REANUDAR"}
            </button>
            <button
              onClick={() => onSkipRef.current?.()}
              className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-all active:scale-95"
            >
              SALTAR
            </button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(overlay, document.body);
}
