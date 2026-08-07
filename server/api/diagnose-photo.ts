import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tieneAutorizacionValida } from '../lib/auth';
import { obtenerClienteAnthropic, MODELO_AGRONOMO, MAX_TOKENS_RESPUESTA } from '../lib/anthropic';
import { SYSTEM_PROMPT_AGRONOMO, construirContextoLote } from '../lib/prompts';
import { validarSolicitudDiagnosticoFoto } from '../lib/validation';

/**
 * POST /api/diagnose-photo — diagnóstico inicial a partir de una foto del cultivo.
 * Recibe la imagen en base64 (la app debe comprimirla/redimensionarla antes de
 * enviarla, ver MAX_BASE64_BYTES en lib/validation.ts) más el contexto del lote y una
 * descripción opcional de lo que el productor observa. Devuelve la respuesta del
 * agrónomo virtual en el mismo formato estructurado del chat (diagnóstico probable,
 * nivel de confianza, variables que lo respaldan, datos faltantes, plan de acción).
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

  const validacion = validarSolicitudDiagnosticoFoto(req.body);
  if (!validacion.ok) {
    res.status(400).json({ error: validacion.error });
    return;
  }
  const { imagenBase64, mediaType, descripcion, contexto } = validacion.datos;

  try {
    const anthropic = obtenerClienteAnthropic();
    const respuesta = await anthropic.messages.create({
      model: MODELO_AGRONOMO,
      max_tokens: MAX_TOKENS_RESPUESTA,
      system: `${SYSTEM_PROMPT_AGRONOMO}\n\nContexto del lote:\n${construirContextoLote(contexto)}`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imagenBase64 },
            },
            {
              type: 'text',
              text:
                descripcion?.trim() ||
                'Analiza esta foto del cultivo y da tu diagnóstico inicial siguiendo el formato indicado.',
            },
          ],
        },
      ],
    });

    const textoRespuesta = respuesta.content
      .map((bloque) => (bloque.type === 'text' ? bloque.text : ''))
      .join('\n')
      .trim();

    res.status(200).json({ respuesta: textoRespuesta });
  } catch (error) {
    console.error('Error llamando a Anthropic (diagnose-photo):', error);
    res.status(502).json({ error: 'No se pudo analizar la imagen. Intenta de nuevo.' });
  }
}
