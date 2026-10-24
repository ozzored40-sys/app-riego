import {
  calcularPrescripcion,
  calcularRoi,
  dimensionarGenerador,
  enlaceWhatsApp,
  generarFolio,
  normalizarTelefonoWhatsApp,
  textoDictamen,
  CULTIVOS_CHAMAN,
  ESPECIALISTAS,
  PRODUCTOS_CHAMAN,
  FRACCION_FITOSANITARIA_CONVENCIONAL,
} from '../../../src/domain/chaman';

describe('catálogo Chamán', () => {
  it('cada producto tiene un rango de dosis válido y costo positivo', () => {
    for (const producto of PRODUCTOS_CHAMAN) {
      expect(producto.dosisLHa.min).toBeGreaterThan(0);
      expect(producto.dosisLHa.max).toBeGreaterThanOrEqual(producto.dosisLHa.min);
      expect(producto.costoReferenciaHaMxn).toBeGreaterThan(0);
    }
  });

  it('las claves de productos, cultivos y especialistas son únicas', () => {
    const unicas = (xs: string[]) => new Set(xs).size === xs.length;
    expect(unicas(PRODUCTOS_CHAMAN.map((p) => p.clave))).toBe(true);
    expect(unicas(CULTIVOS_CHAMAN.map((c) => c.clave))).toBe(true);
    expect(unicas(ESPECIALISTAS.map((e) => e.id))).toBe(true);
  });
});

describe('calcularPrescripcion', () => {
  it('usa la ppm de drench del cultivo y la dosis media para severidad moderada', () => {
    const p = calcularPrescripcion({
      cultivo: 'berries',
      producto: 'biofungicida',
      superficieHa: 5,
      severidad: 'Moderado',
    });
    expect(p.metodo).toBe('drench');
    expect(p.ppmOzono).toBe(2.2);
    expect(p.dosisLHa).toBe(3.5);
    expect(p.aplicaciones).toBe(2);
    expect(p.productoTotalLitros).toBe(35);
    expect(p.totalPlantas).toBe(300000);
    expect(p.costoEstimadoMxn).toBe(1350 * 5 * 2);
    expect(p.costoConvencionalMxn).toBe(
      Math.round(32000 * 5 * FRACCION_FITOSANITARIA_CONVENCIONAL),
    );
    expect(p.ahorroEstimadoMxn).toBe(p.costoConvencionalMxn - p.costoEstimadoMxn);
  });

  it('respeta el método foliar y sube la ppm en suelos alcalinos', () => {
    const p = calcularPrescripcion({
      cultivo: 'hortalizas',
      producto: 'bioinsecticida',
      superficieHa: 1,
      severidad: 'Leve',
      phSuelo: 8.1,
    });
    expect(p.metodo).toBe('foliar');
    expect(p.ppmOzono).toBe(1.4);
    expect(p.dosisLHa).toBe(2);
    expect(p.notasTecnicas.some((n) => n.includes('alcalino'))).toBe(true);
  });

  it('con carbonatos altos eleva la ppm al mínimo de purga y severidad crítica usa 3 aplicaciones', () => {
    const p = calcularPrescripcion({
      cultivo: 'aguacate',
      producto: 'oxiRoot',
      superficieHa: 2,
      severidad: 'Crítico',
      carbonatos: 'Alto',
    });
    expect(p.ppmOzono).toBe(3.5);
    expect(p.aplicaciones).toBe(3);
    expect(p.dosisLHa).toBe(5);
  });

  it('calcula el agua portadora desde la densidad y el agua por planta', () => {
    const p = calcularPrescripcion({
      cultivo: 'agave',
      producto: 'bactericida',
      superficieHa: 1,
      severidad: 'Moderado',
      densidadPlantasHa: 3500,
      aguaPorPlantaMl: 100,
    });
    expect(p.aguaPortadoraLHa).toBe(350);
    expect(p.totalPlantas).toBe(3500);
  });

  it('no inventa ahorro: puede ser negativo si el costo supera al programa convencional', () => {
    const p = calcularPrescripcion({
      cultivo: 'agave',
      producto: 'bactericida',
      superficieHa: 1,
      severidad: 'Crítico',
    });
    // 18,500 × 0.45 = 8,325 convencional vs 1,550 × 3 = 4,650 Chamán
    expect(p.ahorroEstimadoMxn).toBe(8325 - 4650);
  });

  it('rechaza superficies no positivas', () => {
    expect(() =>
      calcularPrescripcion({
        cultivo: 'berries',
        producto: 'biofungicida',
        superficieHa: 0,
        severidad: 'Leve',
      }),
    ).toThrow();
  });
});

