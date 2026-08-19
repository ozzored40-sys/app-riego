/**
 * Cliente hacia el backend de Chamán NutriFlow (server/, ver su README) para el agente
 * de ventas virtual. Usa el mismo backend/proxy seguro hacia Claude que el agrónomo
 * virtual (ver agronomistClient.ts) — las mismas variables de entorno, solo cambia la
 * ruta llamada (/api/sales-chat en vez de /api/chat).
 */
import type { MensajeChat, RespuestaAsistente } from './agronomistClient';

export interface ProductoCatalogoVentas {
  nombre: string;
  categoriaInsumo: string;
  presentacionComercial?: string;
  costoPorKg: number;
  unidadPrecio?: string;
}

export interface ContextoVentas {
  cultivo?: string;
  etapaFenologica?: string;
  sistemaProduccion?: string;
  ultimoDiagnosticoReglas?: string;
  catalogo: ProductoCatalogoVentas[];
}

/** Se leen en cada llamada (no al importar el módulo) para que sean fáciles de probar. */
function config() {
  return {
    baseUrl: process.env.EXPO_PUBLIC_AGRONOMIST_API_URL,
    appKey: process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY,
  };
}

export function agenteVentasConfigurado(): boolean {
  const { baseUrl, appKey } = config();
  return Boolean(baseUrl && appKey);
}

export async function enviarMensajeVentas(
  mensajes: MensajeChat[],
  contexto: ContextoVentas,
  fetchImpl: typeof fetch = fetch,
): Promise<RespuestaAsistente> {
  const { baseUrl, appKey } = config();
  if (!baseUrl || !appKey) {
    throw new Error(
      'El agente de ventas no está configurado en esta instalación (falta EXPO_PUBLIC_AGRONOMIST_API_URL / EXPO_PUBLIC_AGRONOMIST_APP_KEY).',
    );
  }

  const respuesta = await fetchImpl(`${baseUrl}/api/sales-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Chaman-App-Key': appKey },
    body: JSON.stringify({ mensajes, contexto }),
  });

  if (!respuesta.ok) {
    const cuerpoError = (await respuesta.json().catch(() => null)) as { error?: string } | null;
    throw new Error(
      cuerpoError?.error ?? `El agente de ventas respondió con error ${respuesta.status}`,
    );
  }

  return respuesta.json() as Promise<RespuestaAsistente>;
}
