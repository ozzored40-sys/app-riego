import {
  enviarMensajeChat,
  enviarFotoParaDiagnostico,
  asistenteConfigurado,
} from '../../src/services/agronomistClient';

describe('agronomistClient', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('asistenteConfigurado es false si faltan las variables de entorno', () => {
    delete process.env.EXPO_PUBLIC_AGRONOMIST_API_URL;
    delete process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY;
    expect(asistenteConfigurado()).toBe(false);
  });

  it('asistenteConfigurado es true cuando ambas variables están presentes', () => {
    process.env.EXPO_PUBLIC_AGRONOMIST_API_URL = 'https://backend.example.com';
    process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY = 'clave-secreta';
    expect(asistenteConfigurado()).toBe(true);
  });

  it('enviarMensajeChat manda el header de autorización y el cuerpo esperado', async () => {
    process.env.EXPO_PUBLIC_AGRONOMIST_API_URL = 'https://backend.example.com';
    process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY = 'clave-secreta';

    const fetchFalso = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ respuesta: 'Hola, cuéntame más' }),
    });

    const resultado = await enviarMensajeChat(
      [{ rol: 'user', contenido: 'Mis hojas están amarillas' }],
      { cultivo: 'jitomate' },
      fetchFalso as unknown as typeof fetch,
    );

    expect(resultado.respuesta).toBe('Hola, cuéntame más');
    expect(fetchFalso).toHaveBeenCalledWith(
      'https://backend.example.com/api/chat',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Chaman-App-Key': 'clave-secreta' }),
      }),
    );
  });

  it('enviarFotoParaDiagnostico llama a /api/diagnose-photo', async () => {
    process.env.EXPO_PUBLIC_AGRONOMIST_API_URL = 'https://backend.example.com';
    process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY = 'clave-secreta';

    const fetchFalso = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ respuesta: 'Veo manchas amarillas en el borde de la hoja' }),
    });

    const resultado = await enviarFotoParaDiagnostico(
      'ZmFrZS1pbWFnZQ==',
      'image/jpeg',
      { cultivo: 'chile' },
      undefined,
      fetchFalso as unknown as typeof fetch,
    );

    expect(resultado.respuesta).toContain('manchas');
    const [url] = fetchFalso.mock.calls[0];
    expect(url).toBe('https://backend.example.com/api/diagnose-photo');
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
      enviarMensajeChat(
        [{ rol: 'user', contenido: 'hola' }],
        { cultivo: 'chile' },
        fetchFalso as unknown as typeof fetch,
      ),
    ).rejects.toThrow('No autorizado');
  });

  it('lanza un error claro si el asistente no está configurado', async () => {
    delete process.env.EXPO_PUBLIC_AGRONOMIST_API_URL;
    delete process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY;

    await expect(
      enviarMensajeChat([{ rol: 'user', contenido: 'hola' }], { cultivo: 'chile' }),
    ).rejects.toThrow(/no está configurado/);
  });
});
