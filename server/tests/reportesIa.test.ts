import { guardarReporteIa, validarReporteIa } from '../lib/reportesIa';

describe('validarReporteIa', () => {
  const valido = { origen: 'especialista:capi1', motivo: 'incorrecto', contenido: 'respuesta' };

  it('acepta un reporte válido con o sin comentario', () => {
    expect(validarReporteIa(valido).ok).toBe(true);
    expect(validarReporteIa({ ...valido, comentario: 'la dosis no coincide' }).ok).toBe(true);
  });

  it('rechaza motivos, contenidos u orígenes inválidos', () => {
    expect(validarReporteIa({ ...valido, motivo: 'spam' }).ok).toBe(false);
    expect(validarReporteIa({ ...valido, contenido: '' }).ok).toBe(false);
    expect(validarReporteIa({ ...valido, origen: 'x'.repeat(61) }).ok).toBe(false);
    expect(validarReporteIa({ ...valido, comentario: 3 }).ok).toBe(false);
    expect(validarReporteIa(null).ok).toBe(false);
  });
});

describe('guardarReporteIa', () => {
  it('sin Redis configurado, solo registra el reporte en los logs', async () => {
    const espia = jest.spyOn(console, 'warn').mockImplementation(() => {});
    delete process.env.KV_REST_API_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    await guardarReporteIa(
      { origen: 'protocolo', motivo: 'peligroso', contenido: 'texto' },
      new Date('2026-10-24T00:00:00Z'),
    );
    expect(espia).toHaveBeenCalledWith(expect.stringContaining('"motivo":"peligroso"'));
    espia.mockRestore();
  });
});
