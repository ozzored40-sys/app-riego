import { construirContextoVentas } from '../lib/prompts';

describe('construirContextoVentas', () => {
  it('incluye solo los campos presentes y avisa cuando el catálogo está vacío', () => {
    const texto = construirContextoVentas({ catalogo: [] });
    expect(texto).toContain('Catálogo disponible: (vacío');
    expect(texto).not.toContain('Cultivo:');
  });

  it('incluye cultivo, etapa, diagnóstico y el catálogo con precio y presentación', () => {
    const texto = construirContextoVentas({
      cultivo: 'jitomate',
      etapaFenologica: 'Fructificación',
      sistemaProduccion: 'suelo',
      ultimoDiagnosticoReglas: 'SAR alto en el agua',
      catalogo: [
        {
          nombre: 'Nitrato de calcio',
          categoriaInsumo: 'fertilizante',
          presentacionComercial: 'Saco 25 kg',
          costoPorKg: 12.5,
          unidadPrecio: 'kg',
        },
      ],
    });
    expect(texto).toContain('Cultivo: jitomate');
    expect(texto).toContain('Etapa fenológica: Fructificación');
    expect(texto).toContain('Sistema de producción: suelo');
    expect(texto).toContain('SAR alto en el agua');
    expect(texto).toContain('Nitrato de calcio (fertilizante, Saco 25 kg): $12.5/kg');
  });
});
