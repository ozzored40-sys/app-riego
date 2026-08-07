import { crearBaseDeDatosDePrueba } from './testDb';
import { crearLote } from '../../src/data/repositories/loteRepository';
import { guardarRecomendacion } from '../../src/data/repositories/recommendationRepository';
import { listarAlertasDeLote } from '../../src/data/repositories/alertRepository';
import { registrarLecturaYEvaluar } from '../../src/state/monitoringService';
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

describe('registrarLecturaYEvaluar', () => {
  it('no genera alerta si la desviación de agua aplicada es menor al 10% (verde)', () => {
    const db = crearBaseDeDatosDePrueba();
    const lote = crearLote(db, {
      nombre: 'Lote',
      cropId: 'jitomate',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 2,
      plantasPorHa: 20000,
      rendimientoObjetivoTonHa: 80,
    });
    const recomendacion = computeDailyRecommendation(fixtureEngineInput());
    guardarRecomendacion(db, lote.id, '2026-01-01', recomendacion);

    const programado = recomendacion.agua.litrosPorPlantaDia;
    const resultado = registrarLecturaYEvaluar(db, lote.id, {
      loteId: lote.id,
      fecha: '2026-01-02',
      tipo: 'aguaAplicadaL',
      valor: programado * 1.05, // 5% de más
      unidad: 'L/planta',
    });

    expect(resultado.comparacion?.semaforo.nivel).toBe('verde');
    expect(listarAlertasDeLote(db, lote.id)).toHaveLength(0);
  });

  it('genera una alerta amarilla si la desviación está entre 10% y 20%', () => {
    const db = crearBaseDeDatosDePrueba();
    const lote = crearLote(db, {
      nombre: 'Lote',
      cropId: 'jitomate',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 2,
      plantasPorHa: 20000,
      rendimientoObjetivoTonHa: 80,
    });
    const recomendacion = computeDailyRecommendation(fixtureEngineInput());
    guardarRecomendacion(db, lote.id, '2026-01-01', recomendacion);

    const programado = recomendacion.agua.litrosPorPlantaDia;
    const resultado = registrarLecturaYEvaluar(db, lote.id, {
      loteId: lote.id,
      fecha: '2026-01-02',
      tipo: 'aguaAplicadaL',
      valor: programado * 1.15,
      unidad: 'L/planta',
    });

    expect(resultado.comparacion?.semaforo.nivel).toBe('amarillo');
    const alertas = listarAlertasDeLote(db, lote.id);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].nivel).toBe('amarillo');
  });

  it('genera una alerta roja y bloquea el ajuste automático si la desviación supera el 20%', () => {
    const db = crearBaseDeDatosDePrueba();
    const lote = crearLote(db, {
      nombre: 'Lote',
      cropId: 'jitomate',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 2,
      plantasPorHa: 20000,
      rendimientoObjetivoTonHa: 80,
    });
    const recomendacion = computeDailyRecommendation(fixtureEngineInput());
    guardarRecomendacion(db, lote.id, '2026-01-01', recomendacion);

    const programado = recomendacion.agua.litrosPorPlantaDia;
    registrarLecturaYEvaluar(db, lote.id, {
      loteId: lote.id,
      fecha: '2026-01-02',
      tipo: 'aguaAplicadaL',
      valor: programado * 0.6,
      unidad: 'L/planta',
    });

    const alertas = listarAlertasDeLote(db, lote.id);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].nivel).toBe('rojo');
    expect(alertas[0].posiblesCausas.length).toBeGreaterThan(0);
  });

  it('no compara ni genera alerta para métricas sin valor programado modelado', () => {
    const db = crearBaseDeDatosDePrueba();
    const lote = crearLote(db, {
      nombre: 'Lote',
      cropId: 'jitomate',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 2,
      plantasPorHa: 20000,
      rendimientoObjetivoTonHa: 80,
    });

    const resultado = registrarLecturaYEvaluar(db, lote.id, {
      loteId: lote.id,
      fecha: '2026-01-02',
      tipo: 'ceAplicada',
      valor: 2.1,
      unidad: 'dS/m',
    });

    expect(resultado.comparacion).toBeNull();
    expect(listarAlertasDeLote(db, lote.id)).toHaveLength(0);
  });
});
