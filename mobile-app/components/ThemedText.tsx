/**
 * ============================================================================
 * COMPONENTE DE TEXTO CON TEMA
 * Texto con soporte para tema claro/oscuro
 * ============================================================================
 */

import { Text, type TextProps, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const color = colorScheme === 'light'
    ? lightColor ?? Colors.light.text
    : darkColor ?? Colors.dark.text;

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#667eea',
  },
});

export default ThemedText;
