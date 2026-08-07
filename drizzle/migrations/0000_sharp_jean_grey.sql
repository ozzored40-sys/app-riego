CREATE TABLE `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`lote_id` text NOT NULL,
	`fecha` text NOT NULL,
	`nivel` text NOT NULL,
	`metrica` text NOT NULL,
	`desviacion_pct` real NOT NULL,
	`mensaje` text NOT NULL,
	`posibles_causas` text NOT NULL,
	`accion_sugerida` text,
	`resuelto` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `climate_data` (
	`id` text PRIMARY KEY NOT NULL,
	`lote_id` text NOT NULL,
	`fecha` text NOT NULL,
	`eto_mm_dia` real NOT NULL,
	`lluvia_mm` real NOT NULL,
	`temp_max_c` real,
	`temp_min_c` real,
	`temp_promedio_c` real,
	`humedad_relativa_pct` real,
	`radiacion_solar` real,
	`velocidad_viento_ms` real,
	`fuente` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`lote_id` text NOT NULL,
	`fecha` text NOT NULL,
	`etapa_id` text NOT NULL,
	`data_json` text NOT NULL,
	`generated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fertilizantes` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`formula_comercial` text,
	`estado_fisico` text NOT NULL,
	`composicion_pct` text NOT NULL,
	`densidad_kg_l` real,
	`solubilidad_g_l` real,
	`pureza` real NOT NULL,
	`costo_por_kg` real NOT NULL,
	`factor_ce` real NOT NULL,
	`porcentaje_na` real NOT NULL,
	`porcentaje_cl` real NOT NULL,
	`categoria_tanque` text NOT NULL,
	`es_custom` integer DEFAULT false NOT NULL,
	`stock_kg` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `irrigation_systems` (
	`id` text PRIMARY KEY NOT NULL,
	`lote_id` text NOT NULL,
	`tipo` text NOT NULL,
	`caudal_emisor_lh` real NOT NULL,
	`emisores_por_planta` real NOT NULL,
	`separacion_emisores_cm` real,
	`presion_operativa_bar` real,
	`eficiencia_pct` real NOT NULL,
	`uniformidad_pct` real,
	`numero_sectores` integer,
	`caudal_total_lh` real,
	`horas_disponibles_riego_dia` real,
	`porcentaje_drenaje_deseado` real,
	`numero_pulsos` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lotes` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`crop_id` text NOT NULL,
	`sistema_produccion` text NOT NULL,
	`fecha_siembra` text NOT NULL,
	`etapa_id_manual` text,
	`area_ha` real NOT NULL,
	`plantas_por_ha` real NOT NULL,
	`rendimiento_objetivo_ton_ha` real NOT NULL,
	`ubicacion_lat` real,
	`ubicacion_lon` real,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sap_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`lote_id` text NOT NULL,
	`fecha` text NOT NULL,
	`etapa_id` text,
	`no3_ppm` real,
	`k_ppm` real,
	`ca_ppm` real,
	`na_ppm` real,
	`hoja_muestreada` text,
	`observaciones` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sensor_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`lote_id` text NOT NULL,
	`fecha` text NOT NULL,
	`tipo` text NOT NULL,
	`valor` real NOT NULL,
	`unidad` text NOT NULL,
	`capturado_por` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `soil_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`lote_id` text NOT NULL,
	`fecha` text NOT NULL,
	`textura` text NOT NULL,
	`profundidad_radicular_mm` real NOT NULL,
	`materia_organica_pct` real NOT NULL,
	`ph` real NOT NULL,
	`ce_ds_m` real NOT NULL,
	`cic_meq_100g` real NOT NULL,
	`densidad_aparente_g_cm3` real,
	`theta_cc` real,
	`theta_pmp` real,
	`humedad_actual_pct` real,
	`temperatura_suelo_c` real,
	`nutrientes_disponibles_kg_ha` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `substrate_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`lote_id` text NOT NULL,
	`fecha` text NOT NULL,
	`tipo` text NOT NULL,
	`volumen_litros_por_planta` real NOT NULL,
	`capacidad_retencion_pct` real NOT NULL,
	`porosidad_aireacion_pct` real,
	`ce_ds_m` real,
	`ph` real,
	`porcentaje_drenaje_objetivo` real NOT NULL,
	`humedad_actual_pct` real,
	`humedad_min_pct` real,
	`humedad_max_pct` real,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tank_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`lote_id` text NOT NULL,
	`tanque` text NOT NULL,
	`volumen_litros` real NOT NULL,
	`relacion_inyeccion` real NOT NULL,
	`numero_pulsos` integer NOT NULL,
	`modo_tanque_c` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `water_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`lote_id` text NOT NULL,
	`fecha` text NOT NULL,
	`unidad_captura` text NOT NULL,
	`iones_capturados` text NOT NULL,
	`iones_normalizados_ppm` text NOT NULL,
	`ph` real NOT NULL,
	`ce_ds_m` real NOT NULL,
	`sar` real,
	`dureza_mg_l_caco3` real,
	`alcalinidad_mg_l_caco3` real,
	`created_at` text NOT NULL
);
