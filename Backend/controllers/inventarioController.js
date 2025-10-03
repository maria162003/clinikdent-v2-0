const inventarioStore = [];

function agregarItem(req, res) {
  const { nombre, cantidad, unidad } = req.body;
  const id = (inventarioStore.length + 1).toString();
  const item = { id, nombre, cantidad, unidad, createdAt: new Date() };
  inventarioStore.push(item);
  res.status(201).json({ item });
}

function listarInventario(req, res) {
  res.json({ inventario: inventarioStore });
}

module.exports = {
  agregarItem,
  listarInventario
};