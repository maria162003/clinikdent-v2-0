/**
 * Controlador para manejar webhooks de BotSailor (WhatsApp)
 * Integra contactos, citas y PQR con Supabase
 */

const { query } = require('../config/databaseSecure');
const supabase = require('../config/supabase');

/**
 * Registra nuevo contacto desde WhatsApp
 * Endpoint: POST /api/whatsapp/nuevo-contacto
 */
exports.registrarNuevoContacto = async (req, res) => {
    try {
        const { telefono, nombre, mensaje_inicial, plataforma } = req.body;

        // Validar datos básicos
        if (!telefono) {
            return res.status(400).json({
                success: false,
                error: 'El teléfono es obligatorio'
            });
        }

        // Verificar si el contacto ya existe
        const existeContacto = await query(
            'SELECT id FROM contactos_whatsapp WHERE telefono = $1',
            [telefono]
        );

        if (existeContacto.rows.length > 0) {
            // Actualizar última interacción
            await query(
                `UPDATE contactos_whatsapp 
                 SET ultima_interaccion = NOW(), 
                     contador_mensajes = contador_mensajes + 1
                 WHERE telefono = $1`,
                [telefono]
            );

            return res.json({
                success: true,
                message: 'Contacto existente actualizado',
                contacto_id: existeContacto.rows[0].id
            });
        }

        // Insertar nuevo contacto
        const nuevoContacto = await query(
            `INSERT INTO contactos_whatsapp 
             (telefono, nombre, mensaje_inicial, plataforma, primera_interaccion, ultima_interaccion)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING id, telefono, nombre`,
            [telefono, nombre || 'Sin nombre', mensaje_inicial || '', plataforma || 'whatsapp']
        );

        res.status(201).json({
            success: true,
            message: 'Nuevo contacto registrado',
            contacto: nuevoContacto.rows[0]
        });

    } catch (error) {
        console.error('Error en registrarNuevoContacto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar contacto',
            details: error.message
        });
    }
};

/**
 * Registra paciente completo desde WhatsApp
 * Endpoint: POST /api/whatsapp/registrar-paciente
 */
exports.registrarPacienteCompleto = async (req, res) => {
    try {
        const { 
            nombre, 
            cedula, 
            telefono, 
            email, 
            fecha_nacimiento,
            direccion 
        } = req.body;

        // Validaciones
        if (!nombre || !cedula || !telefono) {
            return res.status(400).json({
                success: false,
                error: 'Nombre, cédula y teléfono son obligatorios'
            });
        }

        // Verificar si ya existe por cédula
        const existePaciente = await query(
            'SELECT id FROM pacientes WHERE cedula = $1',
            [cedula]
        );

        if (existePaciente.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Ya existe un paciente con esa cédula',
                paciente_id: existePaciente.rows[0].id
            });
        }

        // Insertar nuevo paciente
        const nuevoPaciente = await query(
            `INSERT INTO pacientes 
             (nombre, cedula, telefono, email, fecha_nacimiento, direccion, origen_registro)
             VALUES ($1, $2, $3, $4, $5, $6, 'whatsapp_bot')
             RETURNING id, nombre, cedula, telefono, email`,
            [nombre, cedula, telefono, email, fecha_nacimiento, direccion]
        );

        // Registrar en contactos_whatsapp si no existe
        await query(
            `INSERT INTO contactos_whatsapp (telefono, nombre, paciente_id, primera_interaccion, ultima_interaccion)
             VALUES ($1, $2, $3, NOW(), NOW())
             ON CONFLICT (telefono) DO UPDATE 
             SET paciente_id = $3, nombre = $2, ultima_interaccion = NOW()`,
            [telefono, nombre, nuevoPaciente.rows[0].id]
        );

        res.status(201).json({
            success: true,
            message: 'Paciente registrado exitosamente',
            paciente: nuevoPaciente.rows[0]
        });

    } catch (error) {
        console.error('Error en registrarPacienteCompleto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar paciente',
            details: error.message
        });
    }
};

/**
 * Agenda cita desde WhatsApp
 * Endpoint: POST /api/whatsapp/agendar-cita
 */
