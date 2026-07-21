import type { CropProfile } from '../types/crop';

/**
 * Valores de referencia agronómica de fertirriego estándar para papaya.
 * No son datos propietarios de Chamán: calibrar con análisis foliares/savia reales.
 */
export const papaya: CropProfile = {
  id: 'papaya',
  nombre: 'Papaya',
  nombreCientifico: 'Carica papaya',
  extraccionPorTonelada: { N: 2.5, P: 0.5, K: 4.0, Ca: 1.6, Mg: 0.4, S: 0.3 },
  sensibilidadSalinidad: 'alta',
  rangoPHOptimo: [5.5, 6.5],
  rangoCEOptimo: [1.2, 2.0],
  etapas: [
    {
      id: 'vegetativo',
      nombre: 'Vegetativo',
      duracionDias: 40,
      kc: 0.6,
      porcentajeAbsorcion: { N: 30, P: 25, K: 15, Ca: 35, Mg: 25, S: 25 },
    },
    {
      id: 'floracion',
      nombre: 'Floración',
      duracionDias: 30,
      kc: 0.85,
      porcentajeAbsorcion: { N: 25, P: 30, K: 20, Ca: 25, Mg: 25, S: 25 },
    },
    {
      id: 'fructificacion',
      nombre: 'Fructificación',
      duracionDias: 60,
      kc: 1.05,
      porcentajeAbsorcion: { N: 30, P: 30, K: 40, Ca: 25, Mg: 30, S: 30 },
    },
    {
      id: 'maduracion',
      nombre: 'Maduración',
      duracionDias: 40,
      kc: 0.95,
      porcentajeAbsorcion: { N: 15, P: 15, K: 25, Ca: 15, Mg: 20, S: 20 },
    },
  ],
};
