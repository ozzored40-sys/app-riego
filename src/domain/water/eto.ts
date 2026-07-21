/** Evapotranspiración del cultivo: ETc (mm/día) = ETo (mm/día) × Kc. */
export function calcularETc(etoMmDia: number, kc: number): number {
  return etoMmDia * kc;
}

/** Agua neta (mm/día) = ETc − lluvia efectiva. Nunca negativa. */
export function calcularAguaNeta(etcMmDia: number, lluviaEfectivaMmDia: number): number {
  return Math.max(0, etcMmDia - lluviaEfectivaMmDia);
}

/** Agua bruta (mm/día) = agua neta / eficiencia del sistema de riego (0-1). */
export function calcularAguaBruta(aguaNetaMmDia: number, eficiencia: number): number {
  if (eficiencia <= 0 || eficiencia > 1) {
    throw new Error('La eficiencia del sistema debe estar en el rango (0, 1]');
  }
  return aguaNetaMmDia / eficiencia;
}
