/** 1 mm de lámina de agua sobre 1 ha equivale a 10 m³/ha. */
export function mmDiaAM3PorHaDia(mmDia: number): number {
  return mmDia * 10;
}

export function m3PorHaDiaAMmDia(m3HaDia: number): number {
  return m3HaDia / 10;
}

/** L/planta/día = (m³/ha/día × 1000) / plantas/ha. */
export function calcularLitrosPorPlantaPorDia(m3PorHaDia: number, plantasPorHa: number): number {
  if (plantasPorHa <= 0) throw new Error('plantasPorHa debe ser mayor a 0');
  return (m3PorHaDia * 1000) / plantasPorHa;
}

/** Inversa: dado L/planta/día y densidad, obtiene m³/ha/día. */
export function calcularM3PorHaDia(litrosPorPlantaDia: number, plantasPorHa: number): number {
  return (litrosPorPlantaDia * plantasPorHa) / 1000;
}
