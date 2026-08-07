import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { FormScreen } from '@/components/form/FormScreen';
import { Section } from '@/components/form/Section';
import { LabeledInput } from '@/components/form/LabeledInput';
import { SegmentedSelect } from '@/components/form/SegmentedSelect';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { db } from '@/data/db/client';
import {
  crearWaterAnalysis,
  type WaterAnalysis,
} from '@/data/repositories/waterAnalysisRepository';
import type { IonesAgua } from '@/data/db/schema';
import type { ConcentrationUnit } from '@/domain/types/nutrients';

const UNIDADES: { value: ConcentrationUnit; label: string }[] = [
  { value: 'ppm', label: 'ppm' },
  { value: 'mgL', label: 'mg/L' },
  { value: 'meqL', label: 'meq/L' },
  { value: 'mmolL', label: 'mmol/L' },
];

const CAMPOS_ION: { key: keyof IonesAgua; label: string }[] = [
  { key: 'ca', label: 'Calcio (Ca)' },
  { key: 'mg', label: 'Magnesio (Mg)' },
  { key: 'na', label: 'Sodio (Na)' },
  { key: 'k', label: 'Potasio (K)' },
  { key: 'hco3', label: 'Bicarbonatos (HCO₃)' },
  { key: 'co3', label: 'Carbonatos (CO₃)' },
  { key: 'cl', label: 'Cloruros (Cl)' },
  { key: 'so4', label: 'Sulfatos (SO₄)' },
  { key: 'no3', label: 'Nitratos (NO₃)' },
  { key: 'b', label: 'Boro (B)' },
  { key: 'fe', label: 'Hierro (Fe)' },
  { key: 'mn', label: 'Manganeso (Mn)' },
];

const IONES_INICIAL: IonesAgua = {
  ca: 0,
  mg: 0,
  na: 0,
  k: 0,
  nh4: 0,
  hco3: 0,
  co3: 0,
  cl: 0,
  so4: 0,
  no3: 0,
  b: 0,
  fe: 0,
  mn: 0,
};

function num(valor: string): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

export default function AguaScreen() {
  const router = useRouter();
  const { loteId } = useLocalSearchParams<{ loteId: string }>();

  const [unidadCaptura, setUnidadCaptura] = useState<ConcentrationUnit>('ppm');
  const [pH, setPH] = useState('');
  const [ceDsM, setCeDsM] = useState('');
  const [ionesTexto, setIonesTexto] = useState<Record<keyof IonesAgua, string>>({
    ca: '',
    mg: '',
    na: '',
    k: '',
    nh4: '',
    hco3: '',
    co3: '',
    cl: '',
    so4: '',
    no3: '',
    b: '',
    fe: '',
    mn: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<WaterAnalysis | null>(null);

  function actualizarIon(key: keyof IonesAgua, texto: string) {
    setIonesTexto((prev) => ({ ...prev, [key]: texto }));
  }

  function guardar() {
    if (!loteId) return;
    setGuardando(true);
    const ionesCapturados: IonesAgua = { ...IONES_INICIAL };
    for (const key of Object.keys(ionesTexto) as (keyof IonesAgua)[]) {
      ionesCapturados[key] = num(ionesTexto[key]);
    }
    const creado = crearWaterAnalysis(db, {
      loteId,
      fecha: new Date().toISOString().slice(0, 10),
      unidadCaptura,
      ionesCapturados,
      pH: num(pH),
      ceDsM: num(ceDsM),
    });
    setResultado(creado);
    setGuardando(false);
  }

  function continuar() {
    router.push({ pathname: '/(setup)/riego', params: { loteId } });
  }

  return (
    <FormScreen>
      <Section title="Análisis de agua" subtitle="Paso 3 de 4">
        <SegmentedSelect
          label="Unidad de captura"
          options={UNIDADES}
          value={unidadCaptura}
          onChange={setUnidadCaptura}
        />
        <LabeledInput label="pH" value={pH} onChangeText={setPH} keyboardType="decimal-pad" />
        <LabeledInput
          label="CE"
          value={ceDsM}
          onChangeText={setCeDsM}
          keyboardType="decimal-pad"
          suffix="dS/m"
        />
      </Section>

      <Section
        title="Iones"
        subtitle={`Captura en ${unidadCaptura}, la app convierte internamente`}
      >
        {CAMPOS_ION.map(({ key, label }) => (
          <LabeledInput
            key={key}
            label={label}
            value={ionesTexto[key]}
            onChangeText={(texto) => actualizarIon(key, texto)}
            keyboardType="decimal-pad"
            suffix={unidadCaptura}
          />
        ))}
      </Section>

      {resultado ? (
        <Section title="Diagnóstico de calidad">
          <View style={{ gap: 6 }}>
            <ThemedText type="small">SAR: {resultado.sar?.toFixed(2)}</ThemedText>
            <ThemedText type="small">
              Dureza: {resultado.durezaMgLCaCO3?.toFixed(0)} mg/L CaCO₃
            </ThemedText>
            <ThemedText type="small">
              Alcalinidad: {resultado.alcalinidadMgLCaCO3?.toFixed(0)} mg/L CaCO₃
            </ThemedText>
          </View>
        </Section>
      ) : null}

      {resultado ? (
        <PrimaryButton label="Continuar" onPress={continuar} />
      ) : (
        <PrimaryButton
          label="Guardar y ver diagnóstico"
          onPress={guardar}
          loading={guardando}
          disabled={!loteId}
        />
      )}
    </FormScreen>
  );
}
