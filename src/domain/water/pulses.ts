export interface EmisorConfig {
  caudalEmisorLH: number;
  emisoresPorPlanta: number;
}

/** Litros por pulso = agua total del día por planta / número de pulsos. */
export function calcularLitrosPorPulso(litrosPorPlantaDia: number, numeroPulsos: number): number {
  if (numeroPulsos <= 0) throw new Error('numeroPulsos debe ser mayor a 0');
  return litrosPorPlantaDia / numeroPulsos;
}

/**
 * Minutos por pulso = (litros por pulso / caudal total por planta) × 60,
 * donde caudal total por planta = caudal del emisor (L/h) × emisores por planta.
 */
export function calcularMinutosPorPulso(litrosPorPulso: number, emisor: EmisorConfig): number {
  const caudalPorPlantaLH = emisor.caudalEmisorLH * emisor.emisoresPorPlanta;
  if (caudalPorPlantaLH <= 0) throw new Error('El caudal por planta debe ser mayor a 0');
  return (litrosPorPulso / caudalPorPlantaLH) * 60;
}
