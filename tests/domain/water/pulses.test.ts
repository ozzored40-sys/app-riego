import { calcularLitrosPorPulso, calcularMinutosPorPulso } from '../../../src/domain/water/pulses';

describe('pulsos de riego', () => {
  it('litros por pulso = agua total del día / número de pulsos (ejemplo del spec: 8.6 L / 6 pulsos = 1.43)', () => {
    expect(calcularLitrosPorPulso(8.6, 6)).toBeCloseTo(1.4333333, 5);
  });

  it('minutos por pulso a partir del caudal total por planta', () => {
    // 1.43 L por pulso, 1 gotero de 4 L/h -> minutos = (1.43/4)*60 = 21.45 min
    const minutos = calcularMinutosPorPulso(1.43, { caudalEmisorLH: 4, emisoresPorPlanta: 1 });
    expect(minutos).toBeCloseTo(21.45, 5);
  });
});
