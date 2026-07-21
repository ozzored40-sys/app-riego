import { MACRO_NUTRIENTS, type NutrientAmounts } from '../types/nutrients';
import {
  calcularCoeficienteAprovechamiento,
  type CondicionesSuelo,
} from './availabilityCoefficient';

/** Aporte efectivo del suelo (kg/ha/día) = nutriente disponible × coeficiente de aprovechamiento. */
export function calcularAporteSuelo(
  nutrienteDisponibleKgHa: NutrientAmounts,
  condiciones: CondicionesSuelo,
): NutrientAmounts {
  const aporte = {} as NutrientAmounts;
  for (const nutriente of MACRO_NUTRIENTS) {
    const coeficiente = calcularCoeficienteAprovechamiento(nutriente, condiciones);
    aporte[nutriente] = nutrienteDisponibleKgHa[nutriente] * coeficiente;
  }
  return aporte;
}
