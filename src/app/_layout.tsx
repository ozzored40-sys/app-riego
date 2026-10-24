import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DarkTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from '@/data/db/client';
import { migrations } from '@/data/db/migrations';
import { sembrarFertilizantes } from '@/data/seed/loadCropsAndFertilizers';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Colors } from '@/constants/theme';

const paleta = Colors.dark;

/** Tema de navegación (encabezados, fondos) con la paleta de marca Chamán 4.0. */
const TEMA_NAVEGACION: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: paleta.accent,
    background: paleta.background,
    card: paleta.backgroundElement,
    text: paleta.text,
    border: paleta.border,
    notification: paleta.accent,
  },
};

export default function RootLayout() {
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
        <ThemedText themeColor="textSecondary">Preparando Chamán 4.0…</ThemedText>
      </View>
    );
  }

  return (
    <ThemeProvider value={TEMA_NAVEGACION}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerBackTitle: 'Atrás' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="especialista/[id]" options={{ title: 'Especialista IA' }} />
        <Stack.Screen name="crm/[leadId]" options={{ title: 'Dictamen' }} />
        <Stack.Screen name="catalogo" options={{ title: 'Catálogo Chamán Ozono' }} />
        <Stack.Screen name="calculadora" options={{ title: 'Calculadora O₃ y ROI' }} />
        <Stack.Screen name="marketing" options={{ title: 'Meta Ads y copys' }} />
        <Stack.Screen name="pagos" options={{ title: 'Pagos y facturación' }} />
        <Stack.Screen name="fertilizantes" options={{ title: 'Fertilizantes' }} />
        <Stack.Screen name="lote/[loteId]/hoy" options={{ title: 'Recomendación diaria' }} />
        <Stack.Screen name="lote/[loteId]/diagnostico" options={{ title: 'Diagnóstico inicial' }} />
        <Stack.Screen name="lote/[loteId]/agronomo" options={{ title: 'Agrónomo virtual' }} />
        <Stack.Screen name="lote/[loteId]/ventas" options={{ title: 'Agente de ventas' }} />
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
