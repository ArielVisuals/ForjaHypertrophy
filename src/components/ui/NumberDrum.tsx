import { useRef, useState } from "react";

const SLOT_H = 48;

interface NumberDrumProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
}

export function NumberDrum({
  value, onChange, min = 0, max = 999, step = 1, label, unit,
}: NumberDrumProps) {
  const prec = (() => {
    const s = step.toString();
    const dot = s.indexOf(".");
    return dot === -1 ? 0 : s.length - dot - 1;
  })();

  const snap = (v: number) => {
    const rounded = Math.round(v / step) * step;
    const clamped = Math.min(max, Math.max(min, rounded));
    return parseFloat(clamped.toFixed(prec));
  };

  const [shift, setShift] = useState(0);
  const drag = useRef<{ startY: number; startVal: number } | null>(null);
  const hold = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDragging = useRef(false);

  const stepBy = (dir: 1 | -1) => onChange(snap(value + dir * step));

  const startHold = (e: React.PointerEvent, dir: 1 | -1) => {
    e.stopPropagation();
    stepBy(dir);
    hold.current = setInterval(() => stepBy(dir), 90);
  };
  const stopHold = () => {
    if (hold.current) { clearInterval(hold.current); hold.current = null; }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = false;
    drag.current = { startY: e.clientY, startVal: value };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    isDragging.current = true;
    // drag UP (dy < 0) → higher value
    const up = drag.current.startY - e.clientY;
    const slotsMoved = Math.round(up / SLOT_H);
    const newVal = snap(drag.current.startVal + slotsMoved * step);
    if (newVal !== value) onChange(newVal);
    // fractional visual shift within the current slot
    setShift(-(up % SLOT_H));
  };

  const onPointerUp = () => {
    drag.current = null;
    isDragging.current = false;
    setShift(0);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    stepBy(e.deltaY > 0 ? -1 : 1);
  };

  const curStep = Math.round((value - min) / step);
  const maxStep = Math.round((max - min) / step);
  const slots = [-2, -1, 0, 1, 2].map(off => {
    const idx = curStep + off;
    return {
      off,
      v: idx >= 0 && idx <= maxStep ? parseFloat((min + idx * step).toFixed(prec)) : null,
    };
  });

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {label && (
        <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.2em]">{label}</p>
      )}
      <div
        className="relative w-full touch-none rounded-[1.25rem] overflow-hidden bg-[#0D0D0F] border border-white/[0.06] cursor-ns-resize"
        style={{ height: SLOT_H * 5 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {/* Fade top / bottom */}
        <div
          className="absolute inset-x-0 top-0 z-10 pointer-events-none"
          style={{ height: SLOT_H * 2, background: "linear-gradient(to bottom, #0D0D0F 30%, transparent)" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{ height: SLOT_H * 2, background: "linear-gradient(to top, #0D0D0F 30%, transparent)" }}
        />

        {/* Center selection ring */}
        <div
          className="absolute inset-x-4 border-y border-white/[0.07] pointer-events-none z-0"
          style={{ top: SLOT_H * 2, height: SLOT_H }}
        />

        {/* Scrolling values */}
        <div
          className="flex flex-col items-center absolute inset-x-0"
          style={{
            transform: `translateY(${shift}px)`,
            transition: drag.current ? "none" : "transform 0.14s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {slots.map(({ off, v }) => {
            const dist = Math.abs(off);
            return (
              <div key={off} className="flex items-center justify-center gap-1.5" style={{ height: SLOT_H }}>
                {v !== null && (
                  <>
                    <span
                      className="font-black tabular-nums text-white leading-none"
                      style={{
                        fontSize: dist === 0 ? 36 : dist === 1 ? 20 : 13,
                        opacity: dist === 0 ? 1 : dist === 1 ? 0.26 : 0.1,
                        letterSpacing: dist === 0 ? "-0.02em" : "0",
                      }}
                    >
                      {v.toFixed(prec)}
                    </span>
                    {off === 0 && unit && (
                      <span className="text-[9px] font-black text-blue-400/50 uppercase tracking-widest">{unit}</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* + / − */}
        <button
          className="absolute top-2 right-2.5 z-20 w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.05] flex items-center justify-center text-white/25 hover:text-white/70 hover:bg-white/[0.08] transition-all active:scale-90 font-black text-sm select-none"
          onPointerDown={e => startHold(e, 1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
        >+</button>
        <button
          className="absolute bottom-2 right-2.5 z-20 w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.05] flex items-center justify-center text-white/25 hover:text-white/70 hover:bg-white/[0.08] transition-all active:scale-90 font-black text-sm select-none leading-none"
          onPointerDown={e => startHold(e, -1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
        >−</button>
      </div>
    </div>
  );
}
