import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface FotoCapturada {
  base64: string;
  mediaType: 'image/jpeg';
}

/**
 * Redimensiona a un ancho máximo razonable para el diagnóstico y comprime a JPEG
 * antes de codificar en base64, para no exceder el límite de tamaño del backend
 * (ver MAX_BASE64_BYTES en server/lib/validation.ts) ni gastar de más en la subida
 * con datos móviles del productor.
 */
const ANCHO_MAXIMO_PX = 1280;
const CALIDAD_COMPRESION = 0.7;

async function comprimirYCodificar(uri: string): Promise<FotoCapturada> {
  const contexto = ImageManipulator.manipulate(uri).resize({ width: ANCHO_MAXIMO_PX });
  const imagenProcesada = await contexto.renderAsync();
  const resultado = await imagenProcesada.saveAsync({
    format: SaveFormat.JPEG,
    compress: CALIDAD_COMPRESION,
    base64: true,
  });
  if (!resultado.base64) throw new Error('No se pudo procesar la imagen');
  return { base64: resultado.base64, mediaType: 'image/jpeg' };
}

/** Devuelve null si el usuario canceló la captura. */
export async function tomarFotoConCamara(): Promise<FotoCapturada | null> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) throw new Error('Permiso de cámara denegado');

  const resultado = await ImagePicker.launchCameraAsync({ quality: 0.8, mediaTypes: ['images'] });
  if (resultado.canceled || !resultado.assets?.[0]) return null;
  return comprimirYCodificar(resultado.assets[0].uri);
}

/** Devuelve null si el usuario canceló la selección. */
export async function elegirFotoDeGaleria(): Promise<FotoCapturada | null> {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) throw new Error('Permiso de galería denegado');

  const resultado = await ImagePicker.launchImageLibraryAsync({
    quality: 0.8,
    mediaTypes: ['images'],
  });
  if (resultado.canceled || !resultado.assets?.[0]) return null;
  return comprimirYCodificar(resultado.assets[0].uri);
}
