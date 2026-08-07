import type { AppDatabase } from '../data/db/types';
import {
  crearSensorReading,
  type NuevaSensorReading,
  type TipoLecturaSensor,
} from '../data/repositories/sensorReadingRepository';
import { ultimaRecomendacionDeLote } from '../data/repositories/recommendationRepository';
import { crearAlert } from '../data/repositories/alertRepository';
import { calcularDesviacionPct } from '../domain/monitoring/deviation';
import { evaluarSemaforo, type ResultadoSemaforo } from '../domain/monitoring/semaphore';
import type { DailyRecommendation } from '../domain/types/recommendation';

/**
 * Métricas de sensor que hoy tienen un valor "programado" con el que comparar
 * (viene de la última recomendación diaria calculada). El resto de tipos de
 * lectura se registran igual, pero todavía no generan comparación automática:
 * requeriría modelar más valores objetivo (CE, pH, humedad) en DailyRecommendation.
 */
const METRICAS_COMPARABLES: Partial<
  Record<
    TipoLecturaSensor,
    { etiqueta: string; obtenerProgramado: (r: DailyRecommendation) => number }
  >
> = {
  aguaAplicadaL: {
    etiqueta: 'Agua aplicada por planta',
    obtenerProgramado: (r) => r.agua.litrosPorPlantaDia,
  },
};

export interface ComparacionProgramadoAplicado {
  metrica: string;
  programado: number;
  aplicado: number;
  semaforo: ResultadoSemaforo;
}

export interface ResultadoRegistroLectura {
  comparacion: ComparacionProgramadoAplicado | null;
}

/**
 * Registra una lectura de sensor y, si la métrica tiene un valor programado
 * con el que compararse, calcula la desviación y aplica las reglas de
 * semáforo del spec: verde no hace nada, amarillo y rojo generan una alerta.
 */
export function registrarLecturaYEvaluar(
  db: AppDatabase,
  loteId: string,
  lectura: NuevaSensorReading,
): ResultadoRegistroLectura {
  crearSensorReading(db, lectura);

  const definicion = METRICAS_COMPARABLES[lectura.tipo];
  const ultimaRecomendacion = definicion ? ultimaRecomendacionDeLote(db, loteId) : undefined;
  if (!definicion || !ultimaRecomendacion) return { comparacion: null };

  const recomendacion = ultimaRecomendacion.dataJson as DailyRecommendation;
  const programado = definicion.obtenerProgramado(recomendacion);
  const desviacionPct = calcularDesviacionPct(programado, lectura.valor);
  const semaforo = evaluarSemaforo(desviacionPct);

  if (semaforo.nivel !== 'verde') {
    crearAlert(db, {
      loteId,
      fecha: lectura.fecha,
      nivel: semaforo.nivel,
      metrica: definicion.etiqueta,
      desviacionPct,
      mensaje:
        semaforo.nivel === 'rojo'
          ? `${definicion.etiqueta}: desviación de ${desviacionPct.toFixed(1)}% respecto a lo programado. Requiere validación del técnico antes de ajustar.`
          : `${definicion.etiqueta}: desviación de ${desviacionPct.toFixed(1)}%. Ajuste sugerido: ${(
              semaforo.ajusteSugeridoPct ?? 0
            ).toFixed(1)}% en el próximo programa.`,
      posiblesCausas: semaforo.posiblesCausas,
      accionSugerida:
        semaforo.nivel === 'rojo'
          ? 'Revisar sensor, riego, raíces y clima antes de modificar el programa.'
          : undefined,
    });
  }

  return {
    comparacion: { metrica: definicion.etiqueta, programado, aplicado: lectura.valor, semaforo },
  };
}
