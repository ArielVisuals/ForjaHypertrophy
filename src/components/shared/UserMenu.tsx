import { useState, useRef, useEffect } from "react";
import { signOut } from "@/lib/signOut";

interface UserMenuProps {
  user: {
    displayName: string | null;
    email: string | null;
    avatarUrl?: string | null;
    username?: string | null;
    bio?: string | null;
    totalWorkouts?: number;
    friendsCount?: number;
  } | null;
  isSignedIn: boolean;
}

export function UserMenu({ user, isSignedIn }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!isSignedIn) {
    return (
      <a
        href="/login"
        className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all text-sm font-semibold text-white shadow-lg"
      >
        Iniciar Sesión
      </a>
    );
  }

  const name     = user?.displayName || "Atleta";
  const initial  = name.charAt(0).toUpperCase();
  const avatar   = user?.avatarUrl;
  const username = user?.username;
  const bio      = user?.bio;
  const workouts = user?.totalWorkouts ?? 0;
  const friends  = user?.friendsCount  ?? 0;

  return (
    <div className="flex items-center gap-4" ref={cardRef} style={{ position: "relative" }}>
      {/* Name label */}
      <div className="flex-col items-end hidden sm:flex justify-center">
        <span className="text-white font-bold text-sm leading-none">{name}</span>
      </div>

      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Ver perfil"
        style={{
          width: 40, height: 40, borderRadius: "50%",
          padding: 0, border: "2px solid rgba(99,102,241,0.5)",
          background: "transparent", cursor: "pointer",
          overflow: "hidden", flexShrink: 0,
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.9)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #4f46e5, #2563eb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem", fontWeight: 900, color: "white",
          }}>
            {initial}
          </div>
        )}
      </button>

      {/* Sign-out */}
      <button
        onClick={signOut}
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>

      {/* Profile card dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            right: 0,
            width: 300,
            borderRadius: "1.5rem",
            overflow: "hidden",
            background: "#0d0d10",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1)",
            zIndex: 9999,
            animation: "cardIn 0.2s ease",
          }}
        >
          {/* Photo area — top half */}
          <div style={{ position: "relative", height: 160, background: "linear-gradient(135deg, #1e1b4b, #1e1033)" }}>
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  display: "block",
                  maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)",
                }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "4rem", fontWeight: 900, color: "rgba(99,102,241,0.4)",
              }}>
                {initial}
              </div>
            )}

            {/* Gradient overlay so text below is readable */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
              background: "linear-gradient(to top, #0d0d10, transparent)",
            }} />
          </div>

          {/* Info section */}
          <div style={{ padding: "0 1.25rem 1.25rem" }}>
            {/* Name + username */}
            <div style={{ marginBottom: "0.5rem" }}>
              <h3 style={{
                margin: 0, fontSize: "1.125rem", fontWeight: 900, color: "#fff",
                letterSpacing: "-0.03em", lineHeight: 1.1,
              }}>
                {name}
              </h3>
              {username && (
                <p style={{ margin: "0.15rem 0 0", fontSize: "0.7rem", fontWeight: 600, color: "rgba(99,102,241,0.7)", textTransform: "lowercase", letterSpacing: "0.02em" }}>
                  @{username}
                </p>
              )}
            </div>

            {/* Bio */}
            {bio && (
              <p style={{
                margin: "0 0 1rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)",
                lineHeight: 1.5, fontWeight: 500,
              }}>
                {bio}
              </p>
            )}

            {/* Stats + settings button */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* Friends */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>{friends}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "rgba(255,255,255,0.25)", marginLeft: "-0.1rem" }}>amigos</span>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)" }} />

              {/* Workouts */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 5v14M18 5v14M2 12h4M18 12h4M10 9h4M10 15h4"/>
                </svg>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>{workouts}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "rgba(255,255,255,0.25)", marginLeft: "-0.1rem" }}>sesiones</span>
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Go to public profile */}
              {username && (
                <a
                  href={`/u/${username}`}
                  onClick={() => setOpen(false)}
                  title="Ver mi perfil público"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.35)",
                    textDecoration: "none",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </a>
              )}

              {/* Go to settings */}
              <a
                href="/settings"
                onClick={() => setOpen(false)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "999px",
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "#a5b4fc",
                  fontSize: "0.7rem", fontWeight: 900,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.15)";
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Perfil
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}
