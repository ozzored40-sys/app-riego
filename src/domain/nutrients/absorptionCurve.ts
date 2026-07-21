import { MACRO_NUTRIENTS, type MacroNutrient, type NutrientAmounts } from '../types/nutrients';

/** Demanda total (kg/ha) = extracción por tonelada (kg/ton) × rendimiento objetivo (ton/ha). */
export function calcularDemandaTotal(
  extraccionPorTonelada: NutrientAmounts,
  rendimientoObjetivoTonHa: number,
): NutrientAmounts {
  const resultado = {} as NutrientAmounts;
  for (const nutriente of MACRO_NUTRIENTS) {
    resultado[nutriente] = extraccionPorTonelada[nutriente] * rendimientoObjetivoTonHa;
  }
  return resultado;
}

/**
 * Demanda diaria (kg/ha/día) = (demanda total × % de absorción en la etapa) / días de la etapa.
 * porcentajeAbsorcionEtapa está en la escala 0-100.
 */
export function calcularDemandaDiaria(
  demandaTotal: NutrientAmounts,
  porcentajeAbsorcionEtapa: NutrientAmounts,
  diasEtapa: number,
): NutrientAmounts {
  if (diasEtapa <= 0) throw new Error('diasEtapa debe ser mayor a 0');
  const resultado = {} as NutrientAmounts;
  for (const nutriente of MACRO_NUTRIENTS) {
    resultado[nutriente] =
      (demandaTotal[nutriente] * (porcentajeAbsorcionEtapa[nutriente] / 100)) / diasEtapa;
  }
  return resultado;
}

export function sumaPorcentajeAbsorcion(
  etapas: { porcentajeAbsorcion: NutrientAmounts }[],
  nutriente: MacroNutrient,
): number {
  return etapas.reduce((total, etapa) => total + etapa.porcentajeAbsorcion[nutriente], 0);
}
