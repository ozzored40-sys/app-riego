/**
 * Google Apps Script: recibe los leads del agente de ventas (server/lib/leadSync.ts)
 * y los guarda en este libro de Google Sheets. Instalación en server/README.md
 * ("Sincronizar leads con Google Sheets").
 *
 * - Un lead por teléfono: si ya existe se actualiza su fila (no se duplica en cada
 *   mensaje del prospecto).
 * - N1/N2 viven en la pestaña Nutricion_Leads y N3/N4 en Leads_Calificados; si el
 *   lead sube (o baja) de nivel, su fila se mueve de pestaña conservando su ID y fecha.
 * - La columna Estado la decide el equipo de ventas: solo se llena al crear la fila o
 *   al cambiar de pestaña; después no se sobrescribe.
 */

// Debe coincidir con LEADS_SHEETS_SECRET en el servidor.
var SECRETO = 'CAMBIA-ESTE-VALOR';

var PESTANAS = ['Nutricion_Leads', 'Leads_Calificados'];
var COLUMNAS = [
  'ID Lead',
  'Fecha Registro',
  'Teléfono',
  'Nombre',
  'Empresa',
  'Cultivo',
  'Clasificación',
  'Resumen de Requerimiento',
  'Presupuesto',
  'Siguiente Acción',
  'Canal',
  'Estado',
  'Última Actualización',
];
var COL_ID = 0;
var COL_FECHA = 1;
var COL_TELEFONO = 2;
var COL_ESTADO = 11;

function doPost(e) {
  var datos = JSON.parse(e.postData.contents);
  if (datos.secreto !== SECRETO) return respuesta({ ok: false, error: 'No autorizado' });
  if (PESTANAS.indexOf(datos.pestana) === -1 || !datos.telefono) {
    return respuesta({ ok: false, error: 'Datos incompletos' });
  }

  var bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(10000);
  try {
    var libro = SpreadsheetApp.getActiveSpreadsheet();
    var existente = buscarPorTelefono(libro, String(datos.telefono));
    var ahora = new Date();

    var id = existente ? existente.valores[COL_ID] : siguienteId();
    var fecha = existente ? existente.valores[COL_FECHA] : ahora;
    var mismaPestana = existente && existente.hoja.getName() === datos.pestana;
    var estado = mismaPestana ? existente.valores[COL_ESTADO] : datos.estado;

    var fila = [
      id,
      fecha,
      "'" + datos.telefono, // apóstrofo: que Sheets no lo convierta en número
      datos.nombre,
      datos.empresa,
      datos.cultivo,
      datos.nivel,
      datos.necesidad,
      datos.presupuesto,
      datos.siguienteAccion,
      datos.canal,
      estado,
      ahora,
    ];

    if (mismaPestana) {
      existente.hoja.getRange(existente.fila, 1, 1, COLUMNAS.length).setValues([fila]);
    } else {
      if (existente) existente.hoja.deleteRow(existente.fila);
      obtenerHoja(libro, datos.pestana).appendRow(fila);
    }
    return respuesta({ ok: true, id: id });
  } finally {
    bloqueo.releaseLock();
  }
}

function obtenerHoja(libro, nombre) {
  var hoja = libro.getSheetByName(nombre);
  if (!hoja) {
    hoja = libro.insertSheet(nombre);
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function buscarPorTelefono(libro, telefono) {
  for (var i = 0; i < PESTANAS.length; i++) {
    var hoja = obtenerHoja(libro, PESTANAS[i]);
    var valores = hoja.getDataRange().getDisplayValues();
    for (var f = 1; f < valores.length; f++) {
      if (valores[f][COL_TELEFONO] === telefono) {
        return {
          hoja: hoja,
          fila: f + 1,
          valores: hoja.getRange(f + 1, 1, 1, COLUMNAS.length).getValues()[0],
        };
      }
    }
  }
  return null;
}

/** IDs consecutivos LD-1001, LD-1002, ... compartidos entre las dos pestañas. */
function siguienteId() {
  var propiedades = PropertiesService.getScriptProperties();
  var siguiente = Number(propiedades.getProperty('siguienteId') || 1001);
  propiedades.setProperty('siguienteId', String(siguiente + 1));
  return 'LD-' + siguiente;
}

function respuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
