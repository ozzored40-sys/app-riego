import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { DocumentoLegalVista } from '@/components/chaman/DocumentoLegalVista';
import { useTheme } from '@/hooks/use-theme';
import { DOCUMENTOS_LEGALES, VERSION_LEGAL, type IdDocumentoLegal } from '@/legal/documentos';

const CONFIRMACIONES = [
  {
    id: 'documentos',
    texto: 'Leí y acepto los Términos y Condiciones y el Aviso de Privacidad.',
  },
  {
    id: 'orientativo',
    texto:
      'Entiendo que las recomendaciones, dosis y respuestas de IA son orientativas, que no sustituyen a un ingeniero agrónomo y que debo seguir la etiqueta del producto.',
  },
  { id: 'edad', texto: 'Soy mayor de 18 años.' },
] as const;

/**
 * Pantalla obligatoria antes de usar la app (y de nuevo cada vez que cambia VERSION_LEGAL).
 * No se puede continuar sin marcar las tres confirmaciones.
 */
export function AceptacionLegal({ onAceptar }: { onAceptar: () => void }) {
  const theme = useTheme();
  const [marcadas, setMarcadas] = useState<Record<string, boolean>>({});
  const [abierto, setAbierto] = useState<IdDocumentoLegal | null>(null);
  const todas = CONFIRMACIONES.every((c) => marcadas[c.id]);

  if (abierto) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.contenido}>
          <DocumentoLegalVista documento={DOCUMENTOS_LEGALES[abierto]} />
          <PrimaryButton label="Volver" variant="secondary" onPress={() => setAbierto(null)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={[styles.logo, { backgroundColor: theme.accent }]}>
          <ThemedText style={styles.logoTexto}>O₃</ThemedText>
        </View>
        <ThemedText style={styles.titulo}>Bienvenido a Chamán 4.0</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Antes de empezar, revisa y acepta las condiciones de uso (versión {VERSION_LEGAL}).
        </ThemedText>

        <View
          style={[
            styles.aviso,
            { borderColor: theme.warning, backgroundColor: `${theme.warning}1a` },
          ]}
        >
          {DOCUMENTOS_LEGALES['uso-responsable'].secciones[0].parrafos.slice(0, 4).map((p) => (
            <ThemedText key={p} type="small">
              {p}
            </ThemedText>
          ))}
        </View>

        <View style={styles.enlaces}>
          {(['terminos', 'privacidad', 'uso-responsable'] as const).map((id) => (
            <Pressable key={id} onPress={() => setAbierto(id)}>
              <ThemedText type="smallBold" style={{ color: theme.accentSecondary }}>
                Leer {DOCUMENTOS_LEGALES[id].titulo} ›
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {CONFIRMACIONES.map((c) => {
          const marcada = Boolean(marcadas[c.id]);
          return (
            <Pressable
              key={c.id}
              onPress={() => setMarcadas((prev) => ({ ...prev, [c.id]: !marcada }))}
              style={styles.fila}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: marcada }}
            >
              <View
                style={[
                  styles.casilla,
                  {
                    borderColor: marcada ? theme.accent : theme.textSecondary,
                    backgroundColor: marcada ? theme.accent : 'transparent',
                  },
                ]}
              >
                {marcada ? <ThemedText style={styles.palomita}>✓</ThemedText> : null}
              </View>
              <ThemedText type="small" style={styles.flex}>
                {c.texto}
              </ThemedText>
            </Pressable>
          );
        })}

        <PrimaryButton label="Aceptar y continuar" onPress={onAceptar} disabled={!todas} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contenido: { padding: 20, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' },
  logo: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logoTexto: { color: '#ffffff', fontWeight: 800, fontSize: 20 },
  titulo: { fontSize: 26, lineHeight: 32, fontWeight: 800 },
  aviso: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  enlaces: { gap: 10 },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  casilla: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  palomita: { color: '#ffffff', fontWeight: 800, fontSize: 14, lineHeight: 18 },
});
