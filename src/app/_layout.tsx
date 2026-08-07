import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from '@/data/db/client';
import { migrations } from '@/data/db/migrations';
import { sembrarFertilizantes } from '@/data/seed/loadCropsAndFertilizers';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success, error } = useMigrations(db, migrations);
  const theme = useTheme();

  useEffect(() => {
    if (success) sembrarFertilizantes(db);
  }, [success]);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="subtitle">No se pudo preparar la base de datos</ThemedText>
        <ThemedText themeColor="textSecondary">{error.message}</ThemedText>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Preparando Chamán NutriFlow…</ThemedText>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerBackTitle: 'Atrás' }}>
        <Stack.Screen name="index" options={{ title: 'Chamán NutriFlow' }} />
        <Stack.Screen name="fertilizantes" options={{ title: 'Fertilizantes' }} />
        <Stack.Screen name="lote/[loteId]/hoy" options={{ title: 'Recomendación diaria' }} />
        <Stack.Screen name="lote/[loteId]/diagnostico" options={{ title: 'Diagnóstico inicial' }} />
        <Stack.Screen name="lote/[loteId]/agronomo" options={{ title: 'Agrónomo virtual' }} />
        <Stack.Screen name="lote/[loteId]/monitoreo" options={{ title: 'Monitoreo' }} />
        <Stack.Screen name="lote/[loteId]/savia" options={{ title: 'Savia' }} />
        <Stack.Screen name="lote/[loteId]/resultados" options={{ title: 'Resultados' }} />
        <Stack.Screen name="(setup)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
});
