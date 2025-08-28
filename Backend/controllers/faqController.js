const db = require('../config/db');

exports.listarFaqs = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM faqs ORDER BY orden ASC');
    
    // Si no hay FAQs, devolver datos de ejemplo
    if (rows.length === 0) {
      console.log('⚠️ No hay FAQs en BD, devolviendo datos de ejemplo');
      return res.json([
        {
          id: 1,
          pregunta: '¿Cuáles son los horarios de atención?',
          respuesta: 'Nuestros horarios son de lunes a viernes de 8:00 AM a 6:00 PM, y sábados de 9:00 AM a 2:00 PM.',
          categoria: 'general',
          orden: 1,
          activo: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          pregunta: '¿Cómo puedo agendar una cita?',
          respuesta: 'Puedes agendar una cita llamando al teléfono, a través de nuestra página web o presencialmente en nuestras instalaciones.',
          categoria: 'citas',
          orden: 2,
          activo: true,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          pregunta: '¿Qué métodos de pago aceptan?',
          respuesta: 'Aceptamos efectivo, tarjetas de crédito y débito, transferencias bancarias y cheques.',
          categoria: 'pagos',
          orden: 3,
          activo: true,
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          pregunta: '¿Qué debo hacer en caso de emergencia dental?',
          respuesta: 'Para emergencias dentales fuera de horario, contamos con línea de emergencias 24/7. Llama inmediatamente.',
          categoria: 'emergencias',
          orden: 4,
          activo: true,
          created_at: new Date().toISOString()
        },
        {
          id: 5,
          pregunta: '¿Realizan tratamientos de ortodoncia?',
          respuesta: 'Sí, contamos con especialistas en ortodoncia que realizan brackets tradicionales, estéticos y ortodoncia invisible.',
          categoria: 'tratamientos',
          orden: 5,
          activo: true,
          created_at: new Date().toISOString()
        }
      ]);
    }
    
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener FAQs:', err);
    
    // En caso de error, devolver datos de ejemplo
    res.json([
      {
        id: 1,
        pregunta: '¿Cuáles son los horarios de atención?',
        respuesta: 'Nuestros horarios son de lunes a viernes de 8:00 AM a 6:00 PM, y sábados de 9:00 AM a 2:00 PM.',
        categoria: 'general',
        orden: 1,
        activo: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        pregunta: '¿Cómo puedo agendar una cita?',
        respuesta: 'Puedes agendar una cita llamando al teléfono, a través de nuestra página web o presencialmente en nuestras instalaciones.',
        categoria: 'citas',
        orden: 2,
        activo: true,
        created_at: new Date().toISOString()
      }
    ]);
  }
};

exports.crearFaq = async (req, res) => {
  const { pregunta, respuesta, orden } = req.body;
  if (!pregunta || !respuesta) return res.status(400).json({ msg: 'Datos incompletos.' });
  try {
    await db.query('INSERT INTO faqs (pregunta, respuesta, orden) VALUES (?, ?, ?)', [pregunta, respuesta, orden]);
    res.json({ msg: 'FAQ creada.' });
  } catch (err) {
    res.status(500).json({ msg: 'Error al crear FAQ.' });
  }
};
