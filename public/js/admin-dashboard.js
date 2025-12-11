// admin-dashboard.js
// Protección de ruta y bienvenida
const usuario = JSON.parse(localStorage.getItem('usuario'));
if (!usuario || usuario.rol !== 'admin') {
  window.location.href = '/index.html';
}
document.getElementById('admin-bienvenida').textContent = `Bienvenido, ${usuario.nombre} ${usuario.apellido}`;

// Cargar usuarios
function cargarUsuarios() {
  fetch('/api/usuarios')
    .then(res => res.json())
    .then(usuarios => {
      // Renderizar tabla de usuarios (puedes personalizar columnas)
      // ...
    });
}

// Cargar citas
function cargarCitas() {
  fetch('/api/citas')
    .then(res => res.json())
    .then(citas => {
      // Renderizar tabla de citas
      // ...
    });
}

// Cargar reportes
function cargarReportes() {
  fetch('/api/reportes')
    .then(res => res.json())
    .then(reportes => {
      // Renderizar reportes
      // ...
    });
}

// Cargar inventario y sedes
function cargarInventario() {
  fetch('/api/inventario')
    .then(res => res.json())
    .then(inventario => {
      // Renderizar inventario y sedes
      // ...
    });
}

document.addEventListener('DOMContentLoaded', function() {
  cargarUsuarios();
  cargarCitas();
  cargarReportes();
  cargarInventario();
});

// Cierre de sesión seguro
document.getElementById('logout-btn').addEventListener('click', function() {
  localStorage.removeItem('usuario');
});
