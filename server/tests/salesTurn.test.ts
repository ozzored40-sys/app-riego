import { responderTurnoVentas, construirSystemPromptWhatsapp } from '../lib/salesTurn';
import * as store from '../lib/salesConversationStore';
import * as leadSync from '../lib/leadSync';

const crearMensajeMock = jest.fn();

jest.mock('../lib/anthropic', () => ({
  obtenerClienteAnthropic: () => ({ messages: { create: crearMensajeMock } }),
  MODELO_AGRONOMO: 'modelo-test',
  MAX_TOKENS_RESPUESTA: 100,
}));
jest.mock('../lib/salesConversationStore');
jest.mock('../lib/leadSync', () => ({
  ...jest.requireActual('../lib/leadSync'),
  sincronizarLeadEnSheets: jest.fn(),
  enviarAlertaLead: jest.fn(),
}));

const storeMock = jest.mocked(store);
const leadSyncMock = jest.mocked(leadSync);

function respuestaModelo(texto: string) {
  return { content: [{ type: 'text', text: texto }] };
}

describe('responderTurnoVentas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeMock.obtenerHistorialWhatsapp.mockResolvedValue([]);
    storeMock.obtenerNivelLead.mockResolvedValue(null);
  });

  it('devuelve el texto sin <lead_data>, guarda el turno completo y sincroniza + alerta un N3 nuevo', async () => {
    const textoModelo =
      'Perfecto, te paso con un asesor.\n<lead_data>{"nombre": null, "nivel": "N3"}</lead_data>';
    crearMensajeMock.mockResolvedValue(respuestaModelo(textoModelo));

    const resultado = await responderTurnoVentas({
      idConversacion: '521',
      telefono: '521',
      canal: 'whatsapp',
      texto: 'Necesito 2 toneladas este mes',
      nombrePerfil: 'Juan',
    });

    expect(resultado.textoVisible).toBe('Perfecto, te paso con un asesor.');
    expect(resultado.lead?.nivel).toBe('N3');
    expect(storeMock.agregarTurnoWhatsapp).toHaveBeenCalledWith('521', [
      { rol: 'user', contenido: 'Necesito 2 toneladas este mes' },
      { rol: 'assistant', contenido: textoModelo },
    ]);
    expect(leadSyncMock.sincronizarLeadEnSheets).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Juan', telefono: '521', nivel: 'N3' }),
    );
    expect(leadSyncMock.enviarAlertaLead).toHaveBeenCalledTimes(1);
    expect(storeMock.guardarNivelLead).toHaveBeenCalledWith('521', 'N3');
  });

  it('no vuelve a alertar si el lead ya era N3', async () => {
    storeMock.obtenerNivelLead.mockResolvedValue('N3');
    crearMensajeMock.mockResolvedValue(
      respuestaModelo('Ok <lead_data>{"nivel": "N3"}</lead_data>'),
    );

    await responderTurnoVentas({
      idConversacion: '521',
      telefono: '521',
      canal: 'whatsapp',
      texto: 'hola',
    });

    expect(leadSyncMock.enviarAlertaLead).not.toHaveBeenCalled();
    expect(storeMock.guardarNivelLead).not.toHaveBeenCalled();
  });

  it('si Sheets falla, la respuesta llega igual y el nivel se guarda', async () => {
    leadSyncMock.sincronizarLeadEnSheets.mockRejectedValue(new Error('Sheets caído'));
    crearMensajeMock.mockResolvedValue(
      respuestaModelo('Hola <lead_data>{"nivel": "N1"}</lead_data>'),
    );
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const resultado = await responderTurnoVentas({
      idConversacion: '521',
      telefono: '521',
      canal: 'whatsapp',
      texto: 'hola',
    });

    expect(resultado.textoVisible).toBe('Hola');
    expect(storeMock.guardarNivelLead).toHaveBeenCalledWith('521', 'N1');
  });

  it('usa un mensaje de respaldo si el modelo solo mandó el bloque', async () => {
    crearMensajeMock.mockResolvedValue(respuestaModelo('<lead_data>{"nivel": "N1"}</lead_data>'));
    const resultado = await responderTurnoVentas({
      idConversacion: '521',
      telefono: '521',
      canal: 'whatsapp',
      texto: 'hola',
    });
    expect(resultado.textoVisible).toContain('asesor de Chamán');
  });
});

describe('construirSystemPromptWhatsapp', () => {
  const ORIGINAL_ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('incluye las instrucciones de lead, el nombre de perfil y el enlace de agenda', () => {
    process.env.LINK_AGENDA_CITAS = 'https://cal.com/chaman';
    const prompt = construirSystemPromptWhatsapp('Juan');
    expect(prompt).toContain('<lead_data>');
    expect(prompt).toContain('Nombre del perfil de WhatsApp: Juan');
    expect(prompt).toContain('https://cal.com/chaman');
  });
});
