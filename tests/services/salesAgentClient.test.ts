import { enviarMensajeVentas, agenteVentasConfigurado } from '../../src/services/salesAgentClient';

describe('salesAgentClient', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('agenteVentasConfigurado es false si faltan las variables de entorno', () => {
    delete process.env.EXPO_PUBLIC_AGRONOMIST_API_URL;
    delete process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY;
    expect(agenteVentasConfigurado()).toBe(false);
  });

  it('agenteVentasConfigurado es true cuando ambas variables están presentes', () => {
    process.env.EXPO_PUBLIC_AGRONOMIST_API_URL = 'https://backend.example.com';
    process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY = 'clave-secreta';
    expect(agenteVentasConfigurado()).toBe(true);
  });

  it('enviarMensajeVentas llama a /api/sales-chat con el header de autorización', async () => {
    process.env.EXPO_PUBLIC_AGRONOMIST_API_URL = 'https://backend.example.com';
    process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY = 'clave-secreta';

    const fetchFalso = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ respuesta: 'Te recomiendo el bioestimulante X' }),
    });

    const resultado = await enviarMensajeVentas(
      [{ rol: 'user', contenido: 'Busco algo para fortalecer raíz' }],
      { catalogo: [] },
      fetchFalso as unknown as typeof fetch,
    );

    expect(resultado.respuesta).toBe('Te recomiendo el bioestimulante X');
    expect(fetchFalso).toHaveBeenCalledWith(
      'https://backend.example.com/api/sales-chat',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Chaman-App-Key': 'clave-secreta' }),
      }),
    );
  });

  it('propaga el mensaje de error del backend cuando la respuesta no es exitosa', async () => {
    process.env.EXPO_PUBLIC_AGRONOMIST_API_URL = 'https://backend.example.com';
    process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY = 'clave-secreta';

    const fetchFalso = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'No autorizado' }),
    });

    await expect(
      enviarMensajeVentas(
        [{ rol: 'user', contenido: 'hola' }],
        { catalogo: [] },
        fetchFalso as unknown as typeof fetch,
      ),
    ).rejects.toThrow('No autorizado');
  });

  it('lanza un error claro si el agente no está configurado', async () => {
    delete process.env.EXPO_PUBLIC_AGRONOMIST_API_URL;
    delete process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY;

    await expect(
      enviarMensajeVentas([{ rol: 'user', contenido: 'hola' }], { catalogo: [] }),
    ).rejects.toThrow(/no está configurado/);
  });
});
