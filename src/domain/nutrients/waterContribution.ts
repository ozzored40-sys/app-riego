import { zeroNutrientAmounts, type MacroNutrient, type NutrientAmounts } from '../types/nutrients';

/**
 * kg/ha aportados por el agua = (ppm del elemento × m³/ha aplicados) / 1000.
 * Ejemplo del spec: agua con 60 ppm de Ca, aplicación de 30 m³/ha/día
 * -> 60 × 30 / 1000 = 1.8 kg Ca/ha/día.
 */
export function calcularAporteAguaPorElemento(
  ppmElemento: number,
  m3PorHaAplicados: number,
): number {
  return (ppmElemento * m3PorHaAplicados) / 1000;
}

/** Masa molar (g/mol) de N y S, usadas para convertir NO3 -> N y SO4 -> S. */
const MASA_MOLAR_N = 14.01;
const MASA_MOLAR_NO3 = 62.0;
const MASA_MOLAR_S = 32.07;
const MASA_MOLAR_SO4 = 96.06;

export const FACTOR_NO3_A_N = MASA_MOLAR_N / MASA_MOLAR_NO3;
export const FACTOR_SO4_A_S = MASA_MOLAR_S / MASA_MOLAR_SO4;

export interface PpmAguaParaNutrientes {
  ca: number;
  mg: number;
  k: number;
  no3: number;
  so4: number;
}

/**
 * Aporte de nutrientes por el agua de riego, en kg/ha/día, para los macros
 * que el análisis de agua reporta directamente (Ca, Mg, K) o vía su forma
 * iónica (N como NO3, S como SO4).
 */
export function calcularAporteAgua(
  ppmAgua: PpmAguaParaNutrientes,
  m3PorHaAplicados: number,
): NutrientAmounts {
  const aporte = zeroNutrientAmounts();
  aporte.Ca = calcularAporteAguaPorElemento(ppmAgua.ca, m3PorHaAplicados);
  aporte.Mg = calcularAporteAguaPorElemento(ppmAgua.mg, m3PorHaAplicados);
  aporte.K = calcularAporteAguaPorElemento(ppmAgua.k, m3PorHaAplicados);
  aporte.N = calcularAporteAguaPorElemento(ppmAgua.no3 * FACTOR_NO3_A_N, m3PorHaAplicados);
  aporte.S = calcularAporteAguaPorElemento(ppmAgua.so4 * FACTOR_SO4_A_S, m3PorHaAplicados);
  // P no se aporta vía agua en fertirriego convencional (fosfatos disueltos en agua cruda son
  // prácticamente inexistentes); se deja en 0 salvo que el análisis reporte lo contrario.
  return aporte;
}

export function elementosSinNutrienteAsociado(): MacroNutrient[] {
  return ['P'];
}
