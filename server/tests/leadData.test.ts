import { separarRespuestaYLead, esNivelCaliente } from '../lib/leadData';

describe('separarRespuestaYLead', () => {
  it('quita el bloque <lead_data> del texto visible y extrae los datos', () => {
    const respuesta = `Hola Juan 👋 ¿Cuántas hectáreas de jitomate tienes?

<lead_data>
{"nombre": "Juan Pérez", "empresa": null, "cultivo": "jitomate", "necesidad": "Corregir calcio", "presupuesto": null, "nivel": "n2", "siguiente_accion": "Preguntar hectáreas"}
</lead_data>`;

    const { textoVisible, lead } = separarRespuestaYLead(respuesta);
    expect(textoVisible).toBe('Hola Juan 👋 ¿Cuántas hectáreas de jitomate tienes?');
    expect(lead).toEqual({
      nombre: 'Juan Pérez',
      empresa: undefined,
      cultivo: 'jitomate',
      necesidad: 'Corregir calcio',
      presupuesto: undefined,
      nivel: 'N2',
      siguienteAccion: 'Preguntar hectáreas',
    });
  });

  it('sin bloque devuelve el texto tal cual y lead null', () => {
    expect(separarRespuestaYLead('  Hola  ')).toEqual({ textoVisible: 'Hola', lead: null });
  });

  it('nunca deja ver un bloque sin cerrar (respuesta cortada por max_tokens)', () => {
    const { textoVisible, lead } = separarRespuestaYLead('Claro.\n<lead_data>\n{"nombre": "Ju');
    expect(textoVisible).toBe('Claro.');
    expect(lead).toBeNull();
  });

  it('descarta el lead si el nivel no es N1–N4 o el JSON es inválido', () => {
    expect(separarRespuestaYLead('Hola <lead_data>{"nivel": "N7"}</lead_data>').lead).toBeNull();
    expect(separarRespuestaYLead('Hola <lead_data>no es json</lead_data>').lead).toBeNull();
  });
});

describe('esNivelCaliente', () => {
  it('solo N3 y N4 son calientes', () => {
    expect(['N1', 'N2', 'N3', 'N4'].map((n) => esNivelCaliente(n as 'N1'))).toEqual([
      false,
      false,
      true,
      true,
    ]);
  });
});
