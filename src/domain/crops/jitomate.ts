import type { CropProfile } from '../types/crop';

/**
 * Valores de referencia agronómica (extracción por tonelada, Kc y distribución
 * de absorción por etapa) tomados de literatura de fertirriego estándar para
 * jitomate/tomate. Son valores de partida razonables, NO datos propietarios de
 * Chamán: deben calibrarse contra análisis foliares/de savia y curvas de
 * producción reales antes de usarse en campo.
 */
export const jitomate: CropProfile = {
  id: 'jitomate',
  nombre: 'Jitomate',
  nombreCientifico: 'Solanum lycopersicum',
  extraccionPorTonelada: { N: 2.8, P: 0.5, K: 4.5, Ca: 2.2, Mg: 0.5, S: 0.4 },
  sensibilidadSalinidad: 'media',
  rangoPHOptimo: [5.5, 6.8],
  rangoCEOptimo: [2.0, 3.5],
  etapas: [
    {
      id: 'vegetativo',
      nombre: 'Vegetativo',
      duracionDias: 25,
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
      duracionDias: 35,
      kc: 1.15,
      porcentajeAbsorcion: { N: 35, P: 35, K: 45, Ca: 25, Mg: 35, S: 35 },
    },
    {
      id: 'maduracion',
      nombre: 'Maduración',
      duracionDias: 20,
      kc: 0.9,
      porcentajeAbsorcion: { N: 15, P: 15, K: 25, Ca: 15, Mg: 20, S: 20 },
    },
  ],
};
