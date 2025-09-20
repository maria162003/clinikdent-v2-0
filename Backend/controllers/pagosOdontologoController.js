/**
 * CONTROLADOR PARA PAGOS A ODONTÓLOGOS
 * Sistema manual de registro de pagos y comisiones
 * No interfiere con MercadoPago (que es solo para pacientes)
 */

const db = require('../config/db');

/**
 * Obtener resumen financiero de un odontólogo
 * GET /api/pagos-odontologo/:id/resumen
 */
exports.obtenerResumenFinanciero = async (req, res) => {
    try {
        const odontologoId = req.params.id || req.headers['user-id'];
        console.log('💰 [PAGOS-ODONTOLOGO] Obteniendo resumen financiero para:', odontologoId);

        // Estadísticas generales
        const estadisticas = await db.query(`
            SELECT 
                COUNT(*) as total_servicios,
                COALESCE(SUM(monto_comision), 0) as total_comisiones,
                COALESCE(SUM(monto_pagado), 0) as total_pagado,
                COALESCE(SUM(saldo_pendiente), 0) as saldo_pendiente,
                COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as servicios_pendientes
            FROM cuentas_por_pagar_odontologo 
            WHERE odontologo_id = $1
        `, [odontologoId]);

        // Último pago registrado
        const ultimoPago = await db.query(`
            SELECT fecha_pago, monto_total, metodo_pago, concepto
            FROM pagos_odontologo 
            WHERE odontologo_id = $1 
            ORDER BY fecha_pago DESC 
            LIMIT 1
        `, [odontologoId]);

        // Ingresos por mes (últimos 6 meses)
        const ingresosMensuales = await db.query(`
            SELECT 
                DATE_TRUNC('month', fecha_pago) as mes,
                SUM(monto_total) as total_mes
            FROM pagos_odontologo 
            WHERE odontologo_id = $1 
            AND fecha_pago >= NOW() - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', fecha_pago)
            ORDER BY mes DESC
        `, [odontologoId]);

        const resultado = {
            success: true,
            estadisticas: estadisticas.rows[0] || {
                total_servicios: 0,
                total_comisiones: 0,
                total_pagado: 0,
                saldo_pendiente: 0,
                servicios_pendientes: 0
            },
            ultimo_pago: ultimoPago.rows[0] || null,
            ingresos_mensuales: ingresosMensuales.rows
        };

        console.log('✅ Resumen financiero calculado:', resultado.estadisticas);
        res.json(resultado);

    } catch (error) {
        console.error('❌ Error obteniendo resumen financiero:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen financiero'
        });
    }
};

/**
 * Obtener servicios pendientes de pago para un odontólogo
 * GET /api/pagos-odontologo/:id/pendientes
 */
