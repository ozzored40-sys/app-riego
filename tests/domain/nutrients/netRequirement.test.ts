import {
  calcularNecesidadNeta,
  ajustarPorEficienciaAbsorcion,
} from '../../../src/domain/nutrients/netRequirement';
import { zeroNutrientAmounts } from '../../../src/domain/types/nutrients';

describe('necesidad neta a fertilizar', () => {
  it('demanda − aporte agua − aporte suelo (ejemplo del spec: Ca 1.90 − 0.85 − 0.40 = 0.65)', () => {
    const demanda = { ...zeroNutrientAmounts(), Ca: 1.9 };
    const aguaAporte = { ...zeroNutrientAmounts(), Ca: 0.85 };
    const sueloAporte = { ...zeroNutrientAmounts(), Ca: 0.4 };
    const neto = calcularNecesidadNeta(demanda, aguaAporte, sueloAporte);
    expect(neto.Ca).toBeCloseTo(0.65, 10);
  });

  it('nunca resulta negativa cuando agua+suelo superan la demanda', () => {
    const demanda = { ...zeroNutrientAmounts(), Ca: 1 };
    const aguaAporte = { ...zeroNutrientAmounts(), Ca: 0.8 };
    const sueloAporte = { ...zeroNutrientAmounts(), Ca: 0.5 };
    expect(calcularNecesidadNeta(demanda, aguaAporte, sueloAporte).Ca).toBe(0);
  });

  it('ajusta por eficiencia de absorción dividiendo entre la eficiencia', () => {
    const neto = { ...zeroNutrientAmounts(), N: 1.78 };
    const eficiencia = { ...zeroNutrientAmounts(), N: 0.8, P: 1, K: 1, Ca: 1, Mg: 1, S: 1 };
    const ajustado = ajustarPorEficienciaAbsorcion(neto, eficiencia);
    expect(ajustado.N).toBeCloseTo(1.78 / 0.8, 10);
  });
});
