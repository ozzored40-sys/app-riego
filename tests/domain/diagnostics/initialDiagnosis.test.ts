import {
  calcularDiagnosticoInicial,
  type DiagnosticoInput,
} from '../../../src/domain/diagnostics/initialDiagnosis';
import { jitomate } from '../../../src/domain/crops/jitomate';
import { pepino } from '../../../src/domain/crops/pepino';

function fixtureOptimo(): DiagnosticoInput {
  return {
    cultivo: jitomate,
    medio: {
      tipo: 'suelo',
      pH: 6.2, // dentro de [5.5, 6.8]
      ceDsM: 2.5, // dentro de [2.0, 3.5]
      textura: 'franco',
      materiaOrganicaPct: 3,
      cicMeq100g: 20,
    },
    agua: { pH: 7, ceDsM: 0.8, sar: 2, durezaMgLCaCO3: 100, alcalinidadMgLCaCO3: 80 },
    riego: { eficienciaPct: 0.9 },
  };
}

describe('calcularDiagnosticoInicial', () => {
  it('da resumen "ok" cuando todos los valores están en rango', () => {
    const diagnostico = calcularDiagnosticoInicial(fixtureOptimo());
    expect(diagnostico.resumen).toBe('ok');
    expect(diagnostico.hallazgos.every((h) => h.nivel === 'ok')).toBe(true);
  });

  it('marca riesgo cuando el pH del suelo está muy fuera del rango óptimo del cultivo', () => {
    const input = fixtureOptimo();
    (input.medio as { pH: number }).pH = 4.5; // muy ácido para jitomate (5.5-6.8)
    const diagnostico = calcularDiagnosticoInicial(input);
    const hallazgoPH = diagnostico.hallazgos.find((h) => h.variable === 'pH');
    expect(hallazgoPH?.nivel).toBe('riesgo');
    expect(diagnostico.resumen).toBe('riesgo');
  });

  it('marca atención cuando la materia orgánica es baja', () => {
    const input = fixtureOptimo();
    (input.medio as { materiaOrganicaPct: number }).materiaOrganicaPct = 1.5;
    const diagnostico = calcularDiagnosticoInicial(input);
    const hallazgo = diagnostico.hallazgos.find((h) => h.variable === 'Materia orgánica');
    expect(hallazgo?.nivel).toBe('atencion');
  });

  it('marca riesgo cuando el SAR del agua es alto', () => {
    const input = fixtureOptimo();
    input.agua.sar = 12;
    const diagnostico = calcularDiagnosticoInicial(input);
    const hallazgo = diagnostico.hallazgos.find((h) => h.variable === 'SAR');
    expect(hallazgo?.nivel).toBe('riesgo');
  });

  it('marca riesgo cuando la alcalinidad del agua es alta', () => {
    const input = fixtureOptimo();
    input.agua.alcalinidadMgLCaCO3 = 250;
    const diagnostico = calcularDiagnosticoInicial(input);
    const hallazgo = diagnostico.hallazgos.find((h) => h.variable === 'Alcalinidad');
    expect(hallazgo?.nivel).toBe('riesgo');
  });

  it('considera la sensibilidad a salinidad del cultivo para la CE del agua', () => {
    // Pepino tiene sensibilidad alta a salinidad; jitomate media.
    const inputPepino: DiagnosticoInput = { ...fixtureOptimo(), cultivo: pepino };
    inputPepino.agua.ceDsM = 1.2; // seguro para jitomate (media), riesgoso para pepino (alta)

    const diagnosticoJitomate = calcularDiagnosticoInicial(fixtureOptimo());
    const diagnosticoPepino = calcularDiagnosticoInicial(inputPepino);

    const hallazgoJitomate = diagnosticoJitomate.hallazgos.find(
      (h) => h.variable === 'CE del agua vs. sensibilidad del cultivo',
    );
    const hallazgoPepino = diagnosticoPepino.hallazgos.find(
      (h) => h.variable === 'CE del agua vs. sensibilidad del cultivo',
    );

    expect(hallazgoJitomate?.nivel).toBe('ok');
    expect(hallazgoPepino?.nivel).not.toBe('ok');
  });

  it('marca riesgo cuando la eficiencia de riego es baja', () => {
    const input = fixtureOptimo();
    input.riego.eficienciaPct = 0.6;
    const diagnostico = calcularDiagnosticoInicial(input);
    const hallazgo = diagnostico.hallazgos.find((h) => h.variable === 'Eficiencia del sistema');
    expect(hallazgo?.nivel).toBe('riesgo');
  });

  it('no evalúa materia orgánica ni CIC en sustrato', () => {
    const input: DiagnosticoInput = {
      ...fixtureOptimo(),
      medio: { tipo: 'sustrato', pH: 6, ceDsM: 2.5 },
    };
    const diagnostico = calcularDiagnosticoInicial(input);
    expect(diagnostico.hallazgos.find((h) => h.variable === 'Materia orgánica')).toBeUndefined();
    expect(diagnostico.hallazgos.find((h) => h.variable === 'CIC')).toBeUndefined();
    expect(diagnostico.hallazgos.find((h) => h.categoria === 'sustrato')).toBeDefined();
  });
});
