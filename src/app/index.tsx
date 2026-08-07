import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { useTheme } from '@/hooks/use-theme';
import { useLoteStore } from '@/state/loteStore';
import { getCropProfile } from '@/domain/crops';
import type { Lote } from '@/data/repositories/loteRepository';

export default function LotesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { lotes, cargarLotes } = useLoteStore();

  useEffect(() => {
    cargarLotes();
  }, [cargarLotes]);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Chamán NutriFlow
        </ThemedText>
        <ThemedText themeColor="textSecondary">Sistema de cálculo hídrico y nutricional</ThemedText>
      </View>

      <FlatList
        data={lotes}
        keyExtractor={(lote) => lote.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText themeColor="textSecondary">
              Todavía no tienes lotes. Crea el primero para calcular su riego y nutrición.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/lote/${item.id}/hoy`)}>
            <LoteCard lote={item} />
          </Pressable>
        )}
      />

      <View style={styles.footer}>
        <PrimaryButton label="+ Nuevo lote" onPress={() => router.push('/(setup)/crear-lote')} />
        <PrimaryButton
          label="Inventario de fertilizantes"
          variant="secondary"
          onPress={() => router.push('/fertilizantes')}
        />
      </View>
    </SafeAreaView>
  );
}

function LoteCard({ lote }: { lote: Lote }) {
  const theme = useTheme();
  let nombreCultivo = lote.cropId;
  try {
    nombreCultivo = getCropProfile(lote.cropId).nombre;
  } catch {
    // cultivo no reconocido (no debería pasar en el MVP); mostramos el id crudo.
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">{lote.nombre}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {nombreCultivo} · {lote.sistemaProduccion} · {lote.areaHa} ha
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 4 },
  title: { fontSize: 28, lineHeight: 34 },
  list: { paddingHorizontal: 20, paddingVertical: 12, gap: 12, flexGrow: 1 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  card: { borderRadius: 14, padding: 16, gap: 4 },
  footer: { padding: 20, gap: 10 },
});
