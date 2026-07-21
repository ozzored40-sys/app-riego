import type { CropProfile } from '../types/crop';

/**
 * Valores de referencia agronómica de fertirriego estándar para limón (cítrico).
 * Las etapas modelan un ciclo de brotación-floración-desarrollo-maduración de fruto;
 * al ser perenne, el "ciclo" se repite cada temporada de producción.
 * No son datos propietarios de Chamán: calibrar con análisis foliares/savia reales.
 */
export const limon: CropProfile = {
  id: 'limon',
  nombre: 'Limón',
  nombreCientifico: 'Citrus limon',
  extraccionPorTonelada: { N: 4.0, P: 0.6, K: 3.5, Ca: 1.5, Mg: 0.4, S: 0.4 },
  sensibilidadSalinidad: 'media',
  rangoPHOptimo: [6.0, 7.0],
  rangoCEOptimo: [1.2, 2.0],
  etapas: [
    {
      id: 'vegetativo',
      nombre: 'Brotación / Vegetativo',
      duracionDias: 60,
      kc: 0.65,
      porcentajeAbsorcion: { N: 30, P: 25, K: 15, Ca: 35, Mg: 25, S: 25 },
    },
    {
      id: 'floracion',
      nombre: 'Floración',
      duracionDias: 30,
      kc: 0.7,
      porcentajeAbsorcion: { N: 25, P: 30, K: 20, Ca: 25, Mg: 25, S: 25 },
    },
    {
      id: 'fructificacion',
      nombre: 'Desarrollo de fruto',
      duracionDias: 90,
      kc: 0.8,
      porcentajeAbsorcion: { N: 30, P: 30, K: 40, Ca: 25, Mg: 30, S: 30 },
    },
    {
      id: 'maduracion',
      nombre: 'Maduración / Cosecha',
      duracionDias: 60,
      kc: 0.75,
      porcentajeAbsorcion: { N: 15, P: 15, K: 25, Ca: 15, Mg: 20, S: 20 },
    },
  ],
};
