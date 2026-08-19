import { validarSolicitudChatVentas } from '../lib/validation';

describe('validarSolicitudChatVentas', () => {
  const contextoValido = {
    catalogo: [{ nombre: 'Nitrato de calcio', categoriaInsumo: 'fertilizante', costoPorKg: 12.5 }],
  };

  it('acepta una solicitud bien formada', () => {
    const resultado = validarSolicitudChatVentas({
      mensajes: [{ rol: 'user', contenido: 'Busco algo para fortalecer raíz' }],
      contexto: contextoValido,
    });
    expect(resultado.ok).toBe(true);
  });

  it('acepta un catálogo vacío', () => {
    const resultado = validarSolicitudChatVentas({
      mensajes: [{ rol: 'user', contenido: 'Hola' }],
      contexto: { catalogo: [] },
    });
    expect(resultado.ok).toBe(true);
  });

  it('rechaza un cuerpo que no es un objeto', () => {
    expect(validarSolicitudChatVentas(null).ok).toBe(false);
    expect(validarSolicitudChatVentas('texto').ok).toBe(false);
  });

  it('rechaza si no hay mensajes', () => {
    const resultado = validarSolicitudChatVentas({ mensajes: [], contexto: contextoValido });
    expect(resultado.ok).toBe(false);
  });

  it('rechaza más de 30 mensajes', () => {
    const mensajes = Array.from({ length: 31 }, () => ({ rol: 'user', contenido: 'hola' }));
    const resultado = validarSolicitudChatVentas({ mensajes, contexto: contextoValido });
    expect(resultado.ok).toBe(false);
  });

  it('rechaza un rol inválido', () => {
    const resultado = validarSolicitudChatVentas({
      mensajes: [{ rol: 'system', contenido: 'hola' }],
      contexto: contextoValido,
    });
    expect(resultado.ok).toBe(false);
  });

  it('rechaza si falta el catálogo en el contexto', () => {
    const resultado = validarSolicitudChatVentas({
      mensajes: [{ rol: 'user', contenido: 'hola' }],
      contexto: {},
    });
    expect(resultado.ok).toBe(false);
  });

  it('rechaza un producto del catálogo sin nombre o costo', () => {
    const resultado = validarSolicitudChatVentas({
      mensajes: [{ rol: 'user', contenido: 'hola' }],
      contexto: { catalogo: [{ categoriaInsumo: 'fertilizante' }] },
    });
    expect(resultado.ok).toBe(false);
  });
});
