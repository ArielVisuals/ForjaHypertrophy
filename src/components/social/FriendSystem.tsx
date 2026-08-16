import { useState, useEffect, useRef, useCallback } from "react";

interface UserResult {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface FriendData {
  friends: UserResult[];
  pendingIn: (UserResult & { requestedAt: string })[];
  pendingOut: UserResult[];
  searchResults: UserResult[];
}

function Avatar({ url, name, size = 40 }: { url?: string | null; name?: string | null; size?: number }) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={name ?? "Avatar"}
        width={size}
        height={size}
        style={{ borderRadius: "50%", objectFit: "cover", width: size, height: size, flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 900,
        color: "white",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function UserCard({
  user,
  action,
  onAction,
  actionLabel,
  actionVariant = "primary",
  secondaryAction,
  onSecondaryAction,
  secondaryLabel,
}: {
  user: UserResult;
  action?: () => void;
  actionLabel?: string;
  actionVariant?: "primary" | "danger" | "success" | "ghost";
  secondaryAction?: () => void;
  secondaryLabel?: string;
}) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: "rgba(37,99,235,0.15)", borderColor: "rgba(37,99,235,0.4)", color: "#93c5fd" },
    danger: { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#fca5a5" },
    success: { background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)", color: "#86efac" },
    ghost: { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" },
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "1rem",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Avatar url={user.avatarUrl} name={user.displayName} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {user.displayName ?? user.username ?? "Atleta"}
        </p>
        {user.username && (
          <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
            @{user.username}
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        {secondaryAction && secondaryLabel && (
          <button
            onClick={onSecondaryAction}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "0.6rem",
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.1)",
              color: "#fca5a5",
              fontSize: "0.65rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            {secondaryLabel}
          </button>
        )}
        {action && actionLabel && (
          <button
            onClick={action}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "0.6rem",
              border: `1px solid`,
              fontSize: "0.65rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              cursor: "pointer",
              ...variantStyles[actionVariant],
            }}
          >
            {actionLabel}
          </button>
        )}
        {user.username && (
          <a
            href={`/profile/${user.username}`}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "0.6rem",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.65rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Ver perfil
          </a>
        )}
      </div>
    </div>
  );
}

export default function FriendSystem() {
  const [data, setData] = useState<FriendData>({ friends: [], pendingIn: [], pendingOut: [], searchResults: [] });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const fetchData = useCallback(async (q = "") => {
    const url = q.length >= 2 ? `/api/friends/list?search=${encodeURIComponent(q)}` : "/api/friends/list";
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
    setLoading(false);
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (search.length < 2) {
      fetchData("");
      return;
    }
    setSearchLoading(true);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchData(search), 350);
    return () => clearTimeout(searchTimeout.current);
  }, [search, fetchData]);

  const handleSendRequest = async () => {
    if (!addUsername.trim()) return;
    setAddStatus(null);
    setAddError(null);
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUsername: addUsername.trim() }),
    });
    const json = await res.json();
    if (res.ok) {
      setAddStatus("Solicitud enviada ✓");
      setAddUsername("");
      fetchData(search);
    } else {
      setAddError(json.error ?? "Error al enviar solicitud");
    }
  };

  const handleRespond = async (requesterId: string, action: "accept" | "reject") => {
    await fetch("/api/friends/respond", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requesterId, action }),
    });
    fetchData(search);
  };

  const sectionTitle = (text: string, count?: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", marginTop: "1.5rem" }}>
      <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)" }}>
        {text}
      </p>
      {count !== undefined && count > 0 && (
        <span style={{ background: "rgba(37,99,235,0.3)", color: "#93c5fd", borderRadius: "999px", padding: "0.1rem 0.5rem", fontSize: "0.6rem", fontWeight: 900 }}>
          {count}
        </span>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
        Cargando...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* Añadir amigo */}
      <div style={{ padding: "1rem", borderRadius: "1.25rem", background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", marginBottom: "0.5rem" }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)" }}>
          Añadir por username
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", fontSize: "0.875rem", fontWeight: 700 }}>@</span>
            <input
              type="text"
              value={addUsername}
              onChange={(e) => { setAddUsername(e.target.value); setAddError(null); setAddStatus(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
              placeholder="username del atleta"
              style={{
                width: "100%",
                paddingLeft: "1.75rem",
                paddingRight: "0.875rem",
                paddingTop: "0.6rem",
                paddingBottom: "0.6rem",
                borderRadius: "0.75rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                fontSize: "0.8rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={handleSendRequest}
            disabled={!addUsername.trim()}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(37,99,235,0.4)",
              background: addUsername.trim() ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.03)",
              color: addUsername.trim() ? "#93c5fd" : "rgba(255,255,255,0.2)",
              fontWeight: 900,
              fontSize: "0.75rem",
              cursor: addUsername.trim() ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
            }}
          >
            Enviar
          </button>
        </div>
        {addStatus && <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "#86efac" }}>{addStatus}</p>}
        {addError && <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "#fca5a5" }}>{addError}</p>}
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: "0.25rem" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar atletas por nombre o username..."
          style={{
            width: "100%",
            padding: "0.7rem 1rem",
            borderRadius: "0.875rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "white",
            fontSize: "0.8rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Resultados de búsqueda */}
      {search.length >= 2 && (
        <>
          {sectionTitle("Resultados", data.searchResults.length)}
          {searchLoading ? (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>Buscando...</p>
          ) : data.searchResults.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}>No se encontraron usuarios</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {data.searchResults.map((u) => (
                <UserCard key={u.id} user={u} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Solicitudes pendientes */}
      {data.pendingIn.length > 0 && (
        <>
          {sectionTitle("Solicitudes recibidas", data.pendingIn.length)}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.pendingIn.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                action={() => handleRespond(u.id, "accept")}
                actionLabel="Aceptar"
                actionVariant="success"
                secondaryAction={() => handleRespond(u.id, "reject")}
                secondaryLabel="Rechazar"
              />
            ))}
          </div>
        </>
      )}

      {/* Solicitudes enviadas */}
      {data.pendingOut.length > 0 && (
        <>
          {sectionTitle("Solicitudes enviadas")}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.pendingOut.map((u) => (
              <UserCard key={u.id} user={u} actionLabel="Pendiente" actionVariant="ghost" />
            ))}
          </div>
        </>
      )}

      {/* Lista de amigos */}
      {sectionTitle("Mis amigos", data.friends.length)}
      {data.friends.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", margin: 0 }}>
          Aún no tienes amigos en FORJA. Busca a tus compañeros de entrenamiento por su username.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {data.friends.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
