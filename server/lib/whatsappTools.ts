import type Anthropic from '@anthropic-ai/sdk';
import { buscarEnCatalogo, obtenerProductoPorId } from './catalog';
import { notificarPedidoConfirmado } from './notify';

/**
 * Herramientas (tool use) que el agente de WhatsApp puede llamar durante la conversación.
 * Existen para que el modelo NUNCA invente productos, presentaciones ni precios: todo lo que
 * ofrece o cotiza tiene que venir de aquí, del catálogo real (lib/catalog.json).
 */
export const HERRAMIENTAS_WHATSAPP: Anthropic.Messages.Tool[] = [
  {
    name: 'buscar_catalogo',
    description:
      'Busca productos reales en el catálogo de Chamán Agro Soluciones por texto libre (nombre, categoría o cultivo). Úsala siempre antes de mencionar o recomendar cualquier producto o precio — nunca inventes un producto que no aparezca aquí.',
    input_schema: {
      type: 'object',
      properties: {
        consulta: {
          type: 'string',
          description: 'Texto de búsqueda, ej. "calcio", "fungicida", "papaya".',
        },
        categoria: {
          type: 'string',
          description: 'Filtro opcional exacto: corrector, fertilizante, fungicida o bioestimulante.',
        },
      },
      required: ['consulta'],
    },
  },
  {
    name: 'generar_cotizacion',
    description:
      'Calcula el total de una cotización a partir de productos y cantidades que ya encontraste con buscar_catalogo. Úsala cuando el cliente pida precio o quiera saber cuánto le cuesta.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productoId: { type: 'string', description: 'id exacto devuelto por buscar_catalogo' },
              cantidad: { type: 'number', description: 'unidades de esa presentación' },
            },
            required: ['productoId', 'cantidad'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'confirmar_pedido',
    description:
      'Cierra el pedido cuando el cliente ya aceptó la cotización: registra el pedido y avisa de inmediato al equipo de Chamán para que contacten al cliente y coordinen pago y entrega. Úsala solo cuando el cliente confirmó explícitamente que quiere comprar.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productoId: { type: 'string' },
              cantidad: { type: 'number' },
            },
            required: ['productoId', 'cantidad'],
          },
        },
        nombreCliente: { type: 'string', description: 'Nombre del productor, si lo dio.' },
        notas: { type: 'string', description: 'Cualquier detalle relevante para cerrar la venta.' },
      },
      required: ['items'],
    },
  },
];

interface ItemPedido {
  productoId: string;
  cantidad: number;
}

function calcularItems(items: ItemPedido[]) {
  const resueltos = items.map((item) => {
    const producto = obtenerProductoPorId(item.productoId);
    return { item, producto };
  });

  const noEncontrados = resueltos.filter((r) => !r.producto).map((r) => r.item.productoId);
  const sinPrecio = resueltos
    .filter((r) => r.producto && !r.producto.precioConfirmado)
    .map((r) => r.producto!.nombre);

  const validos = resueltos.filter((r) => r.producto && r.producto.precioConfirmado);
  const items_ = validos.map((r) => ({
    nombre: r.producto!.nombre,
    presentacion: r.producto!.presentacion,
    cantidad: r.item.cantidad,
    precioMXN: r.producto!.precioMXN,
  }));
  const totalMXN = items_.reduce((suma, i) => suma + i.precioMXN * i.cantidad, 0);

  return { items: items_, totalMXN, noEncontrados, sinPrecio };
}

function generarFolio(): string {
  return `PED-${Date.now().toString(36).toUpperCase()}`;
}

/** Ejecuta una llamada a herramienta del modelo y regresa el texto que se le manda de vuelta como tool_result. */
export async function ejecutarHerramientaWhatsApp(
  nombre: string,
  input: unknown,
  contexto: { telefonoCliente: string },
): Promise<string> {
  if (nombre === 'buscar_catalogo') {
    const { consulta, categoria } = input as { consulta: string; categoria?: string };
    const resultados = buscarEnCatalogo(consulta, categoria);
    if (resultados.length === 0) {
      return 'Sin resultados en el catálogo para esa búsqueda.';
    }
    return JSON.stringify(
      resultados.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        presentacion: p.presentacion,
        categoria: p.categoria,
        precioMXN: p.precioConfirmado ? p.precioMXN : null,
        precioPendienteConfirmar: !p.precioConfirmado,
        cultivosRecomendados: p.cultivosRecomendados,
      })),
    );
  }

  if (nombre === 'generar_cotizacion') {
    const { items } = input as { items: ItemPedido[] };
    const resultado = calcularItems(items ?? []);
    return JSON.stringify(resultado);
  }

  if (nombre === 'confirmar_pedido') {
    const { items, nombreCliente, notas } = input as {
      items: ItemPedido[];
      nombreCliente?: string;
      notas?: string;
    };
    const resultado = calcularItems(items ?? []);

    if (resultado.items.length === 0) {
      return JSON.stringify({
        ok: false,
        motivo: 'Ninguno de los productos tiene precio confirmado todavía; no se puede cerrar el pedido.',
        ...resultado,
      });
    }

    const folio = generarFolio();
    await notificarPedidoConfirmado({
      folio,
      telefonoCliente: contexto.telefonoCliente,
      nombreCliente,
      items: resultado.items,
      totalMXN: resultado.totalMXN,
      notas,
    });

    return JSON.stringify({ ok: true, folio, totalMXN: resultado.totalMXN, sinPrecio: resultado.sinPrecio });
  }

  return `Herramienta desconocida: ${nombre}`;
}
