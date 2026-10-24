/**
 * Datos de contacto oficiales de Chamán Agro Soluciones que la app usa en enlaces de
 * WhatsApp, correo y sitio web (antes repetidos a mano en cada pantalla del
 * prototipo web de AI Studio).
 */
export const CONTACTO_CHAMAN = {
  empresa: 'Chamán Agro Soluciones',
  whatsappE164: '523320967184',
  whatsappLegible: '+52 33 2096 7184',
  correo: 'Ozzored4.0@gmail.com',
  sitioWeb: 'https://ozonochaman.com/',
} as const;

/**
 * Normaliza un teléfono capturado por el usuario a formato internacional para wa.me.
 * Un número mexicano de 10 dígitos recibe el prefijo 52; si ya trae lada de país se
 * respeta. Devuelve null si no hay suficientes dígitos para ser un número real.
 */
export function normalizarTelefonoWhatsApp(telefono: string): string | null {
  const digitos = telefono.replace(/\D/g, '');
  if (digitos.length === 10) return `52${digitos}`;
  if (digitos.length >= 11 && digitos.length <= 15) return digitos;
  return null;
}

/** Enlace wa.me con mensaje prellenado. Sin teléfono, abre el WhatsApp oficial de Chamán. */
export function enlaceWhatsApp(texto: string, telefono?: string): string {
  const destino =
    (telefono ? normalizarTelefonoWhatsApp(telefono) : null) ?? CONTACTO_CHAMAN.whatsappE164;
  return `https://wa.me/${destino}?text=${encodeURIComponent(texto)}`;
}

export function formatoMxn(monto: number): string {
  return `$${Math.round(monto).toLocaleString('es-MX')} MXN`;
}
