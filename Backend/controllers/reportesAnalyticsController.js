/**
 * Controlador de Reportes y Analytics Avanzados
 * Sistema completo de generación de reportes, dashboards y KPIs
 */

const pool = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

console.log('📊 Cargando reportesAnalyticsController...');

// ==========================================
// MÉTRICAS Y DASHBOARDS
// ==========================================

// Obtener métricas del dashboard principal
exports.obtenerMetricasDashboard = async (req, res) => {
    try {
        const { periodo = '30d', fecha_inicio, fecha_fin } = req.query;
        console.log('📊 Obteniendo métricas dashboard, período:', periodo);

        let fechaFiltro = '';
        if (fecha_inicio && fecha_fin) {
            fechaFiltro = `AND fecha BETWEEN '${fecha_inicio}' AND '${fecha_fin}'`;
        } else {
            const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90;
            fechaFiltro = `AND fecha >= DATE_SUB(CURDATE(), INTERVAL ${dias} DAY)`;
        }

        // Métricas resumen
        const [resumen] = await pool.query(`
            SELECT 
                tipo_metrica,
                AVG(valor) as promedio,
                MAX(valor) as maximo,
                MIN(valor) as minimo,
                COUNT(*) as registros,
                (SELECT valor FROM metricas_sistema m2 WHERE m2.tipo_metrica = ms.tipo_metrica ORDER BY fecha DESC LIMIT 1) as valor_actual
            FROM metricas_sistema ms 
            WHERE 1=1 ${fechaFiltro}
            GROUP BY tipo_metrica
        `);

        // Tendencias por día
        const [tendencias] = await pool.query(`
            SELECT 
                fecha,
                tipo_metrica,
                valor,
                metadata
            FROM metricas_sistema 
            WHERE 1=1 ${fechaFiltro}
            ORDER BY fecha DESC, tipo_metrica
        `);

        // KPIs calculados
        const kpis = await calcularKPIsPersonalizados(fechaFiltro);

        // Datos comparativos (período anterior)
        const diasComparacion = periodo === '7d' ? 14 : periodo === '30d' ? 60 : 180;
        const [comparativo] = await pool.query(`
            SELECT 
                tipo_metrica,
                AVG(valor) as promedio_anterior
            FROM metricas_sistema 
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL ${diasComparacion} DAY)
              AND fecha < DATE_SUB(CURDATE(), INTERVAL ${diasComparacion/2} DAY)
            GROUP BY tipo_metrica
        `);

        res.json({
            success: true,
            data: {
                resumen: resumen,
                tendencias: tendencias,
                kpis: kpis,
                comparativo: comparativo,
                periodo: periodo
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo métricas dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener métricas del dashboard'
        });
    }
};

// Calcular KPIs personalizados
async function calcularKPIsPersonalizados(fechaFiltro = '') {
    try {
        // Obtener KPIs configurados
        const [kpisConfig] = await pool.query(`
            SELECT id, nombre, formula, unidad, meta_minima, meta_maxima, color_config
            FROM kpis_personalizados 
            WHERE activo = TRUE
        `);

        const kpisCalculados = [];

        for (const kpi of kpisConfig) {
            try {
                const formula = JSON.parse(kpi.formula);
                let valor = 0;

                // Calcular según la fórmula específica
                switch (kpi.nombre) {
                    case 'Tasa de Ocupación Semanal':
                        const [ocupacion] = await pool.query(`
                            SELECT 
                                COUNT(CASE WHEN estado IN ('completada', 'programada') THEN 1 END) as citas_ocupadas,
                                (SELECT COUNT(*) * 5 * 8 FROM usuarios WHERE rol = 'odontologo' AND activo = TRUE) as capacidad_teorica
                            FROM citas 
                            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${fechaFiltro.replace('fecha', 'DATE(fecha)')}
                        `);
                        valor = ocupacion[0].capacidad_teorica > 0 ? 
                            (ocupacion[0].citas_ocupadas / ocupacion[0].capacidad_teorica) * 100 : 0;
                        break;

                    case 'Ingresos por Paciente Activo':
                        const [ingresosPaciente] = await pool.query(`
                            SELECT 
                                COALESCE(AVG(ms1.valor), 0) as ingresos_promedio,
                                COALESCE(AVG(ms2.valor), 1) as pacientes_promedio
                            FROM metricas_sistema ms1
                            LEFT JOIN metricas_sistema ms2 ON ms1.fecha = ms2.fecha AND ms2.tipo_metrica = 'pacientes_activos'
                            WHERE ms1.tipo_metrica = 'ingresos_diarios' 
                              AND ms1.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) ${fechaFiltro.replace('fecha', 'ms1.fecha')}
                        `);
                        valor = ingresosPaciente[0].pacientes_promedio > 0 ? 
                            ingresosPaciente[0].ingresos_promedio / ingresosPaciente[0].pacientes_promedio : 0;
                        break;

                    case 'Índice de Satisfacción General':
                        const [satisfaccion] = await pool.query(`
                            SELECT AVG(valor) as satisfaccion_promedio
                            FROM metricas_sistema 
                            WHERE tipo_metrica = 'satisfaccion_promedio'
                              AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) ${fechaFiltro}
                        `);
                        valor = satisfaccion[0].satisfaccion_promedio || 0;
                        break;

                    case 'Eficiencia de Tratamientos':
                        const [eficiencia] = await pool.query(`
                            SELECT 
                                COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados,
                                COUNT(*) as total
                            FROM tratamientos 
                            WHERE fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
                        `);
                        valor = eficiencia[0].total > 0 ? 
                            (eficiencia[0].completados / eficiencia[0].total) * 100 : 0;
                        break;
                }

                // Determinar estado según rangos de color
                const colorConfig = JSON.parse(kpi.color_config);
                let estado = 'neutral';
                let color = '#6c757d';

                for (const range of colorConfig.ranges) {
                    if (valor >= range.min && valor <= range.max) {
                        color = range.color;
                        if (range.color === '#28a745') estado = 'bueno';
                        else if (range.color === '#ffc107') estado = 'regular';
                        else if (range.color === '#dc3545') estado = 'malo';
                        break;
                    }
                }

                kpisCalculados.push({
                    id: kpi.id,
                    nombre: kpi.nombre,
                    valor: Math.round(valor * 100) / 100,
                    unidad: kpi.unidad,
                    meta_minima: kpi.meta_minima,
                    meta_maxima: kpi.meta_maxima,
                    estado: estado,
                    color: color
                });

            } catch (kpiError) {
                console.error(`❌ Error calculando KPI ${kpi.nombre}:`, kpiError);
            }
        }

        return kpisCalculados;

    } catch (error) {
        console.error('❌ Error calculando KPIs personalizados:', error);
        return [];
    }
}

// Obtener configuración de dashboard personalizado
exports.obtenerDashboardPersonalizado = async (req, res) => {
    try {
        const usuarioId = req.headers['user-id'];
        const { dashboardId } = req.params;

        let query = `
            SELECT id, nombre, configuracion, es_publico, created_at, updated_at
            FROM dashboards_personalizados 
            WHERE 1=1
        `;
        let params = [];

        if (dashboardId) {
            query += ` AND id = ?`;
            params.push(dashboardId);
        } else {
            query += ` AND (usuario_id = ? OR es_publico = TRUE)`;
            params.push(usuarioId);
        }

        query += ` ORDER BY created_at DESC`;

        const [dashboards] = await pool.query(query, params);

        if (dashboardId && dashboards.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dashboard no encontrado'
            });
        }

        // Obtener datos para cada widget del dashboard
        const dashboardsConDatos = await Promise.all(
            dashboards.map(async (dashboard) => {
                const config = JSON.parse(dashboard.configuracion);
                
                // Obtener datos para cada widget
                const widgetsConDatos = await Promise.all(
                    config.widgets.map(async (widget) => {
                        const datos = await obtenerDatosWidget(widget);
                        return { ...widget, datos };
                    })
                );

                return {
                    ...dashboard,
                    configuracion: {
                        ...config,
                        widgets: widgetsConDatos
                    }
                };
            })
        );

        res.json({
            success: true,
            data: dashboardId ? dashboardsConDatos[0] : dashboardsConDatos
        });

    } catch (error) {
        console.error('❌ Error obteniendo dashboard personalizado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener dashboard'
        });
    }
};

