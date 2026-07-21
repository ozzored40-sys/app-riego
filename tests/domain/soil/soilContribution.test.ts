import { calcularAporteSuelo } from '../../../src/domain/soil/soilContribution';
import { calcularCoeficienteAprovechamiento } from '../../../src/domain/soil/availabilityCoefficient';
import { zeroNutrientAmounts } from '../../../src/domain/types/nutrients';

const condicionesOptimas = {
  pH: 6.5,
  textura: 'franco' as const,
  cicMeq100g: 20,
  materiaOrganicaPct: 3,
  temperaturaSueloC: 25,
  humedadRelativaCC: 0.8,
};

describe('coeficiente de aprovechamiento del suelo', () => {
  it('está siempre entre 0 y 1', () => {
    for (const nutriente of ['N', 'P', 'K', 'Ca', 'Mg', 'S'] as const) {
      const coeficiente = calcularCoeficienteAprovechamiento(nutriente, condicionesOptimas);
      expect(coeficiente).toBeGreaterThanOrEqual(0);
      expect(coeficiente).toBeLessThanOrEqual(1);
    }
  });

  it('un suelo en condiciones óptimas tiene mayor coeficiente que uno con pH extremo', () => {
    const coefOptimo = calcularCoeficienteAprovechamiento('P', condicionesOptimas);
    const coefAcido = calcularCoeficienteAprovechamiento('P', { ...condicionesOptimas, pH: 4.5 });
    expect(coefOptimo).toBeGreaterThan(coefAcido);
  });
});

describe('aporte efectivo del suelo', () => {
  it('aporte = nutriente disponible × coeficiente de aprovechamiento', () => {
    const disponible = { ...zeroNutrientAmounts(), Ca: 2.0 };
    const aporte = calcularAporteSuelo(disponible, condicionesOptimas);
    const coeficienteEsperado = calcularCoeficienteAprovechamiento('Ca', condicionesOptimas);
    expect(aporte.Ca).toBeCloseTo(2.0 * coeficienteEsperado, 10);
  });
});
