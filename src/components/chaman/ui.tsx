import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Icono, type NombreIcono } from '@/components/chaman/Icono';
import { useTheme } from '@/hooks/use-theme';

/** Pantalla con scroll, fondo de marca y ancho máximo legible en tablet/web. */
export function Pantalla({ children, edges = ['top'] }: { children: ReactNode; edges?: Edge[] }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={edges}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Encabezado({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <View style={styles.encabezado}>
      <ThemedText style={styles.titulo}>{titulo}</ThemedText>
      {subtitulo ? (
        <ThemedText type="small" themeColor="textSecondary">
          {subtitulo}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function Tarjeta({
  children,
  style,
  onPress,
  acento,
}: {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  /** Color del borde izquierdo, para distinguir tipo/estado. */
  acento?: string;
}) {
  const theme = useTheme();
  const contenido = (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        acento ? { borderLeftColor: acento, borderLeftWidth: 4 } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return contenido;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {contenido}
    </Pressable>
  );
}

export function Indicador({
  etiqueta,
  valor,
  detalle,
  color,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.indicador,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <ThemedText type="small" themeColor="textSecondary">
        {etiqueta}
      </ThemedText>
      <ThemedText style={[styles.indicadorValor, { color: color ?? theme.text }]}>
        {valor}
      </ThemedText>
      {detalle ? (
        <ThemedText type="small" themeColor="textSecondary">
          {detalle}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function FilaIndicadores({ children }: { children: ReactNode }) {
  return <View style={styles.filaIndicadores}>{children}</View>;
}

export function Etiqueta({ texto, color }: { texto: string; color: string }) {
  return (
    <View style={[styles.etiqueta, { backgroundColor: `${color}26`, borderColor: `${color}66` }]}>
      <Text style={[styles.etiquetaTexto, { color }]}>{texto}</Text>
    </View>
  );
}

/** Fila de menú con ícono, título, descripción y flecha. */
export function FilaMenu({
  icono,
  titulo,
  descripcion,
  onPress,
  color,
}: {
  icono: NombreIcono;
  titulo: string;
  descripcion?: string;
  onPress: () => void;
  color?: string;
}) {
  const theme = useTheme();
  const tono = color ?? theme.accent;
  return (
    <Tarjeta onPress={onPress} style={styles.filaMenu}>
      <View style={[styles.filaMenuIcono, { backgroundColor: `${tono}22` }]}>
        <Icono nombre={icono} color={tono} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="smallBold">{titulo}</ThemedText>
        {descripcion ? (
          <ThemedText type="small" themeColor="textSecondary">
            {descripcion}
          </ThemedText>
        ) : null}
      </View>
      <Icono nombre="flecha" color={theme.textSecondary} tamano={18} />
    </Tarjeta>
  );
}

/** Botón compacto con ícono, para acciones secundarias (WhatsApp, compartir, borrar...). */
export function BotonAccion({
  icono,
  texto,
  onPress,
  color,
  disabled,
}: {
  icono: NombreIcono;
  texto: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const tono = color ?? theme.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.botonAccion,
        { backgroundColor: theme.backgroundSelected, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      <Icono nombre={icono} color={tono} tamano={16} />
      <ThemedText type="small" style={{ color: tono }}>
        {texto}
      </ThemedText>
    </Pressable>
  );
}

export function TituloSeccion({ children }: { children: string }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.tituloSeccion}>
      {children.toUpperCase()}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  inner: { padding: 16, gap: 16, maxWidth: 900, width: '100%', alignSelf: 'center' },
  encabezado: { gap: 2, paddingTop: 4 },
  titulo: { fontSize: 28, lineHeight: 34, fontWeight: 800 },
  tarjeta: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  indicador: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 2,
  },
  indicadorValor: { fontSize: 20, lineHeight: 26, fontWeight: 800 },
  filaIndicadores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  etiqueta: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  etiquetaTexto: { fontSize: 12, fontWeight: 700 },
  filaMenu: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filaMenuIcono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tituloSeccion: { letterSpacing: 1, fontSize: 12, marginTop: 4 },
});
