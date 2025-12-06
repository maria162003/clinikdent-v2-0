/**
 * ============================================================================
 * COMPONENTE DE BOTÓN
 * Botón reutilizable con variantes y estados
 * ============================================================================
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const getBackgroundColor = () => {
    if (disabled) return '#cccccc';
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.backgroundSecondary;
      case 'danger':
        return colors.danger;
      case 'success':
        return colors.success;
      case 'outline':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#888888';
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return '#ffffff';
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.primary;
      default:
        return '#ffffff';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return colors.primary;
    }
    return 'transparent';
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getTextSize = (): TextStyle => {
    switch (size) {
      case 'small':
        return { fontSize: 14 };
      case 'large':
        return { fontSize: 18 };
      default:
        return { fontSize: 16 };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getSizeStyles(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              getTextSize(),
              { color: getTextColor(), marginLeft: icon ? 8 : 0 },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Button;
