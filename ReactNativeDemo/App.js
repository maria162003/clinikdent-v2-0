import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { StyleSheet } from 'react-native';

const API_BASE = 'http://localhost:3001/api';
const palette = {
  bg: '#0d1117',
  card: '#111827',
  accent: '#22d3ee',
  accentMuted: '#0ea5e9',
  surface: '#1f2937',
  text: '#e5e7eb',
  muted: '#94a3b8',
  success: '#34d399',
  warning: '#f59e0b',
  danger: '#f87171',
};

const actions = [
  { id: 'resumen', label: 'Resumen', icon: '📋', helper: 'Paciente + últimas citas' },
  { id: 'citas', label: 'Citas', icon: '📅', helper: 'Listado completo de citas' },
  { id: 'reporte', label: 'Reporte', icon: '📊', helper: 'Excel + verificación BD' },
  { id: 'pqrs', label: 'PQRS', icon: '💬', helper: 'Registrar solicitud en BD' },
];

export default function App() {
  const [pacienteId, setPacienteId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [modalPacientes, setModalPacientes] = useState(false);
  const [modalResultado, setModalResultado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [accionActual, setAccionActual] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      const res = await fetch(`${API_BASE}/pacientes`);
      const data = await res.json();
      if (data.success && data.pacientes) setPacientes(data.pacientes.slice(0, 30));
    } catch (err) {
      console.error('Error cargando pacientes:', err);
    }
  };

  const seleccionarPaciente = (pac) => {
    setPacienteId(String(pac.id));
    setEmail(pac.correo || '');
    setModalPacientes(false);
  };

  const descargarExcel = async () => {
    try {
      const fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const fechaFin = new Date().toISOString().split('T')[0];

      const url = `${API_BASE}/react-native-reportes/financiero`;
      const body = { fechaInicio, fechaFin, pacienteId: pacienteId ? Number(pacienteId) : undefined };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const blob = await response.blob();
      if (typeof window === 'undefined') return;

      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `reporte_financiero_${fechaInicio}_${fechaFin}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
    } catch (err) {
      console.error('Error descargando Excel:', err);
      alert('No se pudo descargar el Excel');
    }
  };

  const ejecutarAccion = async (tipo) => {
    setLoading(true);
    setResultado(null);
    setAccionActual(tipo);

    try {
      let url = '';
      let body = {};
      const fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const fechaFin = new Date().toISOString().split('T')[0];

      switch (tipo) {
        case 'resumen':
          url = `${API_BASE}/react-native/trigger`;
          body = { pacienteId: pacienteId ? Number(pacienteId) : undefined, email: email || undefined, motivo: 'Resumen clínico' };
          break;
        case 'citas':
          url = `${API_BASE}/react-native-extras/citas`;
          body = { pacienteId: pacienteId ? Number(pacienteId) : undefined, email: email || undefined };
          break;
        case 'reporte':
          url = `${API_BASE}/react-native-reportes/financiero`;
          body = { fechaInicio, fechaFin, pacienteId: pacienteId ? Number(pacienteId) : undefined, email: email || undefined };
          break;
        case 'pqrs':
          url = `${API_BASE}/react-native-extras/pqrs`;
          body = {
            pacienteId: pacienteId ? Number(pacienteId) : undefined,
            tipo: 'consulta',
            asunto: 'Consulta desde app móvil',
            mensaje: 'Solicitud generada desde la app',
          };
          break;
        default:
          throw new Error('Acción no válida');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || `Error ${response.status}`);

      setResultado(data);
      setModalResultado(true);
    } catch (err) {
      setResultado({ success: false, error: err.message });
      setModalResultado(true);
    } finally {
      setLoading(false);
    }
  };

  const pacientesFiltrados = useMemo(() => {
    if (!search) return pacientes;
    const term = search.toLowerCase();
    return pacientes.filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().includes(term) || `${p.id}`.includes(term));
  }, [search, pacientes]);

  const renderPaciente = ({ item }) => (
    <TouchableOpacity style={styles.pacienteItem} onPress={() => seleccionarPaciente(item)} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.nombre?.charAt(0)?.toUpperCase()}
          {item.apellido?.charAt(0)?.toUpperCase()}
        </Text>
      </View>
      <View style={styles.pacienteInfo}>
        <Text style={styles.pacienteNombre}>{item.nombre} {item.apellido}</Text>
        <Text style={styles.pacienteEmail}>{item.correo}</Text>
        <Text style={styles.pacienteId}>ID: {item.id}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  const renderResultado = () => {
    if (!resultado) return null;
    if (!resultado.success) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMsg}>{resultado.error || 'No se pudo completar la acción'}</Text>
        </View>
      );
    }

    switch (accionActual) {
      case 'resumen':
        return (
          <View>
            <Section title="Ficha del paciente">
              <Text style={styles.value}>{resultado.patient?.nombre} {resultado.patient?.apellido}</Text>
              <Text style={styles.muted}>{resultado.patient?.correo}</Text>
            </Section>
            <Section title="Últimas citas" helper={`${resultado.appointments?.length || 0} encontradas`}>
              {resultado.appointments?.slice(0, 3).map((c, i) => (
                <CitaCard key={i} motivo={c.motivo} fecha={c.fechaLegible} hora={c.horaLegible} estado={c.estado} />
              ))}
            </Section>
          </View>
        );
      case 'citas':
        return (
          <Section title="Listado de citas" helper={`${resultado.citas?.length || 0} citas`}>
            {resultado.citas?.slice(0, 6).map((c, i) => (
              <CitaCard key={i} motivo={c.motivo} fecha={c.fechaLegible} hora={c.horaLegible} estado={c.estado} />
            ))}
          </Section>
        );
      case 'reporte':
        return (
          <ScrollView style={{ maxHeight: 520 }}>
            <Section title="Consulta BD">
              <Text style={styles.muted}>Servidor: {resultado.consultaBD?.servidor}</Text>
              <Text style={styles.muted}>Tabla: {resultado.consultaBD?.tabla}</Text>
              <Text style={styles.muted}>Timestamp: {new Date(resultado.consultaBD?.timestamp).toLocaleString('es-CO')}</Text>
              <Text style={styles.muted}>Registros: {resultado.consultaBD?.registrosEncontrados}</Text>
            </Section>
            <Section title="Reporte financiero">
              <Stat label="Total" value={resultado.data?.registros || 0} />
              <Stat label="Período" value={`${resultado.data?.fechaInicio} / ${resultado.data?.fechaFin}`} />
              {resultado.data?.pacienteId && <Stat label="Paciente ID" value={resultado.data.pacienteId} />}
              <TouchableOpacity style={styles.primaryButton} onPress={descargarExcel} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>📥 Descargar Excel</Text>
              </TouchableOpacity>
              {resultado.data?.emailEnviado && (
                <View style={styles.successBadge}>
                  <Text style={styles.successText}>Enviado a {resultado.data.destinatario}</Text>
                </View>
              )}
            </Section>
            {resultado.data?.citasCompletas?.length > 0 && (
              <Section title="Datos completos">
                {resultado.data.citasCompletas.map((item, i) => (
                  <View key={i} style={styles.citaFull}>
                    <Text style={styles.citaFullTitle}>#{i + 1} • {item.fecha_formateada || item.fecha}</Text>
                    <Text style={styles.muted}>Paciente: {item.paciente}</Text>
                    <Text style={styles.value}>{item.concepto}</Text>
                    <View style={styles.rowBetween}>
                      <Text style={styles.tag}>{item.estado}</Text>
                      <Text style={styles.muted}>ID: {item.id}</Text>
                    </View>
                    {item.notas && item.notas !== 'Sin notas' && (
                      <Text style={styles.note}>💬 {item.notas}</Text>
                    )}
                  </View>
                ))}
              </Section>
            )}
          </ScrollView>
        );
      case 'pqrs':
        return (
          <Section title="PQRS registrada">
            <Stat label="ID" value={resultado.pqrs?.id} />
            <Stat label="Estado" value={resultado.pqrs?.estado} />
          </Section>
        );
      default:
        return <Text style={styles.value}>{JSON.stringify(resultado, null, 2)}</Text>;
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={palette.bg} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.badge}>React Native • Supabase</Text>
            <Text style={styles.title}>Clinikdent Webhooks</Text>
            <Text style={styles.subtitle}>4 controladores activos: pacientes, citas, reportes y PQRS.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Paciente</Text>
            <TouchableOpacity style={styles.select} onPress={() => setModalPacientes(true)} activeOpacity={0.85}>
              <Text style={styles.selectText}>{pacienteId ? `Paciente #${pacienteId}` : 'Selecciona un paciente'}</Text>
              <Text style={styles.chevron}>⌄</Text>
            </TouchableOpacity>
            <Text style={styles.sectionLabel}>Email (opcional)</Text>
            <TextInput
              placeholder="correo@ejemplo.com"
              placeholderTextColor={palette.muted}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <View style={styles.hintBox}>
              <Text style={styles.hint}>Tip: abre el backend en puerto 3001 antes de probar.</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            {actions.map((a) => (
              <TouchableOpacity key={a.id} style={styles.action} onPress={() => ejecutarAccion(a.id)} activeOpacity={0.85}>
                <View style={styles.actionIcon}><Text style={styles.actionIconText}>{a.icon}</Text></View>
                <Text style={styles.actionLabel}>{a.label}</Text>
                <Text style={styles.actionHelper}>{a.helper}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionLabel}>Resultado</Text>
              {loading && <ActivityIndicator color={palette.accent} />}
            </View>
            {resultado ? renderResultado() : <Text style={styles.muted}>Aún no hay datos. Ejecuta un webhook.</Text>}
          </View>
        </ScrollView>

        {/* Modal Pacientes */}
        <Modal visible={modalPacientes} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionLabel}>Pacientes</Text>
                <TouchableOpacity onPress={() => setModalPacientes(false)}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Buscar por nombre o ID"
                placeholderTextColor={palette.muted}
                value={search}
                onChangeText={setSearch}
              />
              <FlatList
                data={pacientesFiltrados}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderPaciente}
                contentContainerStyle={{ paddingVertical: 6 }}
              />
            </View>
          </View>
        </Modal>

        {/* Modal Resultado */}
        <Modal visible={modalResultado} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionLabel}>Detalle</Text>
                <TouchableOpacity onPress={() => setModalResultado(false)}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 520 }}>{renderResultado()}</ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const Section = ({ title, helper, children }) => (
  <View style={styles.section}>
    <View style={styles.rowBetween}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {helper ? <Text style={styles.muted}>{helper}</Text> : null}
    </View>
    {children}
  </View>
);

