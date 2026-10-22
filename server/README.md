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
- `POST /api/manychat-webhook` — el mismo agente de ventas, para cuando el número está conectado a ManyChat. Ver [Alternativa: conectar por ManyChat](#alternativa-conectar-por-manychat).

Los tres primeros requieren el header `X-Chaman-App-Key` con el valor de
`APP_SHARED_SECRET` (ver `lib/auth.ts` — es una protección básica anti-abuso, no
autenticación de usuario real). El webhook de WhatsApp usa un mecanismo de
seguridad distinto (verificación de firma de Meta), y el de ManyChat un
`Authorization: Bearer` propio; ver más abajo.

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

## Calificación de leads (N1–N4) y sincronización

En los dos canales de WhatsApp (Meta directo y ManyChat), el agente de ventas además
califica a cada prospecto. Al final de cada respuesta el modelo agrega un bloque
oculto `<lead_data>{...}</lead_data>` con nombre, empresa/rancho, cultivo, necesidad,
presupuesto, nivel y siguiente acción. El servidor lo quita antes de mandar el mensaje
(`lib/leadData.ts`; el prospecto nunca lo ve) y lo usa para:

| Nivel           | Significado                                        | Qué pasa                                                                  |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| N1 (frío)       | Consulta genérica, sin compra a corto plazo        | Fila en la pestaña `Nutricion_Leads`                                      |
| N2 (tibio)      | Necesidad definida, sin fecha de compra            | Fila en `Nutricion_Leads`                                                 |
| N3 (caliente)   | Compra en < 30 días o presupuesto/volumen definido | Fila en `Leads_Calificados` + alerta inmediata + el agente ofrece agendar |
| N4 (cierre/VIP) | Alto volumen, cotización a la medida               | Igual que N3, con SLA de 15 min en la alerta                              |

Detalles:

- La alerta (Slack y/o Telegram) se manda solo cuando el prospecto **sube** a N3/N4,
  no en cada mensaje. El último nivel por conversación se guarda en Redis.
- Un prospecto es una sola fila (se identifica por teléfono): se actualiza en cada
  mensaje, y si cambia de nivel, se mueve de pestaña conservando su ID `LD-xxxx`. La
  columna **Estado** la maneja tu equipo: el script solo la llena al crear la fila o al
  moverla.
- Todo esto es opcional: sin las variables de abajo, el agente sigue respondiendo
  igual, solo no sincroniza. Si Sheets o la alerta fallan, el prospecto recibe su
  respuesta de todos modos (el error queda en los logs de Vercel).

### Sincronizar leads con Google Sheets

1. Crea un Google Sheets nuevo (las pestañas `Nutricion_Leads` y `Leads_Calificados`
   se crean solas con sus encabezados la primera vez).
2. **Extensiones → Apps Script**, borra el contenido y pega
   [`integrations/google-sheets-leads.gs`](integrations/google-sheets-leads.gs).
   Cambia `SECRETO` por un valor aleatorio (ej. `openssl rand -hex 16`).
3. **Implementar → Nueva implementación → Aplicación web**. Ejecutar como: _Yo_;
   Quién tiene acceso: _Cualquier persona_. Autoriza los permisos y copia la URL
   (`https://script.google.com/macros/s/.../exec`).
4. En Vercel: `LEADS_SHEETS_WEBHOOK_URL` = esa URL, `LEADS_SHEETS_SECRET` = el mismo
   valor de `SECRETO`. Vuelve a desplegar.

Si cambias el script, publícalo de nuevo con **Implementar → Administrar
implementaciones → Editar → Nueva versión** (si creas una implementación nueva, la URL
cambia).

### Alertas de leads calientes y agenda

- **Slack:** crea un [Incoming Webhook](https://api.slack.com/messaging/webhooks)
  para el canal (ej. `#ventas-leads-calientes`) → `SLACK_WEBHOOK_URL`.
- **Telegram:** crea un bot con @BotFather → `TELEGRAM_BOT_TOKEN`; agrega el bot al
  grupo de ventas y pon el ID del grupo en `TELEGRAM_CHAT_ID`.
- **Agenda:** `LINK_AGENDA_CITAS` (Calendly, Cal.com, Google Calendar, etc.). El
  agente lo ofrece a los prospectos N3/N4 dentro de la misma conversación.

## Alternativa: conectar por ManyChat

Si prefieres que ManyChat sea dueño de la conexión con WhatsApp (su editor de flujos,
bandeja de entrada para tu equipo, etc.), usa este endpoint en vez del webhook
directo de Meta. **No uses los dos con el mismo número**: Meta solo permite un webhook
por app, y ManyChat lo ocupa.

1. En Vercel, agrega `MANYCHAT_WEBHOOK_SECRET` (valor aleatorio) y la base Redis del
   paso 2 de arriba. No necesitas las variables `WHATSAPP_*`.
2. En ManyChat: **Settings → WhatsApp**, conecta tu cuenta de Meta Business y elige el
   número.
3. **Automation → Default Reply** → crea un flujo con una acción **External Request**:
   - Método `POST`, URL `https://tu-backend.vercel.app/api/manychat-webhook`
   - Headers: `Authorization: Bearer <MANYCHAT_WEBHOOK_SECRET>`
   - Body (JSON):
     ```json
     {
       "user_id": "{{user_id}}",
       "phone": "{{phone}}",
       "first_name": "{{first_name}}",
       "last_message": "{{last_input_text}}"
     }
     ```
   - **Response mapping:** `$.response_text` → Custom User Field `response_text`;
     `$.lead_level` → Custom User Field `lead_level`.
4. Después de la External Request, agrega un mensaje de texto que muestre
   `{{response_text}}`. Con `lead_level` puedes armar condiciones en ManyChat (ej.
   etiquetar o asignar a un humano cuando sea N3/N4).

La respuesta del agente tarda unos segundos; si ManyChat marca timeout, revisa el
tiempo máximo de la External Request en tu plan.

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
