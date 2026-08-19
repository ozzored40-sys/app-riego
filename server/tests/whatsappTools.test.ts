import { ejecutarHerramientaWhatsApp } from '../lib/whatsappTools';
import { notificarPedidoConfirmado } from '../lib/notify';

jest.mock('../lib/notify', () => ({
  notificarPedidoConfirmado: jest.fn().mockResolvedValue(undefined),
}));

const CONTEXTO = { telefonoCliente: '5219991234567' };

describe('ejecutarHerramientaWhatsApp: buscar_catalogo', () => {
  it('regresa productos con precioMXN null cuando no está confirmado', async () => {
    const resultado = JSON.parse(
      await ejecutarHerramientaWhatsApp('buscar_catalogo', { consulta: 'calcio' }, CONTEXTO),
    );
    expect(resultado[0].precioMXN).toBeNull();
    expect(resultado[0].precioPendienteConfirmar).toBe(true);
  });

  it('regresa mensaje de sin resultados si no hay match', async () => {
    const resultado = await ejecutarHerramientaWhatsApp(
      'buscar_catalogo',
      { consulta: 'algo-que-no-existe-nunca' },
      CONTEXTO,
    );
    expect(resultado).toMatch(/sin resultados/i);
  });
});

describe('ejecutarHerramientaWhatsApp: generar_cotizacion', () => {
  it('marca como sinPrecio los productos sin precio confirmado (catálogo placeholder)', async () => {
    const resultado = JSON.parse(
      await ejecutarHerramientaWhatsApp(
        'generar_cotizacion',
        { items: [{ productoId: 'corrector-calcio-foliar', cantidad: 2 }] },
        CONTEXTO,
      ),
    );
    expect(resultado.items).toEqual([]);
    expect(resultado.totalMXN).toBe(0);
    expect(resultado.sinPrecio).toContain('Corrector de calcio foliar');
  });

  it('reporta productoId inexistente en noEncontrados', async () => {
    const resultado = JSON.parse(
      await ejecutarHerramientaWhatsApp(
        'generar_cotizacion',
        { items: [{ productoId: 'no-existe', cantidad: 1 }] },
        CONTEXTO,
      ),
    );
    expect(resultado.noEncontrados).toEqual(['no-existe']);
  });
});

describe('ejecutarHerramientaWhatsApp: confirmar_pedido', () => {
  it('no cierra el pedido si ningún producto tiene precio confirmado', async () => {
    const resultado = JSON.parse(
      await ejecutarHerramientaWhatsApp(
        'confirmar_pedido',
        { items: [{ productoId: 'corrector-calcio-foliar', cantidad: 1 }] },
        CONTEXTO,
      ),
    );
    expect(resultado.ok).toBe(false);
    expect(notificarPedidoConfirmado).not.toHaveBeenCalled();
  });
});

describe('ejecutarHerramientaWhatsApp: herramienta desconocida', () => {
  it('regresa un mensaje de error legible', async () => {
    const resultado = await ejecutarHerramientaWhatsApp('herramienta_inventada', {}, CONTEXTO);
    expect(resultado).toMatch(/desconocida/i);
  });
});
