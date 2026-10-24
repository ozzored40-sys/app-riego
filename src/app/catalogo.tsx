import { Linking, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { BotonAccion, Pantalla, Tarjeta } from '@/components/chaman/ui';
import { useTheme } from '@/hooks/use-theme';
import { IMAGENES_PRODUCTO } from '@/constants/chamanImages';
import { enlaceWhatsApp, formatoMxn, ETIQUETA_METODO, PRODUCTOS_CHAMAN } from '@/domain/chaman';

export default function CatalogoScreen() {
  const theme = useTheme();

  return (
    <Pantalla edges={['bottom']}>
      <View style={styles.portada}>
        <Image
          source={IMAGENES_PRODUCTO.lineaCompleta}
          style={styles.portadaFoto}
          contentFit="contain"
        />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Hecho en México por Chamán Agrosoluciones S.A. de C.V. Presentaciones de 1, 5, 10 y 20 L.
        Costos por hectárea de referencia, sujetos a cotización.
      </ThemedText>

      {PRODUCTOS_CHAMAN.map((p) => (
        <Tarjeta key={p.clave}>
          <View style={styles.fila}>
            <Image source={IMAGENES_PRODUCTO[p.imagen]} style={styles.foto} contentFit="cover" />
            <View style={styles.flex}>
              <ThemedText type="smallBold">{p.nombre}</ThemedText>
              <ThemedText type="small" style={{ color: theme.accent }}>
                {p.problema}
              </ThemedText>
            </View>
          </View>
          <Dato etiqueta="Fórmula" valor={p.formula} />
          <Dato etiqueta="Modo de acción" valor={p.modoDeAccion} />
          <Dato
            etiqueta="Dosis"
            valor={`${p.dosisLHa.min === p.dosisLHa.max ? p.dosisLHa.min : `${p.dosisLHa.min} a ${p.dosisLHa.max}`} L/ha · ${p.dilucion} · ${ETIQUETA_METODO[p.metodoSugerido]}`}
          />
          <Dato etiqueta="Frecuencia" valor={p.frecuencia} />
          <Dato etiqueta="Intervalo de seguridad" valor={p.intervaloSeguridad} />
          <Dato
            etiqueta="Costo de referencia"
            valor={`${formatoMxn(p.costoReferenciaHaMxn)} por ha por aplicación`}
          />
          <View style={styles.acciones}>
            <BotonAccion
              icono="whatsapp"
              texto="Cotizar"
              color={theme.accent}
              onPress={() =>
                Linking.openURL(
                  enlaceWhatsApp(
                    `Hola, quiero cotizar ${p.nombre}. ¿Me comparten precio y disponibilidad?`,
                  ),
                )
              }
            />
          </View>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary">
        {etiqueta}
      </ThemedText>
      <ThemedText type="small">{valor}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  portada: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden' },
  portadaFoto: { width: '100%', aspectRatio: 1.6 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  foto: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#ffffff' },
  acciones: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
