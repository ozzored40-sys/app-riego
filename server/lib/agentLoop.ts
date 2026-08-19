import type Anthropic from '@anthropic-ai/sdk';

/**
 * Ejecuta un turno de conversación con Claude permitiendo tool use: si el modelo pide usar
 * una herramienta, la ejecuta con `ejecutarHerramienta` y le regresa el resultado, repitiendo
 * hasta que el modelo conteste con texto final (o se llegue a `maxIteraciones`, por seguridad).
 */
export async function ejecutarTurnoConHerramientas(params: {
  anthropic: Anthropic;
  modelo: string;
  maxTokens: number;
  system: string;
  mensajes: Anthropic.Messages.MessageParam[];
  tools: Anthropic.Messages.Tool[];
  ejecutarHerramienta: (nombre: string, input: unknown) => Promise<string>;
  maxIteraciones?: number;
}): Promise<{ mensajes: Anthropic.Messages.MessageParam[]; textoFinal: string }> {
  const { anthropic, modelo, maxTokens, system, tools, ejecutarHerramienta } = params;
  let mensajes = [...params.mensajes];
  const maxIteraciones = params.maxIteraciones ?? 5;

  for (let i = 0; i < maxIteraciones; i++) {
    const respuesta = await anthropic.messages.create({
      model: modelo,
      max_tokens: maxTokens,
      system,
      tools,
      messages: mensajes,
    });

    mensajes = [...mensajes, { role: 'assistant', content: respuesta.content }];

    if (respuesta.stop_reason !== 'tool_use') {
      const texto = respuesta.content
        .filter((bloque): bloque is Anthropic.Messages.TextBlock => bloque.type === 'text')
        .map((bloque) => bloque.text)
        .join('\n')
        .trim();
      return { mensajes, textoFinal: texto };
    }

    const bloquesHerramienta = respuesta.content.filter(
      (bloque): bloque is Anthropic.Messages.ToolUseBlock => bloque.type === 'tool_use',
    );

    const resultados: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const bloque of bloquesHerramienta) {
      let contenido: string;
      try {
        contenido = await ejecutarHerramienta(bloque.name, bloque.input);
      } catch (error) {
        contenido = `Error ejecutando ${bloque.name}: ${error instanceof Error ? error.message : 'desconocido'}`;
      }
      resultados.push({ type: 'tool_result', tool_use_id: bloque.id, content: contenido });
    }
    mensajes = [...mensajes, { role: 'user', content: resultados }];
  }

  return {
    mensajes,
    textoFinal: 'Dame un momento para confirmar esto bien y te contesto en un momento 🙏',
  };
}
