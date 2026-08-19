import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tieneAutorizacionValida } from '../lib/auth';
import { obtenerClienteAnthropic, MODELO_AGRONOMO, MAX_TOKENS_RESPUESTA } from '../lib/anthropic';
import { SYSTEM_PROMPT_VENTAS, construirContextoVentas } from '../lib/prompts';
import { validarSolicitudChatVentas } from '../lib/validation';

/**
 * POST /api/sales-chat — diálogo con el "agente de ventas" virtual de Chamán. Igual que
 * /api/chat (ver ese archivo): recibe el historial completo de la conversación más el
 * contexto (lote + catálogo de insumos disponible), y devuelve el siguiente turno del
 * asistente. Sin estado en el servidor.
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

  const validacion = validarSolicitudChatVentas(req.body);
  if (!validacion.ok) {
    res.status(400).json({ error: validacion.error });
    return;
  }
  const { mensajes, contexto } = validacion.datos;

  try {
    const anthropic = obtenerClienteAnthropic();
    const respuesta = await anthropic.messages.create({
      model: MODELO_AGRONOMO,
      max_tokens: MAX_TOKENS_RESPUESTA,
      system: `${SYSTEM_PROMPT_VENTAS}\n\nContexto:\n${construirContextoVentas(contexto)}`,
      messages: mensajes.map((mensaje) => ({ role: mensaje.rol, content: mensaje.contenido })),
    });

    const textoRespuesta = respuesta.content
      .map((bloque) => (bloque.type === 'text' ? bloque.text : ''))
      .join('\n')
      .trim();

    res.status(200).json({ respuesta: textoRespuesta });
  } catch (error) {
    console.error('Error llamando a Anthropic (sales-chat):', error);
    res.status(502).json({ error: 'No se pudo contactar al asistente. Intenta de nuevo.' });
  }
}