exports.agendarCita = async (req, res) => {
    try {
        const {
            cedula,
            telefono,
            servicio,
            fecha,
            hora,
            nombre_paciente
        } = req.body;

        // Validaciones
        if (!servicio || !fecha || !hora) {
            return res.status(400).json({
                success: false,
                error: 'Servicio, fecha y hora son obligatorios'
            });
        }

        // Buscar paciente por cédula o teléfono
        let pacienteId = null;
        
        if (cedula) {
            const pacientePorCedula = await query(
                'SELECT id FROM pacientes WHERE cedula = $1',
                [cedula]
            );
            if (pacientePorCedula.rows.length > 0) {
                pacienteId = pacientePorCedula.rows[0].id;
            }
        }

        if (!pacienteId && telefono) {
            const contacto = await query(
                'SELECT paciente_id FROM contactos_whatsapp WHERE telefono = $1',
                [telefono]
            );
            if (contacto.rows.length > 0 && contacto.rows[0].paciente_id) {
                pacienteId = contacto.rows[0].paciente_id;
            }
        }

        // Si no existe paciente, crear uno temporal
        if (!pacienteId) {
            const pacienteTemp = await query(
                `INSERT INTO pacientes 
                 (nombre, telefono, cedula, origen_registro, estado)
                 VALUES ($1, $2, $3, 'whatsapp_bot', 'temporal')
                 RETURNING id`,
                [nombre_paciente || 'Paciente WhatsApp', telefono, cedula || `TEMP-${Date.now()}`]
            );
            pacienteId = pacienteTemp.rows[0].id;
        }

        // Insertar cita
        const nuevaCita = await query(
            `INSERT INTO citas 
             (paciente_id, servicio, fecha, hora, estado, origen, notas)
             VALUES ($1, $2, $3, $4, 'pendiente', 'whatsapp_bot', 'Cita agendada via WhatsApp')
             RETURNING id, paciente_id, servicio, fecha, hora, estado`,
            [pacienteId, servicio, fecha, hora]
        );

        res.status(201).json({
            success: true,
            message: 'Cita agendada exitosamente',
            cita: nuevaCita.rows[0]
        });

    } catch (error) {
        console.error('Error en agendarCita:', error);
        res.status(500).json({
            success: false,
            error: 'Error al agendar cita',
            details: error.message
        });
    }
};

/**
 * Consulta citas del paciente
 * Endpoint: POST /api/whatsapp/consultar-citas
 */
exports.consultarCitas = async (req, res) => {
    try {
        const { cedula, telefono } = req.body;

        if (!cedula && !telefono) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere cédula o teléfono'
            });
        }

        // Buscar paciente
        let pacienteId = null;

        if (cedula) {
            const paciente = await query(
                'SELECT id FROM pacientes WHERE cedula = $1',
                [cedula]
            );
            if (paciente.rows.length > 0) {
                pacienteId = paciente.rows[0].id;
            }
        }

        if (!pacienteId && telefono) {
            const contacto = await query(
                'SELECT paciente_id FROM contactos_whatsapp WHERE telefono = $1',
                [telefono]
            );
            if (contacto.rows.length > 0) {
                pacienteId = contacto.rows[0].paciente_id;
            }
        }

        if (!pacienteId) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró paciente registrado'
            });
        }

        // Consultar citas pendientes y próximas
        const citas = await query(
            `SELECT id, servicio, fecha, hora, estado, notas
             FROM citas 
             WHERE paciente_id = $1 
             AND fecha >= CURRENT_DATE
             ORDER BY fecha ASC, hora ASC
             LIMIT 5`,
            [pacienteId]
        );

        res.json({
            success: true,
            citas: citas.rows,
            total: citas.rows.length
        });

    } catch (error) {
        console.error('Error en consultarCitas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al consultar citas',
            details: error.message
        });
    }
};

/**
 * Registra PQR/Soporte desde WhatsApp
 * Endpoint: POST /api/whatsapp/pqr
 */
exports.registrarPQR = async (req, res) => {
    try {
        const { telefono, nombre, mensaje, tipo } = req.body;

        if (!telefono || !mensaje) {
            return res.status(400).json({
                success: false,
                error: 'Teléfono y mensaje son obligatorios'
            });
        }

        // Registrar en tabla de soporte/pqr
        const pqr = await query(
            `INSERT INTO pqr_soporte 
             (telefono, nombre, mensaje, tipo, canal, estado, fecha_creacion)
             VALUES ($1, $2, $3, $4, 'whatsapp', 'pendiente', NOW())
             RETURNING id, telefono, tipo, estado`,
            [telefono, nombre || 'Sin nombre', mensaje, tipo || 'consulta']
        );

        res.status(201).json({
            success: true,
            message: 'Solicitud registrada. Un asesor te contactará pronto.',
            pqr: pqr.rows[0]
        });

    } catch (error) {
        console.error('Error en registrarPQR:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar solicitud',
            details: error.message
        });
    }
};
