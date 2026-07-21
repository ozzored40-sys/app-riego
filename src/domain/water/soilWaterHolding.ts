/**
 * Agua disponible en el suelo (mm) = (θCC − θPMP) × profundidad radicular (mm).
 * θCC (capacidad de campo) y θPMP (punto de marchitez permanente) como fracción
 * volumétrica (0-1).
 */
export function calcularAguaDisponibleSuelo(
  thetaCC: number,
  thetaPMP: number,
  profundidadRadicularMm: number,
): number {
  return Math.max(0, thetaCC - thetaPMP) * profundidadRadicularMm;
}

/** Agua fácilmente aprovechable (mm) = agua disponible × fracción de agotamiento permitido (0-1). */
export function calcularAguaFacilmenteAprovechable(
  aguaDisponibleMm: number,
  agotamientoPermitido: number,
): number {
  return aguaDisponibleMm * agotamientoPermitido;
}
