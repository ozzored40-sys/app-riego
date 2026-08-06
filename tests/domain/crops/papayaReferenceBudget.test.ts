import { papaya } from '../../../src/domain/crops/papaya';
import { calcularDemandaTotal } from '../../../src/domain/nutrients/absorptionCurve';

/**
 * Verifica que el presupuesto nutrimental de papaya (extraccionPorTonelada × rendimiento
 * de referencia) reproduzca los rangos anuales del documento fuente "AgroChamán 69"
 * (sección 5): N 320-360, P2O5 90-110, K2O 450-520, CaO 150-180, MgO 90-110, S 35-50 kg/ha,
 * para el escenario de diseño de 100 t/ha. Los macros se comparan ya convertidos a forma
 * elemental (el motor trabaja en elemental, no en óxidos).
 */
describe('presupuesto nutrimental de referencia de papaya (fuente: AgroChamán 69)', () => {
  const rendimientoReferencia = papaya.datosReferencia?.rendimientoObjetivoTonHaSugerido ?? 100;
  const demandaTotal = calcularDemandaTotal(papaya.extraccionPorTonelada, rendimientoReferencia);

  it('N cae dentro del rango 320-360 kg/ha', () => {
    expect(demandaTotal.N).toBeGreaterThanOrEqual(320);
    expect(demandaTotal.N).toBeLessThanOrEqual(360);
  });

  it('P (equivalente a P2O5 90-110 kg/ha) cae dentro del rango convertido', () => {
    expect(demandaTotal.P).toBeGreaterThanOrEqual(90 * 0.4364);
    expect(demandaTotal.P).toBeLessThanOrEqual(110 * 0.4364);
  });

  it('K (equivalente a K2O 450-520 kg/ha) cae dentro del rango convertido', () => {
    expect(demandaTotal.K).toBeGreaterThanOrEqual(450 * 0.8301);
    expect(demandaTotal.K).toBeLessThanOrEqual(520 * 0.8301);
  });

  it('Ca (equivalente a CaO 150-180 kg/ha) cae dentro del rango convertido', () => {
    expect(demandaTotal.Ca).toBeGreaterThanOrEqual(150 * 0.7147);
    expect(demandaTotal.Ca).toBeLessThanOrEqual(180 * 0.7147);
  });

  it('Mg (equivalente a MgO 90-110 kg/ha) cae dentro del rango convertido', () => {
    expect(demandaTotal.Mg).toBeGreaterThanOrEqual(90 * 0.603);
    expect(demandaTotal.Mg).toBeLessThanOrEqual(110 * 0.603);
  });

  it('S cae dentro del rango 35-50 kg/ha', () => {
    expect(demandaTotal.S).toBeGreaterThanOrEqual(35);
    expect(demandaTotal.S).toBeLessThanOrEqual(50);
  });

  it('expone el escenario de diseño (densidad y rendimiento sugeridos) para prellenar la UI', () => {
    expect(papaya.datosReferencia?.densidadPlantasHaSugerida).toBe(1600);
    expect(papaya.datosReferencia?.rendimientoObjetivoTonHaSugerido).toBe(100);
  });
});
