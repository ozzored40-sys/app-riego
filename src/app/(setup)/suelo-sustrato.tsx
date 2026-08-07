import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { FormScreen } from '@/components/form/FormScreen';
import { Section } from '@/components/form/Section';
import { LabeledInput } from '@/components/form/LabeledInput';
import { SegmentedSelect } from '@/components/form/SegmentedSelect';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { db } from '@/data/db/client';
import { obtenerLote } from '@/data/repositories/loteRepository';
import { crearSoilAnalysis } from '@/data/repositories/soilAnalysisRepository';
import { crearSubstrateProfile } from '@/data/repositories/substrateProfileRepository';
import type { Textura } from '@/domain/soil/availabilityCoefficient';

const TEXTURAS: { value: Textura; label: string }[] = [
  { value: 'arenoso', label: 'Arenoso' },
  { value: 'francoArenoso', label: 'Franco arenoso' },
  { value: 'franco', label: 'Franco' },
  { value: 'francoArcilloso', label: 'Franco arcilloso' },
  { value: 'arcilloso', label: 'Arcilloso' },
];

const TIPOS_SUSTRATO = [
  { value: 'fibraCoco', label: 'Fibra de coco' },
  { value: 'perlita', label: 'Perlita' },
  { value: 'peatMoss', label: 'Peat moss' },
  { value: 'tezontle', label: 'Tezontle' },
  { value: 'mezcla', label: 'Mezcla' },
];

function num(valor: string): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