exports.obtenerServiciosPendientes = async (req, res) => {
    try {
        const odontologoId = req.params.id || req.headers['user-id'];
        const { limit = 20, offset = 0 } = req.query;

        console.log('📋 [PAGOS-ODONTOLOGO] Obteniendo servicios pendientes para:', odontologoId);

        const servicios = await db.query(`
            SELECT 
                cpp.*,
                u.nombre as paciente_nombre,
                u.apellido as paciente_apellido,
                s.nombre as servicio_nombre
            FROM cuentas_por_pagar_odontologo cpp
            LEFT JOIN usuarios u ON cpp.paciente_id = u.id
            LEFT JOIN servicios s ON cpp.servicio_id = s.id
            WHERE cpp.odontologo_id = $1 
            AND cpp.saldo_pendiente > 0
            ORDER BY cpp.fecha_servicio DESC
            LIMIT $2 OFFSET $3
        `, [odontologoId, limit, offset]);

        // Contar total para paginación
        const total = await db.query(`
            SELECT COUNT(*) as total
            FROM cuentas_por_pagar_odontologo 
            WHERE odontologo_id = $1 AND saldo_pendiente > 0
        `, [odontologoId]);

        console.log('✅ Servicios pendientes encontrados:', servicios.rows.length);
        res.json({
            success: true,
            servicios: servicios.rows,
            total: parseInt(total.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('❌ Error obteniendo servicios pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener servicios pendientes'
        });
    }
};

/**
 * Obtener historial de pagos de un odontólogo
 * GET /api/pagos-odontologo/:id/historial
 */
exports.obtenerHistorialPagos = async (req, res) => {
    try {
        const odontologoId = req.params.id || req.headers['user-id'];
        const { limit = 20, offset = 0 } = req.query;

        console.log('📜 [PAGOS-ODONTOLOGO] Obteniendo historial de pagos para:', odontologoId);

        const pagos = await db.query(`
            SELECT 
                po.*,
                admin.nombre as pagado_por_nombre,
                admin.apellido as pagado_por_apellido
            FROM pagos_odontologo po
            LEFT JOIN usuarios admin ON po.pagado_por = admin.id
            WHERE po.odontologo_id = $1
            ORDER BY po.fecha_pago DESC
            LIMIT $2 OFFSET $3
        `, [odontologoId, limit, offset]);

        // Obtener detalles de cada pago (qué servicios se pagaron)
        for (let pago of pagos.rows) {
            const detalles = await db.query(`
                SELECT 
                    dpo.*,
                    cpp.concepto,
                    cpp.fecha_servicio,
                    u.nombre as paciente_nombre,
                    u.apellido as paciente_apellido
                FROM detalle_pago_odontologo dpo
                INNER JOIN cuentas_por_pagar_odontologo cpp ON dpo.cuenta_por_pagar_id = cpp.id
                LEFT JOIN usuarios u ON cpp.paciente_id = u.id
                WHERE dpo.pago_id = $1
                ORDER BY cpp.fecha_servicio DESC
            `, [pago.id]);
            
            pago.detalles = detalles.rows;
        }

        const total = await db.query(`
            SELECT COUNT(*) as total
            FROM pagos_odontologo 
            WHERE odontologo_id = $1
        `, [odontologoId]);

        console.log('✅ Historial de pagos encontrado:', pagos.rows.length);
        res.json({
            success: true,
            pagos: pagos.rows,
            total: parseInt(total.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('❌ Error obteniendo historial de pagos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de pagos'
        });
    }
};

/**
 * Registrar un nuevo pago a odontólogo (SOLO ADMINISTRADORES)
 * POST /api/pagos-odontologo/registrar
 */
exports.registrarPago = async (req, res) => {
    try {
        const {
            odontologo_id,
            monto_total,
            metodo_pago,
            concepto,
            numero_comprobante,
            fecha_pago,
            observaciones,
            servicios_a_pagar // Array de {cuenta_por_pagar_id, monto_aplicado}
        } = req.body;

        const pagado_por = req.headers['user-id']; // Admin que registra el pago

        console.log('💳 [PAGOS-ODONTOLOGO] Registrando pago:', {
            odontologo_id,
            monto_total,
            metodo_pago,
            servicios_count: servicios_a_pagar?.length || 0
        });

        // Validaciones
        if (!odontologo_id || !monto_total || !metodo_pago || !concepto || !fecha_pago) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }

        if (!servicios_a_pagar || servicios_a_pagar.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe seleccionar al menos un servicio para pagar'
            });
        }

        // Iniciar transacción
        await db.query('BEGIN');

        try {
            // 1. Insertar el pago principal
            const pagoResult = await db.query(`
                INSERT INTO pagos_odontologo (
                    odontologo_id, monto_total, metodo_pago, concepto, 
                    numero_comprobante, fecha_pago, pagado_por, observaciones
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `, [
                odontologo_id, monto_total, metodo_pago, concepto,
                numero_comprobante, fecha_pago, pagado_por, observaciones
            ]);

            const pagoId = pagoResult.rows[0].id;

            // 2. Insertar los detalles (qué servicios se pagaron)
            for (const servicio of servicios_a_pagar) {
                await db.query(`
                    INSERT INTO detalle_pago_odontologo (
                        pago_id, cuenta_por_pagar_id, monto_aplicado
                    ) VALUES ($1, $2, $3)
                `, [pagoId, servicio.cuenta_por_pagar_id, servicio.monto_aplicado]);
            }

            // 3. El trigger se encarga de actualizar automáticamente los saldos

            await db.query('COMMIT');

            console.log('✅ Pago registrado exitosamente con ID:', pagoId);
            res.json({
                success: true,
                message: 'Pago registrado exitosamente',
                pago_id: pagoId
            });

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('❌ Error registrando pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar el pago: ' + error.message
        });
    }
};

/**
 * Registrar comisión automáticamente cuando se completa un servicio
 * POST /api/pagos-odontologo/registrar-comision
 */
exports.registrarComision = async (req, res) => {
    try {
        const {
            odontologo_id,
            cita_id,
            servicio_id,
            paciente_id,
            monto_servicio
        } = req.body;

        console.log('🦷 [PAGOS-ODONTOLOGO] Registrando comisión automática:', {
            odontologo_id, cita_id, servicio_id, monto_servicio
        });

        // Obtener configuración de comisión
        const comisionConfig = await db.query(`
            SELECT porcentaje_comision
            FROM configuracion_comisiones
            WHERE odontologo_id = $1 AND servicio_id = $2 AND activo = true
            ORDER BY fecha_inicio DESC
            LIMIT 1
        `, [odontologo_id, servicio_id]);

        const porcentaje = comisionConfig.rows[0]?.porcentaje_comision || 60.00; // 60% por defecto

        // Obtener nombres para el concepto
        const nombres = await db.query(`
            SELECT 
                u.nombre as paciente_nombre,
                u.apellido as paciente_apellido,
                s.nombre as servicio_nombre
            FROM usuarios u, servicios s
            WHERE u.id = $1 AND s.id = $2
        `, [paciente_id, servicio_id]);

        const { paciente_nombre, paciente_apellido, servicio_nombre } = nombres.rows[0] || {};
        const concepto = `Comisión ${servicio_nombre} - ${paciente_nombre} ${paciente_apellido}`;

        const monto_comision = (monto_servicio * porcentaje / 100);

        // Insertar en cuentas por pagar
        const result = await db.query(`
            INSERT INTO cuentas_por_pagar_odontologo (
                odontologo_id, cita_id, servicio_id, paciente_id, concepto,
                monto_servicio, porcentaje_comision, monto_comision, 
                saldo_pendiente, fecha_servicio
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, CURRENT_DATE)
            RETURNING id
        `, [
            odontologo_id, cita_id, servicio_id, paciente_id, concepto,
            monto_servicio, porcentaje, monto_comision
        ]);

        console.log('✅ Comisión registrada:', { 
            id: result.rows[0].id, 
            monto_comision, 
            porcentaje 
        });

        res.json({
            success: true,
            message: 'Comisión registrada exitosamente',
            comision_id: result.rows[0].id,
            monto_comision,
            porcentaje_aplicado: porcentaje
        });

    } catch (error) {
        console.error('❌ Error registrando comisión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar comisión: ' + error.message
        });
    }
};

