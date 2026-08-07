PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_fertilizantes` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`categoria_insumo` text DEFAULT 'fertilizante' NOT NULL,
	`formula_comercial` text,
	`estado_fisico` text NOT NULL,
	`composicion_pct` text NOT NULL,
	`densidad_kg_l` real,
	`solubilidad_g_l` real,
	`pureza` real NOT NULL,
	`costo_por_kg` real NOT NULL,
	`unidad_precio` text,
	`presentacion_comercial` text,
	`ficha_tecnica_url` text,
	`factor_ce` real NOT NULL,
	`porcentaje_na` real NOT NULL,
	`porcentaje_cl` real NOT NULL,
	`categoria_tanque` text,
	`es_custom` integer DEFAULT false NOT NULL,
	`stock_kg` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_fertilizantes`("id", "nombre", "categoria_insumo", "formula_comercial", "estado_fisico", "composicion_pct", "densidad_kg_l", "solubilidad_g_l", "pureza", "costo_por_kg", "unidad_precio", "presentacion_comercial", "ficha_tecnica_url", "factor_ce", "porcentaje_na", "porcentaje_cl", "categoria_tanque", "es_custom", "stock_kg", "created_at", "updated_at") SELECT "id", "nombre", 'fertilizante', "formula_comercial", "estado_fisico", "composicion_pct", "densidad_kg_l", "solubilidad_g_l", "pureza", "costo_por_kg", NULL, NULL, NULL, "factor_ce", "porcentaje_na", "porcentaje_cl", "categoria_tanque", "es_custom", "stock_kg", "created_at", "updated_at" FROM `fertilizantes`;--> statement-breakpoint
DROP TABLE `fertilizantes`;--> statement-breakpoint
ALTER TABLE `__new_fertilizantes` RENAME TO `fertilizantes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;