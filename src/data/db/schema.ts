import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import type { NutrientAmounts } from '../../domain/types/nutrients';
import type {
  Micronutrient,
  TankCategory,
  EstadoFisico,
  CategoriaInsumo,
  UnidadPrecio,
} from '../../domain/types/fertilizer';

/**
 * Schema de persistencia local (SQLite vía drizzle-orm). Este archivo es agnóstico
 * del driver: en la app se abre con drizzle-orm/expo-sqlite, y en tests con
 * drizzle-orm/better-sqlite3 sobre el mismo schema (ver tests/data).
 */

export const lotes = sqliteTable('lotes', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  cropId: text('crop_id').notNull(),
  sistemaProduccion: text('sistema_produccion').notNull(),
  fechaSiembra: text('fecha_siembra').notNull(),
  etapaIdManual: text('etapa_id_manual'),
  areaHa: real('area_ha').notNull(),
  plantasPorHa: real('plantas_por_ha').notNull(),
  rendimientoObjetivoTonHa: real('rendimiento_objetivo_ton_ha').notNull(),
  ubicacionLat: real('ubicacion_lat'),
  ubicacionLon: real('ubicacion_lon'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const soilAnalyses = sqliteTable('soil_analyses', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  fecha: text('fecha').notNull(),
  textura: text('textura').notNull(),
  profundidadRadicularMm: real('profundidad_radicular_mm').notNull(),
  materiaOrganicaPct: real('materia_organica_pct').notNull(),
  pH: real('ph').notNull(),
  ceDsM: real('ce_ds_m').notNull(),
  cicMeq100g: real('cic_meq_100g').notNull(),
  densidadAparenteGCm3: real('densidad_aparente_g_cm3'),
  thetaCC: real('theta_cc'),
  thetaPMP: real('theta_pmp'),
  humedadActualPct: real('humedad_actual_pct'),
  temperaturaSueloC: real('temperatura_suelo_c'),
  nutrientesDisponiblesKgHa: text('nutrientes_disponibles_kg_ha', { mode: 'json' })
    .$type<NutrientAmounts>()
    .notNull(),
  createdAt: text('created_at').notNull(),
});

export const substrateProfiles = sqliteTable('substrate_profiles', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  fecha: text('fecha').notNull(),
  tipo: text('tipo').notNull(),
  volumenLitrosPorPlanta: real('volumen_litros_por_planta').notNull(),
  capacidadRetencionPct: real('capacidad_retencion_pct').notNull(),
  porosidadAireacionPct: real('porosidad_aireacion_pct'),
  ceDsM: real('ce_ds_m'),
  pH: real('ph'),
  porcentajeDrenajeObjetivo: real('porcentaje_drenaje_objetivo').notNull(),
  humedadActualPct: real('humedad_actual_pct'),
  humedadMinPct: real('humedad_min_pct'),
  humedadMaxPct: real('humedad_max_pct'),
  createdAt: text('created_at').notNull(),
});

export type IonesAgua = {
  ca: number;
  mg: number;
  na: number;
  k: number;
  nh4: number;
  hco3: number;
  co3: number;
  cl: number;
  so4: number;
  no3: number;
  b: number;
  fe: number;
  mn: number;
};

export const waterAnalyses = sqliteTable('water_analyses', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  fecha: text('fecha').notNull(),
  unidadCaptura: text('unidad_captura').notNull(), // 'ppm' | 'mgL' | 'meqL' | 'mmolL'
  ionesCapturados: text('iones_capturados', { mode: 'json' }).$type<IonesAgua>().notNull(),
  ionesNormalizadosPpm: text('iones_normalizados_ppm', { mode: 'json' })
    .$type<IonesAgua>()
    .notNull(),
  pH: real('ph').notNull(),
  ceDsM: real('ce_ds_m').notNull(),
  sar: real('sar'),
  durezaMgLCaCO3: real('dureza_mg_l_caco3'),
  alcalinidadMgLCaCO3: real('alcalinidad_mg_l_caco3'),
  createdAt: text('created_at').notNull(),
});

