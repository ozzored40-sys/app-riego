import {
  kgPorHaAGramosPorPlanta,
  gramosPorPlantaAKgPorHa,
  kgPorHaAKgPorSector,
} from '../../../src/domain/nutrients/unitConversion';

describe('conversión de escalas de nutrientes', () => {
  it('g/planta/día = (kg/ha/día × 1000) / plantas/ha (ejemplo del spec: N 2.40 kg/ha/día -> 1.20 g/planta/día con 2000 plantas/ha)', () => {
    expect(kgPorHaAGramosPorPlanta(2.4, 2000)).toBeCloseTo(1.2, 10);
  });

  it('es la inversa de gramosPorPlantaAKgPorHa', () => {
    expect(gramosPorPlantaAKgPorHa(1.2, 2000)).toBeCloseTo(2.4, 10);
  });

  it('kg/ha/día -> kg del sector según su área', () => {
    expect(kgPorHaAKgPorSector(2.4, 0.5)).toBeCloseTo(1.2, 10);
  });
});
