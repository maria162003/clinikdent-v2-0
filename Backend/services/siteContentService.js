const db = require('../config/db');

const COLLECTIONS = {
  noticias: {
    table: 'noticias_portal',
    selectFields: `id, titulo, resumen, contenido, imagen_url, categoria, badge_text, boton_texto, boton_url, activo, fecha_publicacion, orden, created_at, updated_at`,
    allowedFields: ['titulo', 'resumen', 'contenido', 'imagen_url', 'categoria', 'badge_text', 'boton_texto', 'boton_url', 'fecha_publicacion', 'orden', 'activo'],
    orderBy: 'orden ASC, fecha_publicacion DESC, id DESC'
  },
  equipo: {
    table: 'equipo_portal',
    selectFields: `id, nombre, cargo, especialidad, descripcion, foto_url, linkedin_url, activo, orden, created_at, updated_at`,
    allowedFields: ['nombre', 'cargo', 'especialidad', 'descripcion', 'foto_url', 'linkedin_url', 'orden', 'activo'],
    orderBy: 'orden ASC, nombre ASC'
  }
};

let tablesReadyPromise = null;

const ensureTables = async () => {
  if (!tablesReadyPromise) {
    tablesReadyPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS noticias_portal (
          id SERIAL PRIMARY KEY,
          titulo VARCHAR(180) NOT NULL,
          resumen TEXT,
          contenido TEXT,
          imagen_url TEXT,
          categoria VARCHAR(80),
          badge_text VARCHAR(40),
          boton_texto VARCHAR(80),
          boton_url TEXT,
          fecha_publicacion DATE NOT NULL DEFAULT CURRENT_DATE,
          activo BOOLEAN NOT NULL DEFAULT TRUE,
          orden SMALLINT NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS equipo_portal (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(160) NOT NULL,
          cargo VARCHAR(120),
          especialidad VARCHAR(120),
          descripcion TEXT,
          foto_url TEXT,
          linkedin_url TEXT,
          activo BOOLEAN NOT NULL DEFAULT TRUE,
          orden SMALLINT NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);

      await seedDefaults();
    })().catch((error) => {
      tablesReadyPromise = null;
      throw error;
    });
  }

  return tablesReadyPromise;
};

const seedDefaults = async () => {
  const newsCount = await db.query('SELECT COUNT(*) AS total FROM noticias_portal');
  if (parseInt(newsCount.rows[0].total, 10) === 0) {
    await db.query(
      `INSERT INTO noticias_portal (titulo, resumen, contenido, categoria, badge_text, boton_texto, boton_url, imagen_url, orden) VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,0),
      ($9,$10,$11,$12,$13,$14,$15,$16,1),
      ($17,$18,$19,$20,$21,$22,$23,$24,2)`,
      [
        'Promoción Blanqueamiento',
        'Aprovecha nuestro 20% de descuento en blanqueamiento dental.',
        'Promoción válida hasta agotar agenda disponible.',
        'Promoción',
        'HOY',
        'Agendar ahora',
        '/agenda.html',
        'images/news1.jpg',
        'Nuevo Equipo Digital',
        'Incorporamos radiología digital para diagnósticos más precisos.',
        'Tecnología que mejora cada cita.',
        'Tecnología',
        'NUEVO',
        'Ver detalles',
        '/noticias.html',
        'images/news2.jpg',
        'Jornada de Salud Oral',
        'Valoración gratuita para niños y adultos este mes.',
        'Solicita tu cupo antes del 30.',
        'Eventos',
        'EVENTO',
        'Registrarme',
        '/registro.html',
        'images/news3.jpg'
      ]
    );
  }

  const teamCount = await db.query('SELECT COUNT(*) AS total FROM equipo_portal');
  if (parseInt(teamCount.rows[0].total, 10) === 0) {
    await db.query(
      `INSERT INTO equipo_portal (nombre, cargo, especialidad, descripcion, foto_url, linkedin_url, orden) VALUES
      ($1,$2,$3,$4,$5,$6,0),
      ($7,$8,$9,$10,$11,$12,1),
      ($13,$14,$15,$16,$17,$18,2),
      ($19,$20,$21,$22,$23,$24,3)`,
      [
        'Dra. Ana Pérez',
        'Directora Clínica',
        'Ortodoncia',
        'Especialista en ortodoncia invisible con 10 años de experiencia.',
        'images/doctor1.jpg',
        'https://linkedin.com',
        'Dr. Juan Gómez',
        'Jefe de Estética',
        'Estética Dental',
        'Especialista en rehabilitación oral y estética.',
        'images/doctor2.jpg',
        'https://linkedin.com',
        'Dra. Laura Ruiz',
        'Odontóloga Senior',
        'Odontología General',
        'Foco en prevención y educación para familias.',
        'images/doctor3.jpg',
        'https://linkedin.com',
        'Dr. Carlos Méndez',
        'Cirujano Oral',
        'Implantología',
        'Experto en implantes y cirugía guiada.',
        'images/doctor4.jpg',
        'https://linkedin.com'
      ]
    );
  }
};

