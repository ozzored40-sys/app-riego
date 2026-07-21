import { MACRO_NUTRIENTS, type NutrientAmounts } from '../types/nutrients';

/** g/planta/día = (kg/ha/día × 1000) / plantas/ha. */
export function kgPorHaAGramosPorPlanta(kgPorHaDia: number, plantasPorHa: number): number {
  if (plantasPorHa <= 0) throw new Error('plantasPorHa debe ser mayor a 0');
  return (kgPorHaDia * 1000) / plantasPorHa;
}

/** Inversa: g/planta/día -> kg/ha/día. */
export function gramosPorPlantaAKgPorHa(gPorPlantaDia: number, plantasPorHa: number): number {
  return (gPorPlantaDia * plantasPorHa) / 1000;
}

/** kg/ha/día -> kg del sector de riego (dado su área en ha). */
export function kgPorHaAKgPorSector(kgPorHaDia: number, areaSectorHa: number): number {
  return kgPorHaDia * areaSectorHa;
}

export function convertirEscalaNutrientes(
  kgPorHaDia: NutrientAmounts,
  plantasPorHa: number,
): Record<'gPlantaDia' | 'kgHaDia', NutrientAmounts> {
  const gPlantaDia = {} as NutrientAmounts;
  for (const nutriente of MACRO_NUTRIENTS) {
    gPlantaDia[nutriente] = kgPorHaAGramosPorPlanta(kgPorHaDia[nutriente], plantasPorHa);
  }
  return { gPlantaDia, kgHaDia: kgPorHaDia };
}
