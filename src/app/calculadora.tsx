import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LabeledInput } from '@/components/form/LabeledInput';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { Section } from '@/components/form/Section';
import { FilaIndicadores, Indicador, Pantalla } from '@/components/chaman/ui';
import { useTheme } from '@/hooks/use-theme';
import {
  calcularRoi,
  dimensionarGenerador,
  enlaceWhatsApp,
  formatoMxn,
  MODELOS_GENERADOR,
} from '@/domain/chaman';

function num(texto: string, respaldo = 0): number {
  const valor = Number(texto.replace(',', '.'));
  return Number.isFinite(valor) && texto.trim() !== '' ? valor : respaldo;
}

export default function CalculadoraScreen() {
  const theme = useTheme();
  const [caudal, setCaudal] = useState('30');
  const [ppm, setPpm] = useState('2');
  const [eficiencia, setEficiencia] = useState('80');
  const [horas, setHoras] = useState('4');
  const [hectareas, setHectareas] = useState('10');
  const [gastoQuimico, setGastoQuimico] = useState('26000');
  const [ahorroPct, setAhorroPct] = useState('30');

  const eficienciaValida = num(eficiencia) > 0 && num(eficiencia) <= 100;
  const dimension = eficienciaValida
    ? dimensionarGenerador({
        caudalM3H: num(caudal),
        ppmObjetivo: num(ppm),
        eficienciaPct: num(eficiencia),
        horasRiegoDia: num(horas),
      })
    : null;
  const inversion =
    dimension?.modelo?.costoReferenciaMxn ??
    MODELOS_GENERADOR[MODELOS_GENERADOR.length - 1].costoReferenciaMxn;
  const roi = calcularRoi({
    superficieHa: num(hectareas),
    gastoQuimicoHaAnualMxn: num(gastoQuimico),
    ahorroEsperadoPct: num(ahorroPct),
    inversionEquipoMxn: inversion,
  });

  function cotizar() {
    if (!dimension) return;
    const texto =
      `⚡ *Cotización de generador de ozono Chamán 4.0*\n\n` +
      `• Caudal de riego: ${caudal} m³/h (${dimension.caudalLS} L/s)\n` +
      `• Concentración objetivo: ${ppm} ppm de O₃\n` +
      `• Horas de riego: ${horas} h/día\n` +
      `• Capacidad requerida: ${dimension.gramosPorHora} g O₃/h\n` +
      `• Modelo sugerido: ${dimension.modelo?.nombre ?? 'Proyecto a la medida'}\n` +
      `• Superficie: ${hectareas} ha\n\n` +
      `Solicito cotización formal y visita técnica.`;
    Linking.openURL(enlaceWhatsApp(texto));
  }

  return (
    <Pantalla edges={['bottom']}>
      <Section
        title="Dimensionamiento del generador"
        subtitle="g O₃/h = caudal × ppm ÷ eficiencia del inyector"
      >
        <View style={styles.fila}>
          <View style={styles.flex}>
            <LabeledInput
              label="Caudal"
              value={caudal}
              onChangeText={setCaudal}
              keyboardType="decimal-pad"
              suffix="m³/h"
            />
          </View>
          <View style={styles.flex}>
            <LabeledInput
              label="Ozono objetivo"
              value={ppm}
              onChangeText={setPpm}
              keyboardType="decimal-pad"
              suffix="ppm"
            />
          </View>
        </View>
        <View style={styles.fila}>
          <View style={styles.flex}>
            <LabeledInput
              label="Eficiencia Venturi"
              value={eficiencia}
              onChangeText={setEficiencia}
              keyboardType="decimal-pad"
              suffix="%"
            />
          </View>
          <View style={styles.flex}>
            <LabeledInput
              label="Riego al día"
              value={horas}
              onChangeText={setHoras}
              keyboardType="decimal-pad"
              suffix="h"
            />
          </View>
        </View>
        {dimension ? (
          <>
            <FilaIndicadores>
              <Indicador
                etiqueta="Capacidad requerida"
                valor={`${dimension.gramosPorHora} g/h`}
                color={theme.accentSecondary}
              />
              <Indicador
                etiqueta="Ozono al día"
                valor={`${dimension.gramosPorDia} g`}
                detalle={`${dimension.caudalLS} L/s`}
              />
            </FilaIndicadores>
            <View
              style={[
                styles.modelo,
                { backgroundColor: theme.accentSoft, borderColor: theme.accent },
              ]}
            >
              {dimension.modelo ? (
                <>
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    {dimension.modelo.nombre} · {dimension.modelo.capacidadGH} g O₃/h
                  </ThemedText>
                  <ThemedText type="small">{dimension.modelo.descripcion}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {dimension.modelo.uso} · referencia{' '}
                    {formatoMxn(dimension.modelo.costoReferenciaMxn)}
                  </ThemedText>
                </>
              ) : (
                <ThemedText type="small">
                  La demanda supera al modelo más grande: requiere un proyecto a la medida (varios
                  generadores o inyección por sectores).
                </ThemedText>
              )}
            </View>
          </>
        ) : (
          <ThemedText type="small" style={{ color: theme.danger }}>
            La eficiencia debe estar entre 1 y 100%.
          </ThemedText>
        )}
      </Section>

      <Section
        title="Retorno de inversión"
        subtitle="Ahorro estimado frente a tu gasto actual en agroquímicos."
      >
        <LabeledInput
          label="Superficie"
          value={hectareas}
          onChangeText={setHectareas}
          keyboardType="decimal-pad"
          suffix="ha"
        />
        <View style={styles.fila}>
          <View style={styles.flex}>
            <LabeledInput
              label="Gasto químico anual"
              value={gastoQuimico}
              onChangeText={setGastoQuimico}
              keyboardType="number-pad"
              suffix="$/ha"
            />
          </View>
          <View style={styles.flex}>
            <LabeledInput
              label="Sustitución esperada"
              value={ahorroPct}
              onChangeText={setAhorroPct}
              keyboardType="decimal-pad"
              suffix="%"
            />
          </View>
        </View>
        <FilaIndicadores>
          <Indicador etiqueta="Gasto químico anual" valor={formatoMxn(roi.gastoQuimicoAnualMxn)} />
          <Indicador
            etiqueta="Ahorro anual estimado"
            valor={formatoMxn(roi.ahorroAnualMxn)}
            color={theme.accent}
          />
          <Indicador
            etiqueta="Recuperación del equipo"
            valor={roi.mesesRecuperacion !== null ? `${roi.mesesRecuperacion} meses` : '—'}
            detalle={`Inversión ref. ${formatoMxn(inversion)}`}
            color={theme.warning}
          />
        </FilaIndicadores>
        <ThemedText type="small" themeColor="textSecondary">
          Estimación con tus supuestos; el ahorro real depende del cultivo, la presión de plagas y
          el programa actual. Úsala como punto de partida para la cotización.
        </ThemedText>
      </Section>

      <PrimaryButton
        label="Solicitar cotización por WhatsApp"
        onPress={cotizar}
        disabled={!dimension}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  fila: { flexDirection: 'row', gap: 12 },
  modelo: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
});
