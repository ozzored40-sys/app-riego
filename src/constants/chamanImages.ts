import type { ImageSource } from 'expo-image';
import type { ImagenProducto } from '@/domain/chaman/productos';

/** Fotos reales de la línea Chamán Ozono (optimizadas desde el prototipo de AI Studio). */
export const IMAGENES_PRODUCTO: Record<ImagenProducto, ImageSource> = {
  biofungicida: require('@/assets/images/chaman/biofungicida.jpg'),
  bioestimulante: require('@/assets/images/chaman/bioestimulante.jpg'),
  bioinsecticida: require('@/assets/images/chaman/bioinsecticida.jpg'),
  lineaCompleta: require('@/assets/images/chaman/linea-completa.jpg'),
};

export const IMAGEN_HERO: ImageSource = require('@/assets/images/chaman/hero.jpg');
