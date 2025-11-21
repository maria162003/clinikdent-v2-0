// Funciones helper de autenticación
function getUserId() {
    // Primero intenta obtener del localStorage directamente
    const userId = localStorage.getItem('userId');
    if (userId) return userId;
    
    // Si no, intenta obtenerlo del objeto user
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userObj = JSON.parse(user);
            return userObj.id || '1';
        } catch (e) {
            console.warn('Error parsing user object:', e);
        }
    }
    
    // Valor por defecto
    return '1';
}

// Función para obtener headers de autenticación consistentes
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'user-id': getUserId() || '1'
    };
}

// Función para hacer peticiones autenticadas
async function authFetch(url, options = {}) {
    const headers = getAuthHeaders();
    
    return fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    });
}

// Dashboard Odontologo JavaScript
class DashboardOdontologo {
    constructor() {
        this.currentSection = 'dashboard';
        this.pacientes = [];
        this.citas = [];
        this.historiales = [];
        this.agenda = [];
        this.charts = {};
        
        // Pagination configuration
        this.pagination = {
            historiales: { currentPage: 1, itemsPerPage: 10, totalItems: 0 },
            pacientes: { currentPage: 1, itemsPerPage: 10, totalItems: 0 },
            citas: { currentPage: 1, itemsPerPage: 10, totalItems: 0 },
            comisiones: { currentPage: 1, itemsPerPage: 10, totalItems: 0 },
            facturas: { currentPage: 1, itemsPerPage: 10, totalItems: 0 }
        };
        
        this.init();
    }

    // Breadcrumb functionality
    updateBreadcrumb(sectionName) {
        const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
        const breadcrumbIcon = document.getElementById('breadcrumbIcon');
        
        const sectionConfig = {
            dashboard: { name: 'Inicio', icon: 'bi-house' },
            agenda: { name: 'Mi Agenda', icon: 'bi-calendar-week' },
            pacientes: { name: 'Mis Pacientes', icon: 'bi-people' },
            historiales: { name: 'Historiales Clínicos', icon: 'bi-clipboard2-pulse' },
            miscitas: { name: 'Mis Citas', icon: 'bi-calendar-check' },
            pagos: { name: 'Mis Ingresos', icon: 'bi-currency-dollar' },
            perfil: { name: 'Mi Perfil', icon: 'bi-person-circle' }
        };
        
        if (breadcrumbCurrent && breadcrumbIcon && sectionConfig[sectionName]) {
            breadcrumbCurrent.textContent = sectionConfig[sectionName].name;
            breadcrumbIcon.className = `bi ${sectionConfig[sectionName].icon} me-1`;
        }
        
        this.currentSection = sectionName;
    }

    // Generic pagination functionality
    generatePagination(section, totalItems) {
        const config = this.pagination[section];
        if (!config) return;
        
        config.totalItems = totalItems;
        const totalPages = Math.ceil(totalItems / config.itemsPerPage);
        
        // Update pagination info
        const showingElement = document.getElementById(`${section}Showing`);
        const totalElement = document.getElementById(`${section}Total`);
        const currentPageElement = document.getElementById(`${section}CurrentPage`);
        const totalPagesElement = document.getElementById(`${section}TotalPages`);
        const itemsPerPageSelect = document.getElementById(`${section}ItemsPerPage`);
        const paginationInfo = document.getElementById(`${section}PaginationInfo`);
        const paginationControls = document.getElementById(`${section}Pagination`);
        
        // Update showing information
        if (showingElement && totalElement) {
            const startItem = totalItems > 0 ? (config.currentPage - 1) * config.itemsPerPage + 1 : 0;
            const endItem = Math.min(config.currentPage * config.itemsPerPage, totalItems);
            
            showingElement.textContent = totalItems > 0 ? `${startItem}-${endItem}` : '0';
            totalElement.textContent = totalItems;
        }
        
        // Update page information
        if (currentPageElement) {
            currentPageElement.textContent = totalPages > 0 ? config.currentPage : 1;
        }
        if (totalPagesElement) {
            totalPagesElement.textContent = Math.max(1, totalPages);
        }
        
        // Update items per page selector
        if (itemsPerPageSelect && itemsPerPageSelect.value != config.itemsPerPage) {
            itemsPerPageSelect.value = config.itemsPerPage;
        }
        
        // Show/hide pagination elements
        if (paginationInfo) {
            paginationInfo.style.display = totalItems > 0 ? 'flex' : 'none';
            console.log(`📄 Pagination info for ${section}: ${totalItems} items, display: ${totalItems > 0 ? 'flex' : 'none'}`);
        }
        
        if (paginationControls) {
            // Show pagination controls even with single page to show navigation
            paginationControls.style.display = totalItems > 0 ? 'flex' : 'none';
            console.log(`📄 Pagination controls for ${section}: ${totalPages} pages, display: ${totalItems > 0 ? 'flex' : 'none'}`);
        }
        
        // Generate pagination buttons
        const paginationList = document.getElementById(`${section}PaginationList`);
        if (!paginationList) return;
        
        paginationList.innerHTML = '';
        
        if (totalPages === 0) return;
        
        // Previous button
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${config.currentPage === 1 ? 'disabled' : ''}`;
        prevItem.innerHTML = `<a class="page-link" href="#" onclick="dashboardOdontologo.changePage('${section}', ${config.currentPage - 1})">Anterior</a>`;
        paginationList.appendChild(prevItem);
        
        // Page numbers
        const startPage = Math.max(1, config.currentPage - 2);
        const endPage = Math.min(totalPages, config.currentPage + 2);
        
        if (startPage > 1) {
            const firstItem = document.createElement('li');
            firstItem.className = 'page-item';
            firstItem.innerHTML = `<a class="page-link" href="#" onclick="dashboardOdontologo.changePage('${section}', 1)">1</a>`;
            paginationList.appendChild(firstItem);
            
            if (startPage > 2) {
                const dotsItem = document.createElement('li');
                dotsItem.className = 'page-item disabled';
                dotsItem.innerHTML = '<span class="page-link">...</span>';
                paginationList.appendChild(dotsItem);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === config.currentPage ? 'active' : ''}`;
            pageItem.innerHTML = `<a class="page-link" href="#" onclick="dashboardOdontologo.changePage('${section}', ${i})">${i}</a>`;
            paginationList.appendChild(pageItem);
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dotsItem = document.createElement('li');
                dotsItem.className = 'page-item disabled';
                dotsItem.innerHTML = '<span class="page-link">...</span>';
                paginationList.appendChild(dotsItem);
            }
            
