import { useState, useRef } from "react";

interface Props {
  currentAvatarUrl?: string | null;
  displayName?: string | null;
  currentUsername?: string | null;
  currentBio?: string | null;
  cloudName: string;
  uploadPreset: string;
}

const CLOUDINARY_WIDGET_URL = "https://widget.cloudinary.com/v2.0/global/all.js";

function loadCloudinaryWidget(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).cloudinary) { resolve(); return; }
    const script = document.createElement("script");
    script.src = CLOUDINARY_WIDGET_URL;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export default function ProfileEditor({ currentAvatarUrl, displayName, currentUsername, currentBio, cloudName, uploadPreset }: Props) {
  const [avatar, setAvatar] = useState(currentAvatarUrl ?? "");
  const [name, setName] = useState(displayName ?? "");
  const [username, setUsername] = useState(currentUsername ?? "");
  const [bio, setBio] = useState(currentBio ?? "");
  const [usernameError, setUsernameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/;

  const handleUsernameChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/\s/g, "");
    setUsername(cleaned);
    if (cleaned.length > 0 && !USERNAME_RE.test(cleaned)) {
      setUsernameError("Solo letras minúsculas, números, puntos y guiones. Mínimo 3 caracteres.");
    } else {
      setUsernameError("");
    }
  };

  const handleAvatarUpload = async () => {
    await loadCloudinaryWidget();
    setUploadingAvatar(true);

    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ["local", "camera"],
        cropping: true,
        croppingAspectRatio: 1,
        showSkipCropButton: false,
        resourceType: "image",
        maxFileSize: 5000000,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        styles: {
          palette: {
            window: "#0A0A0B",
            windowBorder: "rgba(255,255,255,0.1)",
            tabIcon: "#2563EB",
            menuIcons: "#aaaaaa",
            textDark: "#000000",
            textLight: "#ffffff",
            link: "#2563EB",
            action: "#2563EB",
            inactiveTabIcon: "#555555",
            error: "#ef4444",
            inProgress: "#2563EB",
            complete: "#22c55e",
            sourceBg: "#111112",
          },
        },
      },
      async (error: any, result: any) => {
        if (error) { setUploadingAvatar(false); return; }
        if (result.event === "success") {
          const url = result.info.secure_url;

          // Guardar URL en el servidor
          const res = await fetch("/api/profile/avatar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatarUrl: url }),
          });

          if (res.ok) {
            setAvatar(url);
          }
          setUploadingAvatar(false);
          widget.close();
        }
        if (result.event === "close") {
          setUploadingAvatar(false);
        }
      }
    );
    widget.open();
  };

  const handleSave = async () => {
    if (usernameError) return;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    const body: Record<string, string> = {};
    if (name !== displayName) body.displayName = name;
    if (username !== currentUsername) body.username = username;
    if (bio !== currentBio) body.bio = bio;

    if (Object.keys(body).length === 0) {
      setSaving(false);
      return;
    }

    const res = await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (res.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(json.error ?? "Error al guardar");
    }
    setSaving(false);
  };

  const initials = (name || username || "?")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <div style={{ position: "relative" }}>
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }}
            />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem", fontWeight: 900, color: "white",
              border: "2px solid rgba(255,255,255,0.1)",
            }}>
              {initials}
            </div>
          )}
        </div>
        <div>
          <button
            onClick={handleAvatarUpload}
            disabled={uploadingAvatar}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(37,99,235,0.4)",
              background: "rgba(37,99,235,0.12)",
              color: "#93c5fd",
              fontSize: "0.75rem",
              fontWeight: 900,
              cursor: uploadingAvatar ? "wait" : "pointer",
              display: "block",
              marginBottom: "0.4rem",
            }}
          >
            {uploadingAvatar ? "Subiendo..." : "Cambiar foto"}
          </button>
          <p style={{ margin: 0, fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>
            JPG, PNG o WebP · Máx 5 MB
          </p>
        </div>
      </div>

      {/* Nombre visible */}
      <div>
        <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>
          Nombre visible
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Tu nombre completo"
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "0.875rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            fontSize: "0.9rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Username */}
      <div>
        <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>
          Username
        </label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            maxLength={30}
            placeholder="tu.username"
            style={{
              width: "100%",
              paddingLeft: "2rem",
              paddingRight: "1rem",
              paddingTop: "0.75rem",
              paddingBottom: "0.75rem",
              borderRadius: "0.875rem",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${usernameError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: "white",
              fontSize: "0.9rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        {usernameError ? (
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.7rem", color: "#fca5a5" }}>{usernameError}</p>
        ) : (
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.7rem", color: "rgba(255,255,255,0.25)" }}>
            Tus amigos te buscarán por este username · Solo letras, números, puntos y guiones
          </p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>
          <span>Bio</span>
          <span style={{ fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>{bio.length}/160</span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="Cuéntale a tus compañeros quién eres..."
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "0.875rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            fontSize: "0.875rem",
            outline: "none",
            resize: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Save */}
      {saveError && (
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#fca5a5", background: "rgba(239,68,68,0.08)", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid rgba(239,68,68,0.2)" }}>
          {saveError}
        </p>
      )}
      {saveSuccess && (
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#86efac", background: "rgba(34,197,94,0.08)", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid rgba(34,197,94,0.2)" }}>
          ✓ Perfil guardado correctamente
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !!usernameError}
        style={{
          padding: "0.875rem",
          borderRadius: "1rem",
          border: "none",
          background: saving || usernameError ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
          color: saving || usernameError ? "rgba(255,255,255,0.3)" : "white",
          fontSize: "0.8rem",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          cursor: saving || usernameError ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
