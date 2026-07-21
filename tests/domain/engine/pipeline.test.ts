import { computeDailyRecommendation, type EngineInput } from '../../../src/domain/engine/pipeline';
import { jitomate } from '../../../src/domain/crops/jitomate';
import { FERTILIZER_LIBRARY } from '../../../src/domain/fertilizers/library';
import { zeroNutrientAmounts } from '../../../src/domain/types/nutrients';

function fixtureLoteJitomateSuelo(): EngineInput {
  return {
    cultivo: jitomate,
    edadDiasCultivo: 60, // cae en fructificación
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

describe('pipeline de 15 pasos: computeDailyRecommendation', () => {
  it('devuelve una recomendación completa y coherente para un lote de jitomate en suelo', () => {
    const recomendacion = computeDailyRecommendation(fixtureLoteJitomateSuelo());

    expect(recomendacion.etapa.id).toBe('fructificacion');

    // Agua: todas las escalas presentes y positivas.
    expect(recomendacion.agua.litrosPorPlantaDia).toBeGreaterThan(0);
    expect(recomendacion.agua.m3PorHaDia).toBeGreaterThan(0);
    expect(recomendacion.agua.numeroPulsos).toBe(6);
    expect(recomendacion.agua.litrosPorPulso * 6).toBeCloseTo(
      recomendacion.agua.litrosPorPlantaDia,
      6,
    );
    expect(recomendacion.agua.minutosPorPulso).toBeGreaterThan(0);

    // Nutrientes: los 6 macros presentes, con neto >= 0.
    expect(recomendacion.nutrientes).toHaveLength(6);
    for (const n of recomendacion.nutrientes) {
      expect(n.netoKgHaDia).toBeGreaterThanOrEqual(0);
      expect(n.netoAjustadoKgHaDia).toBeGreaterThanOrEqual(n.netoKgHaDia - 1e-9);
    }

    // Tambos: A, B y C presentes, en ese orden.
    expect(recomendacion.tanques.map((t) => t.tanque)).toEqual(['A', 'B', 'C']);

    // Ningún fertilizante incompatible quedó en el mismo tambo (usando la biblioteca por defecto).
    expect(recomendacion.conflictosCompatibilidad).toHaveLength(0);

    // El costo diario debe ser positivo si hubo alguna asignación de fertilizante.
    if (recomendacion.mezclaFertilizantes.asignaciones.length > 0) {
      expect(recomendacion.costoDiarioTotal).toBeGreaterThan(0);
    }
  });

  it('en sustrato aplica el porcentaje de drenaje al agua total y no descuenta aporte de suelo', () => {
    const fixture = fixtureLoteJitomateSuelo();
    fixture.medio = { tipo: 'sustrato', porcentajeDrenaje: 0.12 };

    const recomendacionSuelo = computeDailyRecommendation(fixtureLoteJitomateSuelo());
    const recomendacionSustrato = computeDailyRecommendation(fixture);

    // El aporte de suelo en sustrato debe ser 0 para todos los nutrientes.
    for (const n of recomendacionSustrato.nutrientes) {
      expect(n.aporteSueloKgHaDia).toBe(0);
    }

    // El agua en sustrato debe ser mayor que en suelo por el % de drenaje agregado.
    expect(recomendacionSustrato.agua.litrosPorPlantaDia).toBeGreaterThan(
      recomendacionSuelo.agua.litrosPorPlantaDia,
    );
  });

  it('respeta una etapa manual en vez de calcularla por edad', () => {
    const fixture = fixtureLoteJitomateSuelo();
    fixture.etapaIdManual = 'maduracion';
    const recomendacion = computeDailyRecommendation(fixture);
    expect(recomendacion.etapa.id).toBe('maduracion');
  });
});
