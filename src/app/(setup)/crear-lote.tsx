import { useState } from 'react';
import { useRouter } from 'expo-router';

import { FormScreen } from '@/components/form/FormScreen';
import { Section } from '@/components/form/Section';
import { LabeledInput } from '@/components/form/LabeledInput';
import { SegmentedSelect } from '@/components/form/SegmentedSelect';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { db } from '@/data/db/client';
import { crearLote } from '@/data/repositories/loteRepository';
import { useLoteStore } from '@/state/loteStore';
import { listCropProfiles } from '@/domain/crops';
import type { SistemaProduccion } from '@/domain/types/crop';

const CULTIVOS = listCropProfiles().map((c) => ({ value: c.id, label: c.nombre }));

const SISTEMAS: { value: SistemaProduccion; label: string }[] = [
  { value: 'suelo', label: 'Suelo' },
  { value: 'sustrato', label: 'Sustrato' },
  { value: 'hidroponia', label: 'Hidroponía' },
  { value: 'nft', label: 'NFT' },
  { value: 'raizFlotante', label: 'Raíz flotante' },
];

export default function CrearLoteScreen() {
  const router = useRouter();
  const cargarLotes = useLoteStore((s) => s.cargarLotes);

  const [nombre, setNombre] = useState('');
  const [cropId, setCropId] = useState(CULTIVOS[0].value);
  const [sistemaProduccion, setSistemaProduccion] = useState<SistemaProduccion>('suelo');
  const [fechaSiembra, setFechaSiembra] = useState('');
  const [areaHa, setAreaHa] = useState('');
  const [plantasPorHa, setPlantasPorHa] = useState('');
  const [rendimientoObjetivoTonHa, setRendimientoObjetivoTonHa] = useState('');
  const [guardando, setGuardando] = useState(false);

  function seleccionarCultivo(id: string) {
    setCropId(id);
    const referencia = listCropProfiles().find((c) => c.id === id)?.datosReferencia;
    if (referencia?.densidadPlantasHaSugerida && !plantasPorHa) {
      setPlantasPorHa(String(referencia.densidadPlantasHaSugerida));
    }
    if (referencia?.rendimientoObjetivoTonHaSugerido && !rendimientoObjetivoTonHa) {
      setRendimientoObjetivoTonHa(String(referencia.rendimientoObjetivoTonHaSugerido));
    }
  }

  const puedeContinuar =
    nombre.trim().length > 0 &&
    fechaSiembra.trim().length > 0 &&
    Number(areaHa) > 0 &&
    Number(plantasPorHa) > 0 &&
    Number(rendimientoObjetivoTonHa) > 0;

  function continuar() {
    if (!puedeContinuar) return;
    setGuardando(true);
    const lote = crearLote(db, {
      nombre: nombre.trim(),
      cropId,
      sistemaProduccion,
      fechaSiembra: fechaSiembra.trim(),
      areaHa: Number(areaHa),
      plantasPorHa: Number(plantasPorHa),
      rendimientoObjetivoTonHa: Number(rendimientoObjetivoTonHa),
    });
    cargarLotes();
    setGuardando(false);
    router.push({ pathname: '/(setup)/suelo-sustrato', params: { loteId: lote.id } });
  }

  return (
    <FormScreen>
      <Section title="Datos generales del cultivo" subtitle="Paso 1 de 4">
        <LabeledInput
          label="Nombre del lote"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Lote Norte"
        />
        <SegmentedSelect
          label="Cultivo"
          options={CULTIVOS}
          value={cropId}
          onChange={seleccionarCultivo}
        />
        <SegmentedSelect
          label="Sistema de producción"
          options={SISTEMAS}
          value={sistemaProduccion}
          onChange={setSistemaProduccion}
        />
        <LabeledInput
          label="Fecha de siembra o trasplante"
          value={fechaSiembra}
          onChangeText={setFechaSiembra}
          placeholder="AAAA-MM-DD"
        />
        <LabeledInput
          label="Superficie"
          value={areaHa}
          onChangeText={setAreaHa}
          keyboardType="decimal-pad"
          suffix="ha"
        />
        <LabeledInput
          label="Densidad de plantas"
          value={plantasPorHa}
          onChangeText={setPlantasPorHa}
          keyboardType="decimal-pad"
          suffix="plantas/ha"
        />
        <LabeledInput
          label="Rendimiento objetivo"
          value={rendimientoObjetivoTonHa}
          onChangeText={setRendimientoObjetivoTonHa}
          keyboardType="decimal-pad"
          suffix="ton/ha"
        />
      </Section>

      <PrimaryButton
        label="Continuar"
        onPress={continuar}
        disabled={!puedeContinuar}
        loading={guardando}
      />
    </FormScreen>
  );
}
