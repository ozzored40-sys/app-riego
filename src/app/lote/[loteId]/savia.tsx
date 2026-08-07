import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { FormScreen } from '@/components/form/FormScreen';
import { Section } from '@/components/form/Section';
import { LabeledInput } from '@/components/form/LabeledInput';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { db } from '@/data/db/client';
import {
  crearSapReading,
  listarSapReadingsDeLote,
  type SapReading,
} from '@/data/repositories/sapReadingRepository';

function num(valor: string): number | undefined {
  if (valor.trim() === '') return undefined;
  const n = Number(valor);
  return Number.isFinite(n) ? n : undefined;
}

function tendencia(actual?: number | null, anterior?: number | null): string {
  if (actual == null || anterior == null) return '';
  if (actual > anterior) return '↑';
  if (actual < anterior) return '↓';
  return '→';
}

export default function SaviaScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();

  const [no3Ppm, setNo3Ppm] = useState('');
  const [kPpm, setKPpm] = useState('');
  const [caPpm, setCaPpm] = useState('');
  const [naPpm, setNaPpm] = useState('');
  const [hojaMuestreada, setHojaMuestreada] = useState('');
  const [, forzarRecarga] = useState(0);

  const lecturas: SapReading[] = listarSapReadingsDeLote(db, loteId!);

  function registrar() {
    crearSapReading(db, {
      loteId: loteId!,
      fecha: new Date().toISOString().slice(0, 10),
      no3Ppm: num(no3Ppm),
      kPpm: num(kPpm),
      caPpm: num(caPpm),
      naPpm: num(naPpm),
      hojaMuestreada: hojaMuestreada || undefined,
    });
    setNo3Ppm('');
    setKPpm('');
    setCaPpm('');
    setNaPpm('');
    setHojaMuestreada('');
    forzarRecarga((v) => v + 1);
  }

  const [ultima, anterior] = lecturas;

  return (
    <FormScreen>
      <Section title="Registrar análisis de savia">
        <LabeledInput
          label="Nitrato (NO₃)"
          value={no3Ppm}
          onChangeText={setNo3Ppm}
          keyboardType="decimal-pad"
          suffix="ppm"
        />
        <LabeledInput
          label="Potasio (K)"
          value={kPpm}
          onChangeText={setKPpm}
          keyboardType="decimal-pad"
          suffix="ppm"
        />
        <LabeledInput
          label="Calcio (Ca)"
          value={caPpm}
          onChangeText={setCaPpm}
          keyboardType="decimal-pad"
          suffix="ppm"
        />
        <LabeledInput
          label="Sodio (Na)"
          value={naPpm}
          onChangeText={setNaPpm}
          keyboardType="decimal-pad"
          suffix="ppm"
        />
        <LabeledInput
          label="Hoja muestreada"
          value={hojaMuestreada}
          onChangeText={setHojaMuestreada}
          placeholder="Ej. hoja 4, madura"
        />
        <PrimaryButton label="Registrar" onPress={registrar} />
      </Section>

      {ultima ? (
        <Section title="Tendencia" subtitle="Comparado con la lectura anterior">
          <Fila
            label="NO₃"
            valor={`${ultima.no3Ppm ?? '—'} ${tendencia(ultima.no3Ppm, anterior?.no3Ppm)}`}
          />
          <Fila
            label="K"
            valor={`${ultima.kPpm ?? '—'} ${tendencia(ultima.kPpm, anterior?.kPpm)}`}
          />
          <Fila
            label="Ca"
            valor={`${ultima.caPpm ?? '—'} ${tendencia(ultima.caPpm, anterior?.caPpm)}`}
          />
          <Fila
            label="Na"
            valor={`${ultima.naPpm ?? '—'} ${tendencia(ultima.naPpm, anterior?.naPpm)}`}
          />
        </Section>
      ) : null}

      <Section title="Historial">
        {lecturas.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Aún no hay lecturas de savia registradas.
          </ThemedText>
        ) : (
          lecturas.map((lectura) => (
            <View key={lectura.id} style={styles.fila}>
              <ThemedText type="small" themeColor="textSecondary">
                {lectura.fecha}
              </ThemedText>
              <ThemedText type="small">
                NO₃ {lectura.no3Ppm ?? '—'} · K {lectura.kPpm ?? '—'} · Ca {lectura.caPpm ?? '—'} ·
                Na {lectura.naPpm ?? '—'}
              </ThemedText>
            </View>
          ))
        )}
      </Section>
    </FormScreen>
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
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
});
