import {
  verificarCompatibilidadTanque,
  tanqueAsignadoPorDefecto,
} from '../../../src/domain/tanks/compatibility';
import { getFertilizerById } from '../../../src/domain/fertilizers/library';

describe('compatibilidad de tambos', () => {
  it('asigna cada producto a su categoría de tambo, y flexibles al Tambo B', () => {
    expect(tanqueAsignadoPorDefecto(getFertilizerById('nitrato-calcio'))).toBe('A');
    expect(tanqueAsignadoPorDefecto(getFertilizerById('fosfato-monopotasico'))).toBe('B');
    expect(tanqueAsignadoPorDefecto(getFertilizerById('acido-nitrico'))).toBe('C');
    expect(tanqueAsignadoPorDefecto(getFertilizerById('urea'))).toBe('B');
  });

  it('detecta conflicto si calcio y sulfato/fosfato concentrados quedan en el mismo tambo', () => {
    const nitratoCalcio = getFertilizerById('nitrato-calcio');
    const sulfatoPotasio = getFertilizerById('sulfato-potasio');
    const conflictos = verificarCompatibilidadTanque('A', [nitratoCalcio, sulfatoPotasio]);
    expect(conflictos.length).toBeGreaterThan(0);
  });

  it('no reporta conflicto entre productos compatibles del mismo tambo', () => {
    const nitratoCalcio = getFertilizerById('nitrato-calcio');
    const nitratoMagnesio = getFertilizerById('nitrato-magnesio');
    const conflictos = verificarCompatibilidadTanque('A', [nitratoCalcio, nitratoMagnesio]);
    expect(conflictos).toHaveLength(0);
  });

  it('Tambo C en modo ácido marca conflicto con un producto bioestimulante', () => {
    const acidoNitrico = getFertilizerById('acido-nitrico');
    const bioestimulante = getFertilizerById('producto-chaman-bioestimulante');
    const conflictos = verificarCompatibilidadTanque('C', [acidoNitrico, bioestimulante], 'acido');
    expect(conflictos.some((c) => c.motivo.includes('bioestimulantes'))).toBe(true);
  });

  it('Tambo C en modo bioestimulante marca conflicto con un ácido concentrado', () => {
    const acidoNitrico = getFertilizerById('acido-nitrico');
    const conflictos = verificarCompatibilidadTanque('C', [acidoNitrico], 'biostimulante');
    expect(conflictos.some((c) => c.motivo.includes('ácidos concentrados'))).toBe(true);
  });
});
