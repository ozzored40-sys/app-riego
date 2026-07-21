export const MACRO_NUTRIENTS = ['N', 'P', 'K', 'Ca', 'Mg', 'S'] as const;
export type MacroNutrient = (typeof MACRO_NUTRIENTS)[number];

export type NutrientAmounts = Record<MacroNutrient, number>;

export const WATER_IONS = [
  'Ca',
  'Mg',
  'Na',
  'K',
  'NH4',
  'HCO3',
  'CO3',
  'Cl',
  'SO4',
  'NO3',
  'B',
  'Fe',
  'Mn',
] as const;
export type WaterIon = (typeof WATER_IONS)[number];

export const CONCENTRATION_UNITS = ['ppm', 'mgL', 'meqL', 'mmolL'] as const;
export type ConcentrationUnit = (typeof CONCENTRATION_UNITS)[number];

export function zeroNutrientAmounts(): NutrientAmounts {
  return { N: 0, P: 0, K: 0, Ca: 0, Mg: 0, S: 0 };
}