/**
 * Obtener todos los odontólogos con sus balances (SOLO ADMINISTRADORES)
 * GET /api/pagos-odontologo/admin/resumen-general
 */
exports.obtenerResumenGeneral = async (req, res) => {
    try {
        console.log('📊 [PAGOS-ODONTOLOGO] Obteniendo resumen general para admin');

        // Obtener estadísticas generales
        const resumen = await db.query(`
            SELECT 
                u.id,
                u.nombre,
                u.apellido,
                u.correo,
                -- Solo comisiones reales generadas automáticamente
                COALESCE(SUM(cpp.monto_comision), 0) as total_comisiones_pendientes,
                COALESCE(SUM(cpp.monto_pagado), 0) as total_comisiones_pagadas,
                COALESCE(SUM(cpp.saldo_pendiente), 0) as saldo_pendiente,
                COUNT(DISTINCT cpp.id) as total_servicios
            FROM usuarios u
            INNER JOIN roles r ON u.rol_id = r.id
            LEFT JOIN cuentas_por_pagar_odontologo cpp ON u.id = cpp.odontologo_id
            WHERE r.nombre = 'odontologo' AND u.activo = true
            GROUP BY u.id, u.nombre, u.apellido, u.correo
            ORDER BY saldo_pendiente DESC
        `);

        console.log('✅ Resumen general obtenido:', resumen.rows.length, 'odontólogos');
        
        // Calcular comisiones pagadas del mes actual
        const pagosMesActual = await db.query(`
            SELECT COALESCE(SUM(monto_pagado), 0) as pagos_mes
            FROM cuentas_por_pagar_odontologo 
            WHERE DATE_TRUNC('month', fecha_servicio) = DATE_TRUNC('month', CURRENT_DATE)
            AND monto_pagado > 0
        `);
        
        // Formato compatible con las estadísticas del frontend
        const estadisticas = {
            total_odontologos: resumen.rows.length,
            total_pendiente: resumen.rows.reduce((sum, odon) => sum + parseFloat(odon.saldo_pendiente || 0), 0),
            pagos_mes_actual: parseFloat(pagosMesActual.rows[0]?.pagos_mes || 0),
            total_comisiones: resumen.rows.reduce((sum, odon) => sum + parseFloat(odon.total_comisiones_pendientes || 0), 0)
        };
        
        console.log('📈 Estadísticas calculadas:', estadisticas);
        res.json(estadisticas);

    } catch (error) {
        console.error('❌ Error obteniendo resumen general:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen general'
        });
    }
};

