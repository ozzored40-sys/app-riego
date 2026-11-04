import { openwaConfigurado, enviarMensajeOpenwa } from '../lib/openwa';
import { extraerMensajeOpenwa } from '../lib/openwaPayload';

const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function configurar() {
  process.env.OPENWA_BASE_URL = 'https://openwa.ejemplo.com/';
  process.env.OPENWA_API_KEY = 'owa_k1_secreta';
  process.env.OPENWA_SESSION_ID = 'sesion-ventas';
  process.env.OPENWA_WEBHOOK_SECRET = 'secreto-de-al-menos-16';
}

describe('openwaConfigurado', () => {
  it('es false si falta alguna variable y true con las 4', () => {
    delete process.env.OPENWA_BASE_URL;
    delete process.env.OPENWA_API_KEY;
    delete process.env.OPENWA_SESSION_ID;
    delete process.env.OPENWA_WEBHOOK_SECRET;
    expect(openwaConfigurado()).toBe(false);
    configurar();
    expect(openwaConfigurado()).toBe(true);
  });
});

describe('enviarMensajeOpenwa', () => {
  it('llama a send-text con la API key y el chatId', async () => {
    configurar();
    const fetchFalso = jest.fn().mockResolvedValue({ ok: true });
    await enviarMensajeOpenwa('5213320967184@c.us', 'Hola', fetchFalso);

    expect(fetchFalso).toHaveBeenCalledWith(
      'https://openwa.ejemplo.com/api/sessions/sesion-ventas/messages/send-text',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-API-Key': 'owa_k1_secreta' }),
      }),
    );
    const [, opciones] = fetchFalso.mock.calls[0];
    expect(JSON.parse(opciones.body)).toEqual({ chatId: '5213320967184@c.us', text: 'Hola' });
  });

  it('recorta el texto al máximo de 4096 caracteres de OpenWA', async () => {
    configurar();
    const fetchFalso = jest.fn().mockResolvedValue({ ok: true });
    await enviarMensajeOpenwa('1@c.us', 'a'.repeat(5000), fetchFalso);
    expect(JSON.parse(fetchFalso.mock.calls[0][1].body).text).toHaveLength(4096);
  });

  it('lanza un error claro si no está configurado', async () => {
    delete process.env.OPENWA_BASE_URL;
    await expect(enviarMensajeOpenwa('1@c.us', 'hola')).rejects.toThrow(/no está configurado/);
  });

  it('propaga el error si OpenWA responde con error', async () => {
    configurar();
    const fetchFalso = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 409, text: async () => 'engine not ready' });
    await expect(enviarMensajeOpenwa('1@c.us', 'hola', fetchFalso)).rejects.toThrow(/409/);
  });
});

describe('extraerMensajeOpenwa', () => {
  const base = {
    event: 'message.received',
    timestamp: '2026-11-04T10:00:00.000Z',
    sessionId: 'sesion-ventas',
    idempotencyKey: 'msg_sesion-ventas_3EB0ABC_wh1',
    deliveryId: 'dlv_1',
    data: {
      id: '3EB0ABC',
      from: '5213320967184@c.us',
      chatId: '5213320967184@c.us',
      body: '¿Tienen nitrato de calcio?',
      type: 'text',
      fromMe: false,
      isGroup: false,
      kind: 'individual',
    },
  };

  it('extrae un mensaje de texto entrante de un chat individual', () => {
    expect(extraerMensajeOpenwa(base)).toEqual({
      sessionId: 'sesion-ventas',
      chatId: '5213320967184@c.us',
      texto: '¿Tienen nitrato de calcio?',
      idempotencyKey: 'msg_sesion-ventas_3EB0ABC_wh1',
    });
  });

  it.each([
    ['otro evento', { ...base, event: 'message.ack' }],
    ['mensaje propio', { ...base, data: { ...base.data, fromMe: true } }],
    ['grupo', { ...base, data: { ...base.data, isGroup: true, kind: 'group' } }],
    ['estado', { ...base, data: { ...base.data, kind: 'status' } }],
    ['imagen', { ...base, data: { ...base.data, type: 'image' } }],
    ['texto vacío', { ...base, data: { ...base.data, body: '   ' } }],
    ['sin data', { ...base, data: undefined }],
    ['no es objeto', 'hola'],
  ])('ignora: %s', (_nombre, payload) => {
    expect(extraerMensajeOpenwa(payload)).toBeNull();
  });
});
