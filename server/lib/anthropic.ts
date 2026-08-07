import Anthropic from '@anthropic-ai/sdk';

let cliente: Anthropic | null = null;

export function obtenerClienteAnthropic(): Anthropic {
  if (!cliente) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Falta configurar ANTHROPIC_API_KEY en el servidor');
    cliente = new Anthropic({ apiKey });
  }
  return cliente;
}

/** Modelo con visión, buen balance costo/calidad para diálogo y diagnóstico por foto. */
export const MODELO_AGRONOMO = 'claude-sonnet-5';
export const MAX_TOKENS_RESPUESTA = 1024;
