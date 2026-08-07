import type { CropProfile } from '../types/crop';
import type { Textura } from '../soil/availabilityCoefficient';

export type NivelDiagnostico = 'ok' | 'atencion' | 'riesgo';

export interface HallazgoDiagnostico {
  categoria: 'suelo' | 'sustrato' | 'agua' | 'riego';
  nivel: NivelDiagnostico;
  variable: string;
  valor: string;
  mensaje: string;
}

export interface DiagnosticoInicial {
  hallazgos: HallazgoDiagnostico[];
  /** El peor nivel entre todos los hallazgos: da el semáforo general del lote. */
  resumen: NivelDiagnostico;
}

export interface MedioSuelo {
  tipo: 'suelo';
  pH: number;
  ceDsM: number;
  textura: Textura;
  materiaOrganicaPct: number;
  cicMeq100g: number;
}

export interface MedioSustrato {
  tipo: 'sustrato' | 'hidroponia' | 'nft' | 'raizFlotante';
  pH?: number;
  ceDsM?: number;
}

export interface DatosAguaDiagnostico {
  pH: number;
  ceDsM: number;
  sar: number;
  durezaMgLCaCO3: number;
  alcalinidadMgLCaCO3: number;
}

export interface DatosRiegoDiagnostico {
  eficienciaPct: number;
}

export interface DiagnosticoInput {
  cultivo: CropProfile;
  medio: MedioSuelo | MedioSustrato;
  agua: DatosAguaDiagnostico;
  riego: DatosRiegoDiagnostico;
}

const PEOR_NIVEL: Record<NivelDiagnostico, number> = { ok: 0, atencion: 1, riesgo: 2 };

function peor(a: NivelDiagnostico, b: NivelDiagnostico): NivelDiagnostico {
  return PEOR_NIVEL[a] >= PEOR_NIVEL[b] ? a : b;
}

/**
 * Diagnóstico inicial del lote, basado en reglas (no en IA/visión): compara los datos
 * ya capturados (suelo/sustrato, agua, riego) contra los rangos de referencia del
 * cultivo y umbrales agronómicos estándar. Pensado como una revisión rápida al
 * terminar de configurar el lote, antes de operar día a día. Los umbrales están
 * documentados junto a cada regla y son valores de referencia ajustables, no
 * fórmulas del cultivo específico.
 */
export function calcularDiagnosticoInicial(input: DiagnosticoInput): DiagnosticoInicial {
  const hallazgos: HallazgoDiagnostico[] = [];

  if (input.medio.tipo === 'suelo') {
    hallazgos.push(
      ...diagnosticarSueloOSustrato('suelo', input.medio.pH, input.medio.ceDsM, input.cultivo),
    );
    hallazgos.push(diagnosticarMateriaOrganica(input.medio.materiaOrganicaPct));
    hallazgos.push(diagnosticarCIC(input.medio.cicMeq100g));
  } else {
    hallazgos.push(
      ...diagnosticarSueloOSustrato('sustrato', input.medio.pH, input.medio.ceDsM, input.cultivo),
    );
  }

  hallazgos.push(diagnosticarSAR(input.agua.sar));
  hallazgos.push(diagnosticarDureza(input.agua.durezaMgLCaCO3));
  hallazgos.push(diagnosticarAlcalinidad(input.agua.alcalinidadMgLCaCO3));
  hallazgos.push(diagnosticarSalinidadAguaParaCultivo(input.agua.ceDsM, input.cultivo));
  hallazgos.push(diagnosticarEficienciaRiego(input.riego.eficienciaPct));

  const resumen = hallazgos.reduce<NivelDiagnostico>((acc, h) => peor(acc, h.nivel), 'ok');
  return { hallazgos, resumen };
}

