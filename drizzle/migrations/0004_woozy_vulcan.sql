CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`folio` text NOT NULL,
	`productor` text NOT NULL,
	`telefono` text,
	`ubicacion` text,
	`cultivo_clave` text NOT NULL,
	`cultivo_nombre` text NOT NULL,
	`superficie_ha` real NOT NULL,
	`producto_clave` text NOT NULL,
	`producto_nombre` text NOT NULL,
	`problema` text NOT NULL,
	`severidad` text NOT NULL,
	`metodo` text NOT NULL,
	`ppm_ozono` real NOT NULL,
	`dosis_l_ha` real NOT NULL,
	`aplicaciones` integer NOT NULL,
	`producto_total_litros` real NOT NULL,
	`agua_portadora_l_ha` real NOT NULL,
	`costo_estimado_mxn` real NOT NULL,
	`ahorro_estimado_mxn` real NOT NULL,
	`etapa` text NOT NULL,
	`notas` text,
	`dictamen_texto` text NOT NULL,
	`protocolo_ia` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `specialist_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`especialista_id` text NOT NULL,
	`rol` text NOT NULL,
	`contenido` text NOT NULL,
	`created_at` text NOT NULL
);
