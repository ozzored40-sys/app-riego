/**
 * Cliente para Open-Meteo (https://open-meteo.com), gratuito y sin API key.
 * Se usa solo para prellenar ETo y lluvia del día en la pantalla de Recomendación
 * diaria; la captura manual siempre sigue disponible y editable, así que una falla
 * de red aquí nunca bloquea el cálculo (ver hoy.tsx).
 */

export interface ClimaDiario {
  etoMmDia: number;
  lluviaEfectivaMmDia: number;
}

/**
 * Fracción de la lluvia total registrada que se considera "efectiva" (aprovechable
 * por la planta, descontando escorrentía y percolación profunda). 0.8 es una
 * aproximación simple y conservadora de uso común quando no se tiene una curva de
 * lluvia efectiva específica del suelo; ajustable a futuro.
 */
export const COEFICIENTE_LLUVIA_EFECTIVA = 0.8;

interface RespuestaOpenMeteo {
  daily?: {
    et0_fao_evapotranspiration?: number[];
    precipitation_sum?: number[];
  };
}

export function construirUrlOpenMeteo(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'et0_fao_evapotranspiration,precipitation_sum',
    timezone: 'auto',
    forecast_days: '1',
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

/** Extrae ETo y lluvia efectiva del día de la respuesta cruda de Open-Meteo. */
export function parsearRespuestaOpenMeteo(respuesta: RespuestaOpenMeteo): ClimaDiario {
  const eto = respuesta.daily?.et0_fao_evapotranspiration?.[0];
  const lluviaTotal = respuesta.daily?.precipitation_sum?.[0];

  if (typeof eto !== 'number') {
    throw new Error('Open-Meteo no devolvió evapotranspiración de referencia para hoy');
  }

  return {
    etoMmDia: eto,
    lluviaEfectivaMmDia:
      (typeof lluviaTotal === 'number' ? lluviaTotal : 0) * COEFICIENTE_LLUVIA_EFECTIVA,
  };
}

export async function obtenerClimaDeHoy(
  lat: number,
  lon: number,
  fetchImpl: typeof fetch = fetch,
): Promise<ClimaDiario> {
  const respuesta = await fetchImpl(construirUrlOpenMeteo(lat, lon));
  if (!respuesta.ok) {
    throw new Error(`Open-Meteo respondió ${respuesta.status}`);
  }
  const datos = (await respuesta.json()) as RespuestaOpenMeteo;
  return parsearRespuestaOpenMeteo(datos);
}
