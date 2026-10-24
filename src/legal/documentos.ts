/**
 * Documentos legales de Chamán 4.0: Términos y Condiciones, Aviso de Privacidad Integral y
 * Aviso de Uso Responsable. Es la única fuente de estos textos: la app los muestra (pantalla
 * de aceptación y sección Legal) y `npm run legal:generar` los publica como HTML en
 * server/public para tener las URL públicas que exigen Google Play y App Store.
 *
 * Este archivo no importa nada a propósito, para que el script de generación pueda leerlo
 * directamente con Node.
 *
 * IMPORTANTE: son plantillas redactadas para la operación real de la app, pero NO sustituyen
 * la revisión de un abogado. Los datos entre corchetes de DATOS_RESPONSABLE deben llenarse
 * antes de publicar.
 */

/** Cambia esta fecha cada vez que modifiques un documento: la app pedirá aceptarlos de nuevo. */
export const VERSION_LEGAL = '2026-10-24';

export const DATOS_RESPONSABLE = {
  razonSocial: 'Chamán Agrosoluciones, S.A. de C.V.',
  nombreComercial: 'Chamán Agro Soluciones',
  domicilio: '[DOMICILIO FISCAL COMPLETO: calle, número, colonia, C.P., municipio, estado]',
  rfc: '[RFC DE LA EMPRESA]',
  correoPrivacidad: 'Ozzored4.0@gmail.com',
  whatsapp: '+52 33 2096 7184',
  sitioWeb: 'https://ozonochaman.com/',
  ciudadJurisdiccion: 'Guadalajara, Jalisco',
  nombreApp: 'Chamán 4.0',
} as const;

export type IdDocumentoLegal = 'terminos' | 'privacidad' | 'uso-responsable';

export interface SeccionLegal {
  titulo: string;
  parrafos: string[];
}

export interface DocumentoLegal {
  id: IdDocumentoLegal;
  titulo: string;
  resumen: string;
  secciones: SeccionLegal[];
}

const D = DATOS_RESPONSABLE;

