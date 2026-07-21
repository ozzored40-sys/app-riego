import type { CropProfile } from '../types/crop';

/**
 * Valores de referencia agronómica de fertirriego estándar para chile/pimiento.
 * No son datos propietarios de Chamán: calibrar con análisis foliares/savia reales.
 */
export const chile: CropProfile = {
  id: 'chile',
  nombre: 'Chile',
  nombreCientifico: 'Capsicum annuum',
  extraccionPorTonelada: { N: 3.0, P: 0.5, K: 4.0, Ca: 1.8, Mg: 0.4, S: 0.5 },
  sensibilidadSalinidad: 'media',
  rangoPHOptimo: [5.5, 6.8],
  rangoCEOptimo: [2.0, 3.0],
  etapas: [
    {
      id: 'vegetativo',
      nombre: 'Vegetativo',
      duracionDias: 30,
      kc: 0.6,
      porcentajeAbsorcion: { N: 25, P: 20, K: 10, Ca: 30, Mg: 20, S: 20 },
    },
    {
      id: 'floracion',
      nombre: 'Floración',
      duracionDias: 20,
      kc: 0.85,
      porcentajeAbsorcion: { N: 25, P: 30, K: 20, Ca: 30, Mg: 25, S: 25 },
    },
    {
      id: 'fructificacion',
      nombre: 'Fructificación',
      duracionDias: 40,
      kc: 1.05,
      porcentajeAbsorcion: { N: 35, P: 35, K: 45, Ca: 25, Mg: 35, S: 35 },
    },
    {
      id: 'maduracion',
      nombre: 'Maduración',
      duracionDias: 20,
      kc: 0.85,
      porcentajeAbsorcion: { N: 15, P: 15, K: 25, Ca: 15, Mg: 20, S: 20 },
    },
  ],
};
