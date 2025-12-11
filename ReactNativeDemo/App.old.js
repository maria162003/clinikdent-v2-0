import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList
} from 'react-native';

const backendUrl = 'http://localhost:3001/api/react-native/trigger';
const citasUrl = 'http://localhost:3001/api/react-native-extras/citas';
const reporteFinancieroUrl = 'http://localhost:3001/api/react-native-reportes/financiero';
const reporteCitasUrl = 'http://localhost:3001/api/react-native-reportes/citas';
const pqrsUrl = 'http://localhost:3001/api/react-native-extras/pqrs';
const listaPacientesUrl = 'http://localhost:3001/api/pacientes';

export default function App() {
  console.log('🧪 Renderizando demo Clinikdent');
  const [pacienteId, setPacienteId] = useState('');
  const [email, setEmail] = useState('');
  const [motivo, setMotivo] = useState('Actualización desde app demo');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [resultadoCitas, setResultadoCitas] = useState(null);
  const [resultadoReportes, setResultadoReportes] = useState(null);
  const [resultadoPqrs, setResultadoPqrs] = useState(null);
  const [error, setError] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [mostrarListaPacientes, setMostrarListaPacientes] = useState(false);
  const [tabActiva, setTabActiva] = useState('resumen'); // resumen, citas, reportes, pqrs

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      const response = await fetch(listaPacientesUrl);
      const data = await response.json();
      if (data.pacientes) {
        setPacientes(data.pacientes.slice(0, 10)); // Primeros 10 pacientes
      }
    } catch (err) {
      console.log('No se pudieron cargar pacientes:', err.message);
    }
  };

  const seleccionarPaciente = (paciente) => {
    setPacienteId(String(paciente.id));
    setEmail(paciente.correo || '');
    setMostrarListaPacientes(false);
  };

  const ejecutarWorkflow = async () => {
    setLoading(true);
    setResultado(null);
    setError(null);

    try {
      const payload = {};
      if (pacienteId.trim()) payload.pacienteId = Number(pacienteId.trim());
      if (email.trim()) payload.email = email.trim();
      if (motivo.trim()) payload.motivo = motivo.trim();

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Error inesperado');
      }

      setResultado(data);
      setTabActiva('resumen');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const consultarCitas = async () => {
    setLoading(true);
    setResultadoCitas(null);
    setError(null);

    try {
      const payload = {};
      if (pacienteId.trim()) payload.pacienteId = Number(pacienteId.trim());
      if (email.trim()) payload.email = email.trim();

      const response = await fetch(citasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Error consultando citas');
      }

      setResultadoCitas(data);
      setTabActiva('citas');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generarReporte = async () => {
    setLoading(true);
    setResultadoReportes(null);
    setError(null);

    try {
      const fechaInicio = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
      const fechaFin = new Date().toISOString().split('T')[0];
      
      const payload = {
        fechaInicio,
        fechaFin,
        email: email.trim() || undefined
      };

      const response = await fetch(reporteFinancieroUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Error generando reporte');
      }

      setResultadoReportes(data);
      setTabActiva('reportes');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const crearPqrs = async () => {
    setLoading(true);
    setResultadoPqrs(null);
    setError(null);

    try {
      const payload = {
        tipo: 'queja',
        asunto: 'Demo desde React Native',
        descripcion: motivo || 'PQRS generada desde app móvil'
      };
      if (pacienteId.trim()) payload.usuario_id = Number(pacienteId.trim());

      const response = await fetch(pqrsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Error creando PQRS');
      }

      setResultadoPqrs(data);
      setTabActiva('pqrs');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>🦷 Demo React Native · Clinikdent</Text>
          <Text style={styles.subtitle}>Webhook: /api/react-native/trigger</Text>
          <View style={styles.debugBadge}>
            <Text style={styles.debugText}>✅ Modo demo activo</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.listarButton} 
          onPress={() => setMostrarListaPacientes(!mostrarListaPacientes)}
        >
          <Text style={styles.listarButtonText}>
            {mostrarListaPacientes ? '❌ Ocultar pacientes' : '📋 Ver pacientes de DB'}
          </Text>
        </TouchableOpacity>

        {mostrarListaPacientes && (
          <View style={styles.listaPacientesContainer}>
            <Text style={styles.listaTitulo}>Selecciona un paciente:</Text>
            <FlatList
              data={pacientes}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pacienteItem}
                  onPress={() => seleccionarPaciente(item)}
                >
                  <Text style={styles.pacienteNombre}>
                    {item.nombre} {item.apellido}
                  </Text>
                  <Text style={styles.pacienteCorreo}>{item.correo}</Text>
                  <Text style={styles.pacienteId}>ID: {item.id}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="ID del paciente (opcional)"
          keyboardType="numeric"
          value={pacienteId}
          onChangeText={setPacienteId}
        />

        <TextInput
          style={styles.input}
          placeholder="Correo del paciente (opcional)"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Motivo del correo"
          multiline
          numberOfLines={3}
          value={motivo}
          onChangeText={setMotivo}
        />

        <View style={styles.botonesGrid}>
          <TouchableOpacity style={[styles.buttonWebhook, styles.buttonResumen]} onPress={ejecutarWorkflow} disabled={loading}>
            <Text style={styles.buttonWebhookText}>📧 Enviar Resumen</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.buttonWebhook, styles.buttonCitas]} onPress={consultarCitas} disabled={loading}>
            <Text style={styles.buttonWebhookText}>📅 Consultar Citas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.buttonWebhook, styles.buttonReportes]} onPress={generarReporte} disabled={loading}>
            <Text style={styles.buttonWebhookText}>📊 Reporte Financiero (Excel)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.buttonWebhook, styles.buttonPqrs]} onPress={crearPqrs} disabled={loading}>
            <Text style={styles.buttonWebhookText}>📝 Crear PQRS</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976d2" />
            <Text style={styles.loadingText}>Procesando...</Text>
          </View>
        )}

        {error && <Text style={styles.error}>⚠️ {error}</Text>}
        
        {tabActiva === 'resumen' && resultado && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>✅ Resumen del Paciente</Text>
            
            <View style={styles.cardPaciente}>
              <Text style={styles.cardTitulo}>👤 Información del Paciente</Text>
              <Text style={styles.cardDetalle}>
                <Text style={styles.cardLabel}>Nombre: </Text>
                {resultado.patient?.nombre} {resultado.patient?.apellido}
              </Text>
              <Text style={styles.cardDetalle}>
                <Text style={styles.cardLabel}>Correo: </Text>
                {resultado.patient?.correo}
              </Text>
              <Text style={styles.cardDetalle}>
                <Text style={styles.cardLabel}>Teléfono: </Text>
                {resultado.patient?.telefono || 'No registrado'}
              </Text>
            </View>

            <View style={styles.cardCitas}>
              <Text style={styles.cardTitulo}>📅 Últimas Citas ({resultado.appointments?.length || 0})</Text>
              {resultado.appointments && resultado.appointments.length > 0 ? (
                resultado.appointments.map((cita, index) => (
                  <View key={index} style={styles.citaItem}>
                    <Text style={styles.citaServicio}>🦷 {cita.motivo}</Text>
                    <Text style={styles.citaFecha}>{cita.fechaLegible}</Text>
                    <Text style={styles.citaHora}>⏰ {cita.horaLegible}</Text>
                    <Text style={styles.citaEstado}>
                      Estado: <Text style={styles.citaEstadoValor}>{cita.estado}</Text>
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.sinCitas}>No hay citas registradas</Text>
              )}
            </View>

            <View style={styles.cardEmail}>
              <Text style={styles.cardTitulo}>📧 Correo Enviado</Text>
              <Text style={styles.cardDetalle}>
                <Text style={styles.cardLabel}>Destinatario: </Text>
                {resultado.email?.destinatario}
              </Text>
              <Text style={styles.cardDetalle}>
                <Text style={styles.cardLabel}>Modo: </Text>
                {resultado.email?.demo ? '🧪 Demo (no enviado)' : '✅ Real (enviado)'}
              </Text>
            </View>
          </View>
        )}

        {tabActiva === 'citas' && resultadoCitas && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>✅ Citas del Paciente</Text>
            <View style={styles.cardCitas}>
              <Text style={styles.cardTitulo}>📅 Citas Encontradas ({resultadoCitas.citas?.length || 0})</Text>
              {resultadoCitas.citas && resultadoCitas.citas.length > 0 ? (
                resultadoCitas.citas.map((cita, index) => (
                  <View key={index} style={styles.citaItem}>
                    <Text style={styles.citaServicio}>🦷 {cita.motivo}</Text>
                    <Text style={styles.citaFecha}>{cita.fechaLegible}</Text>
                    <Text style={styles.citaHora}>⏰ {cita.horaLegible}</Text>
                    <Text style={styles.citaEstado}>
                      Estado: <Text style={styles.citaEstadoValor}>{cita.estado}</Text>
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.sinCitas}>No hay citas registradas</Text>
              )}
            </View>
          </View>
        )}

        {tabActiva === 'reportes' && resultadoReportes && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>✅ Reporte Financiero Generado</Text>
            <View style={styles.cardReportes}>
              <Text style={styles.cardTitulo}>📊 Datos del Reporte</Text>
              <Text style={styles.cardDetalle}>
                <Text style={styles.cardLabel}>Total Registros: </Text>
                {resultadoReportes.data?.registros || 0}
              </Text>
              <Text style={styles.cardDetalle}>
                <Text style={styles.cardLabel}>Período: </Text>
                {resultadoReportes.data?.fechaInicio} al {resultadoReportes.data?.fechaFin}
              </Text>
              {resultadoReportes.data?.emailEnviado && (
                <View style={styles.emailEnviadoBadge}>
                  <Text style={styles.emailEnviadoText}>
                    ✅ Excel enviado a {resultadoReportes.data?.destinatario}
                  </Text>
                </View>
              )}
              {resultadoReportes.data?.preview && resultadoReportes.data.preview.length > 0 && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewTitle}>Vista Previa (5 primeros):</Text>
                  {resultadoReportes.data.preview.map((item, index) => (
                    <View key={index} style={styles.previewItem}>
                      <Text style={styles.previewPaciente}>{item.paciente}</Text>
                      <Text style={styles.previewConcepto}>{item.concepto}</Text>
                      <Text style={styles.previewFecha}>{item.fecha} - {item.estado}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {tabActiva === 'pqrs' && resultadoPqrs && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>✅ PQRS Creada</Text>
            <View style={styles.cardPqrs}>
              <Text style={styles.cardTitulo}>📝 Detalles de PQRS</Text>
              <Text style={styles.cardDetalle}>
                <Text style={styles.cardLabel}>ID: </Text>
                {resultadoPqrs.pqrs?.id}
              </Text>
              <Text style={styles.cardDetalle}>
                <Text style={styles.cardLabel}>Tipo: </Text>
                {resultadoPqrs.pqrs?.tipo}
              </Text>
              <Text style={styles.cardDetalle}>
                <Text style={styles.cardLabel}>Estado: </Text>
                {resultadoPqrs.pqrs?.estado}
              </Text>
              <Text style={styles.cardDetalle}>
                <Text style={styles.cardLabel}>Asunto: </Text>
                {resultadoPqrs.pqrs?.asunto}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212'
  },
  container: {
    padding: 24,
    backgroundColor: '#f5f5f5',
    flexGrow: 1
  },
  headerCard: {
    backgroundColor: '#1a237e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#0d47a1'
  },
  debugBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 12
  },
  debugText: {
    color: '#004d40',
    fontWeight: '600',
    fontSize: 12
  },
  listarButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  listarButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14
  },
  listaPacientesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  listaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0d47a1',
    marginBottom: 12
  },
  pacienteItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2'
  },
  pacienteNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4
  },
  pacienteCorreo: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2
  },
  pacienteId: {
    fontSize: 12,
    color: '#999999'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#e3f2fd',
    marginBottom: 24
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  botonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
  },
  buttonWebhook: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonResumen: {
    backgroundColor: '#1976d2'
  },
  buttonCitas: {
    backgroundColor: '#ff9800'
  },
  buttonReportes: {
    backgroundColor: '#4caf50'
  },
  buttonPqrs: {
    backgroundColor: '#9c27b0'
  },
  buttonWebhookText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  loadingText: {
    marginTop: 12,
    color: '#1976d2',
    fontWeight: '600'
  },
  cardReportes: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50'
  },
  cardPqrs: {
    backgroundColor: '#f3e5f5',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#9c27b0'
  },
  tratamientoItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  tratamientoNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4
  },
  tratamientoEstado: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2
  },
  tratamientoCosto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4caf50'
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16
  },
  error: {
    marginTop: 16,
    color: '#d32f2f',
    fontWeight: '600'
  },
  resultContainer: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbdefb'
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0d47a1'
  },
  cardPaciente: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2'
  },
  cardCitas: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800'
  },
  cardEmail: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50'
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12
  },
  cardDetalle: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 6
  },
  cardLabel: {
    fontWeight: '600',
    color: '#0d47a1'
  },
  citaItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  citaServicio: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4
  },
  citaFecha: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2
  },
  citaHora: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2
  },
  citaEstado: {
    fontSize: 12,
    color: '#888888'
  },
  citaEstadoValor: {
    fontWeight: '600',
    color: '#4caf50'
  },
  sinCitas: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    color: '#0d47a1'
  },
  resultText: {
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#333333',
    marginTop: 4
  },
  emailEnviadoBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50'
  },
  emailEnviadoText: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600'
  },
  previewContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12
  },
  previewItem: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1976d2'
  },
  previewPaciente: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  previewConcepto: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2
  },
  previewFecha: {
    fontSize: 12,
    color: '#999'
  }
});
