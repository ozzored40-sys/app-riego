import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Atrás' }}>
      <Stack.Screen name="crear-lote" options={{ title: '1. Crear lote' }} />
      <Stack.Screen name="suelo-sustrato" options={{ title: '2. Suelo o sustrato' }} />
      <Stack.Screen name="agua" options={{ title: '3. Agua' }} />
      <Stack.Screen name="riego" options={{ title: '4. Riego' }} />
    </Stack>
  );
}
