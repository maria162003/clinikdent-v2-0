// Dashboard Admin JavaScript - Prevenir duplicación
if (window.dashboardAdminInitialized) {
    console.log('⚠️ Dashboard Admin ya inicializado, evitando duplicación');
} else {
    window.dashboardAdminInitialized = true;

class DashboardAdmin {
    constructor() {
        this.currentSection = 'dashboard';
        this.users = [];
        this.citas = [];
        this.charts = {};
        this.calendarioFechaActual = new Date();
        this.vistaActual = 'tabla'; // 'tabla' o 'calendario'
        this.init();
    }

    // Obtener headers de autenticación para las peticiones
    getAuthHeaders() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id;
        
        return {
            'Content-Type': 'application/json',
            'user-id': userId || '1' // Valor por defecto para evitar errores
        };
    }

    // Hacer petición fetch con headers de autenticación
    async authFetch(url, options = {}) {
        const headers = this.getAuthHeaders();
        
        return fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        });
    }

    init() {
        this.setupEventListeners();
        this.loadUserInfo();
        this.loadDashboardData();
        this.initializeCharts();
        this.actualizarContadorCitasProximas();
        
        // Limpiar elementos problemáticos al cargar
        setTimeout(() => {
            this.cleanupProblematicElements();
        }, 1000);
        
        // Actualizar contador cada 5 minutos
        setInterval(() => {
            this.actualizarContadorCitasProximas();
        }, 5 * 60 * 1000);
        
        // Actualizar citas automáticamente cada 30 segundos si estamos en la sección de citas
        setInterval(() => {
            if (this.currentSection === 'citas') {
                console.log('🔄 Auto-actualizando citas...');
                this.loadCitas();
            }
        }, 30 * 1000);
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

        // Citas próximas button
        const citasProximasBtn = document.getElementById('citasProximasBtn');
        if (citasProximasBtn) {
            citasProximasBtn.addEventListener('click', () => {
                this.mostrarCitasProximas();
            });
        }
        
        // Edit Profile button
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openProfileModal();
            });
        }
        
        // Save Profile button
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                this.saveProfile();
            });
        }
    }

    setupModalEvents() {
        // Add user button
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.openUserModal();
        });

        // Save user button - No agregamos listener aquí ya que se asigna dinámicamente en openUserModal
    }

    setupFormEvents() {
        // Search functionality for users
        const searchUser = document.getElementById('searchUser');
        if (searchUser) {
            searchUser.addEventListener('input', (e) => {
                const searchTerm = e.target.value.trim();
                if (searchTerm === '') {
                    this.renderUsuariosTable(); // Mostrar todos los usuarios
                } else {
                    this.filterUsers(searchTerm);
                }
            });
        }

        // Filters for citas
        const fechaFiltro = document.getElementById('fechaFiltro');
        const estadoFiltro = document.getElementById('estadoFiltro');
        const pacienteFiltro = document.getElementById('pacienteFiltro');
        const odontologoFiltro = document.getElementById('odontologoFiltro');
        const refreshCitasBtn = document.getElementById('refreshCitasBtn');
        
        if (fechaFiltro) {
            fechaFiltro.addEventListener('change', () => this.filterCitas());
        }
        
        if (estadoFiltro) {
            estadoFiltro.addEventListener('change', () => this.filterCitas());
        }

        if (pacienteFiltro) {
            pacienteFiltro.addEventListener('input', () => this.filterCitas());
        }

        if (odontologoFiltro) {
            odontologoFiltro.addEventListener('input', () => this.filterCitas());
        }

        if (refreshCitasBtn) {
            refreshCitasBtn.addEventListener('click', () => this.loadCitas());
        }

        // Debug button for citas
        const debugCitasBtn = document.getElementById('debugCitasBtn');
        if (debugCitasBtn) {
            debugCitasBtn.addEventListener('click', () => this.debugCitas());
        }

        // Export buttons for citas
        const exportCitasPdfBtn = document.getElementById('exportCitasPdfBtn');
        const exportCitasExcelBtn = document.getElementById('exportCitasExcelBtn');
        
        if (exportCitasPdfBtn) {
            exportCitasPdfBtn.addEventListener('click', () => this.exportCitasPdf());
        }
        
        if (exportCitasExcelBtn) {
            exportCitasExcelBtn.addEventListener('click', () => this.exportCitasExcel());
        }

        // Event listener para el select de estado en el modal de citas
        const nuevoEstadoCita = document.getElementById('nuevoEstadoCita');
        if (nuevoEstadoCita) {
            nuevoEstadoCita.addEventListener('change', () => this.toggleNotasCancelacion());
        }

        // Event listeners para vista de calendario
        const vistaTablaBtn = document.getElementById('vistaTablaBtn');
        const vistaCalendarioBtn = document.getElementById('vistaCalendarioBtn');
        const calendarioPrevBtn = document.getElementById('calendarioPrevBtn');
        const calendarioNextBtn = document.getElementById('calendarioNextBtn');
        const calendarioHoyBtn = document.getElementById('calendarioHoyBtn');

        if (vistaTablaBtn) {
            vistaTablaBtn.addEventListener('click', () => this.cambiarVista('tabla'));
        }
        
        if (vistaCalendarioBtn) {
            vistaCalendarioBtn.addEventListener('click', () => this.cambiarVista('calendario'));
        }

        if (calendarioPrevBtn) {
            calendarioPrevBtn.addEventListener('click', () => this.navegarCalendario(-1));
        }

        if (calendarioNextBtn) {
            calendarioNextBtn.addEventListener('click', () => this.navegarCalendario(1));
        }

        if (calendarioHoyBtn) {
            calendarioHoyBtn.addEventListener('click', () => this.irAHoy());
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
            
            // Limpiar elementos problemáticos después de cambiar de sección
            setTimeout(() => {
                this.cleanupProblematicElements();
            }, 150);
            
            // Load section data
            this.loadSectionData(sectionName);
        }
    }

    cleanupProblematicElements() {
        console.log('🧹 Limpiando elementos problemáticos...');
        
        // Eliminar elementos que solo contienen "Teléfono" sin contexto útil fuera de las secciones
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const text = el.textContent.trim();
            if (text === 'Teléfono' && 
                !el.closest('table') && 
                !el.closest('form') && 
                !el.closest('.modal') &&
                !el.closest('.content-section') &&
                !el.querySelector('input') &&
                !el.querySelector('select')) {
                console.log('🗑️ Ocultando elemento problemático con "Teléfono":', el);
                el.style.display = 'none';
            }
        });

        // Eliminar elementos vacíos que puedan estar flotando
        const emptyElements = document.querySelectorAll('div:empty:not([id]):not([class]):not([data-section])');
        emptyElements.forEach(el => {
            if (!el.closest('.content-section') && !el.closest('.modal') && !el.closest('.sidebar')) {
                console.log('🗑️ Eliminando div vacío:', el);
                el.remove();
            }
        });
    }

    updateActiveNav(activeLink) {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    getSectionTitle(section) {
        const titles = {
            dashboard: 'Dashboard',
            usuarios: 'Gestión de Usuarios',
            citas: 'Gestión de Citas',
            pagos: 'Pagos y Facturación',
            faqs: 'Preguntas Frecuentes',
            evaluaciones: 'Evaluaciones de Servicio',
            reportes: 'Reportes y Estadísticas',
            inventario: 'Inventario y Sedes'
        };
        return titles[section] || 'Dashboard';
    }

    async loadUserInfo() {
        try {
            // Get user data from localStorage
            const userData = localStorage.getItem('user');
            if (!userData) {
                console.error('No hay datos de usuario en localStorage');
                return;
            }
            
            const user = JSON.parse(userData);
            this.currentUser = user; // Store the user data for later use
            
            // Set the name in the sidebar
            const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim();
            document.getElementById('userName').textContent = nombreCompleto || 'Administrador';
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    async loadDashboardData() {
        try {
            // Obtener headers de autenticación
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = localStorage.getItem('userId') || user.id;
            
            // Cargar estadísticas desde la API
            const statsResponse = await fetch('/api/usuarios/estadisticas', {
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId || '1'
                }
            });
            
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                document.getElementById('totalPacientes').textContent = stats.totalPacientes;
                document.getElementById('citasHoy').textContent = stats.citasHoy;
                document.getElementById('ingresosMes').textContent = `$${stats.ingresosMes.toLocaleString()}`;
                document.getElementById('odontologosActivos').textContent = stats.odontologosActivos;
            } else {
                // Datos de respaldo si la API falla
                document.getElementById('totalPacientes').textContent = '156';
                document.getElementById('citasHoy').textContent = '12';
                document.getElementById('ingresosMes').textContent = '$45,230';
                document.getElementById('odontologosActivos').textContent = '8';
            }
            
            // Cargar próximas citas
            await this.loadProximasCitas();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Datos de respaldo en caso de error
            document.getElementById('totalPacientes').textContent = '156';
            document.getElementById('citasHoy').textContent = '12';
            document.getElementById('ingresosMes').textContent = '$45,230';
            document.getElementById('odontologosActivos').textContent = '8';
        }
    }

    async loadProximasCitas() {
        try {
            // Obtener headers de autenticación
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = localStorage.getItem('userId') || user.id;
            
            const response = await fetch('/api/usuarios/proximas-citas', {
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId || '1'
                }
            });
            
            if (response.ok) {
                const proximasCitas = await response.json();
                const container = document.getElementById('proximasCitas');
                
                if (proximasCitas.length === 0) {
                    container.innerHTML = '<div class="alert alert-info">No hay citas próximas</div>';
                    return;
                }
                
                container.innerHTML = proximasCitas.map(cita => `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${cita.paciente_nombre} ${cita.paciente_apellido}</h6>
                            <small class="text-muted">${cita.motivo || 'Consulta general'}</small>
                        </div>
                        <span class="badge bg-primary">${cita.hora}</span>
                    </div>
                `).join('');
            } else {
                // Datos de respaldo si la API falla
                this.loadProximasCitasRespaldo();
            }
        } catch (error) {
            console.error('Error al cargar próximas citas:', error);
            this.loadProximasCitasRespaldo();
        }
    }

    loadProximasCitasRespaldo() {
        const proximasCitas = [
            { paciente_nombre: 'Ana', paciente_apellido: 'García', hora: '09:00', motivo: 'Limpieza' },
            { paciente_nombre: 'Carlos', paciente_apellido: 'López', hora: '10:30', motivo: 'Revisión' },
            { paciente_nombre: 'María', paciente_apellido: 'Rodríguez', hora: '14:00', motivo: 'Endodoncia' }
        ];

        const container = document.getElementById('proximasCitas');
        container.innerHTML = proximasCitas.map(cita => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${cita.paciente_nombre} ${cita.paciente_apellido}</h6>
                    <small class="text-muted">${cita.motivo}</small>
                </div>
                <span class="badge bg-primary">${cita.hora}</span>
            </div>
        `).join('');
    }

    destroyCharts() {
        console.log('🗑️ Destruyendo charts existentes...');
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                console.log(`🗑️ Destruyendo chart: ${key}`);
                this.charts[key].destroy();
                delete this.charts[key];
            }
        });
        console.log('✅ Charts destruidos exitosamente');
    }

    initializeCharts() {
        // Destruir charts existentes primero
        this.destroyCharts();
        
        // Chart for dashboard - Citas por mes
        const ctx = document.getElementById('citasChart');
        if (ctx) {
            this.charts.citas = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Citas',
                        data: [65, 78, 90, 81, 95, 105],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
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
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Chart for reportes - Ingresos
        const ingresosCtx = document.getElementById('ingresosChart');
        if (ingresosCtx) {
            this.charts.ingresos = new Chart(ingresosCtx, {
                type: 'bar',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Ingresos',
                        data: [12000, 15000, 18000, 14000, 20000, 22000],
                        backgroundColor: '#667eea'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Chart for reportes - Tratamientos
        const tratamientosCtx = document.getElementById('tratamientosChart');
        if (tratamientosCtx) {
            this.charts.tratamientos = new Chart(tratamientosCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Limpieza', 'Blanqueamiento', 'Endodoncia', 'Ortodoncia'],
                    datasets: [{
                        data: [30, 25, 20, 25],
                        backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    async loadSectionData(sectionName) {
        if (sectionName === 'usuarios') {
            await this.loadUsuarios();
        } else if (sectionName === 'citas') {
            await this.loadCitas();
        } else if (sectionName === 'pagos') {
            // Cargar datos iniciales del módulo de pagos
            if (window.adminPagosModule && window.adminPagosModule.cargarHistorialPagos) {
                await window.adminPagosModule.cargarHistorialPagos();
            }
        } else if (sectionName === 'faqs') {
            // Cargar FAQs para administración
            await this.loadFAQs();
            await this.loadEstadisticasFaqs();
        } else if (sectionName === 'evaluaciones') {
            // Cargar sistema de evaluaciones
            await this.loadEvaluaciones();
        } else if (sectionName === 'reportes') {
            // Inicializar módulo de reportes
            if (typeof initReportesModule === 'function') {
                initReportesModule();
            } else {
                console.warn('Función initReportesModule no encontrada');
            }
        } else if (sectionName === 'inventario') {
            await loadInventario(); // Función global
            await loadSedes(); // Función global
            await loadEquipos(); // Función global
            await this.loadEstadisticasInventario();
        }
        
        // Actualizar contador de citas próximas al cambiar de sección
        await this.actualizarContadorCitasProximas();
        // ...puedes agregar otras secciones aquí...
    }

    // Cargar FAQs
    async loadFAQs() {
        try {
            console.log('📄 Cargando FAQs...');
            const res = await this.authFetch('/api/faqs');
            const faqs = await res.json();
            this.renderFAQsTable(faqs);
        } catch (err) {
            console.error('Error al cargar FAQs:', err);
            // Mostrar mensaje de error
            const container = document.querySelector('#faqsSection .table-container');
            if (container) {
                container.innerHTML = '<div class="alert alert-warning">Error al cargar FAQs. Mostrando datos de ejemplo.</div>';
            }
        }
    }

    renderFAQsTable(faqs) {
        const tbody = document.querySelector('#faqsTable tbody');
        if (!tbody) {
            console.error('No se encontró la tabla de FAQs');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!faqs || faqs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay FAQs registradas</td></tr>';
            return;
        }
        
        faqs.forEach(faq => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${faq.id}</td>
                <td>${faq.pregunta}</td>
                <td>
                    <span class="badge bg-info">${faq.categoria || 'general'}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="dashboardAdmin.viewFAQ(${faq.id})" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="dashboardAdmin.editFAQ(${faq.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboardAdmin.deleteFAQ(${faq.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar contador
        const faqsCount = document.getElementById('faqsCount');
        if (faqsCount) {
            faqsCount.textContent = faqs.length;
        }
    }

    // Cargar evaluaciones
    async loadEvaluaciones() {
        try {
            console.log('⭐ Cargando evaluaciones...');
            const res = await this.authFetch('/api/evaluaciones/admin/todas');
            const data = await res.json();
            const evaluaciones = data.evaluaciones || data; // Dependiendo del formato de respuesta
            this.renderEvaluacionesTable(evaluaciones);
        } catch (err) {
            console.error('Error al cargar evaluaciones:', err);
            // Mostrar mensaje de error
            const container = document.querySelector('#evaluacionesSection .table-container');
            if (container) {
                container.innerHTML = '<div class="alert alert-warning">Error al cargar evaluaciones. Mostrando datos de ejemplo.</div>';
            }
        }
    }

    renderEvaluacionesTable(evaluaciones) {
        const tbody = document.querySelector('#evaluacionesTable tbody');
        if (!tbody) {
            console.error('No se encontró la tabla de evaluaciones');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!evaluaciones || evaluaciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay evaluaciones registradas</td></tr>';
            return;
        }
        
        evaluaciones.forEach(evaluacion => {
            // Calcular promedio de calificaciones
            const promedio = ((evaluacion.calificacion_servicio + evaluacion.calificacion_atencion + evaluacion.calificacion_instalaciones) / 3).toFixed(1);
            const fecha = new Date(evaluacion.fecha_evaluacion || evaluacion.created_at).toLocaleDateString();
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${evaluacion.id}</td>
                <td>${evaluacion.paciente_nombre || 'N/A'}</td>
                <td>${evaluacion.odontologo_nombre || 'N/A'}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2">${promedio}</span>
                        <div class="stars">
                            ${this.renderStars(parseFloat(promedio))}
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge bg-${evaluacion.recomendaria ? 'success' : 'warning'}">
                        ${evaluacion.recomendaria ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>
                    <small class="text-muted">${fecha}</small>
                    <br>
                    <button class="btn btn-sm btn-info mt-1" onclick="dashboardAdmin.viewEvaluacion(${evaluacion.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar contador
        const evaluacionesCount = document.getElementById('evaluacionesCount');
        if (evaluacionesCount) {
            evaluacionesCount.textContent = evaluaciones.length;
        }
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="bi bi-star-fill text-warning"></i>';
            } else if (i - 0.5 <= rating) {
                stars += '<i class="bi bi-star-half text-warning"></i>';
            } else {
                stars += '<i class="bi bi-star text-muted"></i>';
            }
        }
        return stars;
    }

    // Funciones para manejar FAQs
    viewFAQ(id) {
        console.log('Ver FAQ:', id);
        alert('Función ver FAQ en desarrollo. FAQ ID: ' + id);
    }

    editFAQ(id) {
        console.log('Editar FAQ:', id);
        alert('Función editar FAQ en desarrollo. FAQ ID: ' + id);
    }

    deleteFAQ(id) {
        if (confirm('¿Estás seguro de que deseas eliminar esta FAQ?')) {
            console.log('Eliminar FAQ:', id);
            alert('Función eliminar FAQ en desarrollo. FAQ ID: ' + id);
        }
    }

    // Funciones para manejar evaluaciones
    viewEvaluacion(id) {
        console.log('Ver evaluación:', id);
        alert('Función ver evaluación en desarrollo. Evaluación ID: ' + id);
    }

    async loadUsuarios() {
        try {
            // Obtener headers de autenticación
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = localStorage.getItem('userId') || user.id;
            
            const res = await fetch('/api/usuarios', {
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId || '1'
                }
            });
            
            const usuarios = await res.json();
            this.users = usuarios;
            this.renderUsuariosTable();
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
        }
    }

    renderUsuariosTable() {
        const tbody = document.querySelector('#usuariosTable tbody');
        if (!tbody) {
            console.error('No se encontró la tabla de usuarios');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!this.users || this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay usuarios registrados</td></tr>';
            return;
        }
        
        this.users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nombre} ${user.apellido}</td>
                <td>${user.correo}</td>
                <td>
                    <span class="badge bg-${this.getRolBadgeClass(user.rol)}">${user.rol}</span>
                </td>
                <td>
                    <span class="badge bg-${user.estado === 'activo' ? 'success' : 'secondary'}">${user.estado || 'activo'}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="dashboardAdmin.openUserModal(${user.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboardAdmin.deleteUser(${user.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    filterUsers(searchTerm) {
        const filteredUsers = this.users.filter(user => {
            const fullName = `${user.nombre} ${user.apellido}`.toLowerCase();
            const email = user.correo.toLowerCase();
            const rol = user.rol.toLowerCase();
            const term = searchTerm.toLowerCase();
            
            return fullName.includes(term) || 
                   email.includes(term) || 
                   rol.includes(term);
        });
        
        this.renderFilteredUsersTable(filteredUsers);
    }

    renderFilteredUsersTable(filteredUsers) {
        const tbody = document.querySelector('#usuariosTable tbody');
        if (!tbody) {
            console.error('No se encontró la tabla de usuarios');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!filteredUsers || filteredUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron usuarios que coincidan con la búsqueda</td></tr>';
            return;
        }
        
        filteredUsers.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nombre} ${user.apellido}</td>
                <td>${user.correo}</td>
                <td>
                    <span class="badge bg-${this.getRolBadgeClass(user.rol)}">${user.rol}</span>
                </td>
                <td>
                    <span class="badge bg-${user.estado === 'activo' ? 'success' : 'secondary'}">${user.estado || 'activo'}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="dashboardAdmin.openUserModal(${user.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboardAdmin.deleteUser(${user.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    openUserModal(id = null) {
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        document.getElementById('userForm').reset();
        
        if (id) {
            // Editar usuario existente
            const user = this.users.find(u => u.id === id);
            if (user) {
                document.getElementById('userModalTitle').textContent = 'Editar Usuario';
                document.getElementById('userNombre').value = user.nombre || '';
                document.getElementById('userApellido').value = user.apellido || '';
                document.getElementById('userEmail').value = user.correo || '';
                document.getElementById('userTelefono').value = user.telefono || '';
                document.getElementById('userRol').value = user.rol || '';
                document.getElementById('userDireccion').value = user.direccion || '';
                document.getElementById('userFechaNacimiento').value = user.fecha_nacimiento ? user.fecha_nacimiento.split('T')[0] : '';
                document.getElementById('userTipoDocumento').value = user.tipo_documento || 'CC';
                document.getElementById('userNumeroDocumento').value = user.numero_documento || '';
                document.getElementById('userPassword').value = '';
                
                // Limpiar listeners anteriores y asignar nuevo
                const saveBtn = document.getElementById('saveUserBtn');
                saveBtn.onclick = null;
                saveBtn.onclick = () => this.saveUser(id);
            }
        } else {
            // Nuevo usuario
            document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
            
            // Limpiar listeners anteriores y asignar nuevo
            const saveBtn = document.getElementById('saveUserBtn');
            saveBtn.onclick = null;
            saveBtn.onclick = () => this.saveUser();
        }
        
        modal.show();
    }

    async saveUser(id = null) {
        const nombre = document.getElementById('userNombre').value.trim();
        const apellido = document.getElementById('userApellido').value.trim();
        const correo = document.getElementById('userEmail').value.trim();
        const telefono = document.getElementById('userTelefono').value.trim();
        let rol = document.getElementById('userRol').value;
        const direccion = document.getElementById('userDireccion').value.trim();
        const fecha_nacimiento = document.getElementById('userFechaNacimiento').value;
        const tipo_documento = document.getElementById('userTipoDocumento').value;
        const numero_documento = document.getElementById('userNumeroDocumento').value.trim();
        const password = document.getElementById('userPassword').value;
        
        // Asegurar que los roles son correctos (para compatibilidad)
        if (rol === 'admin') rol = 'administrador';
        
        console.log('🔍 Datos del formulario:', {
            nombre, apellido, correo, telefono, rol, direccion, fecha_nacimiento, tipo_documento, numero_documento, password: password ? '***' : 'vacio'
        });
        
        // Validaciones básicas
        if (!nombre || !apellido || !correo || !rol || rol === '') {
            alert('Por favor complete todos los campos obligatorios (Nombre, Apellido, Email, Rol)');
            console.log('❌ Validación fallida - campos obligatorios vacíos');
            return;
        }
        
        // Validación adicional para roles
        if (!['paciente', 'odontologo', 'administrador'].includes(rol)) {
            alert('El rol seleccionado no es válido');
            console.log('❌ Validación fallida - rol inválido: ' + rol);
            return;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            alert('Por favor ingrese un email válido');
            return;
        }
        
        const payload = { 
            nombre, 
            apellido, 
            correo, 
            telefono: telefono || null,
            rol,
            direccion: direccion || null,
            fecha_nacimiento: fecha_nacimiento || null,
            tipo_documento: tipo_documento || 'CC',
            numero_documento: numero_documento || null
        };
        
        if (password) payload.password = password;
        
        console.log('🔍 Payload a enviar:', payload);
        
        try {
            let response;
            if (id) {
                // Actualizar usuario existente
                response = await fetch(`/api/usuarios/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Crear nuevo usuario
                if (!password || password.trim() === '') {
                    alert('La contraseña es obligatoria para nuevos usuarios');
                    console.log('❌ Contraseña vacía para nuevo usuario');
                    return;
                }
                response = await fetch('/api/usuarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            
            console.log('🔍 Respuesta del servidor:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Usuario guardado:', result);
                bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
                await this.loadUsuarios();
                await this.loadDashboardData(); // Actualizar estadísticas
                alert(id ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
            } else {
                const error = await response.json();
                console.error('❌ Error del servidor:', error);
                alert(`Error del servidor: ${error.msg || error.message || 'Error al guardar usuario'}`);
            }
        } catch (err) {
            console.error('❌ Error al guardar usuario:', err);
            // Solo mostrar alerta si no hubo respuesta del servidor (error de red/conexión)
            if (!err.message?.includes('Failed to fetch')) {
                alert('Error de conexión: Verifique su conexión a internet');
            } else {
                alert('Error inesperado al guardar usuario');
            }
        }
    }

    async deleteUser(id) {
        if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
        
        try {
            const response = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
            
            if (response.ok) {
                await this.loadUsuarios();
                await this.loadDashboardData(); // Actualizar estadísticas
                alert('Usuario eliminado exitosamente');
            } else {
                const error = await response.json();
                alert(`Error: ${error.msg || 'Error al eliminar usuario'}`);
            }
        } catch (err) {
            console.error('Error al eliminar usuario:', err);
            alert('Error al eliminar usuario');
        }
    }

    debugCitas() {
        console.clear(); // Limpiar consola para mejor visualización
        console.log('🔍 ================== DEBUG CITAS ==================');
        console.log('⏰ Timestamp:', new Date().toLocaleString());
        
        // 1. Verificar elementos del DOM
        console.log('\n📋 1. VERIFICACIÓN DEL DOM:');
        const citasSection = document.getElementById('citas');
        const citasTableBody = document.getElementById('citasTableBody');
        const debugBtn = document.getElementById('debugCitasBtn');
        
        console.log('   📍 Sección citas encontrada:', !!citasSection);
        console.log('   📍 Sección visible:', citasSection ? citasSection.style.display !== 'none' : false);
        console.log('   📋 Tabla citas body encontrada:', !!citasTableBody);
        console.log('   � Botón debug encontrado:', !!debugBtn);
        
        // 2. Verificar estado del sistema
        console.log('\n⚙️ 2. ESTADO DEL SISTEMA:');
        console.log('   🔄 Auto-refresh activo:', !!this.citasInterval);
        console.log('   📊 Citas en memoria:', this.citas ? this.citas.length : 0);
        console.log('   🎯 Vista actual:', this.vistaActual || 'No definida');
        
        // 3. Verificar conectividad del servidor
        console.log('\n🌐 3. PRUEBA DE CONECTIVIDAD:');
        
        // Probar conexión básica al servidor
        fetch('/')
            .then(response => {
                console.log('   ✅ Servidor principal:', response.status === 200 ? 'OK' : `Error ${response.status}`);
                
                // 4. Probar endpoint específico de citas
                console.log('\n📡 4. PRUEBA API CITAS:');
                return fetch('/api/citas/admin/todas');
            })
            .then(response => {
                console.log('   📡 Estado HTTP:', response.status, response.statusText);
                console.log('   📦 Content-Type:', response.headers.get('content-type'));
                console.log('   🔢 Content-Length:', response.headers.get('content-length'));
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response.json();
            })
            .then(data => {
                console.log('\n📊 5. ANÁLISIS DE DATOS:');
                console.log('   🔍 Tipo de respuesta:', typeof data);
                console.log('   📏 Es array:', Array.isArray(data));
                console.log('   📊 Cantidad de citas:', Array.isArray(data) ? data.length : 'No es array');
                
                if (Array.isArray(data) && data.length > 0) {
                    console.log('   📋 Primera cita (muestra):');
                    console.table(data[0]);
                    
                    console.log('   🔑 Campos disponibles:', Object.keys(data[0]));
                    
                    // Verificar campos requeridos
                    const camposRequeridos = ['id', 'fecha', 'hora', 'estado', 'paciente_nombre', 'odontologo_nombre'];
                    const camposFaltantes = camposRequeridos.filter(campo => !(campo in data[0]));
                    
                    if (camposFaltantes.length > 0) {
                        console.warn('   ⚠️ Campos faltantes:', camposFaltantes);
                    } else {
                        console.log('   ✅ Todos los campos requeridos presentes');
                    }
                } else {
                    console.log('   ⚠️ No hay citas para analizar');
                }
                
                // 6. Verificar renderizado de tabla
                console.log('\n🎨 6. ANÁLISIS DE RENDERIZADO:');
                if (citasTableBody) {
                    const filas = citasTableBody.getElementsByTagName('tr');
                    console.log('   📋 Filas en tabla:', filas.length);
                    
                    if (filas.length > 0) {
                        console.log('   📝 Contenido primera fila:', filas[0].innerHTML.substring(0, 100) + '...');
                    }
                } else {
                    console.error('   ❌ No se puede analizar tabla - elemento no encontrado');
                }
                
                // 7. Verificar otros endpoints
                console.log('\n🔗 7. PRUEBA OTROS ENDPOINTS:');
                return Promise.all([
                    fetch('/api/sedes').then(r => ({ endpoint: 'sedes', status: r.status, ok: r.ok })),
                    fetch('/api/inventario').then(r => ({ endpoint: 'inventario', status: r.status, ok: r.ok })),
                    fetch('/api/usuarios').then(r => ({ endpoint: 'usuarios', status: r.status, ok: r.ok }))
                ]);
            })
            .then(resultados => {
                console.log('   📊 Estado de otros endpoints:');
                resultados.forEach(resultado => {
                    const icono = resultado.ok ? '✅' : '❌';
                    console.log(`   ${icono} ${resultado.endpoint}: HTTP ${resultado.status}`);
                });
                
                // 8. Recomendaciones
                console.log('\n💡 8. RECOMENDACIONES:');
                
                if (!this.citas || this.citas.length === 0) {
                    console.log('   🔄 Intenta recargar los datos manualmente');
                    console.log('   🔍 Verifica que existan citas en la base de datos');
                }
                
                if (!this.citasInterval) {
                    console.log('   ⏰ El auto-refresh no está activo');
                    console.log('   🔄 Considera activar la actualización automática');
                }
                
                console.log('   🔧 Para más detalles, revisa la pestaña Network en DevTools');
                console.log('   📱 Asegúrate de estar en la sección correcta del dashboard');
                
                console.log('\n🎉 DEBUG COMPLETADO - Revisa los resultados arriba');
                
                // Mostrar resumen en pantalla
                const statusDiv = document.getElementById('citasStatus');
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div class="alert alert-info">
                            <h6><i class="bi bi-bug"></i> Debug Ejecutado</h6>
                            <p class="mb-1">✅ Servidor conectado correctamente</p>
                            <p class="mb-1">📊 Citas en sistema: ${this.citas ? this.citas.length : 0}</p>
                            <p class="mb-0"><small>🔍 Revisa la consola del navegador (F12) para detalles completos</small></p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('\n❌ ERROR EN DEBUG:', error);
                console.log('\n🚨 DIAGNÓSTICO DE ERROR:');
                console.log('   🔍 Tipo de error:', error.name);
                console.log('   📝 Mensaje:', error.message);
                console.log('   📍 Stack trace:', error.stack);
                
                // Mostrar error en pantalla
                const statusDiv = document.getElementById('citasStatus');
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div class="alert alert-danger">
                            <h6><i class="bi bi-exclamation-triangle"></i> Error en Debug</h6>
                            <p class="mb-1">❌ ${error.message}</p>
                            <p class="mb-0"><small>🔍 Revisa la consola para más detalles</small></p>
                        </div>
                    `;
                }
                
                console.log('\n🔧 POSIBLES SOLUCIONES:');
                console.log('   1. Verifica que el servidor esté ejecutándose');
                console.log('   2. Revisa la conexión a la base de datos');
                console.log('   3. Asegúrate de que las rutas API estén configuradas');
                console.log('   4. Verifica que no haya errores en la consola del servidor');
            });
    }

    async loadCitas() {
        console.log('🔄 Cargando todas las citas...');
        
        const citasTableBody = document.getElementById('citasTableBody');
        if (!citasTableBody) {
            console.error('❌ No se encontró citasTableBody en el DOM');
            return;
        }
        
        try {
            this.showCitasLoading(true);
            console.log('📡 Haciendo petición a /api/citas/admin/todas...');
            
            // Obtener headers de autenticación
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = localStorage.getItem('userId') || user.id;
            
            const res = await fetch('/api/citas/admin/todas', {
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId || '1'
                }
            });
            
            console.log('📡 Respuesta del servidor:', res.status, res.statusText);
            
            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            
            const citas = await res.json();
            console.log(`✅ Respuesta recibida. Tipo: ${typeof citas}, Longitud: ${Array.isArray(citas) ? citas.length : 'No es array'}`);
            console.log('📊 Datos completos:', citas);
            
            // Asegurar que citas es un array
            const citasArray = Array.isArray(citas) ? citas : [];
            
            this.citas = citasArray;
            console.log(`📋 Citas almacenadas: ${this.citas.length}`);
            
            this.renderCitasTable();
            
            // Si estamos en vista calendario, actualizarlo también
            if (this.vistaActual === 'calendario') {
                this.renderCalendario();
            }
            
            // Mostrar estado en la interfaz
            const statusDiv = document.getElementById('citasStatus');
            if (statusDiv) {
                if (citasArray.length === 0) {
                    statusDiv.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle"></i> No hay citas registradas en el sistema</div>';
                } else {
                    statusDiv.innerHTML = `<div class="alert alert-success"><i class="bi bi-check-circle"></i> ${citasArray.length} citas cargadas correctamente</div>`;
                }
            }
            
            this.showCitasLoading(false);
            
            console.log('✅ Citas cargadas y renderizadas exitosamente');
            
        } catch (err) {
            console.error('❌ Error al cargar citas:', err);
            this.showCitasLoading(false);
            
            // Mostrar error en la interfaz
            const statusDiv = document.getElementById('citasStatus');
            if (statusDiv) {
                statusDiv.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> Error al cargar citas: ${err.message}</div>`;
            }
            
            // Mostrar mensaje en la tabla
            citasTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle fs-1 mb-3"></i>
                        <h5>Error al cargar citas</h5>
                        <p>${err.message}</p>
                        <button class="btn btn-outline-primary" onclick="dashboardAdmin.loadCitas()">
                            <i class="bi bi-arrow-clockwise"></i> Reintentar
                        </button>
                    </td>
                </tr>
            `;
            
            this.showNoCitasMessage();
            
            // También mostrar alerta
            alert('Error al cargar citas: ' + err.message + '. Revise la conexión con el servidor.');
        }
    }

    showCitasLoading(show) {
        const loadingMsg = document.getElementById('citasLoadingMsg');
        const table = document.getElementById('citasTable');
        const noCitasMsg = document.getElementById('noCitasMsg');
        
        if (show) {
            loadingMsg.style.display = 'block';
            table.style.display = 'none';
            noCitasMsg.classList.add('d-none');
        } else {
            loadingMsg.style.display = 'none';
            table.style.display = 'table';
        }
    }

    showNoCitasMessage() {
        const noCitasMsg = document.getElementById('noCitasMsg');
        const table = document.getElementById('citasTable');
        
        table.style.display = 'none';
        noCitasMsg.classList.remove('d-none');
    }

    renderCitasTable() {
        const tbody = document.getElementById('citasTableBody');
        if (!tbody) {
            console.error('❌ No se encontró el tbody de la tabla de citas');
            return;
        }

        if (!this.citas || this.citas.length === 0) {
            this.showNoCitasMessage();
            return;
        }

        tbody.innerHTML = '';
        
        this.citas.forEach(cita => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="badge bg-secondary">${cita.id}</span></td>
                <td>
                    <div class="fw-bold">${cita.paciente_completo}</div>
                    <small class="text-muted">${cita.paciente_correo || ''}</small>
                </td>
                <td>
                    <div class="fw-bold">${cita.odontologo_completo}</div>
                    <small class="text-muted">${cita.odontologo_correo || ''}</small>
                </td>
                <td>${cita.fecha_formateada || 'N/A'}</td>
                <td><span class="badge bg-info">${cita.hora || 'N/A'}</span></td>
                <td>${this.getEstadoBadge(cita.estado)}</td>
                <td class="text-truncate" style="max-width: 200px;" title="${cita.motivo || 'Sin motivo especificado'}">
                    ${cita.motivo || 'Sin motivo especificado'}
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="dashboardAdmin.verDetallesCita(${cita.id})" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="dashboardAdmin.cambiarEstadoCita(${cita.id}, 'confirmada')" title="Confirmar" ${cita.estado === 'confirmada' || cita.estado === 'completada' || cita.estado === 'cancelada' ? 'disabled' : ''}>
                            <i class="bi bi-check-circle"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="dashboardAdmin.cambiarEstadoCita(${cita.id}, 'completada')" title="Completar" ${cita.estado === 'completada' || cita.estado === 'cancelada' ? 'disabled' : ''}>
                            <i class="bi bi-check2-all"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="dashboardAdmin.cambiarEstadoCita(${cita.id}, 'cancelada')" title="Cancelar" ${cita.estado === 'cancelada' ? 'disabled' : ''}>
                            <i class="bi bi-x-circle"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="dashboardAdmin.reasignarOdontologo(${cita.id})" title="Reasignar odontólogo" ${cita.estado === 'completada' || cita.estado === 'cancelada' ? 'disabled' : ''}>
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    getEstadoBadge(estado) {
        const badges = {
            'programada': '<span class="badge bg-primary">Programada</span>',
            'confirmada': '<span class="badge bg-info">Confirmada</span>',
            'completada': '<span class="badge bg-success">Completada</span>',
            'cancelada': '<span class="badge bg-danger">Cancelada</span>'
        };
        return badges[estado] || `<span class="badge bg-secondary">${estado}</span>`;
    }

    verDetallesCita(id) {
        const cita = this.citas.find(c => c.id === id);
        if (!cita) {
            alert('Cita no encontrada');
            return;
        }

        // Llenar el modal con los datos de la cita
        document.getElementById('citaDetalleId').textContent = cita.id;
        document.getElementById('citaDetalleFecha').textContent = cita.fecha_formateada || 'N/A';
        document.getElementById('citaDetalleHora').textContent = cita.hora || 'N/A';
        document.getElementById('citaDetalleEstado').innerHTML = this.getEstadoBadge(cita.estado);
        document.getElementById('citaDetalleMotivo').textContent = cita.motivo || 'Sin motivo especificado';
        
        document.getElementById('citaDetallePaciente').textContent = cita.paciente_completo;
        document.getElementById('citaDetallePacienteEmail').textContent = cita.paciente_correo || 'N/A';
        document.getElementById('citaDetallePacienteTelefono').textContent = cita.paciente_telefono || 'N/A';
        
        document.getElementById('citaDetalleOdontologo').textContent = cita.odontologo_completo;
        document.getElementById('citaDetalleOdontologoEmail').textContent = cita.odontologo_correo || 'N/A';
        
        document.getElementById('citaDetalleNotas').textContent = cita.notas || 'Sin notas adicionales';
        
        // Establecer el estado actual en el select
        document.getElementById('nuevoEstadoCita').value = cita.estado;
        
        // Configurar el evento del botón actualizar
        document.getElementById('actualizarEstadoCitaBtn').onclick = () => this.actualizarEstadoCitaDesdeModal(id);
        
        // Mostrar/ocultar notas de cancelación según el estado seleccionado
        this.toggleNotasCancelacion();
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('citaDetallesModal'));
        modal.show();
    }

    toggleNotasCancelacion() {
        const estadoSelect = document.getElementById('nuevoEstadoCita');
        const notasDiv = document.getElementById('notasCancelacionDiv');
        
        if (estadoSelect.value === 'cancelada') {
            notasDiv.style.display = 'block';
        } else {
            notasDiv.style.display = 'none';
        }
    }

    async cambiarEstadoCita(id, nuevoEstado) {
        if (!confirm(`¿Está seguro de cambiar el estado de la cita a "${nuevoEstado}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/citas/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.msg || 'Error al actualizar estado');
            }

            const result = await response.json();
            console.log('✅ Estado actualizado:', result);
            
            // Recargar las citas para reflejar el cambio
            await this.loadCitas();
            
            // Mostrar mensaje de éxito
            this.showAlert('success', `Cita ${nuevoEstado} exitosamente`);

        } catch (error) {
            console.error('❌ Error al cambiar estado de cita:', error);
            this.showAlert('danger', `Error: ${error.message}`);
        }
    }

    async actualizarEstadoCitaDesdeModal(id) {
        const nuevoEstado = document.getElementById('nuevoEstadoCita').value;
        const notasCancelacion = document.getElementById('notasCancelacion').value;
        
        try {
            const payload = { estado: nuevoEstado };
            
            // Agregar notas si es cancelación
            if (nuevoEstado === 'cancelada' && notasCancelacion.trim()) {
                payload.notas_cancelacion = notasCancelacion.trim();
            }

            const response = await fetch(`/api/citas/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.msg || 'Error al actualizar estado');
            }

            const result = await response.json();
            console.log('✅ Estado actualizado desde modal:', result);
            
            // Cerrar el modal
            bootstrap.Modal.getInstance(document.getElementById('citaDetallesModal')).hide();
            
            // Recargar las citas
            await this.loadCitas();
            
            // Mostrar mensaje de éxito
            this.showAlert('success', `Cita ${nuevoEstado} exitosamente`);

        } catch (error) {
            console.error('❌ Error al actualizar estado desde modal:', error);
            this.showAlert('danger', `Error: ${error.message}`);
        }
    }

    filterCitas() {
        const fechaFiltro = document.getElementById('fechaFiltro').value;
        const estadoFiltro = document.getElementById('estadoFiltro').value;
        const pacienteFiltro = document.getElementById('pacienteFiltro').value.toLowerCase();
        const odontologoFiltro = document.getElementById('odontologoFiltro').value.toLowerCase();

        let citasFiltradas = [...this.citas];

        // Filtrar por fecha
        if (fechaFiltro) {
            citasFiltradas = citasFiltradas.filter(cita => {
                if (!cita.fecha) return false;
                const fechaCita = new Date(cita.fecha).toISOString().split('T')[0];
                return fechaCita === fechaFiltro;
            });
        }

        // Filtrar por estado
        if (estadoFiltro) {
            citasFiltradas = citasFiltradas.filter(cita => cita.estado === estadoFiltro);
        }

        // Filtrar por paciente
        if (pacienteFiltro) {
            citasFiltradas = citasFiltradas.filter(cita => 
                (cita.paciente_completo || '').toLowerCase().includes(pacienteFiltro)
            );
        }

        // Filtrar por odontólogo
        if (odontologoFiltro) {
            citasFiltradas = citasFiltradas.filter(cita => 
                (cita.odontologo_completo || '').toLowerCase().includes(odontologoFiltro)
            );
        }

        // Renderizar tabla con citas filtradas
        const citasOriginales = this.citas;
        this.citas = citasFiltradas;
        this.renderCitasTable();
        this.citas = citasOriginales; // Restaurar citas originales
    }

    async loadInventario() {
        try {
            const res = await this.authFetch('/api/inventario');
            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            const inventario = await res.json();
            this.inventario = inventario;
            // Usar la función global que está correctamente implementada
            renderInventarioTable(inventario);
        } catch (err) {
            console.error('Error al cargar inventario:', err);
            // Usar la función global para mostrar error
            const tbody = document.querySelector('#inventarioTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="12" class="text-center text-danger">Error al cargar inventario</td></tr>';
            }
        }
    }

    openInventarioModal(codigo = null) {
        const modal = new bootstrap.Modal(document.getElementById('inventarioModal'));
        document.getElementById('inventarioForm').reset();
        if (codigo) {
            const item = this.inventario.find(i => i.codigo === codigo);
            document.getElementById('inventarioModalTitle').textContent = 'Editar Item';
            document.getElementById('invCodigo').value = item.codigo;
            document.getElementById('invProducto').value = item.producto;
            document.getElementById('invCategoria').value = item.categoria;
            document.getElementById('invStock').value = item.stock;
            document.getElementById('invEstado').value = item.estado;
            document.getElementById('invCodigo').readOnly = true;
            document.getElementById('saveInventarioBtn').onclick = () => this.saveInventario(codigo);
        } else {
            document.getElementById('inventarioModalTitle').textContent = 'Nuevo Item';
            document.getElementById('invCodigo').readOnly = false;
            document.getElementById('saveInventarioBtn').onclick = () => this.saveInventario();
        }
        modal.show();
    }

    async saveInventario(codigo = null) {
        const payload = {
            codigo: document.getElementById('invCodigo').value,
            producto: document.getElementById('invProducto').value,
            categoria: document.getElementById('invCategoria').value,
            stock: document.getElementById('invStock').value,
            estado: document.getElementById('invEstado').value
        };
        try {
            if (codigo) {
                await fetch(`/api/inventario/${codigo}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                await fetch('/api/inventario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            bootstrap.Modal.getInstance(document.getElementById('inventarioModal')).hide();
            await this.loadInventario();
        } catch (err) {
            alert('Error al guardar item');
        }
    }

    async deleteInventario(codigo) {
        if (!confirm('¿Seguro que deseas eliminar este item?')) return;
        try {
            await fetch(`/api/inventario/${codigo}`, { method: 'DELETE' });
            await this.loadInventario();
        } catch (err) {
            alert('Error al eliminar item');
        }
    }

    getEstadoBadgeClass(estado) {
        const classes = {
            'programada': 'bg-warning',
            'completada': 'bg-success',
            'cancelada': 'bg-danger',
            'confirmada': 'bg-info'
        };
        return classes[estado] || 'bg-secondary';
    }

    logout() {
        console.log('🚪 Cerrando sesión del administrador...');
        
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
        localStorage.removeItem('adminSession');
        sessionStorage.clear();
        
        // Invalidar la sesión en el historial del navegador
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, '/index.html');
        }
        
        // Limpiar cualquier interval/timeout activo
        this.clearIntervals();
        
        // Destruir gráficos para liberar memoria
        this.destroyCharts();
        
        // Mostrar mensaje de confirmación
        console.log('✅ Sesión cerrada correctamente');
        
        // Redireccionar al login/home
        window.location.href = '/index.html';
    }

    clearIntervals() {
        // Limpiar intervals específicos del dashboard si existen
        if (this.citasInterval) {
            clearInterval(this.citasInterval);
        }
        if (this.notificacionesInterval) {
            clearInterval(this.notificacionesInterval);
        }
        // Limpiar todos los timeouts activos
        for (let i = 1; i < 99999; i++) window.clearTimeout(i);
    }

    getRolBadgeClass(rol) {
        const classes = {
            'admin': 'danger',
            'odontologo': 'primary',
            'paciente': 'info'
        };
        return classes[rol] || 'secondary';
    }

    showAlert(type, message) {
        // Crear el alert
        const alertId = 'alert-' + Date.now();
        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
                <strong>${type === 'success' ? '✅ Éxito!' : '❌ Error!'}</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', alertHTML);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
    }

    exportCitasPdf() {
        try {
            const doc = new window.jspdf.jsPDF();
            
            // Título
            doc.setFontSize(20);
            doc.text('Reporte de Citas - Clinik Dent', 20, 20);
            
            // Fecha del reporte
            doc.setFontSize(12);
            doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 20, 30);
            
            // Obtener citas filtradas actuales
            const citasParaExportar = this.getCurrentFilteredCitas();
            
            // Headers de la tabla
            doc.setFontSize(10);
            doc.text('ID', 20, 50);
            doc.text('Paciente', 35, 50);
            doc.text('Odontólogo', 80, 50);
            doc.text('Fecha', 125, 50);
            doc.text('Hora', 155, 50);
            doc.text('Estado', 175, 50);
            
            // Línea separadora
            doc.line(20, 52, 190, 52);
            
            let y = 60;
            citasParaExportar.forEach((cita, index) => {
                if (y > 270) { // Nueva página
                    doc.addPage();
                    y = 20;
                }
                
                doc.text(cita.id.toString(), 20, y);
                doc.text(cita.paciente_completo.substring(0, 20), 35, y);
                doc.text(cita.odontologo_completo.substring(0, 20), 80, y);
                doc.text(cita.fecha_formateada || 'N/A', 125, y);
                doc.text(cita.hora || 'N/A', 155, y);
                doc.text(cita.estado, 175, y);
                
                y += 8;
            });
            
            // Resumen al final
            y += 10;
            doc.setFontSize(12);
            doc.text(`Total de citas: ${citasParaExportar.length}`, 20, y);
            
            // Guardar
            doc.save(`citas_reporte_${new Date().toISOString().split('T')[0]}.pdf`);
            this.showAlert('success', 'Reporte PDF generado exitosamente');
            
        } catch (error) {
            console.error('Error al generar PDF:', error);
            this.showAlert('danger', 'Error al generar el reporte PDF');
        }
    }

    exportCitasExcel() {
        try {
            // Obtener citas filtradas actuales
            const citasParaExportar = this.getCurrentFilteredCitas();
            
            // Preparar datos para Excel
            const datosExcel = citasParaExportar.map(cita => ({
                'ID': cita.id,
                'Paciente': cita.paciente_completo,
                'Email Paciente': cita.paciente_correo || 'N/A',
                'Teléfono Paciente': cita.paciente_telefono || 'N/A',
                'Odontólogo': cita.odontologo_completo,
                'Email Odontólogo': cita.odontologo_correo || 'N/A',
                'Fecha': cita.fecha_formateada || 'N/A',
                'Hora': cita.hora || 'N/A',
                'Estado': cita.estado,
                'Motivo': cita.motivo || 'Sin motivo especificado',
                'Notas': cita.notas || 'Sin notas'
            }));
            
            // Crear hoja de trabajo
            const ws = window.XLSX.utils.json_to_sheet(datosExcel);
            
            // Crear libro de trabajo
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, 'Citas');
            
            // Agregar hoja de resumen
            const resumen = [{
                'Total de Citas': citasParaExportar.length,
                'Programadas': citasParaExportar.filter(c => c.estado === 'programada').length,
                'Confirmadas': citasParaExportar.filter(c => c.estado === 'confirmada').length,
                'Completadas': citasParaExportar.filter(c => c.estado === 'completada').length,
                'Canceladas': citasParaExportar.filter(c => c.estado === 'cancelada').length,
                'Fecha del Reporte': new Date().toLocaleDateString('es-ES')
            }];
            
            const wsResumen = window.XLSX.utils.json_to_sheet(resumen);
            window.XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
            
            // Guardar archivo
            window.XLSX.writeFile(wb, `citas_reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
            this.showAlert('success', 'Reporte Excel generado exitosamente');
            
        } catch (error) {
            console.error('Error al generar Excel:', error);
            this.showAlert('danger', 'Error al generar el reporte Excel');
        }
    }

    getCurrentFilteredCitas() {
        // Aplicar los mismos filtros que en la tabla
        const fechaFiltro = document.getElementById('fechaFiltro').value;
        const estadoFiltro = document.getElementById('estadoFiltro').value;
        const pacienteFiltro = document.getElementById('pacienteFiltro').value.toLowerCase();
        const odontologoFiltro = document.getElementById('odontologoFiltro').value.toLowerCase();

        let citasFiltradas = [...this.citas];

        if (fechaFiltro) {
            citasFiltradas = citasFiltradas.filter(cita => {
                if (!cita.fecha) return false;
                const fechaCita = new Date(cita.fecha).toISOString().split('T')[0];
                return fechaCita === fechaFiltro;
            });
        }

        if (estadoFiltro) {
            citasFiltradas = citasFiltradas.filter(cita => cita.estado === estadoFiltro);
        }

        if (pacienteFiltro) {
            citasFiltradas = citasFiltradas.filter(cita => 
                (cita.paciente_completo || '').toLowerCase().includes(pacienteFiltro)
            );
        }

        if (odontologoFiltro) {
            citasFiltradas = citasFiltradas.filter(cita => 
                (cita.odontologo_completo || '').toLowerCase().includes(odontologoFiltro)
            );
        }

        return citasFiltradas;
    }

    async actualizarContadorCitasProximas() {
        try {
            // TEMPORALMENTE DESHABILITADO - Error de DB en citas
            console.warn('⚠️ actualizarContadorCitasProximas temporalmente deshabilitado');
            return;
            
            const response = await fetch('/api/citas/admin/proximas');
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            
            const citasProximas = await response.json();
            const badge = document.getElementById('citasProximasBadge');
            
            if (badge) {
                badge.textContent = citasProximas.length;
                
                // Cambiar color según urgencia
                if (citasProximas.length === 0) {
                    badge.className = 'badge bg-secondary';
                } else if (citasProximas.some(c => c.urgencia === 'critica')) {
                    badge.className = 'badge bg-danger';
                } else if (citasProximas.some(c => c.urgencia === 'alta')) {
                    badge.className = 'badge bg-warning';
                } else {
                    badge.className = 'badge bg-info';
                }
            }
            
        } catch (error) {
            console.error('Error al actualizar contador de citas próximas:', error);
        }
    }

    async mostrarCitasProximas() {
        try {
            // TEMPORALMENTE DESHABILITADO - Error de DB en citas  
            console.warn('⚠️ mostrarCitasProximas temporalmente deshabilitado');
            const container = document.getElementById('citasProximasContainer');
            if (container) {
                container.innerHTML = '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> Funcionalidad de citas temporalmente deshabilitada</div>';
            }
            return;
            
            const response = await fetch('/api/citas/admin/proximas');
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            
            const citasProximas = await response.json();
            
            let html;
            if (citasProximas.length === 0) {
                html = '<div class="alert alert-info"><i class="bi bi-calendar-check"></i> No hay citas próximas para mañana</div>';
            } else {
                html = '<div class="list-group">';
                citasProximas.forEach(cita => {
                    const urgenciaClass = {
                        'critica': 'danger',
                        'alta': 'warning', 
                        'media': 'info',
                        'baja': 'secondary'
                    };
                    
                    html += `
                        <div class="list-group-item">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">
                                    <i class="bi bi-person"></i> ${cita.paciente_completo}
                                    <span class="badge bg-${urgenciaClass[cita.urgencia]} ms-2">${cita.urgencia}</span>
                                </h6>
                                <small class="text-muted">${cita.hora}</small>
                            </div>
                            <p class="mb-1">
                                <i class="bi bi-person-badge"></i> Dr. ${cita.odontologo_completo}
                            </p>
                            <small class="text-muted">
                                <i class="bi bi-clipboard"></i> ${cita.motivo || 'Sin motivo especificado'}
                            </small>
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            // Crear y mostrar modal
            const modalDiv = document.createElement('div');
            modalDiv.className = 'modal fade';
            modalDiv.id = 'citasProximasModal';
            modalDiv.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-clock"></i> Citas Próximas (Mañana)
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">${html}</div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modalDiv);
            const modal = new bootstrap.Modal(modalDiv);
            modal.show();
            modalDiv.addEventListener('hidden.bs.modal', () => modalDiv.remove());
            
        } catch (error) {
            console.error('Error al cargar citas próximas:', error);
            this.showAlert('danger', 'Error al cargar citas próximas');
        }
    }

    cambiarVista(vista) {
        this.vistaActual = vista;
        
        const tablaView = document.getElementById('citasTablaView');
        const calendarioView = document.getElementById('citasCalendarioView');
        const vistaTablaBtn = document.getElementById('vistaTablaBtn');
        const vistaCalendarioBtn = document.getElementById('vistaCalendarioBtn');
        
        if (vista === 'tabla') {
            tablaView.classList.remove('d-none');
            calendarioView.classList.add('d-none');
            vistaTablaBtn.classList.add('active');
            vistaCalendarioBtn.classList.remove('active');
        } else {
            tablaView.classList.add('d-none');
            calendarioView.classList.remove('d-none');
            vistaTablaBtn.classList.remove('active');
            vistaCalendarioBtn.classList.add('active');
            this.renderCalendario();
        }
    }

    navegarCalendario(direccion) {
        this.calendarioFechaActual.setMonth(this.calendarioFechaActual.getMonth() + direccion);
        this.renderCalendario();
    }

    irAHoy() {
        this.calendarioFechaActual = new Date();
        this.renderCalendario();
    }

    renderCalendario() {
        const year = this.calendarioFechaActual.getFullYear();
        const month = this.calendarioFechaActual.getMonth();
        
        // Actualizar título
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        document.getElementById('calendarioMesAno').textContent = `${meses[month]} ${year}`;
        
        // Crear calendario
        const primerDia = new Date(year, month, 1);
        const ultimoDia = new Date(year, month + 1, 0);
        const primerDiaSemana = primerDia.getDay();
        const diasEnMes = ultimoDia.getDate();
        
        const tbody = document.getElementById('calendarioBody');
        tbody.innerHTML = '';
        
        let fecha = 1;
        const hoy = new Date();
        
        // Crear 6 semanas (filas)
        for (let semana = 0; semana < 6; semana++) {
