import type { AppDatabase } from '../data/db/types';
import { historialRecomendacionesDeLote } from '../data/repositories/recommendationRepository';
import { listarAlertasDeLote } from '../data/repositories/alertRepository';
import type { DailyRecommendation } from '../domain/types/recommendation';
import type { NivelSemaforo } from '../domain/monitoring/semaphore';

export interface ResumenLote {
  numeroRecomendaciones: number;
  aguaPromedioLitrosPorPlantaDia: number;
  costoAcumulado: number;
  costoPromedioDiario: number;
  alertasPorNivel: Record<NivelSemaforo, number>;
  alertasActivas: number;
  historial: {
    fecha: string;
    etapaId: string;
    litrosPorPlantaDia: number;
    costoDiarioTotal: number;
  }[];
}

/** Agrega el historial de recomendaciones y alertas de un lote para la pantalla de Resultados. */
export function calcularResumenLote(db: AppDatabase, loteId: string): ResumenLote {
  const historialFilas = historialRecomendacionesDeLote(db, loteId);
  const alertas = listarAlertasDeLote(db, loteId);

  const historial = historialFilas.map((fila) => {
    const data = fila.dataJson as DailyRecommendation;
    return {
      fecha: fila.fecha,
      etapaId: fila.etapaId,
      litrosPorPlantaDia: data.agua.litrosPorPlantaDia,
      costoDiarioTotal: data.costoDiarioTotal,
    };
  });

  const numeroRecomendaciones = historial.length;
  const aguaPromedioLitrosPorPlantaDia =
    numeroRecomendaciones === 0
      ? 0
      : historial.reduce((total, r) => total + r.litrosPorPlantaDia, 0) / numeroRecomendaciones;
  const costoAcumulado = historial.reduce((total, r) => total + r.costoDiarioTotal, 0);
  const costoPromedioDiario =
    numeroRecomendaciones === 0 ? 0 : costoAcumulado / numeroRecomendaciones;

  const alertasPorNivel: Record<NivelSemaforo, number> = { verde: 0, amarillo: 0, rojo: 0 };
  for (const alerta of alertas) {
    alertasPorNivel[alerta.nivel as NivelSemaforo] += 1;
  }

  return {
    numeroRecomendaciones,
    aguaPromedioLitrosPorPlantaDia,
    costoAcumulado,
    costoPromedioDiario,
    alertasPorNivel,
    alertasActivas: alertas.filter((a) => !a.resuelto).length,
    historial,
  };
}
