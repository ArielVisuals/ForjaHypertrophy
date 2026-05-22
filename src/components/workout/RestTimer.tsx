import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RestTimerProps {
  duration: number;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function RestTimer({ duration, onComplete, onSkip }: RestTimerProps) {
  const [totalDuration, setTotalDuration] = useState(duration);
  const [timeLeft, setTimeLeft]           = useState(duration);
  const [isRunning, setIsRunning]         = useState(true);
  const intervalRef = useRef<number | null>(null);

  const R = 54;
  const circumference = 2 * Math.PI * R;
  const progress = timeLeft / totalDuration;
  const dashOffset = circumference * (1 - progress);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, onComplete]);

  const adjustTime = (delta: number) => {
    const next = Math.max(5, timeLeft + delta);
    setTimeLeft(next);
    setTotalDuration(prev => Math.max(5, prev + delta));
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const ringColor = timeLeft <= 10 ? "#f97316" : timeLeft <= 30 ? "#3b82f6" : "#3b82f6";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4"
      >
        <div className="p-6 rounded-[2.5rem] bg-[#0A0A0B]/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/60">

          {/* Label */}
          <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.35em] text-center mb-5">DESCANSO</p>

          {/* SVG circle + number */}
          <div className="flex justify-center mb-5">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
                {/* Track */}
                <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                {/* Progress */}
                <motion.circle
                  cx="64" cy="64" r={R}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ filter: `drop-shadow(0 0 8px ${ringColor}80)` }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </svg>
              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black tabular-nums transition-colors ${timeLeft <= 10 ? "text-orange-400" : "text-white"}`}>
                  {fmt(timeLeft)}
                </span>
                {!isRunning && timeLeft > 0 && (
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-0.5">PAUSA</span>
                )}
                {timeLeft === 0 && (
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">LISTO</span>
                )}
              </div>
            </div>
          </div>

          {/* Adjust time */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <button
              onClick={() => adjustTime(-30)}
              className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 text-white/40 font-black text-sm hover:text-white hover:border-white/20 transition-all"
            >
              −30
            </button>
            <span className="text-[8px] font-black text-white/15 uppercase tracking-widest">AJUSTAR</span>
            <button
              onClick={() => adjustTime(30)}
              className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 text-white/40 font-black text-sm hover:text-white hover:border-white/20 transition-all"
            >
              +30
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsRunning(r => !r)}
              className="flex-1 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white/50 font-black text-[10px] uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
            >
              {isRunning ? "Pausar" : "Reanudar"}
            </button>
            <button
              onClick={onSkip}
              className="flex-1 py-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
            >
              Saltar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
