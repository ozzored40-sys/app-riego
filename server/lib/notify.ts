import { enviarMensajeTexto } from './whatsapp';

export interface ResumenPedido {
  folio: string;
  telefonoCliente: string;
  nombreCliente?: string;
  items: { nombre: string; presentacion: string; cantidad: number; precioMXN: number }[];
  totalMXN: number;
  notas?: string;
}

/**
 * Avisa por WhatsApp al vendedor (OWNER_WHATSAPP_NUMBER) que hay un pedido listo para cerrar
 * pago y entrega. IMPORTANTE: la Cloud API de WhatsApp solo permite mandar mensajes de texto
 * libre a un número dentro de las 24 h desde su último mensaje a tu número de negocio — si el
 * vendedor no le ha escrito al bot en ese lapso, este envío puede fallar. Para notificaciones
 * garantizadas fuera de esa ventana hace falta una plantilla de mensaje aprobada por Meta (no
 * incluida aquí). Por eso esto nunca debe tumbar la confirmación al cliente: si falla, solo se
 * registra el error y el cliente igual recibe su folio.
 */
export async function notificarPedidoConfirmado(resumen: ResumenPedido): Promise<void> {
  const numeroVendedor = process.env.OWNER_WHATSAPP_NUMBER;
  if (!numeroVendedor) {
    console.error('OWNER_WHATSAPP_NUMBER no configurado: no se pudo notificar el pedido', resumen);
    return;
  }

  const lineasItems = resumen.items
    .map((item) => `• ${item.cantidad} x ${item.nombre} (${item.presentacion}) — $${item.precioMXN * item.cantidad} MXN`)
    .join('\n');

  const texto = [
    `🛒 Nuevo pedido confirmado por WhatsApp — folio ${resumen.folio}`,
    resumen.nombreCliente ? `Cliente: ${resumen.nombreCliente}` : undefined,
    `Teléfono: ${resumen.telefonoCliente}`,
    '',
    lineasItems,
    '',
    `Total: $${resumen.totalMXN} MXN`,
    resumen.notas ? `Notas: ${resumen.notas}` : undefined,
    '',
    'Contacta al cliente para coordinar pago y entrega.',
  ]
    .filter((linea): linea is string => linea !== undefined)
    .join('\n');

  try {
    await enviarMensajeTexto(numeroVendedor, texto);
  } catch (error) {
    console.error('No se pudo notificar el pedido al vendedor:', error);
  }
}
