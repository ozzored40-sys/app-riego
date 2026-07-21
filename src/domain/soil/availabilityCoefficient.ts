import type { MacroNutrient } from '../types/nutrients';

export type Textura = 'arenoso' | 'francoArenoso' | 'franco' | 'francoArcilloso' | 'arcilloso';

export interface CondicionesSuelo {
  pH: number;
  textura: Textura;
  cicMeq100g: number;
  materiaOrganicaPct: number;
  temperaturaSueloC: number;
  /** Humedad actual del suelo como fracción de la capacidad de campo (0-1, puede superar 1 en saturación). */
  humedadRelativaCC: number;
}

/**
 * Coeficiente de aprovechamiento del suelo (0-1): fracción del nutriente ya
 * reportado como "disponible" en el análisis de suelo que el cultivo puede
 * efectivamente captar, dado pH, textura, CIC, materia orgánica, temperatura
 * y humedad actual.
 *
 * El spec no da una fórmula numérica para este coeficiente. Los valores base
 * por nutriente y los factores de ajuste abajo son valores de referencia
 * agronómica típicos (documentados aquí, no derivados del spec) y deben
 * calibrarse con datos reales de campo/laboratorio de Chamán. Se aíslan en
 * este único archivo para que un agrónomo pueda ajustarlos sin tocar el
 * resto del motor de cálculo.
 */

/** Fracción base del nutriente "disponible" que normalmente resulta aprovechable. */
const BASE_APROVECHAMIENTO: Record<MacroNutrient, number> = {
  N: 0.6,
  P: 0.35,
  K: 0.6,
  Ca: 0.65,
  Mg: 0.55,
  S: 0.5,
};

/** pH óptimo de disponibilidad por nutriente y qué tan sensible es a desviarse de él. */
const PH_OPTIMO: Record<MacroNutrient, { centro: number; sensibilidad: number }> = {
  N: { centro: 6.5, sensibilidad: 1.5 },
  P: { centro: 6.5, sensibilidad: 0.8 }, // el fósforo es el más sensible al pH
  K: { centro: 6.5, sensibilidad: 2.0 },
  Ca: { centro: 7.0, sensibilidad: 2.0 },
  Mg: { centro: 6.8, sensibilidad: 2.0 },
  S: { centro: 6.5, sensibilidad: 2.0 },
};

const FACTOR_TEXTURA: Record<Textura, number> = {
  arenoso: 0.75, // baja retención, alta lixiviación
  francoArenoso: 0.85,
  franco: 1.0, // referencia óptima
  francoArcilloso: 0.9,
  arcilloso: 0.8, // alta fijación/retención, menor disponibilidad efectiva
};

function factorPH(pH: number, nutriente: MacroNutrient): number {
  const { centro, sensibilidad } = PH_OPTIMO[nutriente];
  const desviacion = Math.abs(pH - centro);
  return clamp(1 - desviacion / (sensibilidad * 3), 0.2, 1);
}

function factorCIC(cicMeq100g: number): number {
  // CIC de referencia ~20 meq/100g para un suelo con buena capacidad de retención de cationes.
  return clamp(0.5 + cicMeq100g / 40, 0.5, 1.1);
}

function factorHumedad(humedadRelativaCC: number): number {
  // Óptimo alrededor del 75-90% de la capacidad de campo; muy seco o saturado reduce la toma.
  return clamp(1 - Math.abs(humedadRelativaCC - 0.8) * 1.5, 0.3, 1);
}

function factorTemperatura(temperaturaSueloC: number): number {
  // La actividad microbiana/mineralización es máxima entre 20-30°C.
  if (temperaturaSueloC >= 20 && temperaturaSueloC <= 30) return 1;
  const desviacion = temperaturaSueloC < 20 ? 20 - temperaturaSueloC : temperaturaSueloC - 30;
  return clamp(1 - desviacion / 25, 0.4, 1);
}

function factorMateriaOrganica(materiaOrganicaPct: number, nutriente: MacroNutrient): number {
  const base = clamp(0.7 + materiaOrganicaPct / 10, 0.7, 1.3);
  // El efecto de la materia orgánica pesa más para N y S (mineralización) que para el resto.
  const peso = nutriente === 'N' || nutriente === 'S' ? 1 : 0.4;
  return 1 + (base - 1) * peso;
}

function clamp(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

export function calcularCoeficienteAprovechamiento(
  nutriente: MacroNutrient,
  condiciones: CondicionesSuelo,
): number {
  const coeficiente =
    BASE_APROVECHAMIENTO[nutriente] *
    factorPH(condiciones.pH, nutriente) *
    FACTOR_TEXTURA[condiciones.textura] *
    factorCIC(condiciones.cicMeq100g) *
    factorHumedad(condiciones.humedadRelativaCC) *
    factorTemperatura(condiciones.temperaturaSueloC) *
    factorMateriaOrganica(condiciones.materiaOrganicaPct, nutriente);

  return clamp(coeficiente, 0, 1);
}
