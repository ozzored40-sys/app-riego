import { MACRO_NUTRIENTS, type NutrientAmounts } from '../types/nutrients';
import { etapaPorEdad, type CropProfile, type SistemaProduccion } from '../types/crop';
import type { FertilizerProduct } from '../types/fertilizer';
import type { DailyRecommendation } from '../types/recommendation';

import { calcularDemandaTotal, calcularDemandaDiaria } from '../nutrients/absorptionCurve';
import { calcularAporteAgua, type PpmAguaParaNutrientes } from '../nutrients/waterContribution';
import { calcularNecesidadNeta, ajustarPorEficienciaAbsorcion } from '../nutrients/netRequirement';
import { kgPorHaAGramosPorPlanta } from '../nutrients/unitConversion';

import { calcularETc, calcularAguaNeta, calcularAguaBruta } from '../water/eto';
import {
  mmDiaAM3PorHaDia,
  calcularLitrosPorPlantaPorDia,
  calcularM3PorHaDia,
} from '../water/waterVolumes';
import { calcularAguaTotalConDrenaje } from '../water/substrateWater';
import {
  calcularLitrosPorPulso,
  calcularMinutosPorPulso,
  type EmisorConfig,
} from '../water/pulses';

import { calcularAporteSuelo } from '../soil/soilContribution';
import type { CondicionesSuelo } from '../soil/availabilityCoefficient';

import { resolverMezclaFertilizantes } from '../fertilizers/mixSolver';
import {
  tanqueAsignadoPorDefecto,
  verificarCompatibilidadTanque,
  type ConflictoCompatibilidad,
  type TankCMode,
  type TankId,
} from '../tanks/compatibility';
import { construirRecetasTanques, type ConfigInyeccionTanque } from '../tanks/tankRecipe';

export type MedioInput =
  | {
      tipo: 'suelo';
      nutrienteDisponibleKgHa: NutrientAmounts;
      condiciones: CondicionesSuelo;
    }
  | {
      tipo: Exclude<SistemaProduccion, 'suelo'>;
      porcentajeDrenaje: number;
    };

export interface EngineInput {
  cultivo: CropProfile;
  /** Si se da etapaIdManual, tiene prioridad sobre el cálculo automático por edad. */
  edadDiasCultivo: number;
  etapaIdManual?: string;

  rendimientoObjetivoTonHa: number;
  plantasPorHa: number;
  areaHa: number;

  clima: { etoMmDia: number; lluviaEfectivaMmDia: number };
  riego: {
    eficiencia: number;
    emisor: EmisorConfig;
    numeroPulsos: number;
  };

  aguaAnalisisPpm: PpmAguaParaNutrientes;
  medio: MedioInput;
  eficienciaAbsorcion: NutrientAmounts;

  inventarioFertilizantes: FertilizerProduct[];
  configTanques: Record<TankId, ConfigInyeccionTanque>;
  modoTanqueC: TankCMode;
}

/**
 * Orquesta el pipeline de 15 pasos descrito en la sección 12 del spec (1-13 aquí;
 * los pasos 14-15, comparar contra sensores y corregir la siguiente recomendación,
 * viven en monitoring/deviation.ts y monitoring/semaphore.ts y se aplican desde la
 * capa de estado/UI, no dentro de este cálculo puro).
 */
