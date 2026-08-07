import type { FertilizerProduct } from '../types/fertilizer';

export type TankId = 'A' | 'B' | 'C';
export type TankCMode = 'acido' | 'biostimulante';

/**
 * Tabla de reglas de compatibilidad de tambos, como dato editable (no lógica dura),
 * siguiendo la práctica convencional de fertirriego descrita en el spec:
 * - Tambo A: calcio y nitratos compatibles.
 * - Tambo B: fósforo, potasio, magnesio y sulfatos.
 * - Tambo C: ácido/corrección de pH O bioestimulantes/complementos (dos modos,
 *   nunca se asume que ambos son compatibles entre sí).
 * El spec no da la tabla completa; esta es la interpretación por defecto y debe
 * corregirse en este único archivo si Chamán define reglas propias.
 */
export function tanqueAsignadoPorDefecto(producto: FertilizerProduct): TankId {
  if (producto.categoriaTanque === 'flexible' || producto.categoriaTanque === undefined) {
    // Productos flexibles (ej. urea, bajo índice salino) o sin tambo asignado explícito
    // (no debería ocurrir para productos que sí participan en el solver, ver mixSolver.ts)
    // se asignan por defecto al Tambo B, que reúne los productos de ajuste fino de N/K/P/S.
    return 'B';
  }
  return producto.categoriaTanque;
}

export function esProductoAcido(producto: FertilizerProduct): boolean {
  return ['acido-fosforico', 'acido-nitrico', 'acido-sulfurico'].includes(producto.id);
}

export function esProductoBioestimulante(producto: FertilizerProduct): boolean {
  return (
    producto.id === 'acidos-humicos-fulvicos' || producto.id === 'producto-chaman-bioestimulante'
  );
}

export interface ConflictoCompatibilidad {
  tanque: TankId;
  productoA: string;
  productoB: string;
  motivo: string;
}

/**
 * Verifica que, dentro de un mismo tambo, no coexistan productos que precipitan
 * en concentrado: calcio junto con fosfatos o sulfatos concentrados. También
 * verifica que el Tambo C no mezcle productos ácidos con bioestimulantes cuando
 * el modo configurado no lo permite.
 */
export function verificarCompatibilidadTanque(
  tanque: TankId,
  productos: FertilizerProduct[],
  modoTanqueC?: TankCMode,
): ConflictoCompatibilidad[] {
  const conflictos: ConflictoCompatibilidad[] = [];

  for (let i = 0; i < productos.length; i++) {
    for (let j = i + 1; j < productos.length; j++) {
      const a = productos[i];
      const b = productos[j];
      const aTieneCalcio = (a.composicionPct.Ca ?? 0) > 0;
      const bTieneCalcio = (b.composicionPct.Ca ?? 0) > 0;
      const aTienePOS = (a.composicionPct.P ?? 0) > 0 || (a.composicionPct.S ?? 0) > 0;
      const bTienePOS = (b.composicionPct.P ?? 0) > 0 || (b.composicionPct.S ?? 0) > 0;

      if ((aTieneCalcio && bTienePOS) || (bTieneCalcio && aTienePOS)) {
        conflictos.push({
          tanque,
          productoA: a.id,
          productoB: b.id,
          motivo:
            'Calcio concentrado no debe mezclarse con fosfatos ni sulfatos concentrados (riesgo de precipitación).',
        });
      }
    }
  }

  if (tanque === 'C' && modoTanqueC) {
    for (const producto of productos) {
      if (modoTanqueC === 'acido' && esProductoBioestimulante(producto)) {
        conflictos.push({
          tanque,
          productoA: producto.id,
          productoB: '(modo ácido)',
          motivo:
            'El Tambo C está configurado en modo ácido/corrección de pH: no se asume compatible con bioestimulantes.',
        });
      }
      if (modoTanqueC === 'biostimulante' && esProductoAcido(producto)) {
        conflictos.push({
          tanque,
          productoA: producto.id,
          productoB: '(modo bioestimulante)',
          motivo:
            'El Tambo C está configurado en modo bioestimulante: no se asume compatible con ácidos concentrados.',
        });
      }
    }
  }

  return conflictos;
}
