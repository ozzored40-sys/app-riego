import { crearBaseDeDatosDePrueba } from './testDb';
import type { AppDatabase } from '../../src/data/db/types';
import { crearLote } from '../../src/data/repositories/loteRepository';
import { upsertFertilizante } from '../../src/data/repositories/fertilizerInventoryRepository';
import { getFertilizerById } from '../../src/domain/fertilizers/library';
import {
  construirContextoVentas,
  obtenerHistorialVentas,
  reiniciarConversacionVentas,
  enviarTurnoVentas,
} from '../../src/state/salesAgentService';
import * as salesAgentClient from '../../src/services/salesAgentClient';

jest.mock('../../src/services/salesAgentClient');

const enviarMensajeVentasMock = salesAgentClient.enviarMensajeVentas as jest.MockedFunction<
  typeof salesAgentClient.enviarMensajeVentas
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

describe('salesAgentService', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = crearBaseDeDatosDePrueba();
    enviarMensajeVentasMock.mockReset();
  });

  describe('construirContextoVentas', () => {
    it('arma el contexto con cultivo y catálogo vacío si no hay insumos', () => {
      const lote = crearLoteDePrueba(db);
      const contexto = construirContextoVentas(db, lote.id);
      expect(contexto.cultivo).toBe('Papaya');
      expect(contexto.sistemaProduccion).toBe('suelo');
      expect(contexto.catalogo).toEqual([]);
    });

    it('incluye los insumos del catálogo local con precio y presentación', () => {
      const lote = crearLoteDePrueba(db);
      upsertFertilizante(db, getFertilizerById('urea'), 100);

      const contexto = construirContextoVentas(db, lote.id);
      expect(contexto.catalogo).toHaveLength(1);
      expect(contexto.catalogo[0]).toMatchObject({ nombre: 'Urea' });
    });

    it('lanza un error si el lote no existe', () => {
      expect(() => construirContextoVentas(db, 'lote-inexistente')).toThrow('Lote no encontrado');
    });
  });

  describe('enviarTurnoVentas', () => {
    it('guarda el mensaje del prospecto y la respuesta del asistente, en orden', async () => {
      const lote = crearLoteDePrueba(db);
      enviarMensajeVentasMock.mockResolvedValue({ respuesta: '¿Qué problema estás viendo?' });

      const mensaje = await enviarTurnoVentas(db, lote.id, 'Busco algo para fortalecer raíz');

      expect(mensaje.rol).toBe('assistant');
      expect(mensaje.contenido).toBe('¿Qué problema estás viendo?');

      const historial = obtenerHistorialVentas(db, lote.id);
      expect(historial).toHaveLength(2);
      expect(historial[0]).toMatchObject({
        rol: 'user',
        contenido: 'Busco algo para fortalecer raíz',
      });
      expect(historial[1]).toMatchObject({
        rol: 'assistant',
        contenido: '¿Qué problema estás viendo?',
      });
    });

    it('mantiene su propio historial, separado del agrónomo', async () => {
      const lote = crearLoteDePrueba(db);
      enviarMensajeVentasMock.mockResolvedValue({ respuesta: 'Hola' });
      await enviarTurnoVentas(db, lote.id, 'Mensaje de ventas');

      expect(obtenerHistorialVentas(db, lote.id)).toHaveLength(2);
    });
  });

  describe('reiniciarConversacionVentas', () => {
    it('borra todo el historial del lote', async () => {
      const lote = crearLoteDePrueba(db);
      enviarMensajeVentasMock.mockResolvedValue({ respuesta: 'Hola' });
      await enviarTurnoVentas(db, lote.id, 'Mensaje inicial');
      expect(obtenerHistorialVentas(db, lote.id)).toHaveLength(2);

      reiniciarConversacionVentas(db, lote.id);
      expect(obtenerHistorialVentas(db, lote.id)).toHaveLength(0);
    });
  });
});
