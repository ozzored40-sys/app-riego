import { ION_DATA } from '../../domain/constants/ionData';
import { convertWaterConcentration } from '../../domain/water/waterAnalysisUnits';
import {
  calcularSAR,
  calcularDureza,
  calcularAlcalinidad,
} from '../../domain/water/waterQualityIndices';
import type { ConcentrationUnit, WaterIon } from '../../domain/types/nutrients';
import type { IonesAgua } from '../db/schema';

const MAPA_IONES: { key: keyof IonesAgua; ion: WaterIon }[] = [
  { key: 'ca', ion: 'Ca' },
  { key: 'mg', ion: 'Mg' },
  { key: 'na', ion: 'Na' },
  { key: 'k', ion: 'K' },
  { key: 'nh4', ion: 'NH4' },
  { key: 'hco3', ion: 'HCO3' },
  { key: 'co3', ion: 'CO3' },
  { key: 'cl', ion: 'Cl' },
  { key: 'so4', ion: 'SO4' },
  { key: 'no3', ion: 'NO3' },
  { key: 'b', ion: 'B' },
  { key: 'fe', ion: 'Fe' },
  { key: 'mn', ion: 'Mn' },
];

/**
 * Normaliza todos los iones capturados a ppm. B, Fe y Mn no tienen valencia definida
 * (se reportan como elemento total, no como ion con carga), así que si el análisis se
 * capturó en meq/L esos tres se tratan como ya capturados en ppm/mg-L (no aplica meq/L
 * a micronutrientes en la práctica de fertirriego).
 */
export function normalizarIonesAPpm(
  ionesCapturados: IonesAgua,
  unidadCaptura: ConcentrationUnit,
): IonesAgua {
  const normalizado = {} as IonesAgua;
  for (const { key, ion } of MAPA_IONES) {
    const soportaMeqL = ION_DATA[ion].valence !== null;
    const unidadEfectiva = !soportaMeqL && unidadCaptura === 'meqL' ? 'ppm' : unidadCaptura;
    normalizado[key] = convertWaterConcentration(ionesCapturados[key], ion, unidadEfectiva, 'ppm');
  }
  return normalizado;
}

export interface IndicesCalidadAgua {
  sar: number;
  dureza: number;
  alcalinidad: number;
}

export function calcularIndicesCalidad(ionesPpm: IonesAgua): IndicesCalidadAgua {
  return {
    sar: calcularSAR({ ca: ionesPpm.ca, mg: ionesPpm.mg, na: ionesPpm.na }),
    dureza: calcularDureza({ ca: ionesPpm.ca, mg: ionesPpm.mg }),
    alcalinidad: calcularAlcalinidad({ hco3: ionesPpm.hco3, co3: ionesPpm.co3 }),
  };
}
