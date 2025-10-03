const { sendRecordatorioCita } = require('../services/emailService');
const citasStore = [];
const pacientesStore = [];

function crearCita(req, res) {
  const { pacienteId, fecha, hora, motivo } = req.body;
  const id = (citasStore.length + 1).toString();
  const cita = { id, pacienteId, fecha, hora, motivo, recordatorioEnviado: false, createdAt: new Date() };
  citasStore.push(cita);
  res.status(201).json({ cita });
}

function listarCitas(req, res) {
  res.json({ citas: citasStore });
}

async function enviarRecordatorio(req, res) {
  try {
    const { id } = req.params;
    const cita = citasStore.find(c => c.id === id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    const paciente = pacientesStore.find(p => p.id === cita.pacienteId) || { email: 'paciente@example.com', nombre: 'Paciente' };

    await sendRecordatorioCita({
      to: paciente.email,
      paciente: paciente.nombre,
      fecha: cita.fecha,
      hora: cita.hora
    });
    cita.recordatorioEnviado = true;
    res.json({ ok: true, cita });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  crearCita,
  listarCitas,
  enviarRecordatorio
};