/**
 * Funciones de utilidad para Forja Hypertrophy App
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Combina clases de Tailwind con conflictos resueltos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea una fecha a formato legible en español
 */
export function formatDate(date: string | Date, formatStr: string = "PPP"): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: es });
}

/**
 * Calcula tiempo relativo ("hace 2 días")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { locale: es, addSuffix: true });
}

/**
 * Calcula días entre dos fechas
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === "string" ? parseISO(date1) : date1;
  const d2 = typeof date2 === "string" ? parseISO(date2) : date2;
  return Math.abs(differenceInDays(d1, d2));
}

/**
 * Calcula 1RM estimado usando fórmula de Epley
 * 1RM = peso × (1 + reps/30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Calcula 1RM usando fórmula de Brzycki
 * 1RM = peso × (36 / (37 - reps))
 */
export function calculate1RMBrzycki(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 10) return calculate1RM(weight, reps); // Epley es mejor para >10 reps
  return Math.round((weight * 36) / (37 - reps) * 10) / 10;
}

/**
 * Calcula volumen de entrenamiento (peso × reps)
 */
export function calculateVolume(weight: number, reps: number, sets: number = 1): number {
  return weight * reps * sets;
}

/**
 * Convierte RPE a RIR (Reps in Reserve)
 * RPE 10 = 0 RIR
 * RPE 9 = 1 RIR
 * etc.
 */
export function rpeToRir(rpe: number): number {
  return Math.max(0, 10 - rpe);
}

/**
 * Convierte RIR a RPE
 */
export function rirToRpe(rir: number): number {
  return Math.max(0, 10 - rir);
}

/**
 * Calcula el peso sugerido para próxima sesión basado en progreso
 * Si completaste todas las reps objetivo → +2.5-5kg
 * Si fallaste reps → mantener o -2.5kg
 */
export function suggestNextWeight(
  currentWeight: number,
  targetReps: number,
  actualReps: number,
  rpe: number
): number {
  if (actualReps >= targetReps && rpe <= 8) {
    // Completó reps con facilidad → aumentar 5kg
    return currentWeight + 5;
  } else if (actualReps >= targetReps && rpe <= 9) {
    // Completó reps con esfuerzo moderado → aumentar 2.5kg
    return currentWeight + 2.5;
  } else if (actualReps >= targetReps) {
    // Completó reps al límite → mantener
    return currentWeight;
  } else {
    // No completó reps → reducir 2.5kg
    return Math.max(0, currentWeight - 2.5);
  }
}

/**
 * Calcula qué discos usar para alcanzar un peso objetivo
 * Asume barra olímpica de 20kg
 */
export function calculatePlates(
  targetWeight: number,
  barWeight: number = 20
): Array<{ weight: number; quantity: number }> {
  const weightPerSide = (targetWeight - barWeight) / 2;
  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25]; // kg disponibles
  const plates: Array<{ weight: number; quantity: number }> = [];

  let remaining = weightPerSide;

  for (const plate of availablePlates) {
    const quantity = Math.floor(remaining / plate);
    if (quantity > 0) {
      plates.push({ weight: plate, quantity });
      remaining = Math.round((remaining - plate * quantity) * 100) / 100;
    }
  }

  return plates;
}

/**
 * Formatea peso con unidad
 */
export function formatWeight(weight: number): string {
  return `${weight}kg`;
}

/**
 * Formatea duración en minutos a formato legible
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Calcula porcentaje de adherencia
 */
export function calculateAdherence(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Determina si un valor está dentro del rango óptimo
 */
export function isInOptimalRange(value: number, min: number, max: number): "low" | "optimal" | "high" {
  if (value < min) return "low";
  if (value > max) return "high";
  return "optimal";
}

/**
 * Genera un color aleatorio para charts (de la paleta del tema)
 */
export function getChartColor(index: number): string {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // orange
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];
  return colors[index % colors.length];
}

/**
 * Trunca texto a una longitud máxima
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Genera un ID único simple (para uso local, no para DB)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function para inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Parsea rango de reps ("6-8" → [6, 8])
 */
export function parseRepRange(range: string): [number, number] {
  const parts = range.split("-").map((s) => parseInt(s.trim(), 10));
  if (parts.length === 1) {
    return [parts[0], parts[0]];
  }
  return [parts[0], parts[1]];
}

/**
 * Parsea rango de RPE ("7-8" → [7, 8])
 */
export function parseRPERange(range: string): [number, number] {
  const parts = range.split("-").map((s) => parseFloat(s.trim()));
  if (parts.length === 1) {
    return [parts[0], parts[0]];
  }
  return [parts[0], parts[1]];
}

/**
 * Verifica si un workout está completado hoy
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Calcula streak (días consecutivos)
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = dates
    .map((d) => parseISO(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  let currentDate = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const daysDiff = differenceInDays(currentDate, sortedDates[i]);

    if (daysDiff === 1) {
      streak++;
      currentDate = sortedDates[i];
    } else if (daysDiff > 1) {
      break;
    }
  }

  return streak;
}
