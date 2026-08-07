import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { LabeledInput } from '@/components/form/LabeledInput';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { useTheme } from '@/hooks/use-theme';
import { db } from '@/data/db/client';
import { obtenerLote } from '@/data/repositories/loteRepository';
import { listarInventarioFertilizantes } from '@/data/repositories/fertilizerInventoryRepository';
import type { ChatMessage } from '@/data/repositories/chatMessageRepository';
import {
  obtenerHistorialChat,
  enviarTurnoChat,
  enviarFotoChat,
  reiniciarConversacion,
} from '@/state/agronomistService';
import { sugerirInsumosPorTexto } from '@/state/insumoSuggestion';
import { asistenteConfigurado } from '@/services/agronomistClient';
import { tomarFotoConCamara, elegirFotoDeGaleria } from '@/services/photoCapture';
import type { CategoriaInsumo, FertilizerProduct } from '@/domain/types/fertilizer';

const ETIQUETA_CATEGORIA_INSUMO: Record<CategoriaInsumo, string> = {
  fertilizante: 'Fertilizante',
  enraizador: 'Enraizador',
  mejoradorSuelo: 'Mejorador de suelo',
  biologico: 'Biológico',
  foliar: 'Foliar',
  bioestimulante: 'Bioestimulante',
  ozonoChaman: 'Ozono Chamán',
  otro: 'Otro',
};

