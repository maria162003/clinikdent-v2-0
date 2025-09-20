const db = require('./Backend/config/db');

async function poblarTratamientos() {
    console.log('🔄 Poblando tabla de tratamientos...');
    
    const tratamientos = [
        {
            nombre: 'Limpieza Dental',
            descripcion: 'Limpieza dental profesional con fluorización',
            costo_estimado: 80000
        },
        {
            nombre: 'Consulta General',
            descripcion: 'Consulta odontológica general y revisión',
            costo_estimado: 50000
        },
        {
            nombre: 'Extracción Dental',
            descripcion: 'Extracción de pieza dental simple',
            costo_estimado: 120000
        },
        {
            nombre: 'Empaste Dental',
            descripcion: 'Obturación con resina compuesta',
            costo_estimado: 90000
        },
        {
            nombre: 'Endodoncia',
            descripcion: 'Tratamiento de conducto radicular',
            costo_estimado: 200000
        },
        {
            nombre: 'Corona Dental',
            descripcion: 'Corona en porcelana o metal-porcelana',
            costo_estimado: 350000
        },
        {
            nombre: 'Blanqueamiento',
            descripcion: 'Blanqueamiento dental profesional',
            costo_estimado: 150000
        },
        {
            nombre: 'Implante Dental',
            descripcion: 'Implante de titanio con corona',
            costo_estimado: 800000
        }
    ];
    
    try {
        // Verificar si la tabla existe y crearla si no
        await db.query(`
            CREATE TABLE IF NOT EXISTS tratamientos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT,
                costo_base NUMERIC(12,2),
                duracion_estimada INTEGER DEFAULT 60,
                categoria VARCHAR(100),
                activo BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Tabla tratamientos verificada/creada');
        
        // Limpiar datos existentes
        await db.query('DELETE FROM tratamientos');
        console.log('🧹 Datos existentes limpiados');
        
        // Insertar nuevos datos
        for (const tratamiento of tratamientos) {
            await db.query(
                'INSERT INTO tratamientos (nombre, descripcion, costo_base, categoria) VALUES ($1, $2, $3, $4)',
                [tratamiento.nombre, tratamiento.descripcion, tratamiento.costo_estimado, 'General']
            );
        }
        
        console.log(`✅ ${tratamientos.length} tratamientos insertados correctamente`);
        
        // Verificar los datos insertados
        const result = await db.query('SELECT * FROM tratamientos ORDER BY id');
        console.log('📊 Tratamientos en la base de datos:');
        result.rows.forEach(row => {
            console.log(`  - ${row.id}: ${row.nombre} - $${row.costo_base?.toLocaleString('es-CO')}`);
        });
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Error poblando tratamientos:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    poblarTratamientos()
        .then(() => {
            console.log('🎉 Proceso completado exitosamente');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Error en el proceso:', error);
            process.exit(1);
        });
}

module.exports = { poblarTratamientos };