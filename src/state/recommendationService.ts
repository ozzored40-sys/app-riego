import type { AppDatabase } from '../data/db/types';
import { obtenerLote } from '../data/repositories/loteRepository';
import { ultimoSoilAnalysisDeLote } from '../data/repositories/soilAnalysisRepository';
import { ultimoSubstrateProfileDeLote } from '../data/repositories/substrateProfileRepository';
import { ultimoWaterAnalysisDeLote } from '../data/repositories/waterAnalysisRepository';
import { ultimoIrrigationSystemDeLote } from '../data/repositories/irrigationSystemRepository';
import { listarInventarioFertilizantes } from '../data/repositories/fertilizerInventoryRepository';
import { guardarRecomendacion } from '../data/repositories/recommendationRepository';
import { getCropProfile } from '../domain/crops';
import { computeDailyRecommendation, type EngineInput } from '../domain/engine/pipeline';
import type { DailyRecommendation } from '../domain/types/recommendation';
import type { NutrientAmounts } from '../domain/types/nutrients';
import type { SistemaProduccion } from '../domain/types/crop';
import type { Textura } from '../domain/soil/availabilityCoefficient';
import type { TankId } from '../domain/tanks/compatibility';
import type { ConfigInyeccionTanque } from '../domain/tanks/tankRecipe';

export interface DatosFaltantesLote {
  faltaSueloOSustrato: boolean;
  faltaAgua: boolean;
  faltaRiego: boolean;
}

export function verificarDatosLote(db: AppDatabase, loteId: string): DatosFaltantesLote {
  const lote = obtenerLote(db, loteId);
  const tieneMedio =
    lote?.sistemaProduccion === 'suelo'
      ? !!ultimoSoilAnalysisDeLote(db, loteId)
      : !!ultimoSubstrateProfileDeLote(db, loteId);

  return {
    faltaSueloOSustrato: !tieneMedio,
    faltaAgua: !ultimoWaterAnalysisDeLote(db, loteId),
    faltaRiego: !ultimoIrrigationSystemDeLote(db, loteId),
  };
}

export function loteEstaCompleto(datos: DatosFaltantesLote): boolean {
  return !datos.faltaSueloOSustrato && !datos.faltaAgua && !datos.faltaRiego;
}

/**
 * Eficiencia de absorción por defecto (fracción del nutriente aplicado que la planta
 * efectivamente aprovecha). No hay pantalla de captura para esto en el MVP: se usa un
 * valor de referencia único para los 6 macros, documentado como ajustable a futuro.
 */
const EFICIENCIA_ABSORCION_DEFECTO: NutrientAmounts = {
  N: 0.85,
  P: 0.85,
  K: 0.85,
  Ca: 0.85,
  Mg: 0.85,
  S: 0.85,
};

function diasDesde(fechaISO: string): number {
  const inicio = new Date(fechaISO).getTime();
  const hoy = Date.now();
  return Math.max(0, Math.round((hoy - inicio) / (1000 * 60 * 60 * 24)));
}

/**
 * Configuración de tambos por defecto (volumen, relación de inyección) para el MVP:
 * no hay todavía una pantalla para editar esto por lote, así que se usan valores de
 * referencia razonables. aguaDiariaTotalLitros se recalcula con el resultado real del
 * motor (ver construirYCalcularRecomendacion) para que la dosis de inyección sea correcta.
 */
function configTanquesPorDefecto(
  numeroPulsos: number,
  aguaDiariaTotalLitros: number,
): Record<TankId, ConfigInyeccionTanque> {
  return {
    A: { volumenTanqueLitros: 1000, relacionInyeccion: 100, aguaDiariaTotalLitros, numeroPulsos },
    B: { volumenTanqueLitros: 1000, relacionInyeccion: 150, aguaDiariaTotalLitros, numeroPulsos },
    C: { volumenTanqueLitros: 500, relacionInyeccion: 200, aguaDiariaTotalLitros, numeroPulsos },
  };
}

export interface ClimaManual {
  etoMmDia: number;
  lluviaEfectivaMmDia: number;
}

/**
 * Reúne los datos persistidos del lote (suelo/sustrato, agua, riego, inventario),
 * corre el motor dos veces: la primera con un volumen de agua de tambo provisional
 * (el agua diaria real del lote depende del propio resultado del motor: es la salida
 * del paso 4, y hace falta para dimensionar la inyección de los tambos en los pasos
 * 11-12); la segunda ya con el volumen de agua diaria real. El motor en sí no cambia:
 * esta orquestación de dos pasadas vive aquí, en la capa de integración.
 */
