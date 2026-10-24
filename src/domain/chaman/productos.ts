/**
 * Línea de productos Chamán Ozono (fichas tomadas del prototipo "Centro de Comando
 * Chamán 4.0" y de las etiquetas de producto). Los costos por hectárea son valores de
 * referencia del prototipo, no un precio de lista oficial: deben ajustarse a la lista
 * de precios vigente antes de cotizar.
 */

export type ClaveProducto =
  'biofungicida' | 'bioestimulante' | 'bioinsecticida' | 'bactericida' | 'oxiRoot';

export type MetodoAplicacion = 'drench' | 'foliar' | 'inyeccion';

export const ETIQUETA_METODO: Record<MetodoAplicacion, string> = {
  drench: 'Riego por goteo (drench)',
  foliar: 'Aspersión foliar',
  inyeccion: 'Inyección al suelo / Venturi',
};

/** Clave de la foto del producto; la UI la resuelve a un asset (ver src/constants/chamanImages). */
export type ImagenProducto = 'biofungicida' | 'bioestimulante' | 'bioinsecticida' | 'lineaCompleta';

export interface ProductoChaman {
  clave: ClaveProducto;
  nombre: string;
  /** Problema de campo que atiende, tal como lo elige el productor en el diagnóstico. */
  problema: string;
  formula: string;
  modoDeAccion: string;
  metodoSugerido: MetodoAplicacion;
  dosisLHa: { min: number; max: number };
  dilucion: string;
  frecuencia: string;
  intervaloSeguridad: string;
  costoReferenciaHaMxn: number;
  imagen: ImagenProducto;
}

export const PRODUCTOS_CHAMAN: readonly ProductoChaman[] = [
  {
    clave: 'biofungicida',
    nombre: 'Chamán Ozono Biofungicida',
    problema: 'Pudrición de raíz y hongos (Fusarium, Botrytis, cenicilla, Phytophthora)',
    formula:
      'Ozono activo (O₃) 45,000 ppm + Cobre metálico 6,000 ppm + Extracto de ricino 45,000 ppm + Árbol del té 10,000 ppm',
    modoDeAccion:
      'Oxidación de la membrana celular del hongo, inhibición de la germinación de conidios y cicatrización de tejido.',
    metodoSugerido: 'drench',
    dosisLHa: { min: 3, max: 4 },
    dilucion: '5 ml por litro de agua',
    frecuencia: 'Cada 7 a 10 días (bloque de 3 aplicaciones)',
    intervaloSeguridad: '0 días a cosecha según etiqueta',
    costoReferenciaHaMxn: 1350,
    imagen: 'biofungicida',
  },
  {
    clave: 'bioestimulante',
    nombre: 'Chamán Ozono Bioestimulante',
    problema: 'Bajo desarrollo radicular, estrés hídrico/térmico y compactación',
    formula:
      'Ozono activo (O₃) 30,000 ppm + Ácido salicílico 1,500 ppm + Tiamina B1 300 ppm + Piridoxina B6 150 ppm + Cianocobalamina B12 15 ppm',
    modoDeAccion:
      'Activa la resistencia sistémica adquirida (SAR), induce pelos absorbentes y ayuda a superar el estrés abiótico.',
    metodoSugerido: 'drench',
    dosisLHa: { min: 2.5, max: 3.5 },
    dilucion: '5 ml por litro de agua',
    frecuencia: 'Cada 9 a 12 días en etapas fenológicas críticas',
    intervaloSeguridad: '0 días a cosecha según etiqueta',
    costoReferenciaHaMxn: 1250,
    imagen: 'bioestimulante',
  },
  {
    clave: 'bioinsecticida',
    nombre: 'Chamán Ozono Bioinsecticida',
    problema: 'Plagas chupadoras (mosquita blanca, trips, ácaros, pulgón)',
    formula:
      'Ozono activo (O₃) 45,000 ppm + Extractos vegetales 69% + Extracto de neem 30% + Azadiractina 1,800 ppm',
    modoDeAccion:
      'Daña la cutícula del insecto, inhibe su desarrollo y repele por contacto y volátiles naturales.',
    metodoSugerido: 'foliar',
    dosisLHa: { min: 2, max: 3 },
    dilucion: '5 ml por litro de agua',
    frecuencia: 'Cada 5 a 7 días según umbral de trampeo',
    intervaloSeguridad: '0 días a cosecha según etiqueta',
    costoReferenciaHaMxn: 1400,
    imagen: 'bioinsecticida',
  },
  {
    clave: 'bactericida',
    nombre: 'Chamán Ozono Biofungicida & Bactericida',
    problema:
      'Bacteriosis vascular y manchas bacterianas (Clavibacter, Pectobacterium, Xanthomonas)',
    formula:
      'Ozono activo (O₃) 45,000 ppm + Cobre quelatado 6,000 ppm + Melaleuca alternifolia 10,000 ppm',
    modoDeAccion: 'Oxidación de la cápsula bacteriana por contacto.',
    metodoSugerido: 'drench',
    dosisLHa: { min: 4, max: 4 },
    dilucion: '5 ml por litro de agua',
    frecuencia: 'Cada 5 días en brote activo; preventivo cada 14 días',
    intervaloSeguridad: '0 días a cosecha según etiqueta',
    costoReferenciaHaMxn: 1550,
    imagen: 'biofungicida',
  },
  {
    clave: 'oxiRoot',
    nombre: 'Chamán Oxi-Root (nanoburbujas)',
    problema: 'Goteros tapados, biofilm y asfixia del bulbo húmedo',
    formula: 'Agua ozonizada con nanoburbujas de O₃ (30,000 ppm) + Ácido salicílico + Complejo B',
    modoDeAccion:
      'Disuelve biopelículas y precipitados en cintillas y aporta oxígeno disuelto a la rizosfera.',
    metodoSugerido: 'inyeccion',
    dosisLHa: { min: 5, max: 5 },
    dilucion: 'Inyección directa por Venturi',
    frecuencia: '1 vez al mes o en cada fertirriego pesado',
    intervaloSeguridad: '0 días a cosecha según etiqueta',
    costoReferenciaHaMxn: 1100,
    imagen: 'lineaCompleta',
  },
];

export function obtenerProducto(clave: ClaveProducto): ProductoChaman {
  const producto = PRODUCTOS_CHAMAN.find((p) => p.clave === clave);
  if (!producto) throw new Error(`Producto Chamán desconocido: ${clave}`);
  return producto;
}
