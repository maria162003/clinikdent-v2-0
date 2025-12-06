/**
 * ============================================================================
 * PANTALLA DE CITAS
 * Gestión de citas: lista, filtros, creación y edición
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
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
import { Colors, CitaEstadoColors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import {
  getCitas,
  createCita,
  updateCita,
  getPacientes,
  getOdontologos,
  type Cita,
  type Usuario,
} from '../../services/database.service';
import { enviarRecordatorioCita, enviarConfirmacionCita } from '../../services/email.service';

type EstadoFiltro = 'todos' | 'programada' | 'confirmada' | 'completada' | 'cancelada';

export default function CitasScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [citas, setCitas] = useState<Cita[]>([]);
  const [filteredCitas, setFilteredCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos');
  
  // Modal de crear/editar
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: 0,
    odontologo_id: 0,
    fecha: '',
    hora: '',
    motivo: '',
    notas: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [pacientes, setPacientes] = useState<Usuario[]>([]);
  const [odontologos, setOdontologos] = useState<Usuario[]>([]);
  
  // Modal de detalle
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const loadCitas = async () => {
    try {
      console.log('📅 Cargando citas...');
      const data = await getCitas();
      setCitas(data);
      setFilteredCitas(data);
      console.log('✅ Citas cargadas:', data.length);
    } catch (error) {
      console.error('❌ Error cargando citas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [pacientesData, odontologosData] = await Promise.all([
        getPacientes(),
        getOdontologos(),
      ]);
      setPacientes(pacientesData);
      setOdontologos(odontologosData);
    } catch (error) {
      console.error('Error cargando datos del formulario:', error);
    }
  };

  useEffect(() => {
    loadCitas();
  }, []);

  useEffect(() => {
    if (estadoFiltro === 'todos') {
      setFilteredCitas(citas);
    } else {
      setFilteredCitas(citas.filter((c) => c.estado === estadoFiltro));
    }
  }, [estadoFiltro, citas]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCitas();
  };

  const openFormModal = async (cita?: Cita) => {
    await loadFormData();
    
    if (cita) {
      setEditingId(cita.id);
      setFormData({
        paciente_id: cita.paciente_id,
        odontologo_id: cita.odontologo_id,
        fecha: cita.fecha,
        hora: cita.hora,
        motivo: cita.motivo || '',
        notas: cita.notas || '',
      });
    } else {
      setEditingId(null);
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        paciente_id: 0,
        odontologo_id: 0,
        fecha: today,
        hora: '09:00',
        motivo: '',
        notas: '',
      });
    }
    setShowFormModal(true);
  };

  const openDetailModal = (cita: Cita) => {
    setSelectedCita(cita);
    setShowDetailModal(true);
  };

  const handleSave = async () => {
    if (!formData.paciente_id || !formData.fecha || !formData.hora) {
      Alert.alert('Error', 'Paciente, fecha y hora son requeridos');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateCita(editingId, formData);
        Alert.alert('Éxito', 'Cita actualizada correctamente');
      } else {
        await createCita(formData);
        Alert.alert('Éxito', 'Cita creada correctamente');
      }
      setShowFormModal(false);
      loadCitas();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la cita');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReminder = async (cita: Cita) => {
    if (!cita.paciente_correo) {
      Alert.alert('Error', 'El paciente no tiene correo electrónico registrado');
      return;
    }

    setSendingEmail(true);
    try {
      const result = await enviarRecordatorioCita({
        correo: cita.paciente_correo,
        pacienteNombre: `${cita.paciente_nombre} ${cita.paciente_apellido}`,
        fecha: new Date(cita.fecha).toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }),
        hora: cita.hora,
        odontologoNombre: `${cita.odontologo_nombre} ${cita.odontologo_apellido}`,
        motivo: cita.motivo,
      });

      if (result.success) {
        Alert.alert('Éxito', 'Recordatorio enviado correctamente');
      } else {
        Alert.alert('Error', result.error || 'No se pudo enviar el recordatorio');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al enviar el recordatorio');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUpdateEstado = async (cita: Cita, nuevoEstado: string) => {
    try {
      await updateCita(cita.id, { estado: nuevoEstado as Cita['estado'] });
      Alert.alert('Éxito', `Cita ${nuevoEstado} correctamente`);
      setShowDetailModal(false);
      loadCitas();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const renderFiltroButton = (estado: EstadoFiltro, label: string) => (
    <TouchableOpacity
      style={[
        styles.filtroButton,
        estadoFiltro === estado && [styles.filtroButtonActive, { backgroundColor: colors.primary }],
      ]}
      onPress={() => setEstadoFiltro(estado)}
    >
      <ThemedText
        style={[
          styles.filtroText,
          estadoFiltro === estado && styles.filtroTextActive,
        ]}
        lightColor={estadoFiltro === estado ? '#fff' : colors.text}
        darkColor={estadoFiltro === estado ? '#fff' : colors.text}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Cargando citas...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFiltroButton('todos', 'Todas')}
          {renderFiltroButton('programada', 'Programadas')}
          {renderFiltroButton('confirmada', 'Confirmadas')}
          {renderFiltroButton('completada', 'Completadas')}
          {renderFiltroButton('cancelada', 'Canceladas')}
        </ScrollView>
      </View>

      {/* Botón de nueva cita */}
      <View style={styles.actionBar}>
        <Button
          title="Nueva Cita"
          onPress={() => openFormModal()}
          icon={<Ionicons name="add-circle-outline" size={20} color="#fff" />}
        />
      </View>

      {/* Lista de citas */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCitas.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              No hay citas {estadoFiltro !== 'todos' ? estadoFiltro + 's' : ''} registradas
            </ThemedText>
          </Card>
        ) : (
          filteredCitas.map((cita) => (
            <Card
              key={cita.id}
              onPress={() => openDetailModal(cita)}
              style={styles.citaCard}
            >
              <View style={styles.citaHeader}>
                <View style={styles.citaFecha}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <ThemedText type="defaultSemiBold" style={styles.fechaText}>
                    {new Date(cita.fecha).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </ThemedText>
                  <ThemedText style={{ marginLeft: 8 }}>
                    {cita.hora}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.estadoBadge,
                    { backgroundColor: CitaEstadoColors[cita.estado] || '#6c757d' },
                  ]}
                >
                  <ThemedText style={styles.estadoText} lightColor="#fff" darkColor="#fff">
                    {cita.estado}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.citaBody}>
                <View style={styles.citaRow}>
                  <Ionicons name="person" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.citaLabel, { color: colors.textSecondary }]}>
                    Paciente:
                  </ThemedText>
                  <ThemedText>
                    {cita.paciente_nombre} {cita.paciente_apellido}
                  </ThemedText>
                </View>
                <View style={styles.citaRow}>
                  <Ionicons name="medkit" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.citaLabel, { color: colors.textSecondary }]}>
                    Odontólogo:
                  </ThemedText>
                  <ThemedText>
                    {cita.odontologo_nombre} {cita.odontologo_apellido}
                  </ThemedText>
                </View>
                {cita.motivo && (
                  <View style={styles.citaRow}>
                    <Ionicons name="document-text" size={16} color={colors.textSecondary} />
                    <ThemedText style={[styles.citaLabel, { color: colors.textSecondary }]}>
                      Motivo:
                    </ThemedText>
                    <ThemedText numberOfLines={1}>{cita.motivo}</ThemedText>
                  </View>
                )}
              </View>
            </Card>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal de detalle */}
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
              Detalle de Cita
            </ThemedText>
            <TouchableOpacity onPress={() => {
              setShowDetailModal(false);
              openFormModal(selectedCita!);
            }}>
              <Ionicons name="create-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedCita && (
              <>
                <Card>
                  <View style={[styles.estadoHeader, { backgroundColor: CitaEstadoColors[selectedCita.estado] }]}>
                    <ThemedText style={styles.estadoHeaderText} lightColor="#fff" darkColor="#fff">
                      {selectedCita.estado.toUpperCase()}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.detailSection}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={20} color={colors.primary} />
                      <ThemedText style={styles.detailLabel}>Fecha:</ThemedText>
                      <ThemedText>
                        {new Date(selectedCita.fecha).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={20} color={colors.primary} />
                      <ThemedText style={styles.detailLabel}>Hora:</ThemedText>
                      <ThemedText>{selectedCita.hora}</ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="person" size={20} color={colors.primary} />
                      <ThemedText style={styles.detailLabel}>Paciente:</ThemedText>
                      <ThemedText>
                        {selectedCita.paciente_nombre} {selectedCita.paciente_apellido}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="mail" size={20} color={colors.primary} />
                      <ThemedText style={styles.detailLabel}>Email:</ThemedText>
                      <ThemedText>{selectedCita.paciente_correo || '-'}</ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="medkit" size={20} color={colors.primary} />
                      <ThemedText style={styles.detailLabel}>Odontólogo:</ThemedText>
                      <ThemedText>
                        {selectedCita.odontologo_nombre} {selectedCita.odontologo_apellido}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text" size={20} color={colors.primary} />
                      <ThemedText style={styles.detailLabel}>Motivo:</ThemedText>
                      <ThemedText>{selectedCita.motivo || 'No especificado'}</ThemedText>
                    </View>
                    {selectedCita.notas && (
                      <View style={styles.detailRow}>
                        <Ionicons name="chatbox" size={20} color={colors.primary} />
                        <ThemedText style={styles.detailLabel}>Notas:</ThemedText>
                        <ThemedText>{selectedCita.notas}</ThemedText>
                      </View>
                    )}
                  </View>
                </Card>

                <Card title="⚡ Acciones">
                  <Button
                    title="Enviar Recordatorio"
                    onPress={() => handleSendReminder(selectedCita)}
                    loading={sendingEmail}
                    icon={<Ionicons name="mail-outline" size={20} color="#fff" />}
                    style={styles.actionButton}
                  />
                  
                  {selectedCita.estado === 'programada' && (
                    <Button
                      title="Confirmar Cita"
                      variant="success"
                      onPress={() => handleUpdateEstado(selectedCita, 'confirmada')}
                      icon={<Ionicons name="checkmark-circle-outline" size={20} color="#fff" />}
                      style={styles.actionButton}
                    />
                  )}
                  
                  {(selectedCita.estado === 'programada' || selectedCita.estado === 'confirmada') && (
                    <>
                      <Button
                        title="Marcar Completada"
                        variant="secondary"
                        onPress={() => handleUpdateEstado(selectedCita, 'completada')}
                        icon={<Ionicons name="checkmark-done-outline" size={20} color={colors.text} />}
                        style={styles.actionButton}
                      />
                      <Button
                        title="Cancelar Cita"
                        variant="danger"
                        onPress={() => {
                          Alert.alert(
                            'Confirmar cancelación',
                            '¿Está seguro de que desea cancelar esta cita?',
                            [
                              { text: 'No', style: 'cancel' },
                              { text: 'Sí, cancelar', onPress: () => handleUpdateEstado(selectedCita, 'cancelada') },
                            ]
                          );
                        }}
                        icon={<Ionicons name="close-circle-outline" size={20} color="#fff" />}
                        style={styles.actionButton}
                      />
                    </>
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
              {editingId ? 'Editar Cita' : 'Nueva Cita'}
            </ThemedText>
            <View style={{ width: 28 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Card title="Seleccionar Paciente" style={styles.pickerCard}>
              {pacientes.length === 0 ? (
                <ThemedText style={styles.emptyText}>Cargando pacientes...</ThemedText>
              ) : (
                <ScrollView style={styles.pickerList} nestedScrollEnabled>
                  {pacientes.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.pickerItem,
                        formData.paciente_id === p.id && { backgroundColor: colors.primaryLight + '30' },
                      ]}
                      onPress={() => setFormData({ ...formData, paciente_id: p.id })}
                    >
                      <ThemedText>{p.nombre} {p.apellido}</ThemedText>
                      {formData.paciente_id === p.id && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </Card>

            <Card title="Seleccionar Odontólogo" style={styles.pickerCard}>
              {odontologos.length === 0 ? (
                <ThemedText style={styles.emptyText}>Cargando odontólogos...</ThemedText>
              ) : (
                <ScrollView style={styles.pickerList} nestedScrollEnabled>
                  {odontologos.map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      style={[
                        styles.pickerItem,
                        formData.odontologo_id === o.id && { backgroundColor: colors.primaryLight + '30' },
                      ]}
                      onPress={() => setFormData({ ...formData, odontologo_id: o.id })}
                    >
                      <ThemedText>Dr/a. {o.nombre} {o.apellido}</ThemedText>
                      {formData.odontologo_id === o.id && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </Card>

            <Input
              label="Fecha"
              value={formData.fecha}
              onChangeText={(text) => setFormData({ ...formData, fecha: text })}
              placeholder="YYYY-MM-DD"
              required
              icon="calendar-outline"
              hint="Formato: 2024-12-25"
            />
            <Input
              label="Hora"
              value={formData.hora}
              onChangeText={(text) => setFormData({ ...formData, hora: text })}
              placeholder="09:00"
              required
              icon="time-outline"
              hint="Formato: 09:00 (24 horas)"
            />
            <Input
              label="Motivo de la consulta"
              value={formData.motivo}
              onChangeText={(text) => setFormData({ ...formData, motivo: text })}
              placeholder="Consulta general, limpieza, etc."
              icon="document-text-outline"
            />
            <Input
              label="Notas adicionales"
              value={formData.notas}
              onChangeText={(text) => setFormData({ ...formData, notas: text })}
              placeholder="Información adicional..."
              multiline
              numberOfLines={3}
              icon="chatbox-outline"
            />
            
            <Button
              title={editingId ? 'Actualizar Cita' : 'Crear Cita'}
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
  filtrosContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  filtroButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filtroButtonActive: {
    borderColor: 'transparent',
  },
  filtroText: {
    fontSize: 14,
  },
  filtroTextActive: {
    fontWeight: '600',
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
  citaCard: {
    marginVertical: 4,
  },
  citaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  citaFecha: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fechaText: {
    marginLeft: 8,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  citaBody: {
    gap: 6,
  },
  citaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  citaLabel: {
    fontSize: 14,
    width: 80,
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
  estadoHeader: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  estadoHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailLabel: {
    fontWeight: '600',
    width: 90,
  },
  actionButton: {
    marginBottom: 10,
  },
  pickerCard: {
    marginBottom: 16,
  },
  pickerList: {
    maxHeight: 150,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});
