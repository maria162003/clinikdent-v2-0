/**
 * ============================================================================
 * PANTALLA DE ERROR 404
 * Pantalla mostrada cuando una ruta no existe
 * ============================================================================
 */

import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../components/ThemedText';
import { Button } from '../components/ui/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <>
      <Stack.Screen options={{ title: 'Página no encontrada' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={80} color={colors.warning} />
        <ThemedText type="title" style={styles.title}>
          ¡Oops!
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Esta página no existe
        </ThemedText>
        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
          La página que buscas no se encuentra disponible o ha sido movida.
        </ThemedText>
        <Link href="/" asChild>
          <Button
            title="Volver al Inicio"
            icon={<Ionicons name="home-outline" size={20} color="#fff" />}
            style={styles.button}
          />
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    marginTop: 10,
  },
});
