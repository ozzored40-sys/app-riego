import { Platform, type ColorValue } from 'react-native';
import Tabs from 'expo-router/js-tabs';

import { Icono, type NombreIcono } from '@/components/chaman/Icono';
import { useTheme } from '@/hooks/use-theme';

function iconoPestana(nombre: NombreIcono) {
  return function IconoPestana({ color }: { color: ColorValue }) {
    return <Icono nombre={nombre} color={color} tamano={24} />;
  };
}

/**
 * Pestañas principales del Centro de Comando Chamán 4.0: unifica el sistema de riego y
 * nutrición (Campo) con los módulos comerciales y de IA del prototipo de AI Studio.
 */
export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
          // En web no hay área segura inferior: se da aire para que la etiqueta no quede al borde.
          ...(Platform.OS === 'web' ? { height: 60, paddingBottom: 6 } : null),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: iconoPestana('inicio') }} />
      <Tabs.Screen name="campo" options={{ title: 'Campo', tabBarIcon: iconoPestana('campo') }} />
      <Tabs.Screen
        name="diagnostico"
        options={{ title: 'Dictamen', tabBarIcon: iconoPestana('diagnostico') }}
      />
      <Tabs.Screen
        name="especialistas"
        options={{ title: 'IA', tabBarIcon: iconoPestana('especialistas') }}
      />
      <Tabs.Screen name="crm" options={{ title: 'CRM', tabBarIcon: iconoPestana('crm') }} />
      <Tabs.Screen name="mas" options={{ title: 'Más', tabBarIcon: iconoPestana('mas') }} />
    </Tabs>
  );
}
