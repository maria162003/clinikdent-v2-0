/**
 * ============================================================================
 * PANTALLA DE DASHBOARD
 * Pantalla principal con estadísticas y accesos rápidos
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/ThemedText';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { getEstadisticas, getCitas, type Estadisticas, type Cita } from '../../services/database.service';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  const [stats, setStats] = useState<Estadisticas>({
    totalPacientes: 0,
    citasHoy: 0,
    citasPendientes: 0,
    tratamientosActivos: 0,
  });
  const [citasRecientes, setCitasRecientes] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      console.log('📊 Cargando datos del dashboard...');
      const [estadisticas, citas] = await Promise.all([
        getEstadisticas(),
        getCitas(),
      ]);
      
      setStats(estadisticas);
      setCitasRecientes(citas.slice(0, 5)); // Últimas 5 citas
      console.log('✅ Datos del dashboard cargados');
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Cargando dashboard...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header de bienvenida */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <ThemedText style={styles.welcomeText} lightColor="#fff" darkColor="#fff">
          ¡Bienvenido a Clinikdent!
        </ThemedText>
        <ThemedText style={styles.dateText} lightColor="rgba(255,255,255,0.8)" darkColor="rgba(255,255,255,0.8)">
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </ThemedText>
      </View>

      {/* Tarjetas de estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
            <View style={styles.statContent}>
              <Ionicons name="people" size={32} color="#1976d2" />
              <ThemedText style={[styles.statNumber, { color: '#1976d2' }]}>
                {stats.totalPacientes}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Pacientes</ThemedText>
            </View>
          </Card>
          
          <Card style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
            <View style={styles.statContent}>
              <Ionicons name="today" size={32} color="#388e3c" />
              <ThemedText style={[styles.statNumber, { color: '#388e3c' }]}>
                {stats.citasHoy}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Citas Hoy</ThemedText>
            </View>
          </Card>
        </View>
        
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
            <View style={styles.statContent}>
              <Ionicons name="time" size={32} color="#f57c00" />
              <ThemedText style={[styles.statNumber, { color: '#f57c00' }]}>
                {stats.citasPendientes}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Pendientes</ThemedText>
            </View>
          </Card>
          
          <Card style={[styles.statCard, { backgroundColor: '#fce4ec' }]}>
            <View style={styles.statContent}>
              <Ionicons name="medkit" size={32} color="#c2185b" />
              <ThemedText style={[styles.statNumber, { color: '#c2185b' }]}>
                {stats.tratamientosActivos}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Tratamientos</ThemedText>
            </View>
          </Card>
        </View>
      </View>

      {/* Accesos rápidos */}
      <Card title="⚡ Accesos Rápidos" style={styles.quickActions}>
        <View style={styles.actionsRow}>
          <Button
            title="Nueva Cita"
            variant="primary"
            size="small"
            onPress={() => router.push('/citas')}
            icon={<Ionicons name="add-circle-outline" size={18} color="#fff" />}
            style={styles.actionButton}
          />
          <Button
            title="Pacientes"
            variant="outline"
            size="small"
            onPress={() => router.push('/pacientes')}
            icon={<Ionicons name="people-outline" size={18} color={colors.primary} />}
            style={styles.actionButton}
          />
        </View>
        <View style={styles.actionsRow}>
          <Button
            title="Reportes"
            variant="secondary"
            size="small"
            onPress={() => router.push('/reportes')}
            icon={<Ionicons name="document-text-outline" size={18} color={colors.text} />}
            style={styles.actionButton}
          />
        </View>
      </Card>

      {/* Citas recientes */}
      <Card title="📅 Citas Recientes" style={styles.recentCard}>
        {citasRecientes.length === 0 ? (
          <ThemedText style={styles.emptyText}>No hay citas recientes</ThemedText>
        ) : (
          citasRecientes.map((cita) => (
            <View key={cita.id} style={[styles.citaItem, { borderBottomColor: colors.border }]}>
              <View style={styles.citaInfo}>
                <ThemedText type="defaultSemiBold">
                  {cita.paciente_nombre} {cita.paciente_apellido}
                </ThemedText>
                <ThemedText style={{ color: colors.textSecondary }}>
                  {new Date(cita.fecha).toLocaleDateString('es-ES')} - {cita.hora}
                </ThemedText>
              </View>
              <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(cita.estado) }]}>
                <ThemedText style={styles.estadoText}>{cita.estado}</ThemedText>
              </View>
            </View>
          ))
        )}
      </Card>

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
          Clinikdent Mobile v1.0.0
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const getEstadoColor = (estado: string): string => {
  switch (estado) {
    case 'programada':
      return '#ffc107';
    case 'confirmada':
      return '#28a745';
    case 'completada':
      return '#17a2b8';
    case 'cancelada':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
  },
  statsContainer: {
    padding: 16,
    paddingTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 0,
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  recentCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
  citaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  citaInfo: {
    flex: 1,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  estadoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});