export default function AgronomoScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const listaRef = useRef<FlatList<ChatMessage>>(null);

  const lote = useMemo(() => (loteId ? obtenerLote(db, loteId) : undefined), [loteId]);
  const catalogo = useMemo(() => listarInventarioFertilizantes(db), []);

  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configurado = asistenteConfigurado();

  useEffect(() => {
    if (loteId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial única desde SQLite
      setMensajes(obtenerHistorialChat(db, loteId));
    }
  }, [loteId]);

  const desplazarAlFinal = useCallback(() => {
    requestAnimationFrame(() => listaRef.current?.scrollToEnd({ animated: true }));
  }, []);

  async function enviar() {
    const mensajeUsuario = texto.trim();
    if (!mensajeUsuario || !loteId || enviando) return;
    setTexto('');
    setError(null);
    setEnviando(true);
    try {
      await enviarTurnoChat(db, loteId, mensajeUsuario);
      setMensajes(obtenerHistorialChat(db, loteId));
      desplazarAlFinal();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  }

  async function adjuntarFoto(origen: 'camara' | 'galeria') {
    if (!loteId || enviando) return;
    setError(null);
    try {
      const foto = origen === 'camara' ? await tomarFotoConCamara() : await elegirFotoDeGaleria();
      if (!foto) return;
      setEnviando(true);
      await enviarFotoChat(db, loteId, foto, texto.trim() || undefined);
      setTexto('');
      setMensajes(obtenerHistorialChat(db, loteId));
      desplazarAlFinal();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la foto');
    } finally {
      setEnviando(false);
    }
  }

  function reiniciar() {
    if (!loteId) return;
    reiniciarConversacion(db, loteId);
    setMensajes([]);
    setError(null);
  }

  if (!lote || !loteId) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
        <ThemedText style={styles.padded}>No se encontró el lote.</ThemedText>
      </SafeAreaView>
    );
  }

  if (!configurado) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
        <View style={styles.padded}>
          <ThemedText type="subtitle">Agrónomo virtual no disponible</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8 }}>
            Esta instalación de la app todavía no tiene configurado el asistente de IA (faltan las
            variables EXPO_PUBLIC_AGRONOMIST_API_URL / EXPO_PUBLIC_AGRONOMIST_APP_KEY). Mientras
            tanto puedes usar el diagnóstico inicial por reglas.
          </ThemedText>
          <View style={{ marginTop: 16 }}>
            <PrimaryButton
              label="Ir a diagnóstico por reglas"
              onPress={() => router.push(`/lote/${loteId}/diagnostico`)}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['bottom']}>
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
            mensajes.length === 0 ? (
              <View style={styles.intro}>
                <ThemedText type="subtitle">Agrónomo virtual</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Cuéntale qué observas en el cultivo de {lote.nombre}. Te hará preguntas para
                  precisar el diagnóstico y te propondrá actividades y protocolos. También puedes
                  adjuntar una foto de la planta.
                </ThemedText>
              </View>
            ) : null
          }
          renderItem={({ item }) => <Burbuja mensaje={item} catalogo={catalogo} />}
        />

        {error ? (
          <ThemedText type="small" style={[styles.padded, { color: '#c0392b' }]}>
            {error}
          </ThemedText>
        ) : null}

        <View style={[styles.entrada, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.accionesRow}>
            <Pressable
              onPress={() => adjuntarFoto('camara')}
              disabled={enviando}
              style={[styles.accionBoton, { backgroundColor: theme.backgroundSelected }]}
            >
              <ThemedText type="small">📷 Foto</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => adjuntarFoto('galeria')}
              disabled={enviando}
              style={[styles.accionBoton, { backgroundColor: theme.backgroundSelected }]}
            >
              <ThemedText type="small">🖼️ Galería</ThemedText>
            </Pressable>
            <Pressable
              onPress={reiniciar}
              disabled={enviando || mensajes.length === 0}
              style={[styles.accionBoton, { backgroundColor: theme.backgroundSelected }]}
            >
              <ThemedText type="small">🔄 Reiniciar</ThemedText>
            </Pressable>
          </View>
          <View style={styles.filaEntrada}>
            <View style={styles.campoTexto}>
              <LabeledInput
                label="Mensaje"
                value={texto}
                onChangeText={setTexto}
                placeholder="Describe lo que ves en el cultivo…"
              />
            </View>
            <View style={styles.botonEnviar}>
              <PrimaryButton
                label={enviando ? '…' : 'Enviar'}
                onPress={enviar}
                loading={enviando}
                disabled={!texto.trim()}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Burbuja({ mensaje, catalogo }: { mensaje: ChatMessage; catalogo: FertilizerProduct[] }) {
  const theme = useTheme();
  const esUsuario = mensaje.rol === 'user';
  const sugerencias = esUsuario ? [] : sugerirInsumosPorTexto(mensaje.contenido, catalogo);

  return (
    <View style={[styles.burbujaFila, esUsuario ? styles.filaUsuario : styles.filaAsistente]}>
      <View
        style={[
          styles.burbuja,
          {
            backgroundColor: esUsuario ? theme.text : theme.backgroundElement,
          },
        ]}
      >
        <ThemedText type="small" style={{ color: esUsuario ? theme.background : theme.text }}>
          {mensaje.contenido}
        </ThemedText>
        {sugerencias.length > 0 ? (
          <View style={[styles.sugerenciasBox, { borderTopColor: theme.backgroundSelected }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Insumos de tu catálogo que podrían aplicar:
            </ThemedText>
            {sugerencias.slice(0, 4).map((insumo) => (
              <View key={insumo.id} style={styles.sugerenciaFila}>
                <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="small">
                    {ETIQUETA_CATEGORIA_INSUMO[insumo.categoriaInsumo]}
                  </ThemedText>
                </View>
                <ThemedText type="small">{insumo.nombre}</ThemedText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: 20 },
  intro: { gap: 6, paddingHorizontal: 4, paddingBottom: 12 },
  lista: { padding: 16, gap: 10, flexGrow: 1 },
  burbujaFila: { flexDirection: 'row' },
  filaUsuario: { justifyContent: 'flex-end' },
  filaAsistente: { justifyContent: 'flex-start' },
  burbuja: { maxWidth: '85%', borderRadius: 14, padding: 12, gap: 8 },
  sugerenciasBox: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 6 },
  sugerenciaFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  entrada: { padding: 12, gap: 10 },
  accionesRow: { flexDirection: 'row', gap: 8 },
  accionBoton: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  filaEntrada: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  campoTexto: { flex: 1 },
  botonEnviar: { width: 90 },
});
