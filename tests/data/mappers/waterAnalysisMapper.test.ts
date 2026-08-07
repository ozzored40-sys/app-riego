import {
  normalizarIonesAPpm,
  calcularIndicesCalidad,
} from '../../../src/data/mappers/waterAnalysisMapper';
import type { IonesAgua } from '../../../src/data/db/schema';

const IONES_CERO: IonesAgua = {
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

describe('normalizarIonesAPpm', () => {
  it('deja los valores igual si ya se capturaron en ppm', () => {
    const iones = { ...IONES_CERO, ca: 60, mg: 20 };
    expect(normalizarIonesAPpm(iones, 'ppm')).toEqual(iones);
  });

  it('convierte meq/L a ppm para iones con valencia definida', () => {
    const iones = { ...IONES_CERO, ca: 3 }; // 3 meq/L de Ca
    const normalizado = normalizarIonesAPpm(iones, 'meqL');
    // Ca: peso equivalente 40.08/2 = 20.04 -> 3 * 20.04 = 60.12 ppm
    expect(normalizado.ca).toBeCloseTo(60.12, 1);
  });

  it('trata B, Fe, Mn como ya capturados en ppm aunque la unidad global sea meq/L', () => {
    const iones = { ...IONES_CERO, b: 0.5, fe: 2, mn: 0.8 };
    const normalizado = normalizarIonesAPpm(iones, 'meqL');
    expect(normalizado.b).toBe(0.5);
    expect(normalizado.fe).toBe(2);
    expect(normalizado.mn).toBe(0.8);
  });
});

describe('calcularIndicesCalidad', () => {
  it('devuelve SAR, dureza y alcalinidad', () => {
    const indices = calcularIndicesCalidad({ ...IONES_CERO, ca: 60, mg: 20, na: 46, hco3: 183 });
    expect(indices.sar).toBeGreaterThan(0);
    expect(indices.dureza).toBeGreaterThan(0);
    expect(indices.alcalinidad).toBeGreaterThan(0);
  });
});
