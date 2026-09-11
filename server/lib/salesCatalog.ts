import type { ProductoCatalogoVentas } from './types';

/**
 * Catálogo estático que usa el agente de ventas por WhatsApp. A diferencia de
 * /api/sales-chat (que recibe el catálogo real del inventario local de cada
 * productor desde la app), el webhook de WhatsApp no tiene una app/SQLite detrás:
 * le habla a prospectos que todavía no tienen la app. Se usan los mismos valores
 * de referencia que src/domain/fertilizers/library.ts en la app — costoPorKg es un
 * valor de referencia/placeholder que debe ajustarse a precios reales vigentes,
 * no un precio de lista oficial.
 */
export const CATALOGO_VENTAS_WHATSAPP: ProductoCatalogoVentas[] = [
  {
    nombre: 'Nitrato de calcio',
    categoriaInsumo: 'fertilizante',
    presentacionComercial: 'Ca(NO3)2, sólido',
    costoPorKg: 12,
    unidadPrecio: 'kg',
  },
  {
    nombre: 'Nitrato de potasio',
    categoriaInsumo: 'fertilizante',
    presentacionComercial: 'KNO3, sólido',
    costoPorKg: 22,
    unidadPrecio: 'kg',
  },
  {
    nombre: 'Fosfato monopotásico (MKP)',
    categoriaInsumo: 'fertilizante',
    presentacionComercial: 'KH2PO4, sólido',
    costoPorKg: 35,
    unidadPrecio: 'kg',
  },
  {
    nombre: 'Quelato de hierro (Fe-EDDHA)',
    categoriaInsumo: 'fertilizante',
    presentacionComercial: 'sólido',
    costoPorKg: 90,
    unidadPrecio: 'kg',
  },
  {
    nombre: 'Ácidos húmicos y fúlvicos',
    categoriaInsumo: 'bioestimulante',
    presentacionComercial: 'líquido',
    costoPorKg: 40,
    unidadPrecio: 'L',
  },
  {
    nombre: 'Producto Chamán (bioestimulante)',
    categoriaInsumo: 'bioestimulante',
    presentacionComercial: 'líquido',
    costoPorKg: 50,
    unidadPrecio: 'L',
  },
];
