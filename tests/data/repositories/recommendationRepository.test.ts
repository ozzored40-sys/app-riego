import { crearBaseDeDatosDePrueba } from '../testDb';
import {
  guardarRecomendacion,
  ultimaRecomendacionDeLote,
} from '../../../src/data/repositories/recommendationRepository';
import { computeDailyRecommendation, type EngineInput } from '../../../src/domain/engine/pipeline';
import { jitomate } from '../../../src/domain/crops/jitomate';
import { FERTILIZER_LIBRARY } from '../../../src/domain/fertilizers/library';
import { zeroNutrientAmounts } from '../../../src/domain/types/nutrients';

function fixtureEngineInput(): EngineInput {
  return {
    cultivo: jitomate,
    edadDiasCultivo: 60,
    rendimientoObjetivoTonHa: 80,
    plantasPorHa: 20000,
    areaHa: 2,
    clima: { etoMmDia: 5, lluviaEfectivaMmDia: 0 },
    riego: {
      eficiencia: 0.9,
      emisor: { caudalEmisorLH: 2, emisoresPorPlanta: 1 },
      numeroPulsos: 6,
    },
    aguaAnalisisPpm: { ca: 60, mg: 20, k: 5, no3: 30, so4: 40 },
    medio: {
      tipo: 'suelo',
      nutrienteDisponibleKgHa: { ...zeroNutrientAmounts(), N: 5, P: 2, K: 6, Ca: 4, Mg: 2, S: 2 },
      condiciones: {
        pH: 6.5,
        textura: 'franco',
        cicMeq100g: 20,
        materiaOrganicaPct: 3,
        temperaturaSueloC: 25,
        humedadRelativaCC: 0.8,
      },
    },
    eficienciaAbsorcion: { N: 0.9, P: 0.9, K: 0.9, Ca: 0.9, Mg: 0.9, S: 0.9 },
    inventarioFertilizantes: FERTILIZER_LIBRARY,
    configTanques: {
      A: {
        volumenTanqueLitros: 1000,
        relacionInyeccion: 100,
        aguaDiariaTotalLitros: 20000,
        numeroPulsos: 6,
      },
      B: {
        volumenTanqueLitros: 1000,
        relacionInyeccion: 150,
        aguaDiariaTotalLitros: 20000,
        numeroPulsos: 6,
      },
      C: {
        volumenTanqueLitros: 500,
        relacionInyeccion: 200,
        aguaDiariaTotalLitros: 20000,
        numeroPulsos: 6,
      },
    },
    modoTanqueC: 'acido',
  };
}

describe('recommendationRepository', () => {
  it('guarda la recomendación completa del motor (JSON) y la recupera intacta', () => {
    const db = crearBaseDeDatosDePrueba();
    const recomendacion = computeDailyRecommendation(fixtureEngineInput());

    guardarRecomendacion(db, 'lote-1', '2026-01-01', recomendacion);
    const leida = ultimaRecomendacionDeLote(db, 'lote-1');

    expect(leida).toBeDefined();
    expect(leida?.etapaId).toBe(recomendacion.etapa.id);
    const dataJson = leida?.dataJson as typeof recomendacion;
    expect(dataJson.agua.litrosPorPlantaDia).toBeCloseTo(recomendacion.agua.litrosPorPlantaDia, 6);
    expect(dataJson.nutrientes).toHaveLength(6);
    expect(dataJson.tanques.map((t) => t.tanque)).toEqual(['A', 'B', 'C']);
  });
});
