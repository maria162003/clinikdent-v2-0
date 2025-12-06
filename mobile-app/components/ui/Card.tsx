/**
 * ============================================================================
 * COMPONENTE DE TARJETA
 * Tarjeta reutilizable para mostrar información
 * ============================================================================
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { ThemedText } from '../ThemedText';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({
  children,
  title,
  subtitle,
  footer,
  onPress,
  style,
  variant = 'default',
}: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        };
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: colors.border,
          shadowOpacity: 0,
          elevation: 0,
        };
      default:
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        };
    }
  };

  const CardContent = () => (
    <>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <ThemedText type="subtitle" style={styles.title}>
              {title}
            </ThemedText>
          )}
          {subtitle && (
            <ThemedText
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>
      )}
      <View style={styles.content}>{children}</View>
      {footer && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {footer}
        </View>
      )}
    </>
  );

  const containerStyle = [
    styles.card,
    getVariantStyles(),
    { backgroundColor: colors.card },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      <CardContent />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  footer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});

export default Card;
