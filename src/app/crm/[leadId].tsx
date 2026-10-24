import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { LabeledInput } from '@/components/form/LabeledInput';
import {
  BotonAccion,
  Etiqueta,
  FilaIndicadores,
  Indicador,
  Pantalla,
  Tarjeta,
  TituloSeccion,
} from '@/components/chaman/ui';
import { TextoEnriquecido } from '@/components/chaman/TextoEnriquecido';
import { BotonReportarIa } from '@/components/chaman/BotonReportarIa';
import { useTheme } from '@/hooks/use-theme';
import { IMAGENES_PRODUCTO } from '@/constants/chamanImages';
import { db } from '@/data/db/client';
import {
  actualizarEtapaLead,
  actualizarNotasLead,
  borrarLead,
  obtenerLead,
  type Lead,
} from '@/data/repositories/leadRepository';
import { generarProtocoloIa } from '@/state/specialistService';
import { LEYENDA_IA, LEYENDA_ORIENTATIVA } from '@/legal/documentos';
import { especialistasConfigurados } from '@/services/specialistClient';
import {
  enlaceWhatsApp,
  formatoMxn,
  infoEtapa,
  obtenerProducto,
  ETAPAS_PIPELINE,
  ETIQUETA_METODO,
  type ClaveProducto,
  type EtapaPipeline,
  type MetodoAplicacion,
} from '@/domain/chaman';

