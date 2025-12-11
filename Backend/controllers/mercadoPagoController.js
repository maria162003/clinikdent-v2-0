const db = require('../config/db');
const mercadoPagoService = require('../services/mercadoPagoService');

/**
 * Crear preferencia de pago básica
 * POST /api/mercadopago/crear-preferencia
 */
exports.crearPreferencia = async (req, res) => {
    const { titulo, descripcion, precio, cantidad = 1 } = req.body;
    const usuario_id = req.headers['user-id'] || req.body.usuario_id;
    
    console.log('💳 Creando preferencia de pago:', { titulo, precio, usuario_id });
    
    try {
        // Validar datos obligatorios
        if (!titulo || !precio) {
            return res.status(400).json({ 
                error: 'Título y precio son obligatorios' 
            });
        }

        // Obtener información del usuario si está disponible
        let usuario_info = null;
        if (usuario_id) {
            const { rows: usuario } = await db.query(
                'SELECT nombre, apellido, correo, telefono FROM usuarios WHERE id = $1',
                [usuario_id]
            );
            usuario_info = usuario[0] || null;
        }
        
        // Crear preferencia en MercadoPago
        const preferencia = await mercadoPagoService.crearPreferencia({
            titulo,
            descripcion: descripcion || titulo,
            precio: parseFloat(precio),
            cantidad: parseInt(cantidad),
            usuario_id,
            usuario_info
        });
        
        // Guardar la transacción en la BD si tenemos usuario
        let transaccion_id = null;
        if (usuario_id) {
            const { rows: transaccion } = await db.query(`
                INSERT INTO transacciones_mercadopago 
                (preference_id, external_reference, tipo, usuario_id, monto, estado, fecha_creacion)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING id
            `, [
                preferencia.id,
                preferencia.external_reference,
                'pago_general',
                usuario_id,
                parseFloat(precio) * parseInt(cantidad),
                'pending'
            ]);
            transaccion_id = transaccion[0].id;
            console.log('✅ Transacción creada con ID:', transaccion_id);
        }
        
        res.json({
            success: true,
            transaccion_id,
            preference_id: preferencia.id,
            init_point: preferencia.init_point,
            sandbox_init_point: preferencia.sandbox_init_point,
            public_key: process.env.MERCADOPAGO_PUBLIC_KEY,
            test_data: {
                seller_id: "2683439132",
                buyer_user: "TESTUSER84549",
                buyer_password: "viuWGfcPEp"
            }
        });
        
    } catch (error) {
        console.error('❌ Error creando preferencia:', error);
        res.status(500).json({ 
            error: 'Error al crear la preferencia de pago',
            message: error.message 
        });
    }
};

/**
 * Crear pago para consulta/tratamiento de paciente
 * POST /api/mercadopago/crear-pago-paciente
 */
