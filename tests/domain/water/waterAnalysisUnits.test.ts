import { convertWaterConcentration } from '../../../src/domain/water/waterAnalysisUnits';
import {
  calcularSAR,
  calcularDureza,
  calcularAlcalinidad,
} from '../../../src/domain/water/waterQualityIndices';

describe('conversión de unidades de agua', () => {
  it('ppm y mg/L son equivalentes', () => {
    expect(convertWaterConcentration(60, 'Ca', 'ppm', 'mgL')).toBe(60);
  });

  it('ppm -> meq/L usa el peso equivalente (masa molar / valencia)', () => {
    // Ca: 40.08 g/mol / 2 = 20.04 g/eq -> 60 ppm / 20.04 = 2.994 meq/L
    expect(convertWaterConcentration(60, 'Ca', 'ppm', 'meqL')).toBeCloseTo(60 / 20.04, 5);
  });

  it('meq/L -> ppm es la inversa de ppm -> meq/L', () => {
    const meqL = convertWaterConcentration(60, 'Ca', 'ppm', 'meqL');
    expect(convertWaterConcentration(meqL, 'Ca', 'meqL', 'ppm')).toBeCloseTo(60, 6);
  });

  it('ppm -> mmol/L divide entre la masa molar', () => {
    expect(convertWaterConcentration(60, 'Ca', 'ppm', 'mmolL')).toBeCloseTo(60 / 40.08, 6);
  });

  it('lanza error al pedir meq/L de un ion sin valencia (boro)', () => {
    expect(() => convertWaterConcentration(0.5, 'B', 'ppm', 'meqL')).toThrow();
  });
});

describe('índices de calidad de agua', () => {
  it('calcula SAR a partir de Ca, Mg, Na en ppm', () => {
    const sar = calcularSAR({ ca: 60, mg: 20, na: 46 });
    expect(sar).toBeGreaterThan(0);
    // Verificación manual: Na meq/L ≈ 2.0, Ca meq/L ≈ 3.0, Mg meq/L ≈ 1.65
    // SAR = 2.0 / sqrt((3.0+1.65)/2) ≈ 2.0 / 1.525 ≈ 1.31
    expect(sar).toBeCloseTo(1.31, 1);
  });

  it('calcula dureza como CaCO3 (mg/L)', () => {
    expect(calcularDureza({ ca: 60, mg: 20 })).toBeCloseTo(2.497 * 60 + 4.118 * 20, 5);
  });

  it('calcula alcalinidad como CaCO3 (mg/L)', () => {
    const alcalinidad = calcularAlcalinidad({ hco3: 183, co3: 0 });
    // HCO3 meq/L = 183/61.02 ≈ 3.0 -> alcalinidad ≈ 150 mg/L CaCO3
    expect(alcalinidad).toBeCloseTo(150, 0);
  });
});
