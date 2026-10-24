import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { LabeledInput } from '@/components/form/LabeledInput';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { SegmentedSelect } from '@/components/form/SegmentedSelect';
import { Section } from '@/components/form/Section';
import { Encabezado, FilaIndicadores, Indicador, Pantalla } from '@/components/chaman/ui';
import { useTheme } from '@/hooks/use-theme';
import { IMAGENES_PRODUCTO } from '@/constants/chamanImages';
import { db } from '@/data/db/client';
import { registrarDiagnosticoCampo } from '@/state/crmService';
import {
  calcularPrescripcion,
  formatoMxn,
  obtenerCultivoChaman,
  CULTIVOS_CHAMAN,
  ETIQUETA_METODO,
  PRODUCTOS_CHAMAN,
  type ClaveCultivoChaman,
  type ClaveProducto,
  type MetodoAplicacion,
  type NivelCarbonatos,
  type DatosPrescripcion,
  type Prescripcion,
  type Severidad,
} from '@/domain/chaman';

function aNumero(texto: string): number | undefined {
  const valor = Number(texto.replace(',', '.'));
  return texto.trim() !== '' && Number.isFinite(valor) ? valor : undefined;
}

/** La vista previa se oculta mientras el formulario tenga datos inválidos (p. ej. 0 ha). */
function calcularVistaPrevia(datos: DatosPrescripcion): Prescripcion | null {
  try {
    return calcularPrescripcion(datos);
  } catch {
    return null;
  }
}

const ESTADO_INICIAL = {
  productor: '',
  telefono: '',
  ubicacion: '',
  cultivo: 'berries' as ClaveCultivoChaman,
  producto: 'biofungicida' as ClaveProducto,
  severidad: 'Moderado' as Severidad,
  metodo: 'drench' as MetodoAplicacion,
  superficie: '5',
  densidad: String(obtenerCultivoChaman('berries').densidadPlantasHa),
  aguaPorPlanta: '',
  ph: '',
  carbonatos: 'Medio' as NivelCarbonatos,
  observaciones: '',
};

