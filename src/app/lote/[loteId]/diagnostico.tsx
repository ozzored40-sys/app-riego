import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { FormScreen } from '@/components/form/FormScreen';
import { Section } from '@/components/form/Section';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { db } from '@/data/db/client';
import { obtenerLote } from '@/data/repositories/loteRepository';
import { calcularDiagnosticoDeLote } from '@/state/diagnosisService';
import type { HallazgoDiagnostico, NivelDiagnostico } from '@/domain/diagnostics/initialDiagnosis';

const COLOR_NIVEL: Record<NivelDiagnostico, string> = {
  ok: '#2e9c4f',
  atencion: '#d4a017',
  riesgo: '#c0392b',
};

const ETIQUETA_NIVEL: Record<NivelDiagnostico, string> = {
  ok: 'Bien',
  atencion: 'Atención',
  riesgo: 'Riesgo',
};

const ETIQUETA_CATEGORIA: Record<HallazgoDiagnostico['categoria'], string> = {
  suelo: 'Suelo',
  sustrato: 'Sustrato',
  agua: 'Agua',
  riego: 'Riego',
};

export default function DiagnosticoScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const router = useRouter();
  const lote = loteId ? obtenerLote(db, loteId) : undefined;
  const diagnostico = loteId ? calcularDiagnosticoDeLote(db, loteId) : null;

  if (!lote) {
    return (
      <FormScreen>
        <ThemedText>No se encontró el lote.</ThemedText>
      </FormScreen>
    );
  }

  if (!diagnostico) {
    return (
      <FormScreen>
        <Section title="Diagnóstico inicial">
          <ThemedText type="small" themeColor="textSecondary">
            Todavía falta capturar suelo/sustrato, agua o riego para poder generar el diagnóstico de
            este lote.
          </ThemedText>
        </Section>
        <PrimaryButton label="Ir a Hoy" onPress={() => router.replace(`/lote/${loteId}/hoy`)} />
      </FormScreen>
    );
  }

  const porCategoria = agruparPorCategoria(diagnostico.hallazgos);

  return (
    <FormScreen>
      <Section
        title={`Diagnóstico inicial: ${lote.nombre}`}
        subtitle="Basado en los datos capturados"
      >
        <View style={[styles.badge, { backgroundColor: COLOR_NIVEL[diagnostico.resumen] }]}>
          <ThemedText type="smallBold" style={{ color: '#fff' }}>
            {ETIQUETA_NIVEL[diagnostico.resumen]}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Revisión rápida por reglas agronómicas (no reemplaza la visita de un técnico). No usa
          fotos ni inteligencia artificial: compara lo que ya capturaste contra rangos de referencia
          del cultivo.
        </ThemedText>
      </Section>

      {Object.entries(porCategoria).map(([categoria, hallazgos]) => (
        <Section
          key={categoria}
          title={ETIQUETA_CATEGORIA[categoria as HallazgoDiagnostico['categoria']]}
        >
          {hallazgos.map((hallazgo, i) => (
            <View key={i} style={styles.fila}>
              <View style={[styles.dot, { backgroundColor: COLOR_NIVEL[hallazgo.nivel] }]} />
              <View style={styles.filaTexto}>
                <ThemedText type="small">{hallazgo.mensaje}</ThemedText>
              </View>
            </View>
          ))}
        </Section>
      ))}

      <PrimaryButton
        label="Continuar a Hoy"
        onPress={() => router.replace(`/lote/${loteId}/hoy`)}
      />
    </FormScreen>
  );
}

function agruparPorCategoria(
  hallazgos: HallazgoDiagnostico[],
): Partial<Record<HallazgoDiagnostico['categoria'], HallazgoDiagnostico[]>> {
  const grupos: Partial<Record<HallazgoDiagnostico['categoria'], HallazgoDiagnostico[]>> = {};
  for (const hallazgo of hallazgos) {
    (grupos[hallazgo.categoria] ??= []).push(hallazgo);
  }
  return grupos;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  fila: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  filaTexto: { flex: 1 },
});
