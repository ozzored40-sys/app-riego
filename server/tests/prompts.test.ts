import { construirContextoLote } from '../lib/prompts';

describe('construirContextoLote', () => {
  it('incluye solo los campos presentes', () => {
    const texto = construirContextoLote({ cultivo: 'papaya' });
    expect(texto).toBe('Cultivo: papaya');
  });

  it('incluye todos los campos cuando están presentes', () => {
    const texto = construirContextoLote({
      cultivo: 'jitomate',
      etapaFenologica: 'Fructificación',
      sistemaProduccion: 'suelo',
      edadDiasCultivo: 60,
      ultimoDiagnosticoReglas: 'SAR alto en el agua',
    });
    expect(texto).toContain('Cultivo: jitomate');
    expect(texto).toContain('Etapa fenológica: Fructificación');
    expect(texto).toContain('Sistema de producción: suelo');
    expect(texto).toContain('Edad del cultivo: 60 días');
    expect(texto).toContain('SAR alto en el agua');
  });
});
