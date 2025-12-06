/**
 * ============================================================================
 * LAYOUT PRINCIPAL DE LA APLICACIÓN
 * Configuración del Stack Navigator y proveedores
 * ============================================================================
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
