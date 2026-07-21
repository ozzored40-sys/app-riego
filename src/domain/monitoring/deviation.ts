/**
 * % de desviación entre lo programado y lo realmente aplicado/medido.
 * Positivo = se aplicó/midió más de lo programado; negativo = menos.
 */
export function calcularDesviacionPct(programado: number, aplicado: number): number {
  if (programado === 0) {
    return aplicado === 0 ? 0 : Infinity;
  }
  return ((aplicado - programado) / programado) * 100;
}
