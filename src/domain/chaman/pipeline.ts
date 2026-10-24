/** Etapas del embudo comercial del CRM Chamán (N1 a N4 del prototipo, más cerrado/perdido). */

export type EtapaPipeline = 'N1' | 'N2' | 'N3' | 'N4' | 'perdido';

export interface InfoEtapa {
  etapa: EtapaPipeline;
  nombre: string;
  descripcion: string;
  color: string;
}

export const ETAPAS_PIPELINE: readonly InfoEtapa[] = [
  {
    etapa: 'N1',
    nombre: 'Prospecto',
    descripcion: 'Diagnóstico generado, sin seguimiento aún.',
    color: '#38bdf8',
  },
  {
    etapa: 'N2',
    nombre: 'Prueba en campo',
    descripcion: 'Muestra o parcela demostrativa en curso.',
    color: '#a78bfa',
  },
  {
    etapa: 'N3',
    nombre: 'Cotización',
    descripcion: 'Cotización enviada, en negociación.',
    color: '#f59e0b',
  },
  {
    etapa: 'N4',
    nombre: 'Cliente',
    descripcion: 'Compra cerrada y programa activo.',
    color: '#10b981',
  },
  {
    etapa: 'perdido',
    nombre: 'Perdido',
    descripcion: 'El productor decidió no continuar.',
    color: '#64748b',
  },
];

export function infoEtapa(etapa: EtapaPipeline): InfoEtapa {
  return ETAPAS_PIPELINE.find((e) => e.etapa === etapa) ?? ETAPAS_PIPELINE[0];
}

export function esEtapaPipeline(valor: string): valor is EtapaPipeline {
  return ETAPAS_PIPELINE.some((e) => e.etapa === valor);
}