export const climateData = sqliteTable('climate_data', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  fecha: text('fecha').notNull(),
  etoMmDia: real('eto_mm_dia').notNull(),
  lluviaMm: real('lluvia_mm').notNull(),
  tempMaxC: real('temp_max_c'),
  tempMinC: real('temp_min_c'),
  tempPromedioC: real('temp_promedio_c'),
  humedadRelativaPct: real('humedad_relativa_pct'),
  radiacionSolar: real('radiacion_solar'),
  velocidadVientoMS: real('velocidad_viento_ms'),
  fuente: text('fuente').notNull(), // 'manual' | 'open-meteo'
  createdAt: text('created_at').notNull(),
});

export const irrigationSystems = sqliteTable('irrigation_systems', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  tipo: text('tipo').notNull(),
  caudalEmisorLH: real('caudal_emisor_lh').notNull(),
  emisoresPorPlanta: real('emisores_por_planta').notNull(),
  separacionEmisoresCm: real('separacion_emisores_cm'),
  presionOperativaBar: real('presion_operativa_bar'),
  eficienciaPct: real('eficiencia_pct').notNull(),
  uniformidadPct: real('uniformidad_pct'),
  numeroSectores: integer('numero_sectores'),
  caudalTotalLH: real('caudal_total_lh'),
  horasDisponiblesRiegoDia: real('horas_disponibles_riego_dia'),
  porcentajeDrenajeDeseado: real('porcentaje_drenaje_deseado'),
  numeroPulsos: integer('numero_pulsos').notNull(),
  createdAt: text('created_at').notNull(),
});

export const fertilizantes = sqliteTable('fertilizantes', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  categoriaInsumo: text('categoria_insumo')
    .notNull()
    .$type<CategoriaInsumo>()
    .default('fertilizante'),
  formulaComercial: text('formula_comercial'),
  estadoFisico: text('estado_fisico').notNull().$type<EstadoFisico>(),
  composicionPct: text('composicion_pct', { mode: 'json' })
    .$type<
      Partial<Record<keyof NutrientAmounts, number>> & Partial<Record<Micronutrient, number>>
    >()
    .notNull(),
  densidadKgL: real('densidad_kg_l'),
  solubilidadGL: real('solubilidad_g_l'),
  pureza: real('pureza').notNull(),
  costoPorKg: real('costo_por_kg').notNull(),
  unidadPrecio: text('unidad_precio').$type<UnidadPrecio>(),
  presentacionComercial: text('presentacion_comercial'),
  fichaTecnicaUrl: text('ficha_tecnica_url'),
  factorCE: real('factor_ce').notNull(),
  porcentajeNa: real('porcentaje_na').notNull(),
  porcentajeCl: real('porcentaje_cl').notNull(),
  categoriaTanque: text('categoria_tanque').$type<TankCategory>(),
  esCustom: integer('es_custom', { mode: 'boolean' }).notNull().default(false),
  stockKg: real('stock_kg').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const tankConfigs = sqliteTable('tank_configs', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  tanque: text('tanque').notNull(), // 'A' | 'B' | 'C'
  volumenLitros: real('volumen_litros').notNull(),
  relacionInyeccion: real('relacion_inyeccion').notNull(),
  numeroPulsos: integer('numero_pulsos').notNull(),
  modoTanqueC: text('modo_tanque_c'), // 'acido' | 'biostimulante', solo para C
  createdAt: text('created_at').notNull(),
});

export const dailyRecommendations = sqliteTable('daily_recommendations', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  fecha: text('fecha').notNull(),
  etapaId: text('etapa_id').notNull(),
  // Recomendación completa serializada (DailyRecommendation) para trazabilidad histórica;
  // las 4 escalas se derivan en pantalla, no se duplican aquí.
  dataJson: text('data_json', { mode: 'json' }).notNull(),
  generatedAt: text('generated_at').notNull(),
});

export const sensorReadings = sqliteTable('sensor_readings', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  fecha: text('fecha').notNull(),
  tipo: text('tipo').notNull(), // ceAplicada | phAplicado | caudal | humedadSustrato | aguaAplicadaL | fertilizanteAplicadoKg
  valor: real('valor').notNull(),
  unidad: text('unidad').notNull(),
  capturadoPor: text('capturado_por'),
  createdAt: text('created_at').notNull(),
});

