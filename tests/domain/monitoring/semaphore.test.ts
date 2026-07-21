import { calcularDesviacionPct } from '../../../src/domain/monitoring/deviation';
import { evaluarSemaforo } from '../../../src/domain/monitoring/semaphore';

describe('desviación programado vs aplicado', () => {
  it('calcula el % de desviación con signo', () => {
    expect(calcularDesviacionPct(100, 105)).toBeCloseTo(5, 10);
    expect(calcularDesviacionPct(100, 80)).toBeCloseTo(-20, 10);
  });
});

describe('semáforo de desviación', () => {
  it('verde: desviación menor al 10%, mantiene el programa', () => {
    const resultado = evaluarSemaforo(8);
    expect(resultado.nivel).toBe('verde');
    expect(resultado.requiereValidacionTecnico).toBe(false);
  });

  it('amarillo: 10-20%, sugiere ajuste gradual tope 5-10%', () => {
    const resultado = evaluarSemaforo(15);
    expect(resultado.nivel).toBe('amarillo');
    expect(resultado.ajusteSugeridoPct).not.toBeNull();
    expect(Math.abs(resultado.ajusteSugeridoPct as number)).toBeGreaterThanOrEqual(5);
    expect(Math.abs(resultado.ajusteSugeridoPct as number)).toBeLessThanOrEqual(10);
    // Se aplicó/midió de más -> el ajuste debe ir en dirección de reducir.
    expect(resultado.ajusteSugeridoPct).toBeLessThan(0);
  });

  it('rojo: más de 20%, bloquea el auto-ajuste y pide validación del técnico', () => {
    const resultado = evaluarSemaforo(-35);
    expect(resultado.nivel).toBe('rojo');
    expect(resultado.ajusteSugeridoPct).toBeNull();
    expect(resultado.requiereValidacionTecnico).toBe(true);
    expect(resultado.posiblesCausas.length).toBeGreaterThanOrEqual(2);
  });
});
