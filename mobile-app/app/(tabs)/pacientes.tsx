/**
 * ============================================================================
 * PANTALLA DE PACIENTES
 * Gestión de pacientes: lista, búsqueda, creación y edición
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
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
  getPacientes,
  createPaciente,
  updatePaciente,
  getCitasByPaciente,
  getTratamientosByPaciente,
  type Usuario,
  type Cita,
  type PacienteTratamiento,
} from '../../services/database.service';

export default function PacientesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [pacientes, setPacientes] = useState<Usuario[]>([]);
  const [filteredPacientes, setFilteredPacientes] = useState<Usuario[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal de detalle
  const [selectedPaciente, setSelectedPaciente] = useState<Usuario | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pacienteCitas, setPacienteCitas] = useState<Cita[]>([]);
  const [pacienteTratamientos, setPacienteTratamientos] = useState<PacienteTratamiento[]>([]);
  
  // Modal de crear/editar
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    tipo_documento: '',
    numero_documento: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPacientes = async () => {
    try {
      console.log('👥 Cargando pacientes...');
      const data = await getPacientes();
      setPacientes(data);
      setFilteredPacientes(data);
      console.log('✅ Pacientes cargados:', data.length);
    } catch (error) {
      console.error('❌ Error cargando pacientes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPacientes(pacientes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = pacientes.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(query) ||
          p.apellido?.toLowerCase().includes(query) ||
          p.correo?.toLowerCase().includes(query) ||
          p.numero_documento?.toLowerCase().includes(query)
      );
      setFilteredPacientes(filtered);
    }
  }, [searchQuery, pacientes]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPacientes();
  };

  const openPacienteDetail = async (paciente: Usuario) => {
    setSelectedPaciente(paciente);
    setShowDetailModal(true);
    
    // Cargar citas y tratamientos del paciente
    try {
      const [citas, tratamientos] = await Promise.all([
        getCitasByPaciente(paciente.id),
        getTratamientosByPaciente(paciente.id),
      ]);
      setPacienteCitas(citas);
      setPacienteTratamientos(tratamientos);
    } catch (error) {
      console.error('Error cargando datos del paciente:', error);
    }
  };

  const openFormModal = (paciente?: Usuario) => {
    if (paciente) {
      setEditingId(paciente.id);
      setFormData({
        nombre: paciente.nombre || '',
        apellido: paciente.apellido || '',
        correo: paciente.correo || '',
        telefono: paciente.telefono || '',
        tipo_documento: paciente.tipo_documento || '',
        numero_documento: paciente.numero_documento || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '',
        apellido: '',
        correo: '',
        telefono: '',
        tipo_documento: '',
        numero_documento: '',
      });
    }
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.apellido) {
      Alert.alert('Error', 'Nombre y apellido son requeridos');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updatePaciente(editingId, formData);
        Alert.alert('Éxito', 'Paciente actualizado correctamente');
      } else {
        await createPaciente(formData);
        Alert.alert('Éxito', 'Paciente creado correctamente');
      }
      setShowFormModal(false);
      loadPacientes();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el paciente');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Cargando pacientes...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Barra de búsqueda */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar pacientes..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Botón de nuevo paciente */}
      <View style={styles.actionBar}>
        <Button
          title="Nuevo Paciente"
          onPress={() => openFormModal()}
          icon={<Ionicons name="add-circle-outline" size={20} color="#fff" />}
        />
      </View>

      {/* Lista de pacientes */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredPacientes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              {searchQuery ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
            </ThemedText>
          </Card>
        ) : (
          filteredPacientes.map((paciente) => (
            <Card
              key={paciente.id}
              onPress={() => openPacienteDetail(paciente)}
              style={styles.pacienteCard}
            >
              <View style={styles.pacienteRow}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <ThemedText style={styles.avatarText} lightColor="#fff" darkColor="#fff">
                    {(paciente.nombre?.charAt(0) || '?')}{(paciente.apellido?.charAt(0) || '')}
                  </ThemedText>
                </View>
                <View style={styles.pacienteInfo}>
                  <ThemedText type="defaultSemiBold">
                    {paciente.nombre} {paciente.apellido}
                  </ThemedText>
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>
                    {paciente.correo || 'Sin correo'}
                  </ThemedText>
                  {paciente.telefono && (
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>
                      📞 {paciente.telefono}
                    </ThemedText>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.icon} />
              </View>
            </Card>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal de detalle del paciente */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle} lightColor="#fff" darkColor="#fff">
              Detalle del Paciente
            </ThemedText>
            <TouchableOpacity onPress={() => {
              setShowDetailModal(false);
              openFormModal(selectedPaciente!);
            }}>
              <Ionicons name="create-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedPaciente && (
              <>
                <Card title="📋 Información Personal">
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Nombre:</ThemedText>
                    <ThemedText>{selectedPaciente.nombre} {selectedPaciente.apellido}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Correo:</ThemedText>
                    <ThemedText>{selectedPaciente.correo || '-'}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Teléfono:</ThemedText>
                    <ThemedText>{selectedPaciente.telefono || '-'}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Documento:</ThemedText>
                    <ThemedText>
                      {selectedPaciente.tipo_documento} {selectedPaciente.numero_documento || '-'}
                    </ThemedText>
                  </View>
                </Card>

                <Card title={`📅 Historial de Citas (${pacienteCitas.length})`}>
                  {pacienteCitas.length === 0 ? (
                    <ThemedText style={styles.emptyText}>Sin citas registradas</ThemedText>
                  ) : (
                    pacienteCitas.slice(0, 5).map((cita) => (
                      <View key={cita.id} style={[styles.historialItem, { borderBottomColor: colors.border }]}>
                        <ThemedText>
                          {new Date(cita.fecha).toLocaleDateString('es-ES')} - {cita.hora}
                        </ThemedText>
                        <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                          {cita.motivo || 'Consulta general'} - {cita.estado}
                        </ThemedText>
                      </View>
                    ))
                  )}
                </Card>

                <Card title={`💊 Tratamientos (${pacienteTratamientos.length})`}>
                  {pacienteTratamientos.length === 0 ? (
                    <ThemedText style={styles.emptyText}>Sin tratamientos registrados</ThemedText>
                  ) : (
                    pacienteTratamientos.map((t) => (
                      <View key={t.id} style={[styles.historialItem, { borderBottomColor: colors.border }]}>
                        <ThemedText type="defaultSemiBold">{t.nombre_tratamiento}</ThemedText>
                        <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                          {t.estado} - Desde {new Date(t.fecha_inicio).toLocaleDateString('es-ES')}
                        </ThemedText>
                      </View>
                    ))
                  )}
                </Card>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de formulario */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
            <TouchableOpacity onPress={() => setShowFormModal(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle} lightColor="#fff" darkColor="#fff">
              {editingId ? 'Editar Paciente' : 'Nuevo Paciente'}
            </ThemedText>
            <View style={{ width: 28 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Input
              label="Nombre"
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              placeholder="Ingrese el nombre"
              required
              icon="person-outline"
            />
            <Input
              label="Apellido"
              value={formData.apellido}
              onChangeText={(text) => setFormData({ ...formData, apellido: text })}
              placeholder="Ingrese el apellido"
              required
              icon="person-outline"
            />
            <Input
              label="Correo electrónico"
              value={formData.correo}
              onChangeText={(text) => setFormData({ ...formData, correo: text })}
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
            />
            <Input
              label="Teléfono"
              value={formData.telefono}
              onChangeText={(text) => setFormData({ ...formData, telefono: text })}
              placeholder="300 123 4567"
              keyboardType="phone-pad"
              icon="call-outline"
            />
            <Input
              label="Tipo de documento"
              value={formData.tipo_documento}
              onChangeText={(text) => setFormData({ ...formData, tipo_documento: text })}
              placeholder="CC, CE, TI, etc."
              icon="card-outline"
            />
            <Input
              label="Número de documento"
              value={formData.numero_documento}
              onChangeText={(text) => setFormData({ ...formData, numero_documento: text })}
              placeholder="1234567890"
              keyboardType="numeric"
              icon="card-outline"
            />
            
            <Button
              title={editingId ? 'Actualizar' : 'Crear Paciente'}
              onPress={handleSave}
              loading={saving}
              style={styles.saveButton}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  actionBar: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
  pacienteCard: {
    marginVertical: 4,
  },
  pacienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pacienteInfo: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  detailLabel: {
    fontWeight: '600',
    width: 100,
  },
  historialItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});