export default function DictamenScreen() {
  const { leadId } = useLocalSearchParams<{ leadId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [lead, setLead] = useState<Lead | undefined>(() =>
    leadId ? obtenerLead(db, leadId) : undefined,
  );
  const [notas, setNotas] = useState(lead?.notas ?? '');
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!lead || !leadId) {
    return (
      <Pantalla edges={['bottom']}>
        <ThemedText>No se encontró el dictamen.</ThemedText>
      </Pantalla>
    );
  }

  const etapa = infoEtapa(lead.etapa as EtapaPipeline);
  const producto = obtenerProducto(lead.productoClave as ClaveProducto);
  const recargar = () => setLead(obtenerLead(db, leadId));

  function cambiarEtapa(nueva: EtapaPipeline) {
    actualizarEtapaLead(db, leadId, nueva);
    recargar();
  }

  function guardarNotas() {
    actualizarNotasLead(db, leadId, notas.trim());
    recargar();
  }

  async function pedirProtocolo() {
    setError(null);
    setGenerando(true);
    try {
      await generarProtocoloIa(db, leadId);
      recargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el protocolo');
    } finally {
      setGenerando(false);
    }
  }

  function textoParaCompartir(): string {
    return lead!.protocoloIa
      ? `${lead!.dictamenTexto}\n\n— Protocolo ampliado generado por IA (verifíquelo antes de aplicar) —\n${lead!.protocoloIa}`
      : lead!.dictamenTexto;
  }

  function eliminar() {
    const confirmar = () => {
      borrarLead(db, leadId);
      router.back();
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('¿Eliminar este dictamen del CRM?')) confirmar();
      return;
    }
    Alert.alert('Eliminar dictamen', '¿Eliminar este dictamen del CRM? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: confirmar },
    ]);
  }

  return (
    <Pantalla edges={['bottom']}>
      <Tarjeta acento={etapa.color}>
        <View style={styles.fila}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            {lead.folio} ·{' '}
            {new Date(lead.createdAt).toLocaleDateString('es-MX', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </ThemedText>
          <Etiqueta texto={etapa.nombre} color={etapa.color} />
        </View>
        <ThemedText style={styles.titulo}>{lead.productor}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {lead.cultivoNombre} · {lead.superficieHa} ha
          {lead.ubicacion ? ` · ${lead.ubicacion}` : ''}
          {lead.telefono ? ` · Tel. ${lead.telefono}` : ''}
        </ThemedText>
        <ThemedText type="small">
          {lead.problema} — severidad {lead.severidad}
        </ThemedText>
        <View style={styles.acciones}>
          <BotonAccion
            icono="whatsapp"
            texto={lead.telefono ? 'Enviar al productor' : 'Enviar por WhatsApp'}
            color={theme.accent}
            onPress={() =>
              Linking.openURL(enlaceWhatsApp(textoParaCompartir(), lead.telefono ?? undefined))
            }
          />
          <BotonAccion
            icono="compartir"
            texto="Compartir"
            onPress={() => Share.share({ message: textoParaCompartir(), title: lead.folio })}
          />
        </View>
      </Tarjeta>

      <TituloSeccion>Prescripción</TituloSeccion>
      <Tarjeta style={styles.producto}>
        <Image source={IMAGENES_PRODUCTO[producto.imagen]} style={styles.foto} contentFit="cover" />
        <View style={styles.flex}>
          <ThemedText type="smallBold">{lead.productoNombre}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {producto.formula}
          </ThemedText>
        </View>
      </Tarjeta>
      <FilaIndicadores>
        <Indicador etiqueta="Dosis" valor={`${lead.dosisLHa} L/ha`} detalle={producto.dilucion} />
        <Indicador
          etiqueta="Ozono disuelto"
          valor={`${lead.ppmOzono} ppm`}
          color={theme.accentSecondary}
        />
        <Indicador
          etiqueta="Método"
          valor={ETIQUETA_METODO[lead.metodo as MetodoAplicacion].split(' ')[0]}
          detalle={ETIQUETA_METODO[lead.metodo as MetodoAplicacion]}
        />
        <Indicador
          etiqueta="Aplicaciones"
          valor={String(lead.aplicaciones)}
          detalle={`${lead.productoTotalLitros} L de producto`}
        />
        <Indicador
          etiqueta="Agua portadora"
          valor={`${lead.aguaPortadoraLHa.toLocaleString('es-MX')} L/ha`}
        />
        <Indicador
          etiqueta="Inversión estimada"
          valor={formatoMxn(lead.costoEstimadoMxn)}
          detalle={
            lead.ahorroEstimadoMxn > 0
              ? `Ahorro est. ${formatoMxn(lead.ahorroEstimadoMxn)}`
              : 'Sin ahorro estimado'
          }
          color={theme.accent}
        />
      </FilaIndicadores>
      <ThemedText type="small" themeColor="textSecondary">
        {producto.frecuencia}. {producto.intervaloSeguridad}.
      </ThemedText>
      <Tarjeta acento={theme.warning}>
        <ThemedText type="small">⚠️ {LEYENDA_ORIENTATIVA}</ThemedText>
      </Tarjeta>

      <TituloSeccion>Protocolo ampliado con IA</TituloSeccion>
      <Tarjeta>
        {lead.protocoloIa ? (
          <>
            <TextoEnriquecido texto={lead.protocoloIa} />
            <BotonReportarIa origen="protocolo-ia" contenido={lead.protocoloIa} />
            <ThemedText type="small" themeColor="textSecondary">
              ⚠️ {LEYENDA_IA}
            </ThemedText>
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            La Dra. Athena (especialista IA) puede redactar el protocolo técnico completo a partir
            de este dictamen: diagnóstico probable, calendario, manejo de suelo y precauciones.
          </ThemedText>
        )}
        {error ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ) : null}
        {especialistasConfigurados() ? (
          <PrimaryButton
            label={lead.protocoloIa ? 'Regenerar protocolo' : 'Generar protocolo con IA'}
            onPress={pedirProtocolo}
            loading={generando}
            variant={lead.protocoloIa ? 'secondary' : 'primary'}
          />
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            (Requiere configurar el backend de IA: EXPO_PUBLIC_AGRONOMIST_API_URL y
            EXPO_PUBLIC_AGRONOMIST_APP_KEY.)
          </ThemedText>
        )}
      </Tarjeta>

      <TituloSeccion>Seguimiento comercial</TituloSeccion>
      <View style={styles.etapas}>
        {ETAPAS_PIPELINE.map((e) => {
          const activa = e.etapa === lead.etapa;
          return (
            <Pressable
              key={e.etapa}
              onPress={() => cambiarEtapa(e.etapa)}
              style={[
                styles.etapa,
                {
                  backgroundColor: activa ? `${e.color}26` : theme.backgroundSelected,
                  borderColor: activa ? e.color : 'transparent',
                },
              ]}
            >
              <ThemedText type="smallBold" style={{ color: activa ? e.color : theme.text }}>
                {e.nombre}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {e.descripcion}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <LabeledInput label="Notas de seguimiento" value={notas} onChangeText={setNotas} multiline />
      <PrimaryButton
        label="Guardar notas"
        variant="secondary"
        onPress={guardarNotas}
        disabled={notas.trim() === (lead.notas ?? '')}
      />

      <View style={styles.acciones}>
        <BotonAccion
          icono="borrar"
          texto="Eliminar dictamen"
          color={theme.danger}
          onPress={eliminar}
        />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontSize: 22, lineHeight: 28, fontWeight: 800 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  producto: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  foto: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#ffffff' },
  etapas: { gap: 8 },
  etapa: { borderRadius: 12, borderWidth: 1.5, padding: 12, gap: 2 },
});