const TERMINOS: DocumentoLegal = {
  id: 'terminos',
  titulo: 'Términos y Condiciones de Uso',
  resumen:
    'Reglas para usar la app Chamán 4.0: es una herramienta de apoyo e información, no sustituye la asesoría de un profesional en campo, y cada usuario decide y responde por lo que aplica en su cultivo.',
  secciones: [
    {
      titulo: '1. Partes y aceptación',
      parrafos: [
        `Estos Términos y Condiciones (los "Términos") regulan el uso de la aplicación móvil y los servicios digitales "${D.nombreApp}" (la "App"), puestos a disposición por ${D.razonSocial} (${D.nombreComercial}), con domicilio en ${D.domicilio} y RFC ${D.rfc} ("Chamán", "nosotros").`,
        'Al marcar la casilla de aceptación, descargar, instalar o usar la App, usted (el "Usuario") declara haber leído, entendido y aceptado estos Términos, el Aviso de Privacidad y el Aviso de Uso Responsable, que forman parte integral de estos Términos. Si no está de acuerdo, no debe usar la App.',
        'La App solo puede ser usada por personas mayores de 18 años con capacidad legal para obligarse. Si usa la App en nombre de una empresa, rancho o cooperativa, declara tener facultades para obligarla.',
      ],
    },
    {
      titulo: '2. Qué es la App y qué no es',
      parrafos: [
        'La App es una herramienta digital de apoyo para productores, técnicos y distribuidores que incluye: cálculos de riego y nutrición, generación de dictámenes y prescripciones de referencia para productos de la marca Chamán, consulta con asistentes de inteligencia artificial ("Especialistas IA"), un registro de prospectos y clientes (CRM), calculadoras técnicas y financieras, plantillas de anuncios y enlaces de contacto y pago.',
        'La información, dictámenes, dosis, cálculos y respuestas que entrega la App son ORIENTATIVOS y de carácter informativo y educativo. NO constituyen asesoría agronómica, fitosanitaria, legal, financiera ni de ningún otro tipo profesional, ni sustituyen la inspección en campo, el análisis de laboratorio o la recomendación firmada de un ingeniero agrónomo con cédula profesional.',
        'La App no es un servicio de emergencias ni de atención a intoxicaciones. Ante una exposición, intoxicación o accidente, acuda de inmediato a los servicios médicos y de emergencia.',
      ],
    },
    {
      titulo: '3. Especialistas IA y contenido generado automáticamente',
      parrafos: [
        'Los "Especialistas IA" (incluidos Dra. Athena, Dr. Chiron, Dra. Artemis, Ing. Mayahuel, Dr. Hermes, Capi 1, el agrónomo virtual y el agente de ventas) son programas de inteligencia artificial, no personas. Sus nombres y personajes son recursos de presentación. Sus respuestas se generan automáticamente mediante modelos de lenguaje de un proveedor tercero y pueden contener errores, omisiones, información desactualizada o inaplicable a su caso.',
        'El Usuario se obliga a verificar toda respuesta generada por IA antes de tomar decisiones, en particular dosis, mezclas, horarios de aplicación, diagnósticos de plagas o enfermedades y cálculos económicos. Chamán no garantiza la exactitud, integridad ni idoneidad de dichas respuestas.',
        'El Usuario no debe ingresar en los chats datos personales sensibles, contraseñas, datos bancarios ni información de terceros que no esté autorizado a compartir.',
      ],
    },
    {
      titulo: '4. Uso de productos, dosis y equipos',
      parrafos: [
        'Toda aplicación de productos debe realizarse conforme a la etiqueta y hoja de seguridad vigentes del producto, a la normatividad aplicable (incluidas, en su caso, las disposiciones de COFEPRIS, SENASICA, SEMARNAT y la NOM correspondiente) y a las buenas prácticas agrícolas. En caso de discrepancia entre la App y la etiqueta, prevalece la etiqueta.',
        'Es responsabilidad exclusiva del Usuario: (a) verificar que el producto sea apto y esté permitido para su cultivo, región y mercado de destino, incluidos los límites máximos de residuos del país importador; (b) realizar pruebas de compatibilidad y fitotoxicidad en una superficie pequeña antes de aplicar en todo el lote; (c) calibrar sus equipos; (d) usar el equipo de protección personal indicado, y (e) respetar intervalos de seguridad y de reentrada.',
        'El ozono (O₃) en estado gaseoso es un oxidante que puede ser nocivo para la salud a ciertas concentraciones. La instalación, operación y mantenimiento de generadores e inyectores de ozono deben realizarse por personal capacitado, con ventilación adecuada, destructores de ozono residual y siguiendo el manual del fabricante. La calculadora de la App solo estima capacidades de referencia y no sustituye un proyecto de ingeniería.',
      ],
    },
    {
      titulo: '5. Resultados, precios y estimaciones',
      parrafos: [
        'Chamán no garantiza resultados específicos de rendimiento, calidad, sanidad, control de plagas o enfermedades, ahorro económico ni retorno de inversión. Los resultados en campo dependen de factores fuera de nuestro control, como clima, suelo, agua, manejo, presión de plagas, momento de aplicación y calidad de la aplicación.',
        'Los costos, ahorros, retornos de inversión y precios que muestra la App son estimaciones de referencia calculadas con supuestos generales o capturados por el Usuario. No constituyen una oferta, cotización ni precio de venta. Toda compra se rige por la cotización formal, la factura y las condiciones comerciales que Chamán o su distribuidor autorizado emitan por escrito.',
      ],
    },
    {
      titulo: '6. Compras y pagos',
      parrafos: [
        'La App no procesa pagos ni almacena datos de tarjetas. Los pagos se realizan a través de plataformas de terceros (por ejemplo, Mercado Pago) o por transferencia, mediante enlaces o datos enviados únicamente por los canales oficiales de Chamán indicados en la App. Dichas plataformas se rigen por sus propios términos y avisos de privacidad.',
        'Chamán no será responsable por pagos realizados a cuentas, enlaces o personas distintas de los canales oficiales. Antes de pagar, confirme los datos con Chamán por el WhatsApp oficial.',
        'La entrega, garantía, devoluciones y facturación de productos y equipos se rigen por las condiciones comerciales de cada venta y por la legislación de protección al consumidor aplicable.',
      ],
    },
    {
      titulo: '7. Información que usted captura y datos de terceros',
      parrafos: [
        'La información de lotes, dictámenes, prospectos (CRM), notas y conversaciones se guarda principalmente en el dispositivo del Usuario. El Usuario es responsable de la exactitud de lo que captura, de respaldar su dispositivo y del resguardo de su teléfono. Al desinstalar la App o usar la opción "Borrar todos mis datos", esa información se elimina y Chamán no puede recuperarla.',
        'Si el Usuario registra datos de terceros (por ejemplo, nombre, teléfono o ubicación de productores) o les envía dictámenes por WhatsApp, actúa como responsable de esos datos frente a sus titulares y declara contar con su consentimiento o con otra base legal para tratarlos y contactarlos, conforme a la legislación de protección de datos personales aplicable.',
      ],
    },
    {
      titulo: '8. Herramientas de marketing',
      parrafos: [
        'Las plantillas y textos publicitarios que ofrece o genera la App son sugerencias. Antes de publicarlos, el Usuario es responsable de revisarlos y de que cumplan con las políticas de la plataforma donde se publiquen (por ejemplo, Meta) y con la normatividad de publicidad y de insumos de uso agrícola aplicable, sin hacer afirmaciones que no pueda respaldar.',
      ],
    },
    {
      titulo: '9. Servicios de terceros',
      parrafos: [
        'La App se apoya en servicios de terceros, entre otros: el proveedor de inteligencia artificial (Anthropic), el alojamiento del servidor (Vercel), el servicio meteorológico (Open-Meteo), WhatsApp (Meta), Mercado Pago y las tiendas de aplicaciones (Google Play y App Store). Chamán no controla ni es responsable de la disponibilidad, contenido, seguridad o políticas de dichos servicios, cuyo uso se rige por sus propios términos.',
      ],
    },
    {
      titulo: '10. Disponibilidad y cambios',
      parrafos: [
        'La App se proporciona "tal cual" y "según disponibilidad". Chamán podrá modificar, suspender o descontinuar total o parcialmente la App o cualquiera de sus funciones (incluidos los Especialistas IA) en cualquier momento, y no garantiza que funcione sin interrupciones, errores o virus, ni que sea compatible con todos los dispositivos.',
      ],
    },
    {
      titulo: '11. Limitación de responsabilidad',
      parrafos: [
        'En la máxima medida permitida por la legislación aplicable, Chamán, sus accionistas, directivos, empleados, distribuidores y proveedores no serán responsables por daños directos, indirectos, incidentales, consecuenciales o lucro cesante, incluidos de manera enunciativa pérdida de cosechas, de plantas, de producción, de ventas, rechazos de exportación, daños a equipos o instalaciones, o pérdida de información, derivados de: (a) el uso o la imposibilidad de usar la App; (b) decisiones tomadas con base en información, cálculos, dictámenes o respuestas de IA de la App; (c) la aplicación de productos o la operación de equipos sin seguir su etiqueta, manual o la normatividad; (d) errores en la información capturada por el Usuario, o (e) fallas de servicios de terceros.',
        'Nada en estos Términos limita la responsabilidad que por ley no pueda limitarse, incluida la derivada de dolo o mala fe, ni los derechos irrenunciables que la Ley Federal de Protección al Consumidor otorgue al Usuario cuando tenga el carácter de consumidor. Las garantías de los productos físicos se rigen por sus pólizas y por dicha ley.',
      ],
    },
    {
      titulo: '12. Obligaciones del Usuario e indemnización',
      parrafos: [
        'El Usuario se obliga a usar la App de forma lícita; a no intentar vulnerar su seguridad, copiarla, descompilarla, revenderla o usarla para enviar spam; a no suplantar a Chamán ni a sus distribuidores, y a no presentar los dictámenes de la App como recomendaciones firmadas por un profesional.',
        'El Usuario sacará en paz y a salvo e indemnizará a Chamán frente a reclamaciones de terceros (incluidos productores a quienes el Usuario haya enviado dictámenes o mensajes) derivadas del incumplimiento de estos Términos o del uso indebido de la App.',
      ],
    },
    {
      titulo: '13. Propiedad intelectual',
      parrafos: [
        'La marca Chamán, sus logotipos, imágenes de producto, textos, diseño y software de la App son propiedad de Chamán o de sus licenciantes. Se concede al Usuario una licencia personal, limitada, revocable, no exclusiva e intransferible para usar la App conforme a estos Términos. Los dictámenes que el Usuario genere pueden ser compartidos con sus clientes y productores para fines de su operación agrícola.',
      ],
    },
    {
      titulo: '14. Modificaciones a los Términos',
      parrafos: [
        'Chamán podrá modificar estos Términos. La versión vigente estará disponible en la App y en el sitio web. Cuando haya cambios, la App solicitará nuevamente su aceptación; continuar usándola implica la aceptación de la versión modificada.',
      ],
    },
    {
      titulo: '15. Ley aplicable y jurisdicción',
      parrafos: [
        `Estos Términos se rigen por las leyes federales de los Estados Unidos Mexicanos. Para su interpretación y cumplimiento, las partes se someten a los tribunales competentes de ${D.ciudadJurisdiccion}, renunciando a cualquier otro fuero que pudiera corresponderles, sin perjuicio de los derechos del Usuario consumidor de acudir ante la Procuraduría Federal del Consumidor (PROFECO).`,
        'Si alguna disposición se declara inválida, las demás conservarán su validez.',
      ],
    },
    {
      titulo: '16. Contacto',
      parrafos: [
        `Dudas sobre estos Términos: ${D.correoPrivacidad} · WhatsApp ${D.whatsapp} · ${D.sitioWeb}`,
      ],
    },
  ],
};

