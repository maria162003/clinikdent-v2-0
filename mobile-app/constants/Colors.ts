/**
 * ============================================================================
 * CONSTANTES DE COLORES
 * Paleta de colores para la aplicación con soporte para tema claro/oscuro
 * ============================================================================
 */

const tintColorLight = '#667eea';
const tintColorDark = '#8b9fff';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#666',
    background: '#fff',
    backgroundSecondary: '#f8f9fa',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#e0e0e0',
    card: '#ffffff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    primary: '#667eea',
    primaryLight: '#8b9fff',
    gradient: {
      start: '#667eea',
      end: '#764ba2',
    },
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151718',
    backgroundSecondary: '#1f2122',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#2d2d2d',
    card: '#1f2122',
    success: '#4caf50',
    warning: '#ffca28',
    danger: '#f44336',
    info: '#29b6f6',
    primary: '#8b9fff',
    primaryLight: '#b8c4ff',
    gradient: {
      start: '#667eea',
      end: '#764ba2',
    },
  },
};

// Estados de citas
export const CitaEstadoColors = {
  programada: '#ffc107',
  confirmada: '#28a745',
  completada: '#17a2b8',
  cancelada: '#dc3545',
};

// Estados de tratamientos
export const TratamientoEstadoColors = {
  planificado: '#ffc107',
  en_progreso: '#17a2b8',
  completado: '#28a745',
  cancelado: '#dc3545',
};

export default Colors;