export function construirYCalcularRecomendacion(
  db: AppDatabase,
  loteId: string,
  clima: ClimaManual,
): DailyRecommendation {
  const lote = obtenerLote(db, loteId);
  if (!lote) throw new Error('Lote no encontrado');

  const cultivo = getCropProfile(lote.cropId);
  const inventarioFertilizantes = listarInventarioFertilizantes(db);
  const riego = ultimoIrrigationSystemDeLote(db, loteId);
  if (!riego) throw new Error('Falta configurar el riego de este lote');

  const aguaAnalisis = ultimoWaterAnalysisDeLote(db, loteId);
  if (!aguaAnalisis) throw new Error('Falta el análisis de agua de este lote');

  const medio: EngineInput['medio'] =
    lote.sistemaProduccion === 'suelo'
      ? (() => {
          const suelo = ultimoSoilAnalysisDeLote(db, loteId);
          if (!suelo) throw new Error('Falta el análisis de suelo de este lote');
          return {
            tipo: 'suelo' as const,
            nutrienteDisponibleKgHa: suelo.nutrientesDisponiblesKgHa,
            condiciones: {
              pH: suelo.pH,
              textura: suelo.textura as Textura,
              cicMeq100g: suelo.cicMeq100g,
              materiaOrganicaPct: suelo.materiaOrganicaPct,
              temperaturaSueloC: suelo.temperaturaSueloC ?? 25,
              humedadRelativaCC: 0.8,
            },
          };
        })()
      : (() => {
          const sustrato = ultimoSubstrateProfileDeLote(db, loteId);
          if (!sustrato) throw new Error('Falta el perfil de sustrato de este lote');
          return {
            tipo: lote.sistemaProduccion as Exclude<SistemaProduccion, 'suelo'>,
            porcentajeDrenaje: sustrato.porcentajeDrenajeObjetivo,
          };
        })();

  const baseInput: Omit<EngineInput, 'configTanques'> = {
    cultivo,
    edadDiasCultivo: diasDesde(lote.fechaSiembra),
    etapaIdManual: lote.etapaIdManual ?? undefined,
    rendimientoObjetivoTonHa: lote.rendimientoObjetivoTonHa,
    plantasPorHa: lote.plantasPorHa,
    areaHa: lote.areaHa,
    clima,
    riego: {
      eficiencia: riego.eficienciaPct,
      emisor: { caudalEmisorLH: riego.caudalEmisorLH, emisoresPorPlanta: riego.emisoresPorPlanta },
      numeroPulsos: riego.numeroPulsos,
    },
    aguaAnalisisPpm: {
      ca: aguaAnalisis.ionesNormalizadosPpm.ca,
      mg: aguaAnalisis.ionesNormalizadosPpm.mg,
      k: aguaAnalisis.ionesNormalizadosPpm.k,
      no3: aguaAnalisis.ionesNormalizadosPpm.no3,
      so4: aguaAnalisis.ionesNormalizadosPpm.so4,
    },
    medio,
    eficienciaAbsorcion: EFICIENCIA_ABSORCION_DEFECTO,
    inventarioFertilizantes,
    modoTanqueC: 'acido',
  };

  // Primera pasada: volumen de tambo provisional, solo para obtener agua.m3PorHaDia.
  const primeraPasada = computeDailyRecommendation({
    ...baseInput,
    configTanques: configTanquesPorDefecto(riego.numeroPulsos, 1000),
  });

  const aguaDiariaTotalLitros = primeraPasada.agua.m3PorHaDia * lote.areaHa * 1000;

  // Segunda pasada: ya con el volumen de agua diaria real del lote.
  return computeDailyRecommendation({
    ...baseInput,
    configTanques: configTanquesPorDefecto(riego.numeroPulsos, aguaDiariaTotalLitros),
  });
}

export function calcularYGuardarRecomendacion(
  db: AppDatabase,
  loteId: string,
  clima: ClimaManual,
): DailyRecommendation {
  const recomendacion = construirYCalcularRecomendacion(db, loteId, clima);
  guardarRecomendacion(db, loteId, new Date().toISOString().slice(0, 10), recomendacion);
  return recomendacion;
}
