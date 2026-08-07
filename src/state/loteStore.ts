import { create } from 'zustand';
import { db } from '../data/db/client';
import { listarLotes, type Lote } from '../data/repositories/loteRepository';

interface LoteStoreState {
  lotes: Lote[];
  cargarLotes: () => void;
}

/** Store de lectura: la lista de lotes se recarga desde SQLite tras cada mutación
 * (crear/actualizar/eliminar), no se mantiene un estado optimista duplicado. */
export const useLoteStore = create<LoteStoreState>((set) => ({
  lotes: [],
  cargarLotes: () => set({ lotes: listarLotes(db) }),
}));
