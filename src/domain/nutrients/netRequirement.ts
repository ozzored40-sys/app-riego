import { MACRO_NUTRIENTS, type NutrientAmounts } from '../types/nutrients';

/**
 * Necesidad neta a fertilizar (kg/ha/día) = demanda diaria − aporte del agua − aporte del suelo.
 * Nunca negativa: si el agua/suelo ya cubren la demanda, la necesidad neta es 0
 * (no se debe "restar" fertilizante, solo dejar de aplicarlo).
 */
export function calcularNecesidadNeta(
  demandaDiaria: NutrientAmounts,
  aporteAgua: NutrientAmounts,
  aporteSuelo: NutrientAmounts,
): NutrientAmounts {
  const neto = {} as NutrientAmounts;
  for (const nutriente of MACRO_NUTRIENTS) {
    neto[nutriente] = Math.max(
      0,
      demandaDiaria[nutriente] - aporteAgua[nutriente] - aporteSuelo[nutriente],
    );
  }
  return neto;
}

/**
 * Ajusta la necesidad neta por la eficiencia de absorción del fertilizante aplicado
 * (no todo el nutriente aplicado es tomado por la planta): kg a aplicar = neto / eficiencia.
 * eficienciaAbsorcion en (0, 1].
 */
export function ajustarPorEficienciaAbsorcion(
  necesidadNeta: NutrientAmounts,
  eficienciaAbsorcion: NutrientAmounts,
): NutrientAmounts {
  const ajustado = {} as NutrientAmounts;
  for (const nutriente of MACRO_NUTRIENTS) {
    const eficiencia = eficienciaAbsorcion[nutriente];
    if (eficiencia <= 0 || eficiencia > 1) {
      throw new Error(`Eficiencia de absorción inválida para ${nutriente}: ${eficiencia}`);
    }
    ajustado[nutriente] = necesidadNeta[nutriente] / eficiencia;
  }
  return ajustado;
}
