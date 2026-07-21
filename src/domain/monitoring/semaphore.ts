export type NivelSemaforo = 'verde' | 'amarillo' | 'rojo';

export interface ResultadoSemaforo {
  nivel: NivelSemaforo;
  desviacionPct: number;
  /** % de ajuste sugerido para el próximo programa (signo indica dirección). null si no aplica (verde) o está bloqueado (rojo). */
  ajusteSugeridoPct: number | null;
  requiereValidacionTecnico: boolean;
  posiblesCausas: string[];
}

/**
 * Reglas de semáforo del spec:
 * - Verde (<10% de desviación): mantener el programa.
 * - Amarillo (10-20%): sugerir ajuste gradual, tope de 5-10% por evento.
 * - Rojo (>20%): bloquear ajuste automático, listar posibles causas y pedir
 *   validación del técnico. Una baja concentración en savia no siempre significa
 *   que deben añadirse más fertilizantes.
 */
const POSIBLES_CAUSAS: string[] = [
  'Falta de agua',
  'Exceso de agua',
  'Falta de oxígeno en la zona radicular',
  'Raíces enfermas',
  'Alta salinidad',
  'Baja transpiración',
  'Antagonismos entre nutrientes',
  'Mala uniformidad de riego',
];

export function evaluarSemaforo(desviacionPct: number): ResultadoSemaforo {
  const magnitudAbsoluta = Math.abs(desviacionPct);

  if (magnitudAbsoluta < 10) {
    return {
      nivel: 'verde',
      desviacionPct,
      ajusteSugeridoPct: 0,
      requiereValidacionTecnico: false,
      posiblesCausas: [],
    };
  }

  if (magnitudAbsoluta <= 20) {
    // Si se aplicó/midió de más (desviación positiva), el ajuste reduce el programa; si fue de menos, lo incrementa.
    const direccion = desviacionPct > 0 ? -1 : 1;
    const magnitudAjuste = Math.min(10, Math.max(5, magnitudAbsoluta / 2));
    return {
      nivel: 'amarillo',
      desviacionPct,
      ajusteSugeridoPct: direccion * magnitudAjuste,
      requiereValidacionTecnico: false,
      posiblesCausas: POSIBLES_CAUSAS,
    };
  }

  return {
    nivel: 'rojo',
    desviacionPct,
    ajusteSugeridoPct: null,
    requiereValidacionTecnico: true,
    posiblesCausas: POSIBLES_CAUSAS,
  };
}
