import type { WaterIon } from '../types/nutrients';

/**
 * Masa molar (g/mol) y valencia de cada ion, usadas para convertir entre
 * ppm (≈ mg/L en agua diluida), mg/L, meq/L y mmol/L.
 * B, Fe y Mn se reportan convencionalmente como elemento total (no como ion
 * con valencia fija en fertirriego), por lo que no tienen conversión a meq/L.
 */
export interface IonData {
  molarMassGPerMol: number;
  valence: number | null;
}

export const ION_DATA: Record<WaterIon, IonData> = {
  Ca: { molarMassGPerMol: 40.08, valence: 2 },
  Mg: { molarMassGPerMol: 24.31, valence: 2 },
  Na: { molarMassGPerMol: 22.99, valence: 1 },
  K: { molarMassGPerMol: 39.1, valence: 1 },
  NH4: { molarMassGPerMol: 18.04, valence: 1 },
  HCO3: { molarMassGPerMol: 61.02, valence: 1 },
  CO3: { molarMassGPerMol: 60.01, valence: 2 },
  Cl: { molarMassGPerMol: 35.45, valence: 1 },
  SO4: { molarMassGPerMol: 96.06, valence: 2 },
  NO3: { molarMassGPerMol: 62.0, valence: 1 },
  B: { molarMassGPerMol: 10.81, valence: null },
  Fe: { molarMassGPerMol: 55.85, valence: null },
  Mn: { molarMassGPerMol: 54.94, valence: null },
};

/** Peso equivalente (g/eq) = masa molar / valencia. */
export function equivalentWeight(ion: WaterIon): number {
  const { molarMassGPerMol, valence } = ION_DATA[ion];
  if (valence === null) {
    throw new Error(`El ion ${ion} no tiene valencia definida para conversión a meq/L`);
  }
  return molarMassGPerMol / valence;
}
