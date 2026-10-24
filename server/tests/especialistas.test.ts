import {
  IDS_ESPECIALISTAS,
  esIdEspecialista,
  systemPromptEspecialista,
} from '../lib/especialistas';
import { validarSolicitudChatEspecialista, MAX_LARGO_CONTEXTO } from '../lib/validation';

describe('especialistas', () => {
  it.each(IDS_ESPECIALISTAS)('el prompt de %s incluye catálogo y reglas de honestidad', (id) => {
    const prompt = systemPromptEspecialista(id);
    expect(prompt).toContain('Chamán Ozono Biofungicida');
    expect(prompt).toContain('Nunca prometas resultados garantizados');
    expect(prompt).toContain('+52 33 2096 7184');
  });

  it('reconoce solo ids conocidos', () => {
    expect(esIdEspecialista('capi1')).toBe(true);
    expect(esIdEspecialista('dr-o3')).toBe(false);
    expect(esIdEspecialista(42)).toBe(false);
  });

  it('Capi 1 no da datos bancarios por su cuenta', () => {
    expect(systemPromptEspecialista('capi1')).toContain('Nunca des números de cuenta');
  });
});

describe('validarSolicitudChatEspecialista', () => {
  const valido = {
    especialistaId: 'athena-phytopath',
    mensajes: [{ rol: 'user', contenido: '¿Qué hago con Fusarium?' }],
  };

  it('acepta una solicitud válida, con o sin contexto', () => {
    expect(validarSolicitudChatEspecialista(valido).ok).toBe(true);
    expect(validarSolicitudChatEspecialista({ ...valido, contexto: 'Dictamen' }).ok).toBe(true);
  });

  it('rechaza especialistas desconocidos', () => {
    const r = validarSolicitudChatEspecialista({ ...valido, especialistaId: 'otro' });
    expect(r).toEqual({ ok: false, error: 'Especialista desconocido' });
  });

  it('rechaza conversaciones que empiezan con el asistente', () => {
    const r = validarSolicitudChatEspecialista({
      ...valido,
      mensajes: [{ rol: 'assistant', contenido: 'Hola' }],
    });
    expect(r.ok).toBe(false);
  });

  it('rechaza contexto demasiado largo o de tipo incorrecto', () => {
    expect(
      validarSolicitudChatEspecialista({ ...valido, contexto: 'x'.repeat(MAX_LARGO_CONTEXTO + 1) })
        .ok,
    ).toBe(false);
    expect(validarSolicitudChatEspecialista({ ...valido, contexto: 5 }).ok).toBe(false);
  });

  it('rechaza cuerpos vacíos o sin mensajes', () => {
    expect(validarSolicitudChatEspecialista(null).ok).toBe(false);
    expect(validarSolicitudChatEspecialista({ especialistaId: 'capi1', mensajes: [] }).ok).toBe(
      false,
    );
  });
});
