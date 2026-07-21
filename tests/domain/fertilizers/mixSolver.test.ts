import { resolverMezclaFertilizantes } from '../../../src/domain/fertilizers/mixSolver';
import { FERTILIZER_LIBRARY } from '../../../src/domain/fertilizers/library';
import { zeroNutrientAmounts } from '../../../src/domain/types/nutrients';

describe('resolverMezclaFertilizantes', () => {
  it('cubre una necesidad simple de un solo nutriente con el producto más barato por kg de nutriente', () => {
    const necesidad = { ...zeroNutrientAmounts(), K: 10 };
    const resultado = resolverMezclaFertilizantes(necesidad, FERTILIZER_LIBRARY);

    expect(resultado.faltante.K).toBeCloseTo(0, 6);
    expect(resultado.cubierto.K).toBeCloseTo(10, 6);
    expect(resultado.asignaciones.length).toBeGreaterThan(0);
  });

  it('reporta como faltante lo que el inventario no puede cubrir', () => {
    const necesidad = { ...zeroNutrientAmounts(), Ca: 5 };
    // Inventario sin ninguna fuente de calcio.
    const inventarioSinCalcio = FERTILIZER_LIBRARY.filter((f) => !((f.composicionPct.Ca ?? 0) > 0));
    const resultado = resolverMezclaFertilizantes(necesidad, inventarioSinCalcio);
    expect(resultado.faltante.Ca).toBeGreaterThan(0);
  });

  it('descuenta el aporte cruzado de un producto multi-nutriente a los demás nutrientes', () => {
    // Nitrato de calcio aporta N y Ca a la vez; al resolver Ca primero, el N que aporta
    // debe descontarse de lo que falte de N.
    const necesidad = { ...zeroNutrientAmounts(), Ca: 1.9, N: 0.1 };
    const resultado = resolverMezclaFertilizantes(necesidad, FERTILIZER_LIBRARY);
    const nitratoCalcio = resultado.asignaciones.find(
      (a) => a.fertilizante.id === 'nitrato-calcio',
    );
    expect(nitratoCalcio).toBeDefined();
    // El nitrato de calcio ya aporta más N (15.5%) del que hacía falta (0.1 kg/ha),
    // así que N termina en exceso, no en faltante.
    expect(resultado.faltante.N).toBeCloseTo(0, 6);
  });

  it('no cubre nada cuando la necesidad neta ya es cero', () => {
    const resultado = resolverMezclaFertilizantes(zeroNutrientAmounts(), FERTILIZER_LIBRARY);
    expect(resultado.asignaciones).toHaveLength(0);
  });
});
