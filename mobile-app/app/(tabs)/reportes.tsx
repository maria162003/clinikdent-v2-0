/**
 * ============================================================================
 * PANTALLA DE REPORTES
 * Generación de reportes en PDF
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/ThemedText';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import {
  generarReportePacientes,
  generarReporteCitas,
  generarReporteTratamientos,
  verificarCompartirDisponible,
} from '../../services/report.service';

type TipoReporte = 'pacientes' | 'citas' | 'tratamientos';

export default function ReportesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('pacientes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [generando, setGenerando] = useState(false);

  const handleGenerarReporte = async () => {
    setGenerando(true);
    try {
      // Verificar si compartir está disponible
      const compartirDisponible = await verificarCompartirDisponible();
      if (!compartirDisponible) {
        Alert.alert('Aviso', 'La funcionalidad de compartir no está disponible en este dispositivo');
      }

      let resultado;
      switch (tipoReporte) {
        case 'pacientes':
          resultado = await generarReportePacientes();
          break;
        case 'citas':
          resultado = await generarReporteCitas(fechaInicio || undefined, fechaFin || undefined);
          break;
        case 'tratamientos':
          resultado = await generarReporteTratamientos();
          break;
      }

      if (resultado.success) {
        Alert.alert('Éxito', resultado.message);
      } else {
        Alert.alert('Error', resultado.message);
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      Alert.alert('Error', 'No se pudo generar el reporte');
    } finally {
      setGenerando(false);
    }
  };

  const renderTipoButton = (tipo: TipoReporte, label: string, icon: string) => (
    <Button
      title={label}
      variant={tipoReporte === tipo ? 'primary' : 'outline'}
      onPress={() => setTipoReporte(tipo)}
      icon={<Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={tipoReporte === tipo ? '#fff' : colors.primary} />}
      style={styles.tipoButton}
    />
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Ionicons name="document-text" size={48} color="#fff" />
        <ThemedText style={styles.headerTitle} lightColor="#fff" darkColor="#fff">
          Centro de Reportes
        </ThemedText>
        <ThemedText style={styles.headerSubtitle} lightColor="rgba(255,255,255,0.8)" darkColor="rgba(255,255,255,0.8)">
          Genera reportes en PDF de tu clínica
        </ThemedText>
      </View>

      {/* Selección de tipo de reporte */}
      <Card title="📋 Tipo de Reporte" style={styles.card}>
        <View style={styles.tipoButtons}>
          {renderTipoButton('pacientes', 'Pacientes', 'people-outline')}
          {renderTipoButton('citas', 'Citas', 'calendar-outline')}
          {renderTipoButton('tratamientos', 'Tratamientos', 'medkit-outline')}
        </View>
        
        <View style={styles.tipDescription}>
          {tipoReporte === 'pacientes' && (
            <>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
                Lista completa de todos los pacientes registrados con sus datos de contacto
              </ThemedText>
            </>
          )}
          {tipoReporte === 'citas' && (
            <>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
                Historial de citas con fechas, horarios, pacientes y estados
              </ThemedText>
            </>
          )}
          {tipoReporte === 'tratamientos' && (
            <>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
                Catálogo de tratamientos disponibles con descripciones y precios
              </ThemedText>
            </>
          )}
        </View>
      </Card>

      {/* Filtros de fecha (solo para citas) */}
      {tipoReporte === 'citas' && (
        <Card title="📅 Filtros de Fecha" subtitle="Opcional - Deja vacío para todas las citas" style={styles.card}>
          <Input
            label="Fecha Inicio"
            value={fechaInicio}
            onChangeText={setFechaInicio}
            placeholder="YYYY-MM-DD"
            icon="calendar-outline"
            hint="Ej: 2024-01-01"
          />
          <Input
            label="Fecha Fin"
            value={fechaFin}
            onChangeText={setFechaFin}
            placeholder="YYYY-MM-DD"
            icon="calendar-outline"
            hint="Ej: 2024-12-31"
          />
        </Card>
      )}

      {/* Vista previa */}
      <Card title="👁️ Vista Previa" style={styles.card}>
        <View style={[styles.previewBox, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.previewHeader}>
            <Ionicons name="document" size={32} color={colors.primary} />
            <ThemedText type="defaultSemiBold">
              Reporte de {tipoReporte.charAt(0).toUpperCase() + tipoReporte.slice(1)}
            </ThemedText>
          </View>
          <View style={styles.previewContent}>
            <View style={styles.previewRow}>
              <ThemedText style={{ color: colors.textSecondary }}>Formato:</ThemedText>
              <ThemedText>PDF</ThemedText>
            </View>
            <View style={styles.previewRow}>
              <ThemedText style={{ color: colors.textSecondary }}>Contenido:</ThemedText>
              <ThemedText>
                {tipoReporte === 'pacientes' && 'Lista de pacientes'}
                {tipoReporte === 'citas' && 'Historial de citas'}
                {tipoReporte === 'tratamientos' && 'Catálogo de tratamientos'}
              </ThemedText>
            </View>
            {tipoReporte === 'citas' && (fechaInicio || fechaFin) && (
              <View style={styles.previewRow}>
                <ThemedText style={{ color: colors.textSecondary }}>Período:</ThemedText>
                <ThemedText>
                  {fechaInicio || 'Inicio'} - {fechaFin || 'Actualidad'}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </Card>

      {/* Botón de generar */}
      <Card style={styles.card}>
        <Button
          title="Generar y Descargar PDF"
          onPress={handleGenerarReporte}
          loading={generando}
          icon={<Ionicons name="download-outline" size={20} color="#fff" />}
          size="large"
        />
        <ThemedText style={[styles.disclaimer, { color: colors.textSecondary }]}>
          El PDF se generará y se abrirá el diálogo para compartir o guardar
        </ThemedText>
      </Card>

      {/* Información adicional */}
      <Card title="ℹ️ Información" variant="outlined" style={styles.card}>
        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <ThemedText style={styles.infoText}>
            Los reportes se generan localmente en tu dispositivo
          </ThemedText>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="cloud-offline" size={20} color={colors.info} />
          <ThemedText style={styles.infoText}>
            Los datos se obtienen directamente de Supabase
          </ThemedText>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="share-social" size={20} color={colors.primary} />
          <ThemedText style={styles.infoText}>
            Puedes compartir el PDF por email, WhatsApp, etc.
          </ThemedText>
        </View>
      </Card>

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
          Clinikdent Mobile - Reportes v1.0
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tipoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tipoButton: {
    flex: 1,
    minWidth: '30%',
  },
  tipDescription: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(23, 162, 184, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
  },
  previewBox: {
    borderRadius: 8,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  previewContent: {
    gap: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});
