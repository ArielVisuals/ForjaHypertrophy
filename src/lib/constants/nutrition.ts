/** Franjas del dia para las comidas del plan alimenticio. */

export const MEAL_SLOTS = ["desayuno", "almuerzo", "comida", "cena", "snack"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MEAL_SLOT_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  comida: "Comida",
  cena: "Cena",
  snack: "Snack",
};
