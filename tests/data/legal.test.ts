import { crearBaseDeDatosDePrueba } from './testDb';
import type { AppDatabase } from '../../src/data/db/types';
import {
  borrarTodosLosDatos,
  obtenerUltimaAceptacionLegal,
  registrarAceptacionLegal,
  tablasDeUsuario,
  versionLegalAceptada,
} from '../../src/data/repositories/legalRepository';
import { listarLeads } from '../../src/data/repositories/leadRepository';
import { listarInventarioFertilizantes } from '../../src/data/repositories/fertilizerInventoryRepository';
import { crearSpecialistMessage } from '../../src/data/repositories/specialistMessageRepository';
import { registrarDiagnosticoCampo } from '../../src/state/crmService';
import { sembrarFertilizantes } from '../../src/data/seed/loadCropsAndFertilizers';
import {
  DATOS_RESPONSABLE,
  DOCUMENTOS_LEGALES,
  LEYENDA_ORIENTATIVA,
  VERSION_LEGAL,
} from '../../src/legal/documentos';
import { CONTACTO_CHAMAN } from '../../src/domain/chaman';

describe('aceptación de documentos legales', () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = crearBaseDeDatosDePrueba();
  });

  it('pide aceptar hasta que se registra la versión vigente, y otra vez si cambia', () => {
    expect(versionLegalAceptada(db, VERSION_LEGAL)).toBe(false);
    registrarAceptacionLegal(db, '2020-01-01', 'android');
    expect(versionLegalAceptada(db, VERSION_LEGAL)).toBe(false);
    registrarAceptacionLegal(db, VERSION_LEGAL, 'android');
    expect(versionLegalAceptada(db, VERSION_LEGAL)).toBe(true);
    expect(obtenerUltimaAceptacionLegal(db)?.plataforma).toBe('android');
  });

  it('borrar todos los datos vacía el CRM y chats, resiembra el catálogo y conserva la aceptación', () => {
    sembrarFertilizantes(db);
    const fertilizantesIniciales = listarInventarioFertilizantes(db).length;
    registrarAceptacionLegal(db, VERSION_LEGAL, 'ios');
    registrarDiagnosticoCampo(db, {
      productor: 'Productor de prueba',
      cultivo: 'berries',
      producto: 'biofungicida',
      superficieHa: 1,
      severidad: 'Leve',
    });
    crearSpecialistMessage(db, { especialistaId: 'capi1', rol: 'user', contenido: 'hola' });

    borrarTodosLosDatos(db);

    expect(listarLeads(db)).toHaveLength(0);
    expect(listarInventarioFertilizantes(db)).toHaveLength(fertilizantesIniciales);
    expect(versionLegalAceptada(db, VERSION_LEGAL)).toBe(true);
    expect(tablasDeUsuario()).toEqual(
      expect.arrayContaining(['leads', 'specialist_messages', 'lotes', 'chat_messages']),
    );
    expect(tablasDeUsuario()).not.toContain('aceptaciones_legales');
  });
});

describe('documentos legales', () => {
  it('cada documento tiene título, resumen y secciones con contenido', () => {
    for (const doc of Object.values(DOCUMENTOS_LEGALES)) {
      expect(doc.titulo.length).toBeGreaterThan(0);
      expect(doc.resumen.length).toBeGreaterThan(0);
      expect(doc.secciones.length).toBeGreaterThan(0);
      for (const seccion of doc.secciones) expect(seccion.parrafos.length).toBeGreaterThan(0);
    }
  });

  it('los datos de contacto coinciden con los que usa la app', () => {
    expect(DATOS_RESPONSABLE.correoPrivacidad).toBe(CONTACTO_CHAMAN.correo);
    expect(DATOS_RESPONSABLE.whatsapp).toBe(CONTACTO_CHAMAN.whatsappLegible);
    expect(DATOS_RESPONSABLE.sitioWeb).toBe(CONTACTO_CHAMAN.sitioWeb);
  });

  it('la leyenda orientativa aclara que no sustituye al agrónomo y remite a la etiqueta', () => {
    expect(LEYENDA_ORIENTATIVA).toContain('no sustituye');
    expect(LEYENDA_ORIENTATIVA).toContain('etiqueta');
  });
});