const getCollectionConfig = (collection) => {
  const key = collection?.toLowerCase();
  if (!COLLECTIONS[key]) {
    const error = new Error('Colección no soportada');
    error.status = 400;
    throw error;
  }
  return { key, ...COLLECTIONS[key] };
};

const buildPayload = (allowedFields, data = {}) => {
  const payload = {};
  allowedFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null) {
      payload[field] = data[field];
    }
  });
  return payload;
};

const listItems = async (collection, { includeInactive = false } = {}) => {
  const config = getCollectionConfig(collection);
  await ensureTables();
  const whereClause = includeInactive ? '' : 'WHERE activo = TRUE';
  const query = `SELECT ${config.selectFields} FROM ${config.table} ${whereClause} ORDER BY ${config.orderBy}`;
  const result = await db.query(query);
  return result.rows;
};

const getPublicContent = async () => {
  const [noticias, equipo] = await Promise.all([
    listItems('noticias'),
    listItems('equipo')
  ]);
  return { noticias, equipo };
};

const createItem = async (collection, data = {}) => {
  const config = getCollectionConfig(collection);
  await ensureTables();
  const payload = buildPayload(config.allowedFields, data);

  if (!Object.keys(payload).length) {
    const error = new Error('No hay datos para crear');
    error.status = 400;
    throw error;
  }

  if (config.key === 'noticias' && !payload.titulo) {
    throw new Error('El título de la noticia es obligatorio');
  }
  if (config.key === 'equipo' && !payload.nombre) {
    throw new Error('El nombre del integrante es obligatorio');
  }

  if (payload.orden !== undefined) {
    payload.orden = Number(payload.orden) || 0;
  }

  const columns = Object.keys(payload);
  const values = Object.values(payload);
  const placeholders = columns.map((_, idx) => `$${idx + 1}`);

  const insertQuery = `INSERT INTO ${config.table} (${columns.join(',')}) VALUES (${placeholders.join(',')}) RETURNING ${config.selectFields}`;
  const result = await db.query(insertQuery, values);
  return result.rows[0];
};

const updateItem = async (collection, id, data = {}) => {
  const config = getCollectionConfig(collection);
  await ensureTables();
  const payload = buildPayload(config.allowedFields, data);

  if (!Object.keys(payload).length) {
    const error = new Error('No hay datos para actualizar');
    error.status = 400;
    throw error;
  }

  if (payload.orden !== undefined) {
    payload.orden = Number(payload.orden) || 0;
  }

  const setClauses = [];
  const values = [];
  Object.entries(payload).forEach(([field, value], idx) => {
    setClauses.push(`${field} = $${idx + 1}`);
    values.push(value);
  });
  values.push(id);

  const updateQuery = `UPDATE ${config.table} SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING ${config.selectFields}`;
  const result = await db.query(updateQuery, values);
  if (!result.rows.length) {
    const error = new Error('Registro no encontrado');
    error.status = 404;
    throw error;
  }
  return result.rows[0];
};

const toggleItemState = async (collection, id, desiredState) => {
  const config = getCollectionConfig(collection);
  await ensureTables();
  const query = `UPDATE ${config.table} SET activo = $1, updated_at = NOW() WHERE id = $2 RETURNING ${config.selectFields}`;
  const value = typeof desiredState === 'boolean' ? desiredState : null;

  let result;
  if (value === null) {
    result = await db.query(
      `UPDATE ${config.table} SET activo = NOT activo, updated_at = NOW() WHERE id = $1 RETURNING ${config.selectFields}`,
      [id]
    );
  } else {
    result = await db.query(query, [value, id]);
  }

  if (!result.rows.length) {
    const error = new Error('Registro no encontrado');
    error.status = 404;
    throw error;
  }
  return result.rows[0];
};

const deleteItem = async (collection, id) => {
  const config = getCollectionConfig(collection);
  await ensureTables();
  const result = await db.query(`DELETE FROM ${config.table} WHERE id = $1`, [id]);
  if (!result.rowCount) {
    const error = new Error('Registro no encontrado');
    error.status = 404;
    throw error;
  }
  return true;
};

module.exports = {
  listItems,
  getPublicContent,
  createItem,
  updateItem,
  toggleItemState,
  deleteItem
};