export const sapReadings = sqliteTable('sap_readings', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  fecha: text('fecha').notNull(),
  etapaId: text('etapa_id'),
  no3Ppm: real('no3_ppm'),
  kPpm: real('k_ppm'),
  caPpm: real('ca_ppm'),
  naPpm: real('na_ppm'),
  hojaMuestreada: text('hoja_muestreada'),
  observaciones: text('observaciones'),
  createdAt: text('created_at').notNull(),
});

export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  fecha: text('fecha').notNull(),
  nivel: text('nivel').notNull(), // 'verde' | 'amarillo' | 'rojo'
  metrica: text('metrica').notNull(),
  desviacionPct: real('desviacion_pct').notNull(),
  mensaje: text('mensaje').notNull(),
  posiblesCausas: text('posibles_causas', { mode: 'json' }).$type<string[]>().notNull(),
  accionSugerida: text('accion_sugerida'),
  resuelto: integer('resuelto', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  rol: text('rol').notNull(), // 'user' | 'assistant'
  contenido: text('contenido').notNull(),
  createdAt: text('created_at').notNull(),
});

/** Historial de conversación con el agente de ventas virtual, separado del agrónomo (chatMessages). */
export const salesChatMessages = sqliteTable('sales_chat_messages', {
  id: text('id').primaryKey(),
  loteId: text('lote_id').notNull(),
  rol: text('rol').notNull(), // 'user' | 'assistant'
  contenido: text('contenido').notNull(),
  createdAt: text('created_at').notNull(),
});

/**
 * CRM del Centro de Comando Chamán 4.0: cada diagnóstico de campo genera un dictamen
 * con folio y queda como prospecto (lead) en el embudo comercial N1→N4. Se guardan los
 * valores calculados de la prescripción tal como se entregaron al productor, para que
 * el dictamen no cambie si después se ajustan las fichas del catálogo.
 */
export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  folio: text('folio').notNull(),
  productor: text('productor').notNull(),
  telefono: text('telefono'),
  ubicacion: text('ubicacion'),
  cultivoClave: text('cultivo_clave').notNull(),
  cultivoNombre: text('cultivo_nombre').notNull(),
  superficieHa: real('superficie_ha').notNull(),
  productoClave: text('producto_clave').notNull(),
  productoNombre: text('producto_nombre').notNull(),
  problema: text('problema').notNull(),
  severidad: text('severidad').notNull(), // 'Leve' | 'Moderado' | 'Crítico'
  metodo: text('metodo').notNull(), // 'drench' | 'foliar' | 'inyeccion'
  ppmOzono: real('ppm_ozono').notNull(),
  dosisLHa: real('dosis_l_ha').notNull(),
  aplicaciones: integer('aplicaciones').notNull(),
  productoTotalLitros: real('producto_total_litros').notNull(),
  aguaPortadoraLHa: real('agua_portadora_l_ha').notNull(),
  costoEstimadoMxn: real('costo_estimado_mxn').notNull(),
  ahorroEstimadoMxn: real('ahorro_estimado_mxn').notNull(),
  etapa: text('etapa').notNull(), // EtapaPipeline: 'N1' | 'N2' | 'N3' | 'N4' | 'perdido'
  notas: text('notas'),
  dictamenTexto: text('dictamen_texto').notNull(),
  protocoloIa: text('protocolo_ia'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** Conversaciones con los especialistas IA (Athena, Chiron, Artemis, Mayahuel, Hermes, Capi 1). */
export const specialistMessages = sqliteTable('specialist_messages', {
  id: text('id').primaryKey(),
  especialistaId: text('especialista_id').notNull(),
  rol: text('rol').notNull(), // 'user' | 'assistant'
  contenido: text('contenido').notNull(),
  createdAt: text('created_at').notNull(),
});

/**
 * Registro de aceptación de los documentos legales (Términos, Aviso de Privacidad y Uso
 * Responsable). Se guarda cada versión aceptada con su fecha como evidencia; si cambia
 * VERSION_LEGAL (src/legal/documentos.ts) la app vuelve a pedir la aceptación.
 */
export const aceptacionesLegales = sqliteTable('aceptaciones_legales', {
  id: text('id').primaryKey(),
  version: text('version').notNull(),
  aceptadoEn: text('aceptado_en').notNull(),
  plataforma: text('plataforma').notNull(),
});
