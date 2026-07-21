import type { MacroNutrient } from './nutrients';

export type Micronutrient = 'Fe' | 'Mn' | 'Zn' | 'Cu' | 'B' | 'Mo';

export type TankCategory = 'A' | 'B' | 'C' | 'flexible';

export type EstadoFisico = 'solido' | 'liquido';

export interface FertilizerProduct {
  id: string;
  nombre: string;
  formulaComercial?: string;
  estadoFisico: EstadoFisico;
  /** Composición en forma elemental (% p/p), no en óxidos. */
  composicionPct: Partial<Record<MacroNutrient, number>> & Partial<Record<Micronutrient, number>>;
  /** kg/L, solo para líquidos. */
  densidadKgL?: number;
  /** g/L de solubilidad a temperatura de referencia (20°C), solo para sólidos. */
  solubilidadGL?: number;
  /** Pureza (0-1). */
  pureza: number;
  costoPorKg: number;
  /** Aporte relativo a la CE de la solución (dS/m por g/L), valor de referencia aproximado. */
  factorCE: number;
  porcentajeNa: number;
  porcentajeCl: number;
  categoriaTanque: TankCategory;
  esCustom?: boolean;
}

export function crearFertilizantePersonalizado(
  datos: Omit<FertilizerProduct, 'esCustom'>,
): FertilizerProduct {
  return { ...datos, esCustom: true };
}
