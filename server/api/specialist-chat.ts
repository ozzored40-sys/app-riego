import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tieneAutorizacionValida } from '../lib/auth';
import {
  obtenerClienteAnthropic,
  MODELO_AGRONOMO,
  MAX_TOKENS_ESPECIALISTA,
} from '../lib/anthropic';
import { systemPromptEspecialista } from '../lib/especialistas';
import { validarSolicitudChatEspecialista } from '../lib/validation';

/**
 * POST /api/specialist-chat — turno de conversación con uno de los especialistas IA del
 * Centro de Comando Chamán 4.0 (Athena, Chiron, Artemis, Mayahuel, Hermes, Capi 1) o con
 * el redactor de anuncios. Igual que /api/chat: la app manda el historial completo y el
 * servidor no guarda estado.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  if (!tieneAutorizacionValida(req)) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const validacion = validarSolicitudChatEspecialista(req.body);
  if (!validacion.ok) {
    res.status(400).json({ error: validacion.error });
    return;
  }
  const { especialistaId, mensajes, contexto } = validacion.datos;

  const system = contexto
    ? `${systemPromptEspecialista(especialistaId)}\n\nContexto que envía la app:\n${contexto}`
    : systemPromptEspecialista(especialistaId);

  try {
    const anthropic = obtenerClienteAnthropic();
    const respuesta = await anthropic.messages.create({
      model: MODELO_AGRONOMO,
      max_tokens: MAX_TOKENS_ESPECIALISTA,
      system,
      messages: mensajes.map((mensaje) => ({ role: mensaje.rol, content: mensaje.contenido })),
    });

    const textoRespuesta = respuesta.content
      .map((bloque) => (bloque.type === 'text' ? bloque.text : ''))
      .join('\n')
      .trim();

    res.status(200).json({ respuesta: textoRespuesta });
  } catch (error) {
    console.error('Error llamando a Anthropic (especialista):', error);
    res.status(502).json({ error: 'No se pudo contactar al especialista. Intenta de nuevo.' });
  }
}
