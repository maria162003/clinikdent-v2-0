const db = require('../config/db');

console.log('🔄 Cargando facturasController (MODO DEMO)...');

/**
 * ====================================
 * SISTEMA DE FACTURACIÓN - MODO DEMO
 * No realiza pagos reales
 * ====================================
 */

// ============================================
// CATÁLOGO DE SERVICIOS
// ============================================

/**
 * Obtener todos los servicios del catálogo
 * GET /api/facturas/catalogo-servicios
 */
exports.obtenerCatalogoServicios = async (req, res) => {
    try {
        const { categoria, activo = true } = req.query;
        
        let query = 'SELECT * FROM catalogo_servicios WHERE 1=1';
        const params = [];
        
        if (categoria) {
            params.push(categoria);
            query += ` AND categoria = $${params.length}`;
        }
        
        if (activo !== undefined) {
            params.push(activo === 'true' || activo === true);
            query += ` AND activo = $${params.length}`;
        }
        
        query += ' ORDER BY categoria, nombre';
        
        const { rows } = await db.query(query, params);
        
        res.json({
            success: true,
            servicios: rows
        });
    } catch (error) {
        console.error('❌ Error obteniendo catálogo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener catálogo de servicios',
            error: error.message
        });
    }
};

// ============================================
// FACTURAS - CRUD
// ============================================

/**
 * Crear factura manualmente (Admin/Recepción)
 * POST /api/facturas/crear
 */
