import { buscarEnCatalogo, obtenerCatalogoCompleto, obtenerProductoPorId } from '../lib/catalog';

describe('catálogo de Chamán Agro Soluciones', () => {
  it('carga al menos un producto', () => {
    expect(obtenerCatalogoCompleto().length).toBeGreaterThan(0);
  });

  it('encuentra un producto por id exacto', () => {
    const producto = obtenerProductoPorId('corrector-calcio-foliar');
    expect(producto?.nombre).toBe('Corrector de calcio foliar');
  });

  it('regresa undefined si el id no existe', () => {
    expect(obtenerProductoPorId('no-existe')).toBeUndefined();
  });

  it('busca por texto libre en nombre, categoría, descripción o cultivo', () => {
    const resultados = buscarEnCatalogo('calcio');
    expect(resultados.some((p) => p.id === 'corrector-calcio-foliar')).toBe(true);
  });

  it('busca por cultivo recomendado', () => {
    const resultados = buscarEnCatalogo('papaya');
    expect(resultados.length).toBeGreaterThan(0);
  });

  it('filtra por categoría exacta', () => {
    const resultados = buscarEnCatalogo('', 'fungicida');
    expect(resultados.every((p) => p.categoria === 'fungicida')).toBe(true);
    expect(resultados.length).toBeGreaterThan(0);
  });

  it('no regresa productos de otra categoría cuando se filtra', () => {
    const resultados = buscarEnCatalogo('calcio', 'fungicida');
    expect(resultados).toHaveLength(0);
  });
});
