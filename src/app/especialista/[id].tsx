import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Icono } from '@/components/chaman/Icono';
import { TextoEnriquecido } from '@/components/chaman/TextoEnriquecido';
import { BotonAccion } from '@/components/chaman/ui';
import { useTheme } from '@/hooks/use-theme';
import { db } from '@/data/db/client';
import type { SpecialistMessage } from '@/data/repositories/specialistMessageRepository';
import {
  enviarTurnoEspecialista,
  obtenerHistorialEspecialista,
  reiniciarConversacionEspecialista,
} from '@/state/specialistService';
import { especialistasConfigurados } from '@/services/specialistClient';
import { obtenerEspecialista, type IdEspecialista } from '@/domain/chaman';

export default function ChatEspecialistaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const especialista = obtenerEspecialista(id ?? '');
  const listaRef = useRef<FlatList<SpecialistMessage>>(null);

  const [mensajes, setMensajes] = useState<SpecialistMessage[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configurado = especialistasConfigurados();

  useEffect(() => {
    if (especialista) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial única desde SQLite
      setMensajes(obtenerHistorialEspecialista(db, especialista.id));
    }
  }, [especialista]);

  const desplazarAlFinal = useCallback(() => {
    requestAnimationFrame(() => listaRef.current?.scrollToEnd({ animated: true }));
  }, []);

  if (!especialista) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
        <ThemedText style={styles.padded}>Especialista no encontrado.</ThemedText>
      </SafeAreaView>
    );
  }
  const idEspecialista: IdEspecialista = especialista.id;

  async function enviar(contenido: string) {
    const mensaje = contenido.trim();
    if (!mensaje || enviando) return;
    setTexto('');
    setError(null);
    setEnviando(true);
    // Muestra el mensaje del usuario de inmediato mientras responde el especialista.
    setMensajes((prev) => [
      ...prev,
      {
        id: 'pendiente',
        especialistaId: idEspecialista,
        rol: 'user',
        contenido: mensaje,
        createdAt: '',
      },
    ]);
    desplazarAlFinal();
    try {
      await enviarTurnoEspecialista(db, idEspecialista, mensaje);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el mensaje');
    } finally {
      setMensajes(obtenerHistorialEspecialista(db, idEspecialista));
      setEnviando(false);
      desplazarAlFinal();
    }
  }

  function reiniciar() {
    reiniciarConversacionEspecialista(db, idEspecialista);
    setMensajes([]);
    setError(null);
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: especialista.nombre }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listaRef}
          data={mensajes}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.lista}
          onContentSizeChange={desplazarAlFinal}
          ListHeaderComponent={
            <View style={styles.intro}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: `${especialista.color}26`, borderColor: especialista.color },
                ]}
              >
                <ThemedText style={[styles.siglas, { color: especialista.color }]}>
                  {especialista.siglas}
                </ThemedText>
              </View>
              <ThemedText type="smallBold" style={{ color: especialista.color }}>
                {especialista.titulo}
              </ThemedText>
              <View
                style={[
                  styles.burbuja,
                  styles.burbujaAsistente,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
              >
                <ThemedText type="small">{especialista.saludo}</ThemedText>
              </View>
              {mensajes.length === 0 && configurado ? (
                <View style={styles.sugerencias}>
                  {especialista.preguntasSugeridas.map((pregunta) => (
                    <Pressable
                      key={pregunta}
                      onPress={() => enviar(pregunta)}
                      style={[styles.sugerencia, { borderColor: especialista.color }]}
                    >
                      <ThemedText type="small" style={{ color: especialista.color }}>
                        {pregunta}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) =>
            item.rol === 'user' ? (
              <View
                style={[styles.burbuja, styles.burbujaUsuario, { backgroundColor: theme.accent }]}
              >
                <ThemedText type="small" style={{ color: theme.onAccent }}>
                  {item.contenido}
                </ThemedText>
              </View>
            ) : (
              <View
                style={[
                  styles.burbuja,
                  styles.burbujaAsistente,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
              >
                <TextoEnriquecido texto={item.contenido} />
              </View>
            )
          }
          ListFooterComponent={
            enviando ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.escribiendo}>
                {especialista.nombre} está escribiendo…
              </ThemedText>
            ) : null
          }
        />

        {error ? (
          <ThemedText type="small" style={[styles.padded, { color: theme.danger }]}>
            {error}
          </ThemedText>
        ) : null}

        {configurado ? (
          <View
            style={[
              styles.entrada,
              { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
            ]}
          >
            <View style={styles.accionesFila}>
              <BotonAccion
                icono="reiniciar"
                texto="Nueva conversación"
                onPress={reiniciar}
                disabled={enviando || mensajes.length === 0}
              />
            </View>
            <View style={styles.filaEntrada}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder="Escribe tu consulta…"
                placeholderTextColor={theme.textSecondary}
                multiline
                style={[
                  styles.campo,
                  { color: theme.text, backgroundColor: theme.backgroundSelected },
                ]}
              />
              <Pressable
                onPress={() => enviar(texto)}
                disabled={enviando || texto.trim() === ''}
                style={[
                  styles.botonEnviar,
                  {
                    backgroundColor: theme.accent,
                    opacity: enviando || texto.trim() === '' ? 0.5 : 1,
                  },
                ]}
                accessibilityLabel="Enviar"
              >
                <Icono nombre="enviar" color={theme.onAccent} tamano={20} />
              </Pressable>
            </View>
          </View>
        ) : (
          <ThemedText type="small" themeColor="textSecondary" style={styles.padded}>
            Chat no disponible: falta configurar el backend de IA en esta instalación.
          </ThemedText>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: 16 },
  lista: { padding: 16, gap: 10, maxWidth: 800, width: '100%', alignSelf: 'center' },
  intro: { alignItems: 'center', gap: 8, marginBottom: 6 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siglas: { fontSize: 15, fontWeight: 800 },
  sugerencias: { gap: 8, alignSelf: 'stretch' },
  sugerencia: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  burbuja: { borderRadius: 16, padding: 12, maxWidth: '92%' },
  burbujaUsuario: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  burbujaAsistente: { alignSelf: 'flex-start', borderWidth: 1, borderBottomLeftRadius: 4 },
  escribiendo: { paddingVertical: 6 },
  entrada: { borderTopWidth: 1, padding: 10, gap: 8 },
  accionesFila: { flexDirection: 'row' },
  filaEntrada: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  campo: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  botonEnviar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
