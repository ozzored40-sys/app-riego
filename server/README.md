# Chamán NutriFlow — backend (diálogo con el agrónomo + diagnóstico por foto)

Backend mínimo que hace de proxy seguro hacia la API de Anthropic (Claude). Existe
por una sola razón: la app móvil no puede guardar la API key de Anthropic de forma
segura (cualquiera podría extraerla del build), así que las llamadas a la IA pasan
por aquí, donde la key vive solo como variable de entorno del servidor.

No tiene base de datos ni estado propio: la app manda el historial de la
conversación completo en cada solicitud (ya lo guarda localmente en SQLite) y este
backend solo agrega el system prompt del agrónomo virtual, llama a Claude, y
regresa la respuesta.

## Endpoints

- `POST /api/chat` — turno de conversación con el agrónomo virtual.
- `POST /api/diagnose-photo` — diagnóstico inicial a partir de una foto del cultivo.

Los dos requieren el header `X-Chaman-App-Key` con el valor de `APP_SHARED_SECRET`
(ver `lib/auth.ts` — es una protección básica anti-abuso, no autenticación de
usuario real).

## Desplegar en Vercel (recomendado)

1. Sube este repo a GitHub si no lo está ya.
2. En [vercel.com](https://vercel.com), **New Project** → importa el repo
   `app-riego`.
3. En **Root Directory**, selecciona `server` (no la raíz del repo — ahí vive la
   app de Expo, es un proyecto distinto).
4. En **Environment Variables**, agrega:
   - `ANTHROPIC_API_KEY` — tu API key de Anthropic.
   - `APP_SHARED_SECRET` — un valor largo y aleatorio (ej. `openssl rand -hex 32`).
5. Deploy. Vercel detecta automáticamente las funciones en `api/` (Node.js
   serverless functions) sin configuración adicional.
6. Copia la URL que te da Vercel (ej. `https://tu-proyecto.vercel.app`) — la app
   la necesita para saber a dónde llamar (ver `src/services/agronomistClient.ts`
   en el proyecto de la app).

## Desarrollo local

```bash
cd server
npm install
cp .env.example .env.local   # y llena los valores
npx vercel dev                # o: npx tsc --noEmit && npx jest
```

## Costos y límites a tener en cuenta

- Cada mensaje de chat y cada foto analizada es una llamada a la API de Anthropic
  con costo asociado (por tokens). `MAX_TOKENS_RESPUESTA` en `lib/anthropic.ts`
  limita el tamaño de cada respuesta; no hay límite de mensajes por usuario/día
  todavía (considerar agregar si el uso crece).
- El body de una función serverless de Vercel tiene un límite de tamaño (varía
  según el plan). Las fotos deben comprimirse/redimensionarse en la app antes de
  enviarse en base64 — `lib/validation.ts` rechaza imágenes de más de ~4.5 MB.
- `APP_SHARED_SECRET` es una protección básica, no autenticación real de usuario
  (ver el comentario en `lib/auth.ts`). Si la app crece a muchos productores,
  vale la pena agregar cuentas de usuario y rate limiting por cuenta.
