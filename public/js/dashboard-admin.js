// Dashboard Admin JavaScript
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

        // Save user button
        document.getElementById('saveUserBtn').addEventListener('click', () => {
            this.saveUser();
        });
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
                document.getElementById('saveUserBtn').onclick = () => this.saveUser(id);
            }
        } else {
            // Nuevo usuario
            document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
            document.getElementById('saveUserBtn').onclick = () => this.saveUser();
        }
        
        modal.show();
    }

    async saveUser(id = null) {
        const nombre = document.getElementById('userNombre').value.trim();
        const apellido = document.getElementById('userApellido').value.trim();
        const correo = document.getElementById('userEmail').value.trim();
        const telefono = document.getElementById('userTelefono').value.trim();
        const rol = document.getElementById('userRol').value;
        const direccion = document.getElementById('userDireccion').value.trim();
        const fecha_nacimiento = document.getElementById('userFechaNacimiento').value;
        const tipo_documento = document.getElementById('userTipoDocumento').value;
        const numero_documento = document.getElementById('userNumeroDocumento').value.trim();
        const password = document.getElementById('userPassword').value;
        
        console.log('🔍 Datos del formulario:', {
            nombre, apellido, correo, telefono, rol, direccion, fecha_nacimiento, tipo_documento, numero_documento, password: password ? '***' : 'vacio'
        });
        
        // Validaciones básicas
        if (!nombre || !apellido || !correo || !rol || rol === '') {
            alert('Por favor complete todos los campos obligatorios (Nombre, Apellido, Email, Rol)');
            console.log('❌ Validación fallida - campos obligatorios vacíos');
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
                alert(`Error: ${error.msg || 'Error al guardar usuario'}`);
            }
        } catch (err) {
            console.error('❌ Error al guardar usuario:', err);
            alert('Error al guardar usuario');
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
            const fila = document.createElement('tr');
            
            // Crear 7 días (columnas)
            for (let dia = 0; dia < 7; dia++) {
                const celda = document.createElement('td');
                celda.className = 'calendario-dia';
                
                if (semana === 0 && dia < primerDiaSemana) {
                    // Días del mes anterior
                    const mesAnterior = new Date(year, month - 1, 0);
                    const diaAnterior = mesAnterior.getDate() - (primerDiaSemana - dia - 1);
                    celda.innerHTML = `<div class="dia-numero">${diaAnterior}</div>`;
                    celda.classList.add('otro-mes');
                } else if (fecha > diasEnMes) {
                    // Días del mes siguiente
                    const diaSiguiente = fecha - diasEnMes;
                    celda.innerHTML = `<div class="dia-numero">${diaSiguiente}</div>`;
                    celda.classList.add('otro-mes');
                    fecha++;
                } else {
                    // Días del mes actual
                    const fechaActual = new Date(year, month, fecha);
                    const esHoy = fechaActual.toDateString() === hoy.toDateString();
                    
                    celda.innerHTML = `<div class="dia-numero">${fecha}</div>`;
                    
                    if (esHoy) {
                        celda.classList.add('hoy');
                    }
                    
                    // Agregar citas del día
                    this.agregarCitasAlDia(celda, fechaActual);
                    
                    fecha++;
                }
                
                fila.appendChild(celda);
            }
            
            tbody.appendChild(fila);
            
            // Si ya no hay más días, salir del bucle
            if (fecha > diasEnMes) break;
        }
    }

    agregarCitasAlDia(celda, fecha) {
        const fechaStr = fecha.toISOString().split('T')[0];
        const citasDelDia = this.citas.filter(cita => {
            if (!cita.fecha) return false;
            return new Date(cita.fecha).toISOString().split('T')[0] === fechaStr;
        });
        
        if (citasDelDia.length > 0) {
            celda.classList.add('dia-con-citas');
            
            // Agregar contador
            const contador = document.createElement('div');
            contador.className = 'citas-contador';
            contador.textContent = citasDelDia.length;
            celda.appendChild(contador);
            
            // Mostrar máximo 3 citas
            const citasAMostrar = citasDelDia.slice(0, 3);
            citasAMostrar.forEach(cita => {
                const citaDiv = document.createElement('div');
                citaDiv.className = `cita-item cita-${cita.estado}`;
                citaDiv.textContent = `${cita.hora} ${cita.paciente_completo}`;
                citaDiv.title = `${cita.hora} - ${cita.paciente_completo} con ${cita.odontologo_completo}`;
                citaDiv.onclick = () => this.verDetallesCita(cita.id);
                celda.appendChild(citaDiv);
            });
            
            // Si hay más de 3 citas, mostrar indicador
            if (citasDelDia.length > 3) {
                const masDiv = document.createElement('div');
                masDiv.className = 'cita-item';
                masDiv.style.backgroundColor = '#6c757d';
                masDiv.textContent = `+${citasDelDia.length - 3} más`;
                masDiv.onclick = () => this.mostrarCitasDelDia(fecha, citasDelDia);
                celda.appendChild(masDiv);
            }
        }
        
        // Click en día para ver todas las citas
        celda.onclick = (e) => {
            if (e.target === celda || e.target.classList.contains('dia-numero')) {
                this.mostrarCitasDelDia(fecha, citasDelDia);
            }
        };
    }

    mostrarCitasDelDia(fecha, citas) {
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        let html;
        if (citas.length === 0) {
            html = '<div class="alert alert-info">No hay citas programadas para este día</div>';
        } else {
            html = '<div class="list-group">';
            citas.forEach(cita => {
                html += `
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">
                                <i class="bi bi-clock"></i> ${cita.hora} - ${cita.paciente_completo}
                                ${this.getEstadoBadge(cita.estado)}
                            </h6>
                        </div>
                        <p class="mb-1">
                            <i class="bi bi-person-badge"></i> ${cita.odontologo_completo}
                        </p>
                        <small class="text-muted">
                            <i class="bi bi-clipboard"></i> ${cita.motivo || 'Sin motivo especificado'}
                        </small>
                        <div class="mt-2">
                            <button class="btn btn-sm btn-outline-primary" onclick="dashboardAdmin.verDetallesCita(${cita.id})">
                                Ver detalles
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Crear y mostrar modal
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal fade';
        modalDiv.id = 'citasDelDiaModal';
        modalDiv.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-calendar-day"></i> Citas del ${fechaFormateada}
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
    }

    async reasignarOdontologo(citaId) {
        const cita = this.citas.find(c => c.id === citaId);
        if (!cita) {
            this.showAlert('danger', 'Cita no encontrada');
            return;
        }

        // Llenar información de la cita
        document.getElementById('reasignarPaciente').textContent = cita.paciente_completo;
        document.getElementById('reasignarFecha').textContent = cita.fecha_formateada;
        document.getElementById('reasignarHora').textContent = cita.hora;
        document.getElementById('reasignarOdontologoActual').textContent = cita.odontologo_completo;

        // Cargar odontólogos disponibles
        await this.cargarOdontologosDisponibles(cita.odontologo_id);

        // Configurar evento del botón confirmar
        document.getElementById('confirmarReasignacionBtn').onclick = () => this.confirmarReasignacion(citaId);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('reasignarOdontologoModal'));
        modal.show();
    }

    async cargarOdontologosDisponibles(odontologoActualId) {
        try {
            const response = await fetch('/api/usuarios?rol=odontologo');
            if (!response.ok) {
                throw new Error('Error al cargar odontólogos');
            }

            const odontologos = await response.json();
            const select = document.getElementById('nuevoOdontologoSelect');
            
            select.innerHTML = '<option value="">Seleccione un odontólogo</option>';
            
            odontologos.forEach(odontologo => {
                if (odontologo.id !== odontologoActualId && odontologo.estado === 'activo') {
                    const option = document.createElement('option');
                    option.value = odontologo.id;
                    option.textContent = `${odontologo.nombre} ${odontologo.apellido}`;
                    select.appendChild(option);
                }
            });

        } catch (error) {
            console.error('Error al cargar odontólogos:', error);
            this.showAlert('danger', 'Error al cargar lista de odontólogos');
        }
    }

    async confirmarReasignacion(citaId) {
        const nuevoOdontologoId = document.getElementById('nuevoOdontologoSelect').value;
        const motivoCambio = document.getElementById('motivoCambioOdontologo').value;

        if (!nuevoOdontologoId) {
            this.showAlert('warning', 'Debe seleccionar un odontólogo');
            return;
        }

        try {
            const response = await fetch(`/api/citas/${citaId}/reasignar`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nuevo_odontologo_id: nuevoOdontologoId,
                    motivo_cambio: motivoCambio
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.msg || 'Error al reasignar odontólogo');
            }

            const result = await response.json();
            console.log('✅ Odontólogo reasignado:', result);

            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('reasignarOdontologoModal')).hide();

            // Recargar citas
            await this.loadCitas();

            // Mostrar mensaje de éxito
            this.showAlert('success', 'Odontólogo reasignado exitosamente');

        } catch (error) {
            console.error('❌ Error al reasignar odontólogo:', error);
            this.showAlert('danger', `Error: ${error.message}`);
        }
    }
}

document.getElementById('exportPdfBtn').onclick = () => {
    const doc = new window.jspdf.jsPDF();
    doc.text('Reporte de Usuarios', 10, 10);
    let y = 20;
    dashboardAdmin.users.forEach(u => {
        doc.text(`${u.id} - ${u.nombre} ${u.apellido} - ${u.correo} - ${u.rol}`, 10, y);
        y += 10;
    });
    doc.save('usuarios_reporte.pdf');
};

document.getElementById('exportExcelBtn').onclick = () => {
    const ws = window.XLSX.utils.json_to_sheet(dashboardAdmin.users);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    window.XLSX.writeFile(wb, 'usuarios_reporte.xlsx');
};

document.getElementById('notificationsBtn').onclick = async () => {
    try {
        // Obtener usuario de localStorage o usar un ID por defecto
        const user = JSON.parse(localStorage.getItem('user')) || { id: 1 };
        console.log('🔍 Usuario:', user);
        
        const res = await fetch(`/api/notificaciones/${user.id}`);
        console.log('🔍 Respuesta API:', res.status);
        
        const notificaciones = await res.json();
        console.log('🔍 Notificaciones recibidas:', notificaciones);
        
        let html;
        if (!notificaciones || notificaciones.length === 0) {
            html = '<div class="alert alert-info">No hay notificaciones disponibles</div>';
        } else {
            html = '<ul class="list-group">';
            notificaciones.forEach(n => {
                html += `<li class="list-group-item">${n.mensaje} <span class="badge bg-${n.tipo === 'alerta' ? 'danger' : 'info'} ms-2">${n.tipo}</span></li>`;
            });
            html += '</ul>';
        }
        
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal fade';
        modalDiv.id = 'notificacionesModal';
        modalDiv.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Notificaciones</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">${html}</div>
                </div>
            </div>`;
        document.body.appendChild(modalDiv);

        const modal = new bootstrap.Modal(modalDiv);
        modal.show();
        modalDiv.addEventListener('hidden.bs.modal', () => modalDiv.remove());
    } catch (error) {
        console.error('❌ Error al cargar notificaciones:', error);
        alert('Error al cargar notificaciones');
    }
};

// Función para mostrar historial general
async function mostrarHistorialGeneral() {
    try {
        console.log('📊 Cargando historial general...');
        
        // Obtener headers de autenticación
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id;
        
        const response = await fetch('/api/citas/admin/historial-general', {
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId || '1'
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.msg || 'Error al cargar historial');
        }

        console.log('✅ Historial cargado:', data);

        // Actualizar estadísticas
        document.getElementById('totalCitasCambios').textContent = data.estadisticas.total_citas_con_cambios;
        document.getElementById('totalReasignaciones').textContent = data.estadisticas.total_reasignaciones;
        document.getElementById('totalCambiosEstado').textContent = data.estadisticas.total_cambios_estado;
        document.getElementById('totalReprogramaciones').textContent = data.estadisticas.total_reprogramaciones;

        // Llenar tabla
        const tbody = document.querySelector('#historialTable tbody');
        tbody.innerHTML = '';

        data.citas.forEach(cita => {
            const fechaFormateada = new Date(cita.fecha).toLocaleDateString('es-ES');
            const ultimoCambio = cita.ultimo_cambio ? 
                cita.ultimo_cambio.substring(0, 100) + (cita.ultimo_cambio.length > 100 ? '...' : '') : 
                'Sin cambios recientes';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cita.id}</td>
                <td>${fechaFormateada}</td>
                <td>${cita.paciente}</td>
                <td>${cita.odontologo}</td>
                <td>
                    <span class="badge bg-${getEstadoColor(cita.estado)}">${cita.estado}</span>
                </td>
                <td>
                    <span class="badge bg-primary">${cita.total_cambios}</span>
                </td>
                <td>
                    <small>${ultimoCambio}</small>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="mostrarHistorialEspecifico(${cita.id})">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('historialGeneralModal'));
        modal.show();

    } catch (error) {
        console.error('❌ Error al cargar historial general:', error);
        alert('Error al cargar historial general: ' + error.message);
    }
}

// Función para mostrar historial específico de una cita
async function mostrarHistorialEspecifico(citaId) {
    try {
        console.log('📚 Cargando historial de cita:', citaId);
        const response = await fetch(`/api/citas/${citaId}/historial`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.msg || 'Error al cargar historial de la cita');
        }

        console.log('✅ Historial específico cargado:', data);

        // Actualizar información de la cita
        document.getElementById('citaId').textContent = data.cita.id;
        document.getElementById('citaPaciente').textContent = data.cita.paciente;
        document.getElementById('citaEstado').textContent = data.cita.estado_actual;
        document.getElementById('citaFecha').textContent = new Date(data.cita.fecha_actual).toLocaleDateString('es-ES');
        document.getElementById('citaHora').textContent = data.cita.hora_actual;
        document.getElementById('citaOdontologo').textContent = data.cita.odontologo_actual;

        // Mostrar historial de cambios
        const historialDiv = document.getElementById('historialCambios');
        if (data.historial.length === 0) {
            historialDiv.innerHTML = '<p class="text-muted">No hay cambios registrados para esta cita.</p>';
        } else {
            historialDiv.innerHTML = data.historial.map(cambio => `
                <div class="d-flex align-items-start mb-3">
                    <div class="badge bg-secondary me-3 mt-1">
                        <i class="bi bi-clock"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <h6 class="mb-1">${cambio.accion}</h6>
                            <small class="text-muted">${cambio.fecha || 'Fecha no disponible'}</small>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('historialEspecificoModal'));
        modal.show();

    } catch (error) {
        console.error('❌ Error al cargar historial específico:', error);
        alert('Error al cargar historial de la cita: ' + error.message);
    }
}

// ========== FUNCIONES DE INVENTARIO Y SEDES ==========

async function loadInventario() {
    console.log('📦 Cargando inventario...');
    
    // Solo buscar elementos dentro de la sección de inventario
    const inventarioSection = document.getElementById('inventario-section');
    if (!inventarioSection) {
        console.error('❌ Sección de inventario no encontrada');
        return;
    }
    
    const inventarioTableBody = inventarioSection.querySelector('#inventarioTableBody');
    const statusDiv = inventarioSection.querySelector('#inventarioStatus');
    
    console.log('🔍 Elementos encontrados:');
    console.log('  - inventarioSection:', !!inventarioSection);
    console.log('  - inventarioTableBody:', !!inventarioTableBody);
    console.log('  - statusDiv:', !!statusDiv);
    
    try {
        // Mostrar loading
        if (inventarioTableBody) {
            inventarioTableBody.innerHTML = '<tr><td colspan="12" class="text-center"><div class="spinner-border text-primary"></div><br>Cargando inventario...</td></tr>';
        }
        
        // Obtener headers de autenticación
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id;
        
        console.log('🔐 Datos de autenticación:', { userId, userExists: !!user });
        
        const res = await fetch('/api/inventario', {
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId || '1'
            }
        });
        
        console.log('📡 Respuesta inventario:', res.status);
        
        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        
        const inventario = await res.json();
        console.log(`✅ Inventario cargado: ${inventario.length} items`);
        console.log('📊 Primer item como muestra:', inventario[0]);
        
        // Guardar datos completos en variable global para filtrado
        window.inventarioCompleto = inventario;
        
        // Verificar que renderInventarioTable esté disponible
        if (typeof renderInventarioTable !== 'function') {
            console.error('❌ Función renderInventarioTable no disponible');
            if (inventarioTableBody) {
                inventarioTableBody.innerHTML = '<tr><td colspan="12" class="text-center text-danger">Error: Función de renderizado no disponible</td></tr>';
            }
            return;
        }
        
        // Renderizar tabla
        console.log('🔄 Llamando a renderInventarioTable...');
        renderInventarioTable(inventario);
        console.log('✅ renderInventarioTable ejecutada');
        
        // Mostrar estado
        if (statusDiv) {
            if (inventario.length === 0) {
                statusDiv.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle"></i> No hay items en el inventario</div>';
            } else {
                statusDiv.innerHTML = `<div class="alert alert-success"><i class="bi bi-check-circle"></i> ${inventario.length} items en inventario</div>`;
            }
        }
        
    } catch (error) {
        console.error('❌ Error cargando inventario:', error);
        if (inventarioTableBody) {
            inventarioTableBody.innerHTML = `<tr><td colspan="12" class="text-center text-danger">Error al cargar inventario: ${error.message}</td></tr>`;
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> Error al cargar inventario</div>';
        }
    }
}


function renderInventarioTable(inventario) {
    console.log('🔄 [renderInventarioTable] Iniciando renderizado...');
    console.log('📊 [renderInventarioTable] Datos recibidos:', inventario ? inventario.length : 'undefined', 'items');
    
    // Buscar dentro de la sección de inventario específicamente
    const inventarioSection = document.getElementById('inventario-section');
    if (!inventarioSection) {
        console.error('❌ [renderInventarioTable] Sección de inventario no encontrada');
        return;
    }
    
    const tbody = inventarioSection.querySelector('#inventarioTableBody');
    console.log('🔍 [renderInventarioTable] tbody encontrado:', !!tbody);
    
    if (!tbody) {
        console.error('❌ [renderInventarioTable] Tabla de inventario no encontrada dentro de inventario-section');
        return;
    }
    
    if (!inventario || inventario.length === 0) {
        console.log('ℹ️ [renderInventarioTable] No hay items, mostrando mensaje vacío');
        tbody.innerHTML = '<tr><td colspan="12" class="text-center text-muted">No hay items en el inventario</td></tr>';
        return;
    }
    
    console.log('🔄 [renderInventarioTable] Renderizando inventario:', inventario.length, 'items');
    console.log('📊 [renderInventarioTable] Muestra del primer item:', inventario[0]);
    
    const rowsHTML = inventario.map(item => {
        // Manejar diferentes estructuras de datos
        const equipoNombre = item.equipo_nombre || item.nombre || 'Producto sin nombre';
        const sedeNombre = item.sede_nombre || 'Sede no asignada';
        const sedeCiudad = item.sede_ciudad ? ` - ${item.sede_ciudad}` : '';
        const cantidad = item.cantidad || item.stock_actual || 0;
        const stockMinimo = item.stock_minimo || 5; // Valor por defecto fijo
        const categoria = item.equipo_categoria || item.categoria || 'Sin categoría';
        const precio = parseFloat(item.equipo_precio || item.precio_unitario || 0);
        const valorTotal = cantidad * precio;
        const codigo = item.equipo_id || item.codigo || item.id || 'N/A';
        
        // Para fecha de última actualización, usar valor por defecto si no existe
        const ultimaActualizacion = item.fecha_actualizacion || item.updated_at || item.created_at || new Date().toISOString();
        const fecha = new Date(ultimaActualizacion).toLocaleDateString('es-CO');
        
        // Determinar estado del stock basado en cantidad vs stock mínimo
        let estadoStock = 'Normal';
        let badgeClass = 'bg-success';
        if (cantidad <= stockMinimo) {
            estadoStock = 'Bajo';
            badgeClass = 'bg-danger';
        } else if (cantidad <= stockMinimo * 1.5) {
            estadoStock = 'Alerta';
            badgeClass = 'bg-warning';
        }
        
        return `
            <tr>
                <td><input type="checkbox" class="form-check-input" value="${item.id}"></td>
                <td><span class="badge bg-secondary">${codigo}</span></td>
                <td><strong>${equipoNombre}</strong><br><small class="text-muted">${item.descripcion_item || ''}</small></td>
                <td><span class="badge bg-info">${categoria}</span></td>
                <td>${sedeNombre}${sedeCiudad}</td>
                <td><span class="badge bg-primary fs-6">${cantidad}</span></td>
                <td><span class="badge bg-secondary">${stockMinimo}</span></td>
                <td>$${precio.toLocaleString('es-CO')}</td>
                <td>$${valorTotal.toLocaleString('es-CO')}</td>
                <td><span class="badge ${badgeClass}">${estadoStock}</span></td>
                <td><small>${fecha}</small></td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-warning" onclick="editarItemInventario(${item.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarItemInventario(${item.id})" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('📝 [renderInventarioTable] HTML generado, longitud:', rowsHTML.length, 'caracteres');
    tbody.innerHTML = rowsHTML;
    console.log('✅ [renderInventarioTable] Tabla de inventario renderizada exitosamente');
    console.log('🔍 [renderInventarioTable] Filas en tabla después del renderizado:', tbody.querySelectorAll('tr').length);
}

// ========== FUNCIONES AUXILIARES DE INVENTARIO ==========

async function editarItemInventario(id) {
    console.log('Editando item de inventario:', id);
    
    try {
        // Buscar el item en los datos completos
        const inventario = window.inventarioCompleto || [];
        const item = inventario.find(i => i.id == id);
        
        if (!item) {
            console.error('Item no encontrado');
            return;
        }
        
        // Aquí puedes abrir un modal de edición
        // Por ahora, mostrar una alerta
        alert(`Editar item: ${item.equipo_nombre || item.nombre}\nCantidad: ${item.cantidad}\nSede: ${item.sede_nombre}`);
        
    } catch (error) {
        console.error('Error editando item:', error);
    }
}

async function eliminarItemInventario(id) {
    if (!confirm('¿Está seguro de que desea eliminar este item del inventario?')) {
        return;
    }
    
    console.log('Eliminando item de inventario:', id);
    
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id;
        
        const response = await fetch(`/api/inventario/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId || '1'
            }
        });
        
        if (response.ok) {
            console.log('Item eliminado correctamente');
            // Recargar inventario
            loadInventario();
            
            // Mostrar notificación
            const alertDiv = document.getElementById('inventarioStatus');
            if (alertDiv) {
                alertDiv.innerHTML = '<div class="alert alert-success alert-dismissible fade show"><i class="bi bi-check-circle"></i> Item eliminado correctamente <button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>';
                setTimeout(() => alertDiv.innerHTML = '', 3000);
            }
        } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error eliminando item:', error);
        
        const alertDiv = document.getElementById('inventarioStatus');
        if (alertDiv) {
            alertDiv.innerHTML = `<div class="alert alert-danger alert-dismissible fade show"><i class="bi bi-exclamation-triangle"></i> Error: ${error.message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
        }
    }
}

async function loadSedes() {
    console.log('🏢 Cargando sedes...');
    
    // Buscar elementos dentro de la sección de inventario
    const inventarioSection = document.getElementById('inventario-section');
    if (!inventarioSection) {
        console.error('❌ Sección de inventario no encontrada para sedes');
        return;
    }
    
    const sedesGrid = inventarioSection.querySelector('#sedesGrid');
    const filtroSede = inventarioSection.querySelector('#filtroSede');
    
    try {
        // Mostrar loading
        if (sedesGrid) {
            sedesGrid.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary"></div></div>';
        }
        
        // Obtener headers de autenticación
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id;
        
        const res = await fetch('/api/sedes', {
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId || '1'
            }
        });
        
        console.log('📡 Respuesta sedes:', res.status);
        
        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        
        const sedes = await res.json();
        console.log(`✅ Sedes cargadas: ${sedes.length}`);
        
        // Renderizar grid de sedes
        renderSedesGrid(sedes);
        
        // Actualizar filtro de sedes
        if (filtroSede) {
            filtroSede.innerHTML = '<option value="">Todas las sedes</option>' +
                sedes.map(sede => `<option value="${sede.id}">${sede.nombre}</option>`).join('');
        }
        
        // Actualizar opciones en modal de inventario
        const invSede = document.getElementById('invSede');
        if (invSede) {
            invSede.innerHTML = '<option value="">Seleccionar sede</option>' +
                sedes.filter(s => s.estado === 'activa').map(sede => `<option value="${sede.id}">${sede.nombre}</option>`).join('');
        }
        
    } catch (err) {
        console.error('❌ Error al cargar sedes:', err);
        
        const sedesGrid = inventarioSection.querySelector('#sedesGrid');
        if (sedesGrid) {
            sedesGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i>
                        Error al cargar sedes: ${err.message}
                        <br>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="loadSedes()">
                            <i class="bi bi-arrow-clockwise"></i> Reintentar
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

function renderSedesGrid(sedes) {
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
    
    console.log('🏢 Renderizando', sedes.length, 'sedes');
    
    sedesGrid.innerHTML = sedes.map(sede => {
        const estado = sede.estado || 'activa';
        const badgeClass = estado === 'activa' ? 'bg-success' : 'bg-secondary';
        const direccion = sede.direccion || 'Sin dirección';
        const telefono = sede.telefono || 'Sin teléfono';
        const ciudad = sede.ciudad || 'Sin ciudad';
        
        return `
            <div class="col-md-6 mb-3">
                <div class="card h-100 sede-card" data-sede-id="${sede.id}" onclick="seleccionarSede(${sede.id})">
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
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="event.stopPropagation(); editarSede(${sede.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-info" onclick="event.stopPropagation(); verDetalleSede(${sede.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('✅ Grid de sedes renderizado');
}

    console.log('✅ Grid de sedes renderizado');


// Funciones auxiliares para sedes
function seleccionarSede(sedeId) {
    console.log('🏢 Sede seleccionada:', sedeId);
    const sedeInfo = document.getElementById('sedeInfo');
    if (sedeInfo) {
        sedeInfo.innerHTML = `<p>Sede ID: ${sedeId} seleccionada</p>`;
    }
}

function editarSede(sedeId) {
    console.log('✏️ Editando sede:', sedeId);
    alert(`Función de edición de sede ${sedeId} - Por implementar`);
}

function verDetalleSede(sedeId) {
    console.log('👁️ Viendo detalles de sede:', sedeId);
    alert(`Detalles de sede ${sedeId} - Por implementar`);
}

async function loadEquipos() {
    console.log('🔧 Cargando equipos...');
    
    // Solo buscar elementos dentro de la sección de inventario
    const inventarioSection = document.getElementById('inventario-section');
    if (!inventarioSection) {
        console.error('❌ Sección de inventario no encontrada para equipos');
        return;
    }
    
    try {
        // Obtener headers de autenticación
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id;
        
        const res = await fetch('/api/inventario/equipos', {
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId || '1'
            }
        });
        
        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        
        const equipos = await res.json();
        console.log(`✅ Equipos cargados: ${equipos.length}`);
        
        // Actualizar select de equipos en modal
        const invEquipo = document.getElementById('invEquipo');
        if (invEquipo) {
            invEquipo.innerHTML = '<option value="">Seleccionar equipo</option>' +
                equipos.map(equipo => `<option value="${equipo.id}">${equipo.nombre} - ${equipo.categoria}</option>`).join('');
        }
        
    } catch (err) {
        console.error('❌ Error al cargar equipos:', err);
    }
}

// Modales
function openInventarioModal(id = null) {
    const modal = new bootstrap.Modal(document.getElementById('inventarioModal'));
    const form = document.getElementById('inventarioForm');
    const title = document.getElementById('inventarioModalTitle');
    const saveBtn = document.getElementById('saveInventarioBtn');
    
    form.reset();
    
    if (id) {
        title.textContent = 'Editar Item de Inventario';
        // Cargar datos del item para edición
        // TODO: Implementar carga de datos para edición
        saveBtn.onclick = () => saveInventario(id);
    } else {
        title.textContent = 'Nuevo Item de Inventario';
        saveBtn.onclick = () => saveInventario();
    }
    
    modal.show();
}

function openSedeModal(id = null) {
    const modal = new bootstrap.Modal(document.getElementById('sedeModal'));
    const form = document.getElementById('sedeForm');
    const title = document.getElementById('sedeModalTitle');
    const saveBtn = document.getElementById('saveSedeBtn');
    
    form.reset();
    
    if (id) {
        title.textContent = 'Editar Sede';
        // Cargar datos de la sede para edición
        loadSedeData(id);
        saveBtn.onclick = () => saveSede(id);
    } else {
        title.textContent = 'Nueva Sede';
        saveBtn.onclick = () => saveSede();
    }
    
    modal.show();
}

async function loadSedeData(id) {
    try {
        const res = await fetch(`/api/sedes/${id}`);
        if (!res.ok) throw new Error('Error al cargar datos de la sede');
        
        const sede = await res.json();
        
        document.getElementById('sedeNombre').value = sede.nombre;
        document.getElementById('sedeDireccion').value = sede.direccion;
        document.getElementById('sedeCiudad').value = sede.ciudad;
        document.getElementById('sedeTelefono').value = sede.telefono || '';
        document.getElementById('sedeEstado').value = sede.estado;
        
    } catch (err) {
        console.error('Error al cargar datos de sede:', err);
        alert('Error al cargar datos de la sede');
    }
}

// Guardar funciones
async function saveInventario(id = null) {
    const formData = {
        sede_id: document.getElementById('invSede').value,
        equipo_id: document.getElementById('invEquipo').value,
        cantidad: document.getElementById('invCantidad').value,
        descripcion: document.getElementById('invDescripcion').value
    };
    
    if (!formData.sede_id || !formData.equipo_id || !formData.cantidad) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }
    
    try {
        const url = id ? `/api/inventario/${id}` : '/api/inventario';
        const method = id ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.msg || 'Error al guardar');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('inventarioModal')).hide();
        await loadInventario();
        
        alert(id ? 'Item actualizado correctamente' : 'Item agregado correctamente');
        
    } catch (err) {
        console.error('Error al guardar inventario:', err);
        alert('Error al guardar: ' + err.message);
    }
}

async function saveSede(id = null) {
    const formData = {
        nombre: document.getElementById('sedeNombre').value,
        direccion: document.getElementById('sedeDireccion').value,
        ciudad: document.getElementById('sedeCiudad').value,
        telefono: document.getElementById('sedeTelefono').value,
        estado: document.getElementById('sedeEstado').value
    };
    
    if (!formData.nombre || !formData.direccion || !formData.ciudad) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }
    
    try {
        const url = id ? `/api/sedes/${id}` : '/api/sedes';
        const method = id ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.msg || 'Error al guardar');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('sedeModal')).hide();
        await loadSedes();
        
        alert(id ? 'Sede actualizada correctamente' : 'Sede creada correctamente');
        
    } catch (err) {
        console.error('Error al guardar sede:', err);
        alert('Error al guardar: ' + err.message);
    }
}

// Eliminar funciones
async function eliminarInventario(id) {
    if (!confirm('¿Está seguro de eliminar este item del inventario?')) return;
    
    try {
        const res = await fetch(`/api/inventario/${id}`, { method: 'DELETE' });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.msg || 'Error al eliminar');
        }
        
        await loadInventario();
        alert('Item eliminado correctamente');
        
    } catch (err) {
        console.error('Error al eliminar inventario:', err);
        alert('Error al eliminar: ' + err.message);
    }
}

async function eliminarSede(id) {
    if (!confirm('¿Está seguro de eliminar esta sede? Esto también eliminará todo su inventario asociado.')) return;
    
    try {
        const res = await fetch(`/api/sedes/${id}`, { method: 'DELETE' });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.msg || 'Error al eliminar');
        }
        
        await loadSedes();
        alert('Sede eliminada correctamente');
        
    } catch (err) {
        console.error('Error al eliminar sede:', err);
        alert('Error al eliminar: ' + err.message);
    }
}

// Función auxiliar para obtener color del estado
function getEstadoColor(estado) {
    switch (estado) {
        case 'programada': return 'primary';
        case 'confirmada': return 'info';
        case 'completada': return 'success';
        case 'cancelada': return 'danger';
        default: return 'secondary';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardAdmin = new DashboardAdmin();
    
    // Configurar botón de exportar PDF
    document.getElementById('exportPdfBtn').onclick = () => {
        const doc = new window.jspdf.jsPDF();
        doc.text('Reporte de Usuarios', 10, 10);
        let y = 20;
        dashboardAdmin.users.forEach(u => {
            doc.text(`${u.id} - ${u.nombre} ${u.apellido} - ${u.correo} - ${u.rol}`, 10, y);
            y += 10;
        });
        doc.save('usuarios.pdf');
    };
    
    // Configurar botón de exportar PDF
    document.getElementById('exportPdfBtn').onclick = () => {
        const doc = new window.jspdf.jsPDF();
        doc.text('Reporte de Usuarios', 10, 10);
        let y = 20;
        dashboardAdmin.users.forEach(u => {
            doc.text(`${u.id} - ${u.nombre} ${u.apellido} - ${u.correo} - ${u.rol}`, 10, y);
            y += 10;
        });
        doc.save('usuarios.pdf');
    };
    
    // Configurar botón de exportar Excel
    document.getElementById('exportExcelBtn').onclick = () => {
        const ws = window.XLSX.utils.json_to_sheet(dashboardAdmin.users);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
        window.XLSX.writeFile(wb, 'usuarios_reporte.xlsx');
    };
    
    // Configurar botón de notificaciones
    document.getElementById('notificationsBtn').onclick = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user')) || { id: 1 };
            console.log('🔍 Usuario:', user);
            
            const res = await fetch(`/api/notificaciones/${user.id}`);
            console.log('🔍 Respuesta API:', res.status);
            
            const notificaciones = await res.json();
            console.log('🔍 Notificaciones recibidas:', notificaciones);
            
            let html;
            if (!notificaciones || notificaciones.length === 0) {
                html = '<div class="alert alert-info">No hay notificaciones disponibles</div>';
            } else {
                html = '<ul class="list-group">';
                notificaciones.forEach(n => {
                    html += `<li class="list-group-item">${n.mensaje} <span class="badge bg-${n.tipo === 'alerta' ? 'danger' : 'info'} ms-2">${n.tipo}</span></li>`;
                });
                html += '</ul>';
            }
            
            const modalHtml = `
                <div class="modal fade" id="notificacionesModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Notificaciones</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">${html}</div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modalDiv = document.getElementById('notificacionesModal');
            const modal = new bootstrap.Modal(modalDiv);
            modal.show();
            modalDiv.addEventListener('hidden.bs.modal', () => modalDiv.remove());
        } catch (error) {
            console.error('❌ Error al cargar notificaciones:', error);
            alert('Error al cargar notificaciones');
        }
    };
    
    // Agregar event listener para el botón de historial general
    document.getElementById('historialGeneralBtn').addEventListener('click', mostrarHistorialGeneral);
    
    // Event listeners para inventario y sedes
    document.getElementById('addInventarioBtn').addEventListener('click', () => openInventarioModal());
    document.getElementById('addSedeBtn').addEventListener('click', () => openSedeModal());
    
    // Event listener para filtro de sede
    const filtroSede = document.getElementById('filtroSede');
    if (filtroSede) {
        filtroSede.addEventListener('change', (e) => {
            const sedeId = e.target.value;
            console.log('🔍 Filtro cambiado a sede:', sedeId || 'Todas las sedes');
            filtrarInventarioPorSede(sedeId);
        });
    }
});

document.getElementById('addSedeBtn').onclick = () => dashboardAdmin.openSedeModal();

// Función para filtrar inventario por sede
function filtrarInventarioPorSede(sedeId) {
    console.log(`🎯 Filtrando inventario por sede ID: ${sedeId || 'Todas'}`);
    
    // Obtener todos los datos del inventario desde la variable global
    if (!window.inventarioCompleto) {
        console.error('❌ No hay datos de inventario cargados');
        return;
    }
    
    let inventarioFiltrado;
    
    if (!sedeId || sedeId === '') {
        // Mostrar todas las sedes
        inventarioFiltrado = window.inventarioCompleto;
        console.log(`✅ Mostrando todos los items: ${inventarioFiltrado.length}`);
    } else {
        // Filtrar por sede específica
        inventarioFiltrado = window.inventarioCompleto.filter(item => 
            item.sede_id && item.sede_id.toString() === sedeId.toString()
        );
        console.log(`✅ Items filtrados para sede ${sedeId}: ${inventarioFiltrado.length}`);
    }
    
    // Renderizar la tabla con los datos filtrados
    renderInventarioTable(inventarioFiltrado);
    
    // Actualizar el mensaje de estado
    actualizarMensajeInventario(inventarioFiltrado.length, sedeId);
}

// Función para actualizar mensaje de estado del inventario
function actualizarMensajeInventario(cantidadVisible, sedeId) {
    const statusDiv = document.getElementById('inventarioStatus');
    if (!statusDiv) return;
    
    let mensaje;
    if (sedeId) {
        const selectSede = document.getElementById('filtroSede');
        const sedeNombre = selectSede ? selectSede.options[selectSede.selectedIndex].text : 'Sede seleccionada';
        mensaje = `📋 Mostrando ${cantidadVisible} items de inventario para: <strong>${sedeNombre}</strong>`;
    } else {
        mensaje = `📋 Mostrando ${cantidadVisible} items de inventario de <strong>todas las sedes</strong>`;
    }
    
    statusDiv.innerHTML = `
        <div class="alert alert-info mb-3">
            <i class="bi bi-info-circle"></i> ${mensaje}
        </div>
    `;
}

// ===== FUNCIONES DE DEBUG AVANZADAS =====

// Test específico de endpoints API
async function testApiEndpoints() {
    showDebugPanel();
    logDebug('🔗 Iniciando test de endpoints API...');
    
    const endpoints = [
        { name: 'Citas', url: '/api/citas', method: 'GET' },
        { name: 'Usuarios', url: '/api/auth/usuarios', method: 'GET' },
        { name: 'Inventario', url: '/api/inventario', method: 'GET' },
        { name: 'Sedes', url: '/api/sedes', method: 'GET' },
        { name: 'Tratamientos', url: '/api/tratamientos', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
        try {
            logDebug(`🔍 Testing ${endpoint.name}: ${endpoint.url}`);
            const response = await fetch(endpoint.url);
            
            if (response.ok) {
                const data = await response.json();
                logDebug(`✅ ${endpoint.name}: OK (${Array.isArray(data) ? data.length : 'object'} items)`);
            } else {
                logDebug(`❌ ${endpoint.name}: Error ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            logDebug(`❌ ${endpoint.name}: Error de conexión - ${error.message}`);
        }
    }
    
    logDebug('✅ Test de endpoints completado');
}

// Test específico de base de datos
async function checkDatabaseConnection() {
    showDebugPanel();
    logDebug('🗄️ Verificando conexión específica a base de datos...');
    
    try {
        // Test de lectura
        logDebug('📖 Test de lectura...');
        const readTest = await fetch('/api/citas');
        if (readTest.ok) {
            logDebug('✅ Lectura: OK');
        } else {
            logDebug(`❌ Lectura: Error ${readTest.status}`);
        }

        // Test de escritura (simulado con una consulta de prueba)
        logDebug('✏️ Test de escritura...');
        // Aquí podrías hacer un test más específico si tienes un endpoint de prueba
        logDebug('⚠️ Test de escritura: Requiere endpoint específico');

        // Test de tablas
        logDebug('📋 Verificando estructura de tablas...');
        const tables = ['citas', 'usuarios', 'inventario_equipos', 'sedes'];
        for (const table of tables) {
            // Esto requeriría endpoints específicos para verificar tablas
            logDebug(`📋 Tabla ${table}: Requiere verificación manual`);
        }
        
    } catch (error) {
        logDebug(`❌ Error en test de base de datos: ${error.message}`);
    }
}

// Validación de integridad de datos
async function validateDataIntegrity() {
    logDebug('🔍 Iniciando validación de integridad...');
    
    try {
        const citas = await fetch('/api/citas').then(r => r.json());
        
        // Verificar campos requeridos
        let errores = 0;
        citas.forEach((cita, index) => {
            if (!cita.fecha_cita) {
                logDebug(`⚠️ Cita ${index + 1}: Falta fecha_cita`);
                errores++;
            }
            if (!cita.hora_cita) {
                logDebug(`⚠️ Cita ${index + 1}: Falta hora_cita`);
                errores++;
            }
            if (!cita.paciente_id) {
                logDebug(`⚠️ Cita ${index + 1}: Falta paciente_id`);
                errores++;
            }
        });
        
        if (errores === 0) {
            logDebug('✅ Integridad de datos: Sin errores detectados');
        } else {
            logDebug(`⚠️ Integridad de datos: ${errores} errores detectados`);
        }
        
    } catch (error) {
        logDebug(`❌ Error en validación: ${error.message}`);
    }
}

// Generar datos de prueba
async function generateTestData() {
    showDebugPanel();
    logDebug('🧪 Generando datos de prueba...');
    
    const testCita = {
        fecha_cita: new Date().toISOString().split('T')[0],
        hora_cita: '10:00',
        paciente_id: 1,
        odontologo_id: 1,
        tratamiento_id: 1,
        estado: 'programada',
        observaciones: 'Cita de prueba generada por debug'
    };
    
    try {
        const response = await fetch('/api/citas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testCita)
        });
        
        if (response.ok) {
            logDebug('✅ Datos de prueba creados exitosamente');
            dashboardAdmin.loadCitas(); // Recargar la tabla
        } else {
            logDebug(`❌ Error al crear datos de prueba: ${response.status}`);
        }
    } catch (error) {
        logDebug(`❌ Error al generar datos de prueba: ${error.message}`);
    }
}

// Función de debug principal actualizada
async function debugCitas() {
    showDebugPanel();
    logDebug('🔧 Iniciando diagnóstico general del sistema...');
    
    try {
        // 1. Test de conectividad API
        logDebug('📡 Verificando conectividad con API...');
        const apiTest = await fetch('/api/citas/test');
        if (apiTest.ok) {
            updateSystemStatus('apiStatus', 'Conectado', 'success');
            logDebug('✅ API Server: Conectado correctamente');
        } else {
            updateSystemStatus('apiStatus', 'Error', 'danger');
            logDebug('❌ API Server: Error de conexión');
        }

        // 2. Test de base de datos
        logDebug('🗄️ Verificando conexión a base de datos...');
        try {
            const dbTest = await fetch('/api/citas');
            if (dbTest.ok) {
                const citas = await dbTest.json();
                updateSystemStatus('dbStatus', 'Conectado', 'success');
                logDebug('✅ Base de datos: Conectada correctamente');
                
                // Estadísticas
                updateDebugStats('totalCitas', citas.length);
                const hoy = new Date().toISOString().split('T')[0];
                const citasHoy = citas.filter(cita => cita.fecha_cita && cita.fecha_cita.startsWith(hoy));
                updateDebugStats('citasHoy', citasHoy.length);
                updateDebugStats('lastUpdate', new Date().toLocaleTimeString());
                
                logDebug(`📊 Total de citas: ${citas.length}`);
                logDebug(`📅 Citas para hoy: ${citasHoy.length}`);
            } else {
                updateSystemStatus('dbStatus', 'Error', 'danger');
                logDebug('❌ Base de datos: Error de conexión');
            }
        } catch (error) {
            updateSystemStatus('dbStatus', 'Error', 'danger');
            logDebug(`❌ Error al conectar con base de datos: ${error.message}`);
        }

        // 3. Verificar auto-refresh
        const refreshInterval = dashboardAdmin.citasInterval;
        if (refreshInterval) {
            updateSystemStatus('refreshStatus', 'Activo', 'success');
            logDebug('✅ Auto-refresh: Activo');
        } else {
            updateSystemStatus('refreshStatus', 'Inactivo', 'warning');
            logDebug('⚠️ Auto-refresh: Inactivo');
        }

        // 4. Validación de datos
        logDebug('🔍 Validando integridad de datos...');
        await validateDataIntegrity();

        logDebug('✅ Diagnóstico completado');
        
    } catch (error) {
        logDebug(`❌ Error durante el diagnóstico: ${error.message}`);
        console.error('Error en debugCitas:', error);
    }
}

// Funciones auxiliares del panel de debug
function showDebugPanel() {
    document.getElementById('debugPanel').style.display = 'block';
}

function toggleDebugPanel() {
    const panel = document.getElementById('debugPanel');
    
    if (panel) {
        if (panel.style.display === 'none' || panel.style.display === '') {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }
}

// Añadir a la clase DashboardAdmin
Object.assign(DashboardAdmin.prototype, {
    // Método para abrir modal de perfil
    openProfileModal() {
        try {
            const modal = new bootstrap.Modal(document.getElementById('profileModal'));
            modal.show();
            
            // Utilizar el módulo de perfil para cargar datos
            if (window.adminProfileModule) {
                window.adminProfileModule.loadProfile();
            } else {
                console.error('Módulo de perfil no disponible');
                this.showAlert('danger', 'Error al cargar módulo de perfil');
            }
        } catch (error) {
            console.error('Error al abrir modal de perfil:', error);
            this.showAlert('danger', 'Error al cargar datos del perfil');
        }
    },
    
    // Método para guardar cambios en el perfil
    // Esta función se reemplaza por la implementación en admin-modules.js
    async saveProfile() {
        console.log('Esta función está en desuso. Usando adminProfileModule en su lugar.');
    }
});

function toggleDebugPanel() {
    const panel = document.getElementById('debugPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function logDebug(message) {
    const logElement = document.getElementById('debugLog');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.innerHTML = `<span class="text-muted">[${timestamp}]</span> ${message}`;
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
}

function clearDebugLog() {
    document.getElementById('debugLog').innerHTML = '';
    logDebug('🧹 Log de debug limpiado');
}

function updateSystemStatus(elementId, status, type) {
    const element = document.getElementById(elementId);
    element.textContent = status;
    element.className = `badge bg-${type}`;
}

function updateDebugStats(elementId, value) {
    document.getElementById(elementId).textContent = value;
}

// Función para verificar alertas de inventario
async function checkInventoryAlerts() {
    console.log('⚠️ Verificando alertas de inventario...');
    
    try {
        // Obtener headers de autenticación
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id;
        
        const res = await fetch('/api/inventario/alertas', {
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId || '1'
            }
        });
        
        if (!res.ok) {
            console.warn(`❌ Error al cargar alertas de inventario: ${res.status}`);
            return;
        }
        
        const alertas = await res.json();
        console.log(`✅ Alertas de inventario verificadas: ${alertas.length}`);
        
        // Mostrar alertas si hay elementos de inventario con stock bajo
        if (alertas.length > 0) {
            console.warn(`⚠️ ${alertas.length} elementos con stock bajo detectados`);
        }
        
        return alertas;
        
    } catch (error) {
        console.error('❌ Error verificando alertas de inventario:', error);
        return [];
    }
}

// Función para inicializar módulo de reportes
function initReportesModule() {
    console.log('📊 Inicializando módulo de reportes...');
    
    try {
        // Verificar si ya existe la función cargarReportesDetallados
        if (typeof cargarReportesDetallados === 'function') {
            console.log('✅ Función cargarReportesDetallados disponible');
        } else {
            console.warn('⚠️ Función cargarReportesDetallados no encontrada');
        }
        
        // Inicializar gráficos de reportes si existen
        const ingresoChart = document.getElementById('ingresoChart');
        const tratamientoChart = document.getElementById('tratamientoChart');
        
        if (ingresoChart) {
            console.log('📈 Gráfico de ingresos encontrado, inicializando...');
            // Aquí se puede inicializar el gráfico de ingresos si es necesario
        }
        
        if (tratamientoChart) {
            console.log('📈 Gráfico de tratamientos encontrado, inicializando...');
            // Aquí se puede inicializar el gráfico de tratamientos si es necesario
        }
        
        console.log('✅ Módulo de reportes inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando módulo de reportes:', error);
    }
}

// Funcionalidad de FAQs para Admin
async function loadFAQs() {
    try {
        console.log('🔄 Cargando FAQs...');
        
        const response = await this.authFetch('/api/faqs');
        const faqs = await response.json();
        
        if (response.ok) {
            console.log('✅ FAQs cargadas:', faqs.length);
            this.displayFAQs(faqs);
        } else {
            console.error('❌ Error al cargar FAQs:', faqs.msg);
            this.showEmptyFAQs();
        }
    } catch (error) {
        console.error('❌ Error en loadFAQs:', error);
        this.showEmptyFAQs();
    }
}

function displayFAQs(faqs) {
    const table = document.getElementById('faqsTable');
    if (!table) {
        console.error('❌ Tabla de FAQs no encontrada');
        return;
    }

    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.error('❌ Tbody de tabla FAQs no encontrado');
        return;
    }

    if (!faqs || faqs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <i class="bi bi-question-circle fs-1 text-muted d-block mb-3"></i>
                    <p class="text-muted">No hay FAQs registradas</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = faqs.map(faq => `
        <tr>
            <td>${faq.id}</td>
            <td>
                <div class="fw-bold">${faq.pregunta}</div>
                <small class="text-muted">${faq.respuesta.substring(0, 100)}...</small>
            </td>
            <td>
                <span class="badge bg-info">${faq.categoria}</span>
            </td>
            <td>
                <div class="btn-group-sm" role="group">
                    <button class="btn btn-outline-warning btn-sm" onclick="editarFAQ(${faq.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="eliminarFAQ(${faq.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    console.log(`✅ ${faqs.length} FAQs renderizadas en tabla`);
}

// Función para mostrar estado vacío de FAQs
function showEmptyFAQs() {
    const table = document.getElementById('faqsTable');
    if (table) {
        const tbody = table.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <i class="bi bi-exclamation-triangle fs-1 text-warning d-block mb-3"></i>
                        <h5 class="text-muted">Error al cargar FAQs</h5>
                        <button class="btn btn-primary" onclick="loadFAQs()">
                            <i class="bi bi-arrow-clockwise"></i> Reintentar
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

// Agregar métodos a la clase DashboardAdmin
DashboardAdmin.prototype.loadFAQs = loadFAQs;
DashboardAdmin.prototype.displayFAQs = displayFAQs;
DashboardAdmin.prototype.showEmptyFAQs = showEmptyFAQs;

// ==========================================
// FUNCIONES DE EVALUACIONES PARA ADMIN
// ==========================================

async function loadEvaluaciones() {
    console.log('⭐ [ADMIN] Cargando sistema de evaluaciones...');
    
    try {
        // Cargar estadísticas
        const statsResponse = await this.authFetch('/api/evaluaciones/estadisticas');
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            if (statsData.success) {
                this.displayEstadisticasEvaluaciones(statsData.estadisticas, statsData.por_odontologo);
            }
        }

        // Cargar todas las evaluaciones
        const evaluacionesResponse = await this.authFetch('/api/evaluaciones/admin/todas');
        if (evaluacionesResponse.ok) {
            const evaluacionesData = await evaluacionesResponse.json();
            if (evaluacionesData.success) {
                this.displayEvaluacionesAdmin(evaluacionesData.evaluaciones);
            }
        }
        
    } catch (error) {
        console.error('❌ Error cargando evaluaciones:', error);
        this.showEmptyEvaluaciones();
    }
}

function displayEstadisticasEvaluaciones(estadisticas, porOdontologo) {
    // Actualizar cards de estadísticas
    document.getElementById('totalEvaluaciones').textContent = estadisticas.total_evaluaciones || 0;
    document.getElementById('promedioServicio').textContent = parseFloat(estadisticas.promedio_servicio || 0).toFixed(1);
    document.getElementById('promedioOdontologo').textContent = parseFloat(estadisticas.promedio_odontologo || 0).toFixed(1);
    
    const recomendaciones = estadisticas.recomendaciones || 0;
    const total = estadisticas.total_evaluaciones || 1;
    const porcentaje = Math.round((recomendaciones / total) * 100);
    document.getElementById('porcentajeRecomendacion').textContent = `${porcentaje}%`;
}

function displayEvaluacionesAdmin(evaluaciones) {
    const table = document.getElementById('evaluacionesTable');
    if (!table) {
        console.error('❌ Tabla de evaluaciones no encontrada');
        return;
    }

    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.error('❌ Tbody de tabla evaluaciones no encontrado');
        return;
    }

    if (!evaluaciones || evaluaciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="bi bi-star display-4 text-muted"></i>
                    <h5 class="text-muted mt-3">No hay evaluaciones registradas</h5>
                    <p class="text-muted">Las evaluaciones aparecerán aquí cuando los pacientes evalúen la atención.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = evaluaciones.map(evaluacion => {
        const fechaEvaluacion = new Date(evaluacion.fecha_evaluacion).toLocaleDateString();
        const estrellasServicio = generarEstrellasHtml(evaluacion.calificacion_servicio || 0);
        const estrellasOdontologo = generarEstrellasHtml(evaluacion.calificacion_odontologo || 0);
        
        return `
            <tr>
                <td>${evaluacion.id || 'N/A'}</td>
                <td>${evaluacion.paciente_nombre || 'N/A'}</td>
                <td>${evaluacion.odontologo_nombre || 'N/A'}</td>
                <td>
                    <div class="mb-1">
                        <small class="text-muted">Servicio:</small>
                        <div class="d-flex align-items-center">
                            ${estrellasServicio}
                            <span class="ms-2 badge bg-primary">${evaluacion.calificacion_servicio || 0}/5</span>
                        </div>
                    </div>
                    <div>
                        <small class="text-muted">Odontólogo:</small>
                        <div class="d-flex align-items-center">
                            ${estrellasOdontologo}
                            <span class="ms-2 badge bg-info">${evaluacion.calificacion_odontologo || 0}/5</span>
                        </div>
                    </div>
                </td>
                <td>
                    ${evaluacion.recomendaria ? 
                        '<span class="badge bg-success">Sí</span>' : 
                        '<span class="badge bg-secondary">No</span>'
                    }
                </td>
                <td>
                    <div class="mb-1">
                        <small class="text-muted">${fechaEvaluacion}</small>
                    </div>
                    ${evaluacion.comentarios ? `
                        <div class="btn-group-sm">
                            <button class="btn btn-outline-info btn-sm" title="${evaluacion.comentarios}">
                                <i class="bi bi-chat-quote"></i>
                            </button>
                        </div>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');

    console.log(`✅ ${evaluaciones.length} evaluaciones renderizadas en tabla`);
}

function generarEstrellasHtml(calificacion) {
    let estrellas = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= calificacion) {
            estrellas += '<i class="bi bi-star-fill text-warning"></i>';
        } else {
            estrellas += '<i class="bi bi-star text-muted"></i>';
        }
    }
    return estrellas;
}

function showEmptyEvaluaciones() {
    const table = document.getElementById('evaluacionesTable');
    if (table) {
        const tbody = table.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="bi bi-exclamation-triangle fs-1 text-warning d-block mb-3"></i>
                        <h5 class="text-muted">Error al cargar evaluaciones</h5>
                        <button class="btn btn-primary" onclick="dashboardAdmin.loadEvaluaciones()">
                            <i class="bi bi-arrow-clockwise"></i> Reintentar
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

// Agregar métodos de evaluaciones a la clase DashboardAdmin
DashboardAdmin.prototype.loadEvaluaciones = loadEvaluaciones;
DashboardAdmin.prototype.displayEstadisticasEvaluaciones = displayEstadisticasEvaluaciones;
DashboardAdmin.prototype.displayEvaluacionesAdmin = displayEvaluacionesAdmin;
DashboardAdmin.prototype.generarEstrellasHtml = generarEstrellasHtml;
DashboardAdmin.prototype.showEmptyEvaluaciones = showEmptyEvaluaciones;
