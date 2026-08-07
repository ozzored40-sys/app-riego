import { fertilizerToRow, rowToFertilizer } from '../../../src/data/mappers/fertilizerMapper';
import { getFertilizerById } from '../../../src/domain/fertilizers/library';

describe('fertilizerMapper', () => {
  it('un fertilizante convertido a fila y de vuelta preserva sus datos', () => {
    const original = getFertilizerById('nitrato-calcio');
    const fila = fertilizerToRow(original, 42, '2026-01-01T00:00:00.000Z');
    const recuperado = rowToFertilizer(fila);

    expect(recuperado.id).toBe(original.id);
    expect(recuperado.nombre).toBe(original.nombre);
    expect(recuperado.composicionPct).toEqual(original.composicionPct);
    expect(recuperado.categoriaTanque).toBe(original.categoriaTanque);
    expect(recuperado.stockKg).toBe(42);
    expect(recuperado.esCustom).toBe(false);
  });
});