// Obtener datos específicos para un widget
async function obtenerDatosWidget(widget) {
    try {
        const { type, config } = widget;

        switch (type) {
            case 'metric_card':
                return await obtenerDatosMetricCard(config);
            case 'line_chart':
                return await obtenerDatosLineChart(config);
            case 'pie_chart':
                return await obtenerDatosPieChart(config);
            case 'bar_chart':
                return await obtenerDatosBarChart(config);
            case 'gauge_chart':
                return await obtenerDatosGaugeChart(config);
            default:
                return {};
        }
    } catch (error) {
        console.error(`❌ Error obteniendo datos widget ${widget.id}:`, error);
        return {};
    }
}

// Implementaciones específicas para tipos de widget
async function obtenerDatosMetricCard(config) {
    const { metric, period = '30d' } = config;
    
    const [resultado] = await pool.query(`
        SELECT 
            AVG(valor) as valor_actual,
            (SELECT AVG(valor) FROM metricas_sistema ms2 
             WHERE ms2.tipo_metrica = ms.tipo_metrica 
               AND ms2.fecha >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL ${period === '30d' ? 30 : 7} DAY), INTERVAL ${period === '30d' ? 30 : 7} DAY)
               AND ms2.fecha < DATE_SUB(CURDATE(), INTERVAL ${period === '30d' ? 30 : 7} DAY)
            ) as valor_anterior
        FROM metricas_sistema ms
        WHERE tipo_metrica = ? 
          AND fecha >= DATE_SUB(CURDATE(), INTERVAL ${period === '30d' ? 30 : 7} DAY)
    `, [metric === 'ingresos_mensuales' ? 'ingresos_diarios' : metric]);

    const actual = resultado[0]?.valor_actual || 0;
    const anterior = resultado[0]?.valor_anterior || actual;
    const cambio = anterior > 0 ? ((actual - anterior) / anterior) * 100 : 0;

    return {
        valor: actual,
        cambio: Math.round(cambio * 10) / 10,
        tendencia: cambio >= 0 ? 'up' : 'down'
    };
}

