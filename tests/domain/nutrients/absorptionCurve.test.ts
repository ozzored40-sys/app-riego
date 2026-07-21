import {
  calcularDemandaTotal,
  calcularDemandaDiaria,
} from '../../../src/domain/nutrients/absorptionCurve';
import { zeroNutrientAmounts } from '../../../src/domain/types/nutrients';

describe('curva de absorción nutrimental', () => {
  it('demanda total = extracción por tonelada × rendimiento objetivo', () => {
    const extraccion = { ...zeroNutrientAmounts(), N: 2.8, K: 4.5 };
    const demanda = calcularDemandaTotal(extraccion, 80);
    expect(demanda.N).toBeCloseTo(224, 10);
    expect(demanda.K).toBeCloseTo(360, 10);
  });

  it('demanda diaria = (demanda total × % absorción etapa) / días etapa', () => {
    const demandaTotal = { ...zeroNutrientAmounts(), N: 224 };
    const porcentaje = { ...zeroNutrientAmounts(), N: 35 };
    const demandaDiaria = calcularDemandaDiaria(demandaTotal, porcentaje, 35);
    // 224 * 0.35 / 35 = 2.24 kg/ha/día
    expect(demandaDiaria.N).toBeCloseTo(2.24, 10);
  });

  it('rechaza días de etapa <= 0', () => {
    expect(() => calcularDemandaDiaria(zeroNutrientAmounts(), zeroNutrientAmounts(), 0)).toThrow();
  });
});
