import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import {
  Encabezado,
  Etiqueta,
  FilaIndicadores,
  Indicador,
  Pantalla,
  Tarjeta,
} from '@/components/chaman/ui';
import { useTheme } from '@/hooks/use-theme';
import { db } from '@/data/db/client';
import { listarLeads, type Lead } from '@/data/repositories/leadRepository';
import { resumenCrm } from '@/state/crmService';
import { ETAPAS_PIPELINE, formatoMxn, infoEtapa, type EtapaPipeline } from '@/domain/chaman';

type Filtro = EtapaPipeline | 'todos';

export default function CrmScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  useFocusEffect(
    useCallback(() => {
      setLeads(listarLeads(db));
    }, []),
  );

  const resumen = resumenCrm(leads);
  const visibles = filtro === 'todos' ? leads : leads.filter((l) => l.etapa === filtro);

  return (
    <Pantalla>
      <Encabezado
        titulo="CRM y prospectos"
        subtitulo="Embudo comercial de los dictámenes de campo."
      />

      <FilaIndicadores>
        <Indicador
          etiqueta="Pipeline abierto"
          valor={formatoMxn(resumen.pipelineAbiertoMxn)}
          color={theme.accentSecondary}
        />
        <Indicador
          etiqueta="Ventas cerradas"
          valor={formatoMxn(resumen.ventaCerradaMxn)}
          color={theme.accent}
        />
        <Indicador
          etiqueta="Conversión"
          valor={`${resumen.tasaConversionPct}%`}
          detalle="Clientes / decididos"
        />
      </FilaIndicadores>

      <View style={styles.filtros}>
        <Chip
          texto={`Todos (${leads.length})`}
          activo={filtro === 'todos'}
          color={theme.text}
          onPress={() => setFiltro('todos')}
        />
        {ETAPAS_PIPELINE.map((e) => (
          <Chip
            key={e.etapa}
            texto={`${e.etapa === 'perdido' ? '' : `${e.etapa} · `}${e.nombre} (${resumen.porEtapa[e.etapa]})`}
            activo={filtro === e.etapa}
            color={e.color}
            onPress={() => setFiltro(e.etapa)}
          />
        ))}
      </View>

      {visibles.length === 0 ? (
        <Tarjeta>
          <ThemedText type="small" themeColor="textSecondary">
            {leads.length === 0
              ? 'Aún no hay prospectos. Cada diagnóstico de campo que generes aparecerá aquí con su folio.'
              : 'No hay prospectos en esta etapa.'}
          </ThemedText>
          {leads.length === 0 ? (
            <PrimaryButton
              label="Hacer un diagnóstico"
              onPress={() => router.push('/diagnostico')}
            />
          ) : null}
        </Tarjeta>
      ) : (
        <View style={styles.lista}>
          {visibles.map((lead) => {
            const etapa = infoEtapa(lead.etapa as EtapaPipeline);
            return (
              <Tarjeta
                key={lead.id}
                acento={etapa.color}
                onPress={() => router.push(`/crm/${lead.id}`)}
              >
                <View style={styles.filaTitulo}>
                  <ThemedText type="smallBold" style={styles.flex} numberOfLines={1}>
                    {lead.productor}
                  </ThemedText>
                  <Etiqueta texto={etapa.nombre} color={etapa.color} />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {lead.cultivoNombre} · {lead.superficieHa} ha
                  {lead.ubicacion ? ` · ${lead.ubicacion}` : ''}
                </ThemedText>
                <ThemedText type="small">{lead.productoNombre}</ThemedText>
                <View style={styles.filaTitulo}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
                    {lead.folio} · {new Date(lead.createdAt).toLocaleDateString('es-MX')}
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    {formatoMxn(lead.costoEstimadoMxn)}
                  </ThemedText>
                </View>
              </Tarjeta>
            );
          })}
        </View>
      )}
    </Pantalla>
  );
}

function Chip({
  texto,
  activo,
  color,
  onPress,
}: {
  texto: string;
  activo: boolean;
  color: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: activo ? `${color}26` : theme.backgroundSelected,
          borderColor: activo ? color : 'transparent',
        },
      ]}
    >
      <ThemedText type="small" style={{ color: activo ? color : theme.textSecondary }}>
        {texto}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  lista: { gap: 10 },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
