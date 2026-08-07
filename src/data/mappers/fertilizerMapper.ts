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
    categoriaInsumo: producto.categoriaInsumo,
    formulaComercial: producto.formulaComercial ?? null,
    estadoFisico: producto.estadoFisico,
    composicionPct: producto.composicionPct,
    densidadKgL: producto.densidadKgL ?? null,
    solubilidadGL: producto.solubilidadGL ?? null,
    pureza: producto.pureza,
    costoPorKg: producto.costoPorKg,
    unidadPrecio: producto.unidadPrecio ?? null,
    presentacionComercial: producto.presentacionComercial ?? null,
    fichaTecnicaUrl: producto.fichaTecnicaUrl ?? null,
    factorCE: producto.factorCE,
    porcentajeNa: producto.porcentajeNa,
    porcentajeCl: producto.porcentajeCl,
    categoriaTanque: producto.categoriaTanque ?? null,
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
    categoriaInsumo: row.categoriaInsumo,
    formulaComercial: row.formulaComercial ?? undefined,
    estadoFisico: row.estadoFisico,
    composicionPct: row.composicionPct,
    densidadKgL: row.densidadKgL ?? undefined,
    solubilidadGL: row.solubilidadGL ?? undefined,
    pureza: row.pureza,
    costoPorKg: row.costoPorKg,
    unidadPrecio: row.unidadPrecio ?? undefined,
    presentacionComercial: row.presentacionComercial ?? undefined,
    fichaTecnicaUrl: row.fichaTecnicaUrl ?? undefined,
    factorCE: row.factorCE,
    porcentajeNa: row.porcentajeNa,
    porcentajeCl: row.porcentajeCl,
    categoriaTanque: row.categoriaTanque ?? undefined,
    esCustom: row.esCustom,
    stockKg: row.stockKg,
  };
}
