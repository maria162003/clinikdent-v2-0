/**
 * ============================================================================
 * HOOK DE ESQUEMA DE COLOR
 * Detecta el tema del sistema (claro/oscuro)
 * ============================================================================
 */

import { useColorScheme as _useColorScheme, ColorSchemeName } from 'react-native';

export function useColorScheme(): NonNullable<ColorSchemeName> {
  return _useColorScheme() ?? 'light';
}

export default useColorScheme;