function diagnosticarSueloOSustrato(
  categoria: 'suelo' | 'sustrato',
  pH: number | undefined,
  ceDsM: number | undefined,
  cultivo: CropProfile,
): HallazgoDiagnostico[] {
  const hallazgos: HallazgoDiagnostico[] = [];
  const [phMin, phMax] = cultivo.rangoPHOptimo;
  const [ceMin, ceMax] = cultivo.rangoCEOptimo;

  if (pH !== undefined) {
    const desviacion = pH < phMin ? phMin - pH : pH > phMax ? pH - phMax : 0;
    const nivel: NivelDiagnostico =
      desviacion === 0 ? 'ok' : desviacion <= 0.5 ? 'atencion' : 'riesgo';
    hallazgos.push({
      categoria,
      nivel,
      variable: 'pH',
      valor: pH.toFixed(1),
      mensaje:
        nivel === 'ok'
          ? `pH (${pH.toFixed(1)}) dentro del rango óptimo para ${cultivo.nombre} (${phMin}-${phMax}).`
          : `pH (${pH.toFixed(1)}) fuera del rango óptimo para ${cultivo.nombre} (${phMin}-${phMax}); puede limitar la disponibilidad de nutrientes.`,
    });
  }

  if (ceDsM !== undefined) {
    const nivel: NivelDiagnostico =
      ceDsM > ceMax * 1.5 ? 'riesgo' : ceDsM > ceMax ? 'atencion' : 'ok';
    hallazgos.push({
      categoria,
      nivel,
      variable: 'CE',
      valor: `${ceDsM.toFixed(2)} dS/m`,
      mensaje:
        nivel === 'ok'
          ? `CE (${ceDsM.toFixed(2)} dS/m) dentro del rango óptimo para ${cultivo.nombre} (${ceMin}-${ceMax}).`
          : `CE (${ceDsM.toFixed(2)} dS/m) por encima del rango óptimo para ${cultivo.nombre} (${ceMin}-${ceMax}); riesgo de estrés salino.`,
    });
  }

  return hallazgos;
}

function diagnosticarMateriaOrganica(materiaOrganicaPct: number): HallazgoDiagnostico {
  const nivel: NivelDiagnostico =
    materiaOrganicaPct < 1 ? 'riesgo' : materiaOrganicaPct < 2.5 ? 'atencion' : 'ok';
  return {
    categoria: 'suelo',
    nivel,
    variable: 'Materia orgánica',
    valor: `${materiaOrganicaPct.toFixed(1)}%`,
    mensaje:
      nivel === 'ok'
        ? `Materia orgánica (${materiaOrganicaPct.toFixed(1)}%) adecuada.`
        : `Materia orgánica (${materiaOrganicaPct.toFixed(1)}%) baja; considerar un programa de mejoradores de suelo.`,
  };
}

function diagnosticarCIC(cicMeq100g: number): HallazgoDiagnostico {
  const nivel: NivelDiagnostico = cicMeq100g < 10 ? 'atencion' : 'ok';
  return {
    categoria: 'suelo',
    nivel,
    variable: 'CIC',
    valor: `${cicMeq100g.toFixed(1)} meq/100g`,
    mensaje:
      nivel === 'ok'
        ? `Capacidad de intercambio catiónico (${cicMeq100g.toFixed(1)} meq/100g) adecuada.`
        : `CIC baja (${cicMeq100g.toFixed(1)} meq/100g): el suelo retiene poco los cationes (Ca, Mg, K), mayor riesgo de lixiviación.`,
  };
}

function diagnosticarSAR(sar: number): HallazgoDiagnostico {
  const nivel: NivelDiagnostico = sar > 9 ? 'riesgo' : sar > 3 ? 'atencion' : 'ok';
  return {
    categoria: 'agua',
    nivel,
    variable: 'SAR',
    valor: sar.toFixed(1),
    mensaje:
      nivel === 'ok'
        ? `SAR del agua (${sar.toFixed(1)}) con bajo riesgo de sodicidad.`
        : `SAR del agua (${sar.toFixed(1)}) indica riesgo ${nivel === 'riesgo' ? 'alto' : 'medio'} de sodicidad; monitorear estructura del suelo.`,
  };
}

