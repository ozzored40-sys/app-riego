import { crearBaseDeDatosDePrueba } from '../testDb';
import {
  crearLote,
  obtenerLote,
  listarLotes,
  actualizarLote,
  eliminarLote,
} from '../../../src/data/repositories/loteRepository';

describe('loteRepository', () => {
  it('crea un lote y lo lee de vuelta con los mismos datos', () => {
    const db = crearBaseDeDatosDePrueba();

    const creado = crearLote(db, {
      nombre: 'Lote demo jitomate',
      cropId: 'jitomate',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 2,
      plantasPorHa: 20000,
      rendimientoObjetivoTonHa: 80,
    });

    const leido = obtenerLote(db, creado.id);
    expect(leido).toBeDefined();
    expect(leido?.nombre).toBe('Lote demo jitomate');
    expect(leido?.cropId).toBe('jitomate');
    expect(leido?.areaHa).toBe(2);
  });

  it('lista los lotes creados, más reciente primero', () => {
    const db = crearBaseDeDatosDePrueba();
    crearLote(db, {
      nombre: 'Lote A',
      cropId: 'papaya',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 1,
      plantasPorHa: 1600,
      rendimientoObjetivoTonHa: 100,
    });
    crearLote(db, {
      nombre: 'Lote B',
      cropId: 'chile',
      sistemaProduccion: 'sustrato',
      fechaSiembra: '2026-01-02',
      areaHa: 0.5,
      plantasPorHa: 25000,
      rendimientoObjetivoTonHa: 60,
    });

    const lotes = listarLotes(db);
    expect(lotes).toHaveLength(2);
  });

  it('actualiza un lote existente', () => {
    const db = crearBaseDeDatosDePrueba();
    const creado = crearLote(db, {
      nombre: 'Lote original',
      cropId: 'pepino',
      sistemaProduccion: 'hidroponia',
      fechaSiembra: '2026-01-01',
      areaHa: 1,
      plantasPorHa: 30000,
      rendimientoObjetivoTonHa: 90,
    });

    const actualizado = actualizarLote(db, creado.id, { nombre: 'Lote renombrado' });
    expect(actualizado?.nombre).toBe('Lote renombrado');
  });

  it('elimina un lote', () => {
    const db = crearBaseDeDatosDePrueba();
    const creado = crearLote(db, {
      nombre: 'Lote a borrar',
      cropId: 'limon',
      sistemaProduccion: 'suelo',
      fechaSiembra: '2026-01-01',
      areaHa: 1,
      plantasPorHa: 500,
      rendimientoObjetivoTonHa: 30,
    });

    eliminarLote(db, creado.id);
    expect(obtenerLote(db, creado.id)).toBeUndefined();
  });
});
