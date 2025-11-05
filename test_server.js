const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Importar la configuración de la base de datos
const db = require('./Backend/config/db');

// Endpoint de prueba para odontólogos
app.get('/api/usuarios/odontologos', async (req, res) => {
  try {
    console.log('🦷 Obteniendo odontólogos activos...');
    
    const { rows } = await db.query(`
      SELECT u.id, u.nombre, u.apellido, u.correo, u.telefono, u.activo,
             r.nombre as rol
      FROM usuarios u 
      LEFT JOIN roles r ON u.rol_id = r.id 
      WHERE r.nombre = 'odontologo' AND u.activo = true
      ORDER BY u.nombre ASC
    `);
    
    console.log(`✅ Odontólogos encontrados: ${rows.length}`);
    res.json(rows);
    
  } catch (err) {
    console.error('❌ Error al obtener odontólogos:', err);
    res.status(500).json({ msg: 'Error al obtener odontólogos de la base de datos.' });
  }
});

// Servir archivos estáticos
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3002; // Usar puerto diferente
app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba corriendo en http://localhost:${PORT}`);
});