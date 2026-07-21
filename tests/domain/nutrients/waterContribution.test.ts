import {
  calcularAporteAguaPorElemento,
  calcularAporteAgua,
} from '../../../src/domain/nutrients/waterContribution';

describe('aporte de nutrientes del agua', () => {
  it('reproduce el ejemplo del spec: 60 ppm Ca × 30 m³/ha/día / 1000 = 1.8 kg Ca/ha/día', () => {
    expect(calcularAporteAguaPorElemento(60, 30)).toBeCloseTo(1.8, 10);
  });

  it('calcula el aporte de todos los macros reportados por el agua', () => {
    const aporte = calcularAporteAgua({ ca: 60, mg: 20, k: 5, no3: 30, so4: 40 }, 30);
    expect(aporte.Ca).toBeCloseTo(1.8, 10);
    expect(aporte.Mg).toBeCloseTo(0.6, 10);
    expect(aporte.K).toBeCloseTo(0.15, 10);
    // N desde NO3: 30ppm * factor(14.01/62.0) * 30 m3/ha / 1000
    expect(aporte.N).toBeCloseTo((30 * (14.01 / 62.0) * 30) / 1000, 10);
    expect(aporte.P).toBe(0);
  });
});
