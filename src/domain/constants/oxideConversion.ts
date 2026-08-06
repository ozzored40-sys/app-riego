/**
 * Factores de conversión de forma óxido a forma elemental, usados cuando una fuente
 * (ficha técnica, presupuesto nutrimental de laboratorio) reporta P₂O₅, K₂O, CaO o MgO
 * en vez del elemento puro. factor = masa molar del elemento / masa molar del óxido
 * (ajustado por la cantidad de átomos del elemento en la fórmula del óxido).
 */
export const FACTOR_P2O5_A_P = 0.4364; // P: 61.94 / P2O5: 141.94 (×2 átomos de P)
export const FACTOR_K2O_A_K = 0.8301; // K: 78.2 / K2O: 94.2 (×2 átomos de K)
export const FACTOR_CAO_A_CA = 0.7147; // Ca: 40.08 / CaO: 56.08
export const FACTOR_MGO_A_MG = 0.603; // Mg: 24.31 / MgO: 40.31

export function p2o5AP(p2o5: number): number {
  return p2o5 * FACTOR_P2O5_A_P;
}

export function k2oAK(k2o: number): number {
  return k2o * FACTOR_K2O_A_K;
}

export function caoACa(cao: number): number {
  return cao * FACTOR_CAO_A_CA;
}

export function mgoAMg(mgo: number): number {
  return mgo * FACTOR_MGO_A_MG;
}
