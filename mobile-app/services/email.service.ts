/**
 * ============================================================================
 * SERVICIO DE EMAIL
 * Envío de correos electrónicos para recordatorios y confirmaciones
 * ============================================================================
 */

// Tipos para los datos de citas
export interface CitaEmailData {
  correo: string;
  pacienteNombre: string;
  fecha: string;
  hora: string;
  odontologoNombre: string;
  motivo?: string;
  estado?: string;
}

// URL del API backend
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Enviar recordatorio de cita por email
 * Usa el servicio backend para enviar el email
 */
export async function enviarRecordatorioCita(citaData: CitaEmailData): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log('📧 Enviando recordatorio de cita...');
    console.log('   Destinatario:', citaData.correo);
    console.log('   Fecha:', citaData.fecha);
    console.log('   Hora:', citaData.hora);

    // En una app móvil, el envío de emails debe hacerse a través del backend
    // Esto evita exponer credenciales SMTP en el cliente
    const response = await fetch(`${API_URL}/api/notificaciones/recordatorio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: 'recordatorio',
        destinatario: citaData.correo,
        datos: {
          pacienteNombre: citaData.pacienteNombre,
          fecha: citaData.fecha,
          hora: citaData.hora,
          odontologoNombre: citaData.odontologoNombre,
          motivo: citaData.motivo || 'Consulta general',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al enviar recordatorio');
    }

    const result = await response.json();
    console.log('✅ Recordatorio enviado exitosamente');
    return { success: true, message: result.message };
  } catch (error) {
    console.error('❌ Error al enviar recordatorio:', error);
    
    // Si el backend no está disponible, simular éxito para demo
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('⚠️ Backend no disponible. Simulando envío de recordatorio...');
      return { 
        success: true, 
        message: 'Recordatorio simulado (backend no disponible)' 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Enviar confirmación de cita por email
 */
export async function enviarConfirmacionCita(citaData: CitaEmailData): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log('📧 Enviando confirmación de cita...');
    console.log('   Destinatario:', citaData.correo);
    console.log('   Fecha:', citaData.fecha);

    const response = await fetch(`${API_URL}/api/notificaciones/confirmacion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: 'confirmacion',
        destinatario: citaData.correo,
        datos: {
          pacienteNombre: citaData.pacienteNombre,
          fecha: citaData.fecha,
          hora: citaData.hora,
          odontologoNombre: citaData.odontologoNombre,
          motivo: citaData.motivo || 'Consulta general',
          estado: citaData.estado || 'Confirmada',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al enviar confirmación');
    }

    const result = await response.json();
    console.log('✅ Confirmación enviada exitosamente');
    return { success: true, message: result.message };
  } catch (error) {
    console.error('❌ Error al enviar confirmación:', error);
    
    // Si el backend no está disponible, simular éxito para demo
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('⚠️ Backend no disponible. Simulando envío de confirmación...');
      return { 
        success: true, 
        message: 'Confirmación simulada (backend no disponible)' 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Enviar notificación de cancelación de cita
 */
export async function enviarCancelacionCita(citaData: CitaEmailData & { motivoCancelacion?: string }): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log('📧 Enviando notificación de cancelación...');
    console.log('   Destinatario:', citaData.correo);

    const response = await fetch(`${API_URL}/api/notificaciones/cancelacion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: 'cancelacion',
        destinatario: citaData.correo,
        datos: {
          pacienteNombre: citaData.pacienteNombre,
          fecha: citaData.fecha,
          hora: citaData.hora,
          odontologoNombre: citaData.odontologoNombre,
          motivo: citaData.motivo || 'Consulta',
          motivoCancelacion: citaData.motivoCancelacion || 'No especificado',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al enviar cancelación');
    }

    const result = await response.json();
    console.log('✅ Notificación de cancelación enviada exitosamente');
    return { success: true, message: result.message };
  } catch (error) {
    console.error('❌ Error al enviar cancelación:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('⚠️ Backend no disponible. Simulando envío de cancelación...');
      return { 
        success: true, 
        message: 'Cancelación simulada (backend no disponible)' 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Verificar estado del servicio de email
 */
export async function verificarServicioEmail(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/notificaciones/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.warn('⚠️ No se pudo verificar el servicio de email');
    return false;
  }
}
