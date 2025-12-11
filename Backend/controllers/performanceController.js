// ===================================================
// CONTROLADOR DEL SISTEMA DE OPTIMIZACIÓN DE PERFORMANCE
// Gestión automática de performance y escalabilidad
// ===================================================

const db = require('../config/db');
const crypto = require('crypto');

const PerformanceController = {

    // =================
    // MÉTRICAS DE PERFORMANCE
    // =================

    // Registrar nueva métrica de performance
    registrarMetrica: async (req, res) => {
        try {
            const { 
                tipo_metrica, 
                componente, 
                valor_metrica, 
                unidad, 
                metadata_adicional = {}, 
                severidad = 'medium' 
            } = req.body;

            // Validar datos requeridos
            if (!tipo_metrica || !componente || valor_metrica === undefined || !unidad) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Faltan datos requeridos para registrar la métrica' 
                });
            }

            const query = `
                INSERT INTO metricas_performance 
                (tipo_metrica, componente, valor_metrica, unidad, metadata_adicional, severidad)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.execute(query, [
                tipo_metrica,
                componente,
                parseFloat(valor_metrica),
                unidad,
                JSON.stringify(metadata_adicional),
                severidad
            ]);

            // Evaluar si la métrica requiere alerta
            await PerformanceController.evaluarAlertas({
                tipo_metrica,
                componente,
                valor_metrica: parseFloat(valor_metrica),
                severidad
            });

            res.json({ 
                success: true, 
                message: 'Métrica registrada exitosamente',
                metrica_id: result.insertId
            });

        } catch (error) {
            console.error('Error registrando métrica:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // Obtener métricas de performance con filtros
    obtenerMetricas: async (req, res) => {
        try {
            const { 
                tipo_metrica, 
                componente, 
                severidad, 
                fecha_inicio, 
                fecha_fin, 
                limit = 100 
            } = req.query;

            let query = `
                SELECT 
                    id,
                    tipo_metrica,
                    componente,
                    valor_metrica,
                    unidad,
                    metadata_adicional,
                    severidad,
                    timestamp_metrica
                FROM metricas_performance
                WHERE 1=1
            `;
            const params = [];

            if (tipo_metrica) {
                query += ' AND tipo_metrica = ?';
                params.push(tipo_metrica);
            }

            if (componente) {
                query += ' AND componente = ?';
                params.push(componente);
            }

            if (severidad) {
                query += ' AND severidad = ?';
                params.push(severidad);
            }

            if (fecha_inicio) {
                query += ' AND timestamp_metrica >= ?';
                params.push(fecha_inicio);
            }

            if (fecha_fin) {
                query += ' AND timestamp_metrica <= ?';
                params.push(fecha_fin);
            }

            query += ' ORDER BY timestamp_metrica DESC LIMIT ?';
            params.push(parseInt(limit));

            const [metricas] = await db.execute(query, params);

            // Procesar metadata JSON
            const metricasProcesadas = metricas.map(metrica => ({
                ...metrica,
                metadata_adicional: JSON.parse(metrica.metadata_adicional || '{}')
            }));

            res.json({ 
                success: true, 
                metricas: metricasProcesadas,
                total: metricas.length
            });

        } catch (error) {
            console.error('Error obteniendo métricas:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // =================
    // ANÁLISIS DE QUERIES DB
    // =================

    // Registrar análisis de query
    analizarQuery: async (req, res) => {
        try {
            const { query_sql, tiempo_ejecucion, filas_examinadas, filas_retornadas, indices_utilizados = [] } = req.body;

            if (!query_sql || tiempo_ejecucion === undefined) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'SQL query y tiempo de ejecución son requeridos' 
                });
            }

            // Generar hash único del query
            const query_hash = crypto.createHash('md5').update(query_sql).digest('hex');

            // Normalizar query (remover parámetros)
            const query_normalizado = query_sql.replace(/'[^']*'/g, '?').replace(/\d+/g, '?');

            // Generar sugerencias automáticas de optimización
            const sugerencias = PerformanceController.generarSugerenciasOptimizacion({
                query_sql,
                tiempo_ejecucion,
                filas_examinadas,
                filas_retornadas,
                indices_utilizados
            });

            // Verificar si el query ya existe
            const [queryExistente] = await db.execute(
                'SELECT id, frecuencia_ejecucion, tiempo_ejecucion_promedio FROM analisis_queries_db WHERE query_hash = ?',
                [query_hash]
            );

            if (queryExistente.length > 0) {
                // Actualizar estadísticas del query existente
                const query_actual = queryExistente[0];
                const nueva_frecuencia = query_actual.frecuencia_ejecucion + 1;
                const nuevo_promedio = ((query_actual.tiempo_ejecucion_promedio * query_actual.frecuencia_ejecucion) + tiempo_ejecucion) / nueva_frecuencia;

                await db.execute(`
                    UPDATE analisis_queries_db 
                    SET frecuencia_ejecucion = ?,
                        tiempo_ejecucion_promedio = ?,
                        tiempo_ejecucion_max = GREATEST(tiempo_ejecucion_max, ?),
                        filas_examinadas_promedio = ?,
                        filas_retornadas_promedio = ?,
                        sugerencias_optimizacion = ?,
                        ultima_ejecucion = CURRENT_TIMESTAMP
                    WHERE query_hash = ?
                `, [
                    nueva_frecuencia,
                    nuevo_promedio,
                    tiempo_ejecucion,
                    filas_examinadas || 0,
                    filas_retornadas || 0,
                    JSON.stringify(sugerencias),
                    query_hash
                ]);

                res.json({ 
                    success: true, 
                    message: 'Query analysis actualizado',
                    query_id: query_actual.id
                });
            } else {
                // Crear nuevo registro de análisis
                const [result] = await db.execute(`
                    INSERT INTO analisis_queries_db 
                    (query_hash, query_sql, query_normalizado, tiempo_ejecucion_promedio, tiempo_ejecucion_max,
                     filas_examinadas_promedio, filas_retornadas_promedio, indices_utilizados, sugerencias_optimizacion,
                     estado_optimizacion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    query_hash,
                    query_sql,
                    query_normalizado,
                    tiempo_ejecucion,
                    tiempo_ejecucion,
                    filas_examinadas || 0,
                    filas_retornadas || 0,
                    JSON.stringify(indices_utilizados),
                    JSON.stringify(sugerencias),
                    tiempo_ejecucion > 1.0 ? 'critico' : 'pendiente'
                ]);

                res.json({ 
                    success: true, 
                    message: 'Query analysis creado',
                    query_id: result.insertId
                });
            }

        } catch (error) {
            console.error('Error analizando query:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // Obtener queries que necesitan optimización
    obtenerQueriesOptimizacion: async (req, res) => {
        try {
            const { limite = 20, estado = 'pendiente,critico' } = req.query;

            const estados = estado.split(',').map(e => e.trim());
            const placeholders = estados.map(() => '?').join(',');

            const query = `
                SELECT 
                    id,
                    query_normalizado,
                    tiempo_ejecucion_promedio,
                    tiempo_ejecucion_max,
                    frecuencia_ejecucion,
                    (tiempo_ejecucion_promedio * frecuencia_ejecucion) as impacto_total,
                    filas_examinadas_promedio,
                    sugerencias_optimizacion,
                    estado_optimizacion,
                    ultima_ejecucion
                FROM analisis_queries_db 
                WHERE estado_optimizacion IN (${placeholders})
                ORDER BY impacto_total DESC
                LIMIT ?
            `;

            const [queries] = await db.execute(query, [...estados, parseInt(limite)]);

            const queriesProcesados = queries.map(query => ({
                ...query,
                sugerencias_optimizacion: JSON.parse(query.sugerencias_optimizacion || '{}')
            }));

            res.json({ 
                success: true, 
                queries: queriesProcesados,
                total: queries.length
            });

        } catch (error) {
            console.error('Error obteniendo queries para optimización:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // =================
    // SISTEMA DE CACHÉ
    // =================

    // Obtener valor del caché
    obtenerCache: async (req, res) => {
        try {
            const { cache_key } = req.params;

            const [cache] = await db.execute(`
                SELECT cache_value, fecha_expiracion, comprimido
                FROM cache_aplicacion 
                WHERE cache_key = ? AND fecha_expiracion > NOW()
            `, [cache_key]);

            if (cache.length === 0) {
                return res.status(404).json({ success: false, message: 'Cache no encontrado o expirado' });
            }

            // Actualizar contador de hits
            await db.execute(`
                UPDATE cache_aplicacion 
                SET hits_counter = hits_counter + 1, ultimo_hit = CURRENT_TIMESTAMP 
                WHERE cache_key = ?
            `, [cache_key]);

            let valor = cache[0].cache_value;

            // Descomprimir si es necesario (simulado)
            if (cache[0].comprimido) {
                // Aquí podrías implementar descompresión real
                console.log('Descomprimiendo valor de cache...');
            }

            res.json({ 
                success: true, 
                cache_key,
                cache_value: JSON.parse(valor),
                from_cache: true
            });

        } catch (error) {
            console.error('Error obteniendo cache:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // Almacenar valor en caché
    almacenarCache: async (req, res) => {
        try {
            const { cache_key, cache_value, categoria, ttl_segundos = 3600 } = req.body;

            if (!cache_key || !cache_value) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'cache_key y cache_value son requeridos' 
                });
            }

            const valor_json = JSON.stringify(cache_value);
            const tamaño_bytes = Buffer.byteLength(valor_json, 'utf8');
            const fecha_expiracion = new Date(Date.now() + (ttl_segundos * 1000));

            // Comprimir si el valor es muy grande (simulado)
            const comprimido = tamaño_bytes > 5000;

            await db.execute(`
                INSERT INTO cache_aplicacion 
                (cache_key, cache_value, categoria, ttl_segundos, fecha_expiracion, tamaño_bytes, comprimido)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                cache_value = VALUES(cache_value),
                ttl_segundos = VALUES(ttl_segundos),
                fecha_expiracion = VALUES(fecha_expiracion),
                tamaño_bytes = VALUES(tamaño_bytes),
                fecha_creacion = CURRENT_TIMESTAMP
            `, [
                cache_key,
                valor_json,
                categoria,
                ttl_segundos,
                fecha_expiracion,
                tamaño_bytes,
                comprimido
            ]);

            res.json({ 
                success: true, 
                message: 'Valor almacenado en cache',
                cache_key,
                expira_en: fecha_expiracion
            });

        } catch (error) {
            console.error('Error almacenando cache:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // =================
    // MONITOREO DE ENDPOINTS
    // =================

    // Registrar métrica de endpoint API
    registrarEndpoint: async (req, res) => {
        try {
            const { 
                endpoint, 
                metodo_http, 
                tiempo_respuesta_ms, 
                status_code, 
                tamaño_respuesta_bytes = 0,
                memoria_usada_mb,
                cpu_usado_percent,
                errores_detectados = []
            } = req.body;

            const ip_cliente = req.ip || req.connection.remoteAddress;
            const user_agent = req.get('User-Agent');

            await db.execute(`
                INSERT INTO monitoreo_endpoints 
                (endpoint, metodo_http, tiempo_respuesta_ms, status_code, tamaño_respuesta_bytes,
                 ip_cliente, user_agent, memoria_usada_mb, cpu_usado_percent, errores_detectados)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                endpoint,
                metodo_http,
                parseInt(tiempo_respuesta_ms),
                parseInt(status_code),
                parseInt(tamaño_respuesta_bytes),
                ip_cliente,
                user_agent,
                parseFloat(memoria_usada_mb) || null,
                parseFloat(cpu_usado_percent) || null,
                JSON.stringify(errores_detectados)
            ]);

            res.json({ success: true, message: 'Métrica de endpoint registrada' });

        } catch (error) {
            console.error('Error registrando endpoint:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // =================
    // ALERTAS DE PERFORMANCE
    // =================

    // Evaluar y generar alertas automáticas
    evaluarAlertas: async (metricaData) => {
        try {
            const { tipo_metrica, componente, valor_metrica, severidad } = metricaData;

            let alerta_generada = false;
            let mensaje = '';
            let accion_recomendada = '';
            let umbral_configurado = null;

            // Evaluar diferentes tipos de métricas
            switch (tipo_metrica) {
                case 'cpu_usage':
                    umbral_configurado = 80.0;
                    if (valor_metrica > umbral_configurado) {
                        alerta_generada = true;
                        mensaje = `Uso de CPU elevado en ${componente}: ${valor_metrica}%`;
                        accion_recomendada = 'Revisar procesos activos y considerar escalabilidad';
                    }
                    break;

                case 'memoria_usage':
                    umbral_configurado = 85.0;
                    if (valor_metrica > umbral_configurado) {
                        alerta_generada = true;
                        mensaje = `Uso de memoria elevado en ${componente}: ${valor_metrica}%`;
                        accion_recomendada = 'Revisar memory leaks y optimizar uso de memoria';
                    }
                    break;

                case 'tiempo_respuesta':
                    umbral_configurado = 2000.0;
                    if (valor_metrica > umbral_configurado) {
                        alerta_generada = true;
                        mensaje = `Tiempo de respuesta elevado en ${componente}: ${valor_metrica}ms`;
                        accion_recomendada = 'Optimizar queries y revisar performance del código';
                    }
                    break;

                case 'queries_lentas':
                    umbral_configurado = 10;
                    if (valor_metrica > umbral_configurado) {
                        alerta_generada = true;
                        mensaje = `Queries lentos detectados: ${valor_metrica}`;
                        accion_recomendada = 'Revisar y optimizar queries de base de datos';
                    }
                    break;
            }

            if (alerta_generada) {
                await db.execute(`
                    INSERT INTO alertas_performance 
                    (tipo_alerta, componente_afectado, nivel_severidad, mensaje, 
                     valor_medido, umbral_configurado, accion_recomendada)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    tipo_metrica,
                    componente,
                    severidad === 'critical' ? 'critical' : 'warning',
                    mensaje,
                    valor_metrica,
                    umbral_configurado,
                    accion_recomendada
                ]);

                console.log(`🚨 Alerta generada: ${mensaje}`);
            }

        } catch (error) {
            console.error('Error evaluando alertas:', error);
        }
    },

    // Obtener alertas de performance
    obtenerAlertas: async (req, res) => {
        try {
            const { estado = 'pendiente', nivel_severidad, limite = 50 } = req.query;

            let query = `
                SELECT 
                    id,
                    tipo_alerta,
                    componente_afectado,
                    nivel_severidad,
                    mensaje,
                    valor_medido,
                    umbral_configurado,
                    accion_recomendada,
                    fecha_alerta,
                    estado
                FROM alertas_performance
                WHERE 1=1
            `;
            const params = [];

            if (estado) {
                query += ' AND estado = ?';
                params.push(estado);
            }

            if (nivel_severidad) {
                query += ' AND nivel_severidad = ?';
                params.push(nivel_severidad);
            }

            query += ' ORDER BY fecha_alerta DESC LIMIT ?';
            params.push(parseInt(limite));

            const [alertas] = await db.execute(query, params);

            res.json({ 
                success: true, 
                alertas,
                total: alertas.length
            });

        } catch (error) {
            console.error('Error obteniendo alertas:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // =================
    // DASHBOARD Y ESTADÍSTICAS
    // =================

    // Dashboard principal de performance
    obtenerDashboardPerformance: async (req, res) => {
        try {
            // Obtener métricas del dashboard
            const [dashboard] = await db.execute('SELECT * FROM vista_dashboard_performance LIMIT 1');

            // Obtener métricas recientes por tipo
            const [metricas_recientes] = await db.execute(`
                SELECT 
                    tipo_metrica,
                    AVG(valor_metrica) as valor_promedio,
                    MAX(valor_metrica) as valor_maximo,
                    COUNT(*) as total_mediciones
                FROM metricas_performance 
                WHERE timestamp_metrica >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY tipo_metrica
                ORDER BY valor_promedio DESC
            `);

            // Obtener top queries problemáticos
            const [queries_problematicos] = await db.execute(`
                SELECT 
                    query_normalizado,
                    tiempo_ejecucion_promedio,
                    frecuencia_ejecucion,
                    estado_optimizacion
                FROM analisis_queries_db 
                WHERE estado_optimizacion IN ('pendiente', 'critico')
                ORDER BY (tiempo_ejecucion_promedio * frecuencia_ejecucion) DESC
                LIMIT 5
            `);

            // Obtener estadísticas de cache
            const [stats_cache] = await db.execute(`
                SELECT 
                    categoria,
                    COUNT(*) as total_entries,
                    SUM(hits_counter) as total_hits,
                    AVG(tamaño_bytes) as tamaño_promedio
                FROM cache_aplicacion 
                WHERE fecha_expiracion > NOW()
                GROUP BY categoria
                ORDER BY total_hits DESC
            `);

            const dashboard_data = {
                resumen: dashboard[0] || {},
                metricas_recientes,
                queries_problematicos,
                estadisticas_cache: stats_cache,
                timestamp: new Date()
            };

            res.json({ 
                success: true, 
                dashboard: dashboard_data
            });

        } catch (error) {
            console.error('Error obteniendo dashboard:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // =================
    // UTILIDADES Y HELPERS
    // =================

    // Generar sugerencias automáticas de optimización
    generarSugerenciasOptimizacion: (queryData) => {
        const { query_sql, tiempo_ejecucion, filas_examinadas, filas_retornadas, indices_utilizados } = queryData;
        const sugerencias = {};

        // Evaluar tiempo de ejecución
        if (tiempo_ejecucion > 1.0) {
            sugerencias.tiempo_critico = true;
            sugerencias.prioridad_optimizacion = 'alta';
        }

        // Evaluar eficiencia de filas
        if (filas_examinadas && filas_retornadas && filas_examinadas > filas_retornadas * 10) {
            sugerencias.ratio_filas_ineficiente = true;
            sugerencias.agregar_indices = true;
        }

        // Evaluar uso de SELECT *
        if (query_sql.toLowerCase().includes('select *')) {
            sugerencias.eliminar_select_asterisco = true;
            sugerencias.especificar_columnas = true;
        }

        // Evaluar JOINs complejos
        if (query_sql.toLowerCase().includes('join') && tiempo_ejecucion > 0.5) {
            sugerencias.optimizar_joins = true;
            sugerencias.revisar_indices_join = true;
        }

        // Evaluar subconsultas
        if (query_sql.toLowerCase().includes('select') && query_sql.split(/select/i).length > 2) {
            sugerencias.revisar_subconsultas = true;
            sugerencias.considerar_joins_en_lugar_subconsultas = true;
        }

        return sugerencias;
    },

    // Limpiar datos antiguos
    limpiarDatosAntiguos: async (req, res) => {
        try {
            const [result] = await db.execute('CALL LimpiarDatosAntiguos()');
            
            res.json({ 
                success: true, 
                message: 'Limpieza de datos completada',
                resultado: result[0]
            });

        } catch (error) {
            console.error('Error limpiando datos antiguos:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // Generar reporte de performance
    generarReporte: async (req, res) => {
        try {
            const { fecha_inicio, fecha_fin } = req.body;

            if (!fecha_inicio || !fecha_fin) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Fechas de inicio y fin son requeridas' 
                });
            }

            const [reporte] = await db.execute('CALL GenerarReportePerformance(?, ?)', [fecha_inicio, fecha_fin]);

            res.json({ 
                success: true, 
                reporte: reporte,
                periodo: { fecha_inicio, fecha_fin }
            });

        } catch (error) {
            console.error('Error generando reporte:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
};

console.log('✅ Controller de optimización de performance configurado');

module.exports = PerformanceController;
