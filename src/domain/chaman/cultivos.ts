/**
 * Cultivos que atiende el diagnóstico de campo Chamán 4.0 (distintos del registro de
 * fertirriego de src/domain/crops, que modela curvas de absorción por etapa). Aquí solo
 * interesan los parámetros de aplicación de ozono y el costo de referencia del programa
 * fitosanitario convencional, para estimar el ahorro.
 */

export type ClaveCultivoChaman =
  'berries' | 'agave' | 'hortalizas' | 'aguacate' | 'papaya' | 'citricos';

export interface CultivoChaman {
  clave: ClaveCultivoChaman;
  nombre: string;
  categoria: string;
  ppmOzono: { drench: number; foliar: number };
  aguaLHa: { min: number; max: number };
  densidadPlantasHa: number;
  costoConvencionalHaMxn: number;
  patogenosClave: string[];
}

export const CULTIVOS_CHAMAN: readonly CultivoChaman[] = [
  {
    clave: 'berries',
    nombre: 'Berries (fresa, arándano, frambuesa)',
    categoria: 'Frutillas de exportación',
    ppmOzono: { drench: 2.2, foliar: 1.0 },
    aguaLHa: { min: 800, max: 1200 },
    densidadPlantasHa: 60000,
    costoConvencionalHaMxn: 32000,
    patogenosClave: [
      'Fusarium oxysporum',
      'Botrytis cinerea',
      'Oídio (Podosphaera)',
      'Phytophthora fragariae',
    ],
  },
  {
    clave: 'agave',
    nombre: 'Agave tequilana Weber',
    categoria: 'Cultivo industrial',
    ppmOzono: { drench: 2.8, foliar: 1.5 },
    aguaLHa: { min: 400, max: 800 },
    densidadPlantasHa: 3000,
    costoConvencionalHaMxn: 18500,
    patogenosClave: [
      'Fusarium (marchitez)',
      'Pectobacterium carotovorum',
      'Picudo del agave',
      'Cercospora agavicola',
    ],
  },
  {
    clave: 'hortalizas',
    nombre: 'Jitomate / hortalizas bajo invernadero',
    categoria: 'Hortalizas protegidas',
    ppmOzono: { drench: 2.0, foliar: 0.9 },
    aguaLHa: { min: 600, max: 1000 },
    densidadPlantasHa: 25000,
    costoConvencionalHaMxn: 28000,
    patogenosClave: [
      'Clavibacter michiganensis',
      'Fusarium oxysporum f. sp. lycopersici',
      'Cenicilla (Leveillula taurica)',
      'Nematodos',
    ],
  },
  {
    clave: 'aguacate',
    nombre: 'Aguacate Hass',
    categoria: 'Frutales de exportación',
    ppmOzono: { drench: 2.5, foliar: 1.2 },
    aguaLHa: { min: 1000, max: 2000 },
    densidadPlantasHa: 300,
    costoConvencionalHaMxn: 26000,
    patogenosClave: [
      'Phytophthora cinnamomi (tristeza)',
      'Antracnosis (Colletotrichum)',
      'Roña (Sphaceloma perseae)',
      'Asfixia radicular',
    ],
  },
  {
    clave: 'papaya',
    nombre: 'Papaya Maradol',
    categoria: 'Frutales tropicales',
    ppmOzono: { drench: 2.2, foliar: 1.1 },
    aguaLHa: { min: 800, max: 1500 },
    densidadPlantasHa: 2000,
    costoConvencionalHaMxn: 22000,
    patogenosClave: [
      'Antracnosis (Colletotrichum gloeosporioides)',
      'Pudrición del pie (Phytophthora palmivora)',
      'Corynespora cassiicola',
    ],
  },
  {
    clave: 'citricos',
    nombre: 'Limón persa / cítricos',
    categoria: 'Cítricos',
    ppmOzono: { drench: 2.4, foliar: 1.2 },
    aguaLHa: { min: 800, max: 1400 },
    densidadPlantasHa: 400,
    costoConvencionalHaMxn: 19000,
    patogenosClave: ['Gomosis (Phytophthora)', 'Vector del HLB', 'Antracnosis', 'Ácaro blanco'],
  },
];

export function obtenerCultivoChaman(clave: ClaveCultivoChaman): CultivoChaman {
  const cultivo = CULTIVOS_CHAMAN.find((c) => c.clave === clave);
  if (!cultivo) throw new Error(`Cultivo Chamán desconocido: ${clave}`);
  return cultivo;
}
