/**
 * Calculadora técnica Chamán: dimensionamiento del generador de ozono para un cabezal de
 * riego y retorno de inversión frente al programa químico convencional.
 */

export interface ModeloGenerador {
  nombre: string;
  capacidadGH: number;
  uso: string;
  descripcion: string;
  costoReferenciaMxn: number;
}

/** Ordenados de menor a mayor capacidad. Costos de referencia del prototipo, sujetos a cotización. */
export const MODELOS_GENERADOR: readonly ModeloGenerador[] = [
  {
    nombre: 'Chamán O3-Lab 15',
    capacidadGH: 15,
    uso: 'Muestras y viveros',
    descripcion: 'Generador compacto para invernaderos pequeños, laboratorio y pruebas piloto.',
    costoReferenciaMxn: 45000,
  },
  {
    nombre: 'Chamán O3-Field 50',
    capacidadGH: 50,
    uso: 'Campo abierto y huertos',
    descripcion: 'Para 5 a 20 hectáreas con inyector Venturi de alta eficiencia.',
    costoReferenciaMxn: 82000,
  },
  {
    nombre: 'Chamán O3-Master 100',
    capacidadGH: 100,
    uso: 'Alta escala',
    descripcion: 'Para pozos de 30 a 50 L/s con inyección dual y sensor ORP continuo.',
    costoReferenciaMxn: 135000,
  },
  {
    nombre: 'Chamán O3-Industrial 250',
    capacidadGH: 250,
    uso: 'Macro huertos y tequileras',
    descripcion: 'Generador industrial con concentrador de oxígeno PSA para grandes caudales.',
    costoReferenciaMxn: 240000,
  },
];

export interface DatosGenerador {
  caudalM3H: number;
  ppmObjetivo: number;
  /** Eficiencia de transferencia del inyector, en % (típico 70-90% con Venturi). */
  eficienciaPct: number;
  horasRiegoDia: number;
}

export interface Dimensionamiento {
  gramosPorHora: number;
  gramosPorDia: number;
  caudalLS: number;
  /** null si la demanda supera al modelo más grande (requiere ingeniería a la medida). */
  modelo: ModeloGenerador | null;
}

/** g O₃/h = caudal (m³/h) × concentración (g/m³ = ppm) ÷ eficiencia de transferencia. */
export function dimensionarGenerador(datos: DatosGenerador): Dimensionamiento {
  if (!(datos.eficienciaPct > 0 && datos.eficienciaPct <= 100)) {
    throw new Error('La eficiencia de transferencia debe estar entre 1 y 100%');
  }
  const gramosPorHora = Math.ceil(
    (datos.caudalM3H * datos.ppmObjetivo) / (datos.eficienciaPct / 100),
  );
  return {
    gramosPorHora,
    gramosPorDia: Math.round(gramosPorHora * datos.horasRiegoDia),
    caudalLS: Math.round((datos.caudalM3H / 3.6) * 10) / 10,
    modelo: MODELOS_GENERADOR.find((m) => m.capacidadGH >= gramosPorHora) ?? null,
  };
}

export interface DatosRoi {
  superficieHa: number;
  gastoQuimicoHaAnualMxn: number;
  /** % del gasto químico anual que se espera sustituir/ahorrar con el programa Chamán. */
  ahorroEsperadoPct: number;
  inversionEquipoMxn: number;
}

export interface ResultadoRoi {
  gastoQuimicoAnualMxn: number;
  ahorroAnualMxn: number;
  /** Meses para recuperar la inversión; null si no hay ahorro. */
  mesesRecuperacion: number | null;
}

export function calcularRoi(datos: DatosRoi): ResultadoRoi {
  const gastoQuimicoAnualMxn = Math.round(datos.gastoQuimicoHaAnualMxn * datos.superficieHa);
  const ahorroAnualMxn = Math.round((gastoQuimicoAnualMxn * datos.ahorroEsperadoPct) / 100);
  const mesesRecuperacion =
    ahorroAnualMxn > 0
      ? Math.round((datos.inversionEquipoMxn / (ahorroAnualMxn / 12)) * 10) / 10
      : null;
  return { gastoQuimicoAnualMxn, ahorroAnualMxn, mesesRecuperacion };
}
