import { calcularETc, calcularAguaNeta, calcularAguaBruta } from '../../../src/domain/water/eto';

describe('demanda hídrica: ETc, agua neta, agua bruta', () => {
  it('ETc = ETo × Kc', () => {
    expect(calcularETc(5, 0.8)).toBeCloseTo(4, 10);
  });

  it('agua neta = ETc − lluvia efectiva, sin bajar de 0', () => {
    expect(calcularAguaNeta(4, 1)).toBeCloseTo(3, 10);
    expect(calcularAguaNeta(2, 5)).toBe(0);
  });

  it('agua bruta = agua neta / eficiencia del sistema', () => {
    expect(calcularAguaBruta(3, 0.9)).toBeCloseTo(3.3333333, 5);
  });

  it('rechaza eficiencia fuera de (0,1]', () => {
    expect(() => calcularAguaBruta(3, 0)).toThrow();
    expect(() => calcularAguaBruta(3, 1.2)).toThrow();
  });
});
