import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { FormScreen } from '@/components/form/FormScreen';
import { Section } from '@/components/form/Section';
import { LabeledInput } from '@/components/form/LabeledInput';
import { SegmentedSelect } from '@/components/form/SegmentedSelect';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { db } from '@/data/db/client';
import {
  listarSensorReadingsDeLote,
  type TipoLecturaSensor,
} from '@/data/repositories/sensorReadingRepository';
import {
  listarAlertasDeLote,
  marcarAlertaResuelta,
  type Alert,
} from '@/data/repositories/alertRepository';
import {
  registrarLecturaYEvaluar,
  type ComparacionProgramadoAplicado,
} from '@/state/monitoringService';
import type { NivelSemaforo } from '@/domain/monitoring/semaphore';

const TIPOS: { value: TipoLecturaSensor; label: string; unidad: string }[] = [
  { value: 'aguaAplicadaL', label: 'Agua aplicada', unidad: 'L/planta' },
  { value: 'ceAplicada', label: 'CE aplicada', unidad: 'dS/m' },
  { value: 'phAplicado', label: 'pH aplicado', unidad: 'pH' },
  { value: 'caudal', label: 'Caudal', unidad: 'L/h' },
  { value: 'humedadSustrato', label: 'Humedad', unidad: '%' },
  { value: 'fertilizanteAplicadoKg', label: 'Fertilizante aplicado', unidad: 'kg' },
];

const COLOR_SEMAFORO: Record<NivelSemaforo, string> = {
  verde: '#2e9c4f',
  amarillo: '#d4a017',
  rojo: '#c0392b',
};

function num(valor: string): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

export default function MonitoreoScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const theme = useTheme();

  const [tipo, setTipo] = useState<TipoLecturaSensor>('aguaAplicadaL');
  const [valor, setValor] = useState('');
  const [comparacion, setComparacion] = useState<ComparacionProgramadoAplicado | null>(null);
  // Las listas se leen directo de SQLite en cada render; este contador solo fuerza
  // el re-render tras registrar una lectura o resolver una alerta.
  const [, forzarRecarga] = useState(0);

  const definicionTipo = TIPOS.find((t) => t.value === tipo)!;
  const lecturas = listarSensorReadingsDeLote(db, loteId!).slice(0, 10);
  const alertas = listarAlertasDeLote(db, loteId!, true);

  function registrar() {
    const resultado = registrarLecturaYEvaluar(db, loteId!, {
      loteId: loteId!,
      fecha: new Date().toISOString().slice(0, 10),
      tipo,
      valor: num(valor),
      unidad: definicionTipo.unidad,
    });
    setComparacion(resultado.comparacion);
    setValor('');
    forzarRecarga((v) => v + 1);
  }

  function resolver(alerta: Alert) {
    marcarAlertaResuelta(db, alerta.id);
    forzarRecarga((v) => v + 1);
  }

  return (
    <FormScreen>
      <Section title="Registrar lectura">
        <SegmentedSelect
          label="Tipo de lectura"
          options={TIPOS.map(({ value, label }) => ({ value, label }))}
          value={tipo}
          onChange={(v) => {
            setTipo(v);
            setComparacion(null);
          }}
        />
        <LabeledInput
          label={definicionTipo.label}
          value={valor}
          onChangeText={setValor}
          keyboardType="decimal-pad"
          suffix={definicionTipo.unidad}
        />
        <PrimaryButton label="Registrar" onPress={registrar} disabled={!valor} />
      </Section>

      {comparacion ? (
        <Section title="Programado vs. aplicado">
          <View
            style={[styles.badge, { backgroundColor: COLOR_SEMAFORO[comparacion.semaforo.nivel] }]}
          >
            <ThemedText type="smallBold" style={{ color: '#fff' }}>
              {comparacion.semaforo.nivel.toUpperCase()} ·{' '}
              {comparacion.semaforo.desviacionPct.toFixed(1)}%
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Programado: {comparacion.programado.toFixed(2)} · Aplicado:{' '}
            {comparacion.aplicado.toFixed(2)}
          </ThemedText>
          {comparacion.semaforo.nivel === 'rojo' ? (
            <ThemedText type="small">
              Desviación mayor al 20%: no se ajusta automáticamente. Posibles causas:{' '}
              {comparacion.semaforo.posiblesCausas.join(', ')}.
            </ThemedText>
          ) : null}
          {comparacion.semaforo.nivel === 'amarillo' ? (
            <ThemedText type="small">
              Ajuste sugerido para el próximo programa:{' '}
              {comparacion.semaforo.ajusteSugeridoPct?.toFixed(1)}%.
            </ThemedText>
          ) : null}
        </Section>
      ) : null}

      {alertas.length > 0 ? (
        <Section title="Alertas activas">
          {alertas.map((alerta) => (
            <View key={alerta.id} style={styles.alertRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: COLOR_SEMAFORO[alerta.nivel as NivelSemaforo] },
                ]}
              />
              <View style={styles.alertBody}>
                <ThemedText type="small">{alerta.mensaje}</ThemedText>
                <PrimaryButton
                  label="Marcar resuelta"
                  variant="secondary"
                  onPress={() => resolver(alerta)}
                />
              </View>
            </View>
          ))}
        </Section>
      ) : null}

      <Section title="Lecturas recientes">
        {lecturas.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Aún no hay lecturas registradas.
          </ThemedText>
        ) : (
          lecturas.map((lectura) => (
            <View
              key={lectura.id}
              style={[styles.fila, { borderBottomColor: theme.backgroundSelected }]}
            >
              <ThemedText type="small">
                {TIPOS.find((t) => t.value === lectura.tipo)?.label}
              </ThemedText>
              <ThemedText type="smallBold">
                {lectura.valor} {lectura.unidad}
              </ThemedText>
            </View>
          ))
        )}
      </Section>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  alertRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  alertBody: { flex: 1, gap: 8 },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
