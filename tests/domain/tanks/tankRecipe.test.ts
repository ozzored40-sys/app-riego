import {
  calcularDosisInyeccion,
  calcularKgFertilizanteEnTanque,
} from '../../../src/domain/tanks/tankRecipe';

describe('dosis de inyección del tanque madre', () => {
  it('reproduce el ejemplo del spec: 20,000 L/día, relación 1:100, tanque de 1,000 L -> dura 5 días', () => {
    const dosis = calcularDosisInyeccion({
      aguaDiariaTotalLitros: 20000,
      relacionInyeccion: 100,
      volumenTanqueLitros: 1000,
      numeroPulsos: 6,
    });
    expect(dosis.litrosMadrePorDia).toBeCloseTo(200, 10);
    expect(dosis.diasDeAutonomia).toBeCloseTo(5, 10);
    expect(dosis.litrosMadrePorPulso).toBeCloseTo(200 / 6, 10);
  });

  it('rechaza relación de inyección o número de pulsos <= 0', () => {
    expect(() =>
      calcularDosisInyeccion({
        aguaDiariaTotalLitros: 20000,
        relacionInyeccion: 0,
        volumenTanqueLitros: 1000,
        numeroPulsos: 6,
      }),
    ).toThrow();
  });
});

describe('kg de fertilizante a disolver en el tanque', () => {
  it('kg = kg/ha/día × área × días de autonomía', () => {
    expect(calcularKgFertilizanteEnTanque(4.2, 2, 5)).toBeCloseTo(42, 10);
  });
});
