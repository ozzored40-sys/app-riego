import type { FertilizerProduct } from '../../domain/types/fertilizer';
import type { fertilizantes } from '../db/schema';

type FertilizerRow = typeof fertilizantes.$inferSelect;

export function fertilizerToRow(
  producto: FertilizerProduct,
  stockKg: number,
  now: string,
): FertilizerRow {
  return {
    id: producto.id,
    nombre: producto.nombre,
    formulaComercial: producto.formulaComercial ?? null,
    estadoFisico: producto.estadoFisico,
    composicionPct: producto.composicionPct,
    densidadKgL: producto.densidadKgL ?? null,
    solubilidadGL: producto.solubilidadGL ?? null,
    pureza: producto.pureza,
    costoPorKg: producto.costoPorKg,
    factorCE: producto.factorCE,
    porcentajeNa: producto.porcentajeNa,
    porcentajeCl: producto.porcentajeCl,
    categoriaTanque: producto.categoriaTanque,
    esCustom: producto.esCustom ?? false,
    stockKg,
    createdAt: now,
    updatedAt: now,
  };
}

export function rowToFertilizer(row: FertilizerRow): FertilizerProduct & { stockKg: number } {
  return {
    id: row.id,
    nombre: row.nombre,
    formulaComercial: row.formulaComercial ?? undefined,
    estadoFisico: row.estadoFisico,
    composicionPct: row.composicionPct,
    densidadKgL: row.densidadKgL ?? undefined,
    solubilidadGL: row.solubilidadGL ?? undefined,
    pureza: row.pureza,
    costoPorKg: row.costoPorKg,
    factorCE: row.factorCE,
    porcentajeNa: row.porcentajeNa,
    porcentajeCl: row.porcentajeCl,
    categoriaTanque: row.categoriaTanque,
    esCustom: row.esCustom,
    stockKg: row.stockKg,
  };
}
