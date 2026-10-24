/**
 * Especialistas IA del Centro de Comando Chamán 4.0. Aquí solo vive lo que muestra la
 * app (nombre, saludo, preguntas sugeridas); el system prompt de cada uno vive en el
 * backend (server/lib/especialistas.ts) junto a la API key. Los ids deben coincidir con
 * los que acepta POST /api/specialist-chat.
 */

export type IdEspecialista =
  | 'athena-phytopath'
  | 'chiron-rhizosphere'
  | 'artemis-baccata'
  | 'mayahuel-cyberweber'
  | 'hermes-fintech'
  | 'capi1'
  | 'copywriter';

export interface Especialista {
  id: IdEspecialista;
  nombre: string;
  siglas: string;
  titulo: string;
  descripcion: string;
  /** Color de acento del avatar (hex). */
  color: string;
  saludo: string;
  preguntasSugeridas: string[];
}

export const ESPECIALISTAS: readonly Especialista[] = [
  {
    id: 'athena-phytopath',
    nombre: 'Dra. Athena',
    siglas: 'ATH',
    titulo: 'Fitopatología y escudo redox O₃',
    descripcion: 'Hongos, bacterias y pudriciones: Fusarium, Botrytis, Phytophthora, Clavibacter.',
    color: '#10b981',
    saludo:
      'Soy la Dra. Athena, fitopatóloga de Chamán. ¿Qué síntoma o patógeno estás viendo hoy en tu cultivo?',
    preguntasSugeridas: [
      '¿Cómo controlo Fusarium en berries sin dejar residuos?',
      '¿Cómo actúa el ozono disuelto contra Botrytis?',
      'Protocolo de choque para pudrición de cuello y raíz',
    ],
  },
  {
    id: 'chiron-rhizosphere',
    nombre: 'Dr. Chiron',
    siglas: 'CHI',
    titulo: 'Suelo, raíz y goteros',
    descripcion: 'Oxigenación del bulbo húmedo, biofilm y destape de cintillas con nanoburbujas.',
    color: '#06b6d4',
    saludo:
      'Soy el Dr. Chiron. Si falta oxígeno en la raíz o los goteros tienen sarro y biofilm, se pierde calibre. ¿Cómo es tu suelo y tu sistema de riego?',
    preguntasSugeridas: [
      '¿Cómo oxigeno la raíz en suelo arcilloso compactado?',
      '¿Cómo limpio biofilm y sarro de los goteros?',
      '¿Qué concentración de O₃ uso en el cabezal de riego?',
    ],
  },
  {
    id: 'artemis-baccata',
    nombre: 'Dra. Artemis',
    siglas: 'ART',
    titulo: 'Fisiología de frutos y estrés',
    descripcion: 'Activación SAR, floración, cuajado, grados Brix y estrés por calor o helada.',
    color: '#f59e0b',
    saludo:
      'Soy la Dra. Artemis. Te ayudo a proteger floración y fruto frente al estrés. ¿En qué etapa está tu cultivo?',
    preguntasSugeridas: [
      '¿Cómo funciona el ácido salicílico ozonizado (ruta SAR)?',
      '¿Cómo evito aborto floral en berries?',
      'Recuperación de un huerto después de golpe de calor',
    ],
  },
  {
    id: 'mayahuel-cyberweber',
    nombre: 'Ing. Mayahuel',
    siglas: 'MAY',
    titulo: 'Agave y fisiología CAM',
    descripcion: 'Agave tequilana: marchitez, pudrición de cogollo, Erwinia y horarios CAM.',
    color: '#a855f7',
    saludo:
      'Soy la Ing. Mayahuel, especialista en agave. ¿Qué edad tiene tu plantación y qué afectación notas?',
    preguntasSugeridas: [
      '¿Cómo rescato agave con pudrición de cogollo?',
      '¿A qué hora conviene aplicar por el metabolismo CAM?',
      '¿Cómo evito diseminar Erwinia durante la jima?',
    ],
  },
  {
    id: 'hermes-fintech',
    nombre: 'Dr. Hermes',
    siglas: 'HER',
    titulo: 'Rentabilidad y exportación',
    descripcion:
      'Costo-beneficio frente a químicos, retorno del generador y residuos para exportar.',
    color: '#6366f1',
    saludo:
      'Soy el Dr. Hermes. Hagamos números: ¿cuántas hectáreas tienes y cuánto gastas al año en agroquímicos?',
    preguntasSugeridas: [
      '¿Cuánto ahorro por hectárea si sustituyo fungicidas?',
      '¿En cuánto tiempo recupero un generador de ozono?',
      '¿Cómo afecta cero residuos al precio de exportación?',
    ],
  },
  {
    id: 'capi1',
    nombre: 'Capi 1',
    siglas: 'CAPI',
    titulo: 'Soporte técnico de equipos',
    descripcion: 'Generadores O₃, inyectores Venturi, ORP, fugas, mantenimiento y pagos.',
    color: '#0ea5e9',
    saludo:
      'Hola, soy Capi 1, soporte técnico de Chamán. Te ayudo con generadores, inyectores Venturi, ORP y calibración. ¿Qué equipo traes?',
    preguntasSugeridas: [
      '¿Qué diferencial de presión necesita el Venturi?',
      'Mi generador no sube el ORP, ¿qué reviso?',
      '¿Cómo pago con Mercado Pago o pido factura?',
    ],
  },
];

/** Agente interno que redacta copys de Meta Ads (no aparece en la lista de especialistas). */
export const ID_COPYWRITER: IdEspecialista = 'copywriter';

export function obtenerEspecialista(id: string): Especialista | undefined {
  return ESPECIALISTAS.find((e) => e.id === id);
}
