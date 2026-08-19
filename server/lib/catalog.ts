import catalogoRaw from './catalog.json';

/** Un producto real de Chamán Agro Soluciones, tal como lo vende el agente de WhatsApp. */
export interface ProductoCatalogo {
  id: string;
  nombre: string;
  categoria: string;
  presentacion: string;
  /** Precio de venta en pesos mexicanos. 0 mientras no se haya cargado el precio real. */
  precioMXN: number;
  /** false = precio placeholder sin confirmar; el bot nunca debe cotizarlo como definitivo. */
  precioConfirmado: boolean;
  descripcionBreve: string;
  cultivosRecomendados: string[];
  disponible: boolean;
}

interface CatalogoArchivo {
  productos: ProductoCatalogo[];
}

const catalogo = catalogoRaw as CatalogoArchivo;

export function obtenerCatalogoCompleto(): ProductoCatalogo[] {
  return catalogo.productos;
}

export function obtenerProductoPorId(id: string): ProductoCatalogo | undefined {
  return catalogo.productos.find((producto) => producto.id === id);
}

/**
 * Búsqueda simple por texto libre (nombre, categoría, cultivo o descripción) para que la
 * herramienta buscar_catalogo del agente encuentre productos sin depender de IDs exactos.
 */
export function buscarEnCatalogo(consulta: string, categoria?: string): ProductoCatalogo[] {
  const termino = consulta.trim().toLowerCase();
  return catalogo.productos.filter((producto) => {
    if (!producto.disponible) return false;
    if (categoria && producto.categoria !== categoria.toLowerCase()) return false;
    if (!termino) return true;
    const haystack = [
      producto.nombre,
      producto.categoria,
      producto.descripcionBreve,
      ...producto.cultivosRecomendados,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(termino);
  });
}
