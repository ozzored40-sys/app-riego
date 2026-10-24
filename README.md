# Chamán 4.0 — Centro de Comando

App móvil (iOS y Android, con Expo) de **Chamán Agro Soluciones** que une en un solo lugar:

| Pestaña | Qué hace |
| --- | --- |
| **Inicio** | Panel con prospectos, pipeline, ventas cerradas, lotes y accesos rápidos. |
| **Campo** | Riego y nutrición por lote (NutriFlow): análisis de suelo/agua, recomendación diaria, monitoreo, agrónomo virtual con foto y agente de ventas. |
| **Dictamen** | Diagnóstico en campo: cultivo, problema y severidad → prescripción Chamán (dosis, ppm de O₃, volúmenes, costo y ahorro estimados) con **folio consecutivo** y registro automático en el CRM. |
| **IA** | Especialistas IA: Dra. Athena (fitopatología), Dr. Chiron (suelo y goteros), Dra. Artemis (frutos y estrés), Ing. Mayahuel (agave), Dr. Hermes (rentabilidad) y Capi 1 (soporte técnico de equipos). |
| **CRM** | Embudo N1 Prospecto → N2 Prueba → N3 Cotización → N4 Cliente, con notas, envío del dictamen por WhatsApp y protocolo ampliado generado por IA. |
| **Más** | Catálogo con fotos y fichas de la línea Chamán Ozono, calculadora de generador O₃ y ROI, plantillas y redactor de anuncios para Meta Ads, pagos con Mercado Pago y CFDI. |

Unifica la app de riego original con el prototipo "Chamán Agro Command Center" de Google AI Studio.

## Arquitectura

- `src/app/` — pantallas (Expo Router; pestañas en `src/app/(tabs)/`).
- `src/domain/` — lógica pura y probada: fertirriego (`crops`, `water`, `nutrients`, …) y Chamán 4.0 (`domain/chaman`: productos, cultivos, prescripción, calculadora, especialistas, anuncios, embudo).
- `src/data/` — SQLite local (drizzle). Los datos viven en el teléfono y funcionan sin internet.
- `server/` — backend en Vercel que llama a Claude (Anthropic). La API key nunca va dentro de la app. Ver [server/README.md](server/README.md).

## Desarrollo

```bash
npm install
cp .env.example .env.local   # URL y clave del backend de IA
npx expo start
```

Pruebas y verificaciones:

```bash
npm test            # dominio, datos y servicios
npx tsc --noEmit
npm run lint
cd server && npm test && npx tsc --noEmit
```

Si cambias `src/data/db/schema.ts`, genera la migración con `npm run db:generate`.

## Publicar en App Store y Google Play

Ver la guía paso a paso en [PUBLICAR.md](PUBLICAR.md).
