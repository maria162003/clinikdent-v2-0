const db = require('../Backend/config/db');

const servicios = [
    {
        nombre: 'Consulta General',
        descripcion: 'Consulta odontológica general con revisión completa',
        categoria: 'Consultas',
        precio_base: 50000,
        duracion_minutos: 30,
        requiere_autorizacion: false,
        activo: true
    },
    {
        nombre: 'Limpieza Dental',
        descripcion: 'Profilaxis dental completa con detartraje y pulido',
        categoria: 'Prevención',
        precio_base: 80000,
        duracion_minutos: 45,
        requiere_autorizacion: false,
        activo: true
    },
    {
        nombre: 'Endodoncia (Tratamiento de Conducto)',
        descripcion: 'Tratamiento de conducto radicular completo',
        categoria: 'Endodoncia',
        precio_base: 300000,
        duracion_minutos: 90,
        requiere_autorizacion: true,
        activo: true
    },
    {
        nombre: 'Resina (Obturación Estética)',
        descripcion: 'Obturación estética con resina compuesta',
        categoria: 'Operatoria',
        precio_base: 120000,
        duracion_minutos: 60,
        requiere_autorizacion: false,
        activo: true
    },
    {
        nombre: 'Extracción Simple',
        descripcion: 'Extracción dental simple',
        categoria: 'Cirugía',
        precio_base: 100000,
        duracion_minutos: 30,
        requiere_autorizacion: false,
        activo: true
    },
    {
        nombre: 'Extracción Compleja',
        descripcion: 'Extracción dental compleja o de tercer molar',
        categoria: 'Cirugía',
        precio_base: 200000,
        duracion_minutos: 60,
        requiere_autorizacion: true,
        activo: true
    },
    {
        nombre: 'Blanqueamiento Dental',
        descripcion: 'Blanqueamiento dental con lámpara LED',
        categoria: 'Estética',
        precio_base: 400000,
        duracion_minutos: 90,
        requiere_autorizacion: false,
        activo: true
    },
    {
        nombre: 'Ortodoncia - Primera Consulta',
        descripcion: 'Valoración inicial para ortodoncia con plan de tratamiento',
        categoria: 'Ortodoncia',
        precio_base: 80000,
        duracion_minutos: 45,
        requiere_autorizacion: false,
        activo: true
    },
    {
        nombre: 'Corona Dental',
        descripcion: 'Corona dental de porcelana o zirconia',
        categoria: 'Prótesis',
        precio_base: 800000,
        duracion_minutos: 120,
        requiere_autorizacion: true,
        activo: true
    },
    {
        nombre: 'Prótesis Parcial Removible',
        descripcion: 'Prótesis dental removible parcial',
        categoria: 'Prótesis',
        precio_base: 1200000,
        duracion_minutos: null, // Se fabrica en laboratorio
        requiere_autorizacion: true,
        activo: true
    },
    {
        nombre: 'Implante Dental',
        descripcion: 'Colocación de implante dental osteointegrado',
        categoria: 'Implantología',
        precio_base: 2500000,
        duracion_minutos: 120,
        requiere_autorizacion: true,
        activo: true
    },
    {
        nombre: 'Tratamiento Periodontal',
        descripcion: 'Tratamiento completo de encías (raspado y alisado radicular)',
        categoria: 'Periodoncia',
        precio_base: 250000,
        duracion_minutos: 90,
        requiere_autorizacion: true,
        activo: true
    },
    {
        nombre: 'Radiografía Panorámica',
        descripcion: 'Radiografía panorámica digital completa',
        categoria: 'Diagnóstico',
        precio_base: 50000,
        duracion_minutos: 15,
        requiere_autorizacion: false,
        activo: true
    },
    {
        nombre: 'Radiografía Periapical',
        descripcion: 'Radiografía periapical digital individual',
        categoria: 'Diagnóstico',
        precio_base: 20000,
        duracion_minutos: 10,
        requiere_autorizacion: false,
        activo: true
    },
    {
        nombre: 'Aplicación de Flúor',
        descripcion: 'Aplicación tópica de flúor para prevención de caries',
        categoria: 'Prevención',
        precio_base: 30000,
        duracion_minutos: 20,
        requiere_autorizacion: false,
        activo: true
    }
];

(async () => {
    try {
        console.log('🏥 Iniciando inserción de servicios al catálogo...\n');
        
        // Verificar si ya existen servicios
        const { rows: existentes } = await db.query('SELECT COUNT(*) as total FROM catalogo_servicios');
        
        if (parseInt(existentes[0].total) > 0) {
            console.log(`⚠️  Ya existen ${existentes[0].total} servicios en el catálogo.`);
            console.log('¿Desea eliminarlos y crear nuevos? (Este script los reemplazará)\n');
            
            // Eliminar servicios existentes
            await db.query('DELETE FROM catalogo_servicios');
            console.log('✅ Servicios anteriores eliminados\n');
        }
        
        console.log(`📋 Insertando ${servicios.length} servicios...\n`);
        
        let insertados = 0;
        
        for (const servicio of servicios) {
            try {
                const query = `
                    INSERT INTO catalogo_servicios (
                        nombre, 
                        descripcion, 
                        categoria, 
                        precio_base, 
                        duracion_minutos, 
                        requiere_autorizacion, 
                        activo
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id, nombre, precio_base
                `;
                
                const values = [
                    servicio.nombre,
                    servicio.descripcion,
                    servicio.categoria,
                    servicio.precio_base,
                    servicio.duracion_minutos,
                    servicio.requiere_autorizacion,
                    servicio.activo
                ];
                
                const result = await db.query(query, values);
                insertados++;
                
                console.log(`✅ ${insertados}. ${result.rows[0].nombre} - $${result.rows[0].precio_base.toLocaleString('es-CO')}`);
                
            } catch (error) {
                console.error(`❌ Error insertando ${servicio.nombre}:`, error.message);
            }
        }
        
        console.log(`\n🎉 ¡Proceso completado! ${insertados}/${servicios.length} servicios insertados exitosamente`);
        
        // Mostrar resumen por categoría
        const { rows: categorias } = await db.query(`
            SELECT 
                categoria,
                COUNT(*) as cantidad,
                SUM(precio_base) as total_precios,
                AVG(precio_base) as promedio_precio
            FROM catalogo_servicios
            WHERE activo = true
            GROUP BY categoria
            ORDER BY categoria
        `);
        
        console.log('\n📊 Resumen por categoría:');
        console.table(categorias.map(c => ({
            Categoría: c.categoria,
            Cantidad: c.cantidad,
            'Precio Promedio': `$${parseFloat(c.promedio_precio).toLocaleString('es-CO')}`,
            'Total': `$${parseFloat(c.total_precios).toLocaleString('es-CO')}`
        })));
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error general:', error);
        process.exit(1);
    }
})();
