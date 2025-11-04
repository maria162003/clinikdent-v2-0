// Funciones corregidas para inventario (sin interferir con funciones principales)
console.log('🔧 Cargando correcciones de inventario...');

// Solo agregar funciones si no existen
if (typeof window.renderSedesGridFixed === 'undefined') {
    
    // Función corregida para renderizar grid de sedes
    window.renderSedesGridFixed = function(sedes) {
        const sedesGrid = document.getElementById('sedesGrid');
        if (!sedesGrid) {
            console.warn('Grid de sedes no encontrado');
            return;
        }
        
        if (!sedes || sedes.length === 0) {
            sedesGrid.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="bi bi-building"></i>
                        No hay sedes registradas
                    </div>
                </div>
            `;
            return;
        }
        
        console.log('🏢 Renderizando', sedes.length, 'sedes (versión corregida)');
        
        sedesGrid.innerHTML = sedes.map(sede => {
            const estado = sede.estado || 'activa';
            const badgeClass = estado === 'activa' ? 'bg-success' : 'bg-secondary';
            const direccion = sede.direccion || 'Sin dirección';
            const telefono = sede.telefono || 'Sin teléfono';
            const ciudad = sede.ciudad || 'Sin ciudad';
            
            return `
                <div class="col-md-6 mb-3">
                    <div class="card h-100 sede-card" data-sede-id="${sede.id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title mb-0">
                                    <i class="bi bi-building text-primary"></i>
                                    ${sede.nombre}
                                </h6>
                                <span class="badge ${badgeClass}">${estado.toUpperCase()}</span>
                            </div>
                            
                            <div class="sede-details">
                                <p class="card-text mb-1">
                                    <i class="bi bi-geo-alt text-muted"></i>
                                    <small>${direccion}</small>
                                </p>
                                <p class="card-text mb-1">
                                    <i class="bi bi-telephone text-muted"></i>
                                    <small>${telefono}</small>
                                </p>
                                <p class="card-text mb-1">
                                    <i class="bi bi-geo text-muted"></i>
                                    <small>${ciudad}</small>
                                </p>
                            </div>
                            
                            <div class="mt-2">
                                <button class="btn btn-sm btn-outline-primary me-1">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-info">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Grid de sedes renderizado exitosamente (versión corregida)');
    };

    // Función para cargar sedes sin conflictos
    window.loadSedesFixed = async function() {
        console.log('🏢 Cargando sedes (versión corregida)...');
        
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = localStorage.getItem('userId') || user.id || '4';
            
            const response = await fetch('/api/sedes', {
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const sedes = await response.json();
            console.log(`✅ Sedes cargadas (versión corregida): ${sedes.length}`);
            
            // Usar función corregida
            window.renderSedesGridFixed(sedes);
            
            return sedes;
            
        } catch (error) {
            console.error('❌ Error cargando sedes (versión corregida):', error);
            
            const sedesGrid = document.getElementById('sedesGrid');
            if (sedesGrid) {
                sedesGrid.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle"></i>
                            Error al cargar sedes: ${error.message}
                            <br>
                            <button class="btn btn-sm btn-outline-primary mt-2" onclick="window.loadSedesFixed()">
                                <i class="bi bi-arrow-clockwise"></i> Reintentar
                            </button>
                        </div>
                    </div>
                `;
            }
        }
    };

    // Función para verificar y corregir datos de inventario
    window.fixInventarioData = async function() {
        console.log('🔧 Verificando y corrigiendo datos de inventario...');
        
        try {
            // 1. Verificar si la tabla existe
            const tbody = document.getElementById('inventarioTableBody');
            if (!tbody) {
                console.log('⚠️ Tabla de inventario no encontrada');
                return;
            }
            
            // 2. Si está cargando o vacía, cargar datos
            if (tbody.innerHTML.includes('spinner') || tbody.innerHTML.includes('Cargando') || tbody.children.length === 0) {
                console.log('🔄 Tabla vacía o cargando, obteniendo datos...');
                
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = localStorage.getItem('userId') || user.id || '4';
                
                const response = await fetch('/api/inventario', {
                    headers: {
                        'Content-Type': 'application/json',
                        'user-id': userId
                    }
                });
                
                if (response.ok) {
                    const inventario = await response.json();
                    console.log(`✅ Inventario obtenido: ${inventario.length} items`);
                    
                    // Usar la función de renderizado existente si está disponible
                    if (typeof renderInventarioTable === 'function') {
                        renderInventarioTable(inventario);
                    } else {
                        // Renderizado básico
                        tbody.innerHTML = inventario.slice(0, 5).map(item => `
                            <tr>
                                <td><input type="checkbox" class="form-check-input"></td>
                                <td>${item.id || 'N/A'}</td>
                                <td>${item.equipo_nombre || item.nombre || 'Producto'}</td>
                                <td>${item.equipo_categoria || item.categoria || 'Sin categoría'}</td>
                                <td>${item.sede_nombre || 'Sin sede'}</td>
                                <td>${item.cantidad || 0}</td>
                                <td>${item.stock_minimo || 0}</td>
                                <td>$${(item.equipo_precio || 0).toLocaleString()}</td>
                                <td>$${((item.cantidad || 0) * (item.equipo_precio || 0)).toLocaleString()}</td>
                                <td><span class="badge bg-success">Activo</span></td>
                                <td>${new Date().toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('');
                        
                        console.log('✅ Tabla de inventario renderizada (versión básica)');
                    }
                }
            } else {
                console.log('✅ Tabla de inventario ya tiene datos');
            }
            
        } catch (error) {
            console.error('❌ Error corrigiendo inventario:', error);
        }
    };
}

// Auto-ejecutar correcciones después de que el dashboard se cargue
setTimeout(() => {
    console.log('⏰ Ejecutando correcciones automáticas...');
    
    // Solo ejecutar si estamos en la página del dashboard
    if (window.location.pathname.includes('dashboard-admin')) {
        if (window.loadSedesFixed) {
            window.loadSedesFixed();
        }
        
        if (window.fixInventarioData) {
            window.fixInventarioData();
        }
    }
}, 5000);

console.log('✅ Correcciones de inventario cargadas (sin interferir con funciones principales)');
