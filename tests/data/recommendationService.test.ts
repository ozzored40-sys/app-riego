import { crearBaseDeDatosDePrueba } from './testDb';
import { crearLote } from '../../src/data/repositories/loteRepository';
import { crearSoilAnalysis } from '../../src/data/repositories/soilAnalysisRepository';
import { crearWaterAnalysis } from '../../src/data/repositories/waterAnalysisRepository';
import { crearIrrigationSystem } from '../../src/data/repositories/irrigationSystemRepository';
import { sembrarFertilizantes } from '../../src/data/seed/loadCropsAndFertilizers';
import { historialRecomendacionesDeLote } from '../../src/data/repositories/recommendationRepository';
import {
  verificarDatosLote,
  loteEstaCompleto,
  calcularYGuardarRecomendacion,
} from '../../src/state/recommendationService';

const IONES_CERO = {
  ca: 0,
  mg: 0,
  na: 0,
  k: 0,
  nh4: 0,
  hco3: 0,
  co3: 0,
  cl: 0,
  so4: 0,
  no3: 0,
  b: 0,
  fe: 0,
  mn: 0,
};

describe('recommendationService', () => {
  it('reporta datos faltantes hasta que el lote tiene suelo, agua y riego', () => {
    const db = crearBaseDeDatosDePrueba();
    const lote = crearLote(db, {
      nombre: 'Lote incompleto',
      cropId: 'jitomate',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 1,
      plantasPorHa: 20000,
      rendimientoObjetivoTonHa: 80,
    });

    expect(loteEstaCompleto(verificarDatosLote(db, lote.id))).toBe(false);

    crearSoilAnalysis(db, {
      loteId: lote.id,
      fecha: '2026-01-01',
      textura: 'franco',
      profundidadRadicularMm: 300,
      materiaOrganicaPct: 3,
      pH: 6.5,
      ceDsM: 1.2,
      cicMeq100g: 20,
      nutrientesDisponiblesKgHa: { N: 5, P: 2, K: 6, Ca: 4, Mg: 2, S: 2 },
    });
    crearWaterAnalysis(db, {
      loteId: lote.id,
      fecha: '2026-01-01',
      unidadCaptura: 'ppm',
      ionesCapturados: { ...IONES_CERO, ca: 60, mg: 20, k: 5, no3: 30, so4: 40 },
      pH: 7,
      ceDsM: 1,
    });
    crearIrrigationSystem(db, {
      loteId: lote.id,
      tipo: 'goteo',
      caudalEmisorLH: 2,
      emisoresPorPlanta: 1,
      eficienciaPct: 0.9,
      numeroPulsos: 6,
    });

    expect(loteEstaCompleto(verificarDatosLote(db, lote.id))).toBe(true);
  });

  it('calcula y guarda la recomendación diaria de un lote en suelo', () => {
    const db = crearBaseDeDatosDePrueba();
    sembrarFertilizantes(db);

    const lote = crearLote(db, {
      nombre: 'Lote jitomate',
      cropId: 'jitomate',
      sistemaProduccion: 'suelo',
      fechaSiembra: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      areaHa: 2,
      plantasPorHa: 20000,
      rendimientoObjetivoTonHa: 80,
    });
    crearSoilAnalysis(db, {
      loteId: lote.id,
      fecha: '2026-01-01',
      textura: 'franco',
      profundidadRadicularMm: 300,
      materiaOrganicaPct: 3,
      pH: 6.5,
      ceDsM: 1.2,
      cicMeq100g: 20,
      nutrientesDisponiblesKgHa: { N: 5, P: 2, K: 6, Ca: 4, Mg: 2, S: 2 },
    });
    crearWaterAnalysis(db, {
      loteId: lote.id,
      fecha: '2026-01-01',
      unidadCaptura: 'ppm',
      ionesCapturados: { ...IONES_CERO, ca: 60, mg: 20, k: 5, no3: 30, so4: 40 },
      pH: 7,
      ceDsM: 1,
    });
    crearIrrigationSystem(db, {
      loteId: lote.id,
      tipo: 'goteo',
      caudalEmisorLH: 2,
      emisoresPorPlanta: 1,
      eficienciaPct: 0.9,
      numeroPulsos: 6,
    });

    const recomendacion = calcularYGuardarRecomendacion(db, lote.id, {
      etoMmDia: 5,
      lluviaEfectivaMmDia: 0,
    });

    expect(recomendacion.agua.litrosPorPlantaDia).toBeGreaterThan(0);
    expect(recomendacion.nutrientes).toHaveLength(6);
    expect(recomendacion.tanques.map((t) => t.tanque)).toEqual(['A', 'B', 'C']);
    // La segunda pasada usa el agua real del lote: el tambo A debe tener alguna dosis de inyección positiva.
    expect(recomendacion.tanques[0].dosis.litrosMadrePorDia).toBeGreaterThan(0);

    const historial = historialRecomendacionesDeLote(db, lote.id);
    expect(historial).toHaveLength(1);
  });

  it('lanza un error claro si falta el análisis de agua', () => {
    const db = crearBaseDeDatosDePrueba();
    sembrarFertilizantes(db);
    const lote = crearLote(db, {
      nombre: 'Lote sin agua',
      cropId: 'chile',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 1,
      plantasPorHa: 20000,
      rendimientoObjetivoTonHa: 60,
    });
    crearSoilAnalysis(db, {
      loteId: lote.id,
      fecha: '2026-01-01',
      textura: 'franco',
      profundidadRadicularMm: 300,
      materiaOrganicaPct: 3,
      pH: 6.5,
      ceDsM: 1.2,
      cicMeq100g: 20,
      nutrientesDisponiblesKgHa: { N: 5, P: 2, K: 6, Ca: 4, Mg: 2, S: 2 },
    });
    crearIrrigationSystem(db, {
      loteId: lote.id,
      tipo: 'goteo',
      caudalEmisorLH: 2,
      emisoresPorPlanta: 1,
      eficienciaPct: 0.9,
      numeroPulsos: 6,
    });

    expect(() =>
      calcularYGuardarRecomendacion(db, lote.id, { etoMmDia: 5, lluviaEfectivaMmDia: 0 }),
    ).toThrow(/agua/);
  });
});
