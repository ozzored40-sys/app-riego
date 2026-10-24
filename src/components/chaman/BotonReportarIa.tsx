import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { asistenteConfigurado } from '@/services/agronomistClient';
import { reportarRespuestaIa, type MotivoReporte } from '@/services/reportClient';
import { CONTACTO_CHAMAN } from '@/domain/chaman';

const MAX_CONTENIDO = 8000;

/**
 * Enlace "Reportar" bajo cada respuesta generada por IA. Envía el reporte al backend sin salir
 * de la app; si el backend no está configurado, abre un correo prellenado como respaldo.
 */
export function BotonReportarIa({ origen, contenido }: { origen: string; contenido: string }) {
  const theme = useTheme();
  const [enviado, setEnviado] = useState(false);

  async function enviar(motivo: MotivoReporte) {
    const texto = contenido.slice(0, MAX_CONTENIDO);
    if (!asistenteConfigurado()) {
      const asunto = encodeURIComponent(`Reporte de respuesta de IA (${motivo})`);
      const cuerpo = encodeURIComponent(`Origen: ${origen}\n\n${texto.slice(0, 1500)}`);
      Linking.openURL(`mailto:${CONTACTO_CHAMAN.correo}?subject=${asunto}&body=${cuerpo}`);
      return;
    }
    try {
      const { respuesta } = await reportarRespuestaIa({ origen, motivo, contenido: texto });
      setEnviado(true);
      avisar(respuesta);
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo enviar el reporte');
    }
  }

  function elegirMotivo() {
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('¿Reportar esta respuesta de IA como incorrecta o inapropiada?')) {
        enviar('incorrecto');
      }
      return;
    }
    Alert.alert('Reportar respuesta de IA', '¿Qué problema tiene esta respuesta?', [
      { text: 'Ofensiva o inapropiada', onPress: () => enviar('ofensivo') },
      { text: 'Incorrecta', onPress: () => enviar('incorrecto') },
      { text: 'Peligrosa (dosis, seguridad)', onPress: () => enviar('peligroso') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <Pressable onPress={elegirMotivo} disabled={enviado} hitSlop={8} style={styles.boton}>
      <ThemedText type="small" style={[styles.texto, { color: theme.textSecondary }]}>
        {enviado ? '✓ Reportado' : '⚑ Reportar'}
      </ThemedText>
    </Pressable>
  );
}

function avisar(mensaje: string) {
  if (Platform.OS === 'web') globalThis.alert?.(mensaje);
  else Alert.alert('Reporte', mensaje);
}

const styles = StyleSheet.create({
  boton: { alignSelf: 'flex-end', marginTop: 4 },
  texto: { fontSize: 12 },
});
