import { calcularAguaDisponibleSuelo } from '../../../src/domain/water/soilWaterHolding';
import {
  calcularAguaDisponibleSustrato,
  calcularAguaTotalConDrenaje,
} from '../../../src/domain/water/substrateWater';

describe('agua disponible en suelo', () => {
  it('(θCC − θPMP) × profundidad radicular', () => {
    // θCC 0.32, θPMP 0.16, profundidad 300mm -> 0.16 * 300 = 48mm
    expect(calcularAguaDisponibleSuelo(0.32, 0.16, 300)).toBeCloseTo(48, 10);
  });
});

describe('agua disponible en sustrato', () => {
  it('volumen de sustrato × capacidad de retención', () => {
    expect(calcularAguaDisponibleSustrato(5, 0.35)).toBeCloseTo(1.75, 10);
  });

  it('agua total con drenaje = demanda × (1 + % drenaje)', () => {
    expect(calcularAguaTotalConDrenaje(8.6, 0.12)).toBeCloseTo(9.632, 10);
  });
});
