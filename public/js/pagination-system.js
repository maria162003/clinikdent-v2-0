// Funciones de paginación para todas las secciones del inventario
window.paginationModules = {
    inventario: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        data: []
    },
    sedes: {
        currentPage: 1,
        itemsPerPage: 6,
        totalItems: 0,
        totalPages: 1,
        data: []
    },
    categorias: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        data: []
    },
    proveedores: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        data: []
    },
    usuarios: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        data: []
    },
    citas: {
        currentPage: 1,
        itemsPerPage: 15,
        totalItems: 0,
        totalPages: 1,
        data: []
    },
    evaluaciones: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        data: []
    },
    faqs: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        data: []
    },
    reportes: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        data: []
    },
    pagos: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        data: []
    }
};

// Función para cambiar items por página
function changeItemsPerPageAdmin(section, newValue) {
    const module = window.paginationModules[section];
    if (!module) return;
    
    module.itemsPerPage = parseInt(newValue);
    module.currentPage = 1;
    
    updatePagination(section);
    renderCurrentPage(section);
}

// Función para ir a la página anterior
function previousPageAdmin(section) {
    const module = window.paginationModules[section];
    if (!module || module.currentPage <= 1) return;
    
    module.currentPage--;
    updatePagination(section);
    renderCurrentPage(section);
}

// Función para ir a la página siguiente
function nextPageAdmin(section) {
    const module = window.paginationModules[section];
    if (!module || module.currentPage >= module.totalPages) return;
    
    module.currentPage++;
    updatePagination(section);
    renderCurrentPage(section);
}

