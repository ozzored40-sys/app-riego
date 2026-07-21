import {
  mmDiaAM3PorHaDia,
  calcularLitrosPorPlantaPorDia,
  calcularM3PorHaDia,
} from '../../../src/domain/water/waterVolumes';

describe('conversión de volúmenes de agua', () => {
  it('1 mm de lámina = 10 m³/ha', () => {
    expect(mmDiaAM3PorHaDia(1.72)).toBeCloseTo(17.2, 10);
  });

  it('L/planta/día = (m³/ha/día × 1000) / plantas/ha (ejemplo del spec)', () => {
    // 17.2 m3/ha/día repartido entre una densidad que da 8.6 L/planta/día -> 2000 plantas/ha
    expect(calcularLitrosPorPlantaPorDia(17.2, 2000)).toBeCloseTo(8.6, 10);
  });

  it('es la inversa de calcularM3PorHaDia', () => {
    const m3 = calcularM3PorHaDia(8.6, 2000);
    expect(m3).toBeCloseTo(17.2, 10);
  });
});
