import type { AppDatabase } from '../data/db/types';
import { obtenerLote } from '../data/repositories/loteRepository';
import { ultimoSoilAnalysisDeLote } from '../data/repositories/soilAnalysisRepository';
import { ultimoSubstrateProfileDeLote } from '../data/repositories/substrateProfileRepository';
import { ultimoWaterAnalysisDeLote } from '../data/repositories/waterAnalysisRepository';
import { ultimoIrrigationSystemDeLote } from '../data/repositories/irrigationSystemRepository';
import { getCropProfile } from '../domain/crops';
import {
  calcularDiagnosticoInicial,
  type DiagnosticoInicial,
  type DiagnosticoInput,
} from '../domain/diagnostics/initialDiagnosis';
import type { Textura } from '../domain/soil/availabilityCoefficient';
import type { SistemaProduccion } from '../domain/types/crop';

/**
 * Reúne los mismos datos persistidos que usa recommendationService y arma el
 * diagnóstico inicial del lote. Devuelve null si todavía falta algún dato base
 * (mismo criterio que verificarDatosLote): el diagnóstico solo tiene sentido una
 * vez que el wizard de configuración está completo.
 */
export function calcularDiagnosticoDeLote(
  db: AppDatabase,
  loteId: string,
): DiagnosticoInicial | null {
  const lote = obtenerLote(db, loteId);
  if (!lote) return null;

  const cultivo = getCropProfile(lote.cropId);
  const riego = ultimoIrrigationSystemDeLote(db, loteId);
  const agua = ultimoWaterAnalysisDeLote(db, loteId);
  if (!riego || !agua) return null;

  let medio: DiagnosticoInput['medio'] | null = null;
  if (lote.sistemaProduccion === 'suelo') {
    const suelo = ultimoSoilAnalysisDeLote(db, loteId);
    if (suelo) {
      medio = {
        tipo: 'suelo',
        pH: suelo.pH,
        ceDsM: suelo.ceDsM,
        textura: suelo.textura as Textura,
        materiaOrganicaPct: suelo.materiaOrganicaPct,
        cicMeq100g: suelo.cicMeq100g,
      };
    }
  } else {
    const sustrato = ultimoSubstrateProfileDeLote(db, loteId);
    if (sustrato) {
      medio = {
        tipo: lote.sistemaProduccion as Exclude<SistemaProduccion, 'suelo'>,
        pH: sustrato.pH ?? undefined,
        ceDsM: sustrato.ceDsM ?? undefined,
      };
    }
  }

  if (!medio) return null;

  return calcularDiagnosticoInicial({
    cultivo,
    medio,
    agua: {
      pH: agua.pH,
      ceDsM: agua.ceDsM,
      sar: agua.sar ?? 0,
      durezaMgLCaCO3: agua.durezaMgLCaCO3 ?? 0,
      alcalinidadMgLCaCO3: agua.alcalinidadMgLCaCO3 ?? 0,
    },
    riego: { eficienciaPct: riego.eficienciaPct },
  });
}
