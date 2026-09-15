import crypto from 'node:crypto';
import {
  whatsappConfigurado,
  enviarMensajeWhatsapp,
  resolverVerificacionWebhook,
  firmaWebhookValida,
} from '../lib/whatsapp';

describe('whatsappConfigurado', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('es false si falta cualquiera de las 3 variables', () => {
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_VERIFY_TOKEN;
    expect(whatsappConfigurado()).toBe(false);

    process.env.WHATSAPP_ACCESS_TOKEN = 'token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123';
    expect(whatsappConfigurado()).toBe(false);
  });

  it('es true cuando las 3 están presentes', () => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123';
    process.env.WHATSAPP_VERIFY_TOKEN = 'verify';
    expect(whatsappConfigurado()).toBe(true);
  });
});

describe('enviarMensajeWhatsapp', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('llama al endpoint de Graph API con el token y el cuerpo esperado', async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'token-secreto';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '1234567890';

    const fetchFalso = jest.fn().mockResolvedValue({ ok: true });
    await enviarMensajeWhatsapp('5213320967184', 'Hola, ¿qué cultivo tienes?', fetchFalso);

    expect(fetchFalso).toHaveBeenCalledWith(
      'https://graph.facebook.com/v21.0/1234567890/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-secreto' }),
      }),
    );
    const [, opciones] = fetchFalso.mock.calls[0];
    expect(JSON.parse(opciones.body)).toMatchObject({
      messaging_product: 'whatsapp',
      to: '5213320967184',
      type: 'text',
      text: { body: 'Hola, ¿qué cultivo tienes?' },
    });
  });

  it('lanza un error claro si WhatsApp no está configurado', async () => {
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;

    await expect(enviarMensajeWhatsapp('5213320967184', 'hola')).rejects.toThrow(
      /no está configurado/,
    );
  });

  it('propaga un error si la API de WhatsApp responde con error', async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123';

    const fetchFalso = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' });

    await expect(enviarMensajeWhatsapp('5213320967184', 'hola', fetchFalso)).rejects.toThrow(
      /error 401/,
    );
  });
});

describe('resolverVerificacionWebhook', () => {
  it('acepta cuando el modo y el token coinciden', () => {
    const resultado = resolverVerificacionWebhook(
      'subscribe',
      'mi-verify-token',
      'abc123',
      'mi-verify-token',
    );
    expect(resultado).toEqual({ ok: true, challenge: 'abc123' });
  });

  it('rechaza si el token no coincide', () => {
    const resultado = resolverVerificacionWebhook(
      'subscribe',
      'otro-token',
      'abc123',
      'mi-verify-token',
    );
    expect(resultado.ok).toBe(false);
  });

  it('rechaza si el modo no es subscribe', () => {
    const resultado = resolverVerificacionWebhook(
      'unsubscribe',
      'mi-verify-token',
      'abc123',
      'mi-verify-token',
    );
    expect(resultado.ok).toBe(false);
  });

  it('rechaza si no hay verifyToken configurado en el servidor', () => {
    const resultado = resolverVerificacionWebhook(
      'subscribe',
      'mi-verify-token',
      'abc123',
      undefined,
    );
    expect(resultado.ok).toBe(false);
  });
});

describe('firmaWebhookValida', () => {
  const appSecret = 'app-secret-de-prueba';
  const cuerpo = JSON.stringify({ hola: 'mundo' });

  function firmar(cuerpoAFirmar: string, secreto: string): string {
    return 'sha256=' + crypto.createHmac('sha256', secreto).update(cuerpoAFirmar).digest('hex');
  }

  it('acepta una firma correcta', () => {
    expect(firmaWebhookValida(cuerpo, firmar(cuerpo, appSecret), appSecret)).toBe(true);
  });

  it('rechaza una firma calculada con otro secreto', () => {
    expect(firmaWebhookValida(cuerpo, firmar(cuerpo, 'otro-secreto'), appSecret)).toBe(false);
  });

  it('rechaza si no viene firma', () => {
    expect(firmaWebhookValida(cuerpo, undefined, appSecret)).toBe(false);
  });

  it('rechaza si el cuerpo fue alterado', () => {
    const firmaDelOriginal = firmar(cuerpo, appSecret);
    expect(firmaWebhookValida(cuerpo + 'x', firmaDelOriginal, appSecret)).toBe(false);
  });
});