const PRIVACIDAD: DocumentoLegal = {
  id: 'privacidad',
  titulo: 'Aviso de Privacidad Integral',
  resumen:
    'Qué datos usa la app, para qué, con quién se comparten y cómo ejercer sus derechos ARCO. La mayor parte de su información se guarda solo en su teléfono.',
  secciones: [
    {
      titulo: '1. Identidad y domicilio del responsable',
      parrafos: [
        `${D.razonSocial} (${D.nombreComercial}), con domicilio en ${D.domicilio}, es responsable del tratamiento de los datos personales que se recaban a través de la aplicación "${D.nombreApp}", en términos de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares vigente y su normatividad aplicable.`,
      ],
    },
    {
      titulo: '2. Dónde se guarda su información',
      parrafos: [
        'La App funciona principalmente de forma local: lotes, análisis, dictámenes, prospectos del CRM, notas e historiales de conversación se guardan en una base de datos dentro de su propio dispositivo. Chamán no tiene acceso a esa información salvo en los casos descritos en la sección 4, cuando usted usa funciones que requieren enviarla a un servidor.',
      ],
    },
    {
      titulo: '3. Datos personales que se tratan',
      parrafos: [
        'a) Datos que usted captura en la App: nombre, teléfono y ubicación (municipio o estado) de usted o de productores; datos de cultivos, superficie, análisis de suelo y agua; notas de seguimiento; datos opcionales de facturación (RFC, razón social, código postal) que usted decida incluir en una solicitud de pago.',
        'b) Contenido de conversaciones con los Especialistas IA, el agrónomo virtual y el agente de ventas, y fotografías de cultivos que usted decida enviar.',
        'c) Ubicación geográfica del dispositivo, solo si usted concede el permiso, para obtener datos de clima del lote.',
        'd) Si usted escribe al WhatsApp oficial de Chamán atendido por el agente de ventas automático: su número de teléfono y el contenido de los mensajes.',
        'La App no solicita datos personales sensibles (como salud, origen étnico, creencias o datos biométricos), ni datos de tarjetas bancarias. Le pedimos no incluirlos en los chats ni en las notas.',
      ],
    },
    {
      titulo: '4. Finalidades',
      parrafos: [
        'Finalidades primarias (necesarias para el servicio): (i) calcular recomendaciones de riego, nutrición y prescripciones de referencia; (ii) generar y compartir dictámenes; (iii) responder sus consultas mediante los Especialistas IA y el agrónomo virtual, incluido el análisis de las fotos que envíe; (iv) obtener datos meteorológicos de su lote; (v) atender cotizaciones, pedidos, pagos y facturación que usted solicite por WhatsApp, y (vi) dar soporte técnico.',
        'Finalidades secundarias (no necesarias): enviarle información comercial y promociones de productos Chamán cuando usted nos contacte. Puede negarse a estas finalidades en cualquier momento escribiendo al correo de privacidad, sin que ello afecte el servicio.',
        'Chamán no vende datos personales.',
      ],
    },
    {
      titulo: '5. Transferencias y encargados',
      parrafos: [
        'Para operar ciertas funciones, la información estrictamente necesaria se comunica a proveedores que actúan como encargados o como terceros independientes, algunos ubicados fuera de México (principalmente Estados Unidos):',
        '• Anthropic, PBC (inteligencia artificial): recibe los mensajes, el contexto del lote o dictamen y las fotos que usted envía a los Especialistas IA o al agrónomo virtual, únicamente para generar la respuesta.',
        '• Vercel Inc. (alojamiento del servidor): procesa esas solicitudes en tránsito. El servidor de la App no guarda las conversaciones de la App.',
        '• Upstash (base de datos del canal de WhatsApp): guarda el historial de conversación del WhatsApp oficial por número de teléfono hasta por 7 días de inactividad.',
        '• Meta Platforms (WhatsApp): cuando usted abre un enlace de WhatsApp o escribe a nuestro número oficial.',
        '• Open-Meteo: recibe las coordenadas aproximadas del lote para devolver datos de clima; no recibe su nombre ni teléfono.',
        '• Mercado Pago u otras plataformas de pago: cuando usted decide pagar mediante sus enlaces.',
        'Estas comunicaciones son necesarias para prestar el servicio que usted solicita, por lo que no requieren su consentimiento adicional conforme a la ley aplicable. Cada proveedor se rige además por su propio aviso de privacidad.',
      ],
    },
    {
      titulo: '6. Conservación y eliminación',
      parrafos: [
        'La información guardada en su dispositivo permanece ahí hasta que usted la borre, use la opción "Más → Legal y privacidad → Borrar todos mis datos" o desinstale la App. El historial del WhatsApp oficial se elimina automáticamente tras 7 días sin actividad. Los proveedores de IA pueden conservar temporalmente las solicitudes conforme a sus políticas de seguridad y retención.',
      ],
    },
    {
      titulo: '7. Derechos ARCO, revocación y limitación',
      parrafos: [
        `Usted tiene derecho a Acceder, Rectificar y Cancelar sus datos personales, así como a Oponerse a su tratamiento (derechos ARCO), a revocar su consentimiento y a limitar el uso o divulgación de sus datos. Para ejercerlos envíe una solicitud a ${D.correoPrivacidad} indicando: nombre y medio para responderle; documento que acredite su identidad (o la de su representante); descripción clara de los datos y del derecho que desea ejercer, y cualquier elemento que facilite su localización.`,
        'Responderemos en un plazo máximo de 20 días hábiles y, si procede, haremos efectiva la solicitud dentro de los 15 días hábiles siguientes. Tome en cuenta que los datos guardados solo en su dispositivo puede borrarlos usted directamente desde la App.',
        'Si considera que su derecho ha sido vulnerado, puede acudir ante la autoridad garante en materia de protección de datos personales competente conforme a la legislación vigente.',
      ],
    },
    {
      titulo: '8. Seguridad',
      parrafos: [
        'Las comunicaciones entre la App y el servidor se realizan cifradas (HTTPS). Le recomendamos proteger su dispositivo con bloqueo de pantalla. Ningún sistema es completamente infalible; en caso de una vulneración de seguridad que afecte de forma significativa sus derechos, se lo informaremos conforme a la ley.',
      ],
    },
    {
      titulo: '9. Menores de edad',
      parrafos: [
        'La App está dirigida a mayores de 18 años. No recabamos intencionalmente datos de menores.',
      ],
    },
    {
      titulo: '10. Cambios a este aviso',
      parrafos: [
        `Cualquier cambio se publicará en la App y en el sitio web; la App le pedirá aceptar la nueva versión. Versión vigente: ${VERSION_LEGAL}.`,
      ],
    },
  ],
};

