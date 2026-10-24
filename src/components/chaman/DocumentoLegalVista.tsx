import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { VERSION_LEGAL, type DocumentoLegal } from '@/legal/documentos';

/** Muestra un documento legal completo (sin scroll propio: va dentro de una Pantalla/ScrollView). */
export function DocumentoLegalVista({ documento }: { documento: DocumentoLegal }) {
  return (
    <View style={styles.contenedor}>
      <ThemedText style={styles.titulo}>{documento.titulo}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Versión {VERSION_LEGAL}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.resumen}>
        {documento.resumen}
      </ThemedText>
      {documento.secciones.map((seccion) => (
        <View key={seccion.titulo} style={styles.seccion}>
          <ThemedText type="smallBold">{seccion.titulo}</ThemedText>
          {seccion.parrafos.map((parrafo, i) => (
            <ThemedText key={i} type="small" style={styles.parrafo}>
              {parrafo}
            </ThemedText>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 12 },
  titulo: { fontSize: 22, lineHeight: 28, fontWeight: 800 },
  resumen: { fontStyle: 'italic' },
  seccion: { gap: 6 },
  parrafo: { lineHeight: 21 },
});
