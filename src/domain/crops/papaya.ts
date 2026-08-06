import { p2o5AP, k2oAK, caoACa, mgoAMg } from '../constants/oxideConversion';
import type { CropProfile } from '../types/crop';

/**
 * Presupuesto nutrimental anual de referencia para papaya, tomado del documento
 * "AgroChamán 69 — Modelo integral" (sección 5-6): escenario de diseño de 1 ha,
 * ~1,600 plantas/ha, meta de referencia de 100 t/ha. Se usa el punto medio de cada
 * rango. Reportado ahí en forma de óxido (P2O5, K2O, CaO, MgO); se convierte aquí a
 * forma elemental (ver constants/oxideConversion.ts) para que sea consistente con el
 * resto del motor. Es un escenario de diseño, no una receta universal: el programa
 * definitivo debe ajustarse con análisis de suelo, agua, tejido, variedad, densidad,
 * clima, sistema de riego y metas productivas reales del lote.
 */
const RENDIMIENTO_REFERENCIA_TON_HA = 100;

const PRESUPUESTO_ANUAL_REFERENCIA_KG_HA = {
  N: (320 + 360) / 2,
  P2O5: (90 + 110) / 2,
  K2O: (450 + 520) / 2,
  CaO: (150 + 180) / 2,
  MgO: (90 + 110) / 2,
  S: (35 + 50) / 2,
};

const extraccionPorTonelada = {
  N: PRESUPUESTO_ANUAL_REFERENCIA_KG_HA.N / RENDIMIENTO_REFERENCIA_TON_HA,
  P: p2o5AP(PRESUPUESTO_ANUAL_REFERENCIA_KG_HA.P2O5) / RENDIMIENTO_REFERENCIA_TON_HA,
  K: k2oAK(PRESUPUESTO_ANUAL_REFERENCIA_KG_HA.K2O) / RENDIMIENTO_REFERENCIA_TON_HA,
  Ca: caoACa(PRESUPUESTO_ANUAL_REFERENCIA_KG_HA.CaO) / RENDIMIENTO_REFERENCIA_TON_HA,
  Mg: mgoAMg(PRESUPUESTO_ANUAL_REFERENCIA_KG_HA.MgO) / RENDIMIENTO_REFERENCIA_TON_HA,
  S: PRESUPUESTO_ANUAL_REFERENCIA_KG_HA.S / RENDIMIENTO_REFERENCIA_TON_HA,
};

export const papaya: CropProfile = {
  id: 'papaya',
  nombre: 'Papaya',
  nombreCientifico: 'Carica papaya',
  extraccionPorTonelada,
  sensibilidadSalinidad: 'alta',
  rangoPHOptimo: [5.5, 6.5],
  rangoCEOptimo: [1.2, 2.0],
  datosReferencia: {
    fuente:
      'AgroChamán 69 — Modelo integral, sección 5-6 (escenario de diseño, no receta universal)',
    densidadPlantasHaSugerida: 1600,
    rendimientoObjetivoTonHaSugerido: RENDIMIENTO_REFERENCIA_TON_HA,
    notas:
      'Presupuesto nutrimental anual de referencia: N 320-360, P2O5 90-110, K2O 450-520, ' +
      'CaO 150-180, MgO 90-110, S 35-50 kg/ha. Validar con análisis de campo antes de usar en producción.',
  },
  etapas: [
    {
      id: 'establecimiento',
      nombre: 'Establecimiento radicular (0-2 meses)',
      duracionDias: 60,
      kc: 0.5,
      // Prioridad del documento: Ca, P y micronutrientes; crecimiento equilibrado.
      porcentajeAbsorcion: { N: 10, P: 35, K: 10, Ca: 30, Mg: 15, S: 15 },
    },
    {
      id: 'vegetativo',
      nombre: 'Crecimiento vegetativo (2-4 meses)',
      duracionDias: 60,
      kc: 0.75,
      // Prioridad del documento: aumento de N, K, Ca y Mg.
      porcentajeAbsorcion: { N: 30, P: 25, K: 20, Ca: 25, Mg: 25, S: 25 },
    },
    {
      id: 'floracion',
      nombre: 'Floración y cuajado (4-6 meses)',
      duracionDias: 60,
      kc: 0.9,
      // Prioridad del documento: mayor énfasis relativo en K, Ca, B y Mg; moderar N según diagnóstico.
      porcentajeAbsorcion: { N: 25, P: 20, K: 30, Ca: 25, Mg: 30, S: 30 },
    },
    {
      id: 'llenadoFruto',
      nombre: 'Llenado de fruto (6-9+ meses)',
      duracionDias: 90,
      kc: 1.0,
      // Prioridad del documento: fuerte demanda de K, además de N, Ca y Mg.
      porcentajeAbsorcion: { N: 35, P: 20, K: 40, Ca: 20, Mg: 30, S: 30 },
    },
  ],
};
