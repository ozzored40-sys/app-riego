import {
  MACRO_NUTRIENTS,
  zeroNutrientAmounts,
  type MacroNutrient,
  type NutrientAmounts,
} from '../types/nutrients';
import type { FertilizerProduct } from '../types/fertilizer';

export interface AsignacionFertilizante {
  fertilizante: FertilizerProduct;
  kgPorHaDia: number;
}

export interface ResultadoMezcla {
  asignaciones: AsignacionFertilizante[];
  cubierto: NutrientAmounts;
  faltante: NutrientAmounts;
  exceso: NutrientAmounts;
}

/** Orden en el que se resuelve cada nutriente. Calcio primero (fuentes limitadas y
 * suele fijar el nitrógeno base), N al final (se ajusta con una fuente pura como urea). */
const ORDEN_RESOLUCION: MacroNutrient[] = ['Ca', 'K', 'P', 'Mg', 'S', 'N'];

const EPSILON_KG_HA = 1e-6;

/**
 * Heurística determinista de asignación de fertilizantes: para cada nutriente,
 * en el orden definido en ORDEN_RESOLUCION, elige el producto disponible más
 * barato por kg de nutriente puro (desempate por menor aporte de CE, Na y Cl),
 * calcula el kg de producto necesario para cubrir lo que falte de ese nutriente,
 * y descuenta lo que ese producto aporta a TODOS los demás nutrientes (porque
 * los fertilizantes comerciales son multi-elemento).
 *
 * No es un óptimo global (no usa programación lineal): es una aproximación
 * determinista y auditable, aislada detrás de esta función para poder
 * sustituirse por un solver real si el inventario crece en complejidad.
 */
export function resolverMezclaFertilizantes(
  necesidadNetaKgHaDia: NutrientAmounts,
  inventarioDisponible: FertilizerProduct[],
): ResultadoMezcla {
  const restante: NutrientAmounts = { ...necesidadNetaKgHaDia };
  const asignacionesPorId = new Map<string, number>();

  for (const nutriente of ORDEN_RESOLUCION) {
    if (restante[nutriente] <= EPSILON_KG_HA) continue;

    const candidato = elegirMejorCandidato(nutriente, inventarioDisponible);
    if (!candidato) continue;

    const pctNutriente = (candidato.composicionPct[nutriente] ?? 0) / 100;
    if (pctNutriente <= 0) continue;

    const kgProducto = restante[nutriente] / pctNutriente;
    asignacionesPorId.set(candidato.id, (asignacionesPorId.get(candidato.id) ?? 0) + kgProducto);

    for (const otroNutriente of MACRO_NUTRIENTS) {
      const aportePct = (candidato.composicionPct[otroNutriente] ?? 0) / 100;
      restante[otroNutriente] -= kgProducto * aportePct;
    }
  }

  const faltante = zeroNutrientAmounts();
  const exceso = zeroNutrientAmounts();
  for (const nutriente of MACRO_NUTRIENTS) {
    if (restante[nutriente] > 0) faltante[nutriente] = restante[nutriente];
    else exceso[nutriente] = -restante[nutriente];
  }

  const cubierto = zeroNutrientAmounts();
  for (const nutriente of MACRO_NUTRIENTS) {
    cubierto[nutriente] = necesidadNetaKgHaDia[nutriente] - faltante[nutriente];
  }

  const asignaciones: AsignacionFertilizante[] = Array.from(asignacionesPorId.entries()).map(
    ([id, kgPorHaDia]) => ({
      fertilizante: inventarioDisponible.find((f) => f.id === id)!,
      kgPorHaDia,
    }),
  );

  return { asignaciones, cubierto, faltante, exceso };
}

function elegirMejorCandidato(
  nutriente: MacroNutrient,
  inventario: FertilizerProduct[],
): FertilizerProduct | undefined {
  const candidatos = inventario.filter((f) => (f.composicionPct[nutriente] ?? 0) > 0);
  if (candidatos.length === 0) return undefined;

  return candidatos.reduce((mejor, actual) => {
    const costoActual = costoPorKgDeNutriente(actual, nutriente);
    const costoMejor = costoPorKgDeNutriente(mejor, nutriente);
    if (costoActual < costoMejor) return actual;
    if (costoActual > costoMejor) return mejor;
    // Desempate: menor aporte de sodio/cloro, luego menor factor de CE.
    const salinidadActual = actual.porcentajeNa + actual.porcentajeCl;
    const salinidadMejor = mejor.porcentajeNa + mejor.porcentajeCl;
    if (salinidadActual !== salinidadMejor)
      return salinidadActual < salinidadMejor ? actual : mejor;
    return actual.factorCE < mejor.factorCE ? actual : mejor;
  });
}

function costoPorKgDeNutriente(producto: FertilizerProduct, nutriente: MacroNutrient): number {
  const pct = (producto.composicionPct[nutriente] ?? 0) / 100;
  if (pct <= 0) return Infinity;
  return producto.costoPorKg / pct;
}
