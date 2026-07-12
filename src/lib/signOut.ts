/** Cierra la sesion (revoca el refresh token) y vuelve a la landing. */
export async function signOut(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "/";
  }
}