function diagnosticarDureza(durezaMgLCaCO3: number): HallazgoDiagnostico {
  const nivel: NivelDiagnostico = durezaMgLCaCO3 > 180 ? 'atencion' : 'ok';
  return {
    categoria: 'agua',
    nivel,
    variable: 'Dureza',
    valor: `${durezaMgLCaCO3.toFixed(0)} mg/L CaCO₃`,
    mensaje:
      nivel === 'ok'
        ? `Dureza del agua (${durezaMgLCaCO3.toFixed(0)} mg/L CaCO₃) manejable.`
        : `Agua dura (${durezaMgLCaCO3.toFixed(0)} mg/L CaCO₃): riesgo de incrustaciones en goteros y de precipitación con fosfatos/sulfatos concentrados.`,
  };
}

function diagnosticarAlcalinidad(alcalinidadMgLCaCO3: number): HallazgoDiagnostico {
  const nivel: NivelDiagnostico =
    alcalinidadMgLCaCO3 > 200 ? 'riesgo' : alcalinidadMgLCaCO3 > 100 ? 'atencion' : 'ok';
  return {
    categoria: 'agua',
    nivel,
    variable: 'Alcalinidad',
    valor: `${alcalinidadMgLCaCO3.toFixed(0)} mg/L CaCO₃`,
    mensaje:
      nivel === 'ok'
        ? `Alcalinidad del agua (${alcalinidadMgLCaCO3.toFixed(0)} mg/L CaCO₃) baja; poca corrección de pH necesaria.`
        : `Alcalinidad del agua (${alcalinidadMgLCaCO3.toFixed(0)} mg/L CaCO₃) ${nivel === 'riesgo' ? 'alta' : 'moderada'}: probablemente se necesite acidificar (Tambo C) para evitar taponamiento y mantener el pH objetivo.`,
  };
}

function diagnosticarSalinidadAguaParaCultivo(
  ceDsM: number,
  cultivo: CropProfile,
): HallazgoDiagnostico {
  const umbral =
    cultivo.sensibilidadSalinidad === 'alta'
      ? 1.0
      : cultivo.sensibilidadSalinidad === 'media'
        ? 1.5
        : 2.5;
  const nivel: NivelDiagnostico =
    ceDsM > umbral * 1.3 ? 'riesgo' : ceDsM > umbral ? 'atencion' : 'ok';
  return {
    categoria: 'agua',
    nivel,
    variable: 'CE del agua vs. sensibilidad del cultivo',
    valor: `${ceDsM.toFixed(2)} dS/m`,
    mensaje:
      nivel === 'ok'
        ? `CE del agua (${ceDsM.toFixed(2)} dS/m) segura para ${cultivo.nombre} (sensibilidad ${cultivo.sensibilidadSalinidad}).`
        : `CE del agua (${ceDsM.toFixed(2)} dS/m) alta para ${cultivo.nombre}, que tiene sensibilidad ${cultivo.sensibilidadSalinidad} a la salinidad; vigilar acumulación de sales.`,
  };
}

function diagnosticarEficienciaRiego(eficienciaPct: number): HallazgoDiagnostico {
  const nivel: NivelDiagnostico =
    eficienciaPct < 0.7 ? 'riesgo' : eficienciaPct < 0.85 ? 'atencion' : 'ok';
  return {
    categoria: 'riego',
    nivel,
    variable: 'Eficiencia del sistema',
    valor: `${(eficienciaPct * 100).toFixed(0)}%`,
    mensaje:
      nivel === 'ok'
        ? `Eficiencia del sistema de riego (${(eficienciaPct * 100).toFixed(0)}%) buena.`
        : `Eficiencia del sistema de riego (${(eficienciaPct * 100).toFixed(0)}%) baja: revisar goteros, presión y uniformidad antes de calcular volúmenes.`,
  };
}
