import { Alert, Linking, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/themed-text';
import { Encabezado, FilaMenu, Pantalla, Tarjeta, TituloSeccion } from '@/components/chaman/ui';
import { useTheme } from '@/hooks/use-theme';
import { CONTACTO_CHAMAN, enlaceWhatsApp } from '@/domain/chaman';
import { db } from '@/data/db/client';
import { borrarTodosLosDatos } from '@/data/repositories/legalRepository';
import { useLoteStore } from '@/state/loteStore';
import { DOCUMENTOS_LEGALES, type IdDocumentoLegal } from '@/legal/documentos';

const ICONO_DOCUMENTO = {
  terminos: 'terminos',
  privacidad: 'privacidad',
  'uso-responsable': 'seguridad',
} as const satisfies Record<IdDocumentoLegal, string>;

export default function MasScreen() {
  const router = useRouter();
  const theme = useTheme();
  const cargarLotes = useLoteStore((estado) => estado.cargarLotes);

  function confirmarBorrado() {
    const borrar = () => {
      borrarTodosLosDatos(db);
      cargarLotes();
      const aviso = 'Se borraron todos tus datos de este dispositivo.';
      if (Platform.OS === 'web') globalThis.alert?.(aviso);
      else Alert.alert('Listo', aviso);
    };
    const mensaje =
      'Se eliminarán de este teléfono tus lotes, análisis, dictámenes, prospectos del CRM y conversaciones. No se puede deshacer.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(mensaje)) borrar();
      return;
    }
    Alert.alert('Borrar todos mis datos', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar todo', style: 'destructive', onPress: borrar },
    ]);
  }

  return (
    <Pantalla>
      <Encabezado titulo="Más herramientas" />

      <TituloSeccion>Comercial</TituloSeccion>
      <View style={styles.lista}>
        <FilaMenu
          icono="catalogo"
          titulo="Catálogo Chamán Ozono"
          descripcion="Fichas técnicas, fórmulas y dosis de la línea de productos."
          onPress={() => router.push('/catalogo')}
          color="#a855f7"
        />
        <FilaMenu
          icono="calculadora"
          titulo="Calculadora O₃ y ROI"
          descripcion="Dimensiona el generador de ozono y el retorno de inversión."
          onPress={() => router.push('/calculadora')}
          color={theme.warning}
        />
        <FilaMenu
          icono="marketing"
          titulo="Meta Ads y copys"
          descripcion="Plantillas de anuncios y redactor con IA."
          onPress={() => router.push('/marketing')}
          color="#ec4899"
        />
        <FilaMenu
          icono="pagos"
          titulo="Pagos y facturación"
          descripcion="Mercado Pago, transferencia y CFDI 4.0."
          onPress={() => router.push('/pagos')}
          color="#0ea5e9"
        />
      </View>

      <TituloSeccion>Campo</TituloSeccion>
      <View style={styles.lista}>
        <FilaMenu
          icono="fertilizantes"
          titulo="Inventario de fertilizantes"
          descripcion="Insumos que usa el cálculo de fertirriego."
          onPress={() => router.push('/fertilizantes')}
        />
        <FilaMenu
          icono="soporte"
          titulo="Capi 1 · soporte técnico"
          descripcion="Generadores, Venturi, ORP y mantenimiento."
          onPress={() => router.push('/especialista/capi1')}
          color={theme.accentSecondary}
        />
      </View>

      <TituloSeccion>Legal y privacidad</TituloSeccion>
      <View style={styles.lista}>
        {(Object.keys(DOCUMENTOS_LEGALES) as IdDocumentoLegal[]).map((id) => (
          <FilaMenu
            key={id}
            icono={ICONO_DOCUMENTO[id]}
            titulo={DOCUMENTOS_LEGALES[id].titulo}
            onPress={() => router.push(`/legal/${id}`)}
            color={theme.textSecondary}
          />
        ))}
        <FilaMenu
          icono="borrarTodo"
          titulo="Borrar todos mis datos"
          descripcion="Elimina de este teléfono lotes, dictámenes, CRM y conversaciones."
          onPress={confirmarBorrado}
          color={theme.danger}
        />
      </View>

      <TituloSeccion>Contacto</TituloSeccion>
      <View style={styles.lista}>
        <FilaMenu
          icono="whatsapp"
          titulo={`WhatsApp ${CONTACTO_CHAMAN.whatsappLegible}`}
          onPress={() =>
            Linking.openURL(enlaceWhatsApp('Hola, tengo una consulta sobre Chamán 4.0.'))
          }
        />
        <FilaMenu
          icono="web"
          titulo="ozonochaman.com"
          onPress={() => Linking.openURL(CONTACTO_CHAMAN.sitioWeb)}
          color={theme.accentSecondary}
        />
      </View>

      <Tarjeta>
        <ThemedText type="small" themeColor="textSecondary">
          {CONTACTO_CHAMAN.empresa} · Centro de Comando 4.0 · versión{' '}
          {Constants.expoConfig?.version ?? '—'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Las recomendaciones de la app y de los especialistas IA son orientativas: sigue la
          etiqueta del producto y valida con un agrónomo en campo los casos graves.
        </ThemedText>
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 10 },
});
