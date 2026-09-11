# Guía de usuario — Chamán NutriFlow

Esta guía explica, pantalla por pantalla, cómo usar la app para calcular el
riego y la nutrición diaria de un lote, registrar su monitoreo y consultar al
agrónomo virtual. Está escrita para el productor/agrónomo que usa la app en
campo, no para desarrolladores (para eso está el `README.md` y `AGENTS.md`).

## 1. Antes de empezar

- La app funciona sin conexión: los lotes, análisis, lecturas y
  recomendaciones se guardan localmente en el dispositivo (SQLite).
- El **agrónomo virtual** (chat con IA y diagnóstico por foto) sí necesita
  internet y un backend configurado — ver [§7](#7-agrónomo-virtual-chat-e-ia).
  Si no está configurado, la app lo indica claramente y el resto sigue
  funcionando igual.
- El **clima automático** (ETo y lluvia por GPS) también necesita conexión;
  si falla, siempre puedes capturar esos valores a mano.

## 2. Pantalla principal (Mis lotes)

Al abrir la app ves la lista de lotes ya creados (cultivo, sistema de
producción y superficie de cada uno). Desde aquí puedes:

- Tocar un lote para ir a su pantalla **Hoy**.
- **+ Nuevo lote** — inicia el wizard de configuración (ver §3).
- **Inventario de fertilizantes** — catálogo de insumos, existencias y precio
  (ver §8).

## 3. Crear un lote (wizard de 4 pasos)

El wizard guarda los datos base de un lote antes de poder calcular nada. Los
cuatro pasos son obligatorios y se hacen una sola vez por lote (aunque
siempre puedes volver a capturar análisis nuevos más adelante).

### Paso 1 — Datos generales del cultivo

- Nombre del lote, cultivo (papaya, limón, pepino, chile o jitomate),
  sistema de producción (suelo, sustrato, hidroponía, NFT o raíz flotante),
  fecha de siembra/trasplante, superficie (ha), densidad de plantas y
  rendimiento objetivo.
- Al elegir el cultivo, la app sugiere densidad y rendimiento de referencia
  si aún no los capturaste.

### Paso 2 — Suelo o sustrato

La pantalla cambia según el sistema de producción elegido en el paso 1:

- **Suelo**: textura, profundidad efectiva de raíz, materia orgánica, pH, CE,
  CIC y nutrientes disponibles (N, P, K, Ca, Mg, S) del análisis de
  laboratorio, en kg/ha.
- **Sustrato**: tipo (fibra de coco, perlita, peat moss, tezontle, mezcla),
  volumen por planta, capacidad de retención de agua, % de drenaje objetivo,
  CE y pH.

### Paso 3 — Análisis de agua

Captura pH, CE y los iones del agua de riego (Ca, Mg, Na, K, HCO₃, CO₃, Cl,
SO₄, NO₃, B, Fe, Mn) en la unidad que prefieras (ppm, mg/L, meq/L o mmol/L —
la app convierte internamente). Al guardar, la app muestra de inmediato el
diagnóstico de calidad del agua: SAR, dureza y alcalinidad.

### Paso 4 — Sistema de riego

Tipo de riego (goteo, aspersión, NFT o raíz flotante), gasto del emisor
(L/h), emisores por planta, eficiencia del sistema, número de pulsos de
riego al día y % de drenaje deseado.

Al tocar **Finalizar y crear lote** el lote queda creado y la app te lleva
directo al **Diagnóstico inicial** (§4).

> Si alguno de los tres análisis (suelo/sustrato, agua o riego) queda
> incompleto, la pantalla **Hoy** del lote te lo señala y no deja calcular la
> recomendación diaria hasta completarlo.

## 4. Diagnóstico inicial (por reglas)

Disponible en `Lote → Diagnóstico`. Es una revisión rápida, sin fotos ni IA,
que compara lo ya capturado (suelo/sustrato, agua, riego) contra los rangos
de referencia del cultivo elegido. Muestra un semáforo general (**Bien /
Atención / Riesgo**) y el detalle agrupado por categoría (Suelo, Sustrato,
Agua, Riego). No reemplaza la visita de un técnico, pero sirve como primer
filtro antes de calcular la recomendación de hoy.

## 5. Pantalla "Hoy" — recomendación diaria

Es el corazón de la app: calcula cuánta agua y cuánto fertilizante aplicar
hoy en ese lote.

1. **Clima**: toca **📍 Usar clima automático (GPS)** para traer ETo y lluvia
   efectiva de Open-Meteo según la ubicación del lote, o edítalos a mano en
   mm/día. Si el clima automático falla, la app avisa pero deja seguir con
   captura manual.
2. Toca **Calcular recomendación de hoy**. Si falta algún análisis del
   wizard, la pantalla te lo indica en vez de calcular.
3. El resultado muestra:
   - **Requerimiento hídrico**: litros por planta y por hectárea al día,
     número de pulsos, litros y minutos por pulso.
   - **Demanda nutrimental**: tabla por nutriente en g/planta/día,
     kg/ha/día y kg por sector.
   - **Tambos**: dosis por tambo (litros de solución madre por día y por
     pulso, días de autonomía) y los productos/kg que le corresponden a
     cada uno, tomados del inventario de fertilizantes.
   - **Alertas de incompatibilidad**, si hay productos que no deben
     mezclarse en el mismo tambo.
   - **Costo diario total** de los fertilizantes aplicados.

Desde esta pantalla tienes acceso rápido a Diagnóstico, Agrónomo,
Monitoreo, Savia y Resultados.

## 6. Monitoreo — programado vs. aplicado

En `Lote → Monitoreo` registras lo que realmente se aplicó en campo (agua
aplicada, CE aplicada, pH aplicado, caudal, humedad de sustrato o
fertilizante aplicado) y la app lo compara contra lo programado:

- 🟢 **Verde**: dentro de tolerancia, sin acción.
- 🟡 **Amarillo**: desviación moderada — la app sugiere un % de ajuste para
  el próximo programa.
- 🔴 **Rojo**: desviación mayor al 20% — no se ajusta automáticamente; la
  app lista posibles causas para revisar en campo.

Las alertas activas se listan abajo y puedes marcarlas como **resueltas**
una vez atendidas. También se muestran las últimas 10 lecturas registradas.

## 7. Savia — análisis foliar

En `Lote → Savia` registras lecturas de análisis de savia (NO₃, K, Ca, Na en
ppm, y la hoja muestreada). La app muestra la tendencia respecto a la
lectura anterior (↑ ↓ →) y el historial completo, para detectar
desviaciones nutricionales antes de que se vean en la planta.

## 8. Agrónomo virtual (chat e IA)

En `Lote → Agrónomo` puedes conversar con un asistente de IA sobre lo que
observas en el cultivo: te hace preguntas para precisar el diagnóstico y
propone actividades/protocolos. También puedes:

- 📷 **Foto** — tomar una foto del cultivo con la cámara.
- 🖼️ **Galería** — adjuntar una foto ya existente.
- 🔄 **Reiniciar** — borra la conversación de este lote y empieza de cero.

Cuando el asistente responde, la app compara el texto contra el catálogo de
insumos del productor y sugiere hasta 4 productos que podrían aplicar.

**Esta función requiere configuración previa** (backend propio, por costos y
seguridad de la API key — ver `server/README.md`). Si no está configurada,
la pantalla lo indica explícitamente y te redirige al diagnóstico por
reglas (§4), que siempre está disponible.

Para habilitarla, define en `.env.local` (copiando `.env.example`):

```
EXPO_PUBLIC_AGRONOMIST_API_URL=https://tu-backend.vercel.app
EXPO_PUBLIC_AGRONOMIST_APP_KEY=<mismo valor que APP_SHARED_SECRET del backend>
```

## 9. Resultados — resumen del lote

En `Lote → Resultados` ves un acumulado histórico del lote: número de
recomendaciones calculadas, agua promedio por planta, costo acumulado y
promedio diario de fertilizantes, alertas activas por nivel, y el historial
de recomendaciones (fecha, etapa, L/planta y costo). Eficiencia y
rendimiento real contra el objetivo requieren registrar la cosecha; esa
pantalla todavía no existe en esta versión.

## 10. Inventario de fertilizantes

Accesible desde la pantalla principal (**Inventario de fertilizantes**).
Es el catálogo compartido entre todos los lotes: fertilizantes,
enraizadores, mejoradores de suelo, biológicos, foliares, bioestimulantes y
Ozono Chamán. Por cada insumo puedes editar **existencias (kg)** y **precio
($/kg)**; la composición nutrimental y el tambo asignado vienen de la ficha
técnica y no se editan desde aquí.

## 11. Preguntas frecuentes

**¿Puedo usar la app sin internet?**
Sí, salvo el clima automático y el agrónomo virtual (chat/foto por IA).
Todo lo demás — wizard, diagnóstico por reglas, recomendación diaria,
monitoreo, savia, resultados e inventario — funciona 100% local.

**¿Qué pasa si cambio de opinión en el sistema de producción?**
El paso 2 del wizard depende de si el lote es "suelo" o no (sustrato,
hidroponía, NFT, raíz flotante usan la pantalla de sustrato). Si necesitas
cambiarlo, crea un nuevo lote o vuelve a capturar el análisis correspondiente.

**¿La recomendación diaria se recalcula sola cada día?**
No: entras a **Hoy**, actualizas el clima (automático o manual) y tocas
**Calcular recomendación de hoy** cada vez que quieras una nueva
recomendación.

**¿De dónde salen los cultivos disponibles?**
Del catálogo interno de la app (`src/domain/crops`): papaya, limón, pepino,
chile y jitomate en esta versión.
