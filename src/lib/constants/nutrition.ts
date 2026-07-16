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

/** Unidades de medida para ingredientes del plan alimenticio. */
export const INGREDIENT_UNITS = [
  { value: "pza",   label: "pza" },   // piezas / unidades
  { value: "g",     label: "g" },
  { value: "kg",    label: "kg" },
  { value: "ml",    label: "ml" },
  { value: "l",     label: "l" },
  { value: "taza",  label: "taza" },
  { value: "cda",   label: "cda" },   // cucharada
  { value: "cdta",  label: "cdta" },  // cucharadita
  { value: "scoop", label: "scoop" },
] as const;

export interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

/** "80 g avena" / "1 pza platano" — para mostrar al atleta. */
export function formatIngredient(ing: Ingredient): string {
  return `${ing.qty} ${ing.unit} ${ing.name}`.trim();
}
