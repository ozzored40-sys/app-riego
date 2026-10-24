import { SymbolView, type SFSymbol, type AndroidSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';

/**
 * Íconos nativos por plataforma: SF Symbols en iOS y Material Symbols en Android/web.
 * Cada nombre lógico de la app se mapea a ambos sistemas aquí, en un solo lugar.
 */
const ICONOS = {
  inicio: { ios: 'square.grid.2x2.fill', android: 'dashboard' },
  campo: { ios: 'leaf.fill', android: 'grass' },
  diagnostico: { ios: 'stethoscope', android: 'stethoscope' },
  especialistas: { ios: 'sparkles', android: 'auto_awesome' },
  crm: { ios: 'person.3.fill', android: 'groups' },
  mas: { ios: 'ellipsis.circle.fill', android: 'more_horiz' },
  catalogo: { ios: 'shippingbox.fill', android: 'inventory_2' },
  calculadora: { ios: 'function', android: 'calculate' },
  marketing: { ios: 'megaphone.fill', android: 'campaign' },
  pagos: { ios: 'creditcard.fill', android: 'payments' },
  soporte: { ios: 'headphones', android: 'support_agent' },
  fertilizantes: { ios: 'drop.fill', android: 'water_drop' },
  flecha: { ios: 'chevron.right', android: 'chevron_right' },
  enviar: { ios: 'paperplane.fill', android: 'send' },
  compartir: { ios: 'square.and.arrow.up', android: 'share' },
  borrar: { ios: 'trash', android: 'delete' },
  whatsapp: { ios: 'message.fill', android: 'chat' },
  telefono: { ios: 'phone.fill', android: 'call' },
  reiniciar: { ios: 'arrow.counterclockwise', android: 'refresh' },
  copiar: { ios: 'doc.on.doc', android: 'content_copy' },
  web: { ios: 'globe', android: 'language' },
  tendencia: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' },
  ciencia: { ios: 'flask.fill', android: 'science' },
} as const satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type NombreIcono = keyof typeof ICONOS;

export function Icono({
  nombre,
  color,
  tamano = 22,
}: {
  nombre: NombreIcono;
  color: ColorValue;
  tamano?: number;
}) {
  const { ios, android } = ICONOS[nombre];
  return <SymbolView name={{ ios, android, web: android }} tintColor={color} size={tamano} />;
}
