/**
 * Cliente hacia el backend de Chamán NutriFlow (server/, ver su README) que hace de
 * proxy seguro hacia Claude. La app nunca llama directo a Anthropic: la API key real
 * solo vive en el servidor. EXPO_PUBLIC_AGRONOMIST_APP_KEY es un secreto compartido
 * revocable (no autenticación real), ver server/lib/auth.ts para el detalle.
 */

export interface ContextoLote {
  cultivo: string;
  etapaFenologica?: string;
  sistemaProduccion?: string;
  edadDiasCultivo?: number;
  ultimoDiagnosticoReglas?: string;
}

export interface MensajeChat {
  rol: 'user' | 'assistant';
  contenido: string;
}

export interface RespuestaAsistente {
  respuesta: string;
}

/** Se leen en cada llamada (no al importar el módulo) para que sean fáciles de probar. */
function config() {
  return {
    baseUrl: process.env.EXPO_PUBLIC_AGRONOMIST_API_URL,
    appKey: process.env.EXPO_PUBLIC_AGRONOMIST_APP_KEY,
  };
}

export function asistenteConfigurado(): boolean {
  const { baseUrl, appKey } = config();
  return Boolean(baseUrl && appKey);
}

async function llamarBackend(
  ruta: string,
  cuerpo: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<RespuestaAsistente> {
  const { baseUrl, appKey } = config();
  if (!baseUrl || !appKey) {
    throw new Error(
      'El asistente agrónomo no está configurado en esta instalación (falta EXPO_PUBLIC_AGRONOMIST_API_URL / EXPO_PUBLIC_AGRONOMIST_APP_KEY).',
    );
  }

  const respuesta = await fetchImpl(`${baseUrl}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Chaman-App-Key': appKey },
    body: JSON.stringify(cuerpo),
  });

  if (!respuesta.ok) {
    const cuerpoError = (await respuesta.json().catch(() => null)) as { error?: string } | null;
    throw new Error(cuerpoError?.error ?? `El asistente respondió con error ${respuesta.status}`);
  }

  return respuesta.json() as Promise<RespuestaAsistente>;
}

export function enviarMensajeChat(
  mensajes: MensajeChat[],
  contexto: ContextoLote,
  fetchImpl: typeof fetch = fetch,
): Promise<RespuestaAsistente> {
  return llamarBackend('/api/chat', { mensajes, contexto }, fetchImpl);
}

export function enviarFotoParaDiagnostico(
  imagenBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  contexto: ContextoLote,
  descripcion?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RespuestaAsistente> {
  return llamarBackend(
    '/api/diagnose-photo',
    { imagenBase64, mediaType, descripcion, contexto },
    fetchImpl,
  );
}