exports.crearFactura = async (req, res) => {
    try {
        const {
            paciente_id,
            odontologo_id,
            cita_id,
            servicios, // Array de { servicio_id, cantidad, precio_unitario }
            descuento = 0,
            notas
        } = req.body;
        
        console.log('📄 Creando factura:', { paciente_id, odontologo_id, servicios });
        
        // Validaciones
        if (!paciente_id || !servicios || !Array.isArray(servicios) || servicios.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos: se requiere paciente_id y al menos un servicio'
            });
        }
        
        // Obtener información de los servicios
        const serviciosCompletos = [];
        let subtotal = 0;
        
        for (const item of servicios) {
            const { rows } = await db.query(
                'SELECT * FROM catalogo_servicios WHERE id = $1',
                [item.servicio_id]
            );
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Servicio con ID ${item.servicio_id} no encontrado`
                });
            }
            
            const servicio = rows[0];
            const cantidad = item.cantidad || 1;
            const precioUnitario = item.precio_unitario || servicio.precio_base;
            const subtotalItem = precioUnitario * cantidad;
            
            serviciosCompletos.push({
                servicio_id: servicio.id,
                nombre: servicio.nombre,
                cantidad,
                precio_unitario: precioUnitario,
                subtotal: subtotalItem
            });
            
            subtotal += subtotalItem;
        }
        
        const total = subtotal - descuento;
        
        // Calcular fecha de vencimiento (2 días antes de la cita si existe, sino 3 días)
        let fechaVencimiento = new Date();
        if (cita_id) {
            const { rows: cita } = await db.query('SELECT fecha FROM citas WHERE id = $1', [cita_id]);
            if (cita.length > 0) {
                fechaVencimiento = new Date(cita[0].fecha);
                fechaVencimiento.setDate(fechaVencimiento.getDate() - 2);
            } else {
                fechaVencimiento.setDate(fechaVencimiento.getDate() + 3);
            }
        } else {
            fechaVencimiento.setDate(fechaVencimiento.getDate() + 3);
        }
        
        // Crear factura
        const { rows: factura } = await db.query(`
            INSERT INTO facturas (
                paciente_id, odontologo_id, cita_id,
                servicios, subtotal, descuento, total,
                fecha_vencimiento, notas, es_demo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
            RETURNING *
        `, [
            paciente_id, odontologo_id, cita_id,
            JSON.stringify(serviciosCompletos), subtotal, descuento, total,
            fechaVencimiento, notas
        ]);
        
        console.log('✅ Factura creada:', factura[0].numero_factura);
        
        res.json({
            success: true,
            message: 'Factura creada exitosamente',
            factura: factura[0]
        });
        
    } catch (error) {
        console.error('❌ Error creando factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear factura',
            error: error.message
        });
    }
};

/**
 * Obtener facturas con filtros
 * GET /api/facturas
 */
exports.obtenerFacturas = async (req, res) => {
    try {
        const {
            paciente_id,
            odontologo_id,
            estado,
            fecha_desde,
            fecha_hasta,
            page = 1,
            limit = 20
        } = req.query;
        
        let query = 'SELECT * FROM vista_facturas_completas WHERE 1=1';
        const params = [];
        
        if (paciente_id) {
            params.push(paciente_id);
            query += ` AND paciente_id = $${params.length}`;
        }
        
        if (odontologo_id) {
            params.push(odontologo_id);
            query += ` AND odontologo_id = $${params.length}`;
        }
        
        if (estado) {
            params.push(estado);
            query += ` AND estado = $${params.length}`;
        }
        
        if (fecha_desde) {
            params.push(fecha_desde);
            query += ` AND fecha_emision >= $${params.length}`;
        }
        
        if (fecha_hasta) {
            params.push(fecha_hasta);
            query += ` AND fecha_emision <= $${params.length}`;
        }
        
        query += ' ORDER BY fecha_emision DESC';
        
        const offset = (page - 1) * limit;
        params.push(limit, offset);
        query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
        
        const { rows: facturas } = await db.query(query, params);
        
        // Obtener conteo total
        let countQuery = 'SELECT COUNT(*) as total FROM facturas WHERE 1=1';
        const countParams = [];
        
        if (paciente_id) {
            countParams.push(paciente_id);
            countQuery += ` AND paciente_id = $${countParams.length}`;
        }
        
        if (odontologo_id) {
            countParams.push(odontologo_id);
            countQuery += ` AND odontologo_id = $${countParams.length}`;
        }
        
        if (estado) {
            countParams.push(estado);
            countQuery += ` AND estado = $${countParams.length}`;
        }
        
        const { rows: count } = await db.query(countQuery, countParams);
        
        res.json({
            success: true,
            facturas,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(count[0].total),
                pages: Math.ceil(count[0].total / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo facturas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener facturas',
            error: error.message
        });
    }
};

/**
 * Obtener factura por ID
 * GET /api/facturas/:id
 */
exports.obtenerFacturaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { rows } = await db.query(
            'SELECT * FROM vista_facturas_completas WHERE id = $1',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Factura no encontrada'
            });
        }
        
        res.json({
            success: true,
            factura: rows[0]
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener factura',
            error: error.message
        });
    }
};

// ============================================
// PAGOS (SIMULADOS)
// ============================================

/**
 * Registrar pago de factura (SIMULADO)
 * POST /api/facturas/:id/pagar
 */
exports.pagarFactura = async (req, res) => {
    try {
        const { id } = req.params;
        const { metodo_pago, notas } = req.body;
        
        console.log(`💳 Procesando pago DEMO de factura ${id}...`);
        
        // Validar método de pago
        const metodosPermitidos = ['efectivo_demo', 'transferencia_demo', 'tarjeta_demo', 'mercadopago_demo'];
        if (!metodosPermitidos.includes(metodo_pago)) {
            return res.status(400).json({
                success: false,
                message: 'Método de pago no válido'
            });
        }
        
        // Obtener factura
        const { rows: factura } = await db.query(
            'SELECT * FROM facturas WHERE id = $1',
            [id]
        );
        
        if (factura.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Factura no encontrada'
            });
        }
        
        if (factura[0].estado === 'PAGADA') {
            return res.status(400).json({
                success: false,
                message: 'Esta factura ya está pagada'
            });
        }
        
        // Generar ID de transacción simulado
        const transaccionDemoId = `DEMO-${metodo_pago.toUpperCase()}-${Date.now()}`;
        
        // Actualizar factura a PAGADA
        const { rows: facturaActualizada } = await db.query(`
            UPDATE facturas
            SET estado = 'PAGADA',
                fecha_pago = NOW(),
                metodo_pago = $1,
                transaccion_demo_id = $2,
                notas = COALESCE(notas || E'\\n\\n', '') || $3
            WHERE id = $4
            RETURNING *
        `, [metodo_pago, transaccionDemoId, notas || `Pago registrado vía ${metodo_pago}`, id]);
        
        // Actualizar estado de cita si existe
        if (factura[0].cita_id) {
            await db.query(
                'UPDATE citas SET estado_pago = $1 WHERE id = $2',
                ['pagado', factura[0].cita_id]
            );
        }
        
        console.log(`✅ Pago DEMO registrado: ${transaccionDemoId}`);
        
        res.json({
            success: true,
            message: 'Pago registrado exitosamente (DEMO)',
            factura: facturaActualizada[0],
            transaccion_demo_id: transaccionDemoId,
            es_demo: true
        });
        
    } catch (error) {
        console.error('❌ Error registrando pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar pago',
            error: error.message
        });
    }
};

// ============================================
// ESTADÍSTICAS Y DASHBOARDS
// ============================================

/**
 * Resumen financiero para administrador
 * GET /api/facturas/admin/resumen
 */
exports.obtenerResumenFinanciero = async (req, res) => {
    try {
        const { fecha_desde, fecha_hasta } = req.query;
        
        let filtroFecha = '';
        const params = [];
        
        if (fecha_desde) {
            params.push(fecha_desde);
            filtroFecha += ` AND f.fecha_emision >= $${params.length}`;
        }
        
        if (fecha_hasta) {
            params.push(fecha_hasta);
            filtroFecha += ` AND f.fecha_emision <= $${params.length}`;
        }
        
        // Resumen general de facturas
        const { rows: resumen } = await db.query(`
            SELECT
                COUNT(*) as total_facturas,
                COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END) as facturas_pendientes,
                COUNT(CASE WHEN estado = 'PAGADA' THEN 1 END) as facturas_pagadas,
                COUNT(CASE WHEN estado = 'VENCIDA' THEN 1 END) as facturas_vencidas,
                COALESCE(SUM(total), 0) as monto_total_facturado,
                COALESCE(SUM(CASE WHEN estado = 'PAGADA' THEN total ELSE 0 END), 0) as monto_cobrado,
                COALESCE(SUM(CASE WHEN estado = 'PENDIENTE' THEN total ELSE 0 END), 0) as monto_pendiente,
                COALESCE(SUM(CASE WHEN estado = 'VENCIDA' THEN total ELSE 0 END), 0) as monto_vencido
            FROM facturas f
            WHERE 1=1 ${filtroFecha}
        `, params);
        
        // Distribución pendiente de pago a odontólogos
        const { rows: distribucion } = await db.query(`
            SELECT
                COUNT(*) as distribuciones_pendientes,
                COALESCE(SUM(monto_odontologo), 0) as monto_pendiente_odontologos,
                COALESCE(SUM(monto_clinica), 0) as monto_para_clinica
            FROM distribucion_ingresos
            WHERE estado = 'PENDIENTE_PAGO'
        `);
        
        // Top odontólogos por ingresos
        const { rows: topOdontologos } = await db.query(`
            SELECT
                o.id,
                CONCAT(o.nombre, ' ', o.apellido) as nombre,
                COUNT(f.id) as total_facturas,
                COALESCE(SUM(f.total), 0) as total_generado,
                COALESCE(SUM(CASE WHEN f.estado = 'PAGADA' THEN f.total ELSE 0 END), 0) as total_cobrado
            FROM usuarios o
            LEFT JOIN facturas f ON o.id = f.odontologo_id ${filtroFecha.replace('f.fecha_emision', 'f.fecha_emision')}
            WHERE o.rol_id = (SELECT id FROM roles WHERE nombre = 'odontologo')
            GROUP BY o.id, o.nombre, o.apellido
            ORDER BY total_generado DESC
            LIMIT 10
        `, params);
        
        res.json({
            success: true,
            resumen: resumen[0],
            distribucion: distribucion[0],
            top_odontologos: topOdontologos
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo resumen financiero:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen financiero',
            error: error.message
        });
    }
};

/**
 * Resumen para odontólogo
 * GET /api/facturas/odontologo/mis-ingresos
 */
exports.obtenerMisIngresos = async (req, res) => {
    try {
        const odontologo_id = req.headers['user-id'];
        const { fecha_desde, fecha_hasta } = req.query;
        
        let filtroFecha = '';
        const params = [odontologo_id];
        
        if (fecha_desde) {
            params.push(fecha_desde);
            filtroFecha += ` AND f.fecha_emision >= $${params.length}`;
        }
        
        if (fecha_hasta) {
            params.push(fecha_hasta);
            filtroFecha += ` AND f.fecha_emision <= $${params.length}`;
        }
        
        // Resumen de facturas del odontólogo
        const { rows: resumen } = await db.query(`
            SELECT
                COUNT(*) as total_facturas,
                COALESCE(SUM(total), 0) as total_facturado,
                COALESCE(SUM(CASE WHEN estado = 'PAGADA' THEN total ELSE 0 END), 0) as total_cobrado,
                COALESCE(SUM(CASE WHEN estado = 'PENDIENTE' THEN total ELSE 0 END), 0) as pendiente_cobro
            FROM facturas f
            WHERE odontologo_id = $1 ${filtroFecha}
        `, params);
        
        // Distribución de ingresos (comisiones)
        const { rows: distribucion } = await db.query(`
            SELECT
                COUNT(*) as total_distribuciones,
                COALESCE(SUM(monto_odontologo), 0) as mi_comision_total,
                COALESCE(SUM(CASE WHEN estado = 'PENDIENTE_PAGO' THEN monto_odontologo ELSE 0 END), 0) as comision_pendiente,
                COALESCE(SUM(CASE WHEN estado = 'PAGADO' THEN monto_odontologo ELSE 0 END), 0) as comision_pagada
            FROM distribucion_ingresos
            WHERE odontologo_id = $1
        `, [odontologo_id]);
        
        // Detalle de facturas recientes
        const { rows: facturas } = await db.query(`
            SELECT *
            FROM vista_facturas_completas
            WHERE odontologo_id = $1 ${filtroFecha}
            ORDER BY fecha_emision DESC
            LIMIT 50
        `, params);
        
        res.json({
            success: true,
            resumen: resumen[0],
            distribucion: distribucion[0],
            facturas
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo ingresos del odontólogo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ingresos',
            error: error.message
        });
    }
};

/**
 * Facturas del paciente
 * GET /api/facturas/paciente/mis-facturas
 */
exports.obtenerMisFacturas = async (req, res) => {
    try {
        const paciente_id = req.headers['user-id'];
        
        console.log(`📋 Obteniendo facturas para paciente ID: ${paciente_id}`);
        
        const { rows: facturas } = await db.query(`
            SELECT 
                f.*,
                u1.nombre || ' ' || u1.apellido as paciente_nombre,
                u2.nombre || ' ' || u2.apellido as odontologo_nombre
            FROM facturas f
            LEFT JOIN usuarios u1 ON f.paciente_id = u1.id
            LEFT JOIN usuarios u2 ON f.odontologo_id = u2.id
            WHERE f.paciente_id = $1 AND f.es_demo = true
            ORDER BY f.fecha_emision DESC
        `, [paciente_id]);
        
        console.log(`✅ Facturas encontradas: ${facturas.length}`);
        console.log('📄 Detalle de facturas:', facturas.map(f => ({
            id: f.id,
            numero: f.numero_factura,
            total: f.total,
            estado: f.estado,
            cita_id: f.cita_id
        })));
        
        res.json({
            success: true,
            facturas
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo facturas del paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener facturas',
            error: error.message
        });
    }
};

// ============================================
// DISTRIBUCIÓN A ODONTÓLOGOS
// ============================================

/**
 * Pagar a odontólogo (Marcar distribución como pagada)
 * POST /api/facturas/admin/pagar-odontologo
 */
exports.pagarOdontologo = async (req, res) => {
    try {
        const { distribucion_ids, metodo_pago, comprobante, notas } = req.body;
        
        console.log('💰 Pagando a odontólogo (DEMO):', distribucion_ids);
        
        if (!distribucion_ids || !Array.isArray(distribucion_ids) || distribucion_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere al menos una distribución para pagar'
            });
        }
        
        // Actualizar distribuciones
        const { rows } = await db.query(`
            UPDATE distribucion_ingresos
            SET estado = 'PAGADO',
                fecha_pago_odontologo = NOW(),
                metodo_pago_odontologo = $1,
                comprobante_pago = $2,
                notas = $3
            WHERE id = ANY($4::int[]) AND estado = 'PENDIENTE_PAGO'
            RETURNING *
        `, [metodo_pago || 'transferencia_demo', comprobante, notas, distribucion_ids]);
        
        console.log(`✅ ${rows.length} distribuciones marcadas como pagadas`);
        
        res.json({
            success: true,
            message: `${rows.length} pagos registrados exitosamente (DEMO)`,
            distribuciones_pagadas: rows
        });
        
    } catch (error) {
        console.error('❌ Error pagando a odontólogo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar pago',
            error: error.message
        });
    }
};

/**
 * Obtener distribuciones pendientes
 * GET /api/facturas/admin/distribuciones-pendientes
 */
exports.obtenerDistribucionesPendientes = async (req, res) => {
    try {
        const { odontologo_id } = req.query;
        
        let query = 'SELECT * FROM vista_distribucion_completa WHERE estado = $1';
        const params = ['PENDIENTE_PAGO'];
        
        if (odontologo_id) {
            params.push(odontologo_id);
            query += ` AND odontologo_id = $${params.length}`;
        }
        
        query += ' ORDER BY fecha_calculo DESC';
        
        const { rows: distribuciones } = await db.query(query, params);
        
        // Agrupar por odontólogo
        const agrupado = {};
        distribuciones.forEach(d => {
            if (!agrupado[d.odontologo_id]) {
                agrupado[d.odontologo_id] = {
                    odontologo_id: d.odontologo_id,
                    odontologo_nombre: d.odontologo_nombre,
                    total_pendiente: 0,
                    cantidad_facturas: 0,
                    distribuciones: []
                };
            }
            agrupado[d.odontologo_id].total_pendiente += parseFloat(d.monto_odontologo);
            agrupado[d.odontologo_id].cantidad_facturas++;
            agrupado[d.odontologo_id].distribuciones.push(d);
        });
        
        res.json({
            success: true,
            distribuciones_por_odontologo: Object.values(agrupado),
            total_general: distribuciones.reduce((sum, d) => sum + parseFloat(d.monto_odontologo), 0)
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo distribuciones pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener distribuciones',
            error: error.message
        });
    }
};

console.log('✅ facturasController cargado exitosamente (MODO DEMO)');

module.exports = exports;