// Función para generar controles de paginación dinámicamente
function generatePaginationControls(section) {
    const module = window.paginationModules[section];
    if (!module) return;
    
    const paginationContainer = document.getElementById(`${section}Pagination`);
    if (!paginationContainer) return;
    
    // Si hay solo una página o menos, no mostrar controles
    if (module.totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    let paginationHTML = '<nav aria-label="Navegación de páginas"><ul class="pagination pagination-sm mb-0">';
    
    // Botón Anterior
    const prevDisabled = module.currentPage === 1 ? 'disabled' : '';
    paginationHTML += `
        <li class="page-item ${prevDisabled}">
            <a class="page-link" href="#" onclick="goToPageAdmin('${section}', ${module.currentPage - 1})" ${prevDisabled ? 'tabindex="-1" aria-disabled="true"' : ''}>
                <i class="bi bi-chevron-left"></i> Anterior
            </a>
        </li>
    `;
    
    // Números de página
    let startPage = Math.max(1, module.currentPage - 2);
    let endPage = Math.min(module.totalPages, module.currentPage + 2);
    
    // Ajustar si estamos cerca del inicio
    if (module.currentPage <= 3) {
        endPage = Math.min(5, module.totalPages);
    }
    
    // Ajustar si estamos cerca del final
    if (module.currentPage > module.totalPages - 3) {
        startPage = Math.max(1, module.totalPages - 4);
    }
    
    // Primera página si no está visible
    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPageAdmin('${section}', 1)">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Páginas visibles
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === module.currentPage ? 'active' : '';
        paginationHTML += `
            <li class="page-item ${isActive}">
                <a class="page-link" href="#" onclick="goToPageAdmin('${section}', ${i})">${i}</a>
            </li>
        `;
    }
    
    // Última página si no está visible
    if (endPage < module.totalPages) {
        if (endPage < module.totalPages - 1) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPageAdmin('${section}', ${module.totalPages})">${module.totalPages}</a>
            </li>
        `;
    }
    
    // Botón Siguiente
    const nextDisabled = module.currentPage === module.totalPages ? 'disabled' : '';
    paginationHTML += `
        <li class="page-item ${nextDisabled}">
            <a class="page-link" href="#" onclick="goToPageAdmin('${section}', ${module.currentPage + 1})" ${nextDisabled ? 'tabindex="-1" aria-disabled="true"' : ''}>
                Siguiente <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationHTML += '</ul></nav>';
    paginationContainer.innerHTML = paginationHTML;
}

// Función para actualizar la información de paginación
function updatePagination(section) {
    const module = window.paginationModules[section];
    if (!module) return;
    
    // Calcular páginas totales
    module.totalPages = Math.ceil(module.totalItems / module.itemsPerPage);
    
    // Elementos DOM específicos de cada sección
    const elements = {
        showing: document.getElementById(`${section}Showing`),
        total: document.getElementById(`${section}Total`),
        currentPage: document.getElementById(`${section}CurrentPage`),
        totalPages: document.getElementById(`${section}TotalPages`),
        pageNumber: document.getElementById(`${section}PageNumber`),
        prevBtn: document.getElementById(`${section}PrevBtn`),
        nextBtn: document.getElementById(`${section}NextBtn`),
        paginationInfo: document.getElementById(`${section}PaginationInfo`)
    };
    
    // Calcular elementos mostrados
    const startItem = (module.currentPage - 1) * module.itemsPerPage + 1;
    const endItem = Math.min(startItem + module.itemsPerPage - 1, module.totalItems);
    
    // Actualizar texto de información
    if (elements.showing) {
        elements.showing.textContent = module.totalItems > 0 ? endItem - startItem + 1 : 0;
    }
    if (elements.total) {
        elements.total.textContent = module.totalItems;
    }
    if (elements.currentPage) {
        elements.currentPage.textContent = module.currentPage;
    }
    if (elements.totalPages) {
        elements.totalPages.textContent = module.totalPages;
    }
    if (elements.pageNumber) {
        elements.pageNumber.textContent = module.currentPage;
    }
    
    // Habilitar/deshabilitar botones
    if (elements.prevBtn) {
        if (module.currentPage <= 1) {
            elements.prevBtn.classList.add('disabled');
        } else {
            elements.prevBtn.classList.remove('disabled');
        }
    }
    
    if (elements.nextBtn) {
        if (module.currentPage >= module.totalPages) {
            elements.nextBtn.classList.add('disabled');
        } else {
            elements.nextBtn.classList.remove('disabled');
        }
    }
    
    // Mostrar/ocultar paginación
    if (elements.paginationInfo) {
        if (module.totalItems > 0) {
            elements.paginationInfo.style.display = 'flex';
        } else {
            elements.paginationInfo.style.display = 'none';
        }
    }
    
    // Generar controles de paginación
    generatePaginationControls(section);
}

// Función para renderizar la página actual según la sección
function renderCurrentPage(section) {
    const module = window.paginationModules[section];
    if (!module) return;
    
    const startIndex = (module.currentPage - 1) * module.itemsPerPage;
    const endIndex = startIndex + module.itemsPerPage;
    const pageData = module.data.slice(startIndex, endIndex);
    
    switch (section) {
        case 'inventario':
            renderInventarioPage(pageData);
            break;
        case 'sedes':
            renderSedesPage(pageData);
            break;
        case 'categorias':
            renderCategoriasPage(pageData);
            break;
        case 'proveedores':
            renderProveedoresPage(pageData);
            break;
        case 'usuarios':
            renderUsuariosPage(pageData);
            break;
        case 'citas':
            renderCitasPage(pageData);
            break;
        case 'evaluaciones':
            renderEvaluacionesPage(pageData);
            break;
        case 'faqs':
            renderFaqsPage(pageData);
            break;
        case 'reportes':
            renderReportesPage(pageData);
            break;
        case 'pagos':
            renderPagosPage(pageData);
            break;
    }
}

// Función para inicializar paginación con datos
function initializePagination(section, data) {
    const module = window.paginationModules[section];
    if (!module) return;
    
    module.data = data || [];
    module.totalItems = module.data.length;
    module.currentPage = 1;
    
    updatePagination(section);
    renderCurrentPage(section);
}

// Funciones de renderizado específicas para cada sección
function renderInventarioPage(data) {
    const tbody = document.getElementById('inventarioTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center">
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle"></i> No hay productos en esta página
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(equipo => `
        <tr>
            <td>
                <input type="checkbox" class="select-item" value="${equipo.id}">
            </td>
            <td><code>${equipo.codigo || 'N/A'}</code></td>
            <td><strong>${equipo.nombre}</strong></td>
            <td>
                <span class="badge bg-primary">${equipo.categoria || 'Sin categoría'}</span>
            </td>
            <td>
                <span class="badge bg-info">${equipo.sede || 'General'}</span>
            </td>
            <td>
                <span class="badge ${equipo.stock_actual <= equipo.stock_minimo ? 'bg-danger' : 'bg-success'}">
                    ${equipo.stock_actual || 0}
                </span>
            </td>
            <td>${equipo.stock_minimo || 0}</td>
            <td>$${equipo.precio ? Number(equipo.precio).toLocaleString() : '0'}</td>
            <td>$${equipo.valor_total ? Number(equipo.valor_total).toLocaleString() : '0'}</td>
            <td>
                <span class="badge ${equipo.stock_actual <= 0 ? 'bg-danger' : equipo.stock_actual <= equipo.stock_minimo ? 'bg-warning' : 'bg-success'}">
                    ${equipo.stock_actual <= 0 ? 'Agotado' : equipo.stock_actual <= equipo.stock_minimo ? 'Stock Bajo' : 'Normal'}
                </span>
            </td>
            <td>${equipo.ultima_actualizacion || 'N/A'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm" 
                            onclick="editarInventario(${equipo.id})"
                            title="Editar"
                            style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                        <i class="bi bi-pencil" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="verDetallesInventario(${equipo.id})"
                            title="Detalles"
                            style="background-color: #6c757d; border-color: #6c757d; color: white;">
                        <i class="bi bi-eye" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="eliminarInventario(${equipo.id})"
                            title="Eliminar"
                            style="background-color: #dc3545; border-color: #dc3545; color: white;">
                        <i class="bi bi-trash" style="color: white;"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderSedesPage(data) {
    const container = document.getElementById('sedesGrid');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> No hay sedes en esta página
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = data.map(sede => `
        <div class="col-md-6 mb-3">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">
                            <i class="bi bi-building"></i> ${sede.nombre}
                        </h6>
                        <span class="badge ${sede.activa ? 'bg-success' : 'bg-secondary'}">
                            ${sede.activa ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>
                    <div class="card-text">
                        <p class="mb-1">
                            <i class="bi bi-geo-alt"></i> 
                            <strong>Ciudad:</strong> ${sede.ciudad || 'N/A'}
                        </p>
                        <p class="mb-1">
                            <i class="bi bi-house"></i> 
                            <strong>Dirección:</strong> ${sede.direccion || 'N/A'}
                        </p>
                        <p class="mb-1">
                            <i class="bi bi-telephone"></i> 
                            <strong>Teléfono:</strong> ${sede.telefono || 'N/A'}
                        </p>
                        <p class="mb-0">
                            <i class="bi bi-envelope"></i> 
                            <strong>Email:</strong> ${sede.email || 'N/A'}
                        </p>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-sm me-1" 
                                onclick="editarSede(${sede.id})"
                                title="Editar sede"
                                style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                            <i class="bi bi-pencil" style="color: white;"></i>
                        </button>
                        <button class="btn btn-sm me-1" 
                                onclick="verDetallesSede(${sede.id})"
                                title="Ver detalles"
                                style="background-color: #6c757d; border-color: #6c757d; color: white;">
                            <i class="bi bi-eye" style="color: white;"></i>
                        </button>
                        <button class="btn btn-sm" 
                                onclick="eliminarSede(${sede.id})"
                                title="Eliminar sede"
                                style="background-color: #dc3545; border-color: #dc3545; color: white;">
                            <i class="bi bi-trash" style="color: white;"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCategoriasPage(data) {
    const tbody = document.getElementById('categoriasTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle"></i> No hay categorías en esta página
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(categoria => `
        <tr>
            <td>${categoria.id}</td>
            <td><strong>${categoria.nombre}</strong></td>
            <td>${categoria.descripcion || 'N/A'}</td>
            <td><span class="badge bg-primary">${categoria.productos || 0}</span></td>
            <td>
                <span class="badge" style="background-color: ${categoria.color || '#007bff'};">
                    ${categoria.color || '#007bff'}
                </span>
            </td>
            <td>
                <span class="badge ${categoria.activa ? 'bg-success' : 'bg-secondary'}">
                    ${categoria.activa ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm" 
                            onclick="editarCategoria(${categoria.id})"
                            title="Editar"
                            style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                        <i class="bi bi-pencil" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="eliminarCategoria(${categoria.id})"
                            title="Eliminar"
                            style="background-color: #dc3545; border-color: #dc3545; color: white;">
                        <i class="bi bi-trash" style="color: white;"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderProveedoresPage(data) {
    const tbody = document.getElementById('proveedoresTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle"></i> No hay proveedores en esta página
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(proveedor => `
        <tr>
            <td>${proveedor.id}</td>
            <td><strong>${proveedor.empresa}</strong></td>
            <td>${proveedor.contacto || 'N/A'}</td>
            <td>${proveedor.telefono || 'N/A'}</td>
            <td>${proveedor.email || 'N/A'}</td>
            <td><span class="badge bg-primary">${proveedor.productos || 0}</span></td>
            <td>${proveedor.ultima_compra || 'N/A'}</td>
            <td>
                <span class="badge ${proveedor.activo ? 'bg-success' : 'bg-secondary'}">
                    ${proveedor.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm" 
                            onclick="editarProveedor(${proveedor.id})"
                            title="Editar"
                            style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                        <i class="bi bi-pencil" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="verDetallesProveedor(${proveedor.id})"
                            title="Ver detalles"
                            style="background-color: #6c757d; border-color: #6c757d; color: white;">
                        <i class="bi bi-eye" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="eliminarProveedor(${proveedor.id})"
                            title="Eliminar"
                            style="background-color: #dc3545; border-color: #dc3545; color: white;">
                        <i class="bi bi-trash" style="color: white;"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

console.log('✅ Sistema de paginación completa cargado para todas las secciones');

// Funciones auxiliares para cargar datos de prueba si no están disponibles

// Datos de prueba para sedes
function getDatosPruebaSedes() {
    return [
        {
            id: 1,
            nombre: "Sede Principal",
            ciudad: "Bogotá",
            direccion: "Calle 123 #45-67",
            telefono: "601-234-5678",
            email: "principal@clinikdent.com",
            activa: true
        },
        {
            id: 2,
            nombre: "Sede Norte",
            ciudad: "Bogotá",
            direccion: "Carrera 78 #90-12",
            telefono: "601-345-6789",
            email: "norte@clinikdent.com",
            activa: true
        },
        {
            id: 3,
            nombre: "Sede Chapinero",
            ciudad: "Bogotá",
            direccion: "Avenida 15 #34-56",
            telefono: "601-456-7890",
            email: "chapinero@clinikdent.com",
            activa: false
        },
        {
            id: 4,
            nombre: "Sede Zona Rosa",
            ciudad: "Bogotá",
            direccion: "Calle 85 #12-34",
            telefono: "601-567-8901",
            email: "zonarosa@clinikdent.com",
            activa: true
        },
        {
            id: 5,
            nombre: "Sede Suba",
            ciudad: "Bogotá",
            direccion: "Diagonal 127 #67-89",
            telefono: "601-678-9012",
            email: "suba@clinikdent.com",
            activa: true
        },
        {
            id: 6,
            nombre: "Sede Kennedy",
            ciudad: "Bogotá",
            direccion: "Transversal 45 #23-45",
            telefono: "601-789-0123",
            email: "kennedy@clinikdent.com",
            activa: true
        }
    ];
}

// Datos de prueba para categorías
function getDatosPruebaCategorias() {
    return [
        {
            id: 1,
            nombre: "Instrumentos Quirúrgicos",
            descripcion: "Instrumental para procedimientos quirúrgicos dentales",
            productos: 25,
            color: "#e74c3c",
            activa: true
        },
        {
            id: 2,
            nombre: "Material de Restauración",
            descripcion: "Materiales para restauraciones dentales",
            productos: 18,
            color: "#3498db",
            activa: true
        },
        {
            id: 3,
            nombre: "Equipos de Diagnóstico",
            descripcion: "Equipos para diagnóstico dental",
            productos: 12,
            color: "#27ae60",
            activa: true
        },
        {
            id: 4,
            nombre: "Anestésicos",
            descripcion: "Productos anestésicos para procedimientos",
            productos: 8,
            color: "#9b59b6",
            activa: true
        },
        {
            id: 5,
            nombre: "Material de Impresión",
            descripcion: "Materiales para toma de impresiones",
            productos: 15,
            color: "#f39c12",
            activa: true
        },
        {
            id: 6,
            nombre: "Higiene y Desinfección",
            descripcion: "Productos de limpieza y desinfección",
            productos: 22,
            color: "#1abc9c",
            activa: true
        },
        {
            id: 7,
            nombre: "Ortodóncia",
            descripcion: "Materiales y equipos de ortodóncia",
            productos: 14,
            color: "#ff7675",
            activa: false
        },
        {
            id: 8,
            nombre: "Endodoncia",
            descripcion: "Instrumental y materiales para endodoncia",
            productos: 10,
            color: "#6c5ce7",
            activa: true
        }
    ];
}

// Datos de prueba para proveedores
function getDatosPruebaProveedores() {
    return [
        {
            id: 1,
            empresa: "DentalSupply SA",
            contacto: "María González",
            telefono: "601-111-2222",
            email: "ventas@dentalsupply.com",
            productos: 45,
            ultima_compra: "2024-01-15",
            activo: true
        },
        {
            id: 2,
            empresa: "OrthoMedical Corp",
            contacto: "Juan Pérez",
            telefono: "601-333-4444",
            email: "pedidos@orthomedical.com",
            productos: 32,
            ultima_compra: "2024-01-20",
            activo: true
        },
        {
            id: 3,
            empresa: "InstrumentDent",
            contacto: "Ana Rodríguez",
            telefono: "601-555-6666",
            email: "info@instrumentdent.com",
            productos: 28,
            ultima_compra: "2024-01-10",
            activo: true
        },
        {
            id: 4,
            empresa: "BioMaterials Ltd",
            contacto: "Carlos Silva",
            telefono: "601-777-8888",
            email: "comercial@biomaterials.com",
            productos: 38,
            ultima_compra: "2024-01-25",
            activo: true
        },
        {
            id: 5,
            empresa: "DentalTech Solutions",
            contacto: "Laura Martínez",
            telefono: "601-999-0000",
            email: "ventas@dentaltech.com",
            productos: 22,
            ultima_compra: "2023-12-15",
            activo: false
        },
        {
            id: 6,
            empresa: "ProDental Equipment",
            contacto: "Roberto López",
            telefono: "601-444-5555",
            email: "pedidos@prodental.com",
            productos: 41,
            ultima_compra: "2024-01-18",
            activo: true
        },
        {
            id: 7,
            empresa: "Global Dental Import",
            contacto: "Sandra Vargas",
            telefono: "601-666-7777",
            email: "importaciones@globaldental.com",
            productos: 35,
            ultima_compra: "2024-01-22",
            activo: true
        },
        {
            id: 8,
            empresa: "Elite Dental Supplies",
            contacto: "Miguel Torres",
            telefono: "601-888-9999",
            email: "elite@dentalsupplies.com",
            productos: 29,
            ultima_compra: "2024-01-12",
            activo: true
        }
    ];
}

// Funciones para cargar datos de prueba si las APIs no están disponibles
window.cargarSedesConPaginacion = function() {
    console.log('🏢 Cargando sedes con paginación...');
    
    // Simular llamada a API o usar datos de prueba
    setTimeout(() => {
        const sedes = getDatosPruebaSedes();
        initializePagination('sedes', sedes);
    }, 100);
};

window.cargarCategoriasConPaginacion = function() {
    console.log('🏷️ Cargando categorías con paginación...');
    
    // Simular llamada a API o usar datos de prueba
    setTimeout(() => {
        const categorias = getDatosPruebaCategorias();
        initializePagination('categorias', categorias);
    }, 100);
};

window.cargarProveedoresConPaginacion = function() {
    console.log('🏭 Cargando proveedores con paginación...');
    
    // Simular llamada a API o usar datos de prueba
    setTimeout(() => {
        const proveedores = getDatosPruebaProveedores();
        initializePagination('proveedores', proveedores);
    }, 100);
};

// Datos de prueba para las nuevas secciones
function getDatosPruebaUsuarios() {
    return [
        {id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com', rol: 'paciente', telefono: '300-123-4567', activo: true},
        {id: 2, nombre: 'María', apellido: 'González', email: 'maria@example.com', rol: 'odontologo', telefono: '300-234-5678', activo: true},
        {id: 3, nombre: 'Carlos', apellido: 'Rodríguez', email: 'carlos@example.com', rol: 'administrador', telefono: '300-345-6789', activo: true},
        {id: 4, nombre: 'Ana', apellido: 'Martínez', email: 'ana@example.com', rol: 'paciente', telefono: '300-456-7890', activo: false},
        {id: 5, nombre: 'Luis', apellido: 'Hernández', email: 'luis@example.com', rol: 'odontologo', telefono: '300-567-8901', activo: true},
        {id: 6, nombre: 'Carmen', apellido: 'López', email: 'carmen@example.com', rol: 'paciente', telefono: '300-678-9012', activo: true},
        {id: 7, nombre: 'Pedro', apellido: 'Sánchez', email: 'pedro@example.com', rol: 'asistente', telefono: '300-789-0123', activo: true},
        {id: 8, nombre: 'Laura', apellido: 'Díaz', email: 'laura@example.com', rol: 'paciente', telefono: '300-890-1234', activo: true},
        {id: 9, nombre: 'Miguel', apellido: 'Torres', email: 'miguel@example.com', rol: 'odontologo', telefono: '300-901-2345', activo: false},
        {id: 10, nombre: 'Isabel', apellido: 'Ramírez', email: 'isabel@example.com', rol: 'paciente', telefono: '300-012-3456', activo: true},
        {id: 11, nombre: 'Fernando', apellido: 'Rayo', email: 'fernando@gmail.com', rol: 'paciente', telefono: '301-111-1111', activo: true},
        {id: 12, nombre: 'Isabella', apellido: 'Rayo', email: 'isarayo@gmail.com', rol: 'odontologo', telefono: '301-222-2222', activo: true},
        {id: 13, nombre: 'Jacobo', apellido: 'Rayo', email: 'jacorayo@gmail.com', rol: 'odontologo', telefono: '301-333-3333', activo: true},
        {id: 14, nombre: 'Julián Daniel', apellido: 'Melo Melo', email: 'melojulian618@gmail.com', rol: 'administrador', telefono: '301-444-4444', activo: true},
        {id: 15, nombre: 'Tatiana', apellido: 'Rayo', email: 'tatiana@gmail.com', rol: 'paciente', telefono: '301-555-5555', activo: true},
        {id: 16, nombre: 'Alejandro', apellido: 'Morales', email: 'alejandro@example.com', rol: 'paciente', telefono: '302-123-4567', activo: true},
        {id: 17, nombre: 'Beatriz', apellido: 'Castro', email: 'beatriz@example.com', rol: 'odontologo', telefono: '302-234-5678', activo: true},
        {id: 18, nombre: 'Diego', apellido: 'Vargas', email: 'diego@example.com', rol: 'asistente', telefono: '302-345-6789', activo: true},
        {id: 19, nombre: 'Elena', apellido: 'Jiménez', email: 'elena@example.com', rol: 'paciente', telefono: '302-456-7890', activo: false},
        {id: 20, nombre: 'Francisco', apellido: 'Medina', email: 'francisco@example.com', rol: 'odontologo', telefono: '302-567-8901', activo: true},
        {id: 21, nombre: 'Gloria', apellido: 'Ruiz', email: 'gloria@example.com', rol: 'paciente', telefono: '302-678-9012', activo: true},
        {id: 22, nombre: 'Hernán', apellido: 'Delgado', email: 'hernan@example.com', rol: 'asistente', telefono: '302-789-0123', activo: true},
        {id: 23, nombre: 'Irene', apellido: 'Vega', email: 'irene@example.com', rol: 'paciente', telefono: '302-890-1234', activo: true},
        {id: 24, nombre: 'Jorge', apellido: 'Moreno', email: 'jorge@example.com', rol: 'odontologo', telefono: '302-901-2345', activo: true},
        {id: 25, nombre: 'Karina', apellido: 'Ortega', email: 'karina@example.com', rol: 'paciente', telefono: '302-012-3456', activo: false},
        {id: 26, nombre: 'Leonardo', apellido: 'Silva', email: 'leonardo@example.com', rol: 'odontologo', telefono: '303-123-4567', activo: true},
        {id: 27, nombre: 'Mónica', apellido: 'Peña', email: 'monica@example.com', rol: 'paciente', telefono: '303-234-5678', activo: true},
        {id: 28, nombre: 'Nicolás', apellido: 'Aguilar', email: 'nicolas@example.com', rol: 'asistente', telefono: '303-345-6789', activo: true},
        {id: 29, nombre: 'Olga', apellido: 'Romero', email: 'olga@example.com', rol: 'paciente', telefono: '303-456-7890', activo: true},
        {id: 30, nombre: 'Pablo', apellido: 'Guerrero', email: 'pablo@example.com', rol: 'odontologo', telefono: '303-567-8901', activo: true},
        {id: 31, nombre: 'Quetzal', apellido: 'Mendoza', email: 'quetzal@example.com', rol: 'paciente', telefono: '303-678-9012', activo: false},
        {id: 32, nombre: 'Ricardo', apellido: 'Herrera', email: 'ricardo@example.com', rol: 'odontologo', telefono: '303-789-0123', activo: true},
        {id: 33, nombre: 'Sofía', apellido: 'Campos', email: 'sofia@example.com', rol: 'paciente', telefono: '303-890-1234', activo: true},
        {id: 34, nombre: 'Tomás', apellido: 'Restrepo', email: 'tomas@example.com', rol: 'asistente', telefono: '303-901-2345', activo: true},
        {id: 35, nombre: 'Úrsula', apellido: 'Pineda', email: 'ursula@example.com', rol: 'paciente', telefono: '303-012-3456', activo: true}
    ];
}

function getDatosPruebaCitas() {
    return [
        {id: 1, paciente_nombre: 'Juan Pérez', fecha: '2024-02-01', hora: '09:00', odontologo_nombre: 'Dr. García', tratamiento: 'Limpieza dental', estado: 'programada'},
        {id: 2, paciente_nombre: 'María González', fecha: '2024-02-01', hora: '10:30', odontologo_nombre: 'Dra. López', tratamiento: 'Consulta general', estado: 'completada'},
        {id: 3, paciente_nombre: 'Carlos Rodríguez', fecha: '2024-02-02', hora: '14:00', odontologo_nombre: 'Dr. Martínez', tratamiento: 'Empaste', estado: 'en_proceso'},
        {id: 4, paciente_nombre: 'Ana Martínez', fecha: '2024-02-02', hora: '15:30', odontologo_nombre: 'Dra. Sánchez', tratamiento: 'Extracción', estado: 'programada'},
        {id: 5, paciente_nombre: 'Luis Hernández', fecha: '2024-02-03', hora: '08:30', odontologo_nombre: 'Dr. García', tratamiento: 'Ortodoncia', estado: 'cancelada'},
        {id: 6, paciente_nombre: 'Carmen López', fecha: '2024-02-03', hora: '11:00', odontologo_nombre: 'Dra. López', tratamiento: 'Blanqueamiento', estado: 'programada'},
        {id: 7, paciente_nombre: 'Pedro Sánchez', fecha: '2024-02-04', hora: '16:00', odontologo_nombre: 'Dr. Martínez', tratamiento: 'Consulta general', estado: 'programada'},
        {id: 8, paciente_nombre: 'Laura Díaz', fecha: '2024-02-04', hora: '17:30', odontologo_nombre: 'Dra. Sánchez', tratamiento: 'Limpieza dental', estado: 'completada'},
        {id: 9, paciente_nombre: 'Miguel Torres', fecha: '2024-02-05', hora: '09:30', odontologo_nombre: 'Dr. García', tratamiento: 'Endodoncia', estado: 'programada'},
        {id: 10, paciente_nombre: 'Isabel Ramírez', fecha: '2024-02-05', hora: '13:00', odontologo_nombre: 'Dra. López', tratamiento: 'Consulta general', estado: 'programada'},
        {id: 11, paciente_nombre: 'Fernando Rayo', fecha: '2024-02-06', hora: '08:00', odontologo_nombre: 'Dr. García', tratamiento: 'Revisión', estado: 'programada'},
        {id: 12, paciente_nombre: 'Isabella Rayo', fecha: '2024-02-06', hora: '09:30', odontologo_nombre: 'Dra. López', tratamiento: 'Limpieza', estado: 'completada'},
        {id: 13, paciente_nombre: 'Jacobo Rayo', fecha: '2024-02-06', hora: '11:00', odontologo_nombre: 'Dr. Martínez', tratamiento: 'Consulta', estado: 'en_proceso'},
        {id: 14, paciente_nombre: 'Tatiana Rayo', fecha: '2024-02-07', hora: '14:30', odontologo_nombre: 'Dra. Sánchez', tratamiento: 'Empaste', estado: 'programada'},
        {id: 15, paciente_nombre: 'Alejandro Morales', fecha: '2024-02-07', hora: '16:00', odontologo_nombre: 'Dr. García', tratamiento: 'Extracción', estado: 'programada'},
        {id: 16, paciente_nombre: 'Beatriz Castro', fecha: '2024-02-08', hora: '08:30', odontologo_nombre: 'Dra. López', tratamiento: 'Ortodoncia', estado: 'programada'},
        {id: 17, paciente_nombre: 'Diego Vargas', fecha: '2024-02-08', hora: '10:00', odontologo_nombre: 'Dr. Martínez', tratamiento: 'Blanqueamiento', estado: 'completada'},
        {id: 18, paciente_nombre: 'Elena Jiménez', fecha: '2024-02-08', hora: '15:30', odontologo_nombre: 'Dra. Sánchez', tratamiento: 'Consulta general', estado: 'cancelada'},
        {id: 19, paciente_nombre: 'Francisco Medina', fecha: '2024-02-09', hora: '09:00', odontologo_nombre: 'Dr. García', tratamiento: 'Endodoncia', estado: 'programada'},
        {id: 20, paciente_nombre: 'Gloria Ruiz', fecha: '2024-02-09', hora: '11:30', odontologo_nombre: 'Dra. López', tratamiento: 'Limpieza dental', estado: 'programada'},
        {id: 21, paciente_nombre: 'Héctor Soto', fecha: '2024-02-10', hora: '14:00', odontologo_nombre: 'Dr. Martínez', tratamiento: 'Revisión', estado: 'programada'},
        {id: 22, paciente_nombre: 'Irene Vega', fecha: '2024-02-10', hora: '16:30', odontologo_nombre: 'Dra. Sánchez', tratamiento: 'Consulta', estado: 'completada'}
    ];
}

function getDatosPruebaEvaluaciones() {
    return [
        {id: 1, paciente_nombre: 'Juan Pérez', fecha: '2024-01-15', calificacion: 5, odontologo_nombre: 'Dr. García', respondida: true},
        {id: 2, paciente_nombre: 'María González', fecha: '2024-01-16', calificacion: 4, odontologo_nombre: 'Dra. López', respondida: false},
        {id: 3, paciente_nombre: 'Carlos Rodríguez', fecha: '2024-01-17', calificacion: 5, odontologo_nombre: 'Dr. Martínez', respondida: true},
        {id: 4, paciente_nombre: 'Ana Martínez', fecha: '2024-01-18', calificacion: 3, odontologo_nombre: 'Dra. Sánchez', respondida: false},
        {id: 5, paciente_nombre: 'Luis Hernández', fecha: '2024-01-19', calificacion: 4, odontologo_nombre: 'Dr. García', respondida: true},
        {id: 6, paciente_nombre: 'Carmen López', fecha: '2024-01-20', calificacion: 5, odontologo_nombre: 'Dra. López', respondida: false},
        {id: 7, paciente_nombre: 'Pedro Sánchez', fecha: '2024-01-21', calificacion: 4, odontologo_nombre: 'Dr. Martínez', respondida: true},
        {id: 8, paciente_nombre: 'Laura Díaz', fecha: '2024-01-22', calificacion: 5, odontologo_nombre: 'Dra. Sánchez', respondida: false},
        {id: 9, paciente_nombre: 'Fernando Rayo', fecha: '2024-01-23', calificacion: 4, odontologo_nombre: 'Dr. García', respondida: true},
        {id: 10, paciente_nombre: 'Isabella Rayo', fecha: '2024-01-24', calificacion: 5, odontologo_nombre: 'Dra. López', respondida: false},
        {id: 11, paciente_nombre: 'Jacobo Rayo', fecha: '2024-01-25', calificacion: 4, odontologo_nombre: 'Dr. Martínez', respondida: true},
        {id: 12, paciente_nombre: 'Tatiana Rayo', fecha: '2024-01-26', calificacion: 5, odontologo_nombre: 'Dra. Sánchez', respondida: false},
        {id: 13, paciente_nombre: 'Alejandro Morales', fecha: '2024-01-27', calificacion: 3, odontologo_nombre: 'Dr. García', respondida: true},
        {id: 14, paciente_nombre: 'Beatriz Castro', fecha: '2024-01-28', calificacion: 4, odontologo_nombre: 'Dra. López', respondida: false},
        {id: 15, paciente_nombre: 'Diego Vargas', fecha: '2024-01-29', calificacion: 5, odontologo_nombre: 'Dr. Martínez', respondida: true}
    ];
}

function getDatosPruebaFaqs() {
    return [
        {id: 1, pregunta: '¿Cuáles son los horarios de atención?', categoria: 'Información General', activa: true},
        {id: 2, pregunta: '¿Cómo puedo agendar una cita?', categoria: 'Citas', activa: true},
        {id: 3, pregunta: '¿Qué métodos de pago aceptan?', categoria: 'Pagos', activa: true},
        {id: 4, pregunta: '¿Con cuánta anticipación debo cancelar?', categoria: 'Citas', activa: true},
        {id: 5, pregunta: '¿Ofrecen tratamientos de ortodoncia?', categoria: 'Tratamientos', activa: true},
        {id: 6, pregunta: '¿Tienen sede en otras ciudades?', categoria: 'Información General', activa: false},
        {id: 7, pregunta: '¿Cuánto cuesta una limpieza dental?', categoria: 'Precios', activa: true},
        {id: 8, pregunta: '¿Atienden emergencias dentales?', categoria: 'Emergencias', activa: true},
        {id: 9, pregunta: '¿Qué documentos necesito para la primera cita?', categoria: 'Información General', activa: true},
        {id: 10, pregunta: '¿Hacen tratamientos de implantes dentales?', categoria: 'Tratamientos', activa: true},
        {id: 11, pregunta: '¿Cuánto tiempo dura una consulta?', categoria: 'Citas', activa: true},
        {id: 12, pregunta: '¿Ofrecen descuentos para estudiantes?', categoria: 'Precios', activa: true},
        {id: 13, pregunta: '¿Qué hacer en caso de dolor post-tratamiento?', categoria: 'Emergencias', activa: true},
        {id: 14, pregunta: '¿Aceptan seguros médicos?', categoria: 'Pagos', activa: true},
        {id: 15, pregunta: '¿Cuál es la edad mínima para ortodoncia?', categoria: 'Tratamientos', activa: true}
    ];
}

function getDatosPruebaReportes() {
    return [
        {id: 'ventas-mensual', titulo: 'Reporte de Ventas Mensual', descripcion: 'Análisis de ingresos y ventas del mes', categoria: 'financiero', icono: 'bi-graph-up'},
        {id: 'pacientes-nuevos', titulo: 'Pacientes Nuevos', descripcion: 'Estadísticas de pacientes registrados', categoria: 'pacientes', icono: 'bi-person-plus'},
        {id: 'tratamientos-populares', titulo: 'Tratamientos Más Solicitados', descripcion: 'Ranking de tratamientos más demandados', categoria: 'tratamientos', icono: 'bi-star'},
        {id: 'citas-canceladas', titulo: 'Análisis de Cancelaciones', descripcion: 'Estadísticas de citas canceladas', categoria: 'citas', icono: 'bi-calendar-x'},
        {id: 'ingresos-odontologo', titulo: 'Ingresos por Odontólogo', descripcion: 'Rendimiento financiero por profesional', categoria: 'financiero', icono: 'bi-cash'},
        {id: 'inventario-rotacion', titulo: 'Rotación de Inventario', descripcion: 'Análisis de movimiento de productos', categoria: 'inventario', icono: 'bi-box-seam'},
        {id: 'satisfaccion-cliente', titulo: 'Satisfacción del Cliente', descripcion: 'Análisis de evaluaciones y comentarios', categoria: 'calidad', icono: 'bi-emoji-smile'},
        {id: 'horarios-ocupacion', titulo: 'Ocupación por Horarios', descripcion: 'Estadísticas de uso de horarios', categoria: 'operativo', icono: 'bi-clock'},
        {id: 'pagos-pendientes', titulo: 'Pagos Pendientes', descripcion: 'Análisis de cuentas por cobrar', categoria: 'financiero', icono: 'bi-exclamation-triangle'},
        {id: 'efectividad-tratamientos', titulo: 'Efectividad de Tratamientos', descripcion: 'Seguimiento de resultados por tratamiento', categoria: 'tratamientos', icono: 'bi-check-circle'},
        {id: 'gastos-operativos', titulo: 'Gastos Operativos', descripcion: 'Análisis de costos operacionales', categoria: 'financiero', icono: 'bi-calculator'},
        {id: 'personal-productividad', titulo: 'Productividad del Personal', descripcion: 'Rendimiento del equipo de trabajo', categoria: 'recursos-humanos', icono: 'bi-people'},
        {id: 'equipos-mantenimiento', titulo: 'Mantenimiento de Equipos', descripcion: 'Programación y seguimiento de mantenimientos', categoria: 'inventario', icono: 'bi-tools'},
        {id: 'marketing-efectividad', titulo: 'Efectividad de Marketing', descripcion: 'ROI de campañas de marketing', categoria: 'marketing', icono: 'bi-megaphone'},
        {id: 'analisis-competencia', titulo: 'Análisis de Competencia', descripcion: 'Comparativo con el mercado', categoria: 'estrategico', icono: 'bi-graph-up-arrow'}
    ];
}

function getDatosPruebaPagos() {
    return [
        {id: 1, paciente_nombre: 'Juan Pérez', monto: 150000, fecha: '2024-01-15', metodo_pago: 'Efectivo', estado: 'completado', concepto: 'Limpieza dental'},
        {id: 2, paciente_nombre: 'María González', monto: 350000, fecha: '2024-01-16', metodo_pago: 'Tarjeta', estado: 'completado', concepto: 'Empaste'},
        {id: 3, paciente_nombre: 'Carlos Rodríguez', monto: 800000, fecha: '2024-01-17', metodo_pago: 'Transferencia', estado: 'pendiente', concepto: 'Ortodoncia'},
        {id: 4, paciente_nombre: 'Ana Martínez', monto: 200000, fecha: '2024-01-18', metodo_pago: 'Efectivo', estado: 'completado', concepto: 'Consulta'},
        {id: 5, paciente_nombre: 'Luis Hernández', monto: 450000, fecha: '2024-01-19', metodo_pago: 'Tarjeta', estado: 'procesando', concepto: 'Blanqueamiento'},
        {id: 6, paciente_nombre: 'Carmen López', monto: 120000, fecha: '2024-01-20', metodo_pago: 'Efectivo', estado: 'completado', concepto: 'Consulta'},
        {id: 7, paciente_nombre: 'Pedro Sánchez', monto: 600000, fecha: '2024-01-21', metodo_pago: 'Transferencia', estado: 'completado', concepto: 'Endodoncia'},
        {id: 8, paciente_nombre: 'Laura Díaz', monto: 180000, fecha: '2024-01-22', metodo_pago: 'Tarjeta', estado: 'cancelado', concepto: 'Limpieza dental'},
        {id: 9, paciente_nombre: 'Fernando Rayo', monto: 250000, fecha: '2024-01-23', metodo_pago: 'Efectivo', estado: 'completado', concepto: 'Revisión'},
        {id: 10, paciente_nombre: 'Isabella Rayo', monto: 320000, fecha: '2024-01-24', metodo_pago: 'Tarjeta', estado: 'completado', concepto: 'Limpieza'},
        {id: 11, paciente_nombre: 'Jacobo Rayo', monto: 180000, fecha: '2024-01-25', metodo_pago: 'Transferencia', estado: 'pendiente', concepto: 'Consulta'},
        {id: 12, paciente_nombre: 'Tatiana Rayo', monto: 420000, fecha: '2024-01-26', metodo_pago: 'Efectivo', estado: 'completado', concepto: 'Empaste'},
        {id: 13, paciente_nombre: 'Alejandro Morales', monto: 680000, fecha: '2024-01-27', metodo_pago: 'Tarjeta', estado: 'procesando', concepto: 'Extracción'},
        {id: 14, paciente_nombre: 'Beatriz Castro', monto: 950000, fecha: '2024-01-28', metodo_pago: 'Transferencia', estado: 'completado', concepto: 'Ortodoncia'},
        {id: 15, paciente_nombre: 'Diego Vargas', monto: 380000, fecha: '2024-01-29', metodo_pago: 'Efectivo', estado: 'completado', concepto: 'Blanqueamiento'},
        {id: 16, paciente_nombre: 'Elena Jiménez', monto: 220000, fecha: '2024-01-30', metodo_pago: 'Tarjeta', estado: 'cancelado', concepto: 'Consulta'}
    ];
}

// Funciones para cargar datos con paginación para las nuevas secciones
window.cargarUsuariosConPaginacion = function() {
    console.log('👥 Cargando usuarios con paginación...');
    setTimeout(() => {
        const usuarios = getDatosPruebaUsuarios();
        initializePagination('usuarios', usuarios);
    }, 100);
};

window.cargarCitasConPaginacion = function() {
    console.log('📅 Cargando citas con paginación...');
    setTimeout(() => {
        const citas = getDatosPruebaCitas();
        initializePagination('citas', citas);
    }, 100);
};

window.cargarEvaluacionesConPaginacion = function() {
    console.log('⭐ Cargando evaluaciones con paginación...');
    setTimeout(() => {
        const evaluaciones = getDatosPruebaEvaluaciones();
        initializePagination('evaluaciones', evaluaciones);
    }, 100);
};

window.cargarFaqsConPaginacion = function() {
    console.log('❓ Cargando FAQs con paginación...');
    setTimeout(() => {
        const faqs = getDatosPruebaFaqs();
        initializePagination('faqs', faqs);
    }, 100);
};

window.cargarReportesConPaginacion = function() {
    console.log('📊 Cargando reportes con paginación...');
    setTimeout(() => {
        const reportes = getDatosPruebaReportes();
        initializePagination('reportes', reportes);
    }, 100);
};

window.cargarPagosConPaginacion = function() {
    console.log('💰 Cargando pagos con paginación...');
    setTimeout(() => {
        const pagos = getDatosPruebaPagos();
        initializePagination('pagos', pagos);
    }, 100);
};

// Funciones de renderizado para las nuevas secciones
function renderUsuariosPage(data) {
    const tbody = document.getElementById('usuariosTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle"></i> No hay usuarios en esta página
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(usuario => `
        <tr>
            <td>${usuario.id}</td>
            <td><strong>${usuario.nombre} ${usuario.apellido || ''}</strong></td>
            <td>${usuario.email}</td>
            <td>
                <span class="badge bg-info">${usuario.rol || 'paciente'}</span>
            </td>
            <td>${usuario.telefono || 'N/A'}</td>
            <td>
                <span class="badge ${usuario.activo ? 'bg-success' : 'bg-secondary'}">
                    ${usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm" 
                            onclick="editarUsuario(${usuario.id})"
                            title="Editar"
                            style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                        <i class="bi bi-pencil" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="verDetallesUsuario(${usuario.id})"
                            title="Ver detalles"
                            style="background-color: #6c757d; border-color: #6c757d; color: white;">
                        <i class="bi bi-eye" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="eliminarUsuario(${usuario.id})"
                            title="Eliminar"
                            style="background-color: #dc3545; border-color: #dc3545; color: white;">
                        <i class="bi bi-trash" style="color: white;"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderCitasPage(data) {
    const tbody = document.getElementById('citasTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle"></i> No hay citas en esta página
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(cita => `
        <tr>
            <td>${cita.id}</td>
            <td><strong>${cita.paciente_nombre || 'N/A'}</strong></td>
            <td>${cita.fecha || 'N/A'}</td>
            <td>${cita.hora || 'N/A'}</td>
            <td>${cita.odontologo_nombre || 'N/A'}</td>
            <td>${cita.tratamiento || 'Consulta General'}</td>
            <td>
                <span class="badge ${getEstadoCitaClass(cita.estado)}">
                    ${cita.estado || 'Programada'}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm" 
                            onclick="editarCita(${cita.id})"
                            title="Editar"
                            style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                        <i class="bi bi-pencil" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="verDetallesCita(${cita.id})"
                            title="Ver detalles"
                            style="background-color: #6c757d; border-color: #6c757d; color: white;">
                        <i class="bi bi-eye" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="cancelarCita(${cita.id})"
                            title="Cancelar"
                            style="background-color: #dc3545; border-color: #dc3545; color: white;">
                        <i class="bi bi-x-circle" style="color: white;"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderEvaluacionesPage(data) {
    const tbody = document.getElementById('evaluacionesTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle"></i> No hay evaluaciones en esta página
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(evaluacion => `
        <tr>
            <td>${evaluacion.id}</td>
            <td><strong>${evaluacion.paciente_nombre || 'N/A'}</strong></td>
            <td>${evaluacion.fecha || 'N/A'}</td>
            <td>
                <div class="d-flex align-items-center">
                    ${renderStars(evaluacion.calificacion || 0)}
                    <span class="ms-2">${evaluacion.calificacion || 0}/5</span>
                </div>
            </td>
            <td>${evaluacion.odontologo_nombre || 'N/A'}</td>
            <td>
                <span class="badge ${evaluacion.respondida ? 'bg-success' : 'bg-warning'}">
                    ${evaluacion.respondida ? 'Respondida' : 'Pendiente'}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm" 
                            onclick="verEvaluacion(${evaluacion.id})"
                            title="Ver detalles"
                            style="background-color: #6c757d; border-color: #6c757d; color: white;">
                        <i class="bi bi-eye" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="responderEvaluacion(${evaluacion.id})"
                            title="Responder"
                            style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                        <i class="bi bi-reply" style="color: white;"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderFaqsPage(data) {
    const tbody = document.getElementById('faqsTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle"></i> No hay FAQs en esta página
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(faq => `
        <tr>
            <td>${faq.id}</td>
            <td><strong>${faq.pregunta}</strong></td>
            <td>
                <span class="badge bg-info">${faq.categoria || 'General'}</span>
            </td>
            <td>
                <span class="badge ${faq.activa ? 'bg-success' : 'bg-secondary'}">
                    ${faq.activa ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm" 
                            onclick="editarFaq(${faq.id})"
                            title="Editar"
                            style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                        <i class="bi bi-pencil" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="verFaq(${faq.id})"
                            title="Ver detalles"
                            style="background-color: #6c757d; border-color: #6c757d; color: white;">
                        <i class="bi bi-eye" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="eliminarFaq(${faq.id})"
                            title="Eliminar"
                            style="background-color: #dc3545; border-color: #dc3545; color: white;">
                        <i class="bi bi-trash" style="color: white;"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderReportesPage(data) {
    const container = document.getElementById('reportesGrid');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> No hay reportes en esta página
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = data.map(reporte => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">
                            <i class="bi ${reporte.icono || 'bi-graph-up'}"></i> ${reporte.titulo}
                        </h6>
                        <span class="badge ${reporte.categoria === 'financiero' ? 'bg-success' : reporte.categoria === 'pacientes' ? 'bg-info' : 'bg-primary'}">
                            ${reporte.categoria || 'General'}
                        </span>
                    </div>
                    <p class="card-text text-muted">${reporte.descripcion || 'Sin descripción'}</p>
                    <div class="mt-3">
                        <button class="btn btn-sm btn-primary me-1" 
                                onclick="generarReporte('${reporte.id}')"
                                title="Generar reporte">
                            <i class="bi bi-play-circle"></i> Generar
                        </button>
                        <button class="btn btn-sm" 
                                onclick="configurarReporte('${reporte.id}')"
                                title="Configurar"
                                style="background-color: #6c757d; border-color: #6c757d; color: white;">
                            <i class="bi bi-gear" style="color: white;"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPagosPage(data) {
    const tbody = document.getElementById('pagosTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle"></i> No hay pagos en esta página
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(pago => `
        <tr>
            <td>${pago.id}</td>
            <td><strong>${pago.paciente_nombre || 'N/A'}</strong></td>
            <td>$${pago.monto ? Number(pago.monto).toLocaleString() : '0'}</td>
            <td>${pago.fecha || 'N/A'}</td>
            <td>
                <span class="badge bg-info">${pago.metodo_pago || 'Efectivo'}</span>
            </td>
            <td>
                <span class="badge ${getEstadoPagoClass(pago.estado)}">
                    ${pago.estado || 'Completado'}
                </span>
            </td>
            <td>${pago.concepto || 'Tratamiento dental'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm" 
                            onclick="editarPago(${pago.id})"
                            title="Editar"
                            style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                        <i class="bi bi-pencil" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="verFactura(${pago.id})"
                            title="Ver factura"
                            style="background-color: #6c757d; border-color: #6c757d; color: white;">
                        <i class="bi bi-receipt" style="color: white;"></i>
                    </button>
                    <button class="btn btn-sm" 
                            onclick="imprimirPago(${pago.id})"
                            title="Imprimir"
                            style="background-color: #28a745; border-color: #28a745; color: white;">
                        <i class="bi bi-printer" style="color: white;"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Funciones auxiliares
function getEstadoCitaClass(estado) {
    switch (estado) {
        case 'completada': return 'bg-success';
        case 'cancelada': return 'bg-danger';
        case 'en_proceso': return 'bg-warning';
        case 'programada': return 'bg-primary';
        default: return 'bg-secondary';
    }
}

function getEstadoPagoClass(estado) {
    switch (estado) {
        case 'completado': return 'bg-success';
        case 'pendiente': return 'bg-warning';
        case 'cancelado': return 'bg-danger';
        case 'procesando': return 'bg-info';
        default: return 'bg-secondary';
    }
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="bi bi-star-fill text-warning"></i>';
        } else if (i === fullStars && hasHalfStar) {
            stars += '<i class="bi bi-star-half text-warning"></i>';
        } else {
            stars += '<i class="bi bi-star text-muted"></i>';
        }
    }
    
    return stars;
}

// Funciones globales para la administración de paginación
function goToPageAdmin(section, page) {
    const module = window.paginationModules[section];
    if (!module || page < 1 || page > module.totalPages) return;
    
    module.currentPage = page;
    updatePagination(section);
    renderCurrentPage(section);
}

function initializePaginationAdmin(section) {
    const module = window.paginationModules[section];
    if (!module) {
        console.error(`Sección ${section} no encontrada en paginationModules`);
        return;
    }
    
    console.log(`🔄 Inicializando paginación para: ${section}`);
    
    // ⚠️ DESHABILITADO: No usar datos de prueba para secciones que ya tienen datos reales
    if (['citas', 'pagos', 'faqs', 'evaluaciones', 'inventario'].includes(section)) {
        console.log(`⚠️ Datos de prueba para ${section} deshabilitados - usando solo datos reales de la API`);
        return;
    }
    
    // Usar datos de prueba según la sección (solo para secciones sin datos reales)
    let data = [];
    switch (section) {
        case 'usuarios':
            data = getDatosPruebaUsuarios();
            break;
        case 'evaluaciones':
            data = getDatosPruebaEvaluaciones();
            break;
        case 'faqs':
            data = getDatosPruebaFaqs();
            break;
        case 'reportes':
            data = getDatosPruebaReportes();
            break;
        case 'pagos':
            data = getDatosPruebaPagos();
            break;
        default:
            console.warn(`No hay datos de prueba definidos para la sección: ${section}`);
            return;
    }
    
    // Inicializar con los datos
    initializePagination(section, data);
    console.log(`✅ Paginación inicializada para ${section} con ${data.length} elementos`);
}

function loadDataAdmin(section) {
    console.log(`📊 Cargando datos para: ${section}`);
    initializePaginationAdmin(section);
}