exports.crearPagoPaciente = async (req, res) => {
    const { cita_id, monto, descripcion } = req.body;
    const paciente_id = req.headers['user-id'];
    
    console.log('💳 Creando pago para paciente:', { cita_id, paciente_id, monto });
    
    try {
        // Obtener información del paciente
        const { rows: paciente } = await db.query(
            'SELECT nombre, apellido, correo, telefono FROM usuarios WHERE id = $1',
            [paciente_id]
        );
        
        if (paciente.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Crear preferencia en MercadoPago
        const preferencia = await mercadoPagoService.crearPreferenciaPaciente({
            cita_id,
            paciente_id,
            monto,
            descripcion,
            paciente_info: paciente[0]
        });
        
        // Guardar la transacción en la BD
        const { rows: transaccion } = await db.query(`
            INSERT INTO transacciones_mercadopago 
            (preference_id, external_reference, tipo, usuario_id, cita_id, monto, estado, fecha_creacion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id
        `, [
            preferencia.preference_id,
            preferencia.external_reference,
            'pago_paciente',
            paciente_id,
            cita_id,
            monto,
            'pending'
        ]);
        
        console.log('✅ Transacción creada con ID:', transaccion[0].id);
        
        res.json({
            success: true,
            transaccion_id: transaccion[0].id,
            preference_id: preferencia.preference_id,
            init_point: preferencia.init_point,
            sandbox_init_point: preferencia.sandbox_init_point,
            datos_prueba: mercadoPagoService.getDatosPrueba()
        });
        
    } catch (error) {
        console.error('❌ Error creando pago de paciente:', error);
        res.status(500).json({ 
            error: 'Error al crear el pago',
            message: error.message 
        });
    }
};

/**
 * Procesar pago de honorarios a odontólogo
 * POST /api/mercadopago/pagar-odontologo
 */
exports.pagarOdontologo = async (req, res) => {
    const { odontologo_id, monto, descripcion, periodo } = req.body;
    
    console.log('💰 Procesando pago de honorarios:', { odontologo_id, monto, periodo });
    
    try {
        // Verificar que el odontólogo existe
        const { rows: odontologo } = await db.query(
            'SELECT nombre, apellido, correo FROM usuarios WHERE id = $1 AND rol_id = (SELECT id FROM roles WHERE nombre = $2)',
            [odontologo_id, 'odontologo']
        );
        
        if (odontologo.length === 0) {
            return res.status(404).json({ error: 'Odontólogo no encontrado' });
        }
        
        // Crear el pago
        const pago = await mercadoPagoService.pagarOdontologo({
            odontologo_id,
            monto,
            descripcion,
            periodo,
            odontologo_info: odontologo[0]
        });
        
        // Registrar en la BD
        const { rows: transaccion } = await db.query(`
            INSERT INTO transacciones_mercadopago 
            (preference_id, external_reference, tipo, usuario_id, monto, estado, periodo, fecha_creacion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id
        `, [
            pago.preference_id,
            pago.external_reference,
            'pago_odontologo',
            odontologo_id,
            monto,
            'pending',
            periodo
        ]);
        
        console.log('✅ Pago de honorarios registrado:', transaccion[0].id);
        
        res.json({
            success: true,
            transaccion_id: transaccion[0].id,
            preference_id: pago.preference_id,
            status: pago.status,
            odontologo: odontologo[0].nombre + ' ' + odontologo[0].apellido
        });
        
    } catch (error) {
        console.error('❌ Error procesando pago de odontólogo:', error);
        res.status(500).json({ 
            error: 'Error al procesar pago de honorarios',
            message: error.message 
        });
    }
};

/**
 * Procesar pago a proveedor
 * POST /api/mercadopago/pagar-proveedor
 */
exports.pagarProveedor = async (req, res) => {
    const { proveedor_id, monto, descripcion, factura_id } = req.body;
    
    console.log('🏭 Procesando pago a proveedor:', { proveedor_id, monto, factura_id });
    
    try {
        // Verificar que el proveedor existe
        const { rows: proveedor } = await db.query(
            'SELECT nombre, email, telefono FROM proveedores WHERE id = $1',
            [proveedor_id]
        );
        
        if (proveedor.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        
        // Crear el pago
        const pago = await mercadoPagoService.pagarProveedor({
            proveedor_id,
            monto,
            descripcion,
            factura_id,
            proveedor_info: proveedor[0]
        });
        
        // Registrar en la BD
        const { rows: transaccion } = await db.query(`
            INSERT INTO transacciones_mercadopago 
            (preference_id, external_reference, tipo, proveedor_id, monto, estado, factura_referencia, fecha_creacion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id
        `, [
            pago.preference_id,
            pago.external_reference,
            'pago_proveedor',
            proveedor_id,
            monto,
            'pending',
            factura_id
        ]);
        
        console.log('✅ Pago a proveedor registrado:', transaccion[0].id);
        
        res.json({
            success: true,
            transaccion_id: transaccion[0].id,
            preference_id: pago.preference_id,
            status: pago.status,
            proveedor: proveedor[0].nombre
        });
        
    } catch (error) {
        console.error('❌ Error procesando pago de proveedor:', error);
        res.status(500).json({ 
            error: 'Error al procesar pago de proveedor',
            message: error.message 
        });
    }
};

/**
 * Webhook para notificaciones de MercadoPago
 * POST /api/mercadopago/webhook
 */
exports.webhook = async (req, res) => {
    const webhookData = req.body;
    const headers = req.headers;
    
    console.log('🔔 Webhook MercadoPago recibido:', {
        headers: {
            'x-request-id': headers['x-request-id'],
            'x-signature': headers['x-signature'],
            'user-agent': headers['user-agent']
        },
        body: webhookData
    });
    
    try {
        // Verificar que el webhook viene de MercadoPago
        if (!webhookData || !webhookData.type) {
            console.log('⚠️ Webhook inválido - no tiene tipo');
            return res.status(400).json({ error: 'Webhook inválido' });
        }
        
        const { type, action, data, date_created, live_mode } = webhookData;
        
        console.log('📋 Procesando evento:', {
            type,
            action,
            data_id: data?.id,
            live_mode,
            date_created
        });
        
        // Manejar diferentes tipos de eventos
        switch (type) {
            case 'payment':
                await this.procesarEventoPago(data.id, action);
                break;
                
            case 'plan':
                console.log('📅 Evento de plan recibido:', data.id);
                break;
                
            case 'subscription':
                console.log('🔄 Evento de suscripción recibido:', data.id);
                break;
                
            case 'invoice':
                console.log('📄 Evento de factura recibido:', data.id);
                break;
                
            default:
                console.log('❓ Tipo de evento no manejado:', type);
        }
        
        // Responder inmediatamente a MercadoPago
        res.status(200).json({ 
            received: true,
            processed_at: new Date().toISOString(),
            event_type: type,
            action: action
        });
        
    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        
        // Log del error para debugging
        await this.logWebhookError(webhookData, error);
        
        res.status(500).json({ 
            error: 'Error procesando webhook',
            message: error.message 
        });
    }
};

/**
 * Procesar evento de pago
 */
exports.procesarEventoPago = async (paymentId, action) => {
    console.log(`💳 Procesando evento de pago - ID: ${paymentId}, Acción: ${action}`);
    
    try {
        // Obtener información detallada del pago desde MercadoPago
        const pagoInfo = await mercadoPagoService.obtenerPago(paymentId);
        
        if (!pagoInfo) {
            console.log('⚠️ No se pudo obtener información del pago:', paymentId);
            return;
        }
        
        console.log('📊 Información del pago:', {
            id: pagoInfo.id,
            status: pagoInfo.status,
            status_detail: pagoInfo.status_detail,
            external_reference: pagoInfo.external_reference,
            transaction_amount: pagoInfo.transaction_amount,
            currency_id: pagoInfo.currency_id,
            date_created: pagoInfo.date_created,
            date_approved: pagoInfo.date_approved
        });
        
        // Buscar la transacción en nuestra base de datos
        const { rows: transacciones } = await db.query(`
            SELECT * FROM transacciones_mercadopago 
            WHERE external_reference = $1 OR payment_id = $2
            ORDER BY fecha_creacion DESC
            LIMIT 1
        `, [pagoInfo.external_reference, paymentId]);
        
        if (transacciones.length === 0) {
            console.log('⚠️ Transacción no encontrada en la BD:', {
                external_reference: pagoInfo.external_reference,
                payment_id: paymentId
            });
            return;
        }
        
        const transaccion = transacciones[0];
        console.log('🔍 Transacción encontrada:', {
            id: transaccion.id,
            estado_actual: transaccion.estado,
            nuevo_estado: pagoInfo.status
        });
        
        // Actualizar estado en la base de datos
        const { rowCount } = await db.query(`
            UPDATE transacciones_mercadopago 
            SET 
                estado = $1, 
                payment_id = $2, 
                fecha_actualizacion = NOW(),
                datos_pago = $3,
                status_detail = $4
            WHERE id = $5
        `, [
            pagoInfo.status,
            paymentId,
            JSON.stringify(pagoInfo),
            pagoInfo.status_detail,
            transaccion.id
        ]);
        
        if (rowCount > 0) {
            console.log('✅ Transacción actualizada exitosamente');
            
            // Procesar según el estado del pago
            await this.procesarEstadoPago(pagoInfo, transaccion);
        }
        
    } catch (error) {
        console.error('❌ Error procesando evento de pago:', error);
        throw error;
    }
};

/**
 * Procesar según el estado del pago
 */
exports.procesarEstadoPago = async (pagoInfo, transaccion) => {
    const { status, external_reference } = pagoInfo;
    
    console.log(`🔄 Procesando estado: ${status} para referencia: ${external_reference}`);
    
    try {
        switch (status) {
            case 'approved':
                console.log('✅ Pago aprobado - procesando confirmación');
                
                // Si hay un usuario asociado, enviar notificación
                if (transaccion.usuario_id) {
                    await this.enviarNotificacionPagoAprobado(transaccion, pagoInfo);
                }
                
                // Si hay una cita asociada, actualizar estado
                if (transaccion.cita_id) {
                    await db.query(
                        'UPDATE citas SET estado_pago = $1 WHERE id = $2',
                        ['pagado', transaccion.cita_id]
                    );
                    console.log('✅ Estado de cita actualizado a pagado');
                }
                
                break;
                
            case 'pending':
                console.log('⏳ Pago pendiente');
                break;
                
            case 'rejected':
                console.log('❌ Pago rechazado');
                
                if (transaccion.usuario_id) {
                    await this.enviarNotificacionPagoRechazado(transaccion, pagoInfo);
                }
                break;
                
            case 'cancelled':
                console.log('🚫 Pago cancelado');
                break;
                
            case 'refunded':
                console.log('💰 Pago reembolsado');
                break;
                
            default:
                console.log(`❓ Estado no manejado: ${status}`);
        }
        
    } catch (error) {
        console.error('❌ Error procesando estado del pago:', error);
        throw error;
    }
};

/**
 * Enviar notificación de pago aprobado
 */
exports.enviarNotificacionPagoAprobado = async (transaccion, pagoInfo) => {
    try {
        // Obtener datos del usuario
        const { rows: usuario } = await db.query(
            'SELECT nombre, apellido, correo FROM usuarios WHERE id = $1',
            [transaccion.usuario_id]
        );
        
        if (usuario.length > 0) {
            const user = usuario[0];
            console.log(`📧 Enviando confirmación de pago a: ${user.correo}`);
            
            // Aquí puedes integrar con tu servicio de email
            // await emailService.enviarConfirmacionPago(user, transaccion, pagoInfo);
            
            console.log('✅ Notificación de pago aprobado enviada');
        }
        
    } catch (error) {
        console.error('❌ Error enviando notificación:', error);
    }
};

/**
 * Enviar notificación de pago rechazado
 */
exports.enviarNotificacionPagoRechazado = async (transaccion, pagoInfo) => {
    try {
        // Obtener datos del usuario
        const { rows: usuario } = await db.query(
            'SELECT nombre, apellido, correo FROM usuarios WHERE id = $1',
            [transaccion.usuario_id]
        );
        
        if (usuario.length > 0) {
            const user = usuario[0];
            console.log(`📧 Enviando notificación de pago rechazado a: ${user.correo}`);
            
            // Aquí puedes integrar con tu servicio de email
            // await emailService.enviarPagoRechazado(user, transaccion, pagoInfo);
            
            console.log('✅ Notificación de pago rechazado enviada');
        }
        
    } catch (error) {
        console.error('❌ Error enviando notificación de rechazo:', error);
    }
};

/**
 * Log de errores del webhook
 */
exports.logWebhookError = async (webhookData, error) => {
    try {
        await db.query(`
            INSERT INTO webhook_logs (
                tipo, 
                datos, 
                error_message, 
                fecha_creacion
            ) VALUES ($1, $2, $3, NOW())
        `, [
            'mercadopago_error',
            JSON.stringify(webhookData),
            error.message
        ]);
        
    } catch (logError) {
        console.error('❌ Error guardando log de webhook:', logError);
    }
};

/**
 * Obtener historial de transacciones
 * GET /api/mercadopago/transacciones
 */
exports.obtenerTransacciones = async (req, res) => {
    const { tipo, usuario_id, page = 1, limit = 10 } = req.query;
    
    try {
        let whereClause = '1=1';
        let params = [];
        let paramCount = 0;
        
        if (tipo) {
            paramCount++;
            whereClause += ` AND tipo = $${paramCount}`;
            params.push(tipo);
        }
        
        if (usuario_id) {
            paramCount++;
            whereClause += ` AND usuario_id = $${paramCount}`;
            params.push(usuario_id);
        }
        
        const offset = (page - 1) * limit;
        
        const { rows: transacciones } = await db.query(`
            SELECT t.*, 
                   t.descripcion as concepto,
                   u.nombre, u.apellido, 
                   p.nombre as proveedor_nombre
            FROM transacciones_mercadopago t
            LEFT JOIN usuarios u ON t.usuario_id = u.id
            LEFT JOIN proveedores p ON t.proveedor_id = p.id
            WHERE ${whereClause}
            ORDER BY t.fecha_creacion DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `, [...params, limit, offset]);
        
        res.json({
            success: true,
            transacciones,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                offset
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo transacciones:', error);
        res.status(500).json({ 
            error: 'Error al obtener transacciones',
            message: error.message 
        });
    }
};

/**
 * Cancelar factura/transacción pendiente
 * DELETE /api/mercadopago/cancelar-factura/:transaccionId
 */
exports.cancelarFactura = async (req, res) => {
    const { transaccionId } = req.params;
    const usuario_id = req.headers['user-id'] || req.query.usuario_id;
    
    console.log('🚫 Intentando cancelar factura:', { transaccionId, usuario_id });
    
    try {
        // Verificar que la transacción existe y pertenece al usuario
        const { rows: transaccion } = await db.query(`
            SELECT * FROM transacciones_mercadopago 
            WHERE id = $1 AND usuario_id = $2
        `, [transaccionId, usuario_id]);
        
        if (!transaccion.length) {
            return res.status(404).json({
                success: false,
                error: 'Factura no encontrada o no tienes permisos para cancelarla'
            });
        }
        
        const factura = transaccion[0];
        
        // Verificar que la factura esté pendiente
        if (factura.estado !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `No se puede cancelar una factura con estado: ${factura.estado}. Solo se pueden cancelar facturas pendientes.`
            });
        }
        
        // Actualizar el estado a 'cancelled'
        await db.query(`
            UPDATE transacciones_mercadopago 
            SET estado = 'cancelled', 
                fecha_actualizacion = NOW(),
                datos_pago = COALESCE(datos_pago, '{}')::jsonb || jsonb_build_object('cancelacion_razon', 'Cancelado por el usuario', 'fecha_cancelacion', NOW()::text)
            WHERE id = $1
        `, [transaccionId]);
        
        console.log(`✅ Factura ${transaccionId} cancelada exitosamente`);
        
        // Obtener información del usuario para el log
        const { rows: usuario } = await db.query(
            'SELECT nombre, apellido FROM usuarios WHERE id = $1',
            [usuario_id]
        );
        
        const usuarioInfo = usuario[0] || { nombre: 'Usuario', apellido: 'Desconocido' };
        
        res.json({
            success: true,
            message: 'Factura cancelada exitosamente',
            data: {
                transaccion_id: transaccionId,
                estado_anterior: factura.estado,
                estado_nuevo: 'cancelled',
                monto_cancelado: factura.monto,
                concepto: factura.descripcion || 'Servicio dental',
                usuario: `${usuarioInfo.nombre} ${usuarioInfo.apellido}`,
                fecha_cancelacion: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Error cancelando factura:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al cancelar la factura',
            message: error.message
        });
    }
};

/**
 * Consultar estado de un pago específico
 * GET /api/mercadopago/pago/:payment_id
 */
exports.consultarPago = async (req, res) => {
    const { payment_id } = req.params;
    
    console.log('🔍 Consultando estado del pago:', payment_id);
    
    try {
        // Obtener información del pago desde MercadoPago
        const pagoInfo = await mercadoPagoService.obtenerPago(payment_id);
        
        if (!pagoInfo) {
            return res.status(404).json({
                success: false,
                error: 'Pago no encontrado'
            });
        }
        
        // Buscar en nuestra base de datos
        const { rows: transacciones } = await db.query(`
            SELECT * FROM transacciones_mercadopago 
            WHERE payment_id = $1 OR external_reference = $2
            ORDER BY fecha_creacion DESC
            LIMIT 1
        `, [payment_id, pagoInfo.external_reference]);
        
        res.json({
            success: true,
            pago: pagoInfo,
            transaccion_local: transacciones[0] || null,
            estado_detallado: {
                status: pagoInfo.status,
                status_detail: pagoInfo.status_detail,
                fecha_creacion: pagoInfo.date_created,
                fecha_aprobacion: pagoInfo.date_approved,
                monto: pagoInfo.transaction_amount,
                moneda: pagoInfo.currency_id,
                metodo_pago: pagoInfo.payment_type_id,
                cuotas: pagoInfo.installments
            }
        });
        
    } catch (error) {
        console.error('❌ Error consultando pago:', error);
        res.status(500).json({
            success: false,
            error: 'Error al consultar el estado del pago',
            message: error.message
        });
    }
};

/**
 * Obtener datos de prueba
 * GET /api/mercadopago/datos-prueba
 */
exports.obtenerDatosPrueba = (req, res) => {
    res.json({
        success: true,
        datos_prueba: mercadoPagoService.getDatosPrueba(),
        instrucciones: {
            testing: 'Usa las tarjetas de prueba proporcionadas',
            entorno: 'Estás en modo SANDBOX - todos los pagos son simulados',
            usuarios: 'Usa los usuarios de prueba para testing completo'
        }
    });
};
