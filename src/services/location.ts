import * as Location from 'expo-location';

export interface Coordenadas {
  lat: number;
  lon: number;
}

/** Pide permiso de ubicación (si hace falta) y devuelve la posición actual del dispositivo. */
export async function obtenerUbicacionActual(): Promise<Coordenadas> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permiso de ubicación denegado. Puedes capturar el clima manualmente.');
  }
  const posicion = await Location.getCurrentPositionAsync({});
  return { lat: posicion.coords.latitude, lon: posicion.coords.longitude };
}
