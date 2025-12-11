const express = require('express');
const router = express.Router();
const facturasController = require('../controllers/facturasController');

console.log('🔄 Configurando rutas de facturas (MODO DEMO)...');

// ============================================
// CATÁLOGO DE SERVICIOS
// ============================================
router.get('/catalogo-servicios', facturasController.obtenerCatalogoServicios);

// ============================================
// FACTURAS - CRUD
// ============================================
router.post('/crear', facturasController.crearFactura);
router.get('/', facturasController.obtenerFacturas);
router.get('/:id', facturasController.obtenerFacturaPorId);

// ============================================
// PAGOS (SIMULADOS)
// ============================================
router.post('/:id/pagar', facturasController.pagarFactura);

// ============================================
// VISTAS ESPECÍFICAS POR ROL
// ============================================

// ADMIN
router.get('/admin/resumen', facturasController.obtenerResumenFinanciero);
router.get('/admin/distribuciones-pendientes', facturasController.obtenerDistribucionesPendientes);
router.post('/admin/pagar-odontologo', facturasController.pagarOdontologo);

// ODONTÓLOGO
router.get('/odontologo/mis-ingresos', facturasController.obtenerMisIngresos);

// PACIENTE
router.get('/paciente/mis-facturas', facturasController.obtenerMisFacturas);

console.log('✅ Rutas de facturas configuradas exitosamente');

module.exports = router;
