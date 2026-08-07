import { validarSolicitudChat, validarSolicitudDiagnosticoFoto } from '../lib/validation';

describe('validarSolicitudChat', () => {
  const contextoValido = { cultivo: 'jitomate' };

  it('acepta una solicitud bien formada', () => {
    const resultado = validarSolicitudChat({
      mensajes: [{ rol: 'user', contenido: 'Mis hojas están amarillas' }],
      contexto: contextoValido,
    });
    expect(resultado.ok).toBe(true);
  });

  it('rechaza un cuerpo que no es un objeto', () => {
    expect(validarSolicitudChat(null).ok).toBe(false);
    expect(validarSolicitudChat('texto').ok).toBe(false);
  });

  it('rechaza si no hay mensajes', () => {
    const resultado = validarSolicitudChat({ mensajes: [], contexto: contextoValido });
    expect(resultado.ok).toBe(false);
  });

  it('rechaza más de 30 mensajes', () => {
    const mensajes = Array.from({ length: 31 }, () => ({ rol: 'user', contenido: 'hola' }));
    const resultado = validarSolicitudChat({ mensajes, contexto: contextoValido });
    expect(resultado.ok).toBe(false);
  });

  it('rechaza un rol inválido', () => {
    const resultado = validarSolicitudChat({
      mensajes: [{ rol: 'system', contenido: 'hola' }],
      contexto: contextoValido,
    });
    expect(resultado.ok).toBe(false);
  });

  it('rechaza un mensaje demasiado largo', () => {
    const resultado = validarSolicitudChat({
      mensajes: [{ rol: 'user', contenido: 'a'.repeat(5000) }],
      contexto: contextoValido,
    });
    expect(resultado.ok).toBe(false);
  });

  it('rechaza si falta el contexto del lote', () => {
    const resultado = validarSolicitudChat({
      mensajes: [{ rol: 'user', contenido: 'hola' }],
    });
    expect(resultado.ok).toBe(false);
  });
});

describe('validarSolicitudDiagnosticoFoto', () => {
  const contextoValido = { cultivo: 'chile' };

  it('acepta una solicitud bien formada', () => {
    const resultado = validarSolicitudDiagnosticoFoto({
      imagenBase64: 'ZmFrZS1pbWFnZQ==',
      mediaType: 'image/jpeg',
      contexto: contextoValido,
    });
    expect(resultado.ok).toBe(true);
  });

  it('rechaza si falta la imagen', () => {
    const resultado = validarSolicitudDiagnosticoFoto({
      mediaType: 'image/jpeg',
      contexto: contextoValido,
    });
    expect(resultado.ok).toBe(false);
  });

  it('rechaza una imagen demasiado grande', () => {
    const resultado = validarSolicitudDiagnosticoFoto({
      imagenBase64: 'a'.repeat(7_000_000),
      mediaType: 'image/jpeg',
      contexto: contextoValido,
    });
    expect(resultado.ok).toBe(false);
  });

  it('rechaza un tipo de imagen no soportado', () => {
    const resultado = validarSolicitudDiagnosticoFoto({
      imagenBase64: 'ZmFrZS1pbWFnZQ==',
      mediaType: 'image/gif',
      contexto: contextoValido,
    });
    expect(resultado.ok).toBe(false);
  });

  it('rechaza si falta el contexto del lote', () => {
    const resultado = validarSolicitudDiagnosticoFoto({
      imagenBase64: 'ZmFrZS1pbWFnZQ==',
      mediaType: 'image/jpeg',
    });
    expect(resultado.ok).toBe(false);
  });
});
