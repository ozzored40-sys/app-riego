import type { AppDatabase } from '../data/db/types';
import { obtenerLote } from '../data/repositories/loteRepository';
import { getCropProfile } from '../domain/crops';
import { etapaPorEdad } from '../domain/types/crop';
import { calcularDiagnosticoDeLote } from './diagnosisService';

/**
 * Info base de un lote (cultivo, etapa, diagnóstico por reglas) compartida por los
 * asistentes de IA que necesitan contexto del lote: el agrónomo virtual
 * (agronomistService.ts) y el agente de ventas (salesAgentService.ts).
 */
export interface InfoBaseLote {
  cultivoNombre: string;
  etapaFenologica?: string;
  sistemaProduccion: string;
  edadDiasCultivo: number;
  ultimoDiagnosticoReglas?: string;
}

export function diasDesdeFecha(fechaISO: string): number {
  const inicio = new Date(fechaISO).getTime();
  return Math.max(0, Math.round((Date.now() - inicio) / (1000 * 60 * 60 * 24)));
}

export function obtenerInfoBaseLote(db: AppDatabase, loteId: string): InfoBaseLote {
  const lote = obtenerLote(db, loteId);
  if (!lote) throw new Error('Lote no encontrado');

  const cultivo = getCropProfile(lote.cropId);
  const edadDiasCultivo = diasDesdeFecha(lote.fechaSiembra);
  const etapa = lote.etapaIdManual
    ? cultivo.etapas.find((e) => e.id === lote.etapaIdManual)
    : etapaPorEdad(cultivo, edadDiasCultivo);

  const diagnostico = calcularDiagnosticoDeLote(db, loteId);
  const hallazgosRelevantes = diagnostico?.hallazgos.filter((h) => h.nivel !== 'ok') ?? [];
  const ultimoDiagnosticoReglas =
    diagnostico && hallazgosRelevantes.length > 0
      ? `Nivel general ${diagnostico.resumen}. ${hallazgosRelevantes.map((h) => h.mensaje).join(' ')}`
      : diagnostico
        ? `Nivel general ${diagnostico.resumen}, sin hallazgos fuera de rango.`
        : undefined;

  return {
    cultivoNombre: cultivo.nombre,
    etapaFenologica: etapa?.nombre,
    sistemaProduccion: lote.sistemaProduccion,
    edadDiasCultivo,
    ultimoDiagnosticoReglas,
  };
}
