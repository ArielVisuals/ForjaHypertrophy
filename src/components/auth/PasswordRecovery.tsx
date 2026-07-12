import { useState } from "react";

/**
 * Recuperacion de contraseña en dos pantallas:
 * - mode "request": pide el correo y envia el enlace (respuesta generica).
 * - mode "reset": con el token del enlace, define la nueva contraseña.
 */

interface PasswordRecoveryProps {
  mode: "request" | "reset";
  token?: string | null;
}

const inputClass =
  "w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3.5 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.05] transition-all";

export function PasswordRecovery({ mode, token }: PasswordRecoveryProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (mode === "reset") {
      if (password.length < 8) return setError("La contraseña necesita al menos 8 caracteres");
      if (password !== confirm) return setError("Las contraseñas no coinciden");
    }

    setSubmitting(true);
    try {
      const res = await fetch(mode === "request" ? "/api/auth/forgot-password" : "/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "request" ? { email } : { token, password }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Algo salio mal. Intenta de nuevo.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salio mal. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center space-y-4">
        <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-[0.4em]">LISTO</p>
        <p className="text-sm font-black text-white uppercase tracking-tight leading-relaxed">
          {mode === "request"
            ? "Si el correo existe, te enviamos el enlace. Revisa tu bandeja."
            : "Contraseña actualizada. Inicia sesion con la nueva."}
        </p>
        <a
          href="/login"
          className="inline-block px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-blue-600 text-white hover:bg-blue-500 transition-all"
        >
          Ir a iniciar sesion
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {mode === "request" ? (
        <div>
          <label htmlFor="email" className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">
            Correo de tu cuenta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            required
            className={inputClass}
          />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="password" className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
              autoComplete="new-password"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">
              Confirmala
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repitela"
              autoComplete="new-password"
              required
              className={inputClass}
            />
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="text-[10px] font-black text-red-400 uppercase tracking-widest">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
      >
        {submitting ? "Un momento..." : mode === "request" ? "Enviar enlace" : "Guardar contraseña"}
      </button>

      <p className="text-center text-[9px] font-bold text-white/25 uppercase tracking-widest pt-1">
        <a href="/login" className="text-blue-400/80 hover:text-blue-300 transition-colors">Volver a iniciar sesion</a>
      </p>
    </form>
  );
}
