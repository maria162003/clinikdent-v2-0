/**
 * Servicio de Email para:
 * - Recordatorios de citas
 * - Envío de alertas de seguridad
 * Reemplazar implementación por un proveedor real (SMTP, SendGrid, etc.).
 */
async function sendEmail({ to, subject, html }) {
  console.log('[EMAIL]', { to, subject, htmlLength: html?.length });
  return { id: 'fake-id', to, subject };
}

async function sendRecordatorioCita({ to, paciente, fecha, hora }) {
  return sendEmail({
    to,
    subject: 'Recordatorio de Cita Odontológica',
    html: `<p>Hola ${paciente}, te recordamos tu cita el <strong>${fecha}</strong> a las <strong>${hora}</strong>.</p>`
  });
}

async function sendAlertaSeguridad({ to, ip }) {
  return sendEmail({
    to,
    subject: 'Alerta de nuevo inicio de sesión',
    html: `<p>Se detectó inicio de sesión desde IP: ${ip}</p>`
  });
}

module.exports = {
  sendEmail,
  sendRecordatorioCita,
  sendAlertaSeguridad
};