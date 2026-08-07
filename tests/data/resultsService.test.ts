import { crearBaseDeDatosDePrueba } from './testDb';
import { crearLote } from '../../src/data/repositories/loteRepository';
import { guardarRecomendacion } from '../../src/data/repositories/recommendationRepository';
import { crearAlert } from '../../src/data/repositories/alertRepository';
import { calcularResumenLote } from '../../src/state/resultsService';
import { computeDailyRecommendation, type EngineInput } from '../../src/domain/engine/pipeline';
import { jitomate } from '../../src/domain/crops/jitomate';
import { FERTILIZER_LIBRARY } from '../../src/domain/fertilizers/library';
import { zeroNutrientAmounts } from '../../src/domain/types/nutrients';

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

describe('calcularResumenLote', () => {
  it('devuelve ceros cuando el lote no tiene historial', () => {
    const db = crearBaseDeDatosDePrueba();
    const lote = crearLote(db, {
      nombre: 'Lote vacío',
      cropId: 'jitomate',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 1,
      plantasPorHa: 20000,
      rendimientoObjetivoTonHa: 80,
    });

    const resumen = calcularResumenLote(db, lote.id);
    expect(resumen.numeroRecomendaciones).toBe(0);
    expect(resumen.costoAcumulado).toBe(0);
    expect(resumen.alertasActivas).toBe(0);
  });

  it('agrega costo acumulado y cuenta alertas por nivel', () => {
    const db = crearBaseDeDatosDePrueba();
    const lote = crearLote(db, {
      nombre: 'Lote con historial',
      cropId: 'jitomate',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 2,
      plantasPorHa: 20000,
      rendimientoObjetivoTonHa: 80,
    });

    const recomendacion = computeDailyRecommendation(fixtureEngineInput());
    guardarRecomendacion(db, lote.id, '2026-01-01', recomendacion);
    guardarRecomendacion(db, lote.id, '2026-01-02', recomendacion);

    crearAlert(db, {
      loteId: lote.id,
      fecha: '2026-01-02',
      nivel: 'amarillo',
      metrica: 'Agua aplicada',
      desviacionPct: 15,
      mensaje: 'test',
      posiblesCausas: ['Falta de agua'],
    });

    const resumen = calcularResumenLote(db, lote.id);
    expect(resumen.numeroRecomendaciones).toBe(2);
    expect(resumen.costoAcumulado).toBeCloseTo(recomendacion.costoDiarioTotal * 2, 6);
    expect(resumen.alertasPorNivel.amarillo).toBe(1);
    expect(resumen.alertasActivas).toBe(1);
    expect(resumen.historial).toHaveLength(2);
  });
});
