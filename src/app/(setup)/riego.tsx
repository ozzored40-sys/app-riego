import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { FormScreen } from '@/components/form/FormScreen';
import { Section } from '@/components/form/Section';
import { LabeledInput } from '@/components/form/LabeledInput';
import { SegmentedSelect } from '@/components/form/SegmentedSelect';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { db } from '@/data/db/client';
import { crearIrrigationSystem } from '@/data/repositories/irrigationSystemRepository';

const TIPOS_RIEGO = [
  { value: 'goteo', label: 'Goteo' },
  { value: 'aspersion', label: 'Aspersión' },
  { value: 'nft', label: 'NFT' },
  { value: 'flotante', label: 'Raíz flotante' },
];

function num(valor: string): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

export default function RiegoScreen() {
  const router = useRouter();
  const { loteId } = useLocalSearchParams<{ loteId: string }>();

  const [tipo, setTipo] = useState('goteo');
  const [caudalEmisorLH, setCaudalEmisorLH] = useState('');
  const [emisoresPorPlanta, setEmisoresPorPlanta] = useState('1');
  const [eficienciaPct, setEficienciaPct] = useState('90');
  const [numeroPulsos, setNumeroPulsos] = useState('4');
  const [porcentajeDrenajeDeseado, setPorcentajeDrenajeDeseado] = useState('12');
  const [guardando, setGuardando] = useState(false);

  const puedeContinuar =
    Number(caudalEmisorLH) > 0 && Number(eficienciaPct) > 0 && Number(numeroPulsos) > 0;

  function finalizar() {
    if (!loteId || !puedeContinuar) return;
    setGuardando(true);
    crearIrrigationSystem(db, {
      loteId,
      tipo,
      caudalEmisorLH: num(caudalEmisorLH),
      emisoresPorPlanta: num(emisoresPorPlanta),
      eficienciaPct: num(eficienciaPct) / 100,
      numeroPulsos: Math.round(num(numeroPulsos)),
      porcentajeDrenajeDeseado: porcentajeDrenajeDeseado
        ? num(porcentajeDrenajeDeseado) / 100
        : undefined,
    });
    setGuardando(false);
    router.replace('/');
  }

  return (
    <FormScreen>
      <Section title="Sistema de riego" subtitle="Paso 4 de 4">
        <SegmentedSelect
          label="Tipo de riego"
          options={TIPOS_RIEGO}
          value={tipo}
          onChange={setTipo}
        />
        <LabeledInput
          label="Gasto del gotero"
          value={caudalEmisorLH}
          onChangeText={setCaudalEmisorLH}
          keyboardType="decimal-pad"
          suffix="L/h"
        />
        <LabeledInput
          label="Número de goteros por planta"
          value={emisoresPorPlanta}
          onChangeText={setEmisoresPorPlanta}
          keyboardType="decimal-pad"
        />
        <LabeledInput
          label="Eficiencia del sistema"
          value={eficienciaPct}
          onChangeText={setEficienciaPct}
          keyboardType="decimal-pad"
          suffix="%"
        />
        <LabeledInput
          label="Número de pulsos de riego al día"
          value={numeroPulsos}
          onChangeText={setNumeroPulsos}
          keyboardType="decimal-pad"
        />
        <LabeledInput
          label="Porcentaje de drenaje deseado"
          value={porcentajeDrenajeDeseado}
          onChangeText={setPorcentajeDrenajeDeseado}
          keyboardType="decimal-pad"
          suffix="%"
        />
      </Section>

      <PrimaryButton
        label="Finalizar y crear lote"
        onPress={finalizar}
        disabled={!puedeContinuar}
        loading={guardando}
      />
    </FormScreen>
  );
}
