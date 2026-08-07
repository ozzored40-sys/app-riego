import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { FormScreen } from '@/components/form/FormScreen';
import { Section } from '@/components/form/Section';
import { ThemedText } from '@/components/themed-text';
import { db } from '@/data/db/client';
import { calcularResumenLote } from '@/state/resultsService';

export default function ResultadosScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const resumen = calcularResumenLote(db, loteId!);

  return (
    <FormScreen>
      <Section title="Resumen del lote">
        <Fila label="Recomendaciones calculadas" valor={`${resumen.numeroRecomendaciones}`} />
        <Fila
          label="Agua promedio por planta"
          valor={`${resumen.aguaPromedioLitrosPorPlantaDia.toFixed(2)} L/día`}
        />
        <Fila
          label="Costo acumulado de fertilizantes"
          valor={`$${resumen.costoAcumulado.toFixed(2)}`}
        />
        <Fila label="Costo promedio diario" valor={`$${resumen.costoPromedioDiario.toFixed(2)}`} />
        <Fila label="Alertas activas" valor={`${resumen.alertasActivas}`} />
        <Fila
          label="Alertas por nivel"
          valor={`🟢 ${resumen.alertasPorNivel.verde} · 🟡 ${resumen.alertasPorNivel.amarillo} · 🔴 ${resumen.alertasPorNivel.rojo}`}
        />
      </Section>

      <Section title="Historial de recomendaciones">
        {resumen.historial.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Todavía no se ha calculado ninguna recomendación para este lote.
          </ThemedText>
        ) : (
          resumen.historial.map((r, i) => (
            <View key={i} style={styles.fila}>
              <ThemedText type="small" themeColor="textSecondary">
                {r.fecha} · {r.etapaId}
              </ThemedText>
              <ThemedText type="small">
                {r.litrosPorPlantaDia.toFixed(2)} L/planta · ${r.costoDiarioTotal.toFixed(2)}
              </ThemedText>
            </View>
          ))
        )}
      </Section>

      <ThemedText type="small" themeColor="textSecondary">
        Eficiencia, rendimiento real y alertas predictivas requieren registrar la cosecha del lote;
        todavía no hay pantalla para eso en esta versión.
      </ThemedText>
    </FormScreen>
  );
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.fila}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{valor}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
});
