import { CROP_REGISTRY, getCropProfile, listCropProfiles } from '../../../src/domain/crops';
import { etapaPorEdad } from '../../../src/domain/types/crop';
import { MACRO_NUTRIENTS } from '../../../src/domain/types/nutrients';

describe('registro de cultivos (MVP: papaya, limón, pepino, chile, jitomate)', () => {
  it('contiene exactamente los 5 cultivos del MVP', () => {
    expect(Object.keys(CROP_REGISTRY).sort()).toEqual(
      ['chile', 'jitomate', 'limon', 'papaya', 'pepino'].sort(),
    );
  });

  it.each(listCropProfiles())(
    'el cultivo $nombre: cada nutriente suma 100% de absorción entre sus etapas',
    (cultivo) => {
      for (const nutriente of MACRO_NUTRIENTS) {
        const suma = cultivo.etapas.reduce(
          (total, etapa) => total + etapa.porcentajeAbsorcion[nutriente],
          0,
        );
        expect(suma).toBeCloseTo(100, 5);
      }
    },
  );

  it('getCropProfile lanza error para un id desconocido', () => {
    expect(() => getCropProfile('no-existe')).toThrow();
  });

  it('etapaPorEdad devuelve la etapa correcta según la edad del cultivo', () => {
    const jitomate = getCropProfile('jitomate');
    // vegetativo 25d, floracion 20d (25-45), fructificacion 35d (45-80), maduracion 20d (80-100)
    expect(etapaPorEdad(jitomate, 10).id).toBe('vegetativo');
    expect(etapaPorEdad(jitomate, 30).id).toBe('floracion');
    expect(etapaPorEdad(jitomate, 60).id).toBe('fructificacion');
    expect(etapaPorEdad(jitomate, 90).id).toBe('maduracion');
    // más allá del ciclo: se queda en la última etapa
    expect(etapaPorEdad(jitomate, 500).id).toBe('maduracion');
  });
});
