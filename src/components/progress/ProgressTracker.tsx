import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NumberTicker from "../ui/NumberTicker";
import { ProgressCharts } from "./ProgressCharts";
import { BodySymmetryMap } from "./BodySymmetryMap";
import { StrengthProgressChart } from "./StrengthProgressChart";
import { WorkoutHistoryPanel } from "./WorkoutHistoryPanel";
import { BodyMeasurementsChart } from "./BodyMeasurementsChart";
import { MeasurementTimeline } from "./MeasurementTimeline";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { NumberDrum } from "@/components/ui/NumberDrum";

type Tab = "lab" | "scan" | "prs" | "history";

interface ProgressTrackerProps {
  userId: string;
}

interface BodyMeasurement {
  id: string;
  measuredAt: string;
  weightKg: number;
  bodyFatPercentage?: number;
  neckCm?: number;
  shouldersCm?: number;
  chestCm?: number;
  armLeftCm?: number;
  armRightCm?: number;
  forearmLeftCm?: number;
  forearmRightCm?: number;
  waistCm?: number;
  hipsCm?: number;
  thighLeftCm?: number;
  thighRightCm?: number;
  calfLeftCm?: number;
  calfRightCm?: number;
  sleepQuality?: number;
  energyLevel?: number;
  stressLevel?: number;
  photoUrl?: string | null;
}

interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  reps: number;
  date: string;
}

