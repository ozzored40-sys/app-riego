import type { AppDatabase } from '../data/db/types';
import {
  crearSalesChatMessage,
  listarSalesChatMessagesDeLote,
  borrarHistorialVentas,
  type SalesChatMessage,
} from '../data/repositories/salesChatMessageRepository';
import { listarInventarioFertilizantes } from '../data/repositories/fertilizerInventoryRepository';
import { obtenerInfoBaseLote } from './loteContextHelpers';
import {
  enviarMensajeVentas,
  type ContextoVentas,
  type ProductoCatalogoVentas,
} from '../services/salesAgentClient';
import type { MensajeChat } from '../services/agronomistClient';

/** Arma el contexto para el agente de ventas: cultivo/diagnóstico del lote + catálogo de insumos disponible. */
export function construirContextoVentas(db: AppDatabase, loteId: string): ContextoVentas {
  const info = obtenerInfoBaseLote(db, loteId);

  const catalogo: ProductoCatalogoVentas[] = listarInventarioFertilizantes(db).map((producto) => ({
    nombre: producto.nombre,
    categoriaInsumo: producto.categoriaInsumo,
    presentacionComercial: producto.presentacionComercial,
    costoPorKg: producto.costoPorKg,
    unidadPrecio: producto.unidadPrecio,
  }));

  return {
    cultivo: info.cultivoNombre,
    etapaFenologica: info.etapaFenologica,
    sistemaProduccion: info.sistemaProduccion,
    ultimoDiagnosticoReglas: info.ultimoDiagnosticoReglas,
    catalogo,
  };
}

export function obtenerHistorialVentas(db: AppDatabase, loteId: string): SalesChatMessage[] {
  return listarSalesChatMessagesDeLote(db, loteId);
}

export function reiniciarConversacionVentas(db: AppDatabase, loteId: string): void {
  borrarHistorialVentas(db, loteId);
}

/** Guarda el mensaje del prospecto, llama al backend con el historial completo, y guarda la respuesta. */
export async function enviarTurnoVentas(
  db: AppDatabase,
  loteId: string,
  mensajeUsuario: string,
): Promise<SalesChatMessage> {
  crearSalesChatMessage(db, { loteId, rol: 'user', contenido: mensajeUsuario });

  const historial = listarSalesChatMessagesDeLote(db, loteId);
  const mensajes: MensajeChat[] = historial.map((m) => ({
    rol: m.rol as 'user' | 'assistant',
    contenido: m.contenido,
  }));
  const contexto = construirContextoVentas(db, loteId);

  const { respuesta } = await enviarMensajeVentas(mensajes, contexto);
  return crearSalesChatMessage(db, { loteId, rol: 'assistant', contenido: respuesta });
}