describe('folio y texto del dictamen', () => {
  it('genera folios consecutivos con 4 dígitos', () => {
    expect(generarFolio(new Date(2026, 9, 24), 7)).toBe('DOC-CHAM-2026-0007');
  });

  it('el texto incluye folio, producto, dosis y aclara que los montos son de referencia', () => {
    const p = calcularPrescripcion({
      cultivo: 'berries',
      producto: 'biofungicida',
      superficieHa: 3,
      severidad: 'Moderado',
    });
    const texto = textoDictamen(
      {
        folio: 'DOC-CHAM-2026-0001',
        fecha: new Date(2026, 9, 24),
        productor: 'Ing. Roberto Anaya',
        cultivo: 'Berries',
        superficieHa: 3,
        problema: 'Fusarium',
        severidad: 'Moderado',
      },
      p,
    );
    expect(texto).toContain('DOC-CHAM-2026-0001');
    expect(texto).toContain('Chamán Ozono Biofungicida');
    expect(texto).toContain('3.5 L/ha');
    expect(texto).toContain('sujetos a cotización');
  });
});

describe('WhatsApp', () => {
  it('normaliza números mexicanos de 10 dígitos', () => {
    expect(normalizarTelefonoWhatsApp('33 2096-7184')).toBe('523320967184');
    expect(normalizarTelefonoWhatsApp('+52 1 33 2096 7184')).toBe('5213320967184');
    expect(normalizarTelefonoWhatsApp('123')).toBeNull();
  });

  it('sin teléfono válido usa el WhatsApp oficial de Chamán', () => {
    expect(enlaceWhatsApp('hola')).toBe('https://wa.me/523320967184?text=hola');
    expect(enlaceWhatsApp('hola', 'abc')).toBe('https://wa.me/523320967184?text=hola');
    expect(enlaceWhatsApp('a b', '4521908472')).toBe('https://wa.me/524521908472?text=a%20b');
  });
});

describe('calculadora', () => {
  it('dimensiona el generador y elige el modelo más chico que cubre la demanda', () => {
    const d = dimensionarGenerador({
      caudalM3H: 30,
      ppmObjetivo: 2,
      eficienciaPct: 80,
      horasRiegoDia: 4,
    });
    expect(d.gramosPorHora).toBe(75);
    expect(d.gramosPorDia).toBe(300);
    expect(d.caudalLS).toBe(8.3);
    expect(d.modelo?.nombre).toBe('Chamán O3-Master 100');
  });

  it('devuelve modelo null cuando la demanda excede el generador más grande', () => {
    const d = dimensionarGenerador({
      caudalM3H: 200,
      ppmObjetivo: 2,
      eficienciaPct: 80,
      horasRiegoDia: 4,
    });
    expect(d.modelo).toBeNull();
  });

  it('calcula ROI y meses de recuperación', () => {
    const r = calcularRoi({
      superficieHa: 10,
      gastoQuimicoHaAnualMxn: 26000,
      ahorroEsperadoPct: 30,
      inversionEquipoMxn: 82000,
    });
    expect(r.gastoQuimicoAnualMxn).toBe(260000);
    expect(r.ahorroAnualMxn).toBe(78000);
    expect(r.mesesRecuperacion).toBe(12.6);
  });

  it('sin ahorro no hay recuperación', () => {
    expect(
      calcularRoi({
        superficieHa: 1,
        gastoQuimicoHaAnualMxn: 1000,
        ahorroEsperadoPct: 0,
        inversionEquipoMxn: 1,
      }).mesesRecuperacion,
    ).toBeNull();
  });
});
