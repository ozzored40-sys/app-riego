import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { FormScreen } from '@/components/form/FormScreen';
import { Section } from '@/components/form/Section';
import { LabeledInput } from '@/components/form/LabeledInput';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { db } from '@/data/db/client';
import { obtenerLote, actualizarLote } from '@/data/repositories/loteRepository';
import { crearClimateData } from '@/data/repositories/climateDataRepository';
import {
  verificarDatosLote,
  loteEstaCompleto,
  calcularYGuardarRecomendacion,
} from '@/state/recommendationService';
import { kgPorHaAKgPorSector } from '@/domain/nutrients/unitConversion';
import type { DailyRecommendation } from '@/domain/types/recommendation';
import { obtenerUbicacionActual } from '@/services/location';
import { obtenerClimaDeHoy } from '@/services/openMeteoClient';

function num(valor: string): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

export default function HoyScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const router = useRouter();
  const lote = useMemo(() => (loteId ? obtenerLote(db, loteId) : undefined), [loteId]);
  const datosFaltantes = useMemo(() => (loteId ? verificarDatosLote(db, loteId) : null), [loteId]);

  const [etoMmDia, setEtoMmDia] = useState('5');
  const [lluviaEfectivaMmDia, setLluviaEfectivaMmDia] = useState('0');
  const [fuenteClima, setFuenteClima] = useState<'manual' | 'open-meteo'>('manual');
  const [cargandoClima, setCargandoClima] = useState(false);
  const [errorClima, setErrorClima] = useState<string | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recomendacion, setRecomendacion] = useState<DailyRecommendation | null>(null);

  if (!lote || !datosFaltantes) {
    return (
      <FormScreen>
        <ThemedText>No se encontró el lote.</ThemedText>
      </FormScreen>
    );
  }

  if (!loteEstaCompleto(datosFaltantes)) {
    return (
      <FormScreen>
        <Section title="Faltan datos de este lote">
          {datosFaltantes.faltaSueloOSustrato ? (
            <ThemedText>• Falta el análisis de suelo o sustrato.</ThemedText>
          ) : null}
          {datosFaltantes.faltaAgua ? <ThemedText>• Falta el análisis de agua.</ThemedText> : null}
          {datosFaltantes.faltaRiego ? (
            <ThemedText>• Falta configurar el sistema de riego.</ThemedText>
          ) : null}
          <ThemedText themeColor="textSecondary" type="small">
            Completa el wizard de configuración de este lote (pantallas 2-4) antes de calcular la
            recomendación diaria.
          </ThemedText>
        </Section>
      </FormScreen>
    );
  }

  function editarEtoManual(texto: string) {
    setEtoMmDia(texto);
    setFuenteClima('manual');
  }

  function editarLluviaManual(texto: string) {
    setLluviaEfectivaMmDia(texto);
    setFuenteClima('manual');
  }

  async function usarClimaAutomatico() {
    setCargandoClima(true);
    setErrorClima(null);
    try {
      const { lat, lon } = await obtenerUbicacionActual();
      actualizarLote(db, loteId!, { ubicacionLat: lat, ubicacionLon: lon });
      const clima = await obtenerClimaDeHoy(lat, lon);
      setEtoMmDia(clima.etoMmDia.toFixed(2));
      setLluviaEfectivaMmDia(clima.lluviaEfectivaMmDia.toFixed(2));
      setFuenteClima('open-meteo');
    } catch (e) {
      // Nunca bloquea el flujo: la captura manual de ETo/lluvia sigue disponible.
      setErrorClima(e instanceof Error ? e.message : 'No se pudo obtener el clima automático');
    } finally {
      setCargandoClima(false);
    }
  }

  function calcular() {
    setCalculando(true);
    setError(null);
    try {
      const clima = { etoMmDia: num(etoMmDia), lluviaEfectivaMmDia: num(lluviaEfectivaMmDia) };
      const resultado = calcularYGuardarRecomendacion(db, loteId!, clima);
      crearClimateData(db, {
        loteId: loteId!,
        fecha: new Date().toISOString().slice(0, 10),
        etoMmDia: clima.etoMmDia,
        lluviaMm: clima.lluviaEfectivaMmDia,
        fuente: fuenteClima,
      });
      setRecomendacion(resultado);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo calcular la recomendación');
    } finally {
      setCalculando(false);
    }
  }

  return (
    <FormScreen>
      <View style={styles.navRow}>
        <PrimaryButton
          label="Diagnóstico"
          variant="secondary"
          onPress={() => router.push(`/lote/${loteId}/diagnostico`)}
        />
        <PrimaryButton
          label="Monitoreo"
          variant="secondary"
          onPress={() => router.push(`/lote/${loteId}/monitoreo`)}
        />
        <PrimaryButton
          label="Savia"
          variant="secondary"
          onPress={() => router.push(`/lote/${loteId}/savia`)}
        />
        <PrimaryButton
          label="Resultados"
          variant="secondary"
          onPress={() => router.push(`/lote/${loteId}/resultados`)}
        />
      </View>

      <Section title={lote.nombre} subtitle="Datos climáticos de hoy">
        <PrimaryButton
          label="📍 Usar clima automático (GPS)"
          variant="secondary"
          onPress={usarClimaAutomatico}
          loading={cargandoClima}
        />
        {errorClima ? (
          <ThemedText type="small" style={{ color: '#c0392b' }}>
            {errorClima}. Puedes seguir capturando el clima manualmente.
          </ThemedText>
        ) : null}
        {fuenteClima === 'open-meteo' ? (
          <ThemedText type="small" themeColor="textSecondary">
            Clima obtenido de Open-Meteo para la ubicación del lote. Puedes editarlo si lo
            necesitas.
          </ThemedText>
        ) : null}
        <LabeledInput
          label="Evapotranspiración de referencia (ETo)"
          value={etoMmDia}
          onChangeText={editarEtoManual}
          keyboardType="decimal-pad"
          suffix="mm/día"
        />
        <LabeledInput
          label="Lluvia efectiva"
          value={lluviaEfectivaMmDia}
          onChangeText={editarLluviaManual}
          keyboardType="decimal-pad"
          suffix="mm/día"
        />
        <PrimaryButton
          label="Calcular recomendación de hoy"
          onPress={calcular}
          loading={calculando}
        />
        {error ? (
          <ThemedText themeColor="text" style={{ color: '#c0392b' }}>
            {error}
          </ThemedText>
        ) : null}
      </Section>

      {recomendacion ? (
        <RecomendacionResultado recomendacion={recomendacion} areaHa={lote.areaHa} />
      ) : null}
    </FormScreen>
  );
}