/**
 * Obtener lista de odontólogos con información financiera
 * GET /api/pagos-odontologo/lista
 */
exports.obtenerListaOdontologos = async (req, res) => {
    try {
        console.log('👥 [PAGOS-ODONTOLOGO] Obteniendo lista de odontólogos para admin');

        const odontologos = await db.query(`
            SELECT 
                u.id,
                u.nombre,
                u.apellido,
                u.correo,
                u.telefono,
                -- Solo comisiones reales del sistema automático
                COALESCE(SUM(cpp.monto_comision), 0) as total_comisiones,
                COALESCE(SUM(cpp.monto_pagado), 0) as total_pagado,
                COALESCE(SUM(cpp.saldo_pendiente), 0) as saldo_pendiente,
                COUNT(DISTINCT cpp.id) as total_servicios,
                MAX(cpp.fecha_servicio) as ultimo_servicio,
                CASE 
                    WHEN COALESCE(SUM(cpp.saldo_pendiente), 0) > 0 THEN 'pendiente'
                    ELSE 'al_dia'
                END as estado
            FROM usuarios u
            INNER JOIN roles r ON u.rol_id = r.id
            LEFT JOIN cuentas_por_pagar_odontologo cpp ON u.id = cpp.odontologo_id
            WHERE r.nombre = 'odontologo' AND u.activo = true
            GROUP BY u.id, u.nombre, u.apellido, u.correo, u.telefono
            ORDER BY u.nombre, u.apellido
        `);

        console.log('✅ Lista de odontólogos obtenida:', odontologos.rows.length);
        res.json(odontologos.rows);

    } catch (error) {
        console.error('❌ Error obteniendo lista de odontólogos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener lista de odontólogos'
        });
    }
};

/**
 * Registrar pago simple desde dashboard admin (sin servicios específicos)
 * POST /api/pagos-odontologo/registrar-simple
 */
