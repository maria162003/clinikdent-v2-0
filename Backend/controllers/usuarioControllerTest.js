const db = require('../config/db');

console.log('🧪 Controlador de prueba cargado');

exports.obtenerPacientesOdontologo = async (req, res) => {
  console.log('🧪 Función de prueba ejecutada para ID:', req.params.id);
  try {
    res.json({ 
      msg: 'Función de prueba funcionando correctamente',
      odontologoId: req.params.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en función de prueba:', error);
    res.status(500).json({ msg: 'Error en función de prueba' });
  }
};
