import type { AsignacionFertilizante } from '../fertilizers/mixSolver';
import { tanqueAsignadoPorDefecto, type TankId } from './compatibility';

export interface ConfigInyeccionTanque {
  volumenTanqueLitros: number;
  /** Relación de inyección expresada como el denominador de 1:N (ej. 100 para 1:100). */
  relacionInyeccion: number;
  aguaDiariaTotalLitros: number;
  numeroPulsos: number;
}

export interface DosisInyeccion {
  litrosMadrePorDia: number;
  diasDeAutonomia: number;
  litrosMadrePorPulso: number;
}

/**
 * Dado el volumen del tanque madre, la relación de inyección y el agua total
 * diaria del sector, calcula cuántos litros de solución madre se consumen por
 * día y cuántos días dura un tanque preparado.
 * Ejemplo del spec: agua diaria 20,000 L, relación 1:100 -> 200 L madre/día;
 * tanque de 1,000 L -> dura 5 días.
 */
export function calcularDosisInyeccion(config: ConfigInyeccionTanque): DosisInyeccion {
  if (config.relacionInyeccion <= 0) throw new Error('relacionInyeccion debe ser mayor a 0');
  if (config.numeroPulsos <= 0) throw new Error('numeroPulsos debe ser mayor a 0');

  const litrosMadrePorDia = config.aguaDiariaTotalLitros / config.relacionInyeccion;
  const diasDeAutonomia = config.volumenTanqueLitros / litrosMadrePorDia;
  const litrosMadrePorPulso = litrosMadrePorDia / config.numeroPulsos;

  return { litrosMadrePorDia, diasDeAutonomia, litrosMadrePorPulso };
}

/** kg de fertilizante a disolver en el tanque madre para cubrir los días de autonomía calculados. */
export function calcularKgFertilizanteEnTanque(
  kgPorHaDia: number,
  areaHa: number,
  diasDeAutonomia: number,
): number {
  return kgPorHaDia * areaHa * diasDeAutonomia;
}

export interface RecetaTanque {
  tanque: TankId;
  productos: { fertilizante: AsignacionFertilizante['fertilizante']; kgEnTanque: number }[];
  dosis: DosisInyeccion;
}

/**
 * Agrupa las asignaciones de fertilizante (kg/ha/día) por tambo según su
 * categoría, y calcula el kg a disolver en cada tanque madre dado su volumen,
 * relación de inyección y días de autonomía deseados.
 */
export function construirRecetasTanques(
  asignaciones: AsignacionFertilizante[],
  areaHa: number,
  configPorTanque: Record<TankId, ConfigInyeccionTanque>,
): RecetaTanque[] {
  const porTanque: Record<TankId, AsignacionFertilizante[]> = { A: [], B: [], C: [] };
  for (const asignacion of asignaciones) {
    const tanque = tanqueAsignadoPorDefecto(asignacion.fertilizante);
    porTanque[tanque].push(asignacion);
  }

  return (['A', 'B', 'C'] as TankId[]).map((tanque) => {
    const dosis = calcularDosisInyeccion(configPorTanque[tanque]);
    const productos = porTanque[tanque].map((asignacion) => ({
      fertilizante: asignacion.fertilizante,
      kgEnTanque: calcularKgFertilizanteEnTanque(
        asignacion.kgPorHaDia,
        areaHa,
        dosis.diasDeAutonomia,
      ),
    }));
    return { tanque, productos, dosis };
  });
}
