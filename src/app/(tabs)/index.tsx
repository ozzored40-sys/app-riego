import { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import {
  BotonAccion,
  FilaIndicadores,
  FilaMenu,
  Indicador,
  Pantalla,
  Tarjeta,
  TituloSeccion,
} from '@/components/chaman/ui';
import { useTheme } from '@/hooks/use-theme';
import { IMAGEN_HERO } from '@/constants/chamanImages';
import { db } from '@/data/db/client';
import { listarLeads, type Lead } from '@/data/repositories/leadRepository';
import { resumenCrm, type ResumenCrm } from '@/state/crmService';
import { useLoteStore } from '@/state/loteStore';
import {
  CONTACTO_CHAMAN,
  enlaceWhatsApp,
  formatoMxn,
  infoEtapa,
  type EtapaPipeline,
} from '@/domain/chaman';

export default function InicioScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { lotes, cargarLotes } = useLoteStore();
  const [resumen, setResumen] = useState<ResumenCrm | null>(null);
  const [recientes, setRecientes] = useState<Lead[]>([]);

  useFocusEffect(
    useCallback(() => {
      const leads = listarLeads(db);
      setResumen(resumenCrm(leads));
      setRecientes(leads.slice(0, 3));
      cargarLotes();
    }, [cargarLotes]),
  );

  return (
    <Pantalla>
      <View style={styles.hero}>
        <Image source={IMAGEN_HERO} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={[StyleSheet.absoluteFill, styles.heroVelo]} />
        <View style={styles.heroContenido}>
          <View style={styles.marca}>
            <View style={[styles.logo, { backgroundColor: theme.accent }]}>
              <ThemedText style={styles.logoTexto}>O₃</ThemedText>
            </View>
            <View>
              <ThemedText type="smallBold">CHAMÁN AGRO SOLUCIONES</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Centro de Comando 4.0
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.heroTitulo}>
            Diagnóstico, riego y ventas en una sola app
          </ThemedText>
          <ThemedText type="small" style={styles.heroTexto}>
            Genera dictámenes con folio, consulta a especialistas IA, calcula fertirriego y da
            seguimiento a tus productores.
          </ThemedText>
          <View style={styles.heroBotones}>
            <View style={styles.flex}>
              <PrimaryButton
                label="Nuevo diagnóstico"
                onPress={() => router.push('/diagnostico')}
              />
            </View>
          </View>
        </View>
      </View>

      <TituloSeccion>Resumen</TituloSeccion>
      <FilaIndicadores>
        <Indicador
          etiqueta="Prospectos"
          valor={String(resumen?.totalLeads ?? 0)}
          detalle={`${resumen?.hectareas ?? 0} ha diagnosticadas`}
        />
        <Indicador
          etiqueta="Pipeline abierto"
          valor={formatoMxn(resumen?.pipelineAbiertoMxn ?? 0)}
          detalle="N1 a N3, estimado"
          color={theme.accentSecondary}
        />
        <Indicador
          etiqueta="Ventas cerradas"
          valor={formatoMxn(resumen?.ventaCerradaMxn ?? 0)}
          detalle={`Conversión ${resumen?.tasaConversionPct ?? 0}%`}
          color={theme.accent}
        />
        <Indicador
          etiqueta="Lotes en campo"
          valor={String(lotes.length)}
          detalle="Riego y nutrición"
          color={theme.warning}
        />
      </FilaIndicadores>

      <TituloSeccion>Accesos rápidos</TituloSeccion>
      <View style={styles.lista}>
        <FilaMenu
          icono="especialistas"
          titulo="Especialistas IA"
          descripcion="Fitopatología, raíz, frutos, agave, rentabilidad y soporte."
          onPress={() => router.push('/especialistas')}
          color={theme.accentSecondary}
        />
        <FilaMenu
          icono="campo"
          titulo="Riego y nutrición"
          descripcion="Lotes, recomendación diaria y agrónomo virtual."
          onPress={() => router.push('/campo')}
        />
        <FilaMenu
          icono="calculadora"
          titulo="Calculadora O₃ y ROI"
          descripcion="Dimensiona el generador y el retorno de inversión."
          onPress={() => router.push('/calculadora')}
          color={theme.warning}
        />
        <FilaMenu
          icono="catalogo"
          titulo="Catálogo de productos"
          descripcion="Fichas técnicas de la línea Chamán Ozono."
          onPress={() => router.push('/catalogo')}
          color="#a855f7"
        />
      </View>

      {recientes.length > 0 ? (
        <>
          <TituloSeccion>Últimos dictámenes</TituloSeccion>
          <View style={styles.lista}>
            {recientes.map((lead) => {
              const etapa = infoEtapa(lead.etapa as EtapaPipeline);
              return (
                <Tarjeta
                  key={lead.id}
                  acento={etapa.color}
                  onPress={() => router.push(`/crm/${lead.id}`)}
                >
                  <ThemedText type="smallBold">{lead.productor}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {lead.folio} · {lead.cultivoNombre} · {lead.superficieHa} ha · {etapa.nombre}
                  </ThemedText>
                </Tarjeta>
              );
            })}
          </View>
        </>
      ) : null}

      <Tarjeta>
        <ThemedText type="smallBold">¿Necesitas una visita técnica?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {CONTACTO_CHAMAN.correo} · WhatsApp {CONTACTO_CHAMAN.whatsappLegible}
        </ThemedText>
        <View style={styles.acciones}>
          <BotonAccion
            icono="whatsapp"
            texto="WhatsApp"
            color={theme.accent}
            onPress={() =>
              Linking.openURL(enlaceWhatsApp('Hola, quiero información de Chamán 4.0.'))
            }
          />
          <BotonAccion
            icono="web"
            texto="ozonochaman.com"
            onPress={() => Linking.openURL(CONTACTO_CHAMAN.sitioWeb)}
          />
        </View>
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { borderRadius: 20, overflow: 'hidden', minHeight: 260 },
  heroVelo: { backgroundColor: 'rgba(7, 11, 20, 0.72)' },
  heroContenido: { padding: 20, gap: 10 },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoTexto: { color: '#ffffff', fontWeight: 800 },
  heroTitulo: { fontSize: 24, lineHeight: 30, fontWeight: 800, marginTop: 6 },
  heroTexto: { color: '#cbd5e1' },
  heroBotones: { flexDirection: 'row', gap: 10, marginTop: 6 },
  lista: { gap: 10 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
});
