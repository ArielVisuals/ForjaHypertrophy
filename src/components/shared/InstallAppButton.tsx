import { useState, useEffect } from "react";

/**
 * Boton "Instalar la app" para la landing. Siempre visible salvo que la app
 * ya corra instalada (standalone).
 *
 * - Android / Chrome / Edge: si el navegador entrego beforeinstallprompt,
 *   un toque abre la instalacion nativa.
 * - iOS Safari: guia de pasos (Compartir -> Añadir a pantalla de inicio).
 * - Resto (o prompt aun no disponible): guia generica segun la plataforma.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios-safari" | "ios-chrome" | "android-chrome" | "desktop-chromium" | "generic";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  if (isIos) return /crios/i.test(ua) ? "ios-chrome" : "ios-safari";
  const isChromium = /chrome|chromium|edg/i.test(ua) && !/firefox|fxios/i.test(ua);
  if (/android/i.test(ua)) return isChromium ? "android-chrome" : "generic";
  return isChromium ? "desktop-chromium" : "generic";
}

const GUIDE: Record<Platform, { title: string; steps: React.ReactNode[] }> = {
  "ios-safari": {
    title: "En tu iPhone o iPad (Safari)",
    steps: [
      <>Toca el boton <span className="text-white">Compartir</span> de Safari (el cuadrado con la flecha hacia arriba, abajo al centro)</>,
      <>Baja en la lista y elige <span className="text-white">Añadir a pantalla de inicio</span></>,
      <>Confirma con <span className="text-white">Añadir</span>. FORJA aparecera como una app mas</>,
    ],
  },
  "ios-chrome": {
    title: "En tu iPhone con Chrome",
    steps: [
      <>Toca el boton <span className="text-white">Compartir</span> (el cuadrado con la flecha, junto a la barra de direcciones)</>,
      <>Elige <span className="text-white">Añadir a pantalla de inicio</span></>,
      <>Confirma con <span className="text-white">Añadir</span>. FORJA aparecera como una app mas</>,
    ],
  },
  "android-chrome": {
    title: "En tu Android con Chrome",
    steps: [
      <>Toca el menu de <span className="text-white">tres puntos</span> (arriba a la derecha)</>,
      <>Elige <span className="text-white">Instalar aplicacion</span> (en versiones anteriores dice <span className="text-white">Añadir a pantalla principal</span>)</>,
      <>Confirma con <span className="text-white">Instalar</span>. FORJA aparecera con las demas apps</>,
    ],
  },
  "desktop-chromium": {
    title: "En tu computadora (Chrome o Edge)",
    steps: [
      <>Busca el <span className="text-white">icono de instalar</span> al final de la barra de direcciones (un monitor con una flecha) y toca <span className="text-white">Instalar</span></>,
      <>Si no lo ves: menu de <span className="text-white">tres puntos</span>, luego <span className="text-white">Enviar, guardar y compartir</span> y <span className="text-white">Instalar pagina como app</span> (en Edge: <span className="text-white">Aplicaciones</span>, <span className="text-white">Instalar este sitio como una aplicacion</span>)</>,
      <>Confirma. FORJA se abrira en su propia ventana</>,
    ],
  },
  generic: {
    title: "En tu dispositivo",
    steps: [
      <>Abre el <span className="text-white">menu del navegador</span></>,
      <>Busca la opcion <span className="text-white">Instalar app</span> o <span className="text-white">Añadir a pantalla de inicio</span></>,
      <>Confirma. FORJA aparecera como una app mas</>,
    ],
  },
};

export function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("generic");
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

    setPlatform(detectPlatform());

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
    setShowIosGuide(true); // guia manual (iOS o navegador sin prompt disponible)
  };

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="w-full sm:w-auto px-10 py-5 rounded-full text-[clamp(1rem,1.5vw,1.125rem)] font-semibold text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Instalar App
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
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                {GUIDE[platform].title}
              </h3>
            </div>

            <ol className="space-y-4">
              {GUIDE[platform].steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600/25 border border-blue-500/40 flex items-center justify-center text-[10px] font-black text-blue-300 shrink-0">{i + 1}</span>
                  <p className="text-xs font-bold text-white/70 leading-relaxed">{step}</p>
                </li>
              ))}
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
    </>
  );
}