function RecomendacionResultado({
  recomendacion,
  areaHa,
}: {
  recomendacion: DailyRecommendation;
  areaHa: number;
}) {
  const theme = useTheme();
  const { agua, nutrientes, tanques, costoDiarioTotal, etapa } = recomendacion;

  return (
    <>
      <Section title="Requerimiento hídrico" subtitle={`Etapa: ${etapa.nombre}`}>
        <Fila label="Agua por planta" valor={`${agua.litrosPorPlantaDia.toFixed(2)} L/día`} />
        <Fila label="Agua por hectárea" valor={`${agua.m3PorHaDia.toFixed(2)} m³/ha/día`} />
        <Fila label="Número de pulsos" valor={`${agua.numeroPulsos}`} />
        <Fila label="Agua por pulso" valor={`${agua.litrosPorPulso.toFixed(2)} L/planta`} />
        <Fila label="Duración de cada pulso" valor={`${agua.minutosPorPulso.toFixed(1)} min`} />
      </Section>

      <Section title="Demanda nutrimental" subtitle="Necesidad neta a fertilizar, en 3 escalas">
        <View style={[styles.tableHeader, { borderBottomColor: theme.backgroundSelected }]}>
          <ThemedText type="small" style={styles.colNutriente}>
            Nutriente
          </ThemedText>
          <ThemedText type="small" style={styles.colValor}>
            g/planta/día
          </ThemedText>
          <ThemedText type="small" style={styles.colValor}>
            kg/ha/día
          </ThemedText>
          <ThemedText type="small" style={styles.colValor}>
            kg/sector
          </ThemedText>
        </View>
        {nutrientes.map((n) => (
          <View key={n.nutriente} style={styles.tableRow}>
            <ThemedText type="smallBold" style={styles.colNutriente}>
              {n.nutriente}
            </ThemedText>
            <ThemedText type="small" style={styles.colValor}>
              {n.gPorPlantaDia.toFixed(2)}
            </ThemedText>
            <ThemedText type="small" style={styles.colValor}>
              {n.netoAjustadoKgHaDia.toFixed(2)}
            </ThemedText>
            <ThemedText type="small" style={styles.colValor}>
              {kgPorHaAKgPorSector(n.netoAjustadoKgHaDia, areaHa).toFixed(2)}
            </ThemedText>
          </View>
        ))}
      </Section>

      {tanques.map((tanque) => (
        <Section
          key={tanque.tanque}
          title={`Tambo ${tanque.tanque}`}
          subtitle={`${tanque.dosis.litrosMadrePorDia.toFixed(1)} L/día · ${tanque.dosis.litrosMadrePorPulso.toFixed(1)} L/pulso · autonomía ${tanque.dosis.diasDeAutonomia.toFixed(1)} días`}
        >
          {tanque.productos.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Sin productos asignados a este tambo hoy.
            </ThemedText>
          ) : (
            tanque.productos.map((p) => (
              <Fila
                key={p.fertilizante.id}
                label={p.fertilizante.nombre}
                valor={`${p.kgEnTanque.toFixed(2)} kg`}
              />
            ))
          )}
        </Section>
      ))}

      {recomendacion.conflictosCompatibilidad.length > 0 ? (
        <Section title="⚠️ Alertas de incompatibilidad">
          {recomendacion.conflictosCompatibilidad.map((c, i) => (
            <ThemedText key={i} type="small">
              {c.productoA} + {c.productoB}: {c.motivo}
            </ThemedText>
          ))}
        </Section>
      ) : null}

      <Section title="Costo">
        <Fila label="Costo diario de fertilizantes" valor={`$${costoDiarioTotal.toFixed(2)}`} />
      </Section>
    </>
  );
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.fila}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{valor}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fila: { flexDirection: 'row', justifyContent: 'space-between' },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableRow: { flexDirection: 'row', paddingVertical: 4 },
  colNutriente: { flex: 1 },
  colValor: { flex: 1, textAlign: 'right' },
});
