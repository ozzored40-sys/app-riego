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

- `POST /api/chat` — turno de conversación con el agrónomo virtual (lo usa la app móvil).
- `POST /api/diagnose-photo` — diagnóstico inicial a partir de una foto del cultivo (lo usa la app móvil).
- `GET/POST /api/whatsapp-webhook` — el agente de WhatsApp (agrónomo + ventas), ver abajo.

Los dos primeros requieren el header `X-Chaman-App-Key` con el valor de
`APP_SHARED_SECRET` (ver `lib/auth.ts` — es una protección básica anti-abuso, no
autenticación de usuario real). El webhook de WhatsApp usa su propio mecanismo de
verificación (firma HMAC de Meta), no este header.

## Agente de WhatsApp

`/api/whatsapp-webhook` conecta el agrónomo virtual a un número de WhatsApp Business
real usando **WhatsApp Cloud API** de Meta (directo, sin intermediarios como Twilio).
El mismo agente diagnostica como ingeniero agrónomo **y** vende: busca en el catálogo
real (`lib/catalog.json`), cotiza y cierra el pedido avisando al vendedor por
WhatsApp — nunca inventa productos, presentaciones ni precios.

### 1. Cargar el catálogo real

Antes de activar el bot en producción, edita `lib/catalog.json` con los productos,
presentaciones y precios reales de Chamán Agro Soluciones, y pon `precioConfirmado`
en `true` en cada uno. Mientras un producto siga en `false`, el bot le dirá al cliente
que va a confirmar el precio con el equipo en vez de inventarlo — es la misma regla de
"nunca inventes un precio" que ya seguía el agrónomo virtual de la app.

### 2. Crear la app de WhatsApp Business en Meta

1. Entra a [developers.facebook.com](https://developers.facebook.com) → **Mis apps** →
   **Crear app** → tipo **Empresa**.
2. Agrega el producto **WhatsApp** a la app.
3. En **WhatsApp → Introducción a la API** obtienes un número de prueba temporal (sirve
   para probar ya mismo) y ahí mismo ves el **Phone Number ID** y puedes generar un
   **Access Token temporal** (24 h) para pruebas. Para producción, genera un **access
   token permanente**: **Configuración de la app → Usuarios del sistema**, crea un
   usuario del sistema, asígnale el activo de WhatsApp con permiso
   `whatsapp_business_messaging`, y genera su token sin expiración.
4. Cuando quieras usar tu propio número de negocio (no el de prueba), agrégalo en
   **WhatsApp → Configuración de la API** y verifica el número.

### 3. Configurar variables de entorno

Llena en `.env.local` (desarrollo) o en Vercel (producción) las variables de la
sección "Agente de WhatsApp" de `.env.example`:
`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` (inventa
cualquier cadena larga), `WHATSAPP_APP_SECRET` (en **Configuración básica de la app**),
`OWNER_WHATSAPP_NUMBER` y las dos de Upstash (paso 5).

### 4. Configurar el webhook en Meta

1. Despliega el backend (ver "Desplegar en Vercel" arriba) para tener la URL pública.
2. En **WhatsApp → Configuración** de tu app en Meta, sección **Webhook**, pon como
   **URL de devolución de llamada**: `https://tu-backend.vercel.app/api/whatsapp-webhook`
   y como **Verify token** el mismo valor que pusiste en `WHATSAPP_VERIFY_TOKEN`.
3. Verifica y guarda (Meta llama a la URL con un `GET`, lo maneja `resolverDesafioVerificacion`
   en `lib/whatsapp.ts`).
4. Suscribe el campo **messages** del webhook (checkbox en la misma pantalla) — sin
   esto no llegan los mensajes entrantes.

### 5. Crear la base de Redis (historial de conversación)

A diferencia de la app (que guarda el historial localmente en SQLite y lo manda
completo en cada request), WhatsApp solo entrega un mensaje suelto por evento — el
historial de cada número vive en Redis para que el bot no pierda el hilo entre
mensajes.

1. Crea una cuenta gratis en [upstash.com](https://upstash.com) → **Create Database**
   (tipo Redis, la capa gratuita alcanza sin problema para esto).
2. Copia **REST URL** y **REST Token** del dashboard a `UPSTASH_REDIS_REST_URL` y
   `UPSTASH_REDIS_REST_TOKEN`.

### 6. Probar

Mándale un WhatsApp al número de prueba (o al tuyo ya verificado) con algo como "mis
hojas de jitomate están amarillas" — el bot debe empezar a hacer preguntas como
agrónomo. Cuando el diagnóstico apunte a un insumo, debe buscarlo en el catálogo real
y, si se lo pides, cotizar y cerrar el pedido (te llega el aviso a
`OWNER_WHATSAPP_NUMBER`).

### Límites a tener en cuenta

- **Ventana de 24 horas:** WhatsApp Cloud API solo permite mandar mensajes de texto
  libre a un número dentro de las 24 h desde su último mensaje a tu número de negocio.
  Esto aplica también al aviso de pedido a `OWNER_WHATSAPP_NUMBER`: si el vendedor no
  le ha escrito al bot recientemente, ese aviso puede fallar (se registra el error, no
  tumba la confirmación al cliente). Para notificaciones garantizadas 24/7 hace falta
  una plantilla de mensaje aprobada por Meta (no incluida en esta primera versión).
- **Cierre de pedido = handoff, no cobro automático:** `confirmar_pedido` registra el
  pedido con folio y avisa al vendedor con todo listo para cerrar — no cobra ni
  procesa pagos (no hay pasarela de pago conectada). Si más adelante quieres cobro
  automático, se puede agregar un link de pago (Stripe, Conekta, Mercado Pago, etc.)
  como paso adicional de esa misma herramienta.
- **Duración de la función:** un turno con fotos y varias llamadas a herramientas
  puede tardar varios segundos; `vercel.json` ya sube `maxDuration` a 30s para esta
  función (el plan Hobby de Vercel permite hasta 60s; si tu procesamiento se acerca a
  ese límite, considera subir de plan o simplificar el flujo).
- Mismo costo por tokens de Anthropic que `/api/chat`, más los WhatsApp llaman a la
  API de Meta (gratis hasta cierto volumen de conversaciones, luego tiene costo — ver
  precios de WhatsApp Business Platform).

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
