import { useState } from 'react';
import { Linking, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LabeledInput } from '@/components/form/LabeledInput';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { Section } from '@/components/form/Section';
import { Pantalla, Tarjeta } from '@/components/chaman/ui';
import { useTheme } from '@/hooks/use-theme';
import { enlaceWhatsApp } from '@/domain/chaman';

/**
 * Pagos. A diferencia del prototipo web (que simulaba un cobro con una CLABE y una
 * referencia OXXO de ejemplo y mostraba "pago exitoso" sin cobrar nada), aquí solo se usan
 * canales reales: el enlace de pago oficial de Mercado Pago configurado por Chamán
 * (EXPO_PUBLIC_MERCADOPAGO_LINK) o la solicitud del enlace/datos de pago al equipo
 * comercial por WhatsApp. La app nunca muestra datos bancarios propios.
 */
export default function PagosScreen() {
  const theme = useTheme();
  const enlaceMercadoPago = process.env.EXPO_PUBLIC_MERCADOPAGO_LINK;

  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [nombre, setNombre] = useState('');
  const [factura, setFactura] = useState(false);
  const [rfc, setRfc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');

  function solicitar() {
    const lineas = [
      '💳 *Solicitud de pago — Chamán 4.0*',
      `• Concepto: ${concepto.trim() || 'Por definir'}`,
      monto.trim() ? `• Monto acordado: $${monto.trim()} MXN` : null,
      `• Cliente: ${nombre.trim() || 'Por definir'}`,
      factura
        ? `• Factura CFDI 4.0: RFC ${rfc.trim() || 'pendiente'} · ${razonSocial.trim() || 'razón social pendiente'} · C.P. ${codigoPostal.trim() || 'pendiente'}`
        : '• Sin factura por ahora',
      '',
      'Por favor envíenme el enlace oficial de Mercado Pago (o los datos de transferencia) para completar mi pedido.',
    ];
    Linking.openURL(enlaceWhatsApp(lineas.filter((l): l is string => l !== null).join('\n')));
  }

  return (
    <Pantalla edges={['bottom']}>
      <Tarjeta acento="#0ea5e9">
        <ThemedText type="smallBold">Pago seguro con Mercado Pago</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tarjeta de crédito o débito (meses sin intereses según la promoción vigente), SPEI u OXXO.
          Solo paga en enlaces enviados por el WhatsApp oficial de Chamán o desde este botón.
        </ThemedText>
        {enlaceMercadoPago ? (
          <PrimaryButton
            label="Pagar con Mercado Pago"
            onPress={() => Linking.openURL(enlaceMercadoPago)}
          />
        ) : null}
      </Tarjeta>

      <Section
        title="Solicitar enlace de pago"
        subtitle="Enviamos tu pedido al equipo comercial por WhatsApp; te responden con el enlace oficial."
      >
        <LabeledInput
          label="Concepto"
          value={concepto}
          onChangeText={setConcepto}
          placeholder="Ej. 20 L Biofungicida + generador O3-Field 50"
        />
        <LabeledInput
          label="Monto acordado (opcional)"
          value={monto}
          onChangeText={setMonto}
          keyboardType="decimal-pad"
          suffix="MXN"
        />
        <LabeledInput label="Nombre o rancho" value={nombre} onChangeText={setNombre} />
        <View style={styles.fila}>
          <ThemedText type="small" style={styles.flex}>
            Requiero factura CFDI 4.0
          </ThemedText>
          <Switch value={factura} onValueChange={setFactura} trackColor={{ true: theme.accent }} />
        </View>
        {factura ? (
          <>
            <LabeledInput label="RFC" value={rfc} onChangeText={(t) => setRfc(t.toUpperCase())} />
            <LabeledInput label="Razón social" value={razonSocial} onChangeText={setRazonSocial} />
            <LabeledInput
              label="Código postal fiscal"
              value={codigoPostal}
              onChangeText={setCodigoPostal}
              keyboardType="number-pad"
            />
          </>
        ) : null}
        <PrimaryButton label="Enviar solicitud por WhatsApp" onPress={solicitar} />
      </Section>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
