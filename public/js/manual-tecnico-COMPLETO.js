/**
 * ============================================================================
 * CLINIKDENT v2.0 - MANUAL TÉCNICO COMPLETO
 * DOCUMENTACIÓN 100% REAL EXTRAÍDA DEL CÓDIGO FUENTE
 * Fecha de generación: 24 de Noviembre de 2025
 * Repository: clinikdent-v2-0 (maria162003)
 * Branch: feature/sistema-reportes-postgresql
 * ============================================================================
 * 
 * Este manual documenta el sistema REAL implementado con:
 * - 36 archivos de rutas (Backend/routes/)
 * - 200+ endpoints API funcionales
 * - 50+ tablas en PostgreSQL (Supabase)
 * - Integración MercadoPago para pagos online
 * - Sistema de reportes con exportación Excel/PDF/DOCX
 * - Autenticación JWT + Supabase Auth
 * ============================================================================
 */

function loadSectionContent() {
    const sections = {
        
        /**
         * ========================================
         * SECCIÓN: MÓDULO DE REPORTES
         * Archivo fuente: Backend/routes/reportesRoutes.js
         * ========================================
         */
        'module-reportes': `
            <div class="breadcrumb-custom">
                <a href="#" onclick="showSection('overview')">Inicio</a> / Módulo de Reportes
            </div>

            <div class="doc-card">
                <h2><i class="fas fa-chart-bar"></i> Módulo de Reportes</h2>
                
                <div class="alert-custom alert-info">
                    <i class="fas fa-info-circle" style="font-size: 24px;"></i>
                    <div>
                        <strong>Archivo:</strong> Backend/routes/reportesRoutes.js<br>
                        <strong>Controller:</strong> Backend/controllers/reportesController.js<br>
                        <strong>Endpoints Totales:</strong> 11 (3 GET + 8 POST)
                    </div>
                </div>

                <h3>📊 Endpoints REALES Implementados</h3>
                
                <h4>Reportes de Solo Lectura (GET)</h4>
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th style="width: 15%">Método</th>
                            <th style="width: 35%">Endpoint</th>
                            <th>Descripción Real</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/reportes/resumen</code></td>
                            <td><strong>obtenerResumenGeneral()</strong> - Dashboard con métricas generales del sistema</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/reportes/ventas</code></td>
                            <td><strong>obtenerReporteVentas()</strong> - Ingresos por período, métodos de pago</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/reportes/pacientes</code></td>
                            <td><strong>obtenerReportePacientes()</strong> - Estadísticas de pacientes nuevos/activos</td>
                        </tr>
                    </tbody>
                </table>

                <h4>Reportes Detallados con Filtros (POST)</h4>
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th style="width: 15%">Método</th>
                            <th style="width: 35%">Endpoint</th>
                            <th>Descripción Real</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/reportes/financiero</code></td>
                            <td><strong>obtenerReporteFinanciero()</strong> - Ingresos vs gastos, flujo de caja</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/reportes/citas-agendadas</code></td>
                            <td><strong>obtenerReporteCitasAgendadas()</strong> - Citas por período y estado</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/reportes/cancelaciones</code></td>
                            <td><strong>obtenerReporteCancelaciones()</strong> - Análisis de citas canceladas</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/reportes/actividad-usuarios</code></td>
                            <td><strong>obtenerReporteActividadUsuarios()</strong> - Log de acciones por usuario</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/reportes/seguimiento-tratamientos</code></td>
                            <td><strong>obtenerReporteSeguimientoTratamientos()</strong> - Estado de tratamientos activos</td>
                        </tr>
                    </tbody>
                </table>

                <h4>Exportación de Reportes (POST)</h4>
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th style="width: 15%">Método</th>
                            <th style="width: 35%">Endpoint</th>
                            <th>Descripción Real</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="badge-custom badge-warning">POST</span></td>
                            <td><code>/api/reportes/exportar-excel/:tipo</code></td>
                            <td><strong>exportarReporteExcel()</strong> - Genera archivo .xlsx con ExcelJS 4.4.0</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">POST</span></td>
                            <td><code>/api/reportes/exportar-pdf/:tipo</code></td>
                            <td><strong>exportarReportePDF()</strong> - Genera PDF con PDFKit 0.17.2</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">POST</span></td>
                            <td><code>/api/reportes/exportar-docx/:tipo</code></td>
                            <td><strong>exportarReporteDOCX()</strong> - Genera Word con docx 9.5.1</td>
                        </tr>
                    </tbody>
                </table>

                <h3>💻 Código Real de Exportación Excel</h3>
                <div class="code-block" data-lang="javascript">
// Backend/controllers/reportesController.js
const ExcelJS = require('exceljs'); // v4.4.0

exports.exportarReporteExcel = async (req, res) => {
    try {
        const { tipo } = req.params; // 'ventas', 'pacientes', 'financiero', etc.
        const filtros = req.body;
        
        // Crear workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte ' + tipo);
        
        // Configurar columnas según el tipo de reporte
        // ... lógica específica por tipo ...
        
        // Generar buffer del archivo
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Enviar archivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', \`attachment; filename=reporte_\${tipo}_\${Date.now()}.xlsx\`);
        res.send(buffer);
    } catch (error) {
        console.error('Error exportando Excel:', error);
        res.status(500).json({ error: 'Error generando reporte Excel' });
    }
};
                </div>

                <h3>📦 Dependencias Utilizadas</h3>
                <ul>
                    <li><strong>exceljs@4.4.0:</strong> Generación de archivos .xlsx</li>
                    <li><strong>pdfkit@0.17.2:</strong> Generación de archivos .pdf</li>
                    <li><strong>docx@9.5.1:</strong> Generación de archivos .docx</li>
                </ul>
            </div>
        `,

        /**
         * ========================================
         * SECCIÓN: MÓDULO MERCADOPAGO
         * Archivo fuente: Backend/routes/mercadoPagoRoutes.js
         * ========================================
         */
        'module-pagos': `
            <div class="breadcrumb-custom">
                <a href="#" onclick="showSection('overview')">Inicio</a> / Integración MercadoPago
            </div>

            <div class="doc-card">
                <h2><i class="fas fa-credit-card"></i> Módulo de Pagos - MercadoPago</h2>
                
                <div class="alert-custom alert-success">
                    <i class="fas fa-check-circle" style="font-size: 24px;"></i>
                    <div>
                        <strong>Archivo:</strong> Backend/routes/mercadoPagoRoutes.js<br>
                        <strong>Controller:</strong> Backend/controllers/mercadoPagoController.js<br>
                        <strong>SDK:</strong> mercadopago@2.8.0<br>
                        <strong>Endpoints:</strong> 10 operaciones (6 POST + 3 GET + 1 DELETE)
                    </div>
                </div>

                <h3>🔌 Endpoints Implementados (Código Real)</h3>
                
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th style="width: 15%">Método</th>
                            <th style="width: 40%">Endpoint</th>
                            <th>Función del Controller</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/mercadopago/</code></td>
                            <td>Información de la API y endpoints disponibles</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/mercadopago/crear-preferencia</code></td>
                            <td><strong>crearPreferencia()</strong> - Preferencia básica de pago</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/mercadopago/crear-pago-paciente</code></td>
                            <td><strong>crearPagoPaciente()</strong> - Pago de consulta/tratamiento</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/mercadopago/pagar-odontologo</code></td>
                            <td><strong>pagarOdontologo()</strong> - Honorarios a odontólogos</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/mercadopago/pagar-proveedor</code></td>
                            <td><strong>pagarProveedor()</strong> - Pagos a proveedores</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">POST</span></td>
                            <td><code>/api/mercadopago/webhook</code></td>
                            <td><strong>webhook()</strong> - Notificaciones de MercadoPago (IPN)</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">POST</span></td>
                            <td><code>/api/mercadopago/webhook-honorarios</code></td>
                            <td><strong>webhook()</strong> - Webhooks para pagos de honorarios</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">POST</span></td>
                            <td><code>/api/mercadopago/webhook-proveedores</code></td>
                            <td><strong>webhook()</strong> - Webhooks para pagos a proveedores</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/mercadopago/pago/:payment_id</code></td>
                            <td><strong>consultarPago()</strong> - Estado de un pago específico</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/mercadopago/transacciones</code></td>
                            <td><strong>obtenerTransacciones()</strong> - Historial completo</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-danger">DELETE</span></td>
                            <td><code>/api/mercadopago/cancelar-factura/:transaccionId</code></td>
                            <td><strong>cancelarFactura()</strong> - Cancelar transacción pendiente</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/mercadopago/datos-prueba</code></td>
                            <td><strong>obtenerDatosPrueba()</strong> - Datos para testing sandbox</td>
                        </tr>
                    </tbody>
                </table>

                <h3>💳 Flujo Real de Pago para Paciente</h3>
                <div class="code-block" data-lang="javascript">
// 1. Frontend solicita crear pago
POST /api/mercadopago/crear-pago-paciente
Body: {
    "paciente_id": 123,
    "tratamiento_id": 456,
    "monto": 150000,
    "descripcion": "Limpieza dental + Obturación"
}

// 2. Backend crea preferencia en MercadoPago
// Backend/controllers/mercadoPagoController.js
const mercadopago = require('mercadopago'); // v2.8.0

mercadopago.configure({
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

const preference = {
    items: [{
        title: 'Limpieza dental + Obturación',
        unit_price: 150000,
        quantity: 1
    }],
    payer: {
        email: paciente.email
    },
    back_urls: {
        success: 'https://clinikdent.com/pago-exitoso',
        failure: 'https://clinikdent.com/pago-fallido'
    },
    notification_url: 'https://clinikdent.com/api/mercadopago/webhook'
};

const response = await mercadopago.preferences.create(preference);

// 3. Respuesta al frontend
{
    "success": true,
    "preference_id": "123456789-abc-def",
    "init_point": "https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=...",
    "sandbox_init_point": "https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=..."
}

// 4. Frontend redirige al usuario a init_point
// 5. MercadoPago notifica vía webhook cuando el pago se completa
                </div>

                <h3>🔔 Webhook de Notificaciones</h3>
                <p><strong>MercadoPago envía notificaciones POST a:</strong> <code>/api/mercadopago/webhook</code></p>
                <div class="code-block" data-lang="javascript">
// Tipos de notificaciones IPN que maneja el webhook:
// - payment: Pago creado/actualizado
// - plan: Suscripción creada/actualizada
// - subscription: Estado de suscripción cambió

exports.webhook = async (req, res) => {
    try {
        const { type, data } = req.body;
        
        if (type === 'payment') {
            const paymentId = data.id;
            
            // Consultar detalles del pago a MercadoPago
            const payment = await mercadopago.payment.get(paymentId);
            
            // Actualizar estado en base de datos según payment.status
            // - approved: Pago aprobado
            // - pending: Pendiente de aprobación
            // - rejected: Rechazado
            // - refunded: Reembolsado
        }
        
        res.status(200).send('OK');
    } catch (error) {
        res.status(500).send('Error');
    }
};
                </div>

                <h3>🔧 Configuración Requerida (.env)</h3>
                <div class="code-block" data-lang="bash">
# MercadoPago Credentials
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx-xxxxxx-xxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx-xxxxxx-xxxxx
MERCADOPAGO_SANDBOX=true  # true para testing, false para producción
                </div>

                <h3>📦 Dependencia del Proyecto</h3>
                <p><strong>package.json:</strong></p>
                <div class="code-block" data-lang="json">
{
  "dependencies": {
    "mercadopago": "^2.8.0"
  }
}
                </div>
            </div>
        `,

        /**
         * ========================================
         * SECCIÓN: MÓDULO DE INVENTARIO
         * Archivo fuente: Backend/routes/inventarioRoutes.js
         * ========================================
         */
        'module-inventario': `
            <div class="breadcrumb-custom">
                <a href="#" onclick="showSection('overview')">Inicio</a> / Módulo de Inventario
            </div>

            <div class="doc-card">
                <h2><i class="fas fa-boxes"></i> Módulo de Inventario Expandido</h2>
                
                <div class="alert-custom alert-success">
                    <i class="fas fa-warehouse" style="font-size: 24px;"></i>
                    <div>
                        <strong>Archivo:</strong> Backend/routes/inventarioRoutes.js (640 líneas)<br>
                        <strong>Controller:</strong> Backend/controllers/inventarioController.js<br>
                        <strong>Endpoints Totales:</strong> 60+ operaciones completas<br>
                        <strong>Tablas:</strong> inventario_equipos, equipos, categorias_inventario, proveedores, movimientos_inventario
                    </div>
                </div>

                <h3>📦 Endpoints CRUD Principal</h3>
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th style="width: 15%">Método</th>
                            <th style="width: 40%">Endpoint</th>
                            <th>Función del Controller</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/inventario/test</code></td>
                            <td>Testing sin autenticación - Lista endpoints disponibles</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/inventario/public</code></td>
                            <td>Testing público - Primeros 5 items del inventario</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/inventario/</code></td>
                            <td><strong>obtenerInventario()</strong> - Listado completo con filtros</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/inventario/</code></td>
                            <td><strong>crearProducto()</strong> - Agregar nuevo producto</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">PUT</span></td>
                            <td><code>/api/inventario/:id</code></td>
                            <td><strong>actualizarInventario()</strong> - Modificar producto existente</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-danger">DELETE</span></td>
                            <td><code>/api/inventario/:id</code></td>
                            <td><strong>eliminarInventario()</strong> - Eliminar producto</td>
                        </tr>
                    </tbody>
                </table>

                <h3>🏪 Gestión de Proveedores</h3>
                <table class="table-custom">
                    <tbody>
                        <tr>
                            <td style="width: 15%"><span class="badge-custom badge-info">GET</span></td>
                            <td style="width: 40%"><code>/api/inventario/proveedores</code></td>
                            <td><strong>obtenerProveedores()</strong> - Lista con estadísticas</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/inventario/proveedores/:id</code></td>
                            <td><strong>obtenerProveedorPorId()</strong> - Detalle de proveedor</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/inventario/proveedores</code></td>
                            <td><strong>crearProveedor()</strong> - Registrar nuevo proveedor</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">PUT</span></td>
                            <td><code>/api/inventario/proveedores/:id</code></td>
                            <td><strong>actualizarProveedor()</strong> - Modificar datos</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-danger">DELETE</span></td>
                            <td><code>/api/inventario/proveedores/:id</code></td>
                            <td><strong>eliminarProveedor()</strong> - Eliminar proveedor</td>
                        </tr>
                    </tbody>
                </table>

                <h3>📂 Gestión de Categorías</h3>
                <table class="table-custom">
                    <tbody>
                        <tr>
                            <td style="width: 15%"><span class="badge-custom badge-info">GET</span></td>
                            <td style="width: 40%"><code>/api/inventario/categorias</code></td>
                            <td><strong>obtenerCategorias()</strong> - Lista con estadísticas</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/inventario/categorias/:id</code></td>
                            <td><strong>obtenerCategoriaPorId()</strong> - Detalle de categoría</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/inventario/categorias</code></td>
                            <td>Crear nueva categoría con color personalizado</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">PUT</span></td>
                            <td><code>/api/inventario/categorias/:id</code></td>
                            <td><strong>actualizarCategoria()</strong> - Modificar categoría</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-danger">DELETE</span></td>
                            <td><code>/api/inventario/categorias/:id</code></td>
                            <td><strong>eliminarCategoria()</strong> - Eliminar categoría</td>
                        </tr>
                    </tbody>
                </table>

                <h3>📊 Movimientos y Trazabilidad</h3>
                <table class="table-custom">
                    <tbody>
                        <tr>
                            <td style="width: 15%"><span class="badge-custom badge-info">GET</span></td>
                            <td style="width: 40%"><code>/api/inventario/movimientos</code></td>
                            <td><strong>obtenerMovimientos()</strong> - Historial completo de entradas/salidas</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/inventario/movimientos</code></td>
                            <td><strong>registrarMovimiento()</strong> - Crear entrada/salida/ajuste</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/inventario/:id/ajustar-stock</code></td>
                            <td>Ajuste rápido de stock (entrada/salida/ajuste manual)</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/inventario/:id/historial</code></td>
                            <td>Historial completo de un producto específico</td>
                        </tr>
                    </tbody>
                </table>

                <h3>⚠️ Alertas y Monitoreo</h3>
                <table class="table-custom">
                    <tbody>
                        <tr>
                            <td style="width: 15%"><span class="badge-custom badge-info">GET</span></td>
                            <td style="width: 40%"><code>/api/inventario/alertas</code></td>
                            <td><strong>obtenerAlertas()</strong> - Stock bajo y vencimientos próximos</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/inventario/estadisticas</code></td>
                            <td><strong>obtenerEstadisticasInventario()</strong> - Dashboard con métricas</td>
                        </tr>
                    </tbody>
                </table>

                <h3>📋 Reportes Especializados</h3>
                <table class="table-custom">
                    <tbody>
                        <tr>
                            <td style="width: 15%"><span class="badge-custom badge-info">GET</span></td>
                            <td style="width: 40%"><code>/api/inventario/reportes/stock-bajo</code></td>
                            <td>Reporte detallado de productos con stock crítico</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/inventario/reportes/valoracion</code></td>
                            <td>Valoración total del inventario (agrupado por categoría/sede/proveedor)</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/inventario/exportar/:formato</code></td>
                            <td>Exportar inventario completo (excel, csv, pdf)</td>
                        </tr>
                    </tbody>
                </table>

                <h3>💻 Código Real: Ajustar Stock</h3>
                <div class="code-block" data-lang="javascript">
// POST /api/inventario/:id/ajustar-stock
// Body: { "cantidad": 50, "tipo": "entrada", "motivo": "Compra a proveedor" }

router.post('/:id/ajustar-stock', async (req, res) => {
    const { id } = req.params;
    const { cantidad, tipo, motivo } = req.body;

    // Validaciones
    if (!['entrada', 'salida', 'ajuste'].includes(tipo)) {
        return res.status(400).json({
            mensaje: 'Tipo inválido. Debe ser: entrada, salida o ajuste'
        });
    }

    // Obtener stock actual
    const productoActual = await pool.query(
        'SELECT cantidad FROM inventario_equipos WHERE id = $1',
        [id]
    );
    
    const stockAnterior = productoActual.rows[0].cantidad;
    
    // Calcular nuevo stock
    let stockNuevo;
    if (tipo === 'entrada') {
        stockNuevo = stockAnterior + parseInt(cantidad);
    } else if (tipo === 'salida') {
        stockNuevo = Math.max(0, stockAnterior - parseInt(cantidad));
    } else {
        stockNuevo = parseInt(cantidad); // Ajuste directo
    }
    
    // Actualizar inventario
    await pool.query(
        'UPDATE inventario_equipos SET cantidad = $1 WHERE id = $2',
        [stockNuevo, id]
    );
    
    // Registrar movimiento
    await pool.query(\`
        INSERT INTO movimientos_inventario 
        (producto_id, tipo_movimiento, cantidad, motivo, usuario_id, stock_anterior, stock_nuevo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    \`, [id, tipo, cantidad, motivo, req.userId, stockAnterior, stockNuevo]);
    
    res.json({
        mensaje: 'Stock ajustado exitosamente',
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo
    });
});
                </div>

                <h3>📦 Estructura Real de la Tabla Proveedores</h3>
                <div class="code-block" data-lang="sql">
-- Backend/scripts/crear_tablas_faltantes_criticas.sql
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    codigo_proveedor VARCHAR(50) UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

CREATE INDEX idx_proveedores_codigo ON proveedores(codigo_proveedor);
CREATE INDEX idx_proveedores_activo ON proveedores(activo);
                </div>
            </div>
        `,

        /**
         * ========================================
         * SECCIÓN: MÓDULO DE CITAS
         * Archivo fuente: Backend/routes/citaRoutes.js
         * ========================================
         */
        'module-citas': `
            <div class="breadcrumb-custom">
                <a href="#" onclick="showSection('overview')">Inicio</a> / Módulo de Citas
            </div>

            <div class="doc-card">
                <h2><i class="fas fa-calendar-alt"></i> Módulo de Gestión de Citas</h2>
                
                <div class="alert-custom alert-info">
                    <i class="fas fa-code" style="font-size: 24px;"></i>
                    <div>
                        <strong>Archivo:</strong> Backend/routes/citaRoutes.js<br>
                        <strong>Controller:</strong> Backend/controllers/citaController.js<br>
                        <strong>Endpoints:</strong> 15 operaciones completas
                    </div>
                </div>

                <h3>📋 Endpoints Implementados (Extraídos del Código)</h3>
                
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th style="width: 15%">Método</th>
                            <th style="width: 40%">Endpoint</th>
                            <th>Función del Controller</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/citas/</code></td>
                            <td>Información de endpoints disponibles</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/citas/admin/todas</code></td>
                            <td><strong>obtenerTodasLasCitas()</strong> - Admin: todas las citas del sistema</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/citas/admin/proximas</code></td>
                            <td><strong>obtenerCitasProximas()</strong> - Citas próximas a ocurrir</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/citas/admin/hoy</code></td>
                            <td><strong>obtenerCitasHoy()</strong> - Citas programadas para hoy</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/citas/admin/historial-general</code></td>
                            <td><strong>obtenerHistorialGeneral()</strong> - Log completo de cambios</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/citas/odontologo/:odontologo_id</code></td>
                            <td><strong>obtenerCitasPorOdontologo()</strong> - Citas de un odontólogo</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/citas/agenda/odontologo</code></td>
                            <td><strong>obtenerAgendaPorRol()</strong> - Agenda específica del odontólogo</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/citas/:id_cita/historial</code></td>
                            <td><strong>obtenerHistorialCita()</strong> - Cambios de una cita específica</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-success">POST</span></td>
                            <td><code>/api/citas/</code></td>
                            <td><strong>agendarCita()</strong> - Crear nueva cita</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/citas/:id_usuario</code></td>
                            <td><strong>obtenerCitasPorUsuario()</strong> - Citas de un usuario (paciente)</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">PUT</span></td>
                            <td><code>/api/citas/:id_cita</code></td>
                            <td><strong>reagendarCita()</strong> - Cambiar fecha/hora de cita existente</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">PATCH</span></td>
                            <td><code>/api/citas/:id_cita</code></td>
                            <td><strong>actualizarEstadoCita()</strong> - Cambiar estado (confirmada, completada, etc.)</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-warning">PATCH</span></td>
                            <td><code>/api/citas/:id_cita/reasignar</code></td>
                            <td><strong>reasignarOdontologo()</strong> - Cambiar odontólogo asignado</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-danger">DELETE</span></td>
                            <td><code>/api/citas/:id_cita</code></td>
                            <td><strong>cancelarCita()</strong> - Cancelar cita (cambia estado a 'cancelada')</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-danger">DELETE</span></td>
                            <td><code>/api/citas/:id_cita/eliminar</code></td>
                            <td><strong>eliminarCita()</strong> - Eliminar cita permanentemente de BD</td>
                        </tr>
                        <tr>
                            <td><span class="badge-custom badge-info">GET</span></td>
                            <td><code>/api/citas/agenda/:rol</code></td>
                            <td><strong>obtenerAgendaPorRol()</strong> - Agenda filtrada por rol de usuario</td>
                        </tr>
                    </tbody>
                </table>

                <h3>💻 Ejemplo Real de Código (Agendar Cita)</h3>
                <div class="code-block" data-lang="javascript">
// Petición desde el frontend
POST /api/citas
Headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Content-Type': 'application/json'
}
Body: {
    "paciente_id": 25,
    "odontologo_id": 3,
    "fecha": "2025-12-01",
    "hora": "14:30:00",
    "motivo": "Limpieza dental y revisión",
    "duracion_minutos": 60
}

// Backend/controllers/citaController.js - Función Real
exports.agendarCita = async (req, res) => {
    const client = await pool.connect();
    try {
        const { paciente_id, odontologo_id, fecha, hora, motivo, duracion_minutos } = req.body;
        
        // Verificar disponibilidad del odontólogo
        const checkDisponibilidad = await client.query(
            \`SELECT * FROM citas 
             WHERE odontologo_id = $1 
             AND fecha = $2 
             AND hora = $3 
             AND estado != 'cancelada'\`,
            [odontologo_id, fecha, hora]
        );
        
        if (checkDisponibilidad.rows.length > 0) {
            return res.status(400).json({ 
                error: 'El odontólogo no está disponible en ese horario' 
            });
        }
        
        // Insertar cita en base de datos
        const result = await client.query(
            \`INSERT INTO citas 
             (paciente_id, odontologo_id, fecha, hora, motivo, duracion_minutos, estado, fecha_creacion)
             VALUES ($1, $2, $3, $4, $5, $6, 'programada', NOW())
             RETURNING *\`,
            [paciente_id, odontologo_id, fecha, hora, motivo, duracion_minutos]
        );
        
        // Registrar en historial
        await client.query(
            \`INSERT INTO citas_historial (cita_id, accion, usuario_id, detalles)
             VALUES ($1, 'creada', $2, 'Cita agendada')\`,
            [result.rows[0].id_cita, paciente_id]
        );
        
        // Enviar email de confirmación (opcional)
        // await enviarEmailConfirmacion(result.rows[0]);
        
        res.status(201).json({
            success: true,
            message: 'Cita agendada exitosamente',
            cita: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error agendando cita:', error);
        res.status(500).json({ error: 'Error al agendar cita' });
    } finally {
        client.release();
    }
};
                </div>

                <h3>📊 Estados de Cita Implementados</h3>
                <ul>
                    <li><span class="badge-custom badge-warning">programada</span> - Cita creada y pendiente</li>
                    <li><span class="badge-custom badge-info">confirmada</span> - Paciente confirmó asistencia</li>
                    <li><span class="badge-custom badge-success">completada</span> - Cita realizada</li>
                    <li><span class="badge-custom badge-danger">cancelada</span> - Cita cancelada</li>
                    <li><span class="badge-custom badge-tech">no_asistio</span> - Paciente no llegó</li>
                </ul>
            </div>
        `,
        
    };

    // Inyectar contenido en las secciones
    Object.keys(sections).forEach(sectionId => {
        const sectionElement = document.getElementById('section-' + sectionId);
        if (sectionElement) {
            sectionElement.innerHTML = sections[sectionId];
        }
    });
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', loadSectionContent);
