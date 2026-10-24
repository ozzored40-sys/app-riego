# Cómo publicar Chamán 4.0

La app ya está configurada para compilarse con **EAS Build** (servicio de Expo) y subirse a las tiendas
con **EAS Submit**. Estos pasos los haces tú una sola vez desde tu computadora. Requieren tus cuentas y
pagos, por eso no se pueden automatizar desde aquí.

## 0. Lo que necesitas

| Requisito | Para qué | Costo |
| --- | --- | --- |
| Cuenta en [expo.dev](https://expo.dev) | Compilar en la nube (EAS) | Gratis (plan básico) |
| [Google Play Console](https://play.google.com/console) | Publicar en Android | US$25, un solo pago |
| [Apple Developer Program](https://developer.apple.com/programs/) | Publicar en iPhone | US$99 al año |
| Cuenta de [Vercel](https://vercel.com) y API key de [Anthropic](https://console.anthropic.com) | Backend de los especialistas IA | Según uso |
| Página de **aviso de privacidad** (p. ej. en ozonochaman.com) | Ambas tiendas la exigen (la app usa cámara, fotos y ubicación) | — |

## 1. Desplegar el backend de IA

Sigue [server/README.md](server/README.md): importa el repo en Vercel con *Root Directory* = `server` y
configura `ANTHROPIC_API_KEY` y `APP_SHARED_SECRET`. Guarda la URL que te da Vercel.

## 2. Preparar EAS

```bash
npm install -g eas-cli
eas login
eas init            # vincula el proyecto y agrega el projectId a app.json
```

Configura las variables que la app necesita en cada entorno (preview y production):

```bash
eas env:set --name EXPO_PUBLIC_AGRONOMIST_API_URL --value https://TU-BACKEND.vercel.app --environment preview --environment production --visibility plaintext
eas env:set --name EXPO_PUBLIC_AGRONOMIST_APP_KEY --value EL_MISMO_APP_SHARED_SECRET --environment preview --environment production --visibility plaintext
# Opcional: tu enlace de pago de Mercado Pago
eas env:set --name EXPO_PUBLIC_MERCADOPAGO_LINK --value https://mpago.la/XXXX --environment preview --environment production --visibility plaintext
```

> Los identificadores de la app son `com.ozonochaman.centrodecomando` (iOS y Android), en `app.json`.
> Si prefieres otro, cámbialo **antes** del primer build: una vez publicado ya no se puede cambiar.

## 3. Probar en tu teléfono (APK)

```bash
eas build --platform android --profile preview
```

Al terminar, EAS te da un enlace o QR para instalar el APK en cualquier Android y probarlo en campo.

## 4. Compilar para las tiendas

```bash
eas build --platform all --profile production
```

- Android genera un `.aab` (formato de Google Play).
- iOS te pedirá iniciar sesión con tu Apple ID; EAS crea los certificados por ti.
- El número de versión de compilación se incrementa solo en cada build de producción.

## 5. Subir a las tiendas

```bash
eas submit --platform android --latest
eas submit --platform ios --latest
```

- **Google Play**: la primera vez crea la app en Play Console, llena la ficha (descripción, capturas,
  ícono 512×512), el cuestionario de *Seguridad de los datos* (fotos, ubicación aproximada, sin venta
  de datos) y la clasificación de contenido. Para el primer envío Google pide una cuenta de servicio
  ([guía de Expo](https://docs.expo.dev/submit/android/)).
- **App Store**: crea la app en App Store Connect, agrega capturas, aviso de privacidad y la
  información de *App Privacy*. La revisión de Apple suele tardar de 1 a 3 días.

## 6. Actualizaciones

Cambia `version` en `app.json` (p. ej. `1.1.0`) y repite los pasos 4 y 5.

## Notas

- **Versión web**: el prototipo de AI Studio era web. Esta app se publica para iOS y Android.
  La exportación web compila, pero hoy no es utilizable: la base de datos local (`expo-sqlite` 57.0.1)
  falla en web al leer registros de más de 255 bytes. Tampoco se probó en navegador la pantalla del
  dictamen. En web, el hosting debe enviar `Cross-Origin-Opener-Policy: same-origin` y
  `Cross-Origin-Embedder-Policy: credentialless`. El servidor de desarrollo ya las envía
  (`metro.config.js`).
- **Precios**: los costos por hectárea y de los generadores son valores de referencia del prototipo.
  Ajústalos en `src/domain/chaman/productos.ts` y `src/domain/chaman/calculadora.ts` antes de publicar.
