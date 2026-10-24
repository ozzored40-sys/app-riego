import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Encabezado, Pantalla, Tarjeta, TituloSeccion } from '@/components/chaman/ui';
import { Icono } from '@/components/chaman/Icono';
import { useTheme } from '@/hooks/use-theme';
import { especialistasConfigurados } from '@/services/specialistClient';
import { ESPECIALISTAS, type Especialista } from '@/domain/chaman';

export default function EspecialistasScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Pantalla>
      <Encabezado
        titulo="Especialistas IA"
        subtitulo="Consultoría agronómica y técnica 24/7 con la línea Chamán Ozono."
      />

      {!especialistasConfigurados() ? (
        <Tarjeta acento={theme.warning}>
          <ThemedText type="small">
            Los especialistas necesitan el backend de IA (variables EXPO_PUBLIC_AGRONOMIST_API_URL y
            EXPO_PUBLIC_AGRONOMIST_APP_KEY). Puedes ver sus perfiles, pero no chatear todavía.
          </ThemedText>
        </Tarjeta>
      ) : null}

      <TituloSeccion>Agronomía</TituloSeccion>
      <View style={styles.lista}>
        {ESPECIALISTAS.filter((e) => e.id !== 'capi1').map((e) => (
          <TarjetaEspecialista
            key={e.id}
            especialista={e}
            onPress={() => router.push(`/especialista/${e.id}`)}
          />
        ))}
      </View>

      <TituloSeccion>Soporte técnico</TituloSeccion>
      {ESPECIALISTAS.filter((e) => e.id === 'capi1').map((e) => (
        <TarjetaEspecialista
          key={e.id}
          especialista={e}
          onPress={() => router.push(`/especialista/${e.id}`)}
        />
      ))}

      <Tarjeta>
        <ThemedText type="small" themeColor="textSecondary">
          Para problemas de un lote específico (riego, nutrición, foto de la planta) usa también el
          Agrónomo virtual desde la pestaña Campo: conoce el cultivo, la etapa y los análisis del
          lote.
        </ThemedText>
      </Tarjeta>
    </Pantalla>
  );
}

function TarjetaEspecialista({
  especialista,
  onPress,
}: {
  especialista: Especialista;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Tarjeta onPress={onPress} style={styles.tarjeta}>
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
      <View style={styles.flex}>
        <ThemedText type="smallBold">{especialista.nombre}</ThemedText>
        <ThemedText type="small" style={{ color: especialista.color }}>
          {especialista.titulo}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {especialista.descripcion}
        </ThemedText>
      </View>
      <Icono nombre="flecha" color={theme.textSecondary} tamano={18} />
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  lista: { gap: 10 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siglas: { fontSize: 13, fontWeight: 800 },
});