export default function DiagnosticoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [f, setF] = useState(ESTADO_INICIAL);
  const [error, setError] = useState<string | null>(null);

  const campo =
    <K extends keyof typeof ESTADO_INICIAL>(clave: K) =>
    (valor: (typeof ESTADO_INICIAL)[K]) =>
      setF((prev) => ({ ...prev, [clave]: valor }));

  const datosPrescripcion: DatosPrescripcion = {
    cultivo: f.cultivo,
    producto: f.producto,
    superficieHa: aNumero(f.superficie) ?? 0,
    severidad: f.severidad,
    metodo: f.metodo,
    densidadPlantasHa: aNumero(f.densidad),
    aguaPorPlantaMl: aNumero(f.aguaPorPlanta),
    phSuelo: aNumero(f.ph),
    carbonatos: f.carbonatos,
  };

  const vistaPrevia = calcularVistaPrevia(datosPrescripcion);

  function elegirCultivo(clave: ClaveCultivoChaman) {
    setF((prev) => ({
      ...prev,
      cultivo: clave,
      densidad: String(obtenerCultivoChaman(clave).densidadPlantasHa),
    }));
  }

  function elegirProducto(clave: ClaveProducto) {
    const producto = PRODUCTOS_CHAMAN.find((p) => p.clave === clave)!;
    setF((prev) => ({ ...prev, producto: clave, metodo: producto.metodoSugerido }));
  }

  function generar() {
    setError(null);
    try {
      const lead = registrarDiagnosticoCampo(db, {
        ...datosPrescripcion,
        productor: f.productor,
        telefono: f.telefono,
        ubicacion: f.ubicacion,
        observaciones: f.observaciones,
      });
      setF(ESTADO_INICIAL);
      router.push(`/crm/${lead.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el dictamen');
    }
  }

  return (
    <Pantalla>
      <Encabezado
        titulo="Diagnóstico en campo"
        subtitulo="Genera el dictamen con folio y regístralo en el CRM en un paso."
      />

      <Section title="Productor">
        <LabeledInput
          label="Nombre del productor o rancho"
          value={f.productor}
          onChangeText={campo('productor')}
          placeholder="Ej. Ing. Roberto Anaya"
        />
        <LabeledInput
          label="WhatsApp (10 dígitos)"
          value={f.telefono}
          onChangeText={campo('telefono')}
          placeholder="33 2096 7184"
          keyboardType="phone-pad"
        />
        <LabeledInput
          label="Ubicación"
          value={f.ubicacion}
          onChangeText={campo('ubicacion')}
          placeholder="Municipio, estado"
        />
      </Section>

      <Section title="Cultivo y lote">
        <SegmentedSelect
          label="Cultivo"
          value={f.cultivo}
          onChange={elegirCultivo}
          options={CULTIVOS_CHAMAN.map((c) => ({ value: c.clave, label: c.nombre }))}
        />
        <View style={styles.fila}>
          <View style={styles.flex}>
            <LabeledInput
              label="Superficie"
              value={f.superficie}
              onChangeText={campo('superficie')}
              keyboardType="decimal-pad"
              suffix="ha"
            />
          </View>
          <View style={styles.flex}>
            <LabeledInput
              label="Densidad"
              value={f.densidad}
              onChangeText={campo('densidad')}
              keyboardType="number-pad"
              suffix="pl/ha"
            />
          </View>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Patógenos frecuentes: {obtenerCultivoChaman(f.cultivo).patogenosClave.join(', ')}.
        </ThemedText>
      </Section>

      <Section
        title="Problema observado"
        subtitle="Elige el problema principal; define el producto Chamán."
      >
        <View style={styles.productos}>
          {PRODUCTOS_CHAMAN.map((producto) => {
            const seleccionado = producto.clave === f.producto;
            return (
              <Pressable
                key={producto.clave}
                onPress={() => elegirProducto(producto.clave)}
                style={[
                  styles.producto,
                  {
                    backgroundColor: seleccionado ? theme.accentSoft : theme.backgroundSelected,
                    borderColor: seleccionado ? theme.accent : 'transparent',
                  },
                ]}
              >
                <Image
                  source={IMAGENES_PRODUCTO[producto.imagen]}
                  style={styles.productoFoto}
                  contentFit="cover"
                />
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{producto.problema}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {producto.nombre}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
        <SegmentedSelect
          label="Severidad"
          value={f.severidad}
          onChange={campo('severidad')}
          options={(['Leve', 'Moderado', 'Crítico'] as const).map((s) => ({ value: s, label: s }))}
        />
        <SegmentedSelect
          label="Método de aplicación"
          value={f.metodo}
          onChange={campo('metodo')}
          options={(Object.keys(ETIQUETA_METODO) as MetodoAplicacion[]).map((m) => ({
            value: m,
            label: ETIQUETA_METODO[m],
          }))}
        />
      </Section>

      <Section
        title="Suelo y agua (opcional)"
        subtitle="Ajustan la concentración de ozono recomendada."
      >
        <View style={styles.fila}>
          <View style={styles.flex}>
            <LabeledInput
              label="pH de suelo"
              value={f.ph}
              onChangeText={campo('ph')}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.flex}>
            <LabeledInput
              label="Agua por planta"
              value={f.aguaPorPlanta}
              onChangeText={campo('aguaPorPlanta')}
              keyboardType="number-pad"
              suffix="ml"
            />
          </View>
        </View>
        <SegmentedSelect
          label="Carbonatos / sarro en goteros"
          value={f.carbonatos}
          onChange={campo('carbonatos')}
          options={(['Bajo', 'Medio', 'Alto'] as const).map((c) => ({ value: c, label: c }))}
        />
        <LabeledInput
          label="Observaciones de campo"
          value={f.observaciones}
          onChangeText={campo('observaciones')}
          placeholder="Síntomas, sector afectado, aplicaciones previas…"
          multiline
        />
      </Section>

      {vistaPrevia ? (
        <Section title="Vista previa de la prescripción">
          <FilaIndicadores>
            <Indicador
              etiqueta="Dosis"
              valor={`${vistaPrevia.dosisLHa} L/ha`}
              detalle={vistaPrevia.producto.dilucion}
            />
            <Indicador
              etiqueta="Ozono disuelto"
              valor={`${vistaPrevia.ppmOzono} ppm`}
              color={theme.accentSecondary}
            />
            <Indicador
              etiqueta="Producto total"
              valor={`${vistaPrevia.productoTotalLitros} L`}
              detalle={`${vistaPrevia.aplicaciones} aplicaciones`}
            />
            <Indicador
              etiqueta="Inversión estimada"
              valor={formatoMxn(vistaPrevia.costoEstimadoMxn)}
              detalle={
                vistaPrevia.ahorroEstimadoMxn > 0
                  ? `Ahorro est. ${formatoMxn(vistaPrevia.ahorroEstimadoMxn)}`
                  : 'Sin ahorro estimado'
              }
              color={theme.accent}
            />
          </FilaIndicadores>
          {vistaPrevia.notasTecnicas.map((nota) => (
            <ThemedText key={nota} type="small" themeColor="textSecondary">
              • {nota}
            </ThemedText>
          ))}
        </Section>
      ) : null}

      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : null}
      <PrimaryButton
        label="Generar dictamen y guardar en CRM"
        onPress={generar}
        disabled={!vistaPrevia}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  fila: { flexDirection: 'row', gap: 12 },
  productos: { gap: 8 },
  producto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
  },
  productoFoto: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#ffffff' },
});