            const lastItem = document.createElement('li');
            lastItem.className = 'page-item';
            lastItem.innerHTML = `<a class="page-link" href="#" onclick="dashboardOdontologo.changePage('${section}', ${totalPages})">${totalPages}</a>`;
            paginationList.appendChild(lastItem);
        }
        
        // Next button
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${config.currentPage === totalPages ? 'disabled' : ''}`;
        nextItem.innerHTML = `<a class="page-link" href="#" onclick="dashboardOdontologo.changePage('${section}', ${config.currentPage + 1})">Siguiente</a>`;
        paginationList.appendChild(nextItem);
    }

    // Change page handler
    changePage(section, page) {
        const config = this.pagination[section];
        if (!config) return;
        
        const totalPages = Math.ceil(config.totalItems / config.itemsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        config.currentPage = page;
        
        // Reload data for specific section
        switch (section) {
            case 'historiales':
                this.renderHistorialesTable();
                break;
            case 'pacientes':
                this.loadPacientes();
                break;
            case 'citas':
                this.loadMisCitas();
                break;
            case 'comisiones':
                this.loadComisiones();
                break;
            case 'facturas':
                this.loadFacturas();
                break;
        }
    }

    // Change items per page handler
    changeItemsPerPage(section, newItemsPerPage) {
        const config = this.pagination[section];
        if (!config) return;
        
        const itemsPerPage = parseInt(newItemsPerPage);
        if (itemsPerPage < 1) return;
        
        // Calculate current position to maintain roughly the same view
        const currentFirstItem = (config.currentPage - 1) * config.itemsPerPage + 1;
        
        // Update items per page
        config.itemsPerPage = itemsPerPage;
        
        // Calculate new page number to show similar items
        config.currentPage = Math.max(1, Math.ceil(currentFirstItem / itemsPerPage));
        
        console.log(`📄 Changed items per page for ${section}: ${itemsPerPage} items per page, new page: ${config.currentPage}`);
        
        // Reload data for specific section
        switch (section) {
            case 'historiales':
                this.renderHistorialesTable();
                break;
            case 'pacientes':
                this.loadPacientes();
                break;
            case 'citas':
                this.loadMisCitas();
                break;
            case 'comisiones':
                this.loadComisiones();
                break;
            case 'facturas':
                this.loadFacturas();
                break;
        }
    }

    // Función utilitaria para formatear fechas de manera robusta
    formatearFecha(fechaData, opciones = {}) {
        try {
            if (!fechaData) return 'Fecha no especificada';
            
            let fecha;
            
            // Si ya es un objeto Date válido
            if (fechaData instanceof Date && !isNaN(fechaData.getTime())) {
                fecha = fechaData;
            }
            // Si es string en formato ISO (2025-09-26T05:00:00.000Z)
            else if (typeof fechaData === 'string') {
                // Si contiene T, es formato ISO
                if (fechaData.includes('T')) {
                    fecha = new Date(fechaData);
                }
                // Si es solo fecha (2025-09-26)
                else if (fechaData.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    fecha = new Date(fechaData + 'T00:00:00');
                }
                // Otros formatos de string
                else {
                    fecha = new Date(fechaData);
                }
            }
            // Si es timestamp
            else if (typeof fechaData === 'number') {
                fecha = new Date(fechaData);
            }
            
            // Verificar que la fecha sea válida
            if (!fecha || isNaN(fecha.getTime())) {
                console.warn('Fecha inválida recibida:', fechaData);
                return 'Fecha inválida';
            }
            
            // Opciones por defecto
            const opcionesPorDefecto = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                ...opciones
            };
            
            return fecha.toLocaleDateString('es-ES', opcionesPorDefecto);
            
        } catch (error) {
            console.warn('Error al formatear fecha:', error, 'Fecha recibida:', fechaData);
            return 'Error en fecha';
        }
    }

    // Función utilitaria para formatear la hora de manera robusta
    formatearHora(horaData) {
        try {
            if (!horaData) return 'No especificada';
            
            // Si viene como string de tiempo (HH:MM:SS), extraer solo HH:MM
            if (typeof horaData === 'string' && horaData.includes(':')) {
                const timeParts = horaData.split(':');
                return `${timeParts[0]}:${timeParts[1]}`;
            }
            
            // Si viene como Date object
            if (horaData instanceof Date && !isNaN(horaData.getTime())) {
                return horaData.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            // Intentar parsear como hora
            const parsedTime = new Date(`1970-01-01T${horaData}`);
            if (!isNaN(parsedTime.getTime())) {
                return parsedTime.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            return 'No especificada';
        } catch (error) {
            console.warn('Error al formatear hora:', error, 'Hora recibida:', horaData);
            return 'No especificada';
        }
    }

    init() {
        this.setupEventListeners();
        this.loadUserInfo();
        this.loadDashboardData();
        this.loadNotifications();
        this.initializeCharts();
        this.setupSecurityMeasures();
        this.initializePaginationForSections();
    }

    // Initialize pagination for all sections to show controls
    initializePaginationForSections() {
        // Initialize with sample data counts to show pagination controls
        this.generatePagination('historiales', 15); // Example: 15 historiales
        this.generatePagination('pacientes', 25);   // Example: 25 pacientes  
        this.generatePagination('citas', 30);       // Example: 30 citas
        this.generatePagination('comisiones', 12);  // Example: 12 comisiones
        this.generatePagination('facturas', 8);     // Example: 8 facturas
        
        console.log('📄 Initialized pagination for all sections');
    }

    setupSecurityMeasures() {
        // Prevenir el acceso mediante botón atrás después del logout
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                // La página se cargó desde el cache del navegador
                this.checkAuthStatus();
            }
        });

        // Verificar estado de autenticación al cargar la página
        this.checkAuthStatus();

        // Manejar el evento popstate (botón atrás/adelante)
        window.addEventListener('popstate', () => {
            this.checkAuthStatus();
        });
    }

    checkAuthStatus() {
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        
        if (!userId || userRole !== 'odontologo') {
            console.log('❌ Usuario no autenticado o rol incorrecto');
            this.redirectToLogin();
        }
    }

    clearSession() {
        localStorage.clear();
        sessionStorage.clear();
    }

    redirectToLogin() {
        // Limpiar cualquier dato de sesión
        this.clearSession();
        
        // Reemplazar la entrada actual del historial para prevenir regreso
        window.location.replace('/index.html?session=expired');
    }

    // Método helper para hacer requests autenticadas
    async authFetch(url, options = {}) {
        const defaultOptions = {
            headers: getAuthHeaders(),
            ...options
        };
        
        // Si se proporcionan headers adicionales, combinarlos
        if (options.headers) {
            defaultOptions.headers = { ...defaultOptions.headers, ...options.headers };
        }
        
        try {
            const response = await fetch(url, defaultOptions);
            return response;
        } catch (error) {
            console.error(`Error en authFetch para ${url}:`, error);
            throw error;
        }
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    this.showSection(section);
                    this.updateActiveNav(link);
                }
            });
        });

        // Mobile sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggleMobile');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('show');
            });
        }

        // Modal events
        this.setupModalEvents();

        // Form events
        this.setupFormEvents();

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    setupModalEvents() {
        // Nuevo historial button
        document.getElementById('nuevoHistorialBtn').addEventListener('click', () => {
            this.openHistorialModal();
        });

        // Save historial button
        document.getElementById('saveHistorialBtn').addEventListener('click', () => {
            this.saveHistorial();
        });
    }

    setupFormEvents() {
        // Search functionality
        const searchPaciente = document.getElementById('searchPaciente');
        if (searchPaciente) {
            searchPaciente.addEventListener('input', (e) => {
                this.filterPacientes(e.target.value);
            });
        }

        // Agenda date filter
        const fechaAgenda = document.getElementById('fechaAgenda');
        const verAgendaBtn = document.getElementById('verAgendaBtn');
        const verTodasCitasBtn = document.getElementById('verTodasCitasBtn');
        
        if (fechaAgenda) {
            fechaAgenda.value = new Date().toISOString().split('T')[0];
        }
        
        if (verAgendaBtn) {
            verAgendaBtn.addEventListener('click', () => {
                const fecha = fechaAgenda.value;
                if (fecha) {
                    this.loadAgenda(fecha);
                    this.updateResumenDia(fecha);
                } else {
                    alert('Por favor selecciona una fecha');
                }
            });
        }

        if (verTodasCitasBtn) {
            verTodasCitasBtn.addEventListener('click', () => {
                this.loadAgenda(); // Sin parámetro para ver todas
                this.updateResumenDia();
            });
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Update page title
            document.getElementById('pageTitle').textContent = this.getSectionTitle(sectionName);
            
            // Show breadcrumb container for non-dashboard sections
            const breadcrumbContainer = document.getElementById('breadcrumbContainer');
            if (breadcrumbContainer) {
                if (sectionName === 'dashboard') {
                    breadcrumbContainer.style.display = 'none';
                } else {
                    breadcrumbContainer.style.display = 'block';
                }
            }
            
            // Update breadcrumb
            this.updateBreadcrumb(sectionName);
            
            // Load section data
            this.loadSectionData(sectionName);
        }
    }

    updateActiveNav(activeLink) {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    getSectionTitle(section) {
        const titles = {
            dashboard: 'Inicio',
            agenda: 'Mi Agenda',
            pacientes: 'Mis Pacientes',
            historiales: 'Historiales Clínicos',
            miscitas: 'Mis Citas',
            perfil: 'Mi Información Personal'
        };
        return titles[section] || 'Inicio';
    }

    async loadUserInfo() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.log('No hay usuario logueado');
                window.location.href = '/index.html';
                return;
            }

            const response = await authFetch(`/api/usuarios/${userId}/perfil`);
            if (!response.ok) {
                throw new Error('Error al obtener perfil del usuario');
            }

            const userInfo = await response.json();// Actualizar nombre en la interfaz
            document.getElementById('userName').textContent = `Dr. ${userInfo.nombre} ${userInfo.apellido}`;
            
            // Almacenar información del usuario para uso posterior
            this.currentUser = userInfo;
            
        } catch (error) {
            console.error('Error loading user info:', error);
            // En caso de error, redirigir al login
            window.location.href = '/index.html';
        }
    }

    async loadDashboardData() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.log('No hay usuario logueado');
                return;
            }

            // Cargar estadísticas reales de citas del odontólogo
            await this.calculateDashboardStats(userId);
            
            // Cargar agenda y próximos pacientes con datos reales
            this.loadAgendaHoy();
            this.loadProximosPacientes();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Mostrar datos por defecto en caso de error
            document.getElementById('citasHoy').textContent = '0';
            document.getElementById('pacientesAtendidos').textContent = '0';
            document.getElementById('citasPendientes').textContent = '0';
        }
    }

    async calculateDashboardStats(userId) {
        try {
            // Obtener todas las citas para calcular estadísticas
            const response = await authFetch(`/api/citas/agenda/odontologo?id_odontologo=${userId}`);
            if (!response.ok) {
                throw new Error('Error al obtener citas');
            }
            
            const citas = await response.json();const hoy = new Date().toISOString().split('T')[0];
            
            // Calcular estadísticas del dashboard
            // 📅 CITAS HOY: Solo las citas del día actual
            const citasHoy = citas.filter(cita => cita.fecha.split('T')[0] === hoy).length;
            
            // 👥 PACIENTES ATENDIDOS (TOTAL): Todas las citas completadas históricamente
            const pacientesAtendidos = citas.filter(cita => cita.estado === 'completada').length;
            
            // ⏳ CITAS PENDIENTES: Citas programadas o confirmadas que no se han completado
            const citasPendientes = citas.filter(cita => cita.estado === 'programada' || cita.estado === 'confirmada').length;
            
            // Actualizar elementos de la interfaz (usando querySelectorAll para elementos duplicados)
            const citasHoyElements = document.querySelectorAll('#citasHoy');
            const pacientesAtendidosElements = document.querySelectorAll('#pacientesAtendidos');
            const citasPendientesElements = document.querySelectorAll('#citasPendientes');
            
            // Actualizar TODOS los elementos con el mismo ID
            citasHoyElements.forEach((element) => {
                element.textContent = citasHoy;
            });
            
            pacientesAtendidosElements.forEach((element) => {
                element.textContent = pacientesAtendidos;
            });
            
            citasPendientesElements.forEach((element) => {
                element.textContent = citasPendientes;
            });
            
        } catch (error) {
            console.error('Error al calcular estadísticas:', error);
            throw error;
        }
    }

    async loadAgendaHoy() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            const hoy = new Date().toISOString().split('T')[0];
            const response = await authFetch(`/api/citas/agenda/odontologo?id_odontologo=${userId}`);
            
            if (!response.ok) {
                throw new Error('Error al obtener agenda del día');
            }
            
            const todasLasCitas = await response.json();
            
            // Filtrar solo las citas de hoy
            const citasHoy = todasLasCitas.filter(cita => cita.fecha.split('T')[0] === hoy);const container = document.getElementById('agendaHoy');
            
            if (citasHoy.length === 0) {
                container.innerHTML = '<p class="text-muted">No hay citas programadas para hoy.</p>';
                return;
            }

            container.innerHTML = citasHoy.map(cita => {
                const hora = this.formatearHora(cita.hora);
                
                return `
                    <div class="timeline-item">
                        <div class="timeline-time">${hora}</div>
                        <div class="timeline-content">
                            <div class="timeline-title">${cita.paciente_nombre || 'Paciente'} ${cita.paciente_apellido || 'N/A'}</div>
                            <div class="timeline-description">${cita.motivo || 'Consulta general'}</div>
                            <span class="badge ${this.getEstadoBadgeClass(cita.estado)} mt-2">${cita.estado.replace('_', ' ')}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error al cargar agenda de hoy:', error);
            const container = document.getElementById('agendaHoy');
            container.innerHTML = '<p class="text-danger">Error al cargar agenda del día.</p>';
        }
    }

    async loadProximosPacientes() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            // Obtener citas de los próximos 7 días
            const response = await authFetch(`/api/citas/agenda/odontologo?id_odontologo=${userId}`);
            
            if (!response.ok) {
                throw new Error('Error al obtener próximos pacientes');
            }
            
            const todasLasCitas = await response.json();
            
            // Filtrar solo las citas futuras y tomar las primeras 5
            const hoy = new Date();
            const proximasCitas = todasLasCitas
                .filter(cita => {
                    try {
                        // Usar formateo robusto para comparar fechas
                        let fechaCita;
                        if (typeof cita.fecha === 'string' && cita.fecha.includes('T')) {
                            fechaCita = new Date(cita.fecha);
                        } else if (typeof cita.fecha === 'string') {
                            fechaCita = new Date(cita.fecha + 'T00:00:00');
                        } else {
                            fechaCita = new Date(cita.fecha);
                        }
                        
                        return !isNaN(fechaCita.getTime()) && 
                               fechaCita >= hoy && 
                               (cita.estado === 'programada' || cita.estado === 'confirmada');
                    } catch (error) {
                        console.warn('Error al procesar fecha de cita:', cita.fecha, error);
                        return false;
                    }
                })
                .slice(0, 5);const container = document.getElementById('proximosPacientes');
            
            if (proximasCitas.length === 0) {
                container.innerHTML = '<p class="text-muted">No hay pacientes programados próximamente.</p>';
                return;
            }

            container.innerHTML = proximasCitas.map(cita => {
                const hora = this.formatearHora(cita.hora);
                const fechaFormateada = this.formatearFecha(cita.fecha, {
                    day: '2-digit',
                    month: '2-digit'
                });
                
                // Crear nombre completo del paciente
                const nombreCompleto = `${cita.paciente_nombre || 'Paciente'} ${cita.paciente_apellido || 'N/A'}`.trim();
                
                return `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${nombreCompleto}</h6>
                            <small class="text-muted">${cita.motivo || 'Consulta general'} - ${fechaFormateada}</small>
                        </div>
                        <span class="badge bg-primary">${hora}</span>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error al cargar próximos pacientes:', error);
            const container = document.getElementById('proximosPacientes');
            container.innerHTML = '<p class="text-danger">Error al cargar próximos pacientes.</p>';
        }
    }

    initializeCharts() {
    }

    async loadSectionData(sectionName) {
        if (sectionName === 'pacientes') {
            await this.loadPacientes();
        }
        if (sectionName === 'historiales') {
            await this.loadHistoriales();
        }
        if (sectionName === 'agenda') {
            await this.loadAgenda();
        }
        if (sectionName === 'miscitas') {
            await this.loadMisCitas();
        }
        if (sectionName === 'perfil') {
            await this.loadMiPerfil();
        }
        if (sectionName === 'pagos') {
            await this.loadPagosIngresos();
        }
        // ...puedes agregar otras secciones aquí...
    }

    async loadAgenda(fecha = null) {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.log('No hay usuario logueado');
                return;
            }

            console.log(`📅 Cargando agenda para fecha: ${fecha || 'todas'}`);
            
            // Usar el endpoint correcto para obtener citas del odontólogo
            let url = `/api/citas/agenda/odontologo?id_odontologo=${userId}`;
            
            const response = await authFetch(url);
            if (!response.ok) {
                throw new Error('Error al obtener agenda');
            }
            
            const todasLasCitas = await response.json();// Si se especifica una fecha, filtrar por esa fecha
            if (fecha) {
                this.agenda = todasLasCitas.filter(cita => cita.fecha.split('T')[0] === fecha);} else {
                // Mostrar todas las citas futuras (desde hoy)
                const hoy = new Date().toISOString().split('T')[0];
                this.agenda = todasLasCitas.filter(cita => cita.fecha.split('T')[0] >= hoy);}
            
            this.renderAgenda();
            
        } catch (err) {
            console.error('❌ Error al cargar agenda:', err);
            const container = document.getElementById('calendar');
            container.innerHTML = '<div class="alert alert-danger">Error al cargar la agenda</div>';
        }
    }

    renderAgenda() {
        const container = document.getElementById('calendar');
        container.innerHTML = '';
        
        if (!this.agenda || this.agenda.length === 0) {
            container.innerHTML = `
                <div class="agenda-empty-state">
                    <i class="bi bi-calendar-x"></i>
                    <h5>No hay citas programadas</h5>
                    <p>No se encontraron citas para el período seleccionado.</p>
                </div>
            `;
            // Actualizar resumen con ceros
            this.updateResumenDia();
            return;
        }

        // Agrupar citas por fecha
        const citasPorFecha = {};
        this.agenda.forEach(cita => {
            const fecha = cita.fecha.split('T')[0];
            if (!citasPorFecha[fecha]) {
                citasPorFecha[fecha] = [];
            }
            citasPorFecha[fecha].push(cita);
        });

        // Renderizar citas agrupadas por fecha
        Object.keys(citasPorFecha).sort().forEach(fecha => {
            const fechaFormateada = this.formatearFecha(fecha, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Crear header de fecha
            const fechaHeader = document.createElement('div');
            fechaHeader.className = 'agenda-fecha-header';
            fechaHeader.innerHTML = `
                <i class="bi bi-calendar-date me-2"></i>
                ${fechaFormateada}
            `;
            container.appendChild(fechaHeader);

            // Crear contenedor para las citas del día
            const citasDelDia = citasPorFecha[fecha].sort((a, b) => a.hora.localeCompare(b.hora));
            
            citasDelDia.forEach(cita => {
                const citaCard = document.createElement('div');
                citaCard.className = `card agenda-cita-card ${cita.estado}`;
                
                const hora = this.formatearHora(cita.hora);
                
                citaCard.innerHTML = `
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-auto">
                                <div class="agenda-hora">${hora}</div>
                            </div>
                            <div class="col">
                                <div class="agenda-paciente">${cita.paciente_nombre || 'Paciente'} ${cita.paciente_apellido || 'N/A'}</div>
                                <div class="agenda-motivo">${cita.motivo || 'Consulta general'}</div>
                                ${cita.notas ? `<div class="agenda-notas">${cita.notas}</div>` : ''}
                            </div>
                            <div class="col-auto">
                                <div class="d-flex align-items-center gap-2">
                                    <span class="badge ${this.getEstadoBadgeClass(cita.estado)}">${cita.estado.toUpperCase()}</span>
                                    <div class="btn-group btn-group-agenda" role="group">
                                        <button class="btn btn-outline-info btn-sm" onclick="dashboardOdontologo.verDetallesCita(${cita.id})" title="Ver detalles">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                        ${cita.estado !== 'completada' && cita.estado !== 'cancelada' ? `
                                            <button class="btn btn-outline-primary btn-sm" onclick="dashboardOdontologo.completarCita(${cita.id})" title="Marcar como completada">
                                                <i class="bi bi-check-circle"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(citaCard);
            });
        });

        // Actualizar resumen del día si solo hay una fecha
        const fechas = Object.keys(citasPorFecha);
        if (fechas.length === 1) {
            this.updateResumenDia(fechas[0]);
        } else {
            this.updateResumenDia();
        }
    }

    async loadPacientes() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.log('No hay usuario logueado');
                return;
            }const response = await authFetch(`/api/usuarios/${userId}/pacientes`);
            if (!response.ok) {
                throw new Error('Error al obtener pacientes');
            }
            
            const data = await response.json();
            const rawPacientes = data.pacientes || [];
            const currentOdontologoId = this.currentUser?.id || parseInt(userId, 10);

            this.pacientes = rawPacientes.filter(paciente => {
                if (!paciente || typeof paciente.asignado_a === 'undefined' || paciente.asignado_a === null) {
                    return true;
                }
                return Number(paciente.asignado_a) === Number(currentOdontologoId);
            });
            this.renderPacientesTable();
            
        } catch (err) {
            console.error('❌ Error al cargar pacientes:', err);
            
            // Datos de ejemplo para testing en caso de error
            this.pacientes = [
                {
                    id: 999,
                    nombre: 'Juan Carlos',
                    apellido: 'Pérez García',
                    correo: 'juan.perez@email.com',
                    telefono: '3001234567',
                    fecha_nacimiento: '1990-05-15',
                    direccion: 'Calle 123 #45-67',
                    estado: 'Activo',
                    total_citas: 3,
                    ultima_cita: new Date().toLocaleDateString('es-ES'),
                    citas_pendientes: 1
                }
            ];
            
            console.log('📊 Array de pacientes de ejemplo - Length:', this.pacientes.length);
            this.renderPacientesTable();
            
            // Actualizar estadísticas con datos de ejemplo
            this.updatePacientesStats();
            
            const tbody = document.querySelector('#pacientesTable tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-warning">Usando datos de ejemplo (error en conexión)</td></tr>';
            }
        }
    }

    renderPacientesTable() {
        const tbody = document.querySelector('#pacientesTable tbody');
        tbody.innerHTML = '';
        
        const totalItems = this.pacientes?.length || 0;
        this.generatePagination('pacientes', totalItems);
        
        if (!this.pacientes || this.pacientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="bi bi-people" style="font-size: 2rem;"></i>
                        <br><br>
                        No hay pacientes registrados aún.
                    </td>
                </tr>
            `;
            return;
        }

        // Apply pagination
        const config = this.pagination.pacientes;
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = startIndex + config.itemsPerPage;
        const paginatedItems = this.pacientes.slice(startIndex, endIndex);

        paginatedItems.forEach(paciente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="fw-bold text-primary">#${paciente.id}</span>
                </td>
                <td>
                    <div>
                        <strong>${paciente.nombre} ${paciente.apellido}</strong>
                        <br>
                        <small class="text-muted">${paciente.correo || 'Sin email'}</small>
                    </div>
                </td>
                <td>
                    <span class="badge bg-light text-dark">
                        <i class="bi bi-telephone me-1"></i>
                        ${paciente.telefono || 'No registrado'}
                    </span>
                </td>
                <td>
                    <div class="text-center">
                        <strong>${paciente.ultima_cita}</strong>
                        <br>
                        <small class="text-muted">${paciente.total_citas} cita(s) total</small>
                    </div>
                </td>
                <td>
                    <span class="badge ${paciente.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}">
                        ${paciente.estado}
                    </span>
                    <br>
                    <small class="text-muted">
                        ${paciente.citas_pendientes > 0 ? `${paciente.citas_pendientes} pendiente(s)` : 'Sin citas pendientes'}
                    </small>
                </td>
                <td>
                    <div class="btn-group-vertical btn-group-sm" role="group">
                        <button class="btn btn-outline-info btn-sm mb-1" onclick="dashboardOdontologo.verHistorialPaciente(${paciente.id})" title="Ver historial">
                            <i class="bi bi-file-medical me-1"></i>Historial
                        </button>
                        <button class="btn btn-outline-primary btn-sm mb-1" onclick="dashboardOdontologo.verCitasPaciente(${paciente.id})" title="Ver citas">
                            <i class="bi bi-calendar-check me-1"></i>Citas
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="dashboardOdontologo.contactarPaciente(${paciente.id})" title="Contactar">
                            <i class="bi bi-chat-dots me-1"></i>Contactar
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar contador de pacientes
        this.updatePacientesStats();
    }

    updatePacientesStats() {
        console.log('🔍 updatePacientesStats llamada - this.pacientes:', this.pacientes);
        if (!this.pacientes) {
            console.log('⚠️ this.pacientes es null/undefined');
            return;
        }

        const totalPacientes = this.pacientes.length;
        const pacientesActivos = this.pacientes.filter(p => p.estado === 'Activo').length;
        const pacientesInactivos = this.pacientes.filter(p => p.estado === 'Inactivo').length;

        console.log(`📊 Stats calculadas: Total: ${totalPacientes}, Activos: ${pacientesActivos}, Inactivos: ${pacientesInactivos}`);

        // Actualizar stats en el dashboard si estamos en esa sección
        const totalElement = document.querySelector('#totalPacientes');
        if (totalElement) {
            console.log(`📊 Actualizando elemento #totalPacientes con valor: ${totalPacientes}`);
            totalElement.textContent = totalPacientes;
        } else {
            console.log('⚠️ Elemento #totalPacientes no encontrado en DOM');
        }
        
        if (document.querySelector('#pacientesActivos')) {
            document.querySelector('#pacientesActivos').textContent = pacientesActivos;
        }
        if (document.querySelector('#pacientesInactivos')) {
            document.querySelector('#pacientesInactivos').textContent = pacientesInactivos;
        }

        console.log(`📊 Stats pacientes finalizadas: Total: ${totalPacientes}, Activos: ${pacientesActivos}, Inactivos: ${pacientesInactivos}`);
    }

    async verHistorialPaciente(pacienteId) {
        try {
            // Buscar primero en la lista de pacientes cargados
            let paciente = this.pacientes ? this.pacientes.find(p => p.id === pacienteId) : null;
            
            // Si no está en la lista, obtenerlo de la cita actual
            if (!paciente) {
                const cita = this.citas.find(c => c.paciente_id === pacienteId);
                if (cita) {
                    paciente = {
                        id: pacienteId,
                        nombre: cita.paciente_completo?.split(' ')[0] || 'Nombre',
                        apellido: cita.paciente_completo?.split(' ').slice(1).join(' ') || 'Apellido',
                        correo: cita.paciente_correo,
                        telefono: cita.paciente_telefono
                    };
                }
            }
            
            // Si aún no se encuentra, obtener datos del servidor
            if (!paciente) {
                const response = await authFetch(`/api/usuarios/${pacienteId}/perfil`);
                if (response.ok) {
                    const userData = await response.json();
                    paciente = {
                        id: pacienteId,
                        nombre: userData.nombre,
                        apellido: userData.apellido,
                        correo: userData.correo,
                        telefono: userData.telefono
                    };
                } else {
                    this.showAlert('Paciente no encontrado', 'danger');
                    return;
                }
            }
            
            // Mostrar modal de carga primero
            const loadingModalHtml = `
                <div class="modal fade" id="modalHistorialPaciente" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-body text-center p-4">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Cargando...</span>
                                </div>
                                <p class="mt-3 mb-0">Cargando historial de ${paciente.nombre} ${paciente.apellido}...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', loadingModalHtml);
            const loadingModal = new bootstrap.Modal(document.getElementById('modalHistorialPaciente'));
            loadingModal.show();

            // Cargar estadísticas del paciente
            console.log('📊 Cargando estadísticas para paciente:', pacienteId);
            
            const [citasResponse, historialesResponse] = await Promise.all([
                authFetch(`/api/citas/${pacienteId}`),
                authFetch(`/api/historial/paciente/${pacienteId}`)
            ]);

            let citas = [];
            let historiales = [];
            
            if (citasResponse.ok) {
                citas = await citasResponse.json();
                console.log('📅 Citas obtenidas:', citas.length);
            } else {
                console.warn('⚠️ No se pudieron cargar las citas');
            }
            
            if (historialesResponse.ok) {
                historiales = await historialesResponse.json();
                console.log('📋 Historiales obtenidos:', historiales.length);
            } else {
                console.warn('⚠️ No se pudieron cargar los historiales');
            }

            // Calcular estadísticas
            const totalCitas = citas.length;
            const citasCompletadas = citas.filter(c => c.estado === 'completada').length;
            const citasPendientes = citas.filter(c => c.estado === 'programada' || c.estado === 'confirmada').length;
            const citasCanceladas = citas.filter(c => c.estado === 'cancelada').length;
            
            // Encontrar última cita
            const ultimaCita = citas.length > 0 
                ? citas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
                : null;
                
            const fechaUltimaCita = ultimaCita 
                ? this.formatearFecha(ultimaCita.fecha)
                : 'No hay citas';

            // Crear modal para mostrar historial mejorado
            const modalHtml = `
                <div class="modal fade" id="modalHistorialPaciente" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-xl modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title">
                                    <i class="fas fa-file-medical me-2"></i>
                                    Historial: ${paciente.nombre} ${paciente.apellido}
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="card h-100">
                                            <div class="card-body">
                                                <h6 class="card-title text-primary">
                                                    <i class="fas fa-user me-2"></i>Información General
                                                </h6>
                                                <p><strong>ID:</strong> #${paciente.id}</p>
                                                <p><strong>Email:</strong> ${paciente.correo || 'No registrado'}</p>
                                                <p><strong>Teléfono:</strong> ${paciente.telefono || 'No registrado'}</p>
                                                <p><strong>Documento:</strong> ${paciente.numero_documento || 'No registrado'}</p>
                                                <p><strong>Dirección:</strong> ${paciente.direccion || 'No registrado'}</p>
                                                <p><strong>Fecha Registro:</strong> ${paciente.fecha_registro ? this.formatearFecha(paciente.fecha_registro) : 'No registrado'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card h-100">
                                            <div class="card-body">
                                                <h6 class="card-title text-success">
                                                    <i class="fas fa-chart-bar me-2"></i>Estadísticas de Citas
                                                </h6>
                                                <p><strong>Total citas:</strong> <span class="badge bg-primary">${totalCitas}</span></p>
                                                <p><strong>Completadas:</strong> <span class="badge bg-success">${citasCompletadas}</span></p>
                                                <p><strong>Pendientes:</strong> <span class="badge bg-warning">${citasPendientes}</span></p>
                                                <p><strong>Canceladas:</strong> <span class="badge bg-danger">${citasCanceladas}</span></p>
                                                <p><strong>Historiales médicos:</strong> <span class="badge bg-info">${historiales.length}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="alert alert-info">
                                            <i class="fas fa-calendar-alt me-2"></i>
                                            <strong>Última cita:</strong> ${fechaUltimaCita}
                                            ${ultimaCita ? ` - ${ultimaCita.motivo || 'Sin especificar'}` : ''}
                                        </div>
                                    </div>
                                    
                                    <!-- Sección de Historiales Médicos -->
                                    <div class="col-12">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="card-title mb-0">
                                                    <i class="fas fa-notes-medical me-2"></i>Historiales Médicos
                                                </h6>
                                            </div>
                                            <div class="card-body">
                                                ${historiales.length > 0 ? `
                                                    <div class="table-responsive">
                                                        <table class="table table-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th>Fecha</th>
                                                                    <th>Diagnóstico</th>
                                                                    <th>Tratamiento</th>
                                                                    <th>Observaciones</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                ${historiales.map(h => `
                                                                    <tr>
                                                                        <td>${this.formatearFecha(h.fecha)}</td>
                                                                        <td>${h.diagnostico || 'No especificado'}</td>
                                                                        <td>${h.tratamiento || 'No especificado'}</td>
                                                                        <td>${h.observaciones || 'Ninguna'}</td>
                                                                    </tr>
                                                                `).join('')}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ` : `
                                                    <p class="text-muted">No hay historiales médicos registrados para este paciente.</p>
                                                `}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Sección de Últimas Citas -->
                                    <div class="col-12">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="card-title mb-0">
                                                    <i class="fas fa-calendar-check me-2"></i>Últimas Citas
                                                </h6>
                                            </div>
                                            <div class="card-body">
                                                ${citas.length > 0 ? `
                                                    <div class="table-responsive">
                                                        <table class="table table-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th>Fecha</th>
                                                                    <th>Hora</th>
                                                                    <th>Tratamiento</th>
                                                                    <th>Estado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                ${citas.slice(0, 5).map(cita => `
                                                                    <tr>
                                                                        <td>${this.formatearFecha(cita.fecha)}</td>
                                                                        <td>${cita.hora}</td>
                                                                        <td>${cita.motivo || 'No especificado'}</td>
                                                                        <td>
                                                                            <span class="badge ${this.getEstadoBadgeClass(cita.estado)}">
                                                                                ${cita.estado}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                `).join('')}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ` : `
                                                    <p class="text-muted">No hay citas registradas para este paciente.</p>
                                                `}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="fas fa-times me-1"></i>Cerrar
                                </button>
                                <button type="button" class="btn btn-success" onclick="dashboardOdontologo.verCitasPaciente(${paciente.id}); bootstrap.Modal.getInstance(document.getElementById('modalHistorialPaciente')).hide();">
                                    <i class="fas fa-calendar-check me-1"></i>Ver Todas las Citas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remover modal de carga
            const existingModal = document.getElementById('modalHistorialPaciente');
            if (existingModal) {
                bootstrap.Modal.getInstance(existingModal)?.hide();
                existingModal.remove();
            }

            // Agregar modal completo al body
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalHistorialPaciente'));
            modal.show();

            // Limpiar modal cuando se cierre
            document.getElementById('modalHistorialPaciente').addEventListener('hidden.bs.modal', function () {
                this.remove();
            });

        } catch (error) {
            console.error('❌ Error cargando historial del paciente:', error);
            this.showAlert('Error al cargar el historial del paciente', 'danger');
        }
    }

    async verCitasPaciente(pacienteId) {
        const paciente = this.pacientes.find(p => p.id === pacienteId);
        if (!paciente) {
            this.showAlert('Paciente no encontrado', 'danger');
            return;
        }

        try {
            console.log(`📅 Cargando citas del paciente ${paciente.nombre} ${paciente.apellido} (ID: ${pacienteId})`);
            
            const response = await authFetch(`/api/citas/${pacienteId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const citas = await response.json();
            console.log('📋 Citas del paciente:', citas);
            
            // La API devuelve directamente el array de citas, no un objeto con propiedad 'citas'
            if (citas && citas.length > 0) {
                this.mostrarModalCitasPaciente(paciente, citas);
            } else {
                this.showAlert(`${paciente.nombre} ${paciente.apellido} no tiene citas registradas`, 'info');
            }
            
        } catch (error) {
            console.error('Error al cargar citas del paciente:', error);
            this.showAlert('Error al cargar las citas del paciente', 'danger');
        }
    }

    contactarPaciente(pacienteId) {
        const paciente = this.pacientes.find(p => p.id === pacienteId);
        if (!paciente) {
            this.showAlert('Paciente no encontrado', 'danger');
            return;
        }

        if (paciente.telefono) {
            // Abrir WhatsApp si hay teléfono
            const mensaje = `Hola ${paciente.nombre}, soy su odontólogo de Clinik Dent. ¿Cómo se encuentra?`;
            const whatsappUrl = `https://wa.me/${paciente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
            window.open(whatsappUrl, '_blank');
        } else if (paciente.correo) {
            // Abrir email si no hay teléfono
            const asunto = 'Clinik Dent - Contacto desde su odontólogo';
            const mensaje = `Estimado/a ${paciente.nombre},\n\nEspero se encuentre bien. Me pongo en contacto desde Clinik Dent.\n\nSaludos cordiales,\nDr. ${this.currentUser?.nombre || 'Odontólogo'}`;
            const mailtoUrl = `mailto:${paciente.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
            window.location.href = mailtoUrl;
        } else {
            this.showAlert('El paciente no tiene información de contacto registrada', 'warning');
        }
    }

    mostrarModalCitasPaciente(paciente, citas) {
        // Crear el modal dinámicamente
        const modalId = 'modalCitasPaciente';
        let existingModal = document.getElementById(modalId);
        
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${modalId}Label">
                                <i class="bi bi-calendar-check me-2"></i>
                                Citas de ${paciente.nombre} ${paciente.apellido}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Hora</th>
                                            <th>Estado</th>
                                            <th>Motivo</th>
                                            <th>Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${citas.map(cita => `
                                            <tr>
                                                <td>${this.formatDate(cita.fecha)}</td>
                                                <td>${cita.hora}</td>
                                                <td>
                                                    <span class="badge ${this.getEstadoBadgeClass(cita.estado)}">
                                                        ${this.capitalize(cita.estado)}
                                                    </span>
                                                </td>
                                                <td>${cita.motivo || 'No especificado'}</td>
                                                <td>${cita.notas || '-'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();

        // Limpiar el modal cuando se cierre
        document.getElementById(modalId).addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    getEstadoBadgeClass(estado) {
        const classes = {
            'pendiente': 'bg-warning',
            'confirmada': 'bg-success',
            'cancelada': 'bg-danger',
            'completada': 'bg-info',
            'no_asistio': 'bg-secondary'
        };
        return classes[estado] || 'bg-secondary';
    }

    formatDate(dateString) {
        // Usar la función robusta de formateo
        return this.formatearFecha(dateString, {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
        });
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
    }

    filterPacientes(searchTerm) {
        if (!this.pacientes) return;

        const tbody = document.querySelector('#pacientesTable tbody');
        const rows = tbody.querySelectorAll('tr');

        if (!searchTerm.trim()) {
            // Mostrar todas las filas si no hay término de búsqueda
            rows.forEach(row => {
                row.style.display = '';
            });
            return;
        }

        const term = searchTerm.toLowerCase();
        let visibleCount = 0;

        rows.forEach(row => {
            if (row.querySelector('.text-center.text-muted')) {
                // Es la fila de "no hay pacientes", no filtrar
                return;
            }

            const patientData = row.textContent.toLowerCase();
            const isVisible = patientData.includes(term);
            
            row.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });

        // Si no hay resultados, mostrar mensaje
        if (visibleCount === 0 && this.pacientes.length > 0) {
            const noResultsRow = tbody.querySelector('.no-results-row');
            if (!noResultsRow) {
                const tr = document.createElement('tr');
                tr.className = 'no-results-row';
                tr.innerHTML = `
                    <td colspan="6" class="text-center text-muted py-3">
                        <i class="bi bi-search"></i>
                        <br>
                        No se encontraron pacientes que coincidan con "${searchTerm}"
                    </td>
                `;
                tbody.appendChild(tr);
            }
        } else {
            // Remover mensaje de no resultados si existe
            const noResultsRow = tbody.querySelector('.no-results-row');
            if (noResultsRow) {
                noResultsRow.remove();
            }
        }
    }

    openPacienteModal(id = null) {
        // Aquí deberías mostrar un modal para editar paciente
        alert('Funcionalidad de editar paciente pendiente de modal/formulario.');
    }

    async deletePaciente(id) {
        if (!confirm('¿Seguro que deseas eliminar este paciente?')) return;
        try {
            await authFetch(`./api/pacientes/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            await this.loadPacientes();
        } catch (err) {
            alert('Error al eliminar paciente');
        }
    }

    async loadHistoriales() {
        try {
            console.log('🔄 Cargando historiales...');
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.log('❌ No hay usuario logueado');
                return;
            }
            
            console.log('👤 Usuario ID:', userId);
            
            // Obtener historiales directamente del odontólogo logueado
            const historialResponse = await authFetch(`/api/historial/odontologo/${userId}`);
            
            if (!historialResponse.ok) {
                throw new Error('Error al obtener historiales');
            }
            
            const historiales = await historialResponse.json();
            console.log('📊 Historiales cargados:', historiales.length, historiales);
            
            // Formatear los datos para compatibilidad con el frontend
            this.historiales = historiales.map(h => ({
                ...h,
                paciente_nombre: h.paciente ? `${h.paciente.nombre} ${h.paciente.apellido}` : 'N/A',
                paciente_email: h.paciente?.correo || '',
                odontologo_nombre: h.odontologo ? `${h.odontologo.nombre} ${h.odontologo.apellido}` : 'N/A'
            }));
            
            console.log('📋 Total historiales procesados:', this.historiales.length);
            this.renderHistorialesTable();
            
        } catch (err) {
            console.error('❌ Error al cargar historiales:', err);
            document.querySelector('#historialesTable tbody').innerHTML = 
                '<tr><td colspan="6" class="text-center text-muted">Error al cargar historiales</td></tr>';
        }
    }

    renderHistorialesTable() {
        console.log('🎨 Renderizando tabla de historiales...');
        const tbody = document.querySelector('#historialesTable tbody');
        if (!tbody) {
            console.log('❌ No se encontró el tbody de la tabla de historiales');
            return;
        }
        
        tbody.innerHTML = '';
        
        console.log('📊 Historiales a renderizar:', this.historiales?.length || 0, this.historiales);
        
        const totalItems = this.historiales?.length || 0;
        this.generatePagination('historiales', totalItems);
        
        if (!this.historiales || this.historiales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay historiales registrados</td></tr>';
            console.log('ℹ️ No hay historiales para mostrar');
            return;
        }
        
        // Apply pagination
        const config = this.pagination.historiales;
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = startIndex + config.itemsPerPage;
        const paginatedItems = this.historiales.slice(startIndex, endIndex);
        
        paginatedItems.forEach((historial, index) => {
            console.log(`📝 Renderizando historial ${index + 1}:`, historial);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="fw-semibold">${historial.paciente_nombre || 'N/A'}</div>
                    <small class="text-muted">${historial.paciente_email || ''}</small>
                </td>
                <td>${historial.fecha ? this.formatearFecha(historial.fecha) : 'N/A'}</td>
                <td>
                    <div class="text-truncate" style="max-width: 200px;" title="${historial.diagnostico || 'N/A'}">
                        ${historial.diagnostico || 'N/A'}
                    </div>
                </td>
                <td>
                    <div class="text-truncate" style="max-width: 200px;" title="${historial.tratamiento_resumido || 'N/A'}">
                        ${historial.tratamiento_resumido || 'N/A'}
                    </div>
                </td>
                <td>
                    <span class="badge ${this.getEstadoBadgeClass(historial.estado || 'en_proceso')}">
                        ${this.formatEstado(historial.estado || 'en_proceso')}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="dashboardOdontologo.viewHistorial(${historial.id})" title="Ver detalles del historial">
                        Ver
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="dashboardOdontologo.openHistorialModal(${historial.id})" title="Editar historial">
                        Editar
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="dashboardOdontologo.imprimirHistorial(${historial.id})" title="Imprimir historial">
                        Imprimir
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        console.log('✅ Tabla renderizada exitosamente');
    }

    async imprimirHistorial(id) {
        try {
            console.log('🖨️ Preparando impresión del historial ID:', id);
            
            // Obtener los datos completos del historial
            const response = await authFetch(`/api/historial/${id}`);
            if (!response.ok) throw new Error('Error al obtener historial');
            
            const historial = await response.json();
            
            // Crear una ventana de impresión con el contenido formateado
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Historial Clínico - ${historial.paciente_nombre} ${historial.paciente_apellido}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            font-size: 12pt;
                        }
                        .header {
                            text-align: center;
                            border-bottom: 2px solid #333;
                            padding-bottom: 10px;
                            margin-bottom: 20px;
                        }
                        .header h1 {
                            margin: 0;
                            color: #1d9ddd;
                        }
                        .section {
                            margin-bottom: 20px;
                        }
                        .section-title {
                            font-weight: bold;
                            font-size: 14pt;
                            color: #1d9ddd;
                            border-bottom: 1px solid #ddd;
                            padding-bottom: 5px;
                            margin-bottom: 10px;
                        }
                        .info-row {
                            margin-bottom: 10px;
                        }
                        .label {
                            font-weight: bold;
                            display: inline-block;
                            width: 150px;
                        }
                        .content-box {
                            border: 1px solid #ddd;
                            padding: 10px;
                            background-color: #f9f9f9;
                            margin-top: 5px;
                        }
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>ClinikDent</h1>
                        <h2>Historial Clínico</h2>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Información del Paciente</div>
                        <div class="info-row">
                            <span class="label">Nombre:</span>
                            <span>${historial.paciente_nombre} ${historial.paciente_apellido}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Correo:</span>
                            <span>${historial.paciente_correo || 'No especificado'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Teléfono:</span>
                            <span>${historial.paciente_telefono || 'No especificado'}</span>
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Información del Odontólogo</div>
                        <div class="info-row">
                            <span class="label">Dr./Dra.:</span>
                            <span>${historial.odontologo_nombre} ${historial.odontologo_apellido}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Fecha de Atención:</span>
                            <span>${this.formatearFecha(historial.fecha)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Estado:</span>
                            <span>${this.formatEstado(historial.estado || 'en_proceso')}</span>
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Diagnóstico</div>
                        <div class="content-box">
                            ${historial.diagnostico || 'No especificado'}
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Tratamiento Realizado</div>
                        <div class="content-box">
                            ${historial.tratamiento_resumido || 'No especificado'}
                        </div>
                    </div>
                    
                    ${historial.archivo_adjuntos ? `
                    <div class="section">
                        <div class="section-title">Observaciones</div>
                        <div class="content-box">
                            ${historial.archivo_adjuntos}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="section no-print" style="margin-top: 30px; text-align: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14pt; cursor: pointer;">
                            🖨️ Imprimir
                        </button>
                        <button onclick="window.close()" style="padding: 10px 20px; font-size: 14pt; cursor: pointer; margin-left: 10px;">
                            Cerrar
                        </button>
                    </div>
                    
                    <script>
                        // Auto-abrir diálogo de impresión después de cargar
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `;
            
            printWindow.document.write(printContent);
            printWindow.document.close();
            
        } catch (error) {
            console.error('❌ Error al preparar impresión:', error);
            this.showAlert('Error al preparar el historial para imprimir', 'danger');
        }
    }

    async openHistorialModal(id = null) {
        console.log('Abriendo modal de historial', id ? 'para editar ID: ' + id : 'para crear nuevo');
        
        this.currentHistorialId = id;
        const modal = new bootstrap.Modal(document.getElementById('historialModal'));
        const modalTitle = document.getElementById('historialModalTitle');
        const form = document.getElementById('historialForm');
        
        // Reset form
        form.reset();
        form.classList.remove('was-validated');
        
        // Load pacientes for select
        await this.loadPacientesForSelect();
        
        if (id) {
            // Edit mode
            modalTitle.textContent = 'Editar Historial Clínico';
            await this.loadHistorialData(id);
        } else {
            // Create mode
            modalTitle.textContent = 'Nuevo Historial Clínico';
            // Set today's date as default
            document.getElementById('historialFecha').value = new Date().toISOString().split('T')[0];
            // Set default status to 'en_proceso'
            document.getElementById('historialEstado').value = 'en_proceso';
        }
        
        modal.show();
    }

    async loadPacientesForSelect() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;
            
            const response = await authFetch(`/api/usuarios/${userId}/pacientes`);
            if (!response.ok) throw new Error('Error al obtener pacientes');
            
            const data = await response.json();
            const pacientes = data.pacientes || [];
            
            const select = document.getElementById('historialPaciente');
            select.innerHTML = '<option value="">Seleccionar paciente</option>';
            
            pacientes.forEach(paciente => {
                const option = document.createElement('option');
                option.value = paciente.id;
                option.textContent = `${paciente.nombre} ${paciente.apellido}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar pacientes para select:', error);
        }
    }

    async loadHistorialData(id) {
        try {
            const response = await authFetch(`/api/historial/${id}`);
            if (!response.ok) throw new Error('Error al obtener historial');
            
            const historial = await response.json();
            
            // Fill form with data
            document.getElementById('historialPaciente').value = historial.paciente_id;
            document.getElementById('historialFecha').value = historial.fecha.split('T')[0];
            document.getElementById('historialDiagnostico').value = historial.diagnostico || '';
            document.getElementById('historialTratamiento').value = historial.tratamiento_resumido || '';
            document.getElementById('historialObservaciones').value = historial.archivo_adjuntos || '';
            document.getElementById('historialEstado').value = historial.estado || 'en_proceso';
            
        } catch (error) {
            console.error('Error al cargar datos del historial:', error);
            this.showAlert('Error al cargar los datos del historial', 'danger');
        }
    }

    async deleteHistorial(id) {
        if (!confirm('¿Seguro que deseas eliminar este historial? Esta acción no se puede deshacer.')) return;
        
        try {
            const response = await authFetch(`/api/historial/${id}`, { 
                method: 'DELETE' 
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Error al eliminar historial');
            }
            
            this.showAlert('Historial eliminado exitosamente', 'success');
            await this.loadHistoriales();
            
        } catch (err) {
            console.error('Error al eliminar historial:', err);
            this.showAlert('Error al eliminar historial: ' + err.message, 'danger');
        }
    }

    async viewHistorial(id) {
        try {
            const response = await authFetch(`/api/historial/${id}`);
            if (!response.ok) throw new Error('Error al obtener historial');
            
            const historial = await response.json();
            
            // Create a modal to show historial details
            const modalHtml = `
                <div class="modal fade" id="viewHistorialModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Detalles del Historial Clínico</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-primary">Información del Paciente</h6>
                                        <p><strong>Nombre:</strong> ${historial.paciente_nombre} ${historial.paciente_apellido}</p>
                                        <p><strong>Fecha:</strong> ${this.formatearFecha(historial.fecha)}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-primary">Información del Odontólogo</h6>
                                        <p><strong>Dr./Dra.:</strong> ${historial.odontologo_nombre} ${historial.odontologo_apellido}</p>
                                    </div>
                                </div>
                                <hr>
                                <div class="mb-3">
                                    <h6 class="text-primary">Diagnóstico</h6>
                                    <p class="border p-3 bg-light">${historial.diagnostico || 'No especificado'}</p>
                                </div>
                                <div class="mb-3">
                                    <h6 class="text-primary">Tratamiento Realizado</h6>
                                    <p class="border p-3 bg-light">${historial.tratamiento_resumido || 'No especificado'}</p>
                                </div>
                                ${historial.archivo_adjuntos ? `
                                <div class="mb-3">
                                    <h6 class="text-primary">Observaciones</h6>
                                    <p class="border p-3 bg-light">${historial.archivo_adjuntos}</p>
                                </div>
                                ` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" onclick="dashboardOdontologo.openHistorialModal(${historial.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('viewHistorialModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('viewHistorialModal'));
            modal.show();
            
            // Clean up when modal is hidden
            document.getElementById('viewHistorialModal').addEventListener('hidden.bs.modal', function () {
                this.remove();
            });
            
        } catch (error) {
            console.error('Error al ver historial:', error);
            this.showAlert('Error al cargar los detalles del historial', 'danger');
        }
    }

    openTratamientoModal() {
        const modal = new bootstrap.Modal(document.getElementById('tratamientoModal'));
        modal.show();
    }

    async saveHistorial() {
        const form = document.getElementById('historialForm');
        
        // Validate form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                this.showAlert('Error: Usuario no identificado', 'danger');
                return;
            }
            
            const estadoSeleccionado = document.getElementById('historialEstado').value || null;

            const data = {
                paciente_id: document.getElementById('historialPaciente').value,
                odontologo_id: userId,
                fecha: document.getElementById('historialFecha').value,
                diagnostico: document.getElementById('historialDiagnostico').value,
                tratamiento_resumido: document.getElementById('historialTratamiento').value,
                archivo_adjuntos: document.getElementById('historialObservaciones').value,
                estado: estadoSeleccionado
            };
            
            let response;
            if (this.currentHistorialId) {
                // Update existing historial
                response = await authFetch(`/api/historial/${this.currentHistorialId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
            } else {
                // Create new historial
                response = await authFetch('/api/historial', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Error al guardar historial');
            }
            
            const result = await response.json();
            console.log('Historial guardado exitosamente:', result);
            
            // Show success message
            this.showAlert(this.currentHistorialId ? 'Historial actualizado exitosamente' : 'Historial creado exitosamente', 'success');

            // Close modal and refresh list
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('historialModal'));
            if (modalInstance) {
                modalInstance.hide();
            }
            await this.loadHistoriales();
            form.reset();
            form.classList.remove('was-validated');
            this.currentHistorialId = null;
            
        } catch (error) {
            console.error('Error al guardar historial:', error);
            this.showAlert('Error al guardar historial: ' + error.message, 'danger');
        }
    }

    verHistorial(pacienteId) {
        console.log('Ver historial del paciente:', pacienteId);
        // Implement view historial functionality
    }

    agendarCita(pacienteId) {
        console.log('Agendar cita para paciente:', pacienteId);
        // Implement schedule appointment functionality
    }

    editHistorial(historialIndex) {
        console.log('Editar historial:', historialIndex);
        // Implement edit historial functionality
    }

    editTratamiento(tratamientoIndex) {
        console.log('Editar tratamiento:', tratamientoIndex);
        // Implement edit treatment functionality
    }

    actualizarProgreso(tratamientoIndex) {
        console.log('Actualizar progreso del tratamiento:', tratamientoIndex);
        // Implement update progress functionality
    }

    /**
     * Cargar notificaciones del odontólogo
     */
    async loadNotifications() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            // Obtener citas próximas para generar notificaciones
            const hoy = new Date();
            const manana = new Date();
            manana.setDate(hoy.getDate() + 1);
            
            const response = await authFetch(`./api/citas/agenda/odontologo?id_odontologo=${userId}`);
            
            if (!response.ok) {
                throw new Error('Error al obtener notificaciones');
            }
            
            const citas = await response.json();
            
            // Filtrar citas de hoy y mañana que estén pendientes/confirmadas
            const citasProximas = citas.filter(cita => {
                const fechaCita = new Date(cita.fecha);
                const esHoyOManana = fechaCita.toDateString() === hoy.toDateString() || 
                                   fechaCita.toDateString() === manana.toDateString();
                return esHoyOManana && (cita.estado === 'programada' || cita.estado === 'confirmada');
            });
            
            this.renderNotifications(citasProximas);
            
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        }
    }

    /**
     * Renderizar notificaciones en el dropdown
     */
    renderNotifications(citas) {
        const container = document.getElementById('notificationsContainer');
        const badge = document.getElementById('notificationBadge');
        
        if (citas.length === 0) {
            container.innerHTML = '<div class="dropdown-item text-muted">No hay notificaciones</div>';
            badge.style.display = 'none';
            return;
        }

        // Mostrar badge con número de notificaciones
        badge.textContent = citas.length;
        badge.style.display = 'inline';
        
        // Generar HTML de notificaciones
        const hoy = new Date().toDateString();
        const notifications = citas.map(cita => {
            const fechaCita = new Date(cita.fecha);
            const esHoy = fechaCita.toDateString() === hoy;
            const hora = this.formatearHora(cita.hora);
            
            const mensaje = esHoy 
                ? `Cita hoy a las ${hora}`
                : `Cita mañana a las ${hora}`;
                
            return `
                <div class="dropdown-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${mensaje}</h6>
                        <small class="text-${esHoy ? 'danger' : 'warning'}">${esHoy ? 'HOY' : 'MAÑANA'}</small>
                    </div>
                    <p class="mb-1">${cita.paciente_nombre || 'Paciente'} ${cita.paciente_apellido || 'N/A'}</p>
                    <p class="mb-1">${cita.motivo || 'Consulta general'}</p>
                    <small class="text-muted">Estado: ${cita.estado}</small>
                </div>
            `;
        }).join('');
        
        container.innerHTML = notifications;
    }

    /**
     * Logout seguro del sistema
     */
    logout() {
        console.log('🚪 Cerrando sesión del odontólogo...');
        
        // Usar el middleware de autenticación si está disponible
        if (window.authMiddleware) {
            window.authMiddleware.secureLogout();
        } else {
            // Fallback manual
            this.manualLogout();
        }
    }

    manualLogout() {
        // Limpiar toda la información de sesión
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        sessionStorage.clear();
        
        // Invalidar la sesión en el historial del navegador
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, '/index.html');
        }
        
        // Marcar que estamos cerrando sesión
        window.loggingOut = true;
        
        console.log('✅ Sesión cerrada exitosamente');
        
        // Redirigir al index
        window.location.replace('/index.html?logout=true');
    }

    getEstadoBadgeClass(estado) {
        switch(estado) {
            case 'programada': return 'bg-primary';
            case 'confirmada': return 'bg-success';
            case 'completada': return 'bg-info';
            case 'cancelada': return 'bg-danger';
            case 'en_proceso': return 'bg-warning';
            case 'completado': return 'bg-success';
            case 'pendiente': return 'bg-secondary';
            case 'cancelado': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    formatEstado(estado) {
        switch(estado) {
            case 'en_proceso': return 'En Proceso';
            case 'completado': return 'Completado';
            case 'pendiente': return 'Pendiente';
            case 'cancelado': return 'Cancelado';
            case 'programada': return 'Programada';
            case 'confirmada': return 'Confirmada';
            case 'completada': return 'Completada';
            case 'cancelada': return 'Cancelada';
            default: return estado?.charAt(0).toUpperCase() + estado?.slice(1) || 'N/A';
        }
    }

    findCitaLocal(citaId) {
        const normalizeId = (value) => {
            if (value === null || value === undefined) return null;
            const numeric = Number(value);
            return Number.isNaN(numeric) ? value : numeric;
        };

        const targetId = normalizeId(citaId);
        const sources = [
            { nombre: 'misCitas', lista: this.citas },
            { nombre: 'agenda', lista: this.agenda },
            { nombre: 'historiales', lista: this.historiales }
        ];

        for (const source of sources) {
            if (!Array.isArray(source.lista) || source.lista.length === 0) {
                continue;
            }

            const citaEncontrada = source.lista.find((cita) => {
                const currentId = normalizeId(cita?.id);
                return currentId !== null && currentId === targetId;
            });

            if (citaEncontrada) {
                return { cita: citaEncontrada, origen: source.nombre };
            }
        }

        return { cita: null, origen: null };
    }

    verDetallesCita(citaId) {
        console.log('🔍 Buscando cita con ID:', citaId);
        console.log('📋 Citas disponibles (misCitas):', this.citas);
        console.log('📂 Agenda disponible:', this.agenda);
        
        const { cita, origen } = this.findCitaLocal(citaId);
        console.log('✅ Cita encontrada:', cita, '📌 Origen:', origen || 'desconocido');
        
        if (!cita) {
            console.error('❌ Cita no encontrada para ID:', citaId);
            this.showAlert('Cita no encontrada', 'danger');
            return;
        }

        const fecha = this.formatearFecha(cita.fecha, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Manejar la hora de forma más robusta
        let hora = 'No especificada';
        try {
            if (cita.hora) {
                // Si viene como string de tiempo (HH:MM:SS), extraer solo HH:MM
                if (typeof cita.hora === 'string' && cita.hora.includes(':')) {
                    const timeParts = cita.hora.split(':');
                    hora = `${timeParts[0]}:${timeParts[1]}`;
                } else {
                    // Intentar parsear como fecha completa
                    const fechaHora = new Date(`${cita.fecha}T${cita.hora}`);
                    if (!isNaN(fechaHora.getTime())) {
                        hora = fechaHora.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('Error al parsear hora:', error, 'Hora recibida:', cita.hora);
            hora = 'No especificada';
        }

        // Crear modal dinámico para mostrar detalles
        const modalHtml = `
            <div class="modal fade" id="modalDetallesCita" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-calendar-event me-2"></i>
                                Detalles de la Cita
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-body">
                                            <h6 class="card-title text-primary">
                                                <i class="bi bi-calendar-date me-2"></i>Fecha y Hora
                                            </h6>
                                            <p class="mb-1"><strong>Fecha:</strong> ${fecha}</p>
                                            <p class="mb-0"><strong>Hora:</strong> ${hora}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-body">
                                            <h6 class="card-title text-success">
                                                <i class="bi bi-person me-2"></i>Paciente
                                            </h6>
                                            <p class="mb-1"><strong>Nombre:</strong> ${cita.paciente_nombre || 'Paciente'} ${cita.paciente_apellido || 'N/A'}</p>
                                            <p class="mb-0"><strong>Estado:</strong> 
                                                <span class="badge ${this.getEstadoBadgeClass(cita.estado)}">${cita.estado.toUpperCase()}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6 class="card-title text-info">
                                                <i class="bi bi-clipboard-pulse me-2"></i>Información Médica
                                            </h6>
                                            <p class="mb-1"><strong>Motivo:</strong> ${cita.motivo || 'Consulta general'}</p>
                                            ${cita.notas ? `<p class="mb-0"><strong>Notas:</strong> ${cita.notas}</p>` : '<p class="mb-0 text-muted">Sin notas adicionales</p>'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            ${cita.estado !== 'completada' && cita.estado !== 'cancelada' ? `
                                <button type="button" class="btn btn-success" onclick="dashboardOdontologo.completarCita(${cita.id}); bootstrap.Modal.getInstance(document.getElementById('modalDetallesCita')).hide();">
                                    <i class="bi bi-check-circle me-1"></i>Marcar Completada
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const existingModal = document.getElementById('modalDetallesCita');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar modal al body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetallesCita'));
        modal.show();

        // Limpiar modal cuando se cierre
        document.getElementById('modalDetallesCita').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    confirmarCita(citaId) {
        const cita = this.agenda.find(c => c.id === citaId);
        if (!cita) {
            this.showAlert('Cita no encontrada', 'danger');
            return;
        }

        const fecha = this.formatearFecha(cita.fecha, { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        const hora = this.formatearHora(cita.hora);
        const nombrePaciente = `${cita.paciente_nombre || 'Paciente'} ${cita.paciente_apellido || 'N/A'}`;

        if (confirm(`¿Confirmar la cita del ${fecha} a las ${hora}?\n\nPaciente: ${nombrePaciente}\nMotivo: ${cita.motivo || 'Consulta general'}\n\nEl paciente será notificado de la confirmación.`)) {
            this.actualizarEstadoCita(citaId, 'confirmada', 'Cita confirmada exitosamente');
        }
    }

    completarCita(citaId) {
        const cita = this.agenda.find(c => c.id === citaId);
        if (!cita) {
            this.showAlert('Cita no encontrada', 'danger');
            return;
        }

        // Validar que no esté ya completada
        if (cita.estado === 'completada') {
            this.showAlert('Esta cita ya está completada.', 'warning');
            return;
        }

        // Validar que no esté cancelada
        if (cita.estado === 'cancelada') {
            this.showAlert('No se puede completar una cita cancelada.', 'warning');
            return;
        }

        // Calcular diferencia de horas con la fecha/hora de la cita
        const fechaCita = new Date(cita.fecha + 'T' + cita.hora);
        const ahora = new Date();
        const diffMs = fechaCita - ahora;
        const diffHoras = diffMs / (1000 * 60 * 60);

        // Solo se puede completar el día de la cita (24h antes o después)
        if (diffHoras > 24) {
            this.showAlert('Solo se puede completar una cita el mismo día o después de su fecha programada (máximo 24h antes).', 'warning');
            return;
        }

        const fecha = this.formatearFecha(cita.fecha, { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        const hora = this.formatearHora(cita.hora);
        const nombrePaciente = `${cita.paciente_nombre || 'Paciente'} ${cita.paciente_apellido || 'N/A'}`;

        if (confirm(`¿Marcar como COMPLETADA la cita del ${fecha} a las ${hora}?\n\nPaciente: ${nombrePaciente}\nMotivo: ${cita.motivo || 'Consulta general'}\n\nEsta acción indica que la consulta se realizó exitosamente.`)) {
            this.actualizarEstadoCita(citaId, 'completada', 'Cita marcada como completada');
        }
    }





    actualizarEstadoCita(citaId, nuevoEstado, mensajeExito, notas = null) {
        console.log(`🔄 Actualizando cita ${citaId} a estado: ${nuevoEstado}`);
        
        const updateData = { estado: nuevoEstado };
        if (notas) {
            updateData.notas_cancelacion = notas;
        }

        // Mostrar indicador de carga
        this.showAlert('Actualizando cita...', 'info');

        authFetch(`./api/citas/${citaId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(updateData)
        })
        .then(response => {
            console.log('📡 Respuesta del servidor:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📋 Datos recibidos:', data);
            
            if (data.success) {
                console.log('✅ Cita actualizada exitosamente');
                
                // Actualizar datos
                Promise.all([
                    this.loadAgenda(),
                    this.loadDashboardData(),
                    this.loadNotifications()
                ]).then(() => {
                    this.showAlert(mensajeExito, 'success');
                });
                
            } else {
                console.error('❌ Error en la respuesta:', data);
                this.showAlert('Error al actualizar cita: ' + (data.message || data.msg || 'Error desconocido'), 'danger');
            }
        })
        .catch(error => {
            console.error('❌ Error en la petición:', error);
            this.showAlert('Error de conexión al actualizar cita', 'danger');
        });
    }

    showAlert(message, type) {
        const alertContainer = document.getElementById('alert-container') || this.createAlertContainer();
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        alertContainer.appendChild(alert);
        
        // Auto-dismiss después de 3 segundos
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }

    createAlertContainer() {
        const container = document.createElement('div');
        container.id = 'alert-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.maxWidth = '400px';
        document.body.appendChild(container);
        return container;
    }

    // Funciones auxiliares para la agenda
    async updateResumenDia(fecha = null) {
        try {
            let citasDelDia = [];
            
            if (fecha) {
                citasDelDia = this.agenda ? this.agenda.filter(cita => cita.fecha.split('T')[0] === fecha) : [];
            } else {
                const hoy = new Date().toISOString().split('T')[0];
                citasDelDia = this.agenda ? this.agenda.filter(cita => cita.fecha.split('T')[0] === hoy) : [];
            }

            const total = citasDelDia.length;
            const confirmadas = citasDelDia.filter(c => c.estado === 'confirmada').length;
            const pendientes = citasDelDia.filter(c => c.estado === 'programada').length;
            const completadas = citasDelDia.filter(c => c.estado === 'completada').length;

            // Actualizar elementos con animación
            this.animateCounter('totalCitasDia', total);
            this.animateCounter('citasConfirmadas', confirmadas);
            this.animateCounter('citasPendientes', pendientes);
            this.animateCounter('citasCompletadas', completadas);
            
        } catch (error) {
            console.error('Error al actualizar resumen del día:', error);
        }
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        const increment = targetValue > currentValue ? 1 : -1;
        let current = currentValue;
        
        const timer = setInterval(() => {
            if (current === targetValue) {
                clearInterval(timer);
                return;
            }
            current += increment;
            element.textContent = current;
        }, 50);
    }

    verCitasHoy() {
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaAgenda').value = hoy;
        this.loadAgenda(hoy);
        this.updateResumenDia(hoy);
    }

    verCitasManana() {
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const fechaManana = manana.toISOString().split('T')[0];
        document.getElementById('fechaAgenda').value = fechaManana;
        this.loadAgenda(fechaManana);
        this.updateResumenDia(fechaManana);
    }

    verCitasSemana() {
        const hoy = new Date();
        const finSemana = new Date();
        finSemana.setDate(hoy.getDate() + 7);
        
        // Cargar todas las citas y filtrar por la semana
        this.loadAgenda();
        this.updateResumenDia();
    }

    // === NUEVAS FUNCIONALIDADES ===

    /**
     * Cargar las citas específicas del odontólogo con detalles completos
     */
    async loadMisCitas() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.log('No hay usuario logueado');
                return;
            }

            console.log(`🦷 Cargando mis citas para odontólogo ID: ${userId}`);
            
            // Mostrar loading
            const tableContainer = document.getElementById('misCitasTableContainer');
            if (tableContainer) {
                tableContainer.innerHTML = `
                    <div class="text-center p-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-2">Cargando mis citas...</p>
                    </div>
                `;
            }
            
            const response = await authFetch(`/api/citas/odontologo/${userId}`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📋 Datos de mis citas recibidos:', data);
            
            if (data.success) {
                this.renderMisCitas(data.citas, data.estadisticas);
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
            
        } catch (error) {
            console.error('❌ Error al cargar mis citas:', error);
            const tableContainer = document.getElementById('misCitasTableContainer');
            if (tableContainer) {
                tableContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i>
                        Error al cargar las citas: ${error.message}
                    </div>
                `;
            }
        }
    }

    /**
     * Renderizar la tabla de mis citas
     */
    renderMisCitas(citas, estadisticas) {
        // Guardar las citas para uso posterior
        this.citas = citas || [];
        
        // Generate pagination
        const totalItems = this.citas.length;
        this.generatePagination('citas', totalItems);
        
        // Actualizar estadísticas
        const statsContainer = document.getElementById('misCitasStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-2">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h3 class="card-title">${estadisticas.total || 0}</h3>
                                <p class="card-text">Total</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h3 class="card-title">${estadisticas.programadas || 0}</h3>
                                <p class="card-text">Programadas</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h3 class="card-title">${estadisticas.completadas || 0}</h3>
                                <p class="card-text">Completadas</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="card bg-danger text-white">
                            <div class="card-body text-center">
                                <h3 class="card-title">${estadisticas.canceladas || 0}</h3>
                                <p class="card-text">Canceladas</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="card bg-warning text-white">
                            <div class="card-body text-center">
                                <h3 class="card-title">${estadisticas.hoy || 0}</h3>
                                <p class="card-text">Hoy</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="card bg-secondary text-white">
                            <div class="card-body text-center">
                                <h3 class="card-title">${estadisticas.proximas || 0}</h3>
                                <p class="card-text">Próximas</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Renderizar tabla
        const tableContainer = document.getElementById('misCitasTableContainer');
        if (!tableContainer) return;

        if (!citas || citas.length === 0) {
            tableContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No tienes citas programadas en este momento.
                </div>
            `;
            return;
        }

        // Apply pagination
        const config = this.pagination.citas;
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = startIndex + config.itemsPerPage;
        const paginatedCitas = citas.slice(startIndex, endIndex);

        const tableHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Paciente</th>
                            <th>Contacto</th>
                            <th>Motivo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paginatedCitas.map(cita => `
                            <tr class="${this.getRowClass(cita.estado)}">
                                <td>
                                    <strong>${cita.fecha_formateada || 'N/A'}</strong>
                                    ${cita.dias_hasta_cita !== null ? 
                                        (cita.dias_hasta_cita < 0 ? 
                                            `<br><small class="text-muted">Hace ${Math.abs(cita.dias_hasta_cita)} días</small>` :
                                            cita.dias_hasta_cita === 0 ? 
                                                `<br><small class="text-warning"><strong>¡HOY!</strong></small>` :
                                                `<br><small class="text-info">En ${cita.dias_hasta_cita} días</small>`
                                        ) : ''
                                    }
                                </td>
                                <td><strong>${cita.hora_formateada || 'N/A'}</strong></td>
                                <td>
                                    <strong>${cita.paciente_completo}</strong>
                                    ${cita.numero_documento ? `<br><small class="text-muted">${cita.tipo_documento || 'DOC'}: ${cita.numero_documento}</small>` : ''}
                                </td>
                                <td>
                                    ${cita.paciente_correo ? `<div><i class="fas fa-envelope"></i> ${cita.paciente_correo}</div>` : ''}
                                    ${cita.paciente_telefono ? `<div><i class="fas fa-phone"></i> ${cita.paciente_telefono}</div>` : ''}
                                </td>
                                <td>
                                    ${cita.motivo || 'Sin especificar'}
                                    ${cita.notas ? `<br><small class="text-muted"><i class="fas fa-sticky-note"></i> ${cita.notas}</small>` : ''}
                                </td>
                                <td>
                                    <span class="badge ${this.getStatusBadgeClass(cita.estado)}">
                                        ${cita.estado_texto}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button class="btn btn-primary btn-sm" onclick="dashboardOdontologo.verDetallesCita(${cita.id})" title="Ver detalles">
                                            Ver
                                        </button>
                                        ${(() => {
                                            // Calcular si se puede completar la cita (solo el día de la cita o después)
                                            const fechaCita = new Date(cita.fecha + 'T' + cita.hora);
                                            const ahora = new Date();
                                            const diffMs = fechaCita - ahora;
                                            const diffHoras = diffMs / (1000 * 60 * 60);
                                            const puedeCompletar = cita.estado !== 'completada' && 
                                                                  cita.estado !== 'cancelada' && 
                                                                  diffHoras <= 24; // Solo se puede completar el día de la cita o después
                                            
                                            if (cita.estado === 'completada') {
                                                return `
                                                    <button class="btn btn-info btn-sm" onclick="dashboardOdontologo.verHistorialPaciente(${cita.paciente_id})" title="Ver historial del paciente">
                                                        Historial
                                                    </button>
                                                `;
                                            } else if (cita.estado !== 'cancelada') {
                                                return `
                                                    <button class="btn btn-success btn-sm" 
                                                            onclick="dashboardOdontologo.completarCita(${cita.id})" 
                                                            ${!puedeCompletar ? 'disabled' : ''}
                                                            title="${puedeCompletar ? 'Marcar como completada' : 'Solo se puede completar el día de la cita (24h antes o después)'}">
                                                        Completar
                                                    </button>
                                                `;
                                            }
                                            return '';
                                        })()}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        tableContainer.innerHTML = tableHTML;
    }

    /**
     * Cargar información personal del odontólogo
     */
    async loadMiPerfil() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.log('No hay usuario logueado');
                return;
            }

            console.log(`👤 Cargando perfil del odontólogo ID: ${userId}`);
            
            // Mostrar loading
            const perfilContainer = document.getElementById('miPerfilContainer');
            if (perfilContainer) {
                perfilContainer.innerHTML = `
                    <div class="text-center p-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-2">Cargando mi información...</p>
                    </div>
                `;
            }
            
            const response = await authFetch(`/api/usuarios/${userId}/perfil`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const usuario = await response.json();
            console.log('👤 Datos del perfil recibidos:', usuario);
            
            this.renderMiPerfil(usuario);
            
        } catch (error) {
            console.error('❌ Error al cargar mi perfil:', error);
            const perfilContainer = document.getElementById('miPerfilContainer');
            if (perfilContainer) {
                perfilContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i>
                        Error al cargar la información personal: ${error.message}
                    </div>
                `;
            }
        }
    }

    /**
     * Convertir estado del usuario a texto legible
     */
    formatearEstadoUsuario(estado) {
        if (estado === true || estado === 'true' || estado === 'activo' || estado === 'active') {
            return 'Activo';
        } else if (estado === false || estado === 'false' || estado === 'inactivo' || estado === 'inactive') {
            return 'Inactivo';
        } else if (estado === 'suspendido' || estado === 'suspended') {
            return 'Suspendido';
        } else if (estado === 'pendiente' || estado === 'pending') {
            return 'Pendiente';
        } else if (typeof estado === 'string' && estado.length > 0) {
            return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
        }
        return 'Activo'; // Estado por defecto
    }

    /**
     * Obtener clase CSS para el badge del estado
     */
    obtenerClaseEstado(estado) {
        const estadoFormateado = this.formatearEstadoUsuario(estado);
        switch (estadoFormateado) {
            case 'Activo':
                return 'bg-success';
            case 'Inactivo':
                return 'bg-secondary';
            case 'Suspendido':
                return 'bg-danger';
            case 'Pendiente':
                return 'bg-warning';
            default:
                return 'bg-success';
        }
    }

    /**
     * Renderizar información personal del odontólogo
     */
    renderMiPerfil(usuario) {
        const perfilContainer = document.getElementById('miPerfilContainer');
        if (!perfilContainer) return;

        const estadoFormateado = this.formatearEstadoUsuario(usuario.estado);
        const claseEstado = this.obtenerClaseEstado(usuario.estado);

        const perfilHTML = `
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-person-badge"></i> Información Personal</h5>
                        </div>
                        <div class="card-body text-center">
                            ${usuario.avatar_url ? 
                                `<img src="${usuario.avatar_url}" class="rounded-circle mb-3" width="120" height="120" alt="Avatar">` :
                                `<div class="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 120px; height: 120px;">
                                    <i class="bi bi-person-fill text-white" style="font-size: 3rem;"></i>
                                </div>`
                            }
                            <h4>${usuario.nombre || 'N/A'} ${usuario.apellido || 'N/A'}</h4>
                            <p class="text-muted">Odontólogo</p>
                            <p class="text-muted">Estado: <span class="badge ${claseEstado}">${estadoFormateado}</span></p>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-info-circle"></i> Detalles</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Correo Electrónico:</label>
                                        <p class="form-control-plaintext">${usuario.correo || 'No especificado'}</p>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Teléfono:</label>
                                        <p class="form-control-plaintext">${usuario.telefono || 'No especificado'}</p>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Dirección:</label>
                                        <p class="form-control-plaintext">${usuario.direccion || 'No especificada'}</p>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Tipo de Documento:</label>
                                        <p class="form-control-plaintext">${usuario.tipo_documento || 'No especificado'}</p>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Número de Documento:</label>
                                        <p class="form-control-plaintext">${usuario.numero_documento || 'No especificado'}</p>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Fecha de Nacimiento:</label>
                                        <p class="form-control-plaintext">
                                            ${usuario.fecha_nacimiento ? 
                                                this.formatearFecha(usuario.fecha_nacimiento) : 
                                                'No especificada'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Fecha de Registro:</label>
                                <p class="form-control-plaintext">
                                    ${usuario.fecha_registro ? 
                                        this.formatearFecha(usuario.fecha_registro) : 
                                        'No disponible'
                                    }
                                </p>
                            </div>
                            <div class="mt-4">
                                <button class="btn btn-primary" onclick="dashboardOdontologo.editarPerfil()">
                                    <i class="bi bi-pencil-square"></i> Editar Información
                                </button>
                                <button class="btn btn-secondary ms-2" onclick="dashboardOdontologo.cambiarContrasena()">
                                    <i class="bi bi-key"></i> Cambiar Contraseña
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        perfilContainer.innerHTML = perfilHTML;
    }

    // === MÉTODOS DE UTILIDAD ===

    getRowClass(estado) {
        switch(estado) {
            case 'completada': return 'table-success';
            case 'cancelada': return 'table-danger';
            case 'programada': return '';
            default: return 'table-warning';
        }
    }

    getStatusBadgeClass(estado) {
        switch(estado) {
            case 'completada': return 'bg-success';
            case 'cancelada': return 'bg-danger';
            case 'programada': return 'bg-info';
            default: return 'bg-warning';
        }
    }

    // === MÉTODOS DE ACCIONES ===

    async completarCita(citaId) {
        const cita = this.citas.find(c => c.id === citaId);
        if (!cita) {
            alert('Cita no encontrada');
            return;
        }

        // Validar que no esté ya completada
        if (cita.estado === 'completada') {
            alert('Esta cita ya está completada.');
            return;
        }

        // Validar que no esté cancelada
        if (cita.estado === 'cancelada') {
            alert('No se puede completar una cita cancelada.');
            return;
        }

        // Calcular diferencia de horas con la fecha/hora de la cita
        const fechaCita = new Date(cita.fecha + 'T' + cita.hora);
        const ahora = new Date();
        const diffMs = fechaCita - ahora;
        const diffHoras = diffMs / (1000 * 60 * 60);

        // Solo se puede completar el día de la cita (24h antes o después)
        if (diffHoras > 24) {
            alert('Solo se puede completar una cita el mismo día o después de su fecha programada (máximo 24h antes).');
            return;
        }

        if (!confirm('¿Está seguro de marcar esta cita como completada?')) {
            return;
        }

        try {
            const response = await authFetch(`/api/citas/${citaId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ estado: 'completada' })
            });

            if (response.ok) {
                alert('Cita marcada como completada');
                this.loadMisCitas(); // Recargar la lista
            } else {
                throw new Error('Error al actualizar la cita');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al completar la cita: ' + error.message);
        }
    }





    async editarPerfil() {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('Error: Usuario no identificado');
            return;
        }

        try {
            // Obtener datos actuales del usuario
            const response = await authFetch(`/api/usuarios/${userId}/perfil`);
            if (!response.ok) {
                throw new Error('Error al obtener datos del usuario');
            }
            const usuario = await response.json();

            // Crear modal de edición
            const modalHTML = `
                <div class="modal fade" id="modalEditarPerfil" tabindex="-1" aria-labelledby="modalEditarPerfilLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="modalEditarPerfilLabel">
                                    <i class="fas fa-user-edit"></i> Editar Información Personal
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="formEditarPerfil">
                                    <div class="mb-3">
                                        <label for="editNombre" class="form-label">Nombre *</label>
                                        <input type="text" class="form-control" id="editNombre" name="nombre" value="${usuario.nombre || ''}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="editApellido" class="form-label">Apellido *</label>
                                        <input type="text" class="form-control" id="editApellido" name="apellido" value="${usuario.apellido || ''}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="editTelefono" class="form-label">Teléfono</label>
                                        <input type="tel" class="form-control" id="editTelefono" name="telefono" value="${usuario.telefono || ''}">
                                    </div>
                                    <div class="mb-3">
                                        <label for="editDireccion" class="form-label">Dirección</label>
                                        <input type="text" class="form-control" id="editDireccion" name="direccion" value="${usuario.direccion || ''}">
                                    </div>
                                    <div class="mb-3">
                                        <label for="editFechaNacimiento" class="form-label">Fecha de Nacimiento</label>
                                        <input type="date" class="form-control" id="editFechaNacimiento" name="fecha_nacimiento" value="${usuario.fecha_nacimiento ? usuario.fecha_nacimiento.split('T')[0] : ''}">
                                    </div>
                                    <div id="alertContainer"></div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="btnGuardarPerfil">
                                    <i class="fas fa-save"></i> Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;

            // Eliminar modal existente si existe
            const existingModal = document.getElementById('modalEditarPerfil');
            if (existingModal) {
                existingModal.remove();
            }

            // Agregar modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalEditarPerfil'));
            modal.show();

            // Configurar evento para guardar cambios
            document.getElementById('btnGuardarPerfil').addEventListener('click', async () => {
                await this.guardarCambiosPerfil(userId, modal);
            });

        } catch (error) {
            console.error('Error al abrir editor de perfil:', error);
            alert('Error al cargar los datos del perfil');
        }
    }

    async guardarCambiosPerfil(userId, modal) {
        const form = document.getElementById('formEditarPerfil');
        const alertContainer = document.getElementById('alertContainer');
        
        // Validar formulario
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const datos = {
            nombre: document.getElementById('editNombre').value.trim(),
            apellido: document.getElementById('editApellido').value.trim(),
            telefono: document.getElementById('editTelefono').value.trim(),
            direccion: document.getElementById('editDireccion').value.trim(),
            fecha_nacimiento: document.getElementById('editFechaNacimiento').value || null
        };

        try {
            // Mostrar loading
            const btnGuardar = document.getElementById('btnGuardarPerfil');
            const originalText = btnGuardar.innerHTML;
            btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            btnGuardar.disabled = true;

            const response = await authFetch(`/api/usuarios/${userId}/perfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(datos)
            });

            const result = await response.json();

            if (response.ok) {
                // Éxito - actualizar datos en localStorage si es necesario
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.nombre = datos.nombre;
                user.apellido = datos.apellido;
                localStorage.setItem('user', JSON.stringify(user));

                // Mostrar mensaje de éxito
                alertContainer.innerHTML = `
                    <div class="alert alert-success" role="alert">
                        <i class="fas fa-check-circle"></i> Perfil actualizado exitosamente
                    </div>`;

                // Cerrar modal después de un breve delay
                setTimeout(() => {
                    modal.hide();
                    // Recargar la sección de perfil para mostrar los cambios
                    this.loadMiPerfil();
                }, 1500);

            } else {
                // Error del servidor
                alertContainer.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle"></i> ${result.msg || 'Error al actualizar el perfil'}
                    </div>`;
            }

        } catch (error) {
            console.error('Error al guardar perfil:', error);
            alertContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle"></i> Error de conexión
                </div>`;
        } finally {
            // Restaurar botón
            const btnGuardar = document.getElementById('btnGuardarPerfil');
            if (btnGuardar) {
                btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
                btnGuardar.disabled = false;
            }
        }
    }

    cambiarContrasena() {
        // Crear modal para cambiar contraseña
        const modalHTML = `
            <div class="modal fade" id="cambiarPasswordModal" tabindex="-1" aria-labelledby="cambiarPasswordModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="cambiarPasswordModalLabel">
                                <i class="fas fa-key"></i> Cambiar Contraseña
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="cambiarPasswordForm">
                                <div class="mb-3">
                                    <label for="currentPassword" class="form-label">Contraseña Actual</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="currentPassword" required>
                                        <button class="btn btn-outline-secondary" type="button" onclick="this.togglePasswordVisibility('currentPassword')">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="newPassword" class="form-label">Nueva Contraseña</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="newPassword" required minlength="6">
                                        <button class="btn btn-outline-secondary" type="button" onclick="this.togglePasswordVisibility('newPassword')">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                    </div>
                                    <div class="form-text">La contraseña debe tener al menos 6 caracteres.</div>
                                </div>
                                <div class="mb-3">
                                    <label for="confirmPassword" class="form-label">Confirmar Nueva Contraseña</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="confirmPassword" required minlength="6">
                                        <button class="btn btn-outline-secondary" type="button" onclick="this.togglePasswordVisibility('confirmPassword')">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                <div id="passwordError" class="alert alert-danger d-none"></div>
                                <div id="passwordSuccess" class="alert alert-success d-none"></div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="dashboardOdontologo.procesarCambioPassword()" id="btnCambiarPassword">
                                <i class="fas fa-save"></i> Cambiar Contraseña
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const existingModal = document.getElementById('cambiarPasswordModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('cambiarPasswordModal'));
        modal.show();

        // Agregar funcionalidad para mostrar/ocultar contraseñas
        window.togglePasswordVisibility = function(fieldId) {
            const field = document.getElementById(fieldId);
            const button = field.nextElementSibling;
            const icon = button.querySelector('i');
            
            if (field.type === 'password') {
                field.type = 'text';
                icon.className = 'bi bi-eye-slash';
            } else {
                field.type = 'password';
                icon.className = 'bi bi-eye';
            }
        };
    }

    async procesarCambioPassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorDiv = document.getElementById('passwordError');
        const successDiv = document.getElementById('passwordSuccess');
        const btnCambiar = document.getElementById('btnCambiarPassword');

        // Limpiar mensajes anteriores
        errorDiv.classList.add('d-none');
        successDiv.classList.add('d-none');

        // Validaciones
        if (!currentPassword || !newPassword || !confirmPassword) {
            errorDiv.textContent = 'Todos los campos son obligatorios.';
            errorDiv.classList.remove('d-none');
            return;
        }

        if (newPassword.length < 6) {
            errorDiv.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.';
            errorDiv.classList.remove('d-none');
            return;
        }

        if (newPassword !== confirmPassword) {
            errorDiv.textContent = 'Las contraseñas no coinciden.';
            errorDiv.classList.remove('d-none');
            return;
        }

        if (currentPassword === newPassword) {
            errorDiv.textContent = 'La nueva contraseña debe ser diferente a la actual.';
            errorDiv.classList.remove('d-none');
            return;
        }

        try {
            // Deshabilitar botón durante el proceso
            btnCambiar.disabled = true;
            btnCambiar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando...';

            const userData = JSON.parse(localStorage.getItem('userData'));
            
            const response = await fetch('/api/auth/cambiar-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userData.id,
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                successDiv.textContent = 'Contraseña cambiada exitosamente. Por favor, inicia sesión nuevamente con tu nueva contraseña.';
                successDiv.classList.remove('d-none');
                
                // Limpiar formulario
                document.getElementById('cambiarPasswordForm').reset();
                
                // Cerrar modal después de 3 segundos
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('cambiarPasswordModal'));
                    modal.hide();
                    
                    // Opcional: Redirigir a login para que inicie sesión con la nueva contraseña
                    if (confirm('Contraseña cambiada exitosamente. ¿Deseas cerrar sesión para iniciar con la nueva contraseña?')) {
                        localStorage.clear();
                        window.location.href = '/index.html';
                    }
                }, 2000);
                
            } else {
                errorDiv.textContent = data.msg || 'Error al cambiar la contraseña.';
                errorDiv.classList.remove('d-none');
            }

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            errorDiv.textContent = 'Error de conexión. Por favor, intenta nuevamente.';
            errorDiv.classList.remove('d-none');
        } finally {
            // Rehabilitar botón
            btnCambiar.disabled = false;
            btnCambiar.innerHTML = '<i class="fas fa-save"></i> Cambiar Contraseña';
        }
    }

    // ==========================================
    // SISTEMA DE PAGOS E INGRESOS
    // ==========================================

    async loadPagosIngresos() {
        console.log('💰 [ODONTOLOGO] Cargando sistema de pagos e ingresos...');
        
        try {
            // Cargar resumen financiero
            await this.loadResumenFinanciero();
            
            // Cargar comisiones por defecto
            await this.loadComisiones();
            
            // Configurar filtros
            this.setupPagoFilters();
            
            console.log('✅ Sistema de pagos cargado exitosamente');
        } catch (error) {
            console.error('❌ Error cargando sistema de pagos:', error);
            this.showPagosError();
        }
    }

    async loadResumenFinanciero() {
        try {
            const response = await fetch('/api/pagos-ext/odontologo/resumen-financiero', {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayResumenFinanciero(data.estadisticas, data.ingresos_mensuales, data.top_tratamientos);
                } else {
                    throw new Error(data.message);
                }
            } else {
                throw new Error('Error al obtener resumen financiero');
            }
        } catch (error) {
            console.error('❌ Error cargando resumen financiero:', error);
        }
    }

    displayResumenFinanciero(estadisticas, ingresosMensuales, topTratamientos) {
        // Actualizar cards de estadísticas
        document.getElementById('totalIngresos').textContent = 
            this.formatCurrency(estadisticas.ingresos_totales || 0);
        document.getElementById('comisionesCobradas').textContent = 
            this.formatCurrency(estadisticas.comisiones_cobradas || 0);
        document.getElementById('comisionesPendientes').textContent = 
            this.formatCurrency(estadisticas.comisiones_pendientes || 0);
        document.getElementById('totalFacturas').textContent = 
            estadisticas.total_facturas || 0;

        // Crear gráfico de ingresos mensuales
        this.createIngresosMensualesChart(ingresosMensuales);
        
        // Crear gráfico de top tratamientos
        this.createTopTratamientosChart(topTratamientos);
    }

    createIngresosMensualesChart(data) {
        const ctx = document.getElementById('chartIngresosMensuales');
        if (!ctx) return;

        if (this.charts.ingresosMensuales) {
            this.charts.ingresosMensuales.destroy();
        }

        const labels = data.map(item => {
            const [year, month] = item.mes.split('-');
            return `${this.getMonthName(parseInt(month))} ${year}`;
        }).reverse();
        
        const valores = data.map(item => parseFloat(item.total_mes || 0)).reverse();

        this.charts.ingresosMensuales = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Ingresos ($)',
                    data: valores,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    createTopTratamientosChart(data) {
        const ctx = document.getElementById('chartTopTratamientos');
        if (!ctx) return;

        if (this.charts.topTratamientos) {
            this.charts.topTratamientos.destroy();
        }

        const labels = data.map(item => item.concepto);
        const valores = data.map(item => parseFloat(item.total_ingresos || 0));
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8'];

        this.charts.topTratamientos = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: valores,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            fontSize: 12,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    async loadComisiones(estado = null) {
        try {
            let url = '/api/pagos-ext/odontologo/comisiones?limit=20&offset=0';
            if (estado) {
                url += `&estado=${estado}`;
            }

            const response = await fetch(url, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayComisiones(data.comisiones);
                } else {
                    throw new Error(data.message);
                }
            } else {
                throw new Error('Error al obtener comisiones');
            }
        } catch (error) {
            console.error('❌ Error cargando comisiones:', error);
            this.showComisionesError();
        }
    }

    displayComisiones(comisiones) {
        const container = document.getElementById('comisionesContainer');
        if (!container) return;

        // Store comisiones for pagination
        this.comisiones = comisiones || [];
        
        // Generate pagination
        const totalItems = this.comisiones.length;
        this.generatePagination('comisiones', totalItems);

        if (!comisiones || comisiones.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-percent display-4 text-muted"></i>
                    <h5 class="text-muted mt-3">No hay comisiones registradas</h5>
                    <p class="text-muted">Las comisiones aparecerán aquí cuando se generen facturas.</p>
                </div>
            `;
            return;
        }

        // Apply pagination
        const config = this.pagination.comisiones;
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = startIndex + config.itemsPerPage;
        const paginatedComisiones = comisiones.slice(startIndex, endIndex);

        const comisionesHtml = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Fecha</th>
                            <th>Paciente</th>
                            <th>Tratamiento</th>
                            <th>Factura</th>
                            <th>Monto Base</th>
                            <th>% Comisión</th>
                            <th>Comisión</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paginatedComisiones.map(comision => {
                            const fechaCalculo = new Date(comision.fecha_calculo).toLocaleDateString();
                            const estadoBadge = this.getEstadoBadge(comision.estado);
                            
                            return `
                                <tr>
                                    <td>${fechaCalculo}</td>
                                    <td>${comision.paciente_nombre || 'N/A'}</td>
                                    <td>${comision.tratamiento || 'N/A'}</td>
                                    <td>
                                        <span class="badge bg-secondary">${comision.numero_factura}</span>
                                    </td>
                                    <td>${this.formatCurrency(comision.monto_base)}</td>
                                    <td>${comision.porcentaje_comision}%</td>
                                    <td class="fw-bold text-success">${this.formatCurrency(comision.monto_comision)}</td>
                                    <td>${estadoBadge}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = comisionesHtml;
    }

    async loadFacturas(estado = null) {
        try {
            let url = '/api/pagos-ext/odontologo/facturas?limit=20&offset=0';
            if (estado) {
                url += `&estado=${estado}`;
            }

            const response = await fetch(url, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayFacturas(data.facturas);
                } else {
                    throw new Error(data.message);
                }
            } else {
                throw new Error('Error al obtener facturas');
            }
        } catch (error) {
            console.error('❌ Error cargando facturas:', error);
            this.showFacturasError();
        }
    }

    displayFacturas(facturas) {
        const container = document.getElementById('facturasContainer');
        if (!container) return;

        // Store facturas for pagination
        this.facturas = facturas || [];
        
        // Generate pagination
        const totalItems = this.facturas.length;
        this.generatePagination('facturas', totalItems);

        if (!facturas || facturas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-receipt display-4 text-muted"></i>
                    <h5 class="text-muted mt-3">No hay facturas registradas</h5>
                    <p class="text-muted">Las facturas aparecerán aquí cuando se generen.</p>
                </div>
            `;
            return;
        }

        // Apply pagination
        const config = this.pagination.facturas;
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = startIndex + config.itemsPerPage;
        const paginatedFacturas = facturas.slice(startIndex, endIndex);

        const facturasHtml = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Número</th>
                            <th>Fecha</th>
                            <th>Paciente</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Comisión</th>
                            <th>Estado</th>
                            <th>Vencimiento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paginatedFacturas.map(factura => {
                            const fechaEmision = new Date(factura.fecha_emision).toLocaleDateString();
                            const fechaVencimiento = new Date(factura.fecha_vencimiento).toLocaleDateString();
                            const estadoBadge = this.getEstadoFacturaBadge(factura.estado);
                            const estadoComisionBadge = this.getEstadoBadge(factura.estado_comision);
                            
                            return `
                                <tr>
                                    <td>
                                        <span class="badge bg-primary">${factura.numero_factura}</span>
                                    </td>
                                    <td>${fechaEmision}</td>
                                    <td>${factura.paciente_nombre || 'N/A'}</td>
                                    <td>${factura.items_count} item(s)</td>
                                    <td class="fw-bold">${this.formatCurrency(factura.total)}</td>
                                    <td>
                                        <div>${this.formatCurrency(factura.comision_odontologo || 0)}</div>
                                        <small>${estadoComisionBadge}</small>
                                    </td>
                                    <td>${estadoBadge}</td>
                                    <td>${fechaVencimiento}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = facturasHtml;
    }

    setupPagoFilters() {
        // Filtro de comisiones
        const filtroComision = document.getElementById('filtroEstadoComision');
        if (filtroComision) {
            filtroComision.addEventListener('change', (e) => {
                this.loadComisiones(e.target.value || null);
            });
        }

        // Filtro de facturas
        const filtroFactura = document.getElementById('filtroEstadoFactura');
        if (filtroFactura) {
            filtroFactura.addEventListener('change', (e) => {
                this.loadFacturas(e.target.value || null);
            });
        }

        // Tab de facturas
        const facturasTab = document.getElementById('facturas-tab');
        if (facturasTab) {
            facturasTab.addEventListener('click', () => {
                this.loadFacturas();
            });
        }
    }

    // Funciones helper
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount || 0);
    }

    getEstadoBadge(estado) {
        const badges = {
            'pendiente': '<span class="badge bg-warning">Pendiente</span>',
            'pagada': '<span class="badge bg-success">Pagada</span>',
            'retenida': '<span class="badge bg-danger">Retenida</span>'
        };
        return badges[estado] || '<span class="badge bg-secondary">N/A</span>';
    }

    getEstadoFacturaBadge(estado) {
        const badges = {
            'pendiente': '<span class="badge bg-warning">Pendiente</span>',
            'pagada': '<span class="badge bg-success">Pagada</span>',
            'vencida': '<span class="badge bg-danger">Vencida</span>',
            'cancelada': '<span class="badge bg-secondary">Cancelada</span>'
        };
        return badges[estado] || '<span class="badge bg-secondary">N/A</span>';
    }

    getMonthName(monthNumber) {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[monthNumber - 1] || 'N/A';
    }

    showPagosError() {
        const containers = ['comisionesContainer', 'facturasContainer'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                        <h5 class="text-muted mt-3">Error al cargar datos</h5>
                        <button class="btn btn-primary" onclick="dashboardOdontologo.loadPagosIngresos()">
                            <i class="bi bi-arrow-clockwise"></i> Reintentar
                        </button>
                    </div>
                `;
            }
        });
    }

    showComisionesError() {
        const container = document.getElementById('comisionesContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                    <h5 class="text-muted mt-3">Error al cargar comisiones</h5>
                    <button class="btn btn-primary" onclick="dashboardOdontologo.loadComisiones()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }

    showFacturasError() {
        const container = document.getElementById('facturasContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                    <h5 class="text-muted mt-3">Error al cargar facturas</h5>
                    <button class="btn btn-primary" onclick="dashboardOdontologo.loadFacturas()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }

    async loadPagosIngresos() {
        console.log('💰 [ODONTOLOGO] Cargando sistema de pagos e ingresos...');
        
        try {
            // Cargar resumen financiero
            await this.loadResumenFinanciero();
            
            // Cargar historial de comisiones por defecto
            await this.loadHistorialComisiones();
            
            // Configurar event listeners para filtros
            this.setupPagosEventListeners();
            
        } catch (error) {
            console.error('❌ Error cargando pagos:', error);
            this.showError('Error al cargar información financiera');
        }
    }

    async loadResumenFinanciero() {
        try {
            const response = await fetch('/api/pagos-ext/odontologo/resumen-financiero', {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (data.success) {
                this.displayEstadisticasFinancieras(data.estadisticas);
                this.displayGraficosFinancieros(data.ingresos_mensuales);
            }
            
        } catch (error) {
            console.error('❌ Error obteniendo resumen financiero:', error);
        }
    }

    displayEstadisticasFinancieras(stats) {
        // Formatear números a pesos colombianos
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(amount || 0);
        };
        
        // Actualizar cards de estadísticas
        const totalIngresos = document.getElementById('totalIngresos');
        const comisionesCobradas = document.getElementById('comisionesCobradas');
        const comisionesPendientes = document.getElementById('comisionesPendientes');
        const totalFacturas = document.getElementById('totalFacturas');
        
        if (totalIngresos) totalIngresos.textContent = formatCurrency(stats.ingresos_totales);
        if (comisionesCobradas) comisionesCobradas.textContent = formatCurrency(stats.comisiones_cobradas);
        if (comisionesPendientes) comisionesPendientes.textContent = formatCurrency(stats.comisiones_pendientes);
        if (totalFacturas) totalFacturas.textContent = stats.total_facturas || 0;
    }

    displayGraficosFinancieros(ingresosMensuales) {
        // Gráfico de ingresos mensuales
        this.createChartIngresosMensuales(ingresosMensuales);
    }

    createChartIngresosMensuales(data) {
        const ctx = document.getElementById('chartIngresosMensuales');
        if (!ctx) return;
        
        // Destruir gráfico existente si existe
        if (this.charts.ingresosMensuales) {
            this.charts.ingresosMensuales.destroy();
        }
        
        const labels = data.map(item => {
            const [year, month] = item.mes.split('-');
            return new Date(year, month - 1).toLocaleDateString('es-CO', { 
                month: 'short', 
                year: 'numeric' 
            });
        }).reverse();
        
        const valores = data.map(item => item.total_mes).reverse();
        
        this.charts.ingresosMensuales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ingresos ($)',
                    data: valores,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    async loadHistorialComisiones(estado = '') {
        try {
            const params = new URLSearchParams({ limit: 20, offset: 0 });
            if (estado) params.set('estado', estado);
            
            const response = await fetch(`/api/pagos-ext/odontologo/comisiones?${params}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (data.success) {
                this.displayHistorialComisiones(data.comisiones);
            }
            
        } catch (error) {
            console.error('❌ Error cargando comisiones:', error);
            this.showErrorInContainer('comisionesContainer', 'Error al cargar comisiones');
        }
    }

    displayHistorialComisiones(comisiones) {
        const container = document.getElementById('comisionesContainer');
        if (!container) return;

        if (!comisiones || comisiones.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-inbox display-4 text-muted"></i>
                    <h5 class="text-muted mt-3">No hay comisiones registradas</h5>
                    <p class="text-muted">Las comisiones aparecerán aquí cuando se procesen los pagos.</p>
                </div>
            `;
            return;
        }

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(amount || 0);
        };

        const formatDate = (dateString) => {
            // Función robusta de formateo de fechas
            try {
                if (!dateString) return 'Fecha no especificada';
                
                let fecha;
                
                if (dateString instanceof Date && !isNaN(dateString.getTime())) {
                    fecha = dateString;
                } else if (typeof dateString === 'string') {
                    if (dateString.includes('T')) {
                        fecha = new Date(dateString);
                    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        fecha = new Date(dateString + 'T00:00:00');
                    } else {
                        fecha = new Date(dateString);
                    }
                } else if (typeof dateString === 'number') {
                    fecha = new Date(dateString);
                }
                
                if (!fecha || isNaN(fecha.getTime())) {
                    return 'Fecha inválida';
                }
                
                return fecha.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                });
                
            } catch (error) {
                return 'Error en fecha';
            }
        };

        const comisionesHtml = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Fecha</th>
                            <th>Factura</th>
                            <th>Paciente</th>
                            <th>Tratamiento</th>
                            <th>Base</th>
                            <th>%</th>
                            <th>Comisión</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${comisiones.map(comision => `
                            <tr>
                                <td>${formatDate(comision.fecha_calculo)}</td>
                                <td>
                                    <span class="badge bg-secondary">${comision.numero_factura}</span>
                                </td>
                                <td>${comision.paciente_nombre || 'N/A'}</td>
                                <td>${comision.tratamiento || 'Sin especificar'}</td>
                                <td>${formatCurrency(comision.monto_base)}</td>
                                <td>${comision.porcentaje_comision}%</td>
                                <td><strong>${formatCurrency(comision.monto_comision)}</strong></td>
                                <td>
                                    <span class="badge bg-${this.getStatusColor(comision.estado)}">
                                        ${this.getStatusText(comision.estado)}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = comisionesHtml;
    }

    async loadFacturasOdontologo(estado = '') {
        try {
            const params = new URLSearchParams({ limit: 20, offset: 0 });
            if (estado) params.set('estado', estado);
            
            const response = await fetch(`/api/pagos-ext/odontologo/facturas?${params}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (data.success) {
                this.displayFacturas(data.facturas);
            }
            
        } catch (error) {
            console.error('❌ Error cargando facturas:', error);
            this.showErrorInContainer('facturasContainer', 'Error al cargar facturas');
        }
    }

    displayFacturas(facturas) {
        const container = document.getElementById('facturasContainer');
        if (!container) return;

        if (!facturas || facturas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-receipt display-4 text-muted"></i>
                    <h5 class="text-muted mt-3">No hay facturas registradas</h5>
                </div>
            `;
            return;
        }

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(amount || 0);
        };

        const formatDate = (dateString) => {
            // Función robusta de formateo de fechas
            try {
                if (!dateString) return 'Fecha no especificada';
                
                let fecha;
                
                if (dateString instanceof Date && !isNaN(dateString.getTime())) {
                    fecha = dateString;
                } else if (typeof dateString === 'string') {
                    if (dateString.includes('T')) {
                        fecha = new Date(dateString);
                    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        fecha = new Date(dateString + 'T00:00:00');
                    } else {
                        fecha = new Date(dateString);
                    }
                } else if (typeof dateString === 'number') {
                    fecha = new Date(dateString);
                }
                
                if (!fecha || isNaN(fecha.getTime())) {
                    return 'Fecha inválida';
                }
                
                return fecha.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                });
                
            } catch (error) {
                return 'Error en fecha';
            }
        };

        const facturasHtml = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Número</th>
                            <th>Fecha</th>
                            <th>Paciente</th>
                            <th>Subtotal</th>
                            <th>Total</th>
                            <th>Comisión</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${facturas.map(factura => `
                            <tr>
                                <td>
                                    <span class="badge bg-primary">${factura.numero_factura}</span>
                                </td>
                                <td>${formatDate(factura.fecha_emision)}</td>
                                <td>
                                    ${factura.paciente_nombre}<br>
                                    <small class="text-muted">${factura.paciente_email}</small>
                                </td>
                                <td>${formatCurrency(factura.subtotal)}</td>
                                <td><strong>${formatCurrency(factura.total)}</strong></td>
                                <td>
                                    ${formatCurrency(factura.comision_odontologo)}
                                    <br>
                                    <small class="badge bg-${this.getStatusColor(factura.estado)}">
                                        ${factura.estado === 'pendiente' ? 'Sin estado' : 'Sin estado'}
                                    </small>
                                </td>
                                <td>
                                    <span class="badge bg-${this.getStatusColor(factura.estado)}">
                                        ${this.getStatusText(factura.estado)}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" 
                                            onclick="dashboardOdontologo.verDetalleFactura(${factura.id})">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = facturasHtml;
    }

    setupPagosEventListeners() {
        // Filtro de comisiones
        const filtroComision = document.getElementById('filtroEstadoComision');
        if (filtroComision) {
            filtroComision.addEventListener('change', (e) => {
                this.loadHistorialComisiones(e.target.value);
            });
        }
        
        // Filtro de facturas
        const filtroFactura = document.getElementById('filtroEstadoFactura');
        if (filtroFactura) {
            filtroFactura.addEventListener('change', (e) => {
                this.loadFacturasOdontologo(e.target.value);
            });
        }
        
        // Tab change events
        const tabButtons = document.querySelectorAll('#pagosTab button[data-bs-toggle="tab"]');
        tabButtons.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.id === 'facturas-tab') {
                    this.loadFacturasOdontologo();
                } else if (e.target.id === 'comisiones-tab') {
                    this.loadHistorialComisiones();
                }
            });
        });
    }

    getStatusColor(estado) {
        switch (estado) {
            case 'pagada': case 'completado': return 'success';
            case 'pendiente': return 'warning';
            case 'vencida': case 'cancelada': return 'danger';
            default: return 'secondary';
        }
    }

    getStatusText(estado) {
        switch (estado) {
            case 'pagada': return 'Pagada';
            case 'pendiente': return 'Pendiente';
            case 'vencida': return 'Vencida';
            case 'cancelada': return 'Cancelada';
            case 'completado': return 'Completado';
            default: return estado || 'Sin estado';
        }
    }

    async verDetalleFactura(facturaId) {
        try {
            console.log('💰 Obteniendo detalle de factura:', facturaId);
            
            const response = await fetch(`/api/pagos-ext/facturas/${facturaId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (data.success) {
                this.mostrarModalDetalleFactura(data.factura);
            } else {
                throw new Error(data.message);
            }
            
        } catch (error) {
            console.error('❌ Error obteniendo detalle de factura:', error);
            alert('Error al obtener el detalle de la factura');
        }
    }

    mostrarModalDetalleFactura(factura) {
        const modalHtml = `
            <div class="modal fade" id="modalDetalleFactura" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-receipt me-2"></i>
                                Detalle de Factura ${factura.numero_factura}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="text-primary mb-3">
                                        <i class="bi bi-person-circle me-2"></i>Información del Paciente
                                    </h6>
                                    <p><strong>Nombre:</strong> ${factura.paciente_nombre || 'No disponible'}</p>
                                    <p><strong>Documento:</strong> ${factura.paciente_documento || 'No disponible'}</p>
                                    <p><strong>Teléfono:</strong> ${factura.paciente_telefono || 'No disponible'}</p>
                                    <p><strong>Correo:</strong> ${factura.paciente_correo || 'No disponible'}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-primary mb-3">
                                        <i class="bi bi-calendar-event me-2"></i>Información de la Cita
                                    </h6>
                                    <p><strong>Fecha de Cita:</strong> ${factura.fecha_cita ? this.formatearFecha(factura.fecha_cita) : 'No disponible'}</p>
                                    <p><strong>Hora:</strong> ${factura.hora_cita || 'No disponible'}</p>
                                    <p><strong>Odontólogo:</strong> ${factura.odontologo_nombre || 'No disponible'}</p>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <h6 class="text-primary mb-3">
                                <i class="bi bi-cash-stack me-2"></i>Información Financiera
                            </h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Subtotal:</strong> ${factura.subtotal ? '$' + Number(factura.subtotal).toLocaleString() : '$0'}</p>
                                    <p><strong>Impuestos:</strong> ${factura.impuestos ? '$' + Number(factura.impuestos).toLocaleString() : '$0'}</p>
                                    <p><strong>Total:</strong> <span class="h5 text-success">$${Number(factura.total).toLocaleString()}</span></p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Estado:</strong> 
                                        <span class="badge ${this.obtenerClaseEstadoFactura(factura.estado)}">${this.formatearEstadoFactura(factura.estado)}</span>
                                    </p>
                                    <p><strong>Fecha de Emisión:</strong> ${this.formatearFecha(factura.fecha_emision)}</p>
                                    <p><strong>Fecha de Vencimiento:</strong> ${factura.fecha_vencimiento ? this.formatearFecha(factura.fecha_vencimiento) : 'No disponible'}</p>
                                    <p><strong>Fecha de Pago:</strong> ${factura.fecha_pago ? this.formatearFecha(factura.fecha_pago) : 'Pendiente'}</p>
                                </div>
                            </div>
                            
                            ${factura.observaciones ? `
                                <hr>
                                <h6 class="text-primary mb-3">
                                    <i class="bi bi-chat-text me-2"></i>Observaciones
                                </h6>
                                <p class="text-muted">${factura.observaciones}</p>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="window.print()">
                                <i class="bi bi-printer me-2"></i>Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalDetalleFactura');
        if (modalAnterior) {
            modalAnterior.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetalleFactura'));
        modal.show();
    }

    formatearEstadoFactura(estado) {
        switch (estado?.toLowerCase()) {
            case 'pendiente': return 'Pendiente';
            case 'pagada': return 'Pagada';
            case 'vencida': return 'Vencida';
            case 'cancelada': return 'Cancelada';
            default: return estado || 'Sin estado';
        }
    }

    obtenerClaseEstadoFactura(estado) {
        switch (estado?.toLowerCase()) {
            case 'pendiente': return 'bg-warning text-dark';
            case 'pagada': return 'bg-success';
            case 'vencida': return 'bg-danger';
            case 'cancelada': return 'bg-secondary';
            default: return 'bg-light text-dark';
        }
    }

    showError(message) {
        console.error(message);
        // Implementar sistema de notificaciones si existe
    }

    showErrorInContainer(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-exclamation-triangle display-4 text-warning"></i>
                    <h5 class="text-muted mt-3">${message}</h5>
                    <button class="btn btn-outline-primary" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardOdontologo = new DashboardOdontologo();
});
