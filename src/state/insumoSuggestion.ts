import type { CategoriaInsumo, FertilizerProduct } from '../domain/types/fertilizer';

/**
 * Palabras clave, en español y sin acentos ni mayúsculas, que si aparecen en la
 * respuesta del agrónomo virtual sugieren que esa categoría de insumo del catálogo
 * local podría ser relevante para el plan de acción. Es una heurística de texto
 * simple (no NLP real): sirve para acercarle al productor los insumos que ya tiene
 * registrados, no para tomar la decisión por él.
 */
const PALABRAS_CLAVE: Partial<Record<CategoriaInsumo, string[]>> = {
  fertilizante: [
    'fertilizante',
    'corrector de calcio',
    'nitrogeno',
    'potasio',
    'fosforo',
    'nutriente',
  ],
  enraizador: ['enraizador', 'enraizamiento', 'raiz'],
  mejoradorSuelo: ['mejorador de suelo', 'materia organica', 'estructura del suelo'],
  biologico: ['biologico', 'trichoderma', 'bacillus', 'microorganismo'],
  foliar: ['foliar', 'aspersion foliar'],
  bioestimulante: ['bioestimulante', 'estimulante'],
  ozonoChaman: ['ozono'],
};

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quita acentos (marcas diacríticas combinantes)
}

export function sugerirCategoriasPorTexto(texto: string): CategoriaInsumo[] {
  const textoNormalizado = normalizar(texto);
  const categorias: CategoriaInsumo[] = [];
  for (const [categoria, palabras] of Object.entries(PALABRAS_CLAVE) as [
    CategoriaInsumo,
    string[],
  ][]) {
    if (palabras.some((palabra) => textoNormalizado.includes(palabra))) {
      categorias.push(categoria);
    }
  }
  return categorias;
}

/** Filtra el catálogo local a los insumos cuya categoría se mencionó en el texto. */
export function sugerirInsumosPorTexto(
  texto: string,
  catalogo: FertilizerProduct[],
): FertilizerProduct[] {
  const categorias = sugerirCategoriasPorTexto(texto);
  if (categorias.length === 0) return [];
  return catalogo.filter((insumo) => categorias.includes(insumo.categoriaInsumo));
}