export function computeDailyRecommendation(input: EngineInput): DailyRecommendation {
  // 1. Identificar cultivo, etapa y rendimiento objetivo.
  const etapa = input.etapaIdManual
    ? (input.cultivo.etapas.find((e) => e.id === input.etapaIdManual) ??
      etapaPorEdad(input.cultivo, input.edadDiasCultivo))
    : etapaPorEdad(input.cultivo, input.edadDiasCultivo);

  // 2. Curva de absorción nutrimental -> demanda total y demanda diaria.
  const demandaTotal = calcularDemandaTotal(
    input.cultivo.extraccionPorTonelada,
    input.rendimientoObjetivoTonHa,
  );
  const demandaDiaria = calcularDemandaDiaria(
    demandaTotal,
    etapa.porcentajeAbsorcion,
    etapa.duracionDias,
  );

  // 3. Kc y requerimiento hídrico (ETc, agua neta, agua bruta).
  const etcMmDia = calcularETc(input.clima.etoMmDia, etapa.kc);
  const aguaNetaMmDia = calcularAguaNeta(etcMmDia, input.clima.lluviaEfectivaMmDia);
  const aguaBrutaMmDia = calcularAguaBruta(aguaNetaMmDia, input.riego.eficiencia);

  // 4. Demanda diaria de agua, en las escalas de campo.
  let m3PorHaDia = mmDiaAM3PorHaDia(aguaBrutaMmDia);
  let litrosPorPlantaDia = calcularLitrosPorPlantaPorDia(m3PorHaDia, input.plantasPorHa);
  if (input.medio.tipo !== 'suelo') {
    litrosPorPlantaDia = calcularAguaTotalConDrenaje(
      litrosPorPlantaDia,
      input.medio.porcentajeDrenaje,
    );
    m3PorHaDia = calcularM3PorHaDia(litrosPorPlantaDia, input.plantasPorHa);
  }

  // 5. (demandaDiaria ya calculada en el paso 2)

  // 6. Restar aportes del agua.
  const aporteAgua = calcularAporteAgua(input.aguaAnalisisPpm, m3PorHaDia);

  // 7. Restar aporte efectivo del suelo/sustrato.
  const aporteSuelo =
    input.medio.tipo === 'suelo'
      ? calcularAporteSuelo(input.medio.nutrienteDisponibleKgHa, input.medio.condiciones)
      : ({ N: 0, P: 0, K: 0, Ca: 0, Mg: 0, S: 0 } as NutrientAmounts);

  const necesidadNeta = calcularNecesidadNeta(demandaDiaria, aporteAgua, aporteSuelo);

  // 8. Ajustar por eficiencia de absorción.
  const necesidadNetaAjustada = ajustarPorEficienciaAbsorcion(
    necesidadNeta,
    input.eficienciaAbsorcion,
  );

  // 9. Convertir nutrientes en fertilizantes comerciales.
  const mezclaFertilizantes = resolverMezclaFertilizantes(
    necesidadNetaAjustada,
    input.inventarioFertilizantes,
  );

  // 10. Separar los fertilizantes por compatibilidad (agrupar por tanque + verificar conflictos).
  const conflictosCompatibilidad: ConflictoCompatibilidad[] = [];
  const porTanque: Record<TankId, typeof mezclaFertilizantes.asignaciones> = {
    A: [],
    B: [],
    C: [],
  };
  for (const asignacion of mezclaFertilizantes.asignaciones) {
    porTanque[tanqueAsignadoPorDefecto(asignacion.fertilizante)].push(asignacion);
  }
  for (const tanque of ['A', 'B', 'C'] as TankId[]) {
    const productos = porTanque[tanque].map((a) => a.fertilizante);
    conflictosCompatibilidad.push(
      ...verificarCompatibilidadTanque(
        tanque,
        productos,
        tanque === 'C' ? input.modoTanqueC : undefined,
      ),
    );
  }

  // 11 y 12. Calcular Tambo A, B, C y su volumen/dosis de inyección.
  const tanques = construirRecetasTanques(
    mezclaFertilizantes.asignaciones,
    input.areaHa,
    input.configTanques,
  );

  // 13. Calcular pulsos y minutos de riego.
  const litrosPorPulso = calcularLitrosPorPulso(litrosPorPlantaDia, input.riego.numeroPulsos);
  const minutosPorPulso = calcularMinutosPorPulso(litrosPorPulso, input.riego.emisor);

  const nutrientes = MACRO_NUTRIENTS.map((nutriente) => ({
    nutriente,
    demandaKgHaDia: demandaDiaria[nutriente],
    aporteAguaKgHaDia: aporteAgua[nutriente],
    aporteSueloKgHaDia: aporteSuelo[nutriente],
    netoKgHaDia: necesidadNeta[nutriente],
    netoAjustadoKgHaDia: necesidadNetaAjustada[nutriente],
    gPorPlantaDia: kgPorHaAGramosPorPlanta(necesidadNetaAjustada[nutriente], input.plantasPorHa),
  }));

  const costoDiarioTotal = mezclaFertilizantes.asignaciones.reduce(
    (total, asignacion) =>
      total + asignacion.kgPorHaDia * input.areaHa * asignacion.fertilizante.costoPorKg,
    0,
  );

  return {
    etapa,
    agua: {
      litrosPorPlantaDia,
      m3PorHaDia,
      litrosPorPulso,
      minutosPorPulso,
      numeroPulsos: input.riego.numeroPulsos,
    },
    nutrientes,
    mezclaFertilizantes,
    tanques,
    conflictosCompatibilidad,
    costoDiarioTotal,
  };
}