const USO_RESPONSABLE: DocumentoLegal = {
  id: 'uso-responsable',
  titulo: 'Aviso de Uso Responsable',
  resumen: 'Lo esencial que debe saber antes de aplicar cualquier recomendación de la App.',
  secciones: [
    {
      titulo: 'Antes de aplicar',
      parrafos: [
        '• Las recomendaciones, dosis, dictámenes y respuestas de la App y de los Especialistas IA son ORIENTATIVAS. No sustituyen la visita y recomendación firmada de un ingeniero agrónomo.',
        '• Las respuestas de los Especialistas IA son generadas automáticamente y pueden contener errores. Verifíquelas siempre.',
        '• Siga siempre la etiqueta y la hoja de seguridad del producto. Si algo no coincide, manda la etiqueta.',
        '• Haga una prueba en una superficie pequeña antes de aplicar en todo el lote.',
        '• Use equipo de protección personal y respete intervalos de seguridad y reentrada.',
        '• Los generadores de ozono deben instalarlos y operarlos personas capacitadas, con ventilación y destructor de ozono residual.',
        '• Los costos, ahorros y retornos son estimaciones, no cotizaciones. Los precios finales son los de la cotización formal.',
        '• Verifique que el producto esté permitido para su cultivo y para el mercado de destino de su cosecha.',
        '• Pague solo mediante enlaces o datos enviados por el WhatsApp oficial de Chamán.',
        '• En caso de intoxicación o accidente, acuda de inmediato a servicios médicos de emergencia.',
      ],
    },
  ],
};

export const DOCUMENTOS_LEGALES: Record<IdDocumentoLegal, DocumentoLegal> = {
  terminos: TERMINOS,
  privacidad: PRIVACIDAD,
  'uso-responsable': USO_RESPONSABLE,
};

/** Leyenda corta que acompaña a dictámenes y respuestas de IA. */
export const LEYENDA_ORIENTATIVA =
  'Recomendación orientativa generada por software, no sustituye la recomendación de un ingeniero agrónomo en campo. Siga siempre la etiqueta del producto. Montos de referencia, sujetos a cotización formal.';

export const LEYENDA_IA =
  'Respuestas generadas por inteligencia artificial: pueden contener errores. Verifíquelas y siga la etiqueta del producto.';

/** Datos del responsable que aún tienen marcadores [ ] sin llenar (para el checklist de publicación). */
export function datosPendientes(): string[] {
  return Object.entries(DATOS_RESPONSABLE)
    .filter(([, valor]) => valor.includes('['))
    .map(([clave]) => clave);
}
