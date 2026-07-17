import { useState } from "react";

/**
 * Formulario de acceso propio (login / registro). Envia a /api/auth/* y
 * redirige segun la respuesta del servidor. Errores genericos: el backend
 * no revela si un correo existe.
 */

interface AuthFormProps {
  mode: "login" | "register";
  /** Ruta a la que volver tras iniciar sesion (query ?next=) */
  next?: string | null;
}

export function AuthForm({ mode, next }: AuthFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isCoach, setIsCoach] = useState(false);
  const [coachCode, setCoachCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (isRegister && password !== confirm) {
      return setError("Las contraseñas no coinciden");
    }
    if (isRegister && password.length < 8) {
      return setError("La contraseña necesita al menos 8 caracteres");
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? { displayName, email, password, ...(isCoach && coachCode ? { coachCode } : {}) }
            : { email, password }
        ),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Algo salio mal. Intenta de nuevo.");
      window.location.href = next && next.startsWith("/") ? next : body?.redirect ?? "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salio mal. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3.5 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.05] transition-all";

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {isRegister && (
        <div>
          <label htmlFor="displayName" className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">
            Tu nombre
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Como te llama tu entrenador"
            autoComplete="name"
            required
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">
          Correo
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

      <div>
        <label htmlFor="password" className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={isRegister ? "Minimo 8 caracteres" : "Tu contraseña"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            className={`${inputClass} pr-20`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-3 text-[8px] font-black text-white/60 hover:text-white uppercase tracking-widest transition-colors"
          >
            {showPassword ? "Ocultar" : "Ver"}
          </button>
        </div>
      </div>

      {isRegister && (
        <div>
          <label htmlFor="confirm" className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">
            Confirma tu contraseña
          </label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repitela"
            autoComplete="new-password"
            required
            className={inputClass}
          />
        </div>
      )}

      {isRegister && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsCoach(!isCoach)}
            className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] transition-all ${
              isCoach ? "bg-blue-600/40 border-blue-500/70 text-white" : "border-white/20"
            }`}>
              {isCoach ? "✓" : ""}
            </span>
            Soy entrenador
          </button>
          {isCoach && (
            <input
              type="text"
              value={coachCode}
              onChange={e => setCoachCode(e.target.value)}
              placeholder="Codigo de invitacion de entrenador"
              autoComplete="off"
              className={inputClass}
            />
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-[10px] font-black text-red-400 uppercase tracking-widest">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
      >
        {submitting ? "Un momento..." : isRegister ? "Crear cuenta" : "Entrar"}
      </button>

      <p className="text-center text-[9px] font-bold text-white/45 uppercase tracking-widest pt-1">
        {isRegister ? (
          <>Ya tienes cuenta? <a href="/login" className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors">Inicia sesion</a></>
        ) : (
          <>Primera vez en Forja? <a href="/register" className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors">Crea tu cuenta</a></>
        )}
      </p>
      {!isRegister && (
        <p className="text-center text-[9px] font-bold text-white/45 uppercase tracking-widest">
          <a href="/forgot-password" className="underline underline-offset-2 hover:text-white transition-colors">Olvidaste tu contraseña?</a>
        </p>
      )}
    </form>
  );
}