export default function SueloSustratoScreen() {
  const router = useRouter();
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const lote = useMemo(() => (loteId ? obtenerLote(db, loteId) : undefined), [loteId]);
  const esSuelo = lote?.sistemaProduccion === 'suelo';

  // Suelo
  const [textura, setTextura] = useState<Textura>('franco');
  const [profundidadRadicularMm, setProfundidadRadicularMm] = useState('300');
  const [materiaOrganicaPct, setMateriaOrganicaPct] = useState('');
  const [pH, setPH] = useState('');
  const [ceDsM, setCeDsM] = useState('');
  const [cicMeq100g, setCicMeq100g] = useState('');
  const [humedadActualPct, setHumedadActualPct] = useState('');
  const [temperaturaSueloC, setTemperaturaSueloC] = useState('25');
  const [nDisponible, setNDisponible] = useState('');
  const [pDisponible, setPDisponible] = useState('');
  const [kDisponible, setKDisponible] = useState('');
  const [caDisponible, setCaDisponible] = useState('');
  const [mgDisponible, setMgDisponible] = useState('');
  const [sDisponible, setSDisponible] = useState('');

  // Sustrato
  const [tipoSustrato, setTipoSustrato] = useState('fibraCoco');
  const [volumenLitrosPorPlanta, setVolumenLitrosPorPlanta] = useState('');
  const [capacidadRetencionPct, setCapacidadRetencionPct] = useState('');
  const [porcentajeDrenajeObjetivo, setPorcentajeDrenajeObjetivo] = useState('12');
  const [ceSustrato, setCeSustrato] = useState('');
  const [phSustrato, setPhSustrato] = useState('');

  const [guardando, setGuardando] = useState(false);

  if (!lote) {
    return (
      <FormScreen>
        <ThemedText>No se encontró el lote. Vuelve a crear el lote desde el paso 1.</ThemedText>
      </FormScreen>
    );
  }

  function continuar() {
    setGuardando(true);
    const fecha = new Date().toISOString().slice(0, 10);
    if (esSuelo) {
      crearSoilAnalysis(db, {
        loteId: lote!.id,
        fecha,
        textura,
        profundidadRadicularMm: num(profundidadRadicularMm),
        materiaOrganicaPct: num(materiaOrganicaPct),
        pH: num(pH),
        ceDsM: num(ceDsM),
        cicMeq100g: num(cicMeq100g),
        humedadActualPct: humedadActualPct ? num(humedadActualPct) : undefined,
        temperaturaSueloC: num(temperaturaSueloC),
        nutrientesDisponiblesKgHa: {
          N: num(nDisponible),
          P: num(pDisponible),
          K: num(kDisponible),
          Ca: num(caDisponible),
          Mg: num(mgDisponible),
          S: num(sDisponible),
        },
      });
    } else {
      crearSubstrateProfile(db, {
        loteId: lote!.id,
        fecha,
        tipo: tipoSustrato,
        volumenLitrosPorPlanta: num(volumenLitrosPorPlanta),
        capacidadRetencionPct: num(capacidadRetencionPct) / 100,
        porcentajeDrenajeObjetivo: num(porcentajeDrenajeObjetivo) / 100,
        ceDsM: ceSustrato ? num(ceSustrato) : undefined,
        pH: phSustrato ? num(phSustrato) : undefined,
      });
    }
    setGuardando(false);
    router.push({ pathname: '/(setup)/agua', params: { loteId: lote!.id } });
  }

  return (
    <FormScreen>
      {esSuelo ? (
        <Section title="Información del suelo" subtitle="Paso 2 de 4">
          <SegmentedSelect
            label="Textura"
            options={TEXTURAS}
            value={textura}
            onChange={setTextura}
          />
          <LabeledInput
            label="Profundidad efectiva de raíz"
            value={profundidadRadicularMm}
            onChangeText={setProfundidadRadicularMm}
            keyboardType="decimal-pad"
            suffix="mm"
          />
          <LabeledInput
            label="Materia orgánica"
            value={materiaOrganicaPct}
            onChangeText={setMateriaOrganicaPct}
            keyboardType="decimal-pad"
            suffix="%"
          />
          <LabeledInput label="pH" value={pH} onChangeText={setPH} keyboardType="decimal-pad" />
          <LabeledInput
            label="CE"
            value={ceDsM}
            onChangeText={setCeDsM}
            keyboardType="decimal-pad"
            suffix="dS/m"
          />
          <LabeledInput
            label="Capacidad de intercambio catiónico (CIC)"
            value={cicMeq100g}
            onChangeText={setCicMeq100g}
            keyboardType="decimal-pad"
            suffix="meq/100g"
          />
          <LabeledInput
            label="Humedad actual"
            value={humedadActualPct}
            onChangeText={setHumedadActualPct}
            keyboardType="decimal-pad"
            suffix="%"
          />
          <LabeledInput
            label="Temperatura del suelo"
            value={temperaturaSueloC}
            onChangeText={setTemperaturaSueloC}
            keyboardType="decimal-pad"
            suffix="°C"
          />
        </Section>
      ) : (
        <Section title="Información del sustrato" subtitle="Paso 2 de 4">
          <SegmentedSelect
            label="Tipo de sustrato"
            options={TIPOS_SUSTRATO}
            value={tipoSustrato}
            onChange={setTipoSustrato}
          />
          <LabeledInput
            label="Volumen de sustrato por planta"
            value={volumenLitrosPorPlanta}
            onChangeText={setVolumenLitrosPorPlanta}
            keyboardType="decimal-pad"
            suffix="L"
          />
          <LabeledInput
            label="Capacidad de retención de agua"
            value={capacidadRetencionPct}
            onChangeText={setCapacidadRetencionPct}
            keyboardType="decimal-pad"
            suffix="%"
          />
          <LabeledInput
            label="% de drenaje objetivo"
            value={porcentajeDrenajeObjetivo}
            onChangeText={setPorcentajeDrenajeObjetivo}
            keyboardType="decimal-pad"
            suffix="%"
          />
          <LabeledInput
            label="CE del sustrato"
            value={ceSustrato}
            onChangeText={setCeSustrato}
            keyboardType="decimal-pad"
            suffix="dS/m"
          />
          <LabeledInput
            label="pH"
            value={phSustrato}
            onChangeText={setPhSustrato}
            keyboardType="decimal-pad"
          />
        </Section>
      )}

      {esSuelo ? (
        <Section title="Nutrientes disponibles" subtitle="Del análisis de laboratorio, en kg/ha">
          <LabeledInput
            label="N (nitrato)"
            value={nDisponible}
            onChangeText={setNDisponible}
            keyboardType="decimal-pad"
            suffix="kg/ha"
          />
          <LabeledInput
            label="P (fósforo)"
            value={pDisponible}
            onChangeText={setPDisponible}
            keyboardType="decimal-pad"
            suffix="kg/ha"
          />
          <LabeledInput
            label="K (potasio)"
            value={kDisponible}
            onChangeText={setKDisponible}
            keyboardType="decimal-pad"
            suffix="kg/ha"
          />
          <LabeledInput
            label="Ca (calcio)"
            value={caDisponible}
            onChangeText={setCaDisponible}
            keyboardType="decimal-pad"
            suffix="kg/ha"
          />
          <LabeledInput
            label="Mg (magnesio)"
            value={mgDisponible}
            onChangeText={setMgDisponible}
            keyboardType="decimal-pad"
            suffix="kg/ha"
          />
          <LabeledInput
            label="S (azufre)"
            value={sDisponible}
            onChangeText={setSDisponible}
            keyboardType="decimal-pad"
            suffix="kg/ha"
          />
        </Section>
      ) : null}

      <PrimaryButton label="Continuar" onPress={continuar} loading={guardando} />
    </FormScreen>
  );
}
