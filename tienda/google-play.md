# Google Play: ficha y formularios de Chamán 4.0

Copia y pega estos textos en [Play Console](https://play.google.com/console). Revisa lo marcado
con ⚠️ antes de enviar.

## 1. Tipo de cuenta de desarrollador (decídelo antes de pagar)

| | Cuenta **personal** | Cuenta de **organización** |
| --- | --- | --- |
| Requisito | Identificación oficial | Empresa con número **D-U-N-S** (gratis, tarda 1–4 semanas) |
| Antes de publicar | ⚠️ Prueba cerrada obligatoria: **12 testers durante 14 días seguidos** | Sin ese requisito |
| Nombre visible | Tu nombre | "Chamán Agrosoluciones" |

Recomendación: **cuenta de organización** a nombre de la empresa. La ficha transmite más
confianza, evitas la prueba de 12 testers, y la responsabilidad frente a Google queda en la
empresa y no en tu persona.

## 2. Datos de la app

- **Nombre de la app** (máx. 30): `Chamán 4.0 – Centro de Comando`
- **Categoría**: Productividad. Alternativa: Empresa.
- **Etiquetas**: agricultura, riego, agronomía
- **Correo de contacto**: Ozzored4.0@gmail.com
- **Sitio web**: https://ozonochaman.com/
- **Política de privacidad (URL)**: `https://TU-BACKEND.vercel.app/privacidad` ⚠️ (la URL real
  del backend en Vercel; ver PUBLICAR.md)
- **¿Contiene anuncios?** No.
- **Precio**: Gratis.

## 3. Descripción breve (máx. 80)

```
Diagnóstico de campo, riego, especialistas IA y CRM para productores agrícolas.
```

## 4. Descripción completa (máx. 4000)

```
Chamán 4.0 es el Centro de Comando de Chamán Agro Soluciones para productores, técnicos y distribuidores agrícolas. Reúne en una sola app el diagnóstico en campo, el riego y la nutrición de tus lotes, asistentes de inteligencia artificial y el seguimiento comercial de tus productores.

DICTAMEN EN CAMPO
• Elige cultivo, problema y severidad, y obtén una prescripción de referencia con la línea Chamán Ozono: dosis por hectárea, concentración de ozono, volúmenes de agua, número de aplicaciones y costo estimado.
• Cada dictamen recibe un folio consecutivo y se puede compartir por WhatsApp.

RIEGO Y NUTRICIÓN
• Registra tus lotes con análisis de suelo o sustrato, agua y sistema de riego.
• Recomendación diaria de riego y fertirriego con datos de clima de tu ubicación.
• Monitoreo, savia y resultados por lote.

ESPECIALISTAS IA
• Consulta a asistentes de inteligencia artificial especializados en fitopatología, suelo y goteros, fisiología de frutos, agave y rentabilidad, además de soporte técnico para equipos de ozono.
• Agrónomo virtual con análisis de fotos de tu cultivo.

CRM DE PRODUCTORES
• Da seguimiento a cada prospecto: prueba en campo, cotización y cliente.
• Notas, envío de dictámenes y protocolos ampliados.

MÁS HERRAMIENTAS
• Catálogo con fichas técnicas de la línea Chamán Ozono.
• Calculadora de capacidad de generador de ozono y retorno de inversión.
• Plantillas de anuncios y redactor de textos para redes sociales.
• Solicitud de pago y facturación por los canales oficiales.

TUS DATOS EN TU TELÉFONO
Tus lotes, dictámenes y prospectos se guardan en tu dispositivo. Puedes borrarlos cuando quieras desde la app.

IMPORTANTE: Las recomendaciones, cálculos y respuestas de IA son orientativos y no sustituyen la recomendación de un ingeniero agrónomo en campo. Sigue siempre la etiqueta del producto. Los montos son estimaciones de referencia, sujetos a cotización formal.
```

## 5. Recursos gráficos

- **Ícono 512 × 512**: `assets/images/icon.png` (redimensionado a 512).
- **Gráfico de funciones 1024 × 500**: ⚠️ por crear (se puede usar la foto de la línea de productos
  sobre fondo azul noche).
- **Capturas de teléfono**: mínimo 2 y máximo 8, en vertical. Sugeridas: Inicio, Dictamen, Vista
  previa de la prescripción, Especialistas IA, CRM y Catálogo.

## 6. Formulario "Seguridad de los datos" (Data safety)

**¿La app recopila o comparte alguno de los tipos de datos de usuario requeridos?** Sí.
**¿Todos los datos se cifran en tránsito?** Sí (HTTPS).
**¿Ofreces una forma de solicitar la eliminación de datos?** Sí: "Más → Legal y privacidad → Borrar
todos mis datos" y el correo de privacidad.

| Tipo de dato (Play) | ¿Recopilado? | ¿Compartido? | Opcional | Finalidad |
| --- | --- | --- | --- | --- |
| Ubicación aproximada | Sí | Sí (Open-Meteo, para clima) | Sí (permiso) | Funcionalidad de la app |
| Ubicación precisa | Sí | Sí (Open-Meteo) | Sí (permiso) | Funcionalidad de la app |
| Fotos | Sí | Sí (proveedor de IA, para el análisis) | Sí | Funcionalidad de la app |
| Mensajes de la app / otro contenido generado por el usuario (chats con IA) | Sí | Sí (proveedor de IA) | Sí | Funcionalidad de la app |
| Nombre, teléfono (de productores que el usuario captura) | No: se guarda solo en el dispositivo | No | — | — |

Notas para el formulario:
- "Recopilado" en Play significa que el dato **sale del dispositivo**. Lo que solo vive en el
  teléfono (CRM, lotes, dictámenes) no se declara como recopilado.
- Los datos enviados al proveedor de IA (Anthropic) se procesan **efímeramente** para generar la
  respuesta. Marca "procesamiento efímero" si Play lo pregunta.
- No hay seguimiento publicitario ni venta de datos.

## 7. Clasificación de contenido (cuestionario IARC)

- Categoría: **Utilidad, productividad, comunicación u otra**.
- Violencia, sexo, lenguaje, drogas, apuestas: **No**.
- ¿Los usuarios pueden interactuar o intercambiar contenido entre sí? **No** (los chats son con IA).
- ¿Comparte la ubicación del usuario con otros usuarios? **No**.
- ¿Contenido generado por IA? **Sí**: respuestas de texto de asistentes de IA, con aviso en pantalla.
- Resultado esperado: **Apto para todos / PEGI 3**.

## 8. Público objetivo

- Edad objetivo: **18 años o más** (la app lo exige en la pantalla de aceptación).
- ¿Atrae a niños? **No**.

## 9. Otras declaraciones

- **Acceso a la app**: toda la funcionalidad está disponible sin iniciar sesión. Los revisores solo
  deben aceptar los términos en la primera pantalla.
- **Apps financieras / de salud / gubernamentales**: No aplica.
- **Permisos sensibles**: cámara, fotos y ubicación "mientras se usa la app". Ya están explicados en
  `app.json`.
- **IA generativa**: Google exige que las apps con IA generativa eviten contenido dañino y permitan
  reportarlo. Los prompts del servidor limitan a los asistentes a temas agrícolas y comerciales. Los
  usuarios pueden reportar respuestas por WhatsApp o al correo de contacto.
