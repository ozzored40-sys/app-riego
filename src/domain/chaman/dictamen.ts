import { CONTACTO_CHAMAN, formatoMxn } from './contacto';
import { ETIQUETA_METODO } from './productos';
import { LEYENDA_ORIENTATIVA } from '../../legal/documentos';
import type { Prescripcion, Severidad } from './prescripcion';

export interface EncabezadoDictamen {
  folio: string;
  fecha: Date;
  productor: string;
  ubicacion?: string;
  cultivo: string;
  superficieHa: number;
  problema: string;
  severidad: Severidad;
  observaciones?: string;
}

/**
 * Texto plano del dictamen para compartir por WhatsApp, correo o la hoja de compartir del
 * sistema. Marca los montos como estimados de referencia para no presentarlos como
 * cotización formal.
 */
export function textoDictamen(encabezado: EncabezadoDictamen, prescripcion: Prescripcion): string {
  const { producto } = prescripcion;
  const fecha = encabezado.fecha.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const lineas = [
    `🌱 *DICTAMEN CHAMÁN 4.0 — ${encabezado.folio}*`,
    `Fecha: ${fecha}`,
    '',
    `👤 Productor: ${encabezado.productor}`,
    encabezado.ubicacion ? `📍 Ubicación: ${encabezado.ubicacion}` : null,
    `🌿 Cultivo: ${encabezado.cultivo} (${encabezado.superficieHa} ha)`,
    `🔎 Problema: ${encabezado.problema} — severidad ${encabezado.severidad}`,
    '',
    `💊 *Producto:* ${producto.nombre}`,
    `Fórmula: ${producto.formula}`,
    `Método: ${ETIQUETA_METODO[prescripcion.metodo]}`,
    `Dosis: ${prescripcion.dosisLHa} L/ha (${producto.dilucion})`,
    `Ozono disuelto: ${prescripcion.ppmOzono} ppm`,
    `Agua portadora: ${prescripcion.aguaPortadoraLHa.toLocaleString('es-MX')} L/ha`,
    `Aplicaciones: ${prescripcion.aplicaciones} — ${producto.frecuencia}`,
    `Producto total para el lote: ${prescripcion.productoTotalLitros} L`,
    `Intervalo de seguridad: ${producto.intervaloSeguridad}`,
    '',
    `💰 Inversión estimada: ${formatoMxn(prescripcion.costoEstimadoMxn)}`,
    prescripcion.ahorroEstimadoMxn > 0
      ? `📉 Ahorro estimado vs. programa convencional: ${formatoMxn(prescripcion.ahorroEstimadoMxn)}`
      : null,

    ...(prescripcion.notasTecnicas.length > 0
      ? ['', '📝 Notas técnicas:', ...prescripcion.notasTecnicas.map((n) => `• ${n}`)]
      : []),
    encabezado.observaciones ? `\nObservaciones de campo: ${encabezado.observaciones}` : null,
    '',
    `⚠️ ${LEYENDA_ORIENTATIVA}`,
    '',
    `${CONTACTO_CHAMAN.empresa} · ${CONTACTO_CHAMAN.sitioWeb} · WhatsApp ${CONTACTO_CHAMAN.whatsappLegible}`,
  ];
  return lineas.filter((l): l is string => l !== null).join('\n');
}