async function obtenerDatosLineChart(config) {
    const { metrics, period = '30d' } = config;
    const dias = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    const [datos] = await pool.query(`
        SELECT fecha, tipo_metrica, valor
        FROM metricas_sistema
        WHERE tipo_metrica IN (${metrics.map(() => '?').join(',')})
          AND fecha >= DATE_SUB(CURDATE(), INTERVAL ${dias} DAY)
        ORDER BY fecha ASC
    `, metrics);

    // Agrupar por métrica
    const series = {};
    metrics.forEach(metric => {
        series[metric] = datos
            .filter(d => d.tipo_metrica === metric)
            .map(d => ({
                x: d.fecha,
                y: d.valor
            }));
    });

    return { series };
}

async function obtenerDatosPieChart(config) {
    const { metric } = config;

    if (metric === 'citas_por_estado') {
        const [datos] = await pool.query(`
            SELECT 
                estado,
                COUNT(*) as cantidad
            FROM citas
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY estado
        `);

        return {
            series: datos.map(d => d.cantidad),
            labels: datos.map(d => d.estado)
        };
    }

    return { series: [], labels: [] };
}

async function obtenerDatosBarChart(config) {
    const { metric, limit = 5 } = config;

    if (metric === 'tratamientos_populares') {
        const [datos] = await pool.query(`
            SELECT 
                nombre,
                COUNT(*) as cantidad
            FROM tratamientos
            WHERE fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
            GROUP BY nombre
            ORDER BY cantidad DESC
            LIMIT ?
        `, [limit]);

        return {
            series: [{
                name: 'Tratamientos',
                data: datos.map(d => d.cantidad)
            }],
            categories: datos.map(d => d.nombre)
        };
    }

    return { series: [], categories: [] };
}

async function obtenerDatosGaugeChart(config) {
    const { metric, min = 0, max = 100 } = config;

    const [resultado] = await pool.query(`
        SELECT AVG(valor) as valor
        FROM metricas_sistema
        WHERE tipo_metrica = ?
          AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `, [metric]);

    return {
        value: resultado[0]?.valor || 0,
        min: min,
        max: max
    };
}

// ==========================================
// REPORTES PROGRAMADOS
// ==========================================

// Obtener reportes programados
exports.obtenerReportesProgramados = async (req, res) => {
    try {
        const usuarioId = req.headers['user-id'];
        console.log('📋 Obteniendo reportes programados para usuario:', usuarioId);

        const [reportes] = await pool.query(`
            SELECT 
                rp.*,
                u.nombre as creado_por_nombre,
                (SELECT COUNT(*) FROM historial_reportes hr WHERE hr.reporte_programado_id = rp.id) as total_ejecuciones,
                (SELECT estado FROM historial_reportes hr WHERE hr.reporte_programado_id = rp.id ORDER BY fecha_generacion DESC LIMIT 1) as ultimo_estado
            FROM reportes_programados rp
            LEFT JOIN usuarios u ON rp.created_by = u.id
            WHERE rp.created_by = ? OR ? IN (SELECT id FROM usuarios WHERE rol = 'admin')
            ORDER BY rp.proxima_ejecucion ASC
        `, [usuarioId, usuarioId]);

        res.json({
            success: true,
            data: reportes.map(reporte => ({
                ...reporte,
                parametros: JSON.parse(reporte.parametros),
                destinatarios: JSON.parse(reporte.destinatarios)
            }))
        });

    } catch (error) {
        console.error('❌ Error obteniendo reportes programados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reportes programados'
        });
    }
};

