import { convertWaterConcentration } from './waterAnalysisUnits';

export interface WaterIonsPpm {
  ca: number;
  mg: number;
  na: number;
  hco3: number;
  co3: number;
}

/**
 * Relación de Adsorción de Sodio (SAR) = Na(meq/L) / sqrt((Ca(meq/L)+Mg(meq/L))/2)
 * Entradas en ppm (≈ mg/L).
 */
export function calcularSAR(ionesPpm: Pick<WaterIonsPpm, 'ca' | 'mg' | 'na'>): number {
  const caMeqL = convertWaterConcentration(ionesPpm.ca, 'Ca', 'ppm', 'meqL');
  const mgMeqL = convertWaterConcentration(ionesPpm.mg, 'Mg', 'ppm', 'meqL');
  const naMeqL = convertWaterConcentration(ionesPpm.na, 'Na', 'ppm', 'meqL');

  const denominador = Math.sqrt((caMeqL + mgMeqL) / 2);
  if (denominador === 0) return 0;
  return naMeqL / denominador;
}

/**
 * Dureza total, expresada como mg/L de CaCO3.
 * Fórmula estándar: 2.497 * Ca(mg/L) + 4.118 * Mg(mg/L).
 */
export function calcularDureza(ionesPpm: Pick<WaterIonsPpm, 'ca' | 'mg'>): number {
  return 2.497 * ionesPpm.ca + 4.118 * ionesPpm.mg;
}

/**
 * Alcalinidad total, expresada como mg/L de CaCO3.
 * = (HCO3(meq/L) + CO3(meq/L)) * 50 (peso equivalente de CaCO3 = 50 g/eq).
 */
export function calcularAlcalinidad(ionesPpm: Pick<WaterIonsPpm, 'hco3' | 'co3'>): number {
  const hco3MeqL = convertWaterConcentration(ionesPpm.hco3, 'HCO3', 'ppm', 'meqL');
  const co3MeqL = convertWaterConcentration(ionesPpm.co3, 'CO3', 'ppm', 'meqL');
  return (hco3MeqL + co3MeqL) * 50;
}
