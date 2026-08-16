import { useState } from "react";

interface Profile {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

interface FriendshipStatus {
  status: "none" | "pending" | "accepted" | "rejected";
  direction: "sent" | "received" | null;
}

interface Props {
  profile: Profile;
  friendshipStatus: FriendshipStatus;
  totalWorkouts: number;
  friendsCount: number;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
}

export default function PublicProfileCard({
  profile,
  friendshipStatus: initialStatus,
  totalWorkouts,
  friendsCount,
  isOwnProfile,
  isLoggedIn,
}: Props) {
  const [status, setStatus] = useState<FriendshipStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const name    = profile.displayName || profile.username || "Atleta";
  const initial = name.charAt(0).toUpperCase();

  const sendRequest = async () => {
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUsername: profile.username }),
      });
      if (res.ok) {
        setStatus({ status: "pending", direction: "sent" });
      } else {
        const d = await res.json();
        setError(d.error ?? "Error al enviar solicitud");
      }
    } catch { setError("Error de red"); }
    setLoading(false);
  };

  const cancelRequest = async () => {
    setLoading(true); setError("");
    try {
      await fetch("/api/friends/request", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUsername: profile.username }),
      });
      setStatus({ status: "none", direction: null });
    } catch { setError("Error de red"); }
    setLoading(false);
  };

  // ─── Button state ──────────────────────────────────────────────────────────
  let buttonLabel = "Agregar amigo +";
  let buttonStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #4f46e5, #2563eb)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  };
  let buttonAction = sendRequest;

  if (isOwnProfile) {
    buttonLabel = "Editar perfil";
    buttonStyle = { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" };
    buttonAction = () => { window.location.href = "/settings"; };
  } else if (status.status === "accepted") {
    buttonLabel = "✓ Amigos";
    buttonStyle = { background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)", cursor: "default" };
    buttonAction = () => {};
  } else if (status.status === "pending" && status.direction === "sent") {
    buttonLabel = "Solicitud enviada";
    buttonStyle = { background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)", cursor: "pointer" };
    buttonAction = cancelRequest;
  } else if (status.status === "pending" && status.direction === "received") {
    buttonLabel = "Aceptar solicitud";
    buttonStyle = { background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)", cursor: "pointer" };
    buttonAction = async () => {
      setLoading(true);
      await fetch("/api/friends/respond", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: profile.id, action: "accept" }),
      });
      setStatus({ status: "accepted", direction: null });
      setLoading(false);
    };
  }

  return (
    <div style={{
      width: "100%",
      maxWidth: 360,
      borderRadius: "2rem",
      overflow: "hidden",
      background: "#0d0d10",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: "0 32px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.08)",
    }}>

      {/* ── Photo header ── */}
      <div style={{ position: "relative", height: 220, background: "linear-gradient(145deg, #1e1b4b 0%, #0f0e1a 100%)" }}>
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={name}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5, #2563eb)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.5rem", fontWeight: 900, color: "white",
              boxShadow: "0 0 40px rgba(99,102,241,0.4)",
            }}>
              {initial}
            </div>
          </div>
        )}

        {/* Gradient fade at bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 100,
          background: "linear-gradient(to top, #0d0d10, transparent)",
        }} />

        {/* FORJA badge top-right */}
        <div style={{
          position: "absolute", top: "1rem", right: "1rem",
          padding: "0.25rem 0.6rem",
          borderRadius: "999px",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", gap: "0.3rem",
        }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.2em" }}>FORJA</span>
        </div>
      </div>

      {/* ── Info section ── */}
      <div style={{ padding: "0 1.5rem 1.5rem" }}>

        {/* Name + username */}
        <div style={{ marginBottom: "0.625rem" }}>
          <h1 style={{
            margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#fff",
            letterSpacing: "-0.04em", lineHeight: 1.05,
          }}>
            {name}
          </h1>
          {profile.username && (
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", fontWeight: 600, color: "rgba(99,102,241,0.6)", letterSpacing: "0.02em" }}>
              @{profile.username}
            </p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{
            margin: "0 0 1.25rem", fontSize: "0.8rem", lineHeight: 1.55,
            color: "rgba(255,255,255,0.4)", fontWeight: 500,
          }}>
            {profile.bio}
          </p>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: "1.25rem" }} />

        {/* Stats + button row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>

          {/* Friends stat */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem" }}>
            <span style={{ fontSize: "1rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{friendsCount}</span>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>amigos</span>
          </div>

          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.07)" }} />

          {/* Sessions stat */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem" }}>
            <span style={{ fontSize: "1rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{totalWorkouts}</span>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>sesiones</span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* CTA button */}
          <button
            onClick={buttonAction}
            disabled={loading || (status.status === "accepted" && !isOwnProfile)}
            style={{
              ...buttonStyle,
              padding: "0.625rem 1.125rem",
              borderRadius: "999px",
              fontSize: "0.72rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              transition: "all 0.2s",
              opacity: loading ? 0.6 : 1,
              display: "flex", alignItems: "center", gap: "0.4rem",
              whiteSpace: "nowrap",
              boxShadow: status.status === "none" && !isOwnProfile
                ? "0 4px 20px rgba(79,70,229,0.35)"
                : "none",
            }}
          >
            {loading ? (
              <span style={{
                display: "inline-block", width: 12, height: 12,
                border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "currentColor",
                borderRadius: "50%", animation: "spin 0.7s linear infinite",
              }} />
            ) : buttonLabel}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.7rem", color: "#fca5a5", textAlign: "center" }}>
            {error}
          </p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
