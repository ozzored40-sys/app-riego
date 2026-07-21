/**
 * Agua disponible por planta en sustrato (L) = volumen de sustrato por planta (L)
 * × capacidad de retención (fracción 0-1).
 */
export function calcularAguaDisponibleSustrato(
  volumenSustratoLitros: number,
  capacidadRetencion: number,
): number {
  return volumenSustratoLitros * capacidadRetencion;
}

/**
 * En sustrato, el agua total a aplicar debe cubrir la demanda de la planta más
 * el porcentaje de drenaje objetivo (para evitar acumulación de sales):
 * agua total = demanda de la planta + (demanda de la planta × % drenaje).
 */
export function calcularAguaTotalConDrenaje(
  demandaPlantaLitros: number,
  porcentajeDrenaje: number,
): number {
  if (porcentajeDrenaje < 0) {
    throw new Error('porcentajeDrenaje no puede ser negativo');
  }
  return demandaPlantaLitros * (1 + porcentajeDrenaje);
}
