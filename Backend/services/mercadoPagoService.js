const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

class MercadoPagoService {
    constructor() {
        // Configurar MercadoPago con credenciales reales de Colombia
        this.client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
            options: {
                timeout: 5000
            }
        });

        this.preference = new Preference(this.client);
        this.payment = new Payment(this.client);
        
        console.log('💳 MercadoPago configurado para Colombia:', {
            sandbox: process.env.MERCADOPAGO_SANDBOX === 'true',
            baseURL: process.env.MERCADOPAGO_BASE_URL,
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ? 'Configurado ✅' : 'No configurado ❌'
        });
    }

    /**
     * Crear preferencia de pago básica
     * @param {Object} data - Datos de la preferencia
     * @returns {Promise<Object>} - Preferencia creada
     */
    async crearPreferencia(data) {
        const { titulo, descripcion, precio, cantidad, usuario_id, usuario_info } = data;
        
        try {
            const preferenceData = {
                items: [
                    {
                        id: `item_${Date.now()}`,
                        title: titulo,
                        description: descripcion,
                        quantity: cantidad,
                        unit_price: precio,
                        currency_id: 'COP'
                    }
                ],
                external_reference: `clinikdent_${usuario_id || 'guest'}_${Date.now()}`,
                notification_url: `${process.env.FRONTEND_URL}/api/mercadopago/webhook`,
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/pagos/exito.html`,
                    failure: `${process.env.FRONTEND_URL}/pagos/error.html`,
                    pending: `${process.env.FRONTEND_URL}/pagos/pendiente.html`
                },
                statement_descriptor: 'CLINIKDENT',
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
            };

            // Agregar información del pagador si está disponible
            if (usuario_info) {
                preferenceData.payer = {
                    name: usuario_info.nombre,
                    surname: usuario_info.apellido,
                    email: usuario_info.correo,
                    phone: {
                        number: usuario_info.telefono || '3001234567'
                    }
                };
            }

            console.log('🔄 Creando preferencia:', preferenceData);
            const response = await this.preference.create({ body: preferenceData });
            
            console.log('✅ Preferencia creada exitosamente:', {
                id: response.id,
                init_point: response.init_point
            });
            
            return response;
            
        } catch (error) {
            console.error('❌ Error creando preferencia:', {
                message: error.message,
                cause: error.cause,
                stack: error.stack?.substring(0, 200)
            });
            
            // Mejorar el mensaje de error según el tipo
            let errorMessage = 'Error al crear preferencia';
            if (error.message?.includes('access_token')) {
                errorMessage = 'Error de autenticación con MercadoPago';
            } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
                errorMessage = 'Error de conexión con MercadoPago';
            } else if (error.message?.includes('validation')) {
                errorMessage = 'Datos inválidos para crear la preferencia';
            }
            
            throw new Error(`${errorMessage}: ${error.message}`);
        }
    }

    /**
     * Crear preferencia de pago para pacientes
     * @param {Object} orderData - Datos de la orden
     * @returns {Promise<Object>} - Preferencia creada
     */
    async crearPreferenciaPaciente(orderData) {
        const { cita_id, paciente_id, monto, descripcion, paciente_info } = orderData;
        
        try {
            const preferenceData = {
                items: [
                    {
                        id: `cita_${cita_id}`,
                        title: `Consulta Odontológica - ${descripcion}`,
                        quantity: 1,
                        unit_price: parseFloat(monto),
                        currency_id: 'COP'
                    }
                ],
                payer: {
                    name: paciente_info.nombre,
                    surname: paciente_info.apellido,
                    email: paciente_info.correo,
                    phone: {
                        number: paciente_info.telefono || '3001234567'
                    }
                },
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/pagos/exito.html`,
                    failure: `${process.env.FRONTEND_URL}/pagos/error.html`,
                    pending: `${process.env.FRONTEND_URL}/pagos/pendiente.html`
                },
                auto_return: 'approved',
                external_reference: `CLINIK_CITA_${cita_id}_PAC_${paciente_id}`,
                notification_url: `${process.env.FRONTEND_URL}/api/mercadopago/webhook`,
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
            };

            const result = await this.preference.create({ body: preferenceData });
            
            console.log('✅ Preferencia de pago creada para paciente:', {
                id: result.id,
                cita_id,
                monto,
                external_reference: preferenceData.external_reference
            });

            return {
                preference_id: result.id,
                init_point: result.init_point,
                sandbox_init_point: result.sandbox_init_point,
                external_reference: preferenceData.external_reference
            };
        } catch (error) {
            console.error('❌ Error creando preferencia de pago:', error);
            throw new Error('Error al crear preferencia de pago');
        }
    }

    /**
     * Crear pago directo para odontólogos (honorarios)
     * @param {Object} paymentData - Datos del pago
     * @returns {Promise<Object>} - Pago creado
     */
    async pagarOdontologo(paymentData) {
        const { odontologo_id, monto, descripcion, periodo, odontologo_info } = paymentData;
        
        try {
            // En un escenario real, esto sería una transferencia bancaria
            // Por ahora creamos una preferencia para simular el pago
            const preferenceData = {
                items: [
                    {
                        id: `honorarios_${odontologo_id}_${periodo}`,
                        title: `Honorarios Odontólogo - ${descripcion}`,
                        quantity: 1,
                        unit_price: parseFloat(monto),
                        currency_id: 'COP'
                    }
                ],
                payer: {
                    name: 'Clinikdent',
                    surname: 'Administración',
                    email: 'admin@clinikdent.com'
                },
                external_reference: `CLINIK_HON_${odontologo_id}_${periodo}`,
                notification_url: `${process.env.FRONTEND_URL}/api/mercadopago/webhook-honorarios`
            };

            const result = await this.preference.create({ body: preferenceData });
            
            console.log('✅ Pago de honorarios creado para odontólogo:', {
                odontologo_id,
                monto,
                periodo
            });

            return {
                preference_id: result.id,
                external_reference: preferenceData.external_reference,
                status: 'pending'
            };
        } catch (error) {
            console.error('❌ Error procesando pago de odontólogo:', error);
            throw new Error('Error al procesar pago de honorarios');
        }
    }

    /**
     * Crear pago para proveedores
     * @param {Object} paymentData - Datos del pago
     * @returns {Promise<Object>} - Pago creado
     */
    async pagarProveedor(paymentData) {
        const { proveedor_id, monto, descripcion, factura_id, proveedor_info } = paymentData;
        
        try {
            const preferenceData = {
                items: [
                    {
                        id: `proveedor_${proveedor_id}_${factura_id}`,
                        title: `Pago a Proveedor - ${descripcion}`,
                        quantity: 1,
                        unit_price: parseFloat(monto),
                        currency_id: 'COP'
                    }
                ],
                payer: {
                    name: 'Clinikdent',
                    surname: 'Administración',
                    email: 'admin@clinikdent.com'
                },
                external_reference: `CLINIK_PROV_${proveedor_id}_${factura_id}`,
                notification_url: `${process.env.FRONTEND_URL}/api/mercadopago/webhook-proveedores`
            };

            const result = await this.preference.create({ body: preferenceData });
            
            console.log('✅ Pago a proveedor creado:', {
                proveedor_id,
                monto,
                factura_id
            });

            return {
                preference_id: result.id,
                external_reference: preferenceData.external_reference,
                status: 'pending'
            };
        } catch (error) {
            console.error('❌ Error procesando pago de proveedor:', error);
            throw new Error('Error al procesar pago de proveedor');
        }
    }

    /**
     * Obtener información de un pago
     * @param {string} payment_id - ID del pago
     * @returns {Promise<Object>} - Información del pago
     */
    async obtenerPago(payment_id) {
        try {
            const payment = await this.payment.get({ id: payment_id });
            
            return {
                id: payment.id,
                status: payment.status,
                amount: payment.transaction_amount,
                currency: payment.currency_id,
                external_reference: payment.external_reference,
                date_created: payment.date_created,
                date_approved: payment.date_approved,
                payer: payment.payer
            };
        } catch (error) {
            console.error('❌ Error obteniendo información del pago:', error);
            throw new Error('Error al obtener información del pago');
        }
    }

    /**
     * Datos de prueba para testing
     */
    getDatosPrueba() {
        return {
            tarjetas_aprobadas: {
                visa: '4509953566233704',
                mastercard: '5031755734530604',
                amex: '371180303257522'
            },
            tarjetas_rechazadas: {
                insufficient_funds: '4013540682746260',
                invalid_card: '4509953566233705'
            },
            usuarios_prueba: {
                comprador: {
                    email: 'test_user_123456@testuser.com',
                    password: 'qatest123'
                },
                vendedor: {
                    email: 'test_user_123457@testuser.com', 
                    password: 'qatest123'
                }
            }
        };
    }

    /**
     * Obtener información de un pago por ID
     * @param {string} paymentId - ID del pago
     * @returns {Promise<Object>} - Información del pago
     */
    async obtenerPago(paymentId) {
        try {
            console.log('🔍 Obteniendo información del pago:', paymentId);
            
            const response = await this.payment.get({ id: paymentId });
            
            console.log('✅ Información del pago obtenida:', {
                id: response.id,
                status: response.status,
                external_reference: response.external_reference
            });
            
            return response;
            
        } catch (error) {
            console.error('❌ Error obteniendo pago:', error);
            throw new Error(`Error al obtener pago: ${error.message}`);
        }
    }

    /**
     * Obtener información de una preferencia por ID
     * @param {string} preferenceId - ID de la preferencia
     * @returns {Promise<Object>} - Información de la preferencia
     */
    async obtenerPreferencia(preferenceId) {
        try {
            console.log('🔍 Obteniendo información de la preferencia:', preferenceId);
            
            const response = await this.preference.get({ id: preferenceId });
            
            console.log('✅ Información de la preferencia obtenida:', {
                id: response.id,
                status: response.status
            });
            
            return response;
            
        } catch (error) {
            console.error('❌ Error obteniendo preferencia:', error);
            throw new Error(`Error al obtener preferencia: ${error.message}`);
        }
    }
}

module.exports = new MercadoPagoService();
