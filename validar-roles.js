/**
 * Script de validación de roles en datos estáticos
 * Revisa inconsistencias en archivos JavaScript
 */

const fs = require('fs');
const path = require('path');

// Usuarios correctos según la base de datos
const USUARIOS_CORRECTOS = {
    'Juan Pérez': { rol: 'paciente', email: 'juan.perez@gmail.com' },
    'María González': { rol: 'paciente', email: 'maria.gonzalez@gmail.com' },
    'Carlos López': { rol: 'paciente', email: 'carlos.lopez@gmail.com' },
    'Dr. Carlos Rodríguez': { rol: 'odontologo', email: 'carlos.rodriguez@clinikdent.com' },
    'Carlos Rodríguez': { rol: 'odontologo', email: 'carlos.rodriguez@clinikdent.com' },
    'Dra. Ana García': { rol: 'odontologo', email: 'ana.garcia@clinikdent.com' },
    'Ana García': { rol: 'odontologo', email: 'ana.garcia@clinikdent.com' },
    'Admin Sistema': { rol: 'administrador', email: 'admin@clinikdent.com' }
};

function validarArchivo(rutaArchivo) {
    console.log(`\n🔍 Validando: ${rutaArchivo}`);
    
    try {
        const contenido = fs.readFileSync(rutaArchivo, 'utf8');
        const lineas = contenido.split('\n');
        let erroresEncontrados = 0;

        lineas.forEach((linea, indice) => {
            // Buscar patrones problemáticos
            const patronCita = /paciente.*nombre.*['"`]([^'"`]+)['"`].*odontologo.*nombre.*['"`]([^'"`]+)['"`]/i;
            const patronOdontologoPaciente = /odontologo.*['"`]([^'"`]*(?:Juan Pérez|María González|Carlos López)[^'"`]*)['"`]/i;
            const patronPacienteOdontologo = /paciente.*['"`]([^'"`]*(?:Dr\.|Dra\.)[^'"`]*)['"`]/i;

            const matchCita = linea.match(patronCita);
            if (matchCita) {
                const paciente = matchCita[1].trim();
                const odontologo = matchCita[2].trim();

                // Verificar si el odontólogo está marcado como paciente
                if (USUARIOS_CORRECTOS[odontologo] && USUARIOS_CORRECTOS[odontologo].rol === 'paciente') {
                    console.log(`❌ Línea ${indice + 1}: "${odontologo}" aparece como odontólogo pero es PACIENTE`);
                    erroresEncontrados++;
                }

                // Verificar si el paciente está marcado como odontólogo
                if (USUARIOS_CORRECTOS[paciente] && USUARIOS_CORRECTOS[paciente].rol === 'odontologo') {
                    console.log(`❌ Línea ${indice + 1}: "${paciente}" aparece como paciente pero es ODONTÓLOGO`);
                    erroresEncontrados++;
                }
            }

            // Buscar específicamente Juan Pérez como odontólogo
            if (patronOdontologoPaciente.test(linea)) {
                console.log(`❌ Línea ${indice + 1}: Paciente aparece como odontólogo: ${linea.trim()}`);
                erroresEncontrados++;
            }

            // Buscar específicamente doctores como pacientes
            if (patronPacienteOdontologo.test(linea)) {
                console.log(`❌ Línea ${indice + 1}: Odontólogo aparece como paciente: ${linea.trim()}`);
                erroresEncontrados++;
            }
        });

        if (erroresEncontrados === 0) {
            console.log('✅ Sin errores de roles encontrados');
        } else {
            console.log(`🚨 ${erroresEncontrados} errores de roles encontrados`);
        }

        return erroresEncontrados;

    } catch (error) {
        console.log(`❌ Error leyendo archivo: ${error.message}`);
        return 0;
    }
}

function validarDirectorio() {
    const directorioJS = path.join(__dirname, 'public', 'js');
    console.log('🧪 VALIDACIÓN DE ROLES EN DATOS ESTÁTICOS');
    console.log('==========================================');
    
    let totalErrores = 0;

    try {
        const archivos = fs.readdirSync(directorioJS)
            .filter(archivo => archivo.endsWith('.js'))
            .filter(archivo => !archivo.includes('usuarios-referencia')); // Excluir el archivo de referencia

        archivos.forEach(archivo => {
            const rutaCompleta = path.join(directorioJS, archivo);
            totalErrores += validarArchivo(rutaCompleta);
        });

        console.log('\n📊 RESUMEN DE VALIDACIÓN');
        console.log(`Total archivos revisados: ${archivos.length}`);
        console.log(`Total errores encontrados: ${totalErrores}`);

        if (totalErrores > 0) {
            console.log('\n🔧 ACCIONES RECOMENDADAS:');
            console.log('1. Usar el archivo usuarios-referencia.js como guía');
            console.log('2. Corregir los roles incorrectos en los datos estáticos');
            console.log('3. Ejecutar este script nuevamente para verificar');
        } else {
            console.log('\n🎉 ¡Todos los archivos tienen roles consistentes!');
        }

    } catch (error) {
        console.log(`❌ Error accediendo al directorio: ${error.message}`);
    }
}

// Ejecutar validación
validarDirectorio();