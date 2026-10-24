import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

/**
 * Muestra las respuestas de los especialistas IA con el Markdown básico que suelen usar
 * (negritas con **texto**, viñetas con - o • y encabezados con #), sin dependencias
 * externas. Lo que no reconoce se muestra como texto normal.
 */
export function TextoEnriquecido({ texto, color }: { texto: string; color?: string }) {
  const theme = useTheme();
  const colorTexto = color ?? theme.text;
  const lineas = texto.split('\n');

  return (
    <View style={styles.contenedor}>
      {lineas.map((lineaOriginal, i) => {
        const linea = lineaOriginal.trimEnd();
        if (linea.trim() === '') return <View key={i} style={styles.espacio} />;

        const encabezado = linea.match(/^#{1,4}\s+(.*)$/);
        if (encabezado) {
          return (
            <Text key={i} style={[styles.encabezado, { color: colorTexto }]}>
              {conNegritas(encabezado[1].replace(/\*\*/g, ''))}
            </Text>
          );
        }

        const vineta = linea.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
        if (vineta) {
          const marcador = linea.trim().match(/^\d+[.)]/)?.[0] ?? '•';
          return (
            <View key={i} style={styles.filaVineta}>
              <Text style={[styles.parrafo, { color: theme.accent }]}>{marcador}</Text>
              <Text style={[styles.parrafo, styles.flex, { color: colorTexto }]}>
                {conNegritas(vineta[1])}
              </Text>
            </View>
          );
        }

        return (
          <Text key={i} style={[styles.parrafo, { color: colorTexto }]}>
            {conNegritas(linea)}
          </Text>
        );
      })}
    </View>
  );
}

function conNegritas(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') && parte.length > 4 ? (
      <Text key={i} style={styles.negrita}>
        {parte.slice(2, -2)}
      </Text>
    ) : (
      parte
    ),
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 4 },
  flex: { flex: 1 },
  espacio: { height: 4 },
  parrafo: { fontSize: 15, lineHeight: 22 },
  negrita: { fontWeight: 700 },
  encabezado: { fontSize: 16, lineHeight: 24, fontWeight: 800, marginTop: 4 },
  filaVineta: { flexDirection: 'row', gap: 8, paddingLeft: 4 },
});