// Crear dashboard personalizado
exports.crearDashboardPersonalizado = async (req, res) => {
    try {
        const { nombre, configuracion, descripcion } = req.body;
        
        const [result] = await pool.query(`
            INSERT INTO dashboards_personalizados (nombre, configuracion, descripcion, usuario_creador_id)
            VALUES (?, ?, ?, ?)
        `, [nombre, JSON.stringify(configuracion), descripcion, req.user?.id || null]);
        
        res.json({
            success: true,
            dashboard_id: result.insertId,
            message: 'Dashboard personalizado creado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error creando dashboard personalizado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear dashboard personalizado'
        });
    }
};

// Actualizar dashboard personalizado
exports.actualizarDashboardPersonalizado = async (req, res) => {
    try {
        const { dashboardId } = req.params;
        const { nombre, configuracion, descripcion } = req.body;
        
        const [result] = await pool.query(`
            UPDATE dashboards_personalizados 
            SET nombre = ?, configuracion = ?, descripcion = ?, fecha_modificacion = NOW()
            WHERE id = ?
        `, [nombre, JSON.stringify(configuracion), descripcion, dashboardId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Dashboard no encontrado' });
        }
        
        res.json({
            success: true,
            message: 'Dashboard personalizado actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error actualizando dashboard personalizado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar dashboard personalizado'
        });
    }
};

// Eliminar dashboard personalizado
exports.eliminarDashboardPersonalizado = async (req, res) => {
    try {
        const { dashboardId } = req.params;
        
        const [result] = await pool.query(`
            DELETE FROM dashboards_personalizados WHERE id = ?
        `, [dashboardId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Dashboard no encontrado' });
        }
        
        res.json({
            success: true,
            message: 'Dashboard personalizado eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error eliminando dashboard personalizado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar dashboard personalizado'
        });
    }
};

// Funciones placeholder para evitar errores - Se implementarán según necesidad
exports.obtenerKPIsPersonalizados = async (req, res) => {
    res.json({ success: true, kpis: [], message: 'Función KPIs en desarrollo' });
};

exports.crearKPIPersonalizado = async (req, res) => {
    res.json({ success: true, message: 'Función KPI crear en desarrollo' });
};

exports.actualizarKPIPersonalizado = async (req, res) => {
    res.json({ success: true, message: 'Función KPI actualizar en desarrollo' });
};

exports.eliminarKPIPersonalizado = async (req, res) => {
    res.json({ success: true, message: 'Función KPI eliminar en desarrollo' });
};

exports.calcularKPIEspecifico = async (req, res) => {
    res.json({ success: true, resultado: 0, message: 'Función KPI calcular en desarrollo' });
};

exports.crearReporteProgramado = async (req, res) => {
    res.json({ success: true, message: 'Función reporte crear en desarrollo' });
};

exports.actualizarReporteProgramado = async (req, res) => {
    res.json({ success: true, message: 'Función reporte actualizar en desarrollo' });
};

exports.eliminarReporteProgramado = async (req, res) => {
    res.json({ success: true, message: 'Función reporte eliminar en desarrollo' });
};

exports.ejecutarReporteProgramado = async (req, res) => {
    res.json({ success: true, message: 'Función reporte ejecutar en desarrollo' });
};

exports.obtenerHistorialReportes = async (req, res) => {
    res.json({ success: true, reportes: [], message: 'Función historial en desarrollo' });
};

exports.descargarReporte = async (req, res) => {
    res.json({ success: true, message: 'Función descargar en desarrollo' });
};

exports.obtenerDetallesReporte = async (req, res) => {
    res.json({ success: true, reporte: {}, message: 'Función detalles en desarrollo' });
};

exports.obtenerTendenciasAnalytics = async (req, res) => {
    res.json({ success: true, tendencias: [], message: 'Función tendencias en desarrollo' });
};

exports.obtenerAnalisisComparativo = async (req, res) => {
    res.json({ success: true, analisis: {}, message: 'Función comparativo en desarrollo' });
};

exports.obtenerPredicciones = async (req, res) => {
    res.json({ success: true, predicciones: [], message: 'Función predicciones en desarrollo' });
};

exports.obtenerCorrelaciones = async (req, res) => {
    res.json({ success: true, correlaciones: [], message: 'Función correlaciones en desarrollo' });
};

console.log('✅ reportesAnalyticsController cargado exitosamente');

module.exports = exports;
