/**
 * Medios del catalogo de ejercicios (GIFs de tecnica y miniaturas).
 * Servidos via jsDelivr sobre el repo del dataset; en DB solo viven rutas
 * relativas para poder cambiar de CDN sin reescribir datos.
 *
 * Medios © Gym Visual (https://gymvisual.com/) — redistribuidos con permiso
 * por el dataset; mostrar atribucion donde se vean los GIFs.
 */

const MEDIA_BASE = "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/";

export function exerciseMediaUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  return MEDIA_BASE + relativePath;
}

export const EXERCISE_MEDIA_ATTRIBUTION = "GIFs e imagenes © Gym Visual";
