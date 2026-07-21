import { ION_DATA, equivalentWeight } from '../constants/ionData';
import type { ConcentrationUnit, WaterIon } from '../types/nutrients';

/**
 * Convierte una concentración de un ion de agua entre ppm, mg/L, meq/L y mmol/L.
 * ppm se trata como equivalente a mg/L (estándar en análisis de agua diluida,
 * donde 1 L ≈ 1 kg).
 */
export function convertWaterConcentration(
  value: number,
  ion: WaterIon,
  from: ConcentrationUnit,
  to: ConcentrationUnit,
): number {
  if (from === to) return value;

  const mgPerL = toMgPerL(value, ion, from);
  return fromMgPerL(mgPerL, ion, to);
}

function toMgPerL(value: number, ion: WaterIon, unit: ConcentrationUnit): number {
  const { molarMassGPerMol } = ION_DATA[ion];
  switch (unit) {
    case 'ppm':
    case 'mgL':
      return value;
    case 'mmolL':
      return value * molarMassGPerMol;
    case 'meqL':
      return value * equivalentWeight(ion);
  }
}

function fromMgPerL(mgPerL: number, ion: WaterIon, unit: ConcentrationUnit): number {
  const { molarMassGPerMol } = ION_DATA[ion];
  switch (unit) {
    case 'ppm':
    case 'mgL':
      return mgPerL;
    case 'mmolL':
      return mgPerL / molarMassGPerMol;
    case 'meqL':
      return mgPerL / equivalentWeight(ion);
  }
}
