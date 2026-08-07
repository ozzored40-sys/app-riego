import { fertilizerToRow, rowToFertilizer } from '../../../src/data/mappers/fertilizerMapper';
import { getFertilizerById } from '../../../src/domain/fertilizers/library';
import type { FertilizerProduct } from '../../../src/domain/types/fertilizer';

describe('fertilizerMapper', () => {
  it('un fertilizante convertido a fila y de vuelta preserva sus datos', () => {
    const original = getFertilizerById('nitrato-calcio');
    const fila = fertilizerToRow(original, 42, '2026-01-01T00:00:00.000Z');
    const recuperado = rowToFertilizer(fila);

    expect(recuperado.id).toBe(original.id);
    expect(recuperado.nombre).toBe(original.nombre);
    expect(recuperado.categoriaInsumo).toBe('fertilizante');
    expect(recuperado.composicionPct).toEqual(original.composicionPct);
    expect(recuperado.categoriaTanque).toBe(original.categoriaTanque);
    expect(recuperado.stockKg).toBe(42);
    expect(recuperado.esCustom).toBe(false);
  });

  it('un insumo del catálogo sin tambo asignado (ej. enraizador) conserva sus datos de ficha', () => {
    const enraizador: FertilizerProduct = {
      id: 'enraizador-ejemplo',
      nombre: 'Enraizador de ejemplo',
      categoriaInsumo: 'enraizador',
      estadoFisico: 'liquido',
      composicionPct: {},
      pureza: 1,
      costoPorKg: 120,
      unidadPrecio: 'L',
      presentacionComercial: 'Bidón 5 L',
      fichaTecnicaUrl: 'https://example.com/ficha-enraizador.pdf',
      factorCE: 0,
      porcentajeNa: 0,
      porcentajeCl: 0,
    };

    const fila = fertilizerToRow(enraizador, 10, '2026-01-01T00:00:00.000Z');
    const recuperado = rowToFertilizer(fila);

    expect(recuperado.categoriaInsumo).toBe('enraizador');
    expect(recuperado.categoriaTanque).toBeUndefined();
    expect(recuperado.unidadPrecio).toBe('L');
    expect(recuperado.presentacionComercial).toBe('Bidón 5 L');
    expect(recuperado.fichaTecnicaUrl).toBe('https://example.com/ficha-enraizador.pdf');
  });
});
