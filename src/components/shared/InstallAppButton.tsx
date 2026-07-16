import { useState, useEffect } from "react";

/**
 * Boton "Instalar la app" para la landing.
 *
 * - Android / Chrome / Edge: captura el evento beforeinstallprompt y lo
 *   dispara al hacer clic (instalacion nativa en un toque).
 * - iOS Safari: no existe API de instalacion, se muestra una guia con los
 *   pasos (Compartir -> Añadir a pantalla de inicio).
 * - Si la app ya corre instalada (standalone) o el navegador no soporta
 *   instalacion, el boton no se renderiza.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted") setInstallEvent(null);
      return;
    }
    if (isIos) setShowIosGuide(true);
  };

  // Sin soporte de instalacion en este navegador (o ya instalada): nada que mostrar
  if (installed || (!installEvent && !isIos)) return null;

  return (
    <div className="flex justify-center pt-5">
      <button
        type="button"
        onClick={install}
        className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Instalar la app en tu dispositivo
      </button>

      {/* Guia de instalacion para iOS */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="w-full max-w-sm p-8 rounded-t-[2rem] sm:rounded-[2rem] bg-[#0A0A0B] border border-white/10 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-[0.4em]">Instalar FORJA</p>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">En tu iPhone o iPad</h3>
            </div>

            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600/25 border border-blue-500/40 flex items-center justify-center text-[10px] font-black text-blue-300 shrink-0">1</span>
                <p className="text-xs font-bold text-white/70 leading-relaxed">
                  Toca el boton <span className="text-white">Compartir</span> de Safari (el cuadrado con la flecha hacia arriba)
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600/25 border border-blue-500/40 flex items-center justify-center text-[10px] font-black text-blue-300 shrink-0">2</span>
                <p className="text-xs font-bold text-white/70 leading-relaxed">
                  Baja y elige <span className="text-white">Añadir a pantalla de inicio</span>
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600/25 border border-blue-500/40 flex items-center justify-center text-[10px] font-black text-blue-300 shrink-0">3</span>
                <p className="text-xs font-bold text-white/70 leading-relaxed">
                  Confirma con <span className="text-white">Añadir</span>. FORJA aparecera como una app mas
                </p>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-white/[0.05] border border-white/[0.1] text-white/60 hover:text-white transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
