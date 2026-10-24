import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tieneAutorizacionValida } from '../lib/auth';
import { guardarReporteIa, validarReporteIa } from '../lib/reportesIa';

/**
 * POST /api/reportar-ia — el usuario reporta una respuesta de IA ofensiva, incorrecta o
 * peligrosa desde la app (ver lib/reportesIa.ts).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  if (!tieneAutorizacionValida(req)) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const validacion = validarReporteIa(req.body);
  if (!validacion.ok) {
    res.status(400).json({ error: validacion.error });
    return;
  }

  try {
    await guardarReporteIa(validacion.datos);
    res.status(200).json({ respuesta: 'Gracias. Recibimos tu reporte y lo revisaremos.' });
  } catch (error) {
    console.error('Error guardando reporte de IA:', error);
    res.status(500).json({ error: 'No se pudo registrar el reporte. Intenta de nuevo.' });
  }
}
