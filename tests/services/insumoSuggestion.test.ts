import {
  sugerirCategoriasPorTexto,
  sugerirInsumosPorTexto,
} from '../../src/state/insumoSuggestion';
import { FERTILIZER_LIBRARY } from '../../src/domain/fertilizers/library';

describe('sugerirCategoriasPorTexto', () => {
  it('detecta "enraizador" ignorando mayúsculas y acentos', () => {
    expect(sugerirCategoriasPorTexto('Aplica un ENRAIZADOR en la próxima semana')).toContain(
      'enraizador',
    );
  });

  it('detecta varias categorías en el mismo texto', () => {
    const categorias = sugerirCategoriasPorTexto(
      'Recomiendo un corrector de calcio y también un bioestimulante foliar',
    );
    expect(categorias).toEqual(
      expect.arrayContaining(['fertilizante', 'bioestimulante', 'foliar']),
    );
  });

  it('devuelve arreglo vacío si no hay coincidencias', () => {
    expect(sugerirCategoriasPorTexto('Revisa el riego y vuelve a escribirme mañana')).toEqual([]);
  });
});

describe('sugerirInsumosPorTexto', () => {
  it('filtra el catálogo a la categoría detectada', () => {
    const sugerencias = sugerirInsumosPorTexto(
      'Te recomiendo aplicar un fertilizante rico en potasio',
      FERTILIZER_LIBRARY,
    );
    expect(sugerencias.length).toBeGreaterThan(0);
    expect(sugerencias.every((i) => i.categoriaInsumo === 'fertilizante')).toBe(true);
  });

  it('devuelve arreglo vacío si el texto no menciona ninguna categoría conocida', () => {
    expect(
      sugerirInsumosPorTexto('Sigamos monitoreando la próxima semana', FERTILIZER_LIBRARY),
    ).toEqual([]);
  });
});
