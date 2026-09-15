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
- `POST /api/sales-chat` — turno de conversación con el agente de ventas virtual (lo usa la app; el catálogo de insumos lo manda la app desde su inventario local).
- `POST /api/diagnose-photo` — diagnóstico inicial a partir de una foto del cultivo.
- `GET`/`POST /api/whatsapp-webhook` — canal de WhatsApp del agente de ventas (Meta Cloud API). Ver [Canal de WhatsApp](#canal-de-whatsapp-del-agente-de-ventas) abajo.

Los tres primeros requieren el header `X-Chaman-App-Key` con el valor de
`APP_SHARED_SECRET` (ver `lib/auth.ts` — es una protección básica anti-abuso, no
autenticación de usuario real). El webhook de WhatsApp usa un mecanismo de
seguridad distinto (verificación de firma de Meta), ver más abajo.

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

## Canal de WhatsApp del agente de ventas

`api/whatsapp-webhook.ts` conecta el agente de ventas (el mismo `SYSTEM_PROMPT_VENTAS`
de `/api/sales-chat`) a un número de WhatsApp Business real, para hablar con
prospectos que todavía no tienen la app. A diferencia de `/api/chat` y
`/api/sales-chat` (donde la app manda el historial completo porque lo guarda en
SQLite local), aquí no hay ninguna app detrás del prospecto: el servidor guarda el
historial por número en una base de datos Redis (ver "Historial de WhatsApp" abajo),
y el catálogo que ofrece es uno estático (`lib/salesCatalog.ts`), no el inventario
real de un productor.

### 1. Conectar el número en Meta for Developers

Necesitas una app de WhatsApp Business en [Meta for
Developers](https://developers.facebook.com/) con tu número ya verificado ahí
(esto lo haces tú desde el panel de Meta — no es algo que se pueda automatizar desde
aquí, requiere verificar el número por SMS/llamada).

En el panel de esa app, sección **WhatsApp → Configuración de la API**:

- Copia el **Phone Number ID** (un ID numérico, no tu número de teléfono) →
  `WHATSAPP_PHONE_NUMBER_ID`.
- Genera un **token de acceso** — para producción, usa un token permanente de un
  [usuario de sistema](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#system-user-access-tokens),
  no el temporal de 24h que se genera por defecto → `WHATSAPP_ACCESS_TOKEN`.
- En **Configuración básica** de la app, copia el **App Secret** →
  `WHATSAPP_APP_SECRET` (opcional pero recomendado: habilita la verificación de
  firma de cada webhook entrante).

### 2. Conectar una base de datos Redis (historial de conversación)

En el dashboard de Vercel del proyecto: **Storage → Create Database → Redis**
(Marketplace de Upstash) → conéctala a este proyecto. Vercel inyecta
`KV_REST_API_URL` y `KV_REST_API_TOKEN` automáticamente; no hace falta copiarlas a
mano.

### 3. Configurar las variables de entorno y desplegar

Agrega en Vercel (Project Settings → Environment Variables), además de las que ya
tenías:

- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET` (del
  paso 1).
- `WHATSAPP_VERIFY_TOKEN` — inventas tú un valor largo y aleatorio (ej.
  `openssl rand -hex 16`); lo vuelves a pegar en el paso 4.

Vuelve a desplegar para que Vercel recoja las nuevas variables y el archivo
`api/whatsapp-webhook.ts`.

### 4. Suscribir el webhook en Meta

En el panel de la app, **WhatsApp → Configuración → Webhooks → Editar**:

- **Callback URL:** `https://tu-backend.vercel.app/api/whatsapp-webhook`
- **Verify token:** el mismo valor que pusiste en `WHATSAPP_VERIFY_TOKEN`.
- Suscríbete al campo **`messages`**.

Meta hace un `GET` de verificación al guardar — si el token no coincide, lo
rechaza y no deja guardar (revisa que copiaste el mismo valor en ambos lados).

A partir de aquí, cualquier mensaje de texto que llegue a ese número de WhatsApp
recibe respuesta automática del agente de ventas.

### Notas de este canal

- Solo responde a mensajes de **texto**; otros tipos (imagen, audio, ubicación,
  etc.) y los recibos de estado (enviado/entregado/leído) se ignoran en silencio
  (ver `lib/whatsappPayload.ts`).
- El catálogo que ofrece es estático (`lib/salesCatalog.ts`), con los mismos
  valores de referencia que `src/domain/fertilizers/library.ts` en la app — no es
  una lista de precios oficial vigente, hay que mantenerla a mano.
- El historial por número se olvida solo tras 7 días de inactividad (TTL en
  `lib/salesConversationStore.ts`).

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
