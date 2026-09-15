import {
  obtenerHistorialWhatsapp,
  agregarTurnoWhatsapp,
  borrarHistorialWhatsapp,
} from '../lib/salesConversationStore';

const redisGetMock = jest.fn();
const redisSetMock = jest.fn();
const redisDelMock = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: redisGetMock,
    set: redisSetMock,
    del: redisDelMock,
  })),
}));

describe('salesConversationStore', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      KV_REST_API_URL: 'https://kv.example.com',
      KV_REST_API_TOKEN: 'token',
    };
    redisGetMock.mockReset();
    redisSetMock.mockReset();
    redisDelMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('obtenerHistorialWhatsapp devuelve [] si no hay nada guardado', async () => {
    redisGetMock.mockResolvedValue(null);
    const historial = await obtenerHistorialWhatsapp('5213320967184');
    expect(historial).toEqual([]);
    expect(redisGetMock).toHaveBeenCalledWith('ventas:whatsapp:5213320967184');
  });

  it('agregarTurnoWhatsapp concatena al historial previo y lo guarda con TTL', async () => {
    redisGetMock.mockResolvedValue([{ rol: 'user', contenido: 'Hola' }]);

    const actualizado = await agregarTurnoWhatsapp('5213320967184', [
      { rol: 'assistant', contenido: 'Hola, ¿qué cultivo tienes?' },
    ]);

    expect(actualizado).toEqual([
      { rol: 'user', contenido: 'Hola' },
      { rol: 'assistant', contenido: 'Hola, ¿qué cultivo tienes?' },
    ]);
    expect(redisSetMock).toHaveBeenCalledWith(
      'ventas:whatsapp:5213320967184',
      actualizado,
      expect.objectContaining({ ex: expect.any(Number) }),
    );
  });

  it('agregarTurnoWhatsapp recorta al máximo de mensajes permitido', async () => {
    const historialLargo = Array.from({ length: 30 }, (_, i) => ({
      rol: i % 2 === 0 ? 'user' : 'assistant',
      contenido: `mensaje ${i}`,
    }));
    redisGetMock.mockResolvedValue(historialLargo);

    const actualizado = await agregarTurnoWhatsapp('5213320967184', [
      { rol: 'user', contenido: 'uno nuevo' },
    ]);

    expect(actualizado).toHaveLength(30);
    expect(actualizado[actualizado.length - 1]).toEqual({ rol: 'user', contenido: 'uno nuevo' });
  });

  it('borrarHistorialWhatsapp borra la clave del número', async () => {
    await borrarHistorialWhatsapp('5213320967184');
    expect(redisDelMock).toHaveBeenCalledWith('ventas:whatsapp:5213320967184');
  });
});
