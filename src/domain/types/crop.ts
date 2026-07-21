import type { NutrientAmounts } from './nutrients';

export interface EtapaFenologica {
  id: string;
  nombre: string;
  duracionDias: number;
  /** Coeficiente de cultivo (Kc) para esta etapa, usado en ETc = ETo × Kc. */
  kc: number;
  /** % (0-100) del total absorbido durante el ciclo que corresponde a esta etapa, por nutriente. */
  porcentajeAbsorcion: NutrientAmounts;
}

export type SistemaProduccion = 'suelo' | 'sustrato' | 'hidroponia' | 'nft' | 'raizFlotante';

export interface CropProfile {
  id: string;
  nombre: string;
  nombreCientifico?: string;
  /** kg de nutriente extraído por tonelada de rendimiento objetivo (valores de referencia agronómica). */
  extraccionPorTonelada: NutrientAmounts;
  etapas: EtapaFenologica[];
  sensibilidadSalinidad: 'baja' | 'media' | 'alta';
  rangoPHOptimo: [number, number];
  rangoCEOptimo: [number, number];
}

/** Devuelve la etapa correspondiente a una edad del cultivo en días, o la última etapa si se excede el ciclo. */
export function etapaPorEdad(cultivo: CropProfile, edadDias: number): EtapaFenologica {
  let acumulado = 0;
  for (const etapa of cultivo.etapas) {
    acumulado += etapa.duracionDias;
    if (edadDias <= acumulado) return etapa;
  }
  return cultivo.etapas[cultivo.etapas.length - 1];
}