async function compressImage(file: File, maxWidth = 900, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProgressTracker({ userId }: ProgressTrackerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("lab");
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickWeight, setQuickWeight] = useState("");
  const [showQuickWeight, setShowQuickWeight] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<BodyMeasurement>>({
    weightKg: 0,
    bodyFatPercentage: 0,
    sleepQuality: 5,
    energyLevel: 5,
    stressLevel: 5
  });

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/progress?userId=${userId}`);
      const result = await response.json();
      setMeasurements(result.measurements || []);
      setPrs(result.prs || []);
    } catch (e) {
      console.error("Error loading progress:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.weightKg) return alert("El peso es obligatorio");

    try {
      const payload: any = { ...formData, userId };
      if (photoPreview) payload.photoUrl = photoPreview;
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setFormData({
          weightKg: 0,
          bodyFatPercentage: 0,
          sleepQuality: 5,
          energyLevel: 5,
          stressLevel: 5
        });
        setPhotoPreview(null);
        setActiveTab("lab");
        loadData();
      }
    } catch (e) {
      alert("Error al guardar mediciones");
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressingPhoto(true);
    try {
      const compressed = await compressImage(file);
      setPhotoPreview(compressed);
    } catch {
      alert("Error al procesar la imagen");
    } finally {
      setCompressingPhoto(false);
    }
  };

  const logQuickWeight = async () => {
    const w = parseFloat(quickWeight);
    if (!w || w < 20 || w > 400) return;
    setSavingWeight(true);
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, weightKg: w, sleepQuality: 5, energyLevel: 5, stressLevel: 5 }),
      });
      setQuickWeight("");
      setShowQuickWeight(false);
      loadData();
    } catch {
      alert("Error al guardar peso");
    } finally {
      setSavingWeight(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px] text-white/40 font-black uppercase tracking-[0.3em]">Cargando Laboratorio...</div>;

  const last = measurements[0] || {};
  const prev = measurements[1] || {};

  return (
    <div className="space-y-12">
      {/* Tab Navigation + Quick Weight */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Tabs — full width on mobile, auto on desktop */}
        <div className="flex items-center gap-1 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-full sm:w-fit">
          {[
            { id: "lab",     label: "LABORATORIO", short: "LAB"  },
            { id: "scan",    label: "ESCÁNER",      short: "SCAN" },
            { id: "prs",     label: "RÉCORDS",      short: "PRs"  },
            { id: "history", label: "HISTORIAL",    short: "LOG"  },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 sm:flex-none px-2 sm:px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.short}</span>
            </button>
          ))}
        </div>

        {/* Quick weight entry */}
        <AnimatePresence mode="wait">
          {showQuickWeight ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <input
                type="number"
                step="0.1"
                min="20"
                max="400"
                autoFocus
                placeholder="75.5"
                className="w-24 bg-white/[0.03] border border-white/15 rounded-xl px-3 py-2.5 text-white font-black text-sm text-center outline-none focus:border-blue-500/40 transition-all placeholder-white/20"
                value={quickWeight}
                onChange={e => setQuickWeight(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") logQuickWeight(); if (e.key === "Escape") setShowQuickWeight(false); }}
              />
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">KG</span>
              <button
                onClick={logQuickWeight}
                disabled={savingWeight}
                className="px-3 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-40"
              >
                {savingWeight ? "..." : "✓"}
              </button>
              <button
                onClick={() => setShowQuickWeight(false)}
                className="px-2 py-2.5 text-white/20 hover:text-white/60 text-sm transition-colors"
              >
                ✕
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickWeight(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/25 hover:text-white/60 hover:border-white/15 transition-all"
            >
              <span className="text-[9px] font-black uppercase tracking-widest">+ PESO</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB: LABORATORIO */}
        {activeTab === "lab" && (
          <motion.div
            key="lab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Mapa muscular de simetría */}
            <ErrorBoundary label="MAPA MUSCULAR" compact>
              <BodySymmetryMap userId={userId} />
            </ErrorBoundary>

            {/* Navegador de checkpoints corporales */}
            <ErrorBoundary label="TIMELINE" compact>
              <MeasurementTimeline measurements={measurements} />
            </ErrorBoundary>

            {/* Gráfica de progresión de fuerza */}
            <ErrorBoundary label="PROGRESIÓN DE FUERZA">
              <StrengthProgressChart userId={userId} />
            </ErrorBoundary>

            {/* Evolución corporal histórica */}
            <ErrorBoundary label="EVOLUCIÓN CORPORAL" compact>
              <BodyMeasurementsChart userId={userId} />
            </ErrorBoundary>

            {/* Charts de composición corporal */}
            <ErrorBoundary label="GRÁFICAS" compact>
              <ProgressCharts measurements={measurements} />
            </ErrorBoundary>

            {/* Main Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 relative overflow-hidden group">
                <div className="text-[10px] font-black text-white/30 tracking-widest uppercase mb-8">(01) COMPOSICIÓN</div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <NumberTicker value={Number(last.weightKg || 0)} decimalPlaces={1} className="text-7xl font-black text-white tracking-tighter" />
                    <span className="text-xl font-bold text-white/20">KG</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {last.weightKg && prev.weightKg ? (Number(last.weightKg) - Number(prev.weightKg) > 0 ? `+${(Number(last.weightKg) - Number(prev.weightKg)).toFixed(1)}` : (Number(last.weightKg) - Number(prev.weightKg)).toFixed(1)) : "BASE"} KG VS ÚLTIMO
                  </p>
                </div>
              </div>

              <div className="p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 relative overflow-hidden group">
                <div className="text-[10px] font-black text-white/30 tracking-widest uppercase mb-8">(02) V-TAPER RATIO</div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black text-white tracking-tighter">
                      {last.shouldersCm && last.waistCm ? (Number(last.shouldersCm) / Number(last.waistCm)).toFixed(2) : "1.00"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">ESTÉTICA OBJETIVO: 1.61</p>
                </div>
              </div>

              <div className="p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 relative overflow-hidden group">
                <div className="text-[10px] font-black text-white/30 tracking-widest uppercase mb-8">(03) BIOFEEDBACK</div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <NumberTicker value={Number(last.sleepQuality || 0)} className="text-7xl font-black text-white tracking-tighter" />
                    <span className="text-xl font-bold text-white/20">/10</span>
                  </div>
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">CALIDAD DE RECUPERACIÓN</p>
                </div>
              </div>
            </div>

            {/* Symmetry Scan Visualizer */}
            <div className="p-12 rounded-[4rem] bg-[#0A0A0B] border border-white/10 relative overflow-hidden">
               <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-12 text-center">ESCÁNER DE SIMETRÍA BILATERAL</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  {/* Brazos */}
                  <div className="space-y-8">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">BRAZOS (CM)</span>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">DIFERENCIA: {Math.abs(Number(last.armLeftCm || 0) - Number(last.armRightCm || 0)).toFixed(1)} CM</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 text-right space-y-1">
                        <div className="text-3xl font-black text-white">{last.armLeftCm || "--"}</div>
                        <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">IZQUIERDO</div>
                      </div>
                      <div className="w-1 h-12 bg-white/10 rounded-full"></div>
                      <div className="flex-1 text-left space-y-1">
                        <div className="text-3xl font-black text-white">{last.armRightCm || "--"}</div>
                        <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">DERECHO</div>
                      </div>
                    </div>
                  </div>

                  {/* Piernas */}
                  <div className="space-y-8">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">PIERNAS (CM)</span>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">DIFERENCIA: {Math.abs(Number(last.thighLeftCm || 0) - Number(last.thighRightCm || 0)).toFixed(1)} CM</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 text-right space-y-1">
                        <div className="text-3xl font-black text-white">{last.thighLeftCm || "--"}</div>
                        <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">IZQUIERDO</div>
                      </div>
                      <div className="w-1 h-12 bg-white/10 rounded-full"></div>
                      <div className="flex-1 text-left space-y-1">
                        <div className="text-3xl font-black text-white">{last.thighRightCm || "--"}</div>
                        <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">DERECHO</div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Historial de entrenamientos */}
            <ErrorBoundary label="HISTORIAL" compact>
              <WorkoutHistoryPanel userId={userId} />
            </ErrorBoundary>
          </motion.div>
        )}

        {/* TAB: ESCÁNER (FORMULARIO) */}
        {activeTab === "scan" && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
          >
            <form onSubmit={handleSubmit} className="space-y-12 pb-20">
              {/* Sección Composición */}
              <div className="p-8 sm:p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 space-y-8">
                <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em]">01. COMPOSICIÓN BÁSICA</h3>
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <NumberDrum
                    label="PESO CORPORAL"
                    unit="KG"
                    value={formData.weightKg ?? 70}
                    onChange={v => setFormData({ ...formData, weightKg: v })}
                    min={30} max={250} step={0.1}
                  />
                  <NumberDrum
                    label="% GRASA"
                    unit="%"
                    value={formData.bodyFatPercentage ?? 15}
                    onChange={v => setFormData({ ...formData, bodyFatPercentage: v })}
                    min={3} max={50} step={0.1}
                  />
                </div>
              </div>

              {/* Sección Antropometría Tren Superior */}
              <div className="p-8 sm:p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 space-y-8">
                <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em]">02. TREN SUPERIOR (CM)</h3>

                {/* Cuello, Hombros, Pecho */}
                <div className="grid grid-cols-3 gap-3 sm:gap-5">
                  <NumberDrum label="CUELLO" unit="cm" value={formData.neckCm ?? 38} onChange={v => setFormData({ ...formData, neckCm: v })} min={25} max={65} step={0.5} />
                  <NumberDrum label="HOMBROS" unit="cm" value={formData.shouldersCm ?? 110} onChange={v => setFormData({ ...formData, shouldersCm: v })} min={80} max={200} step={0.5} />
                  <NumberDrum label="PECHO" unit="cm" value={formData.chestCm ?? 95} onChange={v => setFormData({ ...formData, chestCm: v })} min={60} max={180} step={0.5} />
                </div>

                {/* Brazos bilaterales */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">SIMETRÍA BRAZOS</p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-5">
                    <NumberDrum label="IZQUIERDO" unit="cm" value={formData.armLeftCm ?? 35} onChange={v => setFormData({ ...formData, armLeftCm: v })} min={20} max={65} step={0.5} />
                    <NumberDrum label="DERECHO" unit="cm" value={formData.armRightCm ?? 35} onChange={v => setFormData({ ...formData, armRightCm: v })} min={20} max={65} step={0.5} />
                  </div>
                </div>

                {/* Antebrazos bilaterales */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">SIMETRÍA ANTEBRAZOS</p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-5">
                    <NumberDrum label="IZQUIERDO" unit="cm" value={formData.forearmLeftCm ?? 28} onChange={v => setFormData({ ...formData, forearmLeftCm: v })} min={15} max={55} step={0.5} />
                    <NumberDrum label="DERECHO" unit="cm" value={formData.forearmRightCm ?? 28} onChange={v => setFormData({ ...formData, forearmRightCm: v })} min={15} max={55} step={0.5} />
                  </div>
                </div>
              </div>

              {/* Sección Biofeedback */}
              <div className="p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 space-y-8">
                <h3 className="text-xs font-black text-purple-500 uppercase tracking-[0.3em]">03. BIOFEEDBACK (ESCALA 1-10)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                     { id: 'sleepQuality', label: 'SUEÑO' },
                     { id: 'energyLevel', label: 'ENERGÍA' },
                     { id: 'stressLevel', label: 'ESTRÉS' }
                   ].map(field => (
                     <div key={field.id} className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">{field.label}</label>
                        <input 
                          type="range" min="1" max="10"
                          className="w-full accent-blue-500 h-2 bg-white/5 rounded-lg appearance-none cursor-pointer"
                          value={(formData as any)[field.id] || 5}
                          onChange={e => setFormData({...formData, [field.id]: parseInt(e.target.value)})}
                        />
                        <div className="text-center text-xl font-black text-white">{(formData as any)[field.id] || 5}</div>
                     </div>
                   ))}
                </div>
              </div>

              {/* Sección Foto de Progreso */}
              <div className="p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 space-y-6">
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em]">04. FOTO DE PROGRESO (OPCIONAL)</h3>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                {photoPreview ? (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={photoPreview}
                        alt="Vista previa"
                        className="w-full max-h-72 object-cover"
                        style={{ objectPosition: "top" }}
                      />
                      <button
                        type="button"
                        onClick={() => { setPhotoPreview(null); if (photoInputRef.current) photoInputRef.current.value = ""; }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest text-center">
                      FOTO LISTA — SE GUARDARÁ CON ESTE CHECKPOINT
                    </p>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full py-3 rounded-2xl border border-dashed border-white/10 text-[9px] font-black text-white/25 uppercase tracking-widest hover:border-white/20 hover:text-white/40 transition-all"
                    >
                      Cambiar foto
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={compressingPhoto}
                    className="w-full py-8 rounded-2xl border border-dashed border-white/10 flex flex-col items-center gap-3 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group disabled:opacity-40"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all text-xl">
                      📷
                    </div>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest group-hover:text-white/40 transition-all">
                      {compressingPhoto ? "Procesando..." : "Tomar foto o subir imagen"}
                    </span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-6 rounded-[2rem] bg-blue-600 text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-[0.98]"
              >
                Sincronizar Laboratorio
              </button>
            </form>
          </motion.div>
        )}

        {/* TAB: HISTORIAL */}
        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <ErrorBoundary label="HISTORIAL DE SESIONES">
              <WorkoutHistoryPanel userId={userId} />
            </ErrorBoundary>
          </motion.div>
        )}

        {/* TAB: RÉCORDS */}
        {activeTab === "prs" && (
          <motion.div
            key="prs"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-10"
          >
            {prs.length === 0 ? (
              <div className="py-24 text-center space-y-4">
                <div className="text-6xl opacity-20">🏆</div>
                <p className="text-white/20 font-black uppercase tracking-[0.3em] text-sm">Sin récords aún</p>
                <p className="text-white/10 font-bold uppercase tracking-widest text-[10px]">Completa sets y batirás tus primeros PRs</p>
              </div>
            ) : (
              <>
                {/* Podio — Top 3 */}
                {prs.length >= 1 && (() => {
                  const sorted = [...prs].sort((a, b) => b.maxWeight - a.maxWeight);
                  const podium = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
                  const podiumOrder = prs.length === 1 ? [sorted[0]] : prs.length === 2 ? [sorted[1], sorted[0]] : podium;
                  const rankOf = (pr: PersonalRecord) => sorted.indexOf(pr);

                  const PODIUM_CONFIG = [
                    { rank: 2, heightClass: "pt-8",  borderColor: "border-white/10",        textColor: "text-white/50",  label: "PLATA",   size: "text-4xl" },
                    { rank: 1, heightClass: "pt-0",  borderColor: "border-yellow-500/30",   textColor: "text-yellow-400", label: "ORO",    size: "text-5xl" },
                    { rank: 3, heightClass: "pt-14", borderColor: "border-orange-500/20",   textColor: "text-orange-400", label: "BRONCE", size: "text-3xl" },
                  ];

                  const configFor = (pr: PersonalRecord) => {
                    const r = rankOf(pr) + 1;
                    return PODIUM_CONFIG.find(c => c.rank === r) ?? PODIUM_CONFIG[0];
                  };

                  return (
                    <div className="flex items-end justify-center gap-3 sm:gap-4 pb-2">
                      {podiumOrder.map((pr, i) => {
                        const cfg = configFor(pr);
                        const rank = rankOf(pr) + 1;
                        return (
                          <motion.div
                            key={pr.exerciseName}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className={`flex-1 max-w-[200px] ${cfg.heightClass}`}
                          >
                            <div className={`p-5 sm:p-6 rounded-[2rem] bg-[#0A0A0B] border ${cfg.borderColor} text-center space-y-3`}>
                              <div className={`text-[8px] font-black uppercase tracking-[0.3em] ${cfg.textColor}`}>{cfg.label}</div>
                              <div className={`font-black text-white uppercase tracking-tighter leading-tight text-[11px] sm:text-[13px] line-clamp-2`}>
                                {pr.exerciseName}
                              </div>
                              <div className="space-y-0.5">
                                <div className={`font-black text-white tabular-nums ${cfg.size}`}>
                                  {pr.maxWeight}
                                </div>
                                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">KG</div>
                              </div>
                              <div className="text-[7px] font-bold text-white/20 uppercase tracking-widest">
                                {new Date(pr.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Lista rankeada — desde #4 en adelante */}
                {prs.length > 3 && (() => {
                  const sorted = [...prs].sort((a, b) => b.maxWeight - a.maxWeight);
                  return (
                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] pb-1">RANKING COMPLETO</p>
                      {sorted.slice(3).map((pr, i) => (
                        <motion.div
                          key={pr.exerciseName}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.25 }}
                          className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#0A0A0B] border border-white/[0.06] hover:border-white/10 transition-all"
                        >
                          <span className="text-[10px] font-black text-white/15 tabular-nums w-5 text-right shrink-0">#{i + 4}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-black text-white uppercase tracking-tight truncate">{pr.exerciseName}</p>
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                              {new Date(pr.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-black text-white tabular-nums">{pr.maxWeight} <span className="text-white/20 text-xs font-bold">KG</span></p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
