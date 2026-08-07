import {
  construirUrlOpenMeteo,
  parsearRespuestaOpenMeteo,
  obtenerClimaDeHoy,
  COEFICIENTE_LLUVIA_EFECTIVA,
} from '../../src/services/openMeteoClient';

describe('construirUrlOpenMeteo', () => {
  it('incluye latitud, longitud y las variables diarias necesarias', () => {
    const url = construirUrlOpenMeteo(19.43, -99.13);
    expect(url).toContain('latitude=19.43');
    expect(url).toContain('longitude=-99.13');
    expect(url).toContain('et0_fao_evapotranspiration');
    expect(url).toContain('precipitation_sum');
  });
});

describe('parsearRespuestaOpenMeteo', () => {
  it('extrae ETo y aplica el coeficiente de lluvia efectiva', () => {
    const clima = parsearRespuestaOpenMeteo({
      daily: { et0_fao_evapotranspiration: [5.2], precipitation_sum: [10] },
    });
    expect(clima.etoMmDia).toBe(5.2);
    expect(clima.lluviaEfectivaMmDia).toBeCloseTo(10 * COEFICIENTE_LLUVIA_EFECTIVA, 6);
  });

  it('trata la lluvia ausente como 0', () => {
    const clima = parsearRespuestaOpenMeteo({ daily: { et0_fao_evapotranspiration: [4] } });
    expect(clima.lluviaEfectivaMmDia).toBe(0);
  });

  it('lanza un error claro si falta la evapotranspiración', () => {
    expect(() => parsearRespuestaOpenMeteo({ daily: {} })).toThrow(/evapotranspiración/);
  });
});

describe('obtenerClimaDeHoy', () => {
  it('devuelve el clima parseado usando el fetch inyectado', async () => {
    const fetchFalso = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ daily: { et0_fao_evapotranspiration: [6], precipitation_sum: [0] } }),
    });

    const clima = await obtenerClimaDeHoy(19.43, -99.13, fetchFalso as unknown as typeof fetch);
    expect(clima.etoMmDia).toBe(6);
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it('lanza un error si la respuesta HTTP no es exitosa (para no bloquear el flujo manual)', async () => {
    const fetchFalso = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(
      obtenerClimaDeHoy(19.43, -99.13, fetchFalso as unknown as typeof fetch),
    ).rejects.toThrow(/500/);
  });
});