const Stat = ({ label, value }) => (
  <View style={styles.statRow}>
    <Text style={styles.muted}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const CitaCard = ({ motivo, fecha, hora, estado }) => (
  <View style={styles.citaCard}>
    <Text style={styles.value}>{motivo}</Text>
    <Text style={styles.muted}>{fecha} • {hora}</Text>
    <Text style={styles.tag}>{estado}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 18, paddingBottom: 32 },
  hero: { backgroundColor: palette.surface, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#1f2937' },
  badge: { color: palette.accent, fontWeight: '600', marginBottom: 6 },
  title: { color: palette.text, fontSize: 22, fontWeight: '700' },
  subtitle: { color: palette.muted, marginTop: 4 },
  card: { backgroundColor: palette.card, padding: 16, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: '#1f2937' },
  sectionLabel: { color: palette.text, fontWeight: '700', marginBottom: 8 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1f2937', marginBottom: 12 },
  selectText: { color: palette.text, fontWeight: '600' },
  input: { backgroundColor: palette.surface, borderColor: '#1f2937', borderWidth: 1, borderRadius: 12, padding: 12, color: palette.text, marginBottom: 10 },
  hintBox: { backgroundColor: '#0f172a', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1f2937' },
  hint: { color: palette.muted },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  action: { flexBasis: '48%', backgroundColor: palette.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1f2937' },
  actionIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#0b2536', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionIconText: { fontSize: 18 },
  actionLabel: { color: palette.text, fontWeight: '700' },
  actionHelper: { color: palette.muted, marginTop: 2 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { marginTop: 6, marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  value: { color: palette.text, fontWeight: '700', marginBottom: 2 },
  muted: { color: palette.muted },
  primaryButton: { backgroundColor: palette.accent, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#0f172a', fontWeight: '700' },
  successBadge: { backgroundColor: '#0f172a', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#14532d', marginTop: 8 },
  successText: { color: palette.success, fontWeight: '600' },
  citaCard: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1f2937', marginBottom: 8 },
  tag: { color: palette.accent, fontWeight: '700', marginTop: 4 },
  citaFull: { backgroundColor: '#0f172a', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1f2937', marginBottom: 8 },
  citaFullTitle: { color: palette.text, fontWeight: '700', marginBottom: 4 },
  note: { color: palette.muted, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: palette.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1f2937', maxHeight: '90%' },
  close: { color: palette.muted, fontSize: 16 },
  pacienteItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: '#1f2937', borderBottomWidth: 1 },
  avatar: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#0b2536', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: palette.accent, fontWeight: '800' },
  pacienteInfo: { flex: 1 },
  pacienteNombre: { color: palette.text, fontWeight: '700' },
  pacienteEmail: { color: palette.muted },
  pacienteId: { color: palette.muted, fontSize: 12 },
  chevron: { color: palette.muted, fontSize: 18 },
  actionsBadge: { color: palette.muted },
  errorBox: { backgroundColor: '#2d1b1b', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#7f1d1d' },
  errorIcon: { fontSize: 20 },
  errorTitle: { color: palette.text, fontWeight: '700', marginTop: 4 },
  errorMsg: { color: palette.muted, marginTop: 2 },
});
