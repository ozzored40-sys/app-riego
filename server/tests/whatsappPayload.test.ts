import { extraerMensajesDeTexto } from '../lib/whatsappPayload';

describe('extraerMensajesDeTexto', () => {
  it('extrae un mensaje de texto entrante', () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [{ from: '5213320967184', type: 'text', text: { body: 'Hola' } }],
              },
            },
          ],
        },
      ],
    };
    expect(extraerMensajesDeTexto(payload)).toEqual([{ numeroDe: '5213320967184', texto: 'Hola' }]);
  });

  it('extrae varios mensajes de varias entradas/cambios', () => {
    const payload = {
      entry: [
        {
          changes: [
            { value: { messages: [{ from: '111', type: 'text', text: { body: 'a' } }] } },
            { value: { messages: [{ from: '222', type: 'text', text: { body: 'b' } }] } },
          ],
        },
      ],
    };
    expect(extraerMensajesDeTexto(payload)).toEqual([
      { numeroDe: '111', texto: 'a' },
      { numeroDe: '222', texto: 'b' },
    ]);
  });

  it('ignora mensajes que no son de texto (ej. imagen)', () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [{ from: '111', type: 'image', image: { id: 'abc' } }],
              },
            },
          ],
        },
      ],
    };
    expect(extraerMensajesDeTexto(payload)).toEqual([]);
  });

  it('ignora recibos de estado (sent/delivered/read) sin campo messages', () => {
    const payload = {
      entry: [{ changes: [{ value: { statuses: [{ id: '1', status: 'delivered' }] } }] }],
    };
    expect(extraerMensajesDeTexto(payload)).toEqual([]);
  });

  it('no truena con un payload vacío o con forma inesperada', () => {
    expect(extraerMensajesDeTexto({})).toEqual([]);
    expect(extraerMensajesDeTexto(null)).toEqual([]);
    expect(extraerMensajesDeTexto('texto')).toEqual([]);
    expect(extraerMensajesDeTexto({ entry: 'no es un arreglo' })).toEqual([]);
  });
});
