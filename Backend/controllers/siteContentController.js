const siteContentService = require('../services/siteContentService');

const parseCollection = (value) => {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'noticias' || normalized === 'equipo') {
    return normalized;
  }
  const error = new Error('Colección no soportada');
  error.status = 400;
  throw error;
};

const handleError = (res, error) => {
  console.error('❌ Error en contenido del portal:', error);
  const status = error.status || 500;
  res.status(status).json({
    success: false,
    message: error.message || 'Error interno del servidor'
  });
};

exports.obtenerContenidoPublico = async (req, res) => {
  try {
    const contenido = await siteContentService.getPublicContent();
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({
      success: true,
      fetchedAt: new Date().toISOString(),
      ...contenido
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.listarColeccion = async (req, res) => {
  try {
    const collection = parseCollection(req.params.collection);
    const data = await siteContentService.listItems(collection, { includeInactive: true });
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

exports.crearItem = async (req, res) => {
  try {
    const collection = parseCollection(req.params.collection);
    const item = await siteContentService.createItem(collection, req.body);
    res.status(201).json({
      success: true,
      message: 'Contenido creado correctamente',
      data: item
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.actualizarItem = async (req, res) => {
  try {
    const collection = parseCollection(req.params.collection);
    const itemId = Number(req.params.id);
    const item = await siteContentService.updateItem(collection, itemId, req.body);
    res.json({
      success: true,
      message: 'Contenido actualizado correctamente',
      data: item
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.cambiarEstado = async (req, res) => {
  try {
    const collection = parseCollection(req.params.collection);
    const itemId = Number(req.params.id);
    const desiredState = typeof req.body.activo === 'boolean' ? req.body.activo : undefined;
    const item = await siteContentService.toggleItemState(collection, itemId, desiredState);
    res.json({
      success: true,
      message: `Elemento ${item.activo ? 'activado' : 'desactivado'} correctamente`,
      data: item
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.eliminarItem = async (req, res) => {
  try {
    const collection = parseCollection(req.params.collection);
    const itemId = Number(req.params.id);
    await siteContentService.deleteItem(collection, itemId);
    res.json({ success: true, message: 'Contenido eliminado correctamente' });
  } catch (error) {
    handleError(res, error);
  }
};
