import { useState } from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LabeledInput } from '@/components/form/LabeledInput';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { SegmentedSelect } from '@/components/form/SegmentedSelect';
import { Section } from '@/components/form/Section';
import { BotonAccion, Etiqueta, Pantalla, Tarjeta, TituloSeccion } from '@/components/chaman/ui';
import { TextoEnriquecido } from '@/components/chaman/TextoEnriquecido';
import { useTheme } from '@/hooks/use-theme';
import { generarCopyAnuncio } from '@/state/specialistService';
import { especialistasConfigurados } from '@/services/specialistClient';
import {
  enlaceWhatsApp,
  formatoMxn,
  textoCompletoAnuncio,
  PLANTILLAS_ANUNCIOS,
} from '@/domain/chaman';

const PLATAFORMAS = ['Facebook e Instagram', 'TikTok', 'Difusión por WhatsApp'] as const;
type Plataforma = (typeof PLATAFORMAS)[number];

export default function MarketingScreen() {
  const theme = useTheme();
  const [cultivo, setCultivo] = useState('Berries (fresa y arándano)');
  const [problema, setProblema] = useState('Pérdidas por hongos y rechazos en frontera');
  const [plataforma, setPlataforma] = useState<Plataforma>('Facebook e Instagram');
  const [generado, setGenerado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setError(null);
    setCargando(true);
    try {
      setGenerado(await generarCopyAnuncio({ cultivo, problema, plataforma }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el anuncio');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Pantalla edges={['bottom']}>
      {especialistasConfigurados() ? (
        <Section
          title="Redactor con IA"
          subtitle="Escribe un anuncio a la medida del cultivo y su dolor."
        >
          <LabeledInput label="Cultivo / audiencia" value={cultivo} onChangeText={setCultivo} />
          <LabeledInput label="Problema principal" value={problema} onChangeText={setProblema} />
          <SegmentedSelect
            label="Plataforma"
            value={plataforma}
            onChange={setPlataforma}
            options={PLATAFORMAS.map((p) => ({ value: p, label: p }))}
          />
          <PrimaryButton
            label="Generar anuncio"
            onPress={generar}
            loading={cargando}
            disabled={!cultivo.trim() || !problema.trim()}
          />
          {error ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {error}
            </ThemedText>
          ) : null}
          {generado ? (
            <View style={[styles.generado, { backgroundColor: theme.backgroundSelected }]}>
              <TextoEnriquecido texto={generado} />
              <View style={styles.acciones}>
                <BotonAccion
                  icono="compartir"
                  texto="Compartir / copiar"
                  onPress={() => Share.share({ message: generado })}
                />
              </View>
            </View>
          ) : null}
        </Section>
      ) : null}

      <TituloSeccion>Plantillas listas</TituloSeccion>
      {PLANTILLAS_ANUNCIOS.map((anuncio) => (
        <Tarjeta key={anuncio.id}>
          <View style={styles.fila}>
            <ThemedText type="smallBold" style={styles.flex}>
              {anuncio.titulo}
            </ThemedText>
            <Etiqueta texto={anuncio.categoria} color="#ec4899" />
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {anuncio.cultivo}
          </ThemedText>
          <ThemedText type="smallBold">{anuncio.gancho}</ThemedText>
          <ThemedText type="small">{anuncio.cuerpo}</ThemedText>
          <ThemedText type="small" style={{ color: theme.accent }}>
            {anuncio.llamadoAccion}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Audiencia: {anuncio.audiencia} · Presupuesto sugerido{' '}
            {formatoMxn(anuncio.presupuestoDiarioMxn)}/día
          </ThemedText>
          <View style={styles.acciones}>
            <BotonAccion
              icono="compartir"
              texto="Compartir / copiar"
              onPress={() => Share.share({ message: textoCompletoAnuncio(anuncio) })}
            />
            <BotonAccion
              icono="whatsapp"
              texto="Difundir"
              color={theme.accent}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/?text=${encodeURIComponent(textoCompletoAnuncio(anuncio))}`,
                )
              }
            />
          </View>
        </Tarjeta>
      ))}

      <Tarjeta>
        <ThemedText type="small" themeColor="textSecondary">
          ¿Quieres que el equipo Chamán lance la campaña por ti? Escríbenos.
        </ThemedText>
        <View style={styles.acciones}>
          <BotonAccion
            icono="whatsapp"
            texto="Hablar con marketing"
            color={theme.accent}
            onPress={() =>
              Linking.openURL(
                enlaceWhatsApp('Hola, quiero apoyo para una campaña de Meta Ads de Chamán 4.0.'),
              )
            }
          />
        </View>
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  generado: { borderRadius: 12, padding: 12, gap: 8 },
});
