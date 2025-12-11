/**
 * ============================================================================
 * SERVICIO DE CORREO ELECTRÓNICO PARA CITAS
 * Sistema de notificaciones automáticas
 * ============================================================================
 */

const nodemailer = require('nodemailer');
const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Configurar transportador de nodemailer
let transporter = null;

function initializeEmailService() {
    // Usar las mismas credenciales de EMAIL_USER y EMAIL_PASS del sistema existente
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verificar configuración
        transporter.verify((error, success) => {
            if (error) {
                console.error('❌ Error configurando servicio de email para notificaciones de citas:', error);
            } else {
                console.log('✅ Servicio de email para notificaciones de citas configurado correctamente');
                console.log(`📧 Usando: ${process.env.EMAIL_USER}`);
            }
        });
    } else {
        console.log('⚠️ Variables EMAIL_USER y EMAIL_PASS no configuradas. Los emails se simularán en consola.');
    }
}

initializeEmailService();

/**
 * Plantilla HTML para confirmación de cita
 */
function getConfirmacionCitaTemplate(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border: 1px solid #e0e0e0;
        }
        .cita-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            min-width: 140px;
            color: #667eea;
        }
        .info-value {
            color: #333;
        }
        .footer {
            background: #f1f1f1;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-radius: 0 0 10px 10px;
        }
        .note {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .icon {
            font-size: 50px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="icon">🦷</div>
        <h1>Clinikdent</h1>
        <p>Confirmación de Cita</p>
    </div>
    
    <div class="content">
        <p><strong>Estimado/a ${data.pacienteNombre},</strong></p>
        
        <p>Su cita ha sido agendada exitosamente. A continuación los detalles:</p>
        
        <div class="cita-info">
            <div class="info-row">
                <span class="info-label">📅 Fecha:</span>
                <span class="info-value">${data.fecha}</span>
            </div>
            <div class="info-row">
                <span class="info-label">🕐 Hora:</span>
                <span class="info-value">${data.hora}</span>
            </div>
            <div class="info-row">
                <span class="info-label">👨‍⚕️ Odontólogo:</span>
                <span class="info-value">Dr/a. ${data.odontologoNombre}</span>
            </div>
            <div class="info-row">
                <span class="info-label">📋 Motivo:</span>
                <span class="info-value">${data.motivo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">🏥 Estado:</span>
                <span class="info-value">${data.estado}</span>
            </div>
        </div>
        
        <div class="note">
            <strong>⏰ Recordatorio:</strong> Recibirá un recordatorio 24 horas antes de su cita.
        </div>
        
        <p><strong>Recomendaciones:</strong></p>
        <ul>
            <li>Por favor llegue 10 minutos antes de su cita</li>
            <li>Si necesita cancelar o reprogramar, contáctenos con anticipación</li>
            <li>Traiga su documento de identidad</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>Este es un correo automático, por favor no responder.</p>
        <p>Clinikdent - Sistema de Gestión Odontológica</p>
        <p>Horario de atención: Lunes a Sábado</p>
    </div>
</body>
</html>
    `;
}

/**
 * Plantilla HTML para recordatorio de cita
 */
function getRecordatorioCitaTemplate(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border: 1px solid #e0e0e0;
        }
        .cita-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            min-width: 140px;
            color: #f5576c;
        }
        .info-value {
            color: #333;
        }
        .footer {
            background: #f1f1f1;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-radius: 0 0 10px 10px;
        }
        .alert {
            background: #ffebee;
            border-left: 4px solid #f44336;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .icon {
            font-size: 50px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="icon">⏰</div>
        <h1>Recordatorio de Cita</h1>
        <p>Su cita es mañana</p>
    </div>
    
    <div class="content">
        <p><strong>Estimado/a ${data.pacienteNombre},</strong></p>
        
        <p>Le recordamos que tiene una cita programada para <strong>mañana</strong>:</p>
        
        <div class="cita-info">
            <div class="info-row">
                <span class="info-label">📅 Fecha:</span>
                <span class="info-value">${data.fecha}</span>
            </div>
            <div class="info-row">
                <span class="info-label">🕐 Hora:</span>
                <span class="info-value">${data.hora}</span>
            </div>
            <div class="info-row">
                <span class="info-label">👨‍⚕️ Odontólogo:</span>
                <span class="info-value">Dr/a. ${data.odontologoNombre}</span>
            </div>
            <div class="info-row">
                <span class="info-label">📋 Motivo:</span>
                <span class="info-value">${data.motivo}</span>
            </div>
        </div>
        
        <div class="alert">
            <strong>⚠️ Importante:</strong> Si no puede asistir, por favor cancele su cita con anticipación para que otro paciente pueda aprovechar ese horario.
        </div>
        
        <p><strong>Recomendaciones:</strong></p>
        <ul>
            <li>✅ Llegue 10 minutos antes de su hora asignada</li>
            <li>✅ Traiga su documento de identidad</li>
            <li>✅ Si está tomando algún medicamento, informe al odontólogo</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>Este es un correo automático, por favor no responder.</p>
        <p>Clinikdent - Sistema de Gestión Odontológica</p>
        <p>Horario de atención: Lunes a Sábado</p>
    </div>
</body>
</html>
    `;
}

/**
 * Plantilla HTML para cancelación de cita
 */
function getCancelacionCitaTemplate(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border: 1px solid #e0e0e0;
        }
        .cita-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            min-width: 140px;
            color: #2575fc;
        }
        .info-value {
            color: #333;
        }
        .footer {
            background: #f1f1f1;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-radius: 0 0 10px 10px;
        }
        .success {
            background: #e8f5e9;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .icon {
            font-size: 50px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="icon">❌</div>
        <h1>Cancelación de Cita</h1>
        <p>Su cita ha sido cancelada</p>
    </div>
    
    <div class="content">
        <p><strong>Estimado/a ${data.pacienteNombre},</strong></p>
        
        <p>Su cita ha sido <strong>cancelada</strong> correctamente:</p>
        
        <div class="cita-info">
            <div class="info-row">
                <span class="info-label">📅 Fecha:</span>
                <span class="info-value">${data.fecha}</span>
            </div>
            <div class="info-row">
                <span class="info-label">🕐 Hora:</span>
                <span class="info-value">${data.hora}</span>
            </div>
            <div class="info-row">
                <span class="info-label">👨‍⚕️ Odontólogo:</span>
                <span class="info-value">Dr/a. ${data.odontologoNombre}</span>
            </div>
            <div class="info-row">
                <span class="info-label">📋 Motivo:</span>
                <span class="info-value">${data.motivo}</span>
            </div>
        </div>
        
        <div class="success">
            <strong>✅ Confirmación:</strong> La cita ha sido cancelada exitosamente. El horario ahora está disponible para otros pacientes.
        </div>
        
        <p>Si desea agendar una nueva cita, puede hacerlo a través de nuestro sistema en línea o contactándonos directamente.</p>
        
        <p>Gracias por informarnos con anticipación.</p>
    </div>
    
    <div class="footer">
        <p>Este es un correo automático, por favor no responder.</p>
        <p>Clinikdent - Sistema de Gestión Odontológica</p>
        <p>Horario de atención: Lunes a Sábado</p>
    </div>
</body>
</html>
    `;
}

/**
 * Enviar correo de confirmación de cita
 */
async function enviarConfirmacionCita(citaData) {
    try {
        // Verificar que el usuario tenga correo registrado
        if (!citaData.correo) {
            console.log('⚠️ No se puede enviar confirmación: usuario sin correo registrado');
            return { success: false, reason: 'sin_correo' };
        }

        const mailOptions = {
            from: `"Clinikdent" <${process.env.EMAIL_USER || 'noreply@clinikdent.com'}>`,
            to: citaData.correo,
            subject: `✅ Confirmación de Cita - ${citaData.fecha}`,
            html: getConfirmacionCitaTemplate(citaData)
        };

        if (transporter) {
            const result = await transporter.sendMail(mailOptions);
            console.log('📧 Confirmación de cita enviada:', {
                to: citaData.correo,
                fecha: citaData.fecha,
                messageId: result.messageId
            });
            return { success: true, messageId: result.messageId };
        } else {
            console.log('📧 SIMULACIÓN - Confirmación de cita:', {
                to: citaData.correo,
                fecha: citaData.fecha,
                hora: citaData.hora,
                odontologo: citaData.odontologoNombre
            });
            return { success: true, simulated: true };
        }
    } catch (error) {
        console.error('❌ Error enviando confirmación de cita:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Enviar recordatorio de cita (24 horas antes)
 */
async function enviarRecordatorioCita(citaData) {
    try {
        if (!citaData.correo) {
            console.log('⚠️ No se puede enviar recordatorio: usuario sin correo registrado');
            return { success: false, reason: 'sin_correo' };
        }

        const mailOptions = {
            from: `"Clinikdent - Recordatorio" <${process.env.EMAIL_USER || 'noreply@clinikdent.com'}>`,
            to: citaData.correo,
            subject: `⏰ Recordatorio: Cita Mañana - ${citaData.fecha}`,
            html: getRecordatorioCitaTemplate(citaData)
        };

        if (transporter) {
            const result = await transporter.sendMail(mailOptions);
            console.log('📧 Recordatorio de cita enviado:', {
                to: citaData.correo,
                fecha: citaData.fecha,
                messageId: result.messageId
            });
            return { success: true, messageId: result.messageId };
        } else {
            console.log('📧 SIMULACIÓN - Recordatorio de cita:', {
                to: citaData.correo,
                fecha: citaData.fecha,
                hora: citaData.hora
            });
            return { success: true, simulated: true };
        }
    } catch (error) {
        console.error('❌ Error enviando recordatorio de cita:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Enviar notificación de cancelación de cita
 */
async function enviarCancelacionCita(citaData) {
    try {
        if (!citaData.correo) {
            console.log('⚠️ No se puede enviar cancelación: usuario sin correo registrado');
            return { success: false, reason: 'sin_correo' };
        }

        const mailOptions = {
            from: `"Clinikdent" <${process.env.EMAIL_USER || 'noreply@clinikdent.com'}>`,
            to: citaData.correo,
            subject: `❌ Cancelación de Cita - ${citaData.fecha}`,
            html: getCancelacionCitaTemplate(citaData)
        };

        if (transporter) {
            const result = await transporter.sendMail(mailOptions);
            console.log('📧 Notificación de cancelación enviada:', {
                to: citaData.correo,
                fecha: citaData.fecha,
                messageId: result.messageId
            });
            return { success: true, messageId: result.messageId };
        } else {
            console.log('📧 SIMULACIÓN - Cancelación de cita:', {
                to: citaData.correo,
                fecha: citaData.fecha,
                hora: citaData.hora
            });
            return { success: true, simulated: true };
        }
    } catch (error) {
        console.error('❌ Error enviando cancelación de cita:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtener citas que necesitan recordatorio (24 horas antes)
 */
async function obtenerCitasParaRecordatorio() {
    try {
        // Calcular fecha de mañana
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        mañana.setHours(0, 0, 0, 0);

        const mañanaFin = new Date(mañana);
        mañanaFin.setHours(23, 59, 59, 999);

        const query = `
            SELECT 
                c.id,
                c.fecha,
                c.hora,
                c.motivo,
                c.estado,
                p.nombre || ' ' || p.apellido as paciente_nombre,
                p.correo as paciente_correo,
                o.nombre || ' ' || o.apellido as odontologo_nombre
            FROM citas c
            JOIN usuarios p ON c.paciente_id = p.id
            JOIN usuarios o ON c.odontologo_id = o.id
            WHERE c.fecha = $1
            AND c.estado = 'programada'
            AND p.correo IS NOT NULL
            AND p.correo != ''
            AND NOT EXISTS (
                SELECT 1 FROM notificaciones_citas nc
                WHERE nc.cita_id = c.id
                AND nc.tipo = 'recordatorio'
            )
        `;

        const result = await pool.query(query, [mañana.toISOString().split('T')[0]]);
        return result.rows;
    } catch (error) {
        console.error('❌ Error obteniendo citas para recordatorio:', error);
        return [];
    }
}

/**
 * Registrar notificación enviada en la base de datos
 */
async function registrarNotificacion(citaId, tipo, resultado) {
    try {
        const query = `
            INSERT INTO notificaciones_citas (cita_id, tipo, enviado, fecha_envio, detalles)
            VALUES ($1, $2, $3, NOW(), $4)
        `;
        
        await pool.query(query, [
            citaId,
            tipo,
            resultado.success,
            JSON.stringify(resultado)
        ]);
    } catch (error) {
        console.error('❌ Error registrando notificación:', error);
    }
}

/**
 * Proceso automático de recordatorios (ejecutar cada hora)
 */
async function procesarRecordatorios() {
    console.log('🔄 Procesando recordatorios automáticos...');
    
    try {
        const citas = await obtenerCitasParaRecordatorio();
        
        if (citas.length === 0) {
            console.log('✅ No hay citas pendientes de recordatorio');
            return;
        }

        console.log(`📋 Se encontraron ${citas.length} citas para enviar recordatorio`);

        for (const cita of citas) {
            const citaData = {
                correo: cita.paciente_correo,
                pacienteNombre: cita.paciente_nombre,
                fecha: new Date(cita.fecha).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                hora: cita.hora,
                odontologoNombre: cita.odontologo_nombre,
                motivo: cita.motivo
            };

            const resultado = await enviarRecordatorioCita(citaData);
            await registrarNotificacion(cita.id, 'recordatorio', resultado);

            // Esperar 1 segundo entre envíos para no saturar el servidor SMTP
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`✅ Proceso de recordatorios completado: ${citas.length} enviados`);
    } catch (error) {
        console.error('❌ Error en proceso de recordatorios:', error);
    }
}

module.exports = {
    enviarConfirmacionCita,
    enviarRecordatorioCita,
    enviarCancelacionCita,
    procesarRecordatorios,
    obtenerCitasParaRecordatorio
};
