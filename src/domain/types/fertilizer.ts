import type { MacroNutrient } from './nutrients';

export type Micronutrient = 'Fe' | 'Mn' | 'Zn' | 'Cu' | 'B' | 'Mo';

export type TankCategory = 'A' | 'B' | 'C' | 'flexible';

export type EstadoFisico = 'solido' | 'liquido';

/**
 * Clasificación del insumo dentro del catálogo general de Chamán (más amplio que solo
 * fertirriego): ver sección 7 del documento "AgroChamán 69" (Fertirriego, Enraizador,
 * Mejoradores de suelo, Biológicos, Foliar, Tecnología Ozono Chamán). Solo 'fertilizante'
 * participa hoy en el solver de mezcla y los tambos A/B/C; el resto de categorías se
 * catalogan (ficha técnica, precio, presentación) pero no entran al cálculo de fertirriego.
 */
export type CategoriaInsumo =
  | 'fertilizante'
  | 'enraizador'
  | 'mejoradorSuelo'
  | 'biologico'
  | 'foliar'
  | 'bioestimulante'
  | 'ozonoChaman'
  | 'otro';

export type UnidadPrecio = 'kg' | 'L' | 'unidad';

/**
 * Entrada del catálogo de insumos. Históricamente representaba solo fertilizantes de
 * fertirriego (de ahí el nombre); se amplió para cubrir el catálogo completo de insumos
 * de un programa Chamán. Los campos de composición/tambo/CE/Na/Cl son específicos de
 * fertirriego y solo se usan cuando categoriaInsumo === 'fertilizante'; para el resto de
 * categorías se dejan en sus valores por defecto (no participan en el solver porque este
 * filtra por composicionPct > 0, ver fertilizers/mixSolver.ts).
 */
export interface FertilizerProduct {
  id: string;
  nombre: string;
  categoriaInsumo: CategoriaInsumo;
  formulaComercial?: string;
  estadoFisico: EstadoFisico;
  /** Composición en forma elemental (% p/p), no en óxidos. Vacío para insumos no fertirriego. */
  composicionPct: Partial<Record<MacroNutrient, number>> & Partial<Record<Micronutrient, number>>;
  /** kg/L, solo para líquidos. */
  densidadKgL?: number;
  /** g/L de solubilidad a temperatura de referencia (20°C), solo para sólidos. */
  solubilidadGL?: number;
  /** Pureza (0-1). */
  pureza: number;
  costoPorKg: number;
  /** Unidad sobre la que aplica costoPorKg cuando el insumo no se dosifica por kg (ej. biológicos por L o por unidad). Default 'kg'. */
  unidadPrecio?: UnidadPrecio;
  /** Presentación comercial tal como la vende el proveedor (ej. "Bidón 20 L", "Saco 25 kg"). */
  presentacionComercial?: string;
  /** Referencia (URL o ruta) a la ficha técnica del producto, cuando esté disponible. */
  fichaTecnicaUrl?: string;
  /** Aporte relativo a la CE de la solución (dS/m por g/L), valor de referencia aproximado. 0 si no aplica/no se conoce. */
  factorCE: number;
  porcentajeNa: number;
  porcentajeCl: number;
  /** Solo relevante para categoriaInsumo === 'fertilizante'. */
  categoriaTanque?: TankCategory;
  esCustom?: boolean;
}

export function crearFertilizantePersonalizado(
  datos: Omit<FertilizerProduct, 'esCustom'>,
): FertilizerProduct {
  return { ...datos, esCustom: true };
}
