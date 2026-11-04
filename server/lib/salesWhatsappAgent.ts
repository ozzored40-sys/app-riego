import { obtenerHistorialWhatsapp, agregarTurnoWhatsapp } from './salesConversationStore';
import { CATALOGO_VENTAS_WHATSAPP } from './salesCatalog';
import { obtenerClienteAnthropic, MODELO_AGRONOMO, MAX_TOKENS_RESPUESTA } from './anthropic';
import { SYSTEM_PROMPT_VENTAS, construirContextoVentas } from './prompts';
import { MAX_LARGO_MENSAJE } from './validation';
import type { MensajeChat } from './types';

/**
 * Un turno del agente de ventas por WhatsApp, independiente del proveedor (Meta Cloud
 * API u OpenWA): lee el historial de `claveConversacion` en Redis, le pide la respuesta
 * a Claude, guarda ambos mensajes y regresa el texto a enviar. Cada webhook se encarga
 * solo de parsear su payload y de mandar la respuesta por su propia API.
 */
export async function responderComoAgenteVentas(
  claveConversacion: string,
  textoRecibido: string,
): Promise<string> {
  const texto = textoRecibido.slice(0, MAX_LARGO_MENSAJE);
  const mensajeUsuario: MensajeChat = { rol: 'user', contenido: texto };

  const historialPrevio = await obtenerHistorialWhatsapp(claveConversacion);
  const mensajes: MensajeChat[] = [...historialPrevio, mensajeUsuario];

  const contexto = construirContextoVentas({ catalogo: CATALOGO_VENTAS_WHATSAPP });

  const anthropic = obtenerClienteAnthropic();
  const respuesta = await anthropic.messages.create({
    model: MODELO_AGRONOMO,
    max_tokens: MAX_TOKENS_RESPUESTA,
    system: `${SYSTEM_PROMPT_VENTAS}\n\nContexto:\n${contexto}`,
    messages: mensajes.map((m) => ({ role: m.rol, content: m.contenido })),
  });

  const textoRespuesta = respuesta.content
    .map((bloque) => (bloque.type === 'text' ? bloque.text : ''))
    .join('\n')
    .trim();

  await agregarTurnoWhatsapp(claveConversacion, [
    mensajeUsuario,
    { rol: 'assistant', contenido: textoRespuesta },
  ]);
  return textoRespuesta;
}
