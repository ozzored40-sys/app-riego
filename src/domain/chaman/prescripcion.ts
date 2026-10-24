import { obtenerCultivoChaman, type ClaveCultivoChaman } from './cultivos';
import {
  obtenerProducto,
  type ClaveProducto,
  type MetodoAplicacion,
  type ProductoChaman,
} from './productos';

/**
 * Prescripción de campo Chamán 4.0: a partir del cultivo, el problema observado y los
 * datos del lote, calcula dosis, concentración de ozono, volúmenes y costo estimado.
 *
 * Diferencias deliberadas respecto al prototipo web de AI Studio:
 * - La dosis por hectárea sale del rango de la ficha del producto (antes se mezclaba con
 *   "5 ml/planta", que a 60,000 pl/ha daba 300 L/ha, incompatible con la ficha de 3-4 L/ha).
 * - El ahorro se calcula tal cual (puede ser cero o negativo); antes se forzaba a un
 *   mínimo del 70% del costo, lo que mostraba ahorros aunque no existieran.
 * - No se agregan "controles de laboratorio" fijos (inhibición in vitro, lote de
 *   laboratorio, etc.) que no provenían de ningún análisis real del lote.
 */

export type Severidad = 'Leve' | 'Moderado' | 'Crítico';
export type NivelCarbonatos = 'Bajo' | 'Medio' | 'Alto';

export interface DatosPrescripcion {
  cultivo: ClaveCultivoChaman;
  producto: ClaveProducto;
  superficieHa: number;
  severidad: Severidad;
  metodo?: MetodoAplicacion;
  densidadPlantasHa?: number;
  aguaPorPlantaMl?: number;
  phSuelo?: number;
  carbonatos?: NivelCarbonatos;
}

export interface Prescripcion {
  producto: ProductoChaman;
  metodo: MetodoAplicacion;
  ppmOzono: number;
  dosisLHa: number;
  aplicaciones: number;
  productoTotalLitros: number;
  aguaPortadoraLHa: number;
  densidadPlantasHa: number;
  totalPlantas: number;
  costoEstimadoMxn: number;
  costoConvencionalMxn: number;
  ahorroEstimadoMxn: number;
  notasTecnicas: string[];
}

/**
 * Fracción del costo convencional por hectárea que corresponde al programa
 * fitosanitario sustituible (mismo supuesto del prototipo web).
 */
export const FRACCION_FITOSANITARIA_CONVENCIONAL = 0.45;
export const PPM_MAXIMO_BIOFILM = 3.5;
export const PH_ALCALINO = 7.5;

const APLICACIONES_POR_SEVERIDAD: Record<Severidad, number> = {
  Leve: 2,
  Moderado: 2,
  Crítico: 3,
};

function redondear(valor: number, decimales = 1): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

function dosisSegunSeveridad(producto: ProductoChaman, severidad: Severidad): number {
  const { min, max } = producto.dosisLHa;
  if (severidad === 'Leve') return min;
  if (severidad === 'Crítico') return max;
  return redondear((min + max) / 2);
}

export function calcularPrescripcion(datos: DatosPrescripcion): Prescripcion {
  if (!(datos.superficieHa > 0)) {
    throw new Error('La superficie debe ser mayor a 0 hectáreas');
  }
  const cultivo = obtenerCultivoChaman(datos.cultivo);
  const producto = obtenerProducto(datos.producto);
  const metodo = datos.metodo ?? producto.metodoSugerido;
  const notasTecnicas: string[] = [];

  let ppmOzono = metodo === 'foliar' ? cultivo.ppmOzono.foliar : cultivo.ppmOzono.drench;
  if (datos.phSuelo !== undefined && datos.phSuelo > PH_ALCALINO) {
    ppmOzono = redondear(ppmOzono + 0.5);
    notasTecnicas.push(
      `pH de suelo ${datos.phSuelo} (alcalino): se sube la concentración de O₃ en 0.5 ppm.`,
    );
  }
  if (datos.carbonatos === 'Alto') {
    ppmOzono = Math.max(ppmOzono, PPM_MAXIMO_BIOFILM);
    notasTecnicas.push(
      'Carbonatos altos / biofilm: purgar cintillas al final del ciclo con O₃ a 3.5 ppm.',
    );
  }

  const densidadPlantasHa =
    datos.densidadPlantasHa && datos.densidadPlantasHa > 0
      ? datos.densidadPlantasHa
      : cultivo.densidadPlantasHa;
  const totalPlantas = Math.round(datos.superficieHa * densidadPlantasHa);

  const aguaPortadoraLHa =
    datos.aguaPorPlantaMl && datos.aguaPorPlantaMl > 0
      ? Math.round((densidadPlantasHa * datos.aguaPorPlantaMl) / 1000)
      : Math.round((cultivo.aguaLHa.min + cultivo.aguaLHa.max) / 2);

  const dosisLHa = dosisSegunSeveridad(producto, datos.severidad);
  const aplicaciones = APLICACIONES_POR_SEVERIDAD[datos.severidad];
  const productoTotalLitros = redondear(dosisLHa * datos.superficieHa * aplicaciones);

  const costoEstimadoMxn = Math.round(
    producto.costoReferenciaHaMxn * datos.superficieHa * aplicaciones,
  );
  const costoConvencionalMxn = Math.round(
    cultivo.costoConvencionalHaMxn * datos.superficieHa * FRACCION_FITOSANITARIA_CONVENCIONAL,
  );

  if (datos.severidad === 'Crítico') {
    notasTecnicas.push(
      'Severidad crítica: se recomienda visita técnica en campo antes de la primera aplicación.',
    );
  }

  return {
    producto,
    metodo,
    ppmOzono,
    dosisLHa,
    aplicaciones,
    productoTotalLitros,
    aguaPortadoraLHa,
    densidadPlantasHa,
    totalPlantas,
    costoEstimadoMxn,
    costoConvencionalMxn,
    ahorroEstimadoMxn: costoConvencionalMxn - costoEstimadoMxn,
    notasTecnicas,
  };
}

/**
 * Folio del dictamen: DOC-CHAM-<año>-<consecutivo de 4 dígitos>. El consecutivo lo da
 * quien llama (p. ej. número de dictámenes del año + 1) para que sea único y ordenado,
 * no aleatorio como en el prototipo.
 */
export function generarFolio(fecha: Date, consecutivo: number): string {
  return `DOC-CHAM-${fecha.getFullYear()}-${String(consecutivo).padStart(4, '0')}`;
}
