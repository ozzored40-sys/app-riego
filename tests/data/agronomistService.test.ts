import { crearBaseDeDatosDePrueba } from './testDb';
import type { AppDatabase } from '../../src/data/db/types';
import { crearLote } from '../../src/data/repositories/loteRepository';
import {
  construirContextoLote,
  obtenerHistorialChat,
  reiniciarConversacion,
  enviarTurnoChat,
  enviarFotoChat,
} from '../../src/state/agronomistService';
import * as agronomistClient from '../../src/services/agronomistClient';
import type { FotoCapturada } from '../../src/services/photoCapture';

jest.mock('../../src/services/agronomistClient');

const enviarMensajeChatMock = agronomistClient.enviarMensajeChat as jest.MockedFunction<
  typeof agronomistClient.enviarMensajeChat
>;
const enviarFotoParaDiagnosticoMock =
  agronomistClient.enviarFotoParaDiagnostico as jest.MockedFunction<
    typeof agronomistClient.enviarFotoParaDiagnostico
  >;

function crearLoteDePrueba(db: AppDatabase) {
  return crearLote(db, {
    nombre: 'Lote de prueba',
    cropId: 'papaya',
    sistemaProduccion: 'suelo',
    fechaSiembra: '2026-01-01',
    areaHa: 1,
    plantasPorHa: 1500,
    rendimientoObjetivoTonHa: 40,
  });
}

describe('agronomistService', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = crearBaseDeDatosDePrueba();
    enviarMensajeChatMock.mockReset();
    enviarFotoParaDiagnosticoMock.mockReset();
  });

  describe('construirContextoLote', () => {
    it('arma el contexto con cultivo, etapa y sin diagnóstico si faltan datos base', () => {
      const lote = crearLoteDePrueba(db);
      const contexto = construirContextoLote(db, lote.id);
      expect(contexto.cultivo).toBe('Papaya');
      expect(contexto.sistemaProduccion).toBe('suelo');
      expect(contexto.etapaFenologica).toBeDefined();
      expect(contexto.ultimoDiagnosticoReglas).toBeUndefined();
    });

    it('lanza un error si el lote no existe', () => {
      expect(() => construirContextoLote(db, 'lote-inexistente')).toThrow('Lote no encontrado');
    });
  });

  describe('enviarTurnoChat', () => {
    it('guarda el mensaje del usuario y la respuesta del asistente, en orden', async () => {
      const lote = crearLoteDePrueba(db);
      enviarMensajeChatMock.mockResolvedValue({ respuesta: 'Cuéntame más sobre las hojas' });

      const mensaje = await enviarTurnoChat(db, lote.id, 'Mis hojas están amarillas');

      expect(mensaje.rol).toBe('assistant');
      expect(mensaje.contenido).toBe('Cuéntame más sobre las hojas');

      const historial = obtenerHistorialChat(db, lote.id);
      expect(historial).toHaveLength(2);
      expect(historial[0]).toMatchObject({ rol: 'user', contenido: 'Mis hojas están amarillas' });
      expect(historial[1]).toMatchObject({
        rol: 'assistant',
        contenido: 'Cuéntame más sobre las hojas',
      });
    });

    it('envía el historial completo y el contexto del lote al backend', async () => {
      const lote = crearLoteDePrueba(db);
      enviarMensajeChatMock.mockResolvedValue({ respuesta: 'Primera respuesta' });
      await enviarTurnoChat(db, lote.id, 'Primer mensaje');

      enviarMensajeChatMock.mockResolvedValue({ respuesta: 'Segunda respuesta' });
      await enviarTurnoChat(db, lote.id, 'Segundo mensaje');

      const [mensajesEnviados, contextoEnviado] = enviarMensajeChatMock.mock.calls[1];
      expect(mensajesEnviados).toEqual([
        { rol: 'user', contenido: 'Primer mensaje' },
        { rol: 'assistant', contenido: 'Primera respuesta' },
        { rol: 'user', contenido: 'Segundo mensaje' },
      ]);
      expect(contextoEnviado.cultivo).toBe('Papaya');
    });
  });

  describe('enviarFotoChat', () => {
    it('registra una nota de foto enviada y guarda la respuesta del asistente', async () => {
      const lote = crearLoteDePrueba(db);
      enviarFotoParaDiagnosticoMock.mockResolvedValue({
        respuesta: 'Veo manchas amarillas en el borde de la hoja',
      });

      const foto: FotoCapturada = { base64: 'ZmFrZQ==', mediaType: 'image/jpeg' };
      const mensaje = await enviarFotoChat(db, lote.id, foto, 'hojas con manchas');

      expect(mensaje.contenido).toContain('manchas');

      const historial = obtenerHistorialChat(db, lote.id);
      expect(historial).toHaveLength(2);
      expect(historial[0].contenido).toBe('📷 Foto enviada: hojas con manchas');

      expect(enviarFotoParaDiagnosticoMock).toHaveBeenCalledWith(
        'ZmFrZQ==',
        'image/jpeg',
        expect.objectContaining({ cultivo: 'Papaya' }),
        'hojas con manchas',
      );
    });

    it('usa una nota genérica cuando no hay descripción', async () => {
      const lote = crearLoteDePrueba(db);
      enviarFotoParaDiagnosticoMock.mockResolvedValue({ respuesta: 'Necesito más detalle' });

      const foto: FotoCapturada = { base64: 'ZmFrZQ==', mediaType: 'image/jpeg' };
      await enviarFotoChat(db, lote.id, foto);

      const historial = obtenerHistorialChat(db, lote.id);
      expect(historial[0].contenido).toBe('📷 Foto enviada para diagnóstico');
    });
  });

  describe('reiniciarConversacion', () => {
    it('borra todo el historial del lote', async () => {
      const lote = crearLoteDePrueba(db);
      enviarMensajeChatMock.mockResolvedValue({ respuesta: 'Hola' });
      await enviarTurnoChat(db, lote.id, 'Mensaje inicial');
      expect(obtenerHistorialChat(db, lote.id)).toHaveLength(2);

      reiniciarConversacion(db, lote.id);
      expect(obtenerHistorialChat(db, lote.id)).toHaveLength(0);
    });
  });
});
