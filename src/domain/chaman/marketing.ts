import { CONTACTO_CHAMAN } from './contacto';

/** Plantillas de anuncios para Meta Ads (Facebook / Instagram) del prototipo web. */

export type CategoriaAnuncio = 'Suelo y raíz' | 'Cero residuos' | 'Hongos y bacterias' | 'Ahorro';

export interface PlantillaAnuncio {
  id: string;
  cultivo: string;
  titulo: string;
  categoria: CategoriaAnuncio;
  gancho: string;
  cuerpo: string;
  llamadoAccion: string;
  audiencia: string;
  presupuestoDiarioMxn: number;
}

const CTA_WHATSAPP = `${CONTACTO_CHAMAN.sitioWeb} o WhatsApp ${CONTACTO_CHAMAN.whatsappLegible}`;

export const PLANTILLAS_ANUNCIOS: readonly PlantillaAnuncio[] = [
  {
    id: 'ad-berries',
    cultivo: 'Berries (fresa, zarzamora, arándano)',
    titulo: 'Cero residuos químicos para exportación',
    categoria: 'Cero residuos',
    gancho: '🫐 ¿Tus berries enfrentan rechazos por límites de residuos en frontera?',
    cuerpo:
      'El mercado de exportación no perdona residuos de fungicidas sintéticos. Con el Sistema Chamán 4.0 proteges tu fruta contra Botrytis, Fusarium y cenicilla con agua ozonizada (O₃).\n' +
      '✅ Intervalo de seguridad de 0 días según etiqueta.\n' +
      '✅ Sin residuos de síntesis química.\n' +
      '✅ Apoya calibre, firmeza y vida de anaquel.',
    llamadoAccion: `Solicita una evaluación técnica para tu huerto: ${CTA_WHATSAPP}.`,
    audiencia:
      'Productores de berries en Jalisco, Michoacán, Guanajuato y Baja California. 28-65 años, interés en agricultura de exportación.',
    presupuestoDiarioMxn: 350,
  },
  {
    id: 'ad-agave',
    cultivo: 'Agave tequilana Weber',
    titulo: 'Protege tu agave contra marchitez y pudrición',
    categoria: 'Hongos y bacterias',
    gancho: '🌾 ¿Estás perdiendo piñas de agave por marchitez bacteriana y Fusarium?',
    cuerpo:
      'Cada planta de agave perdida son años de inversión. El protocolo Chamán 4.0 con ozono O₃ actúa por oxidación de contacto, un modo de acción distinto al de los agroquímicos de siempre.\n' +
      '🌿 Apoya la cicatrización de tejidos.\n' +
      '🌿 Desinfección radicular.\n' +
      '🌿 Menor mortandad en hijuelos y plantaciones maduras.',
    llamadoAccion: `Habla con un ingeniero agrónomo especialista: ${CTA_WHATSAPP}.`,
    audiencia:
      'Agaveros y tequileros en Jalisco (Los Altos, Valles), Michoacán, Nayarit y Guanajuato.',
    presupuestoDiarioMxn: 400,
  },
  {
    id: 'ad-aguacate',
    cultivo: 'Aguacate y frutales',
    titulo: 'Oxigenación radicular en suelos compactados',
    categoria: 'Suelo y raíz',
    gancho: '🥑 ¿Tus árboles de aguacate sufren asfixia radicular y poca brotación?',
    cuerpo:
      'Un suelo sin oxígeno favorece a Phytophthora cinnamomi (tristeza del aguacate). Con nanoburbujas de ozono Chamán:\n' +
      '🔹 Llevas oxígeno activo a la raíz.\n' +
      '🔹 Rompes biopelículas, sarro y algas del riego por goteo o microaspersión.\n' +
      '🔹 Floración más pareja y mejor cuajado.',
    llamadoAccion: `Conoce los generadores y bioestimulantes Chamán 4.0: ${CTA_WHATSAPP}.`,
    audiencia: 'Aguacateros en Uruapan, Tancítaro, Peribán y el sur de Jalisco.',
    presupuestoDiarioMxn: 380,
  },
  {
    id: 'ad-invernadero',
    cultivo: 'Invernaderos y hortalizas',
    titulo: 'Goteros limpios sin ácidos agresivos',
    categoria: 'Ahorro',
    gancho: '🍅 ¿Cansado de cambiar cintillas tapadas por algas y sales?',
    cuerpo:
      'Los ácidos para destapar goteros dañan tuberías y desbalancean el pH del suelo. El agua ozonizada Chamán 4.0 disuelve biopelículas y precipitados, manteniendo la uniformidad de riego.\n' +
      '💧 Riego parejo = cosecha homogénea.\n' +
      '💧 Menos corrosión en bombas y cabezales.',
    llamadoAccion: `Agenda tu demostración en campo: ${CTA_WHATSAPP}.`,
    audiencia: 'Agricultura protegida en Sinaloa, Sonora, Bajío y Altiplano.',
    presupuestoDiarioMxn: 300,
  },
];

export function textoCompletoAnuncio(
  anuncio: Pick<PlantillaAnuncio, 'gancho' | 'cuerpo' | 'llamadoAccion'>,
): string {
  return `${anuncio.gancho}\n\n${anuncio.cuerpo}\n\n${anuncio.llamadoAccion}`;
}
