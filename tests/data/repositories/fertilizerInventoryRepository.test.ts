import { crearBaseDeDatosDePrueba } from '../testDb';
import {
  upsertFertilizante,
  listarInventarioFertilizantes,
  actualizarStockFertilizante,
  actualizarPrecioFertilizante,
  obtenerFertilizante,
} from '../../../src/data/repositories/fertilizerInventoryRepository';
import { getFertilizerById, FERTILIZER_LIBRARY } from '../../../src/domain/fertilizers/library';
import { sembrarFertilizantes } from '../../../src/data/seed/loadCropsAndFertilizers';

describe('fertilizerInventoryRepository', () => {
  it('inserta un fertilizante y lo lee de vuelta', () => {
    const db = crearBaseDeDatosDePrueba();
    const producto = getFertilizerById('urea');
    upsertFertilizante(db, producto, 100);

    const leido = obtenerFertilizante(db, 'urea');
    expect(leido?.nombre).toBe('Urea');
    expect(leido?.stockKg).toBe(100);
  });

  it('upsert por id no duplica filas al insertarse dos veces', () => {
    const db = crearBaseDeDatosDePrueba();
    const producto = getFertilizerById('urea');
    upsertFertilizante(db, producto, 100);
    upsertFertilizante(db, producto, 150);

    const inventario = listarInventarioFertilizantes(db);
    const filasUrea = inventario.filter((f) => f.id === 'urea');
    expect(filasUrea).toHaveLength(1);
    expect(filasUrea[0].stockKg).toBe(150);
  });

  it('actualiza stock y precio de forma independiente', () => {
    const db = crearBaseDeDatosDePrueba();
    upsertFertilizante(db, getFertilizerById('sulfato-potasio'), 50);

    actualizarStockFertilizante(db, 'sulfato-potasio', 30);
    actualizarPrecioFertilizante(db, 'sulfato-potasio', 25);

    const leido = obtenerFertilizante(db, 'sulfato-potasio');
    expect(leido?.stockKg).toBe(30);
    expect(leido?.costoPorKg).toBe(25);
  });
});

describe('sembrarFertilizantes', () => {
  it('carga toda la biblioteca de fertilizantes en la base de datos', () => {
    const db = crearBaseDeDatosDePrueba();
    sembrarFertilizantes(db);

    const inventario = listarInventarioFertilizantes(db);
    expect(inventario).toHaveLength(FERTILIZER_LIBRARY.length);
  });

  it('es idempotente: sembrar dos veces no duplica filas', () => {
    const db = crearBaseDeDatosDePrueba();
    sembrarFertilizantes(db);
    sembrarFertilizantes(db);

    const inventario = listarInventarioFertilizantes(db);
    expect(inventario).toHaveLength(FERTILIZER_LIBRARY.length);
  });
});