exports.registrarPagoSimple = async (req, res) => {
    try {
        const {
            odontologo_id,
            fecha_pago,
            tipo_pago,
            metodo_pago,
            monto,
            concepto,
            referencia,
            comision_porcentaje
        } = req.body;

        const pagado_por = req.headers['user-id'] || '1'; // Admin que registra el pago

        console.log('💳 [PAGOS-ODONTOLOGO] Registrando pago simple:', {
            odontologo_id,
            monto,
            tipo_pago,
            metodo_pago
        });

        // Validaciones básicas
        if (!odontologo_id || !fecha_pago || !tipo_pago || !metodo_pago || !monto) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios: odontólogo, fecha, tipo, método y monto'
            });
        }

        if (monto <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a cero'
            });
        }

        // Insertar el pago directamente
        const pagoResult = await db.query(`
            INSERT INTO pagos_odontologo (
                odontologo_id, monto_total, metodo_pago, concepto, 
                numero_comprobante, fecha_pago, pagado_por, observaciones
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [
            odontologo_id, 
            monto, 
            metodo_pago, 
            concepto || `Pago de ${tipo_pago}`,
            referencia || null, 
            fecha_pago, 
            pagado_por, 
            `Pago manual - Tipo: ${tipo_pago}${comision_porcentaje ? `, Comisión: ${comision_porcentaje}%` : ''}`
        ]);

        const pagoId = pagoResult.rows[0].id;

        console.log('✅ Pago simple registrado exitosamente con ID:', pagoId);
        res.json({
            success: true,
            message: 'Pago registrado exitosamente',
            pago_id: pagoId
        });

    } catch (error) {
        console.error('❌ Error registrando pago simple:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar el pago: ' + error.message
        });
    }
};

/**
 * Obtener detalles completos de un odontólogo específico
 * GET /api/pagos-odontologo/detalle/:id
 */
exports.obtenerDetalleOdontologo = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 [PAGOS-ODONTOLOGO] Obteniendo detalle del odontólogo:', id);

        // 1. Información básica del odontólogo
        const odontologoInfo = await db.query(`
            SELECT 
                u.id, u.nombre, u.apellido, u.correo as email, u.telefono,
                u.created_at as fecha_registro
            FROM usuarios u
            INNER JOIN roles r ON u.rol_id = r.id
            WHERE u.id = $1 AND r.nombre = 'odontologo'
        `, [id]);

        if (odontologoInfo.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Odontólogo no encontrado'
            });
        }

        // 2. Resumen financiero
        const resumenFinanciero = await db.query(`
            SELECT 
                -- Comisiones por servicios realizados
                COALESCE(SUM(cpp.monto_comision), 0) as total_comisiones_servicios,
                COALESCE(SUM(cpp.saldo_pendiente), 0) as saldo_pendiente_servicios,
                
                -- Pagos recibidos
                COALESCE((
                    SELECT SUM(po.monto_total) 
                    FROM pagos_odontologo po 
                    WHERE po.odontologo_id = $1
                ), 0) as total_pagos_recibidos,
                
                -- Conteos
                COUNT(DISTINCT cpp.id) as servicios_realizados,
                COUNT(DISTINCT CASE WHEN cpp.saldo_pendiente > 0 THEN cpp.id END) as servicios_pendientes
                
            FROM cuentas_por_pagar_odontologo cpp
            WHERE cpp.odontologo_id = $1
        `, [id]);

        // 3. Últimos pagos recibidos
        const ultimosPagos = await db.query(`
            SELECT 
                po.id, po.monto_total, po.concepto as tipo_pago, po.metodo_pago,
                po.fecha_pago, po.observaciones, po.numero_comprobante as referencia
            FROM pagos_odontologo po
            WHERE po.odontologo_id = $1
            ORDER BY po.fecha_pago DESC
            LIMIT 5
        `, [id]);

        // 4. Servicios pendientes de pago
        const serviciosPendientes = await db.query(`
            SELECT 
                cpp.id, cpp.concepto, cpp.monto_comision, cpp.saldo_pendiente,
                cpp.fecha_servicio, cpp.porcentaje_comision,
                u.nombre as paciente_nombre, u.apellido as paciente_apellido
            FROM cuentas_por_pagar_odontologo cpp
            LEFT JOIN usuarios u ON cpp.paciente_id = u.id
            WHERE cpp.odontologo_id = $1 
            AND cpp.saldo_pendiente > 0
            ORDER BY cpp.fecha_servicio DESC
            LIMIT 10
        `, [id]);

        // 5. Actividad del mes actual
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        const actividadMes = await db.query(`
            SELECT 
                COALESCE(SUM(cpp.monto_comision), 0) as comisiones_mes,
                COUNT(DISTINCT cpp.id) as servicios_mes,
                COALESCE((
                    SELECT SUM(po.monto_total) 
                    FROM pagos_odontologo po 
                    WHERE po.odontologo_id = $1 
                    AND po.fecha_pago >= $2
                ), 0) as pagos_mes
            FROM cuentas_por_pagar_odontologo cpp
            WHERE cpp.odontologo_id = $1 
            AND cpp.fecha_servicio >= $2
        `, [id, inicioMes]);

        const financiero = resumenFinanciero.rows[0];
        const actividad = actividadMes.rows[0];

        // Calcular saldo real (lo que debe recibir menos lo que ya recibió)
        const saldoReal = parseFloat(financiero.total_comisiones_servicios) - parseFloat(financiero.total_pagos_recibidos);

        const resultado = {
            success: true,
            odontologo: odontologoInfo.rows[0],
            resumen_financiero: {
                total_comisiones_servicios: parseFloat(financiero.total_comisiones_servicios),
                total_pagos_recibidos: parseFloat(financiero.total_pagos_recibidos),
                saldo_pendiente_servicios: parseFloat(financiero.saldo_pendiente_servicios),
                saldo_real: saldoReal,
                servicios_realizados: parseInt(financiero.servicios_realizados),
                servicios_pendientes: parseInt(financiero.servicios_pendientes)
            },
            actividad_mes: {
                comisiones_mes: parseFloat(actividad.comisiones_mes),
                servicios_mes: parseInt(actividad.servicios_mes),
                pagos_mes: parseFloat(actividad.pagos_mes)
            },
            ultimos_pagos: ultimosPagos.rows,
            servicios_pendientes: serviciosPendientes.rows,
            explicacion: {
                saldo_pendiente_servicios: "Dinero pendiente por servicios específicos no pagados",
                saldo_real: "Diferencia entre comisiones ganadas y pagos recibidos",
                total_comisiones_servicios: "Total ganado por servicios odontológicos realizados",
                total_pagos_recibidos: "Total de dinero efectivamente pagado al odontólogo"
            }
        };

        console.log('✅ Detalle del odontólogo obtenido exitosamente');
        res.json(resultado);

    } catch (error) {
        console.error('❌ Error obteniendo detalle del odontólogo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalle del odontólogo'
        });
    }
};

module.exports = exports;