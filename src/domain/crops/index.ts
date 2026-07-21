import type { CropProfile } from '../types/crop';
import { chile } from './chile';
import { jitomate } from './jitomate';
import { limon } from './limon';
import { papaya } from './papaya';
import { pepino } from './pepino';

export { chile, jitomate, limon, papaya, pepino };

/** Registro de cultivos disponibles en la app. Para agregar uno nuevo: crear su archivo y registrarlo aquí. */
export const CROP_REGISTRY: Record<string, CropProfile> = {
  papaya,
  limon,
  pepino,
  chile,
  jitomate,
};

export function getCropProfile(id: string): CropProfile {
  const cultivo = CROP_REGISTRY[id];
  if (!cultivo) throw new Error(`Cultivo no encontrado en el registro: ${id}`);
  return cultivo;
}

export function listCropProfiles(): CropProfile[] {
  return Object.values(CROP_REGISTRY);
}
