import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { LabeledInput } from '@/components/form/LabeledInput';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { useTheme } from '@/hooks/use-theme';
import { db } from '@/data/db/client';
import {
  listarInventarioFertilizantes,
  actualizarStockFertilizante,
  actualizarPrecioFertilizante,
  type FertilizerInventoryItem,
} from '@/data/repositories/fertilizerInventoryRepository';
import { MACRO_NUTRIENTS } from '@/domain/types/nutrients';

export default function FertilizantesScreen() {
  const theme = useTheme();
  const [inventario, setInventario] = useState<FertilizerInventoryItem[]>([]);

  function recargar() {
    setInventario(listarInventarioFertilizantes(db));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial única desde SQLite
    recargar();
  }, []);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <FlatList
        data={inventario}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedText themeColor="textSecondary" style={styles.headerNote}>
            Biblioteca de fertilizantes. Ajusta existencias y precio; la composición y el tambo
            asignado vienen de la ficha técnica.
          </ThemedText>
        }
        renderItem={({ item }) => <FertilizerRow item={item} onSaved={recargar} />}
      />
    </SafeAreaView>
  );
}

function FertilizerRow({ item, onSaved }: { item: FertilizerInventoryItem; onSaved: () => void }) {
  const theme = useTheme();
  const [stock, setStock] = useState(String(item.stockKg));
  const [precio, setPrecio] = useState(String(item.costoPorKg));

  const composicion = MACRO_NUTRIENTS.filter((n) => (item.composicionPct[n] ?? 0) > 0)
    .map((n) => `${n} ${item.composicionPct[n]}%`)
    .join(' · ');

  function guardar() {
    const nuevoStock = Number(stock);
    const nuevoPrecio = Number(precio);
    if (Number.isFinite(nuevoStock)) actualizarStockFertilizante(db, item.id, nuevoStock);
    if (Number.isFinite(nuevoPrecio)) actualizarPrecioFertilizante(db, item.id, nuevoPrecio);
    onSaved();
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.cardHeader}>
        <ThemedText type="smallBold">{item.nombre}</ThemedText>
        <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="small">Tambo {item.categoriaTanque}</ThemedText>
        </View>
      </View>
      {composicion ? (
        <ThemedText type="small" themeColor="textSecondary">
          {composicion}
        </ThemedText>
      ) : null}
      <View style={styles.row}>
        <View style={styles.field}>
          <LabeledInput
            label="Existencias"
            value={stock}
            onChangeText={setStock}
            keyboardType="decimal-pad"
            suffix="kg"
          />
        </View>
        <View style={styles.field}>
          <LabeledInput
            label="Precio"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="decimal-pad"
            suffix="$/kg"
          />
        </View>
      </View>
      <PrimaryButton label="Guardar" onPress={guardar} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 16, gap: 12 },
  headerNote: { marginBottom: 4 },
  card: { borderRadius: 14, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
});
