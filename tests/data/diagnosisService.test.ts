import { crearBaseDeDatosDePrueba } from './testDb';
import { crearLote } from '../../src/data/repositories/loteRepository';
import { crearSoilAnalysis } from '../../src/data/repositories/soilAnalysisRepository';
import { crearWaterAnalysis } from '../../src/data/repositories/waterAnalysisRepository';
import { crearIrrigationSystem } from '../../src/data/repositories/irrigationSystemRepository';
import { calcularDiagnosticoDeLote } from '../../src/state/diagnosisService';

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

describe('calcularDiagnosticoDeLote', () => {
  it('devuelve null si al lote le falta algún dato base', () => {
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
    expect(calcularDiagnosticoDeLote(db, lote.id)).toBeNull();
  });

  it('calcula el diagnóstico completo una vez que el lote tiene suelo, agua y riego', () => {
    const db = crearBaseDeDatosDePrueba();
    const lote = crearLote(db, {
      nombre: 'Lote jitomate',
      cropId: 'jitomate',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 1,
      plantasPorHa: 20000,
      rendimientoObjetivoTonHa: 80,
    });
    crearSoilAnalysis(db, {
      loteId: lote.id,
      fecha: '2026-01-01',
      textura: 'franco',
      profundidadRadicularMm: 300,
      materiaOrganicaPct: 3,
      pH: 6.2,
      ceDsM: 2.5,
      cicMeq100g: 20,
      nutrientesDisponiblesKgHa: { N: 5, P: 2, K: 6, Ca: 4, Mg: 2, S: 2 },
    });
    crearWaterAnalysis(db, {
      loteId: lote.id,
      fecha: '2026-01-01',
      unidadCaptura: 'ppm',
      ionesCapturados: { ...IONES_CERO, ca: 60, mg: 20, hco3: 100 },
      pH: 7,
      ceDsM: 0.8,
    });
    crearIrrigationSystem(db, {
      loteId: lote.id,
      tipo: 'goteo',
      caudalEmisorLH: 2,
      emisoresPorPlanta: 1,
      eficienciaPct: 0.9,
      numeroPulsos: 6,
    });

    const diagnostico = calcularDiagnosticoDeLote(db, lote.id);
    expect(diagnostico).not.toBeNull();
    expect(diagnostico!.hallazgos.length).toBeGreaterThan(0);
    expect(['ok', 'atencion', 'riesgo']).toContain(diagnostico!.resumen);
  });
});
