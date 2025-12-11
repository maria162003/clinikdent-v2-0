// Backend/services/emailService.js
const nodemailer = require('nodemailer');

console.log('🔍 Iniciando carga de EmailService...');

class EmailService {
  constructor() {
    console.log('🔍 Constructor de EmailService ejecutándose...');
    // Verificar si hay credenciales de email configuradas
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'clinikdent.test@gmail.com' || 
        !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'tu_app_password_aqui') {
      console.log('📧 EmailService: Modo DEMO activado (credenciales no configuradas)');
      console.log('⚠️ Para envío real, configura EMAIL_USER y EMAIL_PASS en .env');
      this.demoMode = true;
      this.transporter = null;
    } else {
      console.log('📧 EmailService: Configurando para envío real...');
      // Configuración para Gmail (producción)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      this.demoMode = false;
      console.log(`📧 Configurado para envío desde: ${process.env.EMAIL_USER}`);
      
      // Verificar la conexión
      this.verifyConnection();
    }
    console.log('🔍 Constructor de EmailService completado');
  }

  async verifyConnection() {
    if (this.demoMode) return true;
    
    try {
      await this.transporter.verify();
      console.log('✅ Conexión SMTP verificada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error verificando conexión SMTP:', error.message);
      console.log('🔄 Cambiando a modo DEMO debido a error de conexión');
      this.demoMode = true;
      this.transporter = null;
      return false;
    }
  }

  async sendPasswordResetEmail(email, resetToken, userName) {
    console.log('🔍 sendPasswordResetEmail llamado con:', { email, resetToken: resetToken?.substring(0, 10), userName });
    
    // En modo demo, solo simular el envío
    if (this.demoMode) {
      console.log('📧 DEMO EMAIL - Recuperación de contraseña:');
      console.log(`📧 Para: ${email}`);
      console.log(`📧 Usuario: ${userName}`);
      console.log(`📧 Token: ${resetToken}`);
      console.log('📧 En modo demo - Email simulado exitosamente');
      
      return {
        success: true,
        message: 'Email simulado enviado exitosamente (modo demo)',
        token: resetToken // Para testing
      };
    }

    const mailOptions = {
      from: {
        name: 'Clinik Dent',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Código de Acceso Temporal - Clinik Dent',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0077b6, #00a3e1); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .token-box { background: #e3f2fd; border: 2px solid #2196f3; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .token { font-size: 32px; font-weight: bold; color: #1976d2; letter-spacing: 8px; font-family: monospace; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .steps { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🦷 Clinik Dent</h1>
              <h2>Código de Acceso Temporal</h2>
            </div>
            <div class="content">
              <p>Hola <strong>${userName}</strong>,</p>
              
              <p>Tu código de acceso temporal es:</p>
              
              <div class="token-box">
                <div class="token">${resetToken}</div>
              </div>
              
              <div class="steps">
                <strong>📝 Pasos a seguir:</strong>
                <ol>
                  <li>Ve a la página de inicio de ClinikDent</li>
                  <li>Haz clic en "Iniciar Sesión"</li>
                  <li>Ingresa tu <strong>correo electrónico</strong></li>
                  <li>En el campo contraseña, ingresa el código: <strong>${resetToken}</strong></li>
                  <li>Selecciona tu rol y inicia sesión</li>
                  <li><strong>Recomendado:</strong> Una vez dentro, cambia tu contraseña por una nueva desde tu perfil</li>
                </ol>
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este código es válido por <strong>1 hora</strong></li>
                  <li>Solo puede usarse una vez</li>
                  <li>Si no solicitaste este cambio, ignora este email</li>
                  <li><strong>No compartas este código con nadie</strong></li>
                </ul>
              </div>
              
              <p>Si no solicitaste este cambio de contraseña, puedes ignorar este correo electrónico.</p>
              
              <div class="footer">
                <p>Este es un correo automático, no respondas a este mensaje.</p>
                <p>© 2025 Clinik Dent - Sistema de Gestión Dental</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado exitosamente a ${email}: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        message: 'Email enviado exitosamente'
      };
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return {
        success: false,
        error: error.message,
        message: 'Error enviando el email'
      };
    }
  }

  /**
   * Enviar confirmación automática de PQRS al usuario
   */
  async sendPQRSConfirmation(userData, numeroRadicado) {
    console.log('📧 Enviando confirmación de PQRS:', { email: userData.correo, radicado: numeroRadicado });
    
    if (this.demoMode) {
      console.log('📧 DEMO EMAIL - Confirmación PQRS:');
      console.log(`📧 Para: ${userData.correo}`);
      console.log(`📧 Radicado: ${numeroRadicado}`);
      console.log(`📧 Tipo: ${userData.tipo}`);
      console.log('📧 En modo demo - Email simulado exitosamente');
      return { success: true, message: 'Email de confirmación simulado (demo)' };
    }

    const mailOptions = {
      from: {
        name: 'ClinikDent - Atención al Cliente',
        address: process.env.EMAIL_USER
      },
      to: userData.correo,
      subject: `✅ Hemos recibido su ${userData.tipo} - Radicado: ${numeroRadicado}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .radicado-box { background: #e3f2fd; border: 2px solid #2196f3; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0; }
            .radicado { font-size: 24px; font-weight: bold; color: #1976d2; letter-spacing: 2px; }
            .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f1f1f1; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .status-badge { background: #4caf50; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            ul { margin: 10px 0; padding-left: 20px; }
            .highlight { color: #1976d2; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🦷 ClinikDent</h1>
              <h2>Confirmación de ${userData.tipo}</h2>
              <span class="status-badge">RECIBIDO</span>
            </div>
            <div class="content">
              <p>Estimado/a <strong>${userData.nombre_completo}</strong>,</p>
              
              <p>Hemos recibido exitosamente su <strong>${userData.tipo.toLowerCase()}</strong> y le confirmamos que está siendo procesada por nuestro equipo de atención al cliente.</p>
              
              <div class="radicado-box">
                <p style="margin: 0 0 10px 0; color: #666;">Su número de radicado es:</p>
                <div class="radicado">${numeroRadicado}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Guarde este número para futuras consultas</p>
              </div>
              
              <div class="info-box">
                <h4 style="margin-top: 0; color: #1976d2;">📋 Resumen de su solicitud:</h4>
                <ul>
                  <li><strong>Tipo:</strong> ${userData.tipo}</li>
                  <li><strong>Asunto:</strong> ${userData.asunto}</li>
                  <li><strong>Fecha de recepción:</strong> ${new Date().toLocaleDateString('es-CO', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</li>
                  ${userData.servicio_relacionado ? `<li><strong>Servicio relacionado:</strong> ${userData.servicio_relacionado}</li>` : ''}
                </ul>
              </div>
              
              <h4 style="color: #1976d2;">⏰ Tiempo de respuesta:</h4>
              <p>Nuestro equipo especializado revisará su solicitud y le responderemos por este mismo medio en un plazo máximo de <span class="highlight">7 días hábiles</span>.</p>
              
              <div class="warning">
                <strong>📌 Información importante:</strong>
                <ul style="margin: 10px 0;">
                  <li>Este es un correo automático, <strong>no responda a este mensaje</strong></li>
                  <li>La respuesta le llegará desde nuestro equipo de soporte</li>
                  <li>Si necesita información adicional, puede contactarnos a través de nuestros canales oficiales</li>
                  <li>Conserve su número de radicado para cualquier consulta</li>
                </ul>
              </div>
              
              <h4 style="color: #1976d2;">📞 Otros canales de contacto:</h4>
              <ul>
                <li><strong>Teléfono:</strong> (601) 234-5678</li>
                <li><strong>WhatsApp:</strong> +57 300 123 4567</li>
                <li><strong>Dirección:</strong> Calle 123 #45-67, Bogotá</li>
                <li><strong>Horarios:</strong> Lunes a Viernes 8:00 AM - 6:00 PM</li>
              </ul>
              
              <p style="margin-top: 30px;">Gracias por confiar en <strong>ClinikDent</strong>. Su satisfacción es nuestra prioridad.</p>
            </div>
            <div class="footer">
              <p><strong>ClinikDent - Centro Odontológico</strong></p>
              <p>Este mensaje fue generado automáticamente el ${new Date().toLocaleString('es-CO')}</p>
              <p>© 2025 ClinikDent. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Confirmación PQRS enviada a ${userData.correo}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando confirmación PQRS:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notificar al equipo de soporte sobre nuevo PQRS
   */
  async notifySupport(userData, numeroRadicado) {
    console.log('📧 Notificando al soporte:', { radicado: numeroRadicado, tipo: userData.tipo });
    
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
    
    if (this.demoMode) {
      console.log('📧 DEMO EMAIL - Notificación a Soporte:');
      console.log(`📧 Para: ${supportEmail}`);
      console.log(`📧 Nuevo ${userData.tipo} recibido`);
      return { success: true, message: 'Notificación a soporte simulada (demo)' };
    }

    const mailOptions = {
      from: {
        name: 'Sistema ClinikDent',
        address: process.env.EMAIL_USER
      },
      to: supportEmail,
      subject: `🔔 Nuevo ${userData.tipo} - ${numeroRadicado} - ${userData.asunto}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff5722; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 25px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; }
            .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .data-table th { background-color: #e3f2fd; color: #1976d2; font-weight: bold; }
            .urgent { background: #ffebee; border: 1px solid #f44336; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .mensaje-box { background: white; padding: 20px; border-radius: 5px; border: 1px solid #ddd; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 NUEVA SOLICITUD RECIBIDA</h1>
              <h2>${userData.tipo.toUpperCase()}</h2>
            </div>
            <div class="content">
              <div class="urgent">
                <strong>⚠️ ACCIÓN REQUERIDA:</strong> Nueva solicitud requiere atención del equipo de soporte.
                <br><strong>Plazo de respuesta:</strong> 7 días hábiles máximo.
              </div>
              
              <table class="data-table">
                <tr>
                  <th>🔍 Radicado</th>
                  <td><strong>${numeroRadicado}</strong></td>
                </tr>
                <tr>
                  <th>👤 Cliente</th>
                  <td>${userData.nombre_completo}</td>
                </tr>
                <tr>
                  <th>📧 Email</th>
                  <td>${userData.correo}</td>
                </tr>
                <tr>
                  <th>📞 Teléfono</th>
                  <td>${userData.telefono || 'No proporcionado'}</td>
                </tr>
                <tr>
                  <th>🆔 Documento</th>
                  <td>${userData.numero_documento || 'No proporcionado'}</td>
                </tr>
                <tr>
                  <th>📂 Tipo</th>
                  <td><strong>${userData.tipo}</strong></td>
                </tr>
                <tr>
                  <th>📝 Asunto</th>
                  <td>${userData.asunto}</td>
                </tr>
                <tr>
                  <th>🏥 Servicio</th>
                  <td>${userData.servicio_relacionado || 'No especificado'}</td>
                </tr>
                <tr>
                  <th>📅 Fecha</th>
                  <td>${new Date().toLocaleString('es-CO')}</td>
                </tr>
              </table>
              
              <div class="mensaje-box">
                <h4>💬 Resumen de la solicitud:</h4>
                <p><em>${userData.resumen}</em></p>
                
                <h4>📄 Descripción detallada:</h4>
                <p>${userData.descripcion}</p>
              </div>
              
              <p><strong>📋 Próximos pasos:</strong></p>
              <ol>
                <li>Revisar la solicitud completa</li>
                <li>Investigar el caso si es necesario</li>
                <li>Preparar respuesta apropiada</li>
                <li>Responder al cliente por email en máximo 7 días hábiles</li>
                <li>Marcar como resuelto en el sistema</li>
              </ol>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Notificación enviada al soporte: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error notificando al soporte:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar confirmación de formulario de contacto
   */
  async sendContactConfirmation(contactData) {
    console.log('📧 Enviando confirmación de contacto:', { email: contactData.email });
    
    if (this.demoMode) {
      console.log('📧 DEMO EMAIL - Confirmación de Contacto enviada');
      return { success: true, message: 'Confirmación de contacto simulada (demo)' };
    }

    const mailOptions = {
      from: {
        name: 'ClinikDent - Atención al Cliente',
        address: process.env.EMAIL_USER
      },
      to: contactData.email,
      subject: '✅ Hemos recibido su mensaje - ClinikDent',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4caf50, #388e3c); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50; }
            .footer { background: #f1f1f1; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🦷 ClinikDent</h1>
              <h2>Mensaje Recibido</h2>
            </div>
            <div class="content">
              <p>Hola <strong>${contactData.nombre}</strong>,</p>
              
              <p>Hemos recibido su mensaje y queremos agradecerle por contactarnos.</p>
              
              <div class="info-box">
                <h4 style="margin-top: 0; color: #388e3c;">📋 Su mensaje:</h4>
                <p><strong>Asunto:</strong> ${contactData.asunto || 'Consulta general'}</p>
                <p><strong>Mensaje:</strong> ${contactData.mensaje}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
              </div>
              
              <p>Nuestro equipo revisará su consulta y le responderemos en un plazo máximo de <strong>7 días hábiles</strong>.</p>
              
              <p><strong>Este es un correo automático, no responda a este mensaje.</strong></p>
              
              <p>Gracias por confiar en ClinikDent.</p>
            </div>
            <div class="footer">
              <p><strong>ClinikDent - Centro Odontológico</strong></p>
              <p>© 2025 ClinikDent. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Confirmación de contacto enviada a ${contactData.email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando confirmación de contacto:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email, userName, userRole = 'paciente') {
    console.log('🔍 sendWelcomeEmail llamado con:', { email, userName, userRole });
    
    // En modo demo, solo simular el envío
    if (this.demoMode) {
      console.log('📧 DEMO EMAIL - Correo de bienvenida:');
      console.log(`📧 Para: ${email}`);
      console.log(`📧 Usuario: ${userName}`);
      console.log(`📧 Rol: ${userRole}`);
      console.log('📧 En modo demo - Email de bienvenida simulado exitosamente');
      
      return {
        success: true,
        message: 'Email de bienvenida simulado enviado exitosamente (modo demo)'
      };
    }

    const roleNames = {
      'paciente': 'Paciente',
      'odontologo': 'Odontólogo',
      'administrador': 'Administrador'
    };

    const roleWelcome = {
      'paciente': {
        title: '¡Bienvenido a tu nueva sonrisa!',
        message: 'Te damos la bienvenida a Clinik Dent. Ahora puedes agendar citas, consultar tu historial y mucho más.'
      },
      'odontologo': {
        title: '¡Bienvenido al equipo!',
        message: 'Te damos la bienvenida a Clinik Dent. Como odontólogo, tendrás acceso a herramientas especializadas para el cuidado de tus pacientes.'
      },
      'administrador': {
        title: '¡Bienvenido, Administrador!',
        message: 'Te damos la bienvenida a Clinik Dent. Como administrador, tendrás acceso completo al sistema de gestión.'
      }
    };

    const welcomeInfo = roleWelcome[userRole] || roleWelcome['paciente'];

    const mailOptions = {
      from: {
        name: 'Clinik Dent',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `¡Bienvenido a Clinik Dent, ${userName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0077b6, #00a3e1); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .welcome-box { background: #e8f5e8; border: 2px solid #4caf50; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .features { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { background: #0077b6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🦷 Clinik Dent</h1>
              <h2>${welcomeInfo.title}</h2>
            </div>
            <div class="content">
              <div class="welcome-box">
                <h3>¡Hola ${userName}!</h3>
                <p>${welcomeInfo.message}</p>
                <p>Tu cuenta como <strong>${roleNames[userRole]}</strong> ha sido creada exitosamente.</p>
              </div>
              
              <div class="features">
                <h4>🎯 ¿Qué puedes hacer ahora?</h4>
                <ul>
                  ${userRole === 'paciente' ? `
                    <li>📅 Agendar citas online</li>
                    <li>📋 Consultar tu historial médico</li>
                    <li>💬 Contactar con nuestro equipo</li>
                    <li>🔔 Recibir recordatorios de citas</li>
                  ` : userRole === 'odontologo' ? `
                    <li>👥 Gestionar tus pacientes</li>
                    <li>📅 Ver tu agenda de citas</li>
                    <li>📝 Crear historiales médicos</li>
                    <li>📊 Acceder a estadísticas</li>
                  ` : `
                    <li>🏥 Gestión completa del sistema</li>
                    <li>👥 Administrar usuarios</li>
                    <li>📊 Ver reportes y estadísticas</li>
                    <li>⚙️ Configurar el sistema</li>
                  `}
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="http://localhost:3001" class="button">🚀 Acceder a mi cuenta</a>
              </div>

              <p><strong>📧 Tu correo de acceso:</strong> ${email}</p>
              <p>Ya puedes iniciar sesión con las credenciales que utilizaste durante el registro.</p>
              
              <hr style="margin: 30px 0; border: 1px solid #ddd;">
              
              <p>💡 <strong>¿Necesitas ayuda?</strong></p>
              <p>Si tienes alguna pregunta, no dudes en contactarnos:</p>
              <ul>
                <li>📞 Teléfono: (601) 123-4567</li>
                <li>📧 Email: info@clinikdent.com</li>
                <li>💬 Chat en línea disponible en nuestro sitio web</li>
              </ul>
              
              <div class="footer">
                <p>© 2025 Clinik Dent - Tu sonrisa, nuestra pasión</p>
                <p>Este correo fue enviado automáticamente, por favor no responder.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Correo de bienvenida enviado a ${email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando correo de bienvenida:', error);
      return { success: false, error: error.message };
    }
  }

  // Notificación de cita cancelada
  async sendCitaCanceladaEmail(to, datosCita) {
    const { paciente_nombre, fecha, hora, motivo, motivo_cancelacion } = datosCita;
    
    const subject = '❌ Cita Cancelada - ClinikDent';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cita-info { background: white; padding: 20px; border-left: 4px solid #e74c3c; margin: 20px 0; border-radius: 5px; }
          .info-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          .icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">❌</div>
            <h1>Cita Cancelada</h1>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${paciente_nombre}</strong>,</p>
            <p>Le informamos que su cita ha sido <strong>cancelada</strong>.</p>
            
            <div class="cita-info">
              <h3 style="color: #e74c3c; margin-top: 0;">📅 Información de la Cita Cancelada</h3>
              <div class="info-row">
                <span class="label">Fecha:</span>
                <span class="value">${new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="info-row">
                <span class="label">Hora:</span>
                <span class="value">${hora}</span>
              </div>
              ${motivo ? `<div class="info-row">
                <span class="label">Motivo original:</span>
                <span class="value">${motivo}</span>
              </div>` : ''}
              ${motivo_cancelacion ? `<div class="info-row">
                <span class="label">Razón de cancelación:</span>
                <span class="value">${motivo_cancelacion}</span>
              </div>` : ''}
            </div>

            <p>Si desea reagendar su cita, puede hacerlo a través de nuestra plataforma o contactándonos directamente.</p>
            
            <p style="margin-top: 30px;">Atentamente,<br><strong>Equipo ClinikDent</strong></p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>© ${new Date().getFullYear()} ClinikDent - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(to, subject, htmlContent);
  }

  // Notificación de cita reprogramada
  async sendCitaReprogramadaEmail(to, datosCita) {
    const { paciente_nombre, fecha_anterior, hora_anterior, fecha_nueva, hora_nueva, motivo } = datosCita;
    
    const subject = '🔄 Cita Reprogramada - ClinikDent';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cita-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .cita-anterior { border-left: 4px solid #e74c3c; }
          .cita-nueva { border-left: 4px solid #27ae60; }
          .info-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .arrow { text-align: center; font-size: 24px; color: #667eea; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          .icon { font-size: 48px; margin-bottom: 10px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🔄</div>
            <h1>Cita Reprogramada</h1>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${paciente_nombre}</strong>,</p>
            <p>Le informamos que su cita ha sido <strong>reprogramada</strong>.</p>
            
            <div class="cita-box cita-anterior">
              <h3 style="color: #e74c3c; margin-top: 0;">❌ Cita Anterior</h3>
              <div class="info-row">
                <span class="label">Fecha:</span>
                <span class="value">${new Date(fecha_anterior).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="info-row">
                <span class="label">Hora:</span>
                <span class="value">${hora_anterior}</span>
              </div>
            </div>

            <div class="arrow">⬇️</div>

            <div class="cita-box cita-nueva">
              <h3 style="color: #27ae60; margin-top: 0;">✅ Nueva Cita</h3>
              <div class="info-row">
                <span class="label">Fecha:</span>
                <span class="value">${new Date(fecha_nueva).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="info-row">
                <span class="label">Hora:</span>
                <span class="value">${hora_nueva}</span>
              </div>
              ${motivo ? `<div class="info-row">
                <span class="label">Motivo:</span>
                <span class="value">${motivo}</span>
              </div>` : ''}
            </div>

            <div class="highlight">
              <strong>⚠️ Importante:</strong> Por favor, asegúrese de asistir a su cita en la nueva fecha y hora programada.
            </div>

            <p>Si tiene alguna duda o necesita hacer cambios, puede contactarnos o gestionar su cita a través de nuestra plataforma.</p>
            
            <p style="margin-top: 30px;">Atentamente,<br><strong>Equipo ClinikDent</strong></p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>© ${new Date().getFullYear()} ClinikDent - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(to, subject, htmlContent);
  }

  // Método genérico para enviar emails (para códigos de seguridad)
  async sendEmail(to, subject, htmlContent, attachments = []) {
    if (this.demoMode) {
      console.log('📧 MODO DEMO - Email que se enviaría:');
      console.log(`Para: ${to}`);
      console.log(`Asunto: ${subject}`);
      console.log(`Contenido: ${htmlContent}`);
      console.log(`Adjuntos: ${attachments.length}`);
      return { success: true, demo: true };
    }

    const mailOptions = {
      from: `"ClinikDent" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado a ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendCitaCanceladaEmail(email, citaData) {
    console.log('📧 Enviando email de cita cancelada a:', email);
    
    if (this.demoMode) {
      console.log('📧 DEMO EMAIL - Cita cancelada:', citaData);
      return { success: true, demo: true };
    }

    const { fecha, hora, motivo, paciente } = citaData;
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #fff; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🦷 Clinik Dent</h1>
            <h2>❌ Cita Cancelada</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${paciente}</strong>,</p>
            <p>Tu cita ha sido <strong>cancelada</strong>.</p>
            
            <div class="info-box">
              <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
              <p><strong>🕐 Hora:</strong> ${hora}</p>
              <p><strong>📋 Motivo:</strong> ${motivo || 'Consulta general'}</p>
            </div>
            
            <p>Si deseas agendar una nueva cita, puedes hacerlo desde tu panel de paciente.</p>
            <p>¡Esperamos verte pronto!</p>
            
            <div class="footer">
              <p>Este es un correo automático, por favor no responder.</p>
              <p>© 2025 Clinik Dent - Todos los derechos reservados</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, 'Cita Cancelada - Clinik Dent', htmlContent);
  }

  async sendCitaReprogramadaEmail(email, citaData) {
    console.log('📧 Enviando email de cita reprogramada a:', email);
    
    if (this.demoMode) {
      console.log('📧 DEMO EMAIL - Cita reprogramada:', citaData);
      return { success: true, demo: true };
    }

    const { fechaAnterior, horaAnterior, fechaNueva, horaNueva, motivo, paciente } = citaData;
    const fechaAntFormateada = new Date(fechaAnterior).toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const fechaNuevaFormateada = new Date(fechaNueva).toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0077b6, #00a3e1); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #fff; border-left: 4px solid #0077b6; padding: 15px; margin: 20px 0; }
          .old-info { text-decoration: line-through; color: #999; }
          .new-info { color: #0077b6; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🦷 Clinik Dent</h1>
            <h2>🔄 Cita Reprogramada</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${paciente}</strong>,</p>
            <p>Tu cita ha sido <strong>reprogramada</strong>.</p>
            
            <div class="info-box">
              <h3>Fecha anterior:</h3>
              <p class="old-info">📅 ${fechaAntFormateada} a las ${horaAnterior}</p>
              
              <h3>Nueva fecha:</h3>
              <p class="new-info">📅 ${fechaNuevaFormateada} a las ${horaNueva}</p>
              
              <p><strong>📋 Motivo:</strong> ${motivo || 'Consulta general'}</p>
            </div>
            
            <p>Recuerda llegar 10 minutos antes de tu cita.</p>
            <p>¡Te esperamos!</p>
            
            <div class="footer">
              <p>Este es un correo automático, por favor no responder.</p>
              <p>© 2025 Clinik Dent - Todos los derechos reservados</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, 'Cita Reprogramada - Clinik Dent', htmlContent);
  }

  async sendCitaAgendadaEmail(email, citaData) {
    console.log('📧 Enviando email de confirmación de cita a:', email);
    
    if (this.demoMode) {
      console.log('📧 DEMO EMAIL - Cita agendada:', citaData);
      return { success: true, demo: true };
    }

    const { fecha, hora, motivo, paciente, odontologo, estado } = citaData;
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const estadoTexto = estado === 'confirmada' ? 
      '<span style="color: #28a745; font-weight: bold;">✅ Confirmada</span>' : 
      '<span style="color: #ffc107; font-weight: bold;">⏳ Pendiente de confirmación</span>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #fff; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .reminder { background: #e7f3ff; border: 1px solid #b3d9ff; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🦷 Clinik Dent</h1>
            <h2>✅ Cita Agendada</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${paciente}</strong>,</p>
            <p>Tu cita ha sido <strong>agendada exitosamente</strong>.</p>
            
            <div class="info-box">
              <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
              <p><strong>🕐 Hora:</strong> ${hora}</p>
              <p><strong>👨‍⚕️ Odontólogo:</strong> ${odontologo || 'Por asignar'}</p>
              <p><strong>📋 Motivo:</strong> ${motivo || 'Consulta general'}</p>
              <p><strong>📊 Estado:</strong> ${estadoTexto}</p>
            </div>
            
            <div class="reminder">
              <p><strong>📌 Recordatorio:</strong></p>
              <ul>
                <li>Llegar 10 minutos antes de la cita</li>
                <li>Traer documento de identidad</li>
                <li>Si necesitas cancelar, hazlo con al menos 2 horas de anticipación</li>
              </ul>
            </div>
            
            <p>¡Gracias por confiar en nosotros!</p>
            
            <div class="footer">
              <p>Este es un correo automático, por favor no responder.</p>
              <p>© 2025 Clinik Dent - Todos los derechos reservados</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, 'Cita Agendada - Clinik Dent', htmlContent);
  }
}

console.log('🔍 Creando instancia de EmailService...');
const emailServiceInstance = new EmailService();
console.log('🔍 Instancia creada, métodos disponibles:', Object.getOwnPropertyNames(Object.getPrototypeOf(emailServiceInstance)));
console.log('🔍 sendPasswordResetEmail disponible?', typeof emailServiceInstance.sendPasswordResetEmail);
console.log('🔍 sendWelcomeEmail disponible?', typeof emailServiceInstance.sendWelcomeEmail);

module.exports = emailServiceInstance;
