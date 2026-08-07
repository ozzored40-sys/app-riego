import { crearBaseDeDatosDePrueba } from '../testDb';
import {
  crearWaterAnalysis,
  ultimoWaterAnalysisDeLote,
} from '../../../src/data/repositories/waterAnalysisRepository';

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

describe('waterAnalysisRepository', () => {
  it('guarda un análisis capturado en meq/L y lo normaliza a ppm al persistir', () => {
    const db = crearBaseDeDatosDePrueba();

    const creado = crearWaterAnalysis(db, {
      loteId: 'lote-1',
      fecha: '2026-01-01',
      unidadCaptura: 'meqL',
      ionesCapturados: { ...IONES_CERO, ca: 3 }, // 3 meq/L Ca
      pH: 7.2,
      ceDsM: 1.1,
    });

    // 3 meq/L Ca -> 3 * (40.08/2) = 60.12 ppm
    expect(creado.ionesNormalizadosPpm.ca).toBeCloseTo(60.12, 1);
    expect(creado.sar).toBeDefined();

    const leido = ultimoWaterAnalysisDeLote(db, 'lote-1');
    expect(leido?.id).toBe(creado.id);
    expect(leido?.ionesNormalizadosPpm.ca).toBeCloseTo(60.12, 1);
    // La captura original (en meq/L) se conserva sin alterar.
    expect(leido?.ionesCapturados.ca).toBe(3);
  });

  it('conserva ppm sin cambios cuando ya se capturó en ppm', () => {
    const db = crearBaseDeDatosDePrueba();
    const creado = crearWaterAnalysis(db, {
      loteId: 'lote-2',
      fecha: '2026-01-01',
      unidadCaptura: 'ppm',
      ionesCapturados: { ...IONES_CERO, ca: 60, mg: 20, na: 46, hco3: 183 },
      pH: 7.0,
      ceDsM: 1.0,
    });

    expect(creado.ionesNormalizadosPpm.ca).toBe(60);
    expect(creado.ionesNormalizadosPpm.mg).toBe(20);
  });
});
