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
                  <li>Ve a la página de inicio de ClinkDent</li>
                  <li>Haz clic en "Iniciar Sesión"</li>
                  <li>Ingresa tu <strong>correo electrónico</strong></li>
                  <li>En el campo contraseña, ingresa el código: <strong>${resetToken}</strong></li>
                  <li>Selecciona tu rol y inicia sesión</li>
                  <li><em>Opcional:</em> Una vez dentro, cambia tu contraseña por una nueva</li>
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
}

console.log('🔍 Creando instancia de EmailService...');
const emailServiceInstance = new EmailService();
console.log('🔍 Instancia creada, métodos disponibles:', Object.getOwnPropertyNames(Object.getPrototypeOf(emailServiceInstance)));
console.log('🔍 sendPasswordResetEmail disponible?', typeof emailServiceInstance.sendPasswordResetEmail);

module.exports = emailServiceInstance;
