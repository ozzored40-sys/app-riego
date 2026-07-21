import type { EtapaFenologica } from './crop';
import type { MacroNutrient } from './nutrients';
import type { ResultadoMezcla } from '../fertilizers/mixSolver';
import type { RecetaTanque } from '../tanks/tankRecipe';
import type { ConflictoCompatibilidad } from '../tanks/compatibility';

export interface RecomendacionAgua {
  litrosPorPlantaDia: number;
  m3PorHaDia: number;
  litrosPorPulso: number;
  minutosPorPulso: number;
  numeroPulsos: number;
}

export interface RecomendacionNutriente {
  nutriente: MacroNutrient;
  demandaKgHaDia: number;
  aporteAguaKgHaDia: number;
  aporteSueloKgHaDia: number;
  netoKgHaDia: number;
  netoAjustadoKgHaDia: number;
  gPorPlantaDia: number;
}

export interface DailyRecommendation {
  etapa: EtapaFenologica;
  agua: RecomendacionAgua;
  nutrientes: RecomendacionNutriente[];
  mezclaFertilizantes: ResultadoMezcla;
  tanques: RecetaTanque[];
  conflictosCompatibilidad: ConflictoCompatibilidad[];
  costoDiarioTotal: number;
}
