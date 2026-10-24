import type { AppDatabase } from '../data/db/types';
import {
  contarFoliosDelAnio,
  crearLead,
  listarLeads,
  type Lead,
} from '../data/repositories/leadRepository';
import {
  calcularPrescripcion,
  generarFolio,
  obtenerCultivoChaman,
  textoDictamen,
  ETAPAS_PIPELINE,
  type DatosPrescripcion,
  type EtapaPipeline,
} from '../domain/chaman';

export interface DatosDiagnosticoCampo extends DatosPrescripcion {
  productor: string;
  telefono?: string;
  ubicacion?: string;
  observaciones?: string;
}

/**
 * Calcula la prescripción, asigna folio consecutivo, arma el texto del dictamen y lo
 * registra como prospecto N1 en el CRM, todo en un paso (como hacía el prototipo web al
 * pulsar "Generar dictamen").
 */
export function registrarDiagnosticoCampo(
  db: AppDatabase,
  datos: DatosDiagnosticoCampo,
  fecha: Date = new Date(),
): Lead {
  const productor = datos.productor.trim();
  if (!productor) throw new Error('Escribe el nombre del productor');

  const prescripcion = calcularPrescripcion(datos);
  const cultivo = obtenerCultivoChaman(datos.cultivo);
  const folio = generarFolio(fecha, contarFoliosDelAnio(db, fecha.getFullYear()) + 1);
  const observaciones = datos.observaciones?.trim() || undefined;

  const dictamenTexto = textoDictamen(
    {
      folio,
      fecha,
      productor,
      ubicacion: datos.ubicacion?.trim() || undefined,
      cultivo: cultivo.nombre,
      superficieHa: datos.superficieHa,
      problema: prescripcion.producto.problema,
      severidad: datos.severidad,
      observaciones,
    },
    prescripcion,
  );

  return crearLead(db, {
    folio,
    productor,
    telefono: datos.telefono?.trim() || null,
    ubicacion: datos.ubicacion?.trim() || null,
    cultivoClave: cultivo.clave,
    cultivoNombre: cultivo.nombre,
    superficieHa: datos.superficieHa,
    productoClave: prescripcion.producto.clave,
    productoNombre: prescripcion.producto.nombre,
    problema: prescripcion.producto.problema,
    severidad: datos.severidad,
    metodo: prescripcion.metodo,
    ppmOzono: prescripcion.ppmOzono,
    dosisLHa: prescripcion.dosisLHa,
    aplicaciones: prescripcion.aplicaciones,
    productoTotalLitros: prescripcion.productoTotalLitros,
    aguaPortadoraLHa: prescripcion.aguaPortadoraLHa,
    costoEstimadoMxn: prescripcion.costoEstimadoMxn,
    ahorroEstimadoMxn: prescripcion.ahorroEstimadoMxn,
    notas: observaciones ?? null,
    dictamenTexto,
  });
}

export interface ResumenCrm {
  totalLeads: number;
  hectareas: number;
  porEtapa: Record<EtapaPipeline, number>;
  /** Suma de inversión estimada de leads abiertos (N1–N3). */
  pipelineAbiertoMxn: number;
  /** Suma de inversión estimada de clientes (N4). */
  ventaCerradaMxn: number;
  tasaConversionPct: number;
}

export function resumenCrm(leads: Lead[]): ResumenCrm {
  const porEtapa = Object.fromEntries(ETAPAS_PIPELINE.map((e) => [e.etapa, 0])) as Record<
    EtapaPipeline,
    number
  >;
  let hectareas = 0;
  let pipelineAbiertoMxn = 0;
  let ventaCerradaMxn = 0;
  for (const lead of leads) {
    const etapa = lead.etapa as EtapaPipeline;
    if (etapa in porEtapa) porEtapa[etapa] += 1;
    hectareas += lead.superficieHa;
    if (etapa === 'N4') ventaCerradaMxn += lead.costoEstimadoMxn;
    else if (etapa !== 'perdido') pipelineAbiertoMxn += lead.costoEstimadoMxn;
  }
  const decididos = porEtapa.N4 + porEtapa.perdido;
  return {
    totalLeads: leads.length,
    hectareas: Math.round(hectareas * 10) / 10,
    porEtapa,
    pipelineAbiertoMxn,
    ventaCerradaMxn,
    tasaConversionPct: decididos > 0 ? Math.round((porEtapa.N4 / decididos) * 100) : 0,
  };
}

export function obtenerResumenCrm(db: AppDatabase): ResumenCrm {
  return resumenCrm(listarLeads(db));
}
