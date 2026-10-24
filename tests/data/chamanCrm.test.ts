import { crearBaseDeDatosDePrueba } from './testDb';
import type { AppDatabase } from '../../src/data/db/types';
import {
  actualizarEtapaLead,
  borrarLead,
  listarLeads,
  obtenerLead,
} from '../../src/data/repositories/leadRepository';
import { registrarDiagnosticoCampo, obtenerResumenCrm } from '../../src/state/crmService';
import {
  enviarTurnoEspecialista,
  generarProtocoloIa,
  obtenerHistorialEspecialista,
  reiniciarConversacionEspecialista,
  MAX_MENSAJES_HISTORIAL,
} from '../../src/state/specialistService';
import { crearSpecialistMessage } from '../../src/data/repositories/specialistMessageRepository';
import * as specialistClient from '../../src/services/specialistClient';

jest.mock('../../src/services/specialistClient');

const enviarMock = specialistClient.enviarMensajeEspecialista as jest.MockedFunction<
  typeof specialistClient.enviarMensajeEspecialista
>;

const DIAGNOSTICO_BASE = {
  productor: 'Ing. Roberto Anaya',
  telefono: '33 2096 7184',
  ubicacion: 'Jocotepec, Jalisco',
  cultivo: 'berries' as const,
  producto: 'biofungicida' as const,
  superficieHa: 12,
  severidad: 'Crítico' as const,
};

describe('CRM Chamán', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = crearBaseDeDatosDePrueba();
    enviarMock.mockReset();
  });

  it('registra el diagnóstico como lead N1 con folios consecutivos por año', () => {
    const fecha = new Date(2026, 9, 24);
    const primero = registrarDiagnosticoCampo(db, DIAGNOSTICO_BASE, fecha);
    const segundo = registrarDiagnosticoCampo(
      db,
      { ...DIAGNOSTICO_BASE, productor: 'Don Salvador' },
      fecha,
    );
    const otroAnio = registrarDiagnosticoCampo(db, DIAGNOSTICO_BASE, new Date(2027, 0, 2));

    expect(primero.folio).toBe('DOC-CHAM-2026-0001');
    expect(segundo.folio).toBe('DOC-CHAM-2026-0002');
    expect(otroAnio.folio).toBe('DOC-CHAM-2027-0001');
    expect(primero.etapa).toBe('N1');
    expect(primero.aplicaciones).toBe(3);
    expect(primero.dictamenTexto).toContain('DOC-CHAM-2026-0001');
    expect(listarLeads(db)).toHaveLength(3);
  });

  it('exige el nombre del productor', () => {
    expect(() => registrarDiagnosticoCampo(db, { ...DIAGNOSTICO_BASE, productor: '  ' })).toThrow();
  });

  it('mueve leads por el embudo y resume el pipeline', () => {
    const a = registrarDiagnosticoCampo(db, DIAGNOSTICO_BASE);
    const b = registrarDiagnosticoCampo(db, { ...DIAGNOSTICO_BASE, superficieHa: 3 });
    const c = registrarDiagnosticoCampo(db, { ...DIAGNOSTICO_BASE, superficieHa: 5 });
    actualizarEtapaLead(db, a.id, 'N4');
    actualizarEtapaLead(db, b.id, 'perdido');

    const resumen = obtenerResumenCrm(db);
    expect(resumen.totalLeads).toBe(3);
    expect(resumen.hectareas).toBe(20);
    expect(resumen.porEtapa).toMatchObject({ N1: 1, N4: 1, perdido: 1 });
    expect(resumen.ventaCerradaMxn).toBe(a.costoEstimadoMxn);
    expect(resumen.pipelineAbiertoMxn).toBe(c.costoEstimadoMxn);
    expect(resumen.tasaConversionPct).toBe(50);

    borrarLead(db, c.id);
    expect(obtenerLead(db, c.id)).toBeUndefined();
  });
});

describe('specialistService', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = crearBaseDeDatosDePrueba();
    enviarMock.mockReset();
  });

  it('guarda ambos turnos y manda el historial del especialista correcto', async () => {
    enviarMock.mockResolvedValue({ respuesta: 'Revisa el diferencial de presión.' });
    crearSpecialistMessage(db, {
      especialistaId: 'athena-phytopath',
      rol: 'user',
      contenido: 'otra charla',
    });

    await enviarTurnoEspecialista(db, 'capi1', '¿Por qué no succiona mi Venturi?');

    expect(enviarMock).toHaveBeenCalledWith('capi1', [
      { rol: 'user', contenido: '¿Por qué no succiona mi Venturi?' },
    ]);
    const historial = obtenerHistorialEspecialista(db, 'capi1');
    expect(historial.map((m) => m.rol)).toEqual(['user', 'assistant']);

    reiniciarConversacionEspecialista(db, 'capi1');
    expect(obtenerHistorialEspecialista(db, 'capi1')).toHaveLength(0);
    expect(obtenerHistorialEspecialista(db, 'athena-phytopath')).toHaveLength(1);
  });

  it('recorta el historial al máximo y lo hace empezar con un mensaje del usuario', async () => {
    enviarMock.mockResolvedValue({ respuesta: 'ok' });
    for (let i = 0; i < 20; i++) {
      crearSpecialistMessage(db, { especialistaId: 'capi1', rol: 'user', contenido: `p${i}` });
      crearSpecialistMessage(db, { especialistaId: 'capi1', rol: 'assistant', contenido: `r${i}` });
    }
    await enviarTurnoEspecialista(db, 'capi1', 'última');
    const enviados = enviarMock.mock.calls[0][1];
    expect(enviados.length).toBeLessThanOrEqual(MAX_MENSAJES_HISTORIAL);
    expect(enviados[0].rol).toBe('user');
    expect(enviados[enviados.length - 1].contenido).toBe('última');
  });

  it('genera el protocolo IA de un dictamen y lo guarda en el lead', async () => {
    enviarMock.mockResolvedValue({ respuesta: 'Protocolo ampliado' });
    const lead = registrarDiagnosticoCampo(db, DIAGNOSTICO_BASE);

    await generarProtocoloIa(db, lead.id);

    expect(enviarMock).toHaveBeenCalledWith(
      'athena-phytopath',
      [expect.objectContaining({ rol: 'user' })],
      lead.dictamenTexto,
    );
    expect(obtenerLead(db, lead.id)?.protocoloIa).toBe('Protocolo ampliado');
    expect(obtenerHistorialEspecialista(db, 'athena-phytopath')).toHaveLength(0);
  });
});
