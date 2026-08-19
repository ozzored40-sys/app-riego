import crypto from 'node:crypto';
import {
  resolverDesafioVerificacion,
  verificarFirmaWebhook,
  extraerMensajesEntrantes,
} from '../lib/whatsapp';

describe('resolverDesafioVerificacion', () => {
  const ORIGINAL = process.env.WHATSAPP_VERIFY_TOKEN;
  afterEach(() => {
    process.env.WHATSAPP_VERIFY_TOKEN = ORIGINAL;
  });

  it('regresa el challenge si el modo y el token coinciden', () => {
    process.env.WHATSAPP_VERIFY_TOKEN = 'mi-token';
    const resultado = resolverDesafioVerificacion({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'mi-token',
      'hub.challenge': '12345',
    });
    expect(resultado).toBe('12345');
  });

  it('regresa null si el token no coincide', () => {
    process.env.WHATSAPP_VERIFY_TOKEN = 'mi-token';
    const resultado = resolverDesafioVerificacion({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'otro',
      'hub.challenge': '12345',
    });
    expect(resultado).toBeNull();
  });

  it('regresa null si el servidor no tiene token configurado', () => {
    delete process.env.WHATSAPP_VERIFY_TOKEN;
    const resultado = resolverDesafioVerificacion({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'lo-que-sea',
      'hub.challenge': '12345',
    });
    expect(resultado).toBeNull();
  });
});

describe('verificarFirmaWebhook', () => {
  const ORIGINAL = process.env.WHATSAPP_APP_SECRET;
  afterEach(() => {
    process.env.WHATSAPP_APP_SECRET = ORIGINAL;
  });

  it('acepta una firma calculada correctamente', () => {
    process.env.WHATSAPP_APP_SECRET = 'secreto-app';
    const cuerpo = Buffer.from(JSON.stringify({ hola: 'mundo' }));
    const firma = 'sha256=' + crypto.createHmac('sha256', 'secreto-app').update(cuerpo).digest('hex');
    expect(verificarFirmaWebhook(cuerpo, firma)).toBe(true);
  });

  it('rechaza una firma incorrecta', () => {
    process.env.WHATSAPP_APP_SECRET = 'secreto-app';
    const cuerpo = Buffer.from(JSON.stringify({ hola: 'mundo' }));
    expect(verificarFirmaWebhook(cuerpo, 'sha256=falsa')).toBe(false);
  });

  it('rechaza si falta el header de firma', () => {
    process.env.WHATSAPP_APP_SECRET = 'secreto-app';
    const cuerpo = Buffer.from('{}');
    expect(verificarFirmaWebhook(cuerpo, undefined)).toBe(false);
  });

  it('rechaza si el servidor no tiene el secreto configurado', () => {
    delete process.env.WHATSAPP_APP_SECRET;
    const cuerpo = Buffer.from('{}');
    expect(verificarFirmaWebhook(cuerpo, 'sha256=algo')).toBe(false);
  });
});

describe('extraerMensajesEntrantes', () => {
  it('extrae un mensaje de texto con el nombre de perfil', () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ wa_id: '5219991234567', profile: { name: 'Don Pedro' } }],
                messages: [
                  { from: '5219991234567', id: 'wamid.1', type: 'text', text: { body: 'Hola' } },
                ],
              },
            },
          ],
        },
      ],
    };
    const mensajes = extraerMensajesEntrantes(payload);
    expect(mensajes).toEqual([
      {
        tipo: 'text',
        telefono: '5219991234567',
        idMensaje: 'wamid.1',
        nombrePerfil: 'Don Pedro',
        texto: 'Hola',
      },
    ]);
  });

  it('extrae un mensaje de imagen', () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: '5219991234567',
                    id: 'wamid.2',
                    type: 'image',
                    image: { id: 'media-123', caption: 'mira esto' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const mensajes = extraerMensajesEntrantes(payload);
    expect(mensajes).toEqual([
      {
        tipo: 'image',
        telefono: '5219991234567',
        idMensaje: 'wamid.2',
        nombrePerfil: undefined,
        idMedia: 'media-123',
        caption: 'mira esto',
      },
    ]);
  });

  it('marca como no_soportado un tipo desconocido (ej. audio)', () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [{ from: '5219991234567', id: 'wamid.3', type: 'audio', audio: { id: 'x' } }],
              },
            },
          ],
        },
      ],
    };
    const mensajes = extraerMensajesEntrantes(payload);
    expect(mensajes).toEqual([
      {
        tipo: 'no_soportado',
        telefono: '5219991234567',
        idMensaje: 'wamid.3',
        nombrePerfil: undefined,
        tipoOriginal: 'audio',
      },
    ]);
  });

  it('regresa arreglo vacío para notificaciones de estado (sin messages)', () => {
    const payload = {
      entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.4', status: 'delivered' }] } }] }],
    };
    expect(extraerMensajesEntrantes(payload)).toEqual([]);
  });

  it('regresa arreglo vacío si el payload no tiene forma de webhook de WhatsApp', () => {
    expect(extraerMensajesEntrantes({})).toEqual([]);
    expect(extraerMensajesEntrantes(null)).toEqual([]);
  });
});
