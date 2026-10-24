import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Pantalla } from '@/components/chaman/ui';
import { DocumentoLegalVista } from '@/components/chaman/DocumentoLegalVista';
import { DOCUMENTOS_LEGALES, type IdDocumentoLegal } from '@/legal/documentos';

export default function DocumentoLegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const documento = DOCUMENTOS_LEGALES[doc as IdDocumentoLegal];

  return (
    <Pantalla edges={['bottom']}>
      {documento ? (
        <DocumentoLegalVista documento={documento} />
      ) : (
        <ThemedText>Documento no encontrado.</ThemedText>
      )}
    </Pantalla>
  );
}
