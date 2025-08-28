// Dashboard Paciente JavaScript
class DashboardPaciente {
    constructor() {
        this.currentSection = 'dashboard';
        this.citas = [];
        this.historial = [];
        this.perfil = {};
        this.charts = {};
        this.notificaciones = [];
        this.init();
    }

    // ==========================================
    // SISTEMA DE AUTENTICACIÓN UNIFICADO
    // ==========================================
    
    getUserId() {
        return localStorage.getItem('userId') || localStorage.getItem('user')?.id;
    }

    getAuthHeaders() {
        const userId = this.getUserId();
        if (!userId) {
            console.error('❌ No se encontró userId para autenticación');
            this.redirectToLogin();
            return {};
        }
        return {
            'user-id': userId
        };
    }

    async authFetch(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            
            if (response.status === 401 || response.status === 403) {
                console.error('❌ Error de autenticación, redirigiendo al login');
                this.redirectToLogin();
                return null;
            }
            
            return response;
        } catch (error) {
            console.error('❌ Error en petición autenticada:', error);
            throw error;
        }
    }

    init() {
        this.setupEventListeners();
        this.loadUserInfo();
        this.loadDashboardData();
        this.loadNotifications();
        this.initializeCharts();
        this.setMinDate();
        this.setupSecurityMeasures();
        this.configurarEvaluacionForm();
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
        
        if (!userId || userRole !== 'paciente') {
            console.log('❌ Usuario no autenticado o rol incorrecto');
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        // Limpiar cualquier dato de sesión
        localStorage.clear();
        sessionStorage.clear();
        
        // Reemplazar la entrada actual del historial para prevenir regreso
        window.location.replace('/index.html?session=expired');
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

        // Notifications
        document.getElementById('markAllReadBtn').addEventListener('click', () => {
            this.markAllNotificationsRead();
        });
    }

    setupModalEvents() {
        // Agendar cita buttons
        document.getElementById('agendarCitaBtn').addEventListener('click', () => {
            this.openCitaModal();
        });

        document.getElementById('nuevaCitaBtn').addEventListener('click', () => {
            this.openCitaModal();
        });

        // Save cita button
        document.getElementById('guardarCitaBtn').addEventListener('click', () => {
            this.guardarCita();
        });

        // Reprogramar cita button
        document.getElementById('confirmarReprogramarBtn').addEventListener('click', () => {
            this.confirmarReprogramar();
        });

        // Cambio de contraseña
        this.setupPasswordChangeEvents();
    }

    setupFormEvents() {
        // Estado filter for citas
        const estadoFiltro = document.getElementById('estadoFiltro');
        if (estadoFiltro) {
            estadoFiltro.addEventListener('change', () => {
                this.filterCitas();
            });
        }

        // Profile editing
        document.getElementById('editarPerfilBtn').addEventListener('click', () => {
            this.togglePerfilEdit(true);
        });

        document.getElementById('guardarPerfilBtn').addEventListener('click', () => {
            this.guardarPerfil();
        });

        document.getElementById('cancelarPerfilBtn').addEventListener('click', () => {
            this.togglePerfilEdit(false);
            this.loadPerfil(); // Reload original data
        });
        
        // Formularios de pagos
        const metodoPagoForm = document.getElementById('metodoPagoForm');
        if (metodoPagoForm) {
            metodoPagoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.crearMetodoPago(new FormData(metodoPagoForm));
            });
        }

        const procesarPagoForm = document.getElementById('procesarPagoForm');
        if (procesarPagoForm) {
            procesarPagoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.procesarPago(new FormData(procesarPagoForm));
            });
        }
    }

    setMinDate() {
        // Set minimum date for appointments to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];
        
        const fechaInput = document.getElementById('citaFecha');
        if (fechaInput) {
            fechaInput.min = minDate;
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
            dashboard: 'Dashboard',
            citas: 'Mis Citas',
            historial: 'Mi Historial',
            perfil: 'Mi Perfil'
        };
        return titles[section] || 'Dashboard';
    }

    async loadUserInfo() {
        try {
            // Obtener datos del usuario desde localStorage
            const userData = localStorage.getItem('user');
            if (!userData) {
                window.location.href = '/index.html';
                return;
            }
            
            const userInfo = JSON.parse(userData);
            const nombreCompleto = `${userInfo.nombre || ''} ${userInfo.apellido || ''}`.trim();
            document.getElementById('userName').textContent = nombreCompleto || 'Usuario';
            
            // Cargar información adicional del perfil
            this.perfil = userInfo;
            this.updatePerfilForm();
        } catch (error) {
            console.error('Error loading user info:', error);
            window.location.href = '/index.html';
        }
    }

    updatePerfilForm() {
        if (this.perfil) {
            // Actualizar elementos del perfil
            const perfilNombre = document.getElementById('perfilNombre');
            const perfilEmail = document.getElementById('perfilEmail');
            const perfilFormNombre = document.getElementById('perfilFormNombre');
            const perfilFormApellido = document.getElementById('perfilFormApellido');
            const perfilFormEmail = document.getElementById('perfilFormEmail');
            
            if (perfilNombre) {
                perfilNombre.textContent = `${this.perfil.nombre || ''} ${this.perfil.apellido || ''}`.trim();
            }
            if (perfilFormNombre) {
                perfilFormNombre.value = this.perfil.nombre || '';
            }
            if (perfilFormApellido) {
                perfilFormApellido.value = this.perfil.apellido || '';
            }
            // Nota: el email no está en los datos actuales del login, se puede agregar después
        }
    }

    async loadDashboardData() {
        console.log('📊 Cargando datos del dashboard...');
        try {
            // Obtener datos del usuario desde localStorage
            const userData = localStorage.getItem('user');
            if (!userData) {
                console.error('❌ No hay datos de usuario');
                return;
            }
            
            const userInfo = JSON.parse(userData);
            const userId = userInfo.id;
            console.log(`👤 Cargando dashboard para usuario ID: ${userId}`);
            
            // Cargar citas para calcular estadísticas
            await this.loadCitas();
            
            // Calcular y mostrar estadísticas basadas en citas reales
            this.calculateDashboardStats();
            
            // Cargar próximas citas para el timeline
            this.loadProximasCitas();
            
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            // Mostrar datos por defecto en caso de error
            this.loadDefaultDashboardData();
        }
    }

    calculateDashboardStats() {
        if (!this.citas || this.citas.length === 0) {
            this.loadDefaultDashboardData();
            return;
        }

        const ahora = new Date();
        
        // Filtrar citas futuras y pasadas
        const citasFuturas = this.citas.filter(cita => {
            const fechaStr = cita.fecha.split('T')[0];
            const fechaCita = new Date(`${fechaStr} ${cita.hora}`);
            return fechaCita > ahora && cita.estado !== 'cancelada';
        });
        
        const citasPasadas = this.citas.filter(cita => {
            const fechaStr = cita.fecha.split('T')[0];
            const fechaCita = new Date(`${fechaStr} ${cita.hora}`);
            return fechaCita <= ahora && cita.estado !== 'cancelada';
        });

        // Próxima cita
        if (citasFuturas.length > 0) {
            // Ordenar por fecha y hora más próxima
            citasFuturas.sort((a, b) => {
                const fechaA = new Date(`${a.fecha.split('T')[0]} ${a.hora}`);
                const fechaB = new Date(`${b.fecha.split('T')[0]} ${b.hora}`);
                return fechaA - fechaB;
            });
            
            const proximaCita = citasFuturas[0];
            const fechaCita = new Date(proximaCita.fecha);
            const fechaFormateada = fechaCita.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const horaFormateada = proximaCita.hora.substring(0, 5); // HH:MM
            
            document.getElementById('proximaCita').textContent = `${fechaFormateada} ${horaFormateada}`;
            
            // Mi Odontólogo (del próximo cita)
            const odontologoNombre = proximaCita.odontologo_nombre && proximaCita.odontologo_apellido 
                ? `Dr. ${proximaCita.odontologo_nombre} ${proximaCita.odontologo_apellido}`
                : 'Dr. Asignado';
            document.getElementById('miOdontologo').textContent = odontologoNombre;
        } else {
            document.getElementById('proximaCita').textContent = 'Sin citas programadas';
            document.getElementById('miOdontologo').textContent = 'N/A';
        }

        // Última visita
        if (citasPasadas.length > 0) {
            // Ordenar por fecha más reciente
            citasPasadas.sort((a, b) => {
                const fechaA = new Date(`${a.fecha.split('T')[0]} ${a.hora}`);
                const fechaB = new Date(`${b.fecha.split('T')[0]} ${b.hora}`);
                return fechaB - fechaA;
            });
            
            const ultimaCita = citasPasadas[0];
            const fechaUltima = new Date(ultimaCita.fecha);
            const ultimaVisitaFormateada = fechaUltima.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
            document.getElementById('ultimaVisita').textContent = ultimaVisitaFormateada;
        } else {
            document.getElementById('ultimaVisita').textContent = 'Primera visita';
        }
    }

    loadDefaultDashboardData() {
        // Datos por defecto cuando no hay citas o hay error
        document.getElementById('proximaCita').textContent = 'Sin citas programadas';
        document.getElementById('ultimaVisita').textContent = 'Primera visita';
        document.getElementById('miOdontologo').textContent = 'Sin asignar';
    }

    loadProximasCitas() {
        console.log('📅 Cargando próximas citas para el timeline...');
        
        if (!this.citas || this.citas.length === 0) {
            document.getElementById('proximasCitas').innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="bi bi-calendar-x" style="font-size: 2rem;"></i>
                    <p class="mt-2">No hay citas programadas</p>
                </div>
            `;
            return;
        }

        const ahora = new Date();
        
        // Filtrar solo citas futuras no canceladas
        const citasFuturas = this.citas.filter(cita => {
            const fechaStr = cita.fecha.split('T')[0];
            const fechaCita = new Date(`${fechaStr} ${cita.hora}`);
            return fechaCita > ahora && cita.estado !== 'cancelada';
        });

        // Ordenar por fecha y hora más próxima
        citasFuturas.sort((a, b) => {
            const fechaA = new Date(`${a.fecha.split('T')[0]} ${a.hora}`);
            const fechaB = new Date(`${b.fecha.split('T')[0]} ${b.hora}`);
            return fechaA - fechaB;
        });

        // Tomar solo las próximas 3 citas
        const proximasTres = citasFuturas.slice(0, 3);

        if (proximasTres.length === 0) {
            document.getElementById('proximasCitas').innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="bi bi-calendar-check" style="font-size: 2rem;"></i>
                    <p class="mt-2">No hay próximas citas</p>
                </div>
            `;
            return;
        }

        const container = document.getElementById('proximasCitas');
        container.innerHTML = proximasTres.map(cita => {
            const fechaCita = new Date(cita.fecha);
            const fechaFormateada = fechaCita.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const horaFormateada = cita.hora.substring(0, 5); // HH:MM
            const odontologoNombre = cita.odontologo_nombre && cita.odontologo_apellido 
                ? `Dr. ${cita.odontologo_nombre} ${cita.odontologo_apellido}`
                : 'Dr. Asignado';
            const motivoCapitalizado = cita.motivo ? cita.motivo.charAt(0).toUpperCase() + cita.motivo.slice(1) : 'Consulta';

            return `
                <div class="timeline-item">
                    <div class="timeline-time">${horaFormateada}</div>
                    <div class="timeline-content">
                        <div class="timeline-title">${fechaFormateada} - ${motivoCapitalizado}</div>
                        <div class="timeline-description">${odontologoNombre}</div>
                        <span class="badge ${this.getEstadoBadgeClass(cita.estado)} mt-2">${cita.estado}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    initializeCharts() {
        console.log('📊 Inicializando gráficos con datos reales...');
        
        // Chart for treatment progress
    }

    calculateTreatmentStats() {
        if (!this.citas || this.citas.length === 0) {
            return { completadas: 0, programadas: 0, canceladas: 0 };
        }

        const ahora = new Date();
        let completadas = 0;
        let programadas = 0;
        let canceladas = 0;

        this.citas.forEach(cita => {
            const fechaStr = cita.fecha.split('T')[0];
            const fechaCita = new Date(`${fechaStr} ${cita.hora}`);
            
            if (cita.estado === 'cancelada') {
                canceladas++;
            } else if (fechaCita <= ahora) {
                completadas++; // Citas pasadas se consideran completadas
            } else {
                programadas++; // Citas futuras
            }
        });

        return { completadas, programadas, canceladas };
    }

    async loadSectionData(sectionName) {
        if (sectionName === 'citas') {
            await this.loadCitas();
        }
        if (sectionName === 'historial') {
            await this.loadHistorial();
        }
        if (sectionName === 'perfil') {
            await this.loadPerfil();
        }
        if (sectionName === 'evaluaciones') {
            await this.loadEvaluaciones();
        }
        if (sectionName === 'pagos') {
            await this.loadPagos();
        }
        // Actualizar dashboard cuando se cargan las citas
        if (sectionName === 'citas' || sectionName === 'dashboard') {
            this.calculateDashboardStats();
            this.loadProximasCitas();
            this.loadNotifications(); // Recargar notificaciones cuando cambian las citas
            this.initializeCharts();
        }
    }

    async loadCitas() {
        console.log('📅 Cargando citas del paciente...');
        try {
            const userId = this.getUserId();
            if (!userId) {
                console.error('❌ No hay datos de usuario');
                this.showAlert('No hay datos de usuario. Por favor, inicie sesión nuevamente.', 'warning');
                return;
            }
            
            console.log(`👤 Cargando citas para usuario ID: ${userId}`);
            
            const res = await this.authFetch(`/api/citas/${userId}`);
            console.log('📡 Respuesta del servidor:', res.status, res.statusText);
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const citas = await res.json();
            console.log('📋 Citas recibidas:', citas);
            
            this.citas = citas;
            this.renderCitasTable();
            
            // Actualizar contador de citas
            const citasCount = document.getElementById('citasCount');
            if (citasCount) {
                citasCount.textContent = citas.length;
            }
            
        } catch (err) {
            console.error('❌ Error al cargar citas:', err);
            this.showAlert('Error al cargar las citas. Inténtelo nuevamente.', 'danger');
            
            // Mostrar mensaje de error en la UI
            const tbody = document.querySelector('#citasTable tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Error al cargar las citas</td></tr>';
            }
        }
    }

    renderCitasTable() {
        const tbody = document.querySelector('#citasTable tbody');
        if (!tbody) return;
        
        if (!this.citas || this.citas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No tienes citas programadas</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        this.citas.forEach(cita => {
            const fecha = new Date(cita.fecha).toLocaleDateString('es-ES');
            const hora = cita.hora || 'N/A';
            const motivo = cita.motivo || 'Consulta general';
            const estado = cita.estado || 'programada';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fecha}</td>
                <td>${hora}</td>
                <td>Dr. Pendiente</td>
                <td>${motivo}</td>
                <td><span class="badge bg-${this.getEstadoBadgeClass(estado)}">${estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="dashboardPaciente.verDetalleCita(${cita.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="dashboardPaciente.reprogramarCita(${cita.id})" title="Reprogramar">
                        <i class="bi bi-calendar-event"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="dashboardPaciente.cancelarCita(${cita.id})" title="Cancelar">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    openCitaModal(id = null) {
        // Aquí deberías mostrar el modal para crear/editar cita
        alert('Funcionalidad de crear/editar cita pendiente de modal/formulario.');
    }

    async deleteCita(id) {
        if (!confirm('¿Seguro que deseas eliminar esta cita?')) return;
        try {
            await this.authFetch(`/api/citas/${id}`, { 
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            await this.loadCitas();
        } catch (err) {
            alert('Error al eliminar cita');
        }
    }

    async loadHistorial() {
        try {
            const userId = this.getUserId();
            if (!userId) {
                console.log('❌ No hay usuario logueado');
                return;
            }
            
            console.log('📋 Cargando historial para paciente ID:', userId);
            const res = await this.authFetch(`/api/historial/paciente/${userId}`);
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            
            const historial = await res.json();
            console.log('✅ Historial cargado:', historial.length, 'registros');
            this.historial = historial;
            this.renderHistorialTable();
        } catch (err) {
            console.error('❌ Error al cargar historial:', err);
            this.historial = [];
            this.renderHistorialTable();
        }
    }

    renderHistorialTable() {
        const tbody = document.querySelector('#historialTable tbody');
        if (!tbody) {
            console.log('❌ No se encontró la tabla de historial');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!this.historial || this.historial.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay historiales registrados</td></tr>';
            return;
        }
        
        this.historial.forEach(h => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${h.fecha ? new Date(h.fecha).toLocaleDateString('es-ES') : 'N/A'}</td>
                <td>${h.diagnostico || 'N/A'}</td>
                <td>${h.tratamiento_resumido || 'N/A'}</td>
                <td>
                    <span class="badge ${this.getEstadoBadgeClass(h.estado || 'en_proceso')}">
                        ${this.formatEstado(h.estado || 'en_proceso')}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="dashboardPaciente.verDetalleHistorial(${h.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    openHistorialModal(id = null) {
        // Aquí deberías mostrar el modal para crear/editar historial
        alert('Funcionalidad de crear/editar historial pendiente de modal/formulario.');
    }

    verDetalleHistorial(id) {
        const historial = this.historial.find(h => h.id === id);
        if (!historial) {
            alert('Historial no encontrado');
            return;
        }

        const modalHtml = `
            <div class="modal fade" id="modalDetalleHistorial" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalle del Historial Clínico</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Fecha:</label>
                                    <p>${historial.fecha ? new Date(historial.fecha).toLocaleDateString('es-ES') : 'N/A'}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Estado:</label>
                                    <p>
                                        <span class="badge ${this.getEstadoBadgeClass(historial.estado)}">
                                            ${this.formatEstado(historial.estado)}
                                        </span>
                                    </p>
                                </div>
                                <div class="col-12">
                                    <label class="form-label fw-bold">Diagnóstico:</label>
                                    <p class="border p-3 rounded">${historial.diagnostico || 'N/A'}</p>
                                </div>
                                <div class="col-12">
                                    <label class="form-label fw-bold">Tratamiento Realizado:</label>
                                    <p class="border p-3 rounded">${historial.tratamiento_resumido || 'N/A'}</p>
                                </div>
                                ${historial.archivo_adjuntos ? `
                                <div class="col-12">
                                    <label class="form-label fw-bold">Observaciones:</label>
                                    <p class="border p-3 rounded">${historial.archivo_adjuntos}</p>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const existingModal = document.getElementById('modalDetalleHistorial');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetalleHistorial'));
        modal.show();

        // Limpiar modal cuando se cierre
        document.getElementById('modalDetalleHistorial').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    getEstadoBadgeClass(estado) {
        switch(estado) {
            case 'en_proceso': return 'bg-warning text-dark';
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
            default: return estado?.charAt(0).toUpperCase() + estado?.slice(1) || 'N/A';
        }
    }

    async deleteHistorial(id) {
        if (!confirm('¿Seguro que deseas eliminar este historial?')) return;
        try {
            await this.authFetch(`/api/historial/${id}`, { 
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            await this.loadHistorial();
        } catch (err) {
            alert('Error al eliminar historial');
        }
    }

    async loadPerfil() {
        console.log('👤 Cargando perfil del usuario...');
        try {
            const userId = this.getUserId();
            if (!userId) {
                console.error('❌ No hay datos de usuario');
                this.showAlert('No hay datos de usuario. Por favor, inicie sesión nuevamente.', 'warning');
                return;
            }
            
            console.log(`👤 Cargando perfil para usuario ID: ${userId}`);
            
            // Hacer petición al backend para obtener datos completos del usuario
            const res = await this.authFetch(`/api/usuarios/${userId}/perfil`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const usuario = await res.json();
            console.log('📋 Datos del perfil recibidos:', usuario);
            
            this.perfil = usuario;
            this.renderPerfil(this.perfil);
            
        } catch (error) {
            console.error('❌ Error loading perfil:', error);
            // Usar datos del localStorage como fallback
            const userData = localStorage.getItem('user');
            if (userData) {
                const userInfo = JSON.parse(userData);
                this.perfil = {
                    id: userInfo.id,
                    nombre: userInfo.nombre || '',
                    apellido: userInfo.apellido || '',
                    correo: userInfo.correo || '',
                    telefono: userInfo.telefono || '',
                    direccion: userInfo.direccion || ''
                };
                this.renderPerfil(this.perfil);
            }
            this.showAlert('❌ Error al cargar el perfil. Se muestran datos básicos.', 'warning');
        }
    }

    renderPerfil(perfil) {
        console.log('🎨 Renderizando perfil:', perfil);
        
        // Update profile display
        document.getElementById('perfilNombre').textContent = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim();
        document.getElementById('perfilEmail').textContent = perfil.correo || 'Sin correo';
        document.getElementById('perfilTelefono').textContent = perfil.telefono || 'Sin teléfono';

        // Update form fields
        document.getElementById('perfilFormNombre').value = perfil.nombre || '';
        document.getElementById('perfilFormApellido').value = perfil.apellido || '';
        document.getElementById('perfilFormEmail').value = perfil.correo || '';
        document.getElementById('perfilFormTelefono').value = perfil.telefono || '';
        document.getElementById('perfilFormDireccion').value = perfil.direccion || '';
    }

    togglePerfilEdit(isEditing) {
        const formFields = ['perfilFormNombre', 'perfilFormApellido', 'perfilFormEmail', 'perfilFormTelefono', 'perfilFormDireccion'];
        const editButtons = document.getElementById('perfilEditButtons');
        const editBtn = document.getElementById('editarPerfilBtn');

        formFields.forEach(fieldId => {
            document.getElementById(fieldId).readOnly = !isEditing;
        });

        if (isEditing) {
            editButtons.classList.remove('d-none');
            editBtn.style.display = 'none';
        } else {
            editButtons.classList.add('d-none');
            editBtn.style.display = 'inline-block';
        }
    }

    getEstadoBadgeClass(estado) {
        const classes = {
            'confirmada': 'bg-success',
            'programada': 'bg-warning',
            'completada': 'bg-info',
            'cancelada': 'bg-danger'
        };
        return classes[estado] || 'bg-secondary';
    }

    async openCitaModal() {
        const modal = new bootstrap.Modal(document.getElementById('citaModal'));
        document.getElementById('citaForm').reset();
        
        // Set minimum date
        this.setMinDate();
        
        // Cargar odontólogos disponibles
        await this.loadOdontologosDisponibles();
        
        modal.show();
    }

    async loadOdontologosDisponibles() {
        try {
            console.log('👨‍⚕️ Cargando odontólogos disponibles...');
            const response = await this.authFetch('/api/usuarios?rol=odontologo');
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const odontologos = await response.json();
            console.log('👨‍⚕️ Odontólogos encontrados:', odontologos);
            
            // Actualizar el select de odontólogos en el modal
            const selectOdontologo = document.getElementById('citaOdontologo');
            if (selectOdontologo) {
                selectOdontologo.innerHTML = '<option value="">Seleccione un odontólogo...</option>';
                
                odontologos.forEach(odontologo => {
                    const option = document.createElement('option');
                    option.value = odontologo.id;
                    option.textContent = `Dr. ${odontologo.nombre} ${odontologo.apellido}`;
                    selectOdontologo.appendChild(option);
                });
            }
            
        } catch (error) {
            console.error('❌ Error al cargar odontólogos:', error);
            this.showAlert('Error al cargar la lista de odontólogos', 'warning');
        }
    }

    async guardarCita() {
        console.log('🏥 Iniciando proceso de agendar cita...');
        const form = document.getElementById('citaForm');
        const submitBtn = document.getElementById('guardarCitaBtn');
        
        // Validate form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            this.showAlert('Por favor, complete todos los campos requeridos.', 'warning');
            return;
        }
        
        // Deshabilitar botón durante el proceso
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Agendando...';
        submitBtn.disabled = true;
        
        try {
            const userId = this.getUserId();
            if (!userId) {
                throw new Error('No hay datos de usuario. Por favor, inicie sesión nuevamente.');
            }
            
            console.log('👤 Usuario logueado ID:', userId);
            
            const formData = {
                paciente_id: userId,
                odontologo_id: document.getElementById('citaOdontologo').value,
                fecha: document.getElementById('citaFecha').value,
                hora: document.getElementById('citaHora').value,
                motivo: document.getElementById('citaTratamiento').value,
                notas: document.getElementById('citaObservaciones').value,
                estado: 'programada'
            };
            
            console.log('📋 Datos de la cita a enviar:', formData);
            
            const response = await this.authFetch('/api/citas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });
            
            console.log('📡 Respuesta del servidor:', response.status, response.statusText);
            const result = await response.json();
            console.log('📄 Resultado:', result);
            
            if (response.ok) {
                // Show success message
                this.showAlert('✅ Cita agendada exitosamente. Recibirá una confirmación por email.', 'success');
                
                // Close modal and refresh list
                const modal = bootstrap.Modal.getInstance(document.getElementById('citaModal'));
                if (modal) {
                    modal.hide();
                }
                
                // Reset form
                form.reset();
                form.classList.remove('was-validated');
                
                // Refresh citas list
                console.log('🔄 Recargando lista de citas...');
                await this.loadCitas();
            } else {
                throw new Error(result.msg || 'Error al agendar la cita');
            }
            
        } catch (error) {
            console.error('❌ Error agendando cita:', error);
            this.showAlert(`❌ ${error.message || 'Error al agendar la cita. Inténtelo nuevamente.'}`, 'danger');
        } finally {
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showAlert(message, type) {
        console.log(`Alert: ${type} - ${message}`);
        
        // Remover alertas anteriores
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Crear elemento de alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        alertDiv.innerHTML = `
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Agregar al body
        document.body.appendChild(alertDiv);
        
        // Auto-hide después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    async guardarPerfil() {
        console.log('💾 Guardando perfil...');
        
        const formData = {
            nombre: document.getElementById('perfilFormNombre').value.trim(),
            apellido: document.getElementById('perfilFormApellido').value.trim(),
            correo: document.getElementById('perfilFormEmail').value.trim(),
            telefono: document.getElementById('perfilFormTelefono').value.trim(),
            direccion: document.getElementById('perfilFormDireccion').value.trim()
        };
        
        // Validar datos requeridos
        if (!formData.nombre || !formData.apellido || !formData.correo) {
            this.showAlert('❌ Nombre, apellido y correo electrónico son requeridos.', 'danger');
            return;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.correo)) {
            this.showAlert('❌ Por favor, ingrese un correo electrónico válido.', 'danger');
            return;
        }
        
        try {
            const userId = this.perfil.id;
            console.log('📡 Enviando actualización de perfil:', formData);
            
            // Preparar datos para el endpoint correcto
            const updateData = {
                nombre: formData.nombre,
                email: formData.correo,
                telefono: formData.telefono,
                direccion: formData.direccion,
                userId: userId
            };
            
            const response = await this.authFetch(`/api/auth/actualizar-perfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(updateData)
            });
            
            const result = await response.json();
            console.log('📄 Respuesta del servidor:', result);
            
            if (response.ok) {
                // Actualizar datos locales con la respuesta del servidor
                if (result.user) {
                    this.perfil = { ...this.perfil, ...result.user };
                    
                    // Actualizar localStorage con los nuevos datos
                    const userData = localStorage.getItem('user');
                    if (userData) {
                        const userInfo = JSON.parse(userData);
                        const updatedUserInfo = { ...userInfo, ...result.user };
                        localStorage.setItem('user', JSON.stringify(updatedUserInfo));
                    }
                }
                
                // Salir del modo edición
                this.togglePerfilEdit(false);
                
                // Actualizar la visualización
                this.renderPerfil(this.perfil);
                
                this.showAlert('✅ Perfil actualizado exitosamente.', 'success');
                
            } else {
                throw new Error(result.msg || 'Error al actualizar el perfil');
            }
            
        } catch (error) {
            console.error('❌ Error al guardar perfil:', error);
            this.showAlert(`❌ ${error.message || 'Error al actualizar el perfil. Inténtelo nuevamente.'}`, 'danger');
        }
    }

    reprogramarCita(citaId) {
        const cita = this.citas.find(c => c.id === citaId);
        if (!cita) {
            this.showAlert('Cita no encontrada.', 'danger');
            return;
        }

        // Verificar que la cita no esté cancelada
        if (cita.estado === 'cancelada') {
            this.showAlert('No se puede reprogramar una cita cancelada.', 'warning');
            return;
        }

        // Verificar restricción de 24 horas
        const fechaActual = new Date();
        const fechaCita = new Date(`${cita.fecha} ${cita.hora}`);
        const diffHoras = (fechaCita - fechaActual) / (1000 * 60 * 60);
        
        if (diffHoras < 24) {
            this.showAlert('No se puede reprogramar la cita con menos de 24 horas de anticipación.', 'warning');
            return;
        }

        // Llenar los datos de la cita actual en el modal
        document.getElementById('reprogramarCitaId').value = citaId;
        document.getElementById('citaActualFecha').textContent = new Date(cita.fecha).toLocaleDateString('es-ES');
        document.getElementById('citaActualHora').textContent = cita.hora;
        document.getElementById('citaActualMotivo').textContent = cita.motivo || 'No especificado';

        // Configurar fecha mínima (mañana)
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        document.getElementById('nuevaFecha').min = manana.toISOString().split('T')[0];

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('reprogramarModal'));
        modal.show();
    }

    async confirmarReprogramar() {
        console.log('🔄 Confirmando reprogramación...');
        const form = document.getElementById('reprogramarForm');
        const submitBtn = document.getElementById('confirmarReprogramarBtn');
        
        // Validar formulario
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            this.showAlert('Por favor, complete los campos requeridos.', 'warning');
            return;
        }

        // Deshabilitar botón durante el proceso
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Reprogramando...';
        submitBtn.disabled = true;

        try {
            const citaId = document.getElementById('reprogramarCitaId').value;
            const formData = {
                fecha: document.getElementById('nuevaFecha').value,
                hora: document.getElementById('nuevaHora').value,
                motivo: document.getElementById('nuevoMotivo').value || undefined,
                notas: document.getElementById('nuevasNotas').value || undefined
            };

            console.log('📋 Datos de reprogramación:', formData);

            const response = await this.authFetch(`/api/citas/${citaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });

            console.log('📡 Respuesta del servidor:', response.status, response.statusText);
            const result = await response.json();
            console.log('📄 Resultado:', result);

            if (response.ok) {
                this.showAlert('✅ Cita reprogramada exitosamente.', 'success');
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('reprogramarModal'));
                if (modal) {
                    modal.hide();
                }
                
                // Limpiar formulario
                form.reset();
                form.classList.remove('was-validated');
                
                // Recargar lista de citas
                await this.loadCitas();
            } else {
                throw new Error(result.msg || 'Error al reprogramar la cita');
            }

        } catch (error) {
            console.error('❌ Error reprogramando cita:', error);
            this.showAlert(`❌ ${error.message || 'Error al reprogramar la cita. Inténtelo nuevamente.'}`, 'danger');
        } finally {
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async cancelarCita(citaId) {
        const cita = this.citas.find(c => c.id === citaId);
        if (!cita) {
            this.showAlert('Cita no encontrada.', 'danger');
            return;
        }

        // Verificar restricciones de tiempo
        const fechaActual = new Date();
        // Extraer solo la parte de fecha (sin zona horaria) y combinar con hora
        const fechaStr = cita.fecha.split('T')[0]; // Solo YYYY-MM-DD
        const fechaCita = new Date(`${fechaStr} ${cita.hora}`);
        const diffHoras = (fechaCita - fechaActual) / (1000 * 60 * 60);
        
        console.log(`⏰ Diferencia de horas: ${diffHoras.toFixed(1)}`);

        let accion = 'cancelar';
        let mensaje = '';
        let endpoint = `/api/citas/${citaId}`;
        let method = 'DELETE';

        if (diffHoras >= 4) {
            // Más de 4 horas: ofrecer eliminar o cancelar
            const confirmacion = confirm(
                `¿Qué desea hacer con la cita del ${new Date(cita.fecha).toLocaleDateString('es-ES')} a las ${cita.hora}?\n\n` +
                `Opciones:\n` +
                `• OK = Eliminar completamente la cita\n` +
                `• Cancelar = Solo cambiar estado a cancelada\n\n` +
                `Nota: Faltan ${diffHoras.toFixed(1)} horas para la cita.`
            );
            
            if (confirmacion) {
                accion = 'eliminar';
                endpoint = `/api/citas/${citaId}/eliminar`;
                mensaje = 'eliminada completamente';
            } else {
                // Usuario eligió cancelar en lugar de eliminar
                const confirmarCancelacion = confirm(
                    `¿Está seguro de que desea cancelar (no eliminar) la cita del ${new Date(cita.fecha).toLocaleDateString('es-ES')} a las ${cita.hora}?`
                );
                if (!confirmarCancelacion) return;
                
                accion = 'cancelar';
                mensaje = 'cancelada exitosamente';
            }
        } else if (diffHoras >= 2) {
            // Entre 2 y 4 horas: solo cancelar
            const confirmacion = confirm(
                `¿Está seguro de que desea cancelar la cita del ${new Date(cita.fecha).toLocaleDateString('es-ES')} a las ${cita.hora}?\n\n` +
                `Nota: Solo se puede cancelar (no eliminar) porque faltan menos de 4 horas.`
            );
            if (!confirmacion) return;
            
            accion = 'cancelar';
            mensaje = 'cancelada exitosamente';
        } else {
            // Menos de 2 horas: no permitir
            this.showAlert(
                `No se puede cancelar la cita con menos de 2 horas de anticipación. Faltan ${diffHoras.toFixed(1)} horas.`,
                'warning'
            );
            return;
        }

        console.log(`🎯 Acción seleccionada: ${accion}`);

        try {
            const response = await this.authFetch(endpoint, { 
                method,
                headers: this.getAuthHeaders()
            });
            console.log('📡 Respuesta del servidor:', response.status, response.statusText);
            
            const result = await response.json();
            console.log('📄 Resultado:', result);
            
            if (response.ok) {
                this.showAlert(`✅ Cita ${mensaje}.`, 'success');
                await this.loadCitas();
            } else {
                throw new Error(result.msg || `Error al ${accion} la cita`);
            }
        } catch (error) {
            console.error(`❌ Error ${accion}ndo cita:`, error);
            this.showAlert(`❌ ${error.message || `Error al ${accion} la cita. Inténtelo nuevamente.`}`, 'danger');
        }
    }

    verDetalleCita(citaId) {
        const cita = this.citas.find(c => c.id === citaId);
        if (!cita) return;
        
        console.log('Ver detalle de cita:', cita);
        // Implement detail view functionality
        alert(`Detalle de cita:\nFecha: ${new Date(cita.fecha).toLocaleDateString('es-ES')}\nHora: ${cita.hora}\nMotivo: ${cita.motivo}\nEstado: ${cita.estado}`);
    }

    // Funciones de Notificaciones
    async loadNotifications() {
        console.log('🔔 Cargando notificaciones...');
        try {
            // Generar notificaciones basadas en las citas
            this.generateNotificationsFromCitas();
            this.renderNotifications();
        } catch (error) {
            console.error('❌ Error cargando notificaciones:', error);
        }
    }

    generateNotificationsFromCitas() {
        const ahora = new Date();
        const mañana = new Date(ahora);
        mañana.setDate(ahora.getDate() + 1);
        const proximaSemana = new Date(ahora);
        proximaSemana.setDate(ahora.getDate() + 7);

        this.notificaciones = [];

        if (this.citas && this.citas.length > 0) {
            this.citas.forEach(cita => {
                if (cita.estado === 'cancelada') return;

                const fechaStr = cita.fecha.split('T')[0];
                const fechaCita = new Date(`${fechaStr} ${cita.hora}`);
                const diffHoras = (fechaCita - ahora) / (1000 * 60 * 60);

                // Notificación para cita del día siguiente
                if (diffHoras > 0 && diffHoras <= 24) {
                    this.notificaciones.push({
                        id: `cita-manana-${cita.id}`,
                        tipo: 'cita_manana',
                        titulo: 'Cita Mañana',
                        mensaje: `Tienes una cita mañana a las ${cita.hora.substring(0, 5)} para ${cita.motivo}`,
                        fecha: ahora.toISOString(),
                        leida: false,
                        icono: 'bi-calendar-check',
                        color: 'text-warning'
                    });
                }

                // Notificación para citas próximas (2-7 días)
                if (diffHoras > 24 && diffHoras <= 168) {
                    const diasRestantes = Math.ceil(diffHoras / 24);
                    this.notificaciones.push({
                        id: `cita-proxima-${cita.id}`,
                        tipo: 'cita_proxima',
                        titulo: 'Cita Próxima',
                        mensaje: `Tienes una cita en ${diasRestantes} días para ${cita.motivo}`,
                        fecha: ahora.toISOString(),
                        leida: false,
                        icono: 'bi-calendar',
                        color: 'text-info'
                    });
                }
            });
        }

        // Notificación de bienvenida si es nuevo usuario
        const isNewUser = !localStorage.getItem('visited_before');
        if (isNewUser) {
            this.notificaciones.push({
                id: 'bienvenida',
                tipo: 'bienvenida',
                titulo: '¡Bienvenido!',
                mensaje: 'Gracias por usar nuestro sistema de citas odontológicas',
                fecha: ahora.toISOString(),
                leida: false,
                icono: 'bi-heart',
                color: 'text-success'
            });
            localStorage.setItem('visited_before', 'true');
        }

        // Ordenar por fecha más reciente
        this.notificaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    renderNotifications() {
        const notificationsList = document.getElementById('notificationsList');
        const notificationCount = document.getElementById('notificationCount');
        const unreadCount = this.notificaciones.filter(n => !n.leida).length;

        // Actualizar contador
        if (unreadCount > 0) {
            notificationCount.textContent = unreadCount;
            notificationCount.style.display = 'block';
        } else {
            notificationCount.style.display = 'none';
        }

        // Renderizar lista
        if (this.notificaciones.length === 0) {
            notificationsList.innerHTML = `
                <div class="dropdown-item-text text-center text-muted py-3">
                    <i class="bi bi-bell-slash" style="font-size: 2rem;"></i>
                    <p class="mb-0 mt-2">No hay notificaciones</p>
                </div>
            `;
        } else {
            notificationsList.innerHTML = this.notificaciones.map(notif => `
                <div class="dropdown-item ${notif.leida ? '' : 'bg-light'}" style="cursor: pointer;" onclick="dashboardPaciente.markNotificationRead('${notif.id}')">
                    <div class="d-flex align-items-start">
                        <div class="flex-shrink-0 me-2">
                            <i class="bi ${notif.icono} ${notif.color}" style="font-size: 1.2rem;"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between">
                                <h6 class="mb-1 fw-bold">${notif.titulo}</h6>
                                <small class="text-muted">${this.formatTimeAgo(notif.fecha)}</small>
                            </div>
                            <p class="mb-1 text-muted small">${notif.mensaje}</p>
                            ${!notif.leida ? '<span class="badge bg-primary badge-sm">Nueva</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="dropdown-divider"></div>
            `).join('');
        }
    }

    markNotificationRead(notifId) {
        const notificacion = this.notificaciones.find(n => n.id === notifId);
        if (notificacion && !notificacion.leida) {
            notificacion.leida = true;
            this.renderNotifications();
        }
    }

    markAllNotificationsRead() {
        this.notificaciones.forEach(notif => {
            notif.leida = true;
        });
        this.renderNotifications();
    }

    formatTimeAgo(fecha) {
        const ahora = new Date();
        const fechaNotif = new Date(fecha);
        const diffMinutos = Math.floor((ahora - fechaNotif) / (1000 * 60));

        if (diffMinutos < 60) {
            return `${diffMinutos}m`;
        } else if (diffMinutos < 1440) {
            return `${Math.floor(diffMinutos / 60)}h`;
        } else {
            return `${Math.floor(diffMinutos / 1440)}d`;
        }
    }

    logout() {
        console.log('🔐 Cerrando sesión del paciente...');
        
        // Usar el middleware de autenticación si está disponible
        if (window.authMiddleware) {
            window.authMiddleware.secureLogout();
        } else {
            // Fallback manual
            this.manualLogout();
        }
    }

    manualLogout() {
        // Limpiar completamente el localStorage
        localStorage.clear();
        
        // Limpiar sessionStorage también
        sessionStorage.clear();
        
        // Limpiar datos de la clase
        this.citas = [];
        this.historial = [];
        this.perfil = {};
        this.notificaciones = [];
        
        // Destruir gráficos si existen
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        
        // Invalidar la sesión en el historial del navegador
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, '/index.html');
        }
        
        // Marcar que estamos cerrando sesión
        window.loggingOut = true;
        
        // Redirigir con un pequeño delay para asegurar limpieza
        setTimeout(() => {
            // Forzar navegación sin posibilidad de volver atrás
            window.location.replace('/index.html?logout=true');
        }, 100);
    }

    // 🔐 FUNCIONALIDAD DE CAMBIO DE CONTRASEÑA
    setupPasswordChangeEvents() {
        // Toggle password visibility
        ['togglePasswordActual', 'togglePasswordNueva', 'togglePasswordConfirmar'].forEach(id => {
            document.getElementById(id).addEventListener('click', (e) => {
                const button = e.target.closest('button');
                const input = button.previousElementSibling;
                const icon = button.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.replace('bi-eye', 'bi-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.replace('bi-eye-slash', 'bi-eye');
                }
            });
        });

        // Password strength checker
        document.getElementById('passwordNueva').addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });

        // Confirm password match
        document.getElementById('passwordConfirmar').addEventListener('input', () => {
            this.validatePasswordMatch();
        });

        // Submit password change
        document.getElementById('cambiarPasswordBtn').addEventListener('click', () => {
            this.cambiarPassword();
        });

        // Configurar modal cuando se muestre
        document.getElementById('cambiarPasswordModal').addEventListener('shown.bs.modal', () => {
            this.configurarModalPassword();
        });

        // Clear form when modal is hidden
        document.getElementById('cambiarPasswordModal').addEventListener('hidden.bs.modal', () => {
            this.clearPasswordForm();
        });
    }

    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('passwordStrength');
        const strengthText = document.getElementById('passwordStrengthText');
        
        let strength = 0;
        let feedback = '';
        
        if (password.length >= 6) strength += 20;
        if (password.length >= 8) strength += 10;
        if (/[a-z]/.test(password)) strength += 20;
        if (/[A-Z]/.test(password)) strength += 20;
        if (/[0-9]/.test(password)) strength += 15;
        if (/[^A-Za-z0-9]/.test(password)) strength += 15;
        
        strengthBar.style.width = strength + '%';
        strengthBar.className = 'progress-bar';
        
        if (strength < 30) {
            strengthBar.classList.add('bg-danger');
            feedback = 'Muy débil';
        } else if (strength < 60) {
            strengthBar.classList.add('bg-warning');
            feedback = 'Débil';
        } else if (strength < 80) {
            strengthBar.classList.add('bg-info');
            feedback = 'Moderada';
        } else {
            strengthBar.classList.add('bg-success');
            feedback = 'Fuerte';
        }
        
        strengthText.textContent = feedback;
    }

    validatePasswordMatch() {
        const newPassword = document.getElementById('passwordNueva').value;
        const confirmPassword = document.getElementById('passwordConfirmar').value;
        const confirmInput = document.getElementById('passwordConfirmar');
        
        if (confirmPassword && newPassword !== confirmPassword) {
            confirmInput.classList.add('is-invalid');
            return false;
        } else {
            confirmInput.classList.remove('is-invalid');
            return true;
        }
    }

    async cambiarPassword() {
        const currentPassword = document.getElementById('passwordActual').value;
        const newPassword = document.getElementById('passwordNueva').value;
        const confirmPassword = document.getElementById('passwordConfirmar').value;
        const alertContainer = document.getElementById('passwordChangeAlert');
        const submitBtn = document.getElementById('cambiarPasswordBtn');
        
        // Clear previous alerts
        alertContainer.innerHTML = '';
        
        // Obtener información del usuario
        const userData = JSON.parse(localStorage.getItem('user'));
        
        console.log('🔑 Iniciando cambio de contraseña...');
        
        // Validaciones básicas
        if (!newPassword || !confirmPassword) {
            this.showPasswordAlert('error', 'Nueva contraseña y confirmación son obligatorias.');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showPasswordAlert('error', 'La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showPasswordAlert('error', 'Las contraseñas no coinciden.');
            return;
        }
        
        // Loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Cambiando...';
        submitBtn.disabled = true;
        
        try {
            const requestBody = {
                new_password: newPassword,
                userId: userData.id,
                isTokenLogin: true // FORZAR como token login para que no pida contraseña actual
            };
            
            console.log('🔑 Enviando petición como token login (forzado)');
            
            const response = await this.authFetch('/cambiar-password-directo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(requestBody)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showPasswordAlert('success', '¡Contraseña cambiada exitosamente!');
                
                setTimeout(() => {
                    bootstrap.Modal.getInstance(document.getElementById('cambiarPasswordModal')).hide();
                }, 1500);
            } else {
                this.showPasswordAlert('error', result.msg || 'Error al cambiar la contraseña.');
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.showPasswordAlert('error', 'Error de conexión. Intenta nuevamente.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showPasswordAlert(type, message) {
        const alertContainer = document.getElementById('passwordChangeAlert');
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const iconClass = type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle';
        
        alertContainer.innerHTML = `
            <div class="alert ${alertClass}" role="alert">
                <i class="bi ${iconClass}"></i> ${message}
            </div>
        `;
    }

    clearPasswordForm() {
        document.getElementById('cambiarPasswordForm').reset();
        document.getElementById('passwordStrength').style.width = '0%';
        document.getElementById('passwordStrengthText').textContent = 'Ingresa una contraseña';
        document.getElementById('passwordChangeAlert').innerHTML = '';
        document.querySelectorAll('#cambiarPasswordForm .is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
    }

    configurarModalPassword() {
        console.log('🔧 configurarModalPassword ejecutándose...');
        const userData = JSON.parse(localStorage.getItem('user'));
        console.log('🔧 userData completo:', userData);
        
        // SOLUCIÓN TEMPORAL: Verificar si la contraseña actual es un token de 6 dígitos
        const currentPasswordGroup = document.querySelector('#passwordActual').closest('.mb-3');
        const alertContainer = document.getElementById('passwordChangeAlert');
        
        console.log('🔧 currentPasswordGroup encontrado:', !!currentPasswordGroup);
        console.log('🔧 alertContainer encontrado:', !!alertContainer);
        
        // Ocultar campo de contraseña actual y mostrar mensaje
        currentPasswordGroup.style.display = 'none';
        alertContainer.innerHTML = `
            <div class="alert alert-warning" role="alert">
                <i class="bi bi-info-circle"></i> Si iniciaste sesión con un token de recuperación, 
                puedes cambiar tu contraseña sin ingresar la contraseña actual.
            </div>
        `;
        
        console.log('✅ Campo de contraseña actual ocultado por defecto');
    }

    // ==========================================
    // SISTEMA DE PAGOS
    // ==========================================
    
    async loadPagos() {
        try {
            console.log('💳 Cargando datos de pagos del paciente...');
            
            // Cargar facturas del paciente
            const responseFacturas = await this.authFetch('/api/pagos-ext/facturas/paciente');
            
            if (!responseFacturas) return;
            
            const dataFacturas = await responseFacturas.json();
            console.log('💳 Respuesta de facturas:', dataFacturas);
            
            // Verificar si la respuesta es exitosa y extraer los datos
            let facturas = [];
            if (dataFacturas.success && dataFacturas.data && dataFacturas.data.facturas) {
                facturas = dataFacturas.data.facturas;
            } else if (Array.isArray(dataFacturas)) {
                facturas = dataFacturas;
            }
            
            // Separar facturas pendientes y pagadas
            this.facturasPendientes = facturas.filter(f => f.estado === 'pendiente');
            this.facturasPagadas = facturas.filter(f => f.estado === 'pagada');
            
            // Cargar métodos de pago
            const responseMetodos = await this.authFetch('/api/pagos-ext/metodos-pago');
            
            if (responseMetodos) {
                this.metodosPago = await responseMetodos.json();
            } else {
                this.metodosPago = [];
            }
            
            // Actualizar UI
            this.displayFacturasPendientes();
            this.displayHistorialPagos();
            this.displayMetodosPago();
            
            console.log('✅ Datos de pagos cargados correctamente');
        } catch (error) {
            console.error('❌ Error al cargar datos de pagos:', error);
            this.showAlert('Error al cargar datos de pagos', 'danger');
        }
    }
    
    displayFacturasPendientes() {
        const container = document.getElementById('facturas-pendientes-list');
        if (!container) return;

        if (!this.facturasPendientes || this.facturasPendientes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-check-circle-fill fs-1 text-success"></i>
                    <p class="mt-2">¡Excelente! No tienes facturas pendientes</p>
                </div>
            `;
            return;
        }

        const facturasPendientesHtml = this.facturasPendientes.map(factura => `
            <div class="card mb-3 border-warning">
                <div class="card-header d-flex justify-content-between align-items-center bg-warning bg-opacity-25">
                    <h6 class="card-title mb-0">${factura.numero_factura}</h6>
                    <span class="badge bg-warning">Pendiente</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p class="mb-2"><strong>Tratamiento:</strong> ${factura.nombre_tratamiento || 'N/A'}</p>
                            <p class="mb-2"><strong>Odontólogo:</strong> Dr. ${factura.nombre_odontologo || 'N/A'}</p>
                            <p class="mb-2"><strong>Fecha:</strong> ${this.formatFecha(factura.fecha_emision)}</p>
                        </div>
                        <div class="col-md-6 text-end">
                            <h5 class="text-primary mb-3">$${this.formatMoney(factura.monto)}</h5>
                            <button class="btn btn-success btn-sm" onclick="dashboardPaciente.abrirModalPago(${factura.id})">
                                <i class="bi bi-credit-card"></i> Pagar Ahora
                            </button>
                        </div>
                    </div>
                    
                    ${factura.descripcion ? `
                    <div class="mt-3 pt-3 border-top">
                        <small class="text-muted">Descripción: ${factura.descripcion}</small>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = facturasPendientesHtml;
    }
    
    displayHistorialPagos() {
        const container = document.getElementById('historial-pagos-list');
        if (!container) return;

        if (!this.facturasPagadas || this.facturasPagadas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-receipt fs-1"></i>
                    <p class="mt-2">No hay pagos registrados aún</p>
                </div>
            `;
            return;
        }

        const historialHtml = this.facturasPagadas.map(factura => `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="card-title mb-0">${factura.numero_factura}</h6>
                    <span class="badge bg-success">Pagada</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p class="mb-2"><strong>Tratamiento:</strong> ${factura.nombre_tratamiento || 'N/A'}</p>
                            <p class="mb-2"><strong>Odontólogo:</strong> Dr. ${factura.nombre_odontologo || 'N/A'}</p>
                            <p class="mb-2"><strong>Fecha Factura:</strong> ${this.formatFecha(factura.fecha_emision)}</p>
                            <p class="mb-2"><strong>Fecha Pago:</strong> ${this.formatFecha(factura.fecha_pago)}</p>
                        </div>
                        <div class="col-md-6 text-end">
                            <h5 class="text-success mb-3">$${this.formatMoney(factura.monto)}</h5>
                            <p class="text-muted small">
                                ${factura.metodo_pago ? `Método: ${factura.metodo_pago}` : ''}
                                ${factura.referencia_externa ? `<br>Ref: ${factura.referencia_externa}` : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = historialHtml;
    }
    
    displayMetodosPago() {
        const container = document.getElementById('metodos-pago-list');
        if (!container) return;

        if (!this.metodosPago || this.metodosPago.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-wallet2 fs-1"></i>
                    <p class="mt-2">No tienes métodos de pago registrados</p>
                    <button class="btn btn-primary" onclick="dashboardPaciente.abrirModalMetodoPago()">
                        <i class="bi bi-plus-circle"></i> Agregar Primer Método
                    </button>
                </div>
            `;
            return;
        }

        const metodosHtml = this.metodosPago.map(metodo => `
            <div class="card mb-3">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            ${this.getPaymentIcon(metodo.tipo_metodo)}
                        </div>
                        <div>
                            <h6 class="card-title mb-1">${metodo.nombre_metodo}</h6>
                            <p class="card-text text-muted mb-0">
                                ${metodo.banco || 'Sin banco'} 
                                ${metodo.ultimos_4_digitos ? `**** ${metodo.ultimos_4_digitos}` : ''}
                            </p>
                        </div>
                    </div>
                    <div class="d-flex align-items-center">
                        ${metodo.es_preferido ? '<span class="badge bg-primary me-2">Preferido</span>' : ''}
                        <button class="btn btn-outline-danger btn-sm" onclick="dashboardPaciente.eliminarMetodoPago(${metodo.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = metodosHtml + `
            <div class="text-center">
                <button class="btn btn-outline-primary" onclick="dashboardPaciente.abrirModalMetodoPago()">
                    <i class="bi bi-plus-circle"></i> Agregar Método de Pago
                </button>
            </div>
        `;
    }
    
    getPaymentIcon(tipo) {
        const iconos = {
            'tarjeta_credito': '<i class="bi bi-credit-card text-primary fs-4"></i>',
            'tarjeta_debito': '<i class="bi bi-credit-card-2-front text-info fs-4"></i>',
            'cuenta_bancaria': '<i class="bi bi-bank text-success fs-4"></i>',
            'billetera_digital': '<i class="bi bi-phone text-warning fs-4"></i>'
        };
        return iconos[tipo] || '<i class="bi bi-credit-card text-secondary fs-4"></i>';
    }
    
    abrirModalMetodoPago() {
        const modal = new bootstrap.Modal(document.getElementById('metodoPagoModal'));
        document.getElementById('metodoPagoForm').reset();
        
        // Configurar visibilidad de campos según tipo
        const tipoSelect = document.getElementById('tipoMetodo');
        
        const configurarCamposPorTipo = () => {
            const tipo = tipoSelect.value;
            const digitosGroup = document.getElementById('digitosGroup');
            const bancoGroup = document.getElementById('bancoGroup');
            
            if (tipo === 'cuenta_bancaria' || tipo === 'billetera_digital') {
                digitosGroup.style.display = 'none';
            } else {
                digitosGroup.style.display = 'block';
            }
            
            bancoGroup.style.display = 'block';
        };
        
        tipoSelect.addEventListener('change', configurarCamposPorTipo);
        configurarCamposPorTipo();
        
        modal.show();
    }
    
    async crearMetodoPago(formData) {
        try {
            const metodoPagoData = Object.fromEntries(formData.entries());
            
            // Ajustar datos según tipo de método
            if (metodoPagoData.tipo_metodo === 'cuenta_bancaria' || 
                metodoPagoData.tipo_metodo === 'billetera_digital') {
                delete metodoPagoData.ultimos_4_digitos;
            }
            
            // Convertir checkbox a booleano
            metodoPagoData.es_preferido = formData.has('es_preferido');
            
            const response = await this.authFetch('/api/pagos-ext/metodos-pago', {
                method: 'POST',
                body: JSON.stringify(metodoPagoData)
            });
            
            if (response) {
                const data = await response.json();
                if (data.success) {
                    this.metodosPago.push(data.metodo);
                    this.displayMetodosPago();
                    
                    // Cerrar modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('metodoPagoModal'));
                    modal.hide();
                    
                    this.showAlert('Método de pago agregado correctamente', 'success');
                } else {
                    throw new Error(data.message || 'Error al crear método de pago');
                }
            }
        } catch (error) {
            console.error('❌ Error creando método de pago:', error);
            this.showAlert('Error al agregar método de pago', 'danger');
        }
    }
    
    async eliminarMetodoPago(metodoId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este método de pago?')) {
            return;
        }
        
        try {
            const response = await this.authFetch(`/api/pagos-ext/metodos-pago/${metodoId}`, {
                method: 'DELETE'
            });
            
            if (response) {
                const data = await response.json();
                if (data.success) {
                    this.metodosPago = this.metodosPago.filter(m => m.id !== metodoId);
                    this.displayMetodosPago();
                    this.showAlert('Método de pago eliminado correctamente', 'success');
                } else {
                    throw new Error(data.message || 'Error al eliminar método de pago');
                }
            }
        } catch (error) {
            console.error('❌ Error eliminando método de pago:', error);
            this.showAlert('Error al eliminar método de pago', 'danger');
        }
    }
    
    abrirModalPago(facturaId) {
        const factura = this.facturasPendientes.find(f => f.id === facturaId);
        if (!factura) {
            this.showAlert('Factura no encontrada', 'danger');
            return;
        }
        
        // Llenar información de la factura
        document.getElementById('pagoFacturaId').value = facturaId;
        document.getElementById('pagoFacturaInfo').textContent = factura.numero_factura;
        document.getElementById('pagoMontoInfo').textContent = `Monto: $${this.formatMoney(factura.monto)}`;
        
        // Llenar métodos de pago disponibles
        const metodoPagoSelect = document.getElementById('metodoPagoSelect');
        metodoPagoSelect.innerHTML = '<option value="">Selecciona un método de pago</option>';
        
        this.metodosPago.forEach(metodo => {
            const option = document.createElement('option');
            option.value = metodo.id;
            option.textContent = `${metodo.nombre_metodo} - ${metodo.banco || 'Sin banco'}` + 
                                (metodo.ultimos_4_digitos ? ` **** ${metodo.ultimos_4_digitos}` : '');
            if (metodo.es_preferido) {
                option.selected = true;
            }
            metodoPagoSelect.appendChild(option);
        });
        
        // Reset form
        document.getElementById('procesarPagoForm').reset();
        document.getElementById('pagoFacturaId').value = facturaId;
        
        const modal = new bootstrap.Modal(document.getElementById('procesarPagoModal'));
        modal.show();
    }
    
    async procesarPago(formData) {
        try {
            const pagoData = Object.fromEntries(formData.entries());
            
            if (!pagoData.metodo_pago_id) {
                this.showAlert('Debe seleccionar un método de pago', 'warning');
                return;
            }
            
            console.log('💳 Procesando pago:', pagoData);
            
            const response = await this.authFetch('/api/pagos-ext/procesar-pago', {
                method: 'POST',
                body: JSON.stringify(pagoData)
            });
            
            if (response) {
                const data = await response.json();
                if (data.success) {
                    // Cerrar modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('procesarPagoModal'));
                    modal.hide();
                    
                    this.showAlert('Pago procesado exitosamente', 'success');
                    
                    // Recargar datos de pagos
                    await this.loadPagos();
                } else {
                    throw new Error(data.message || 'Error al procesar el pago');
                }
            }
        } catch (error) {
            console.error('❌ Error procesando pago:', error);
            this.showAlert('Error al procesar el pago', 'danger');
        }
    }

    // ==========================================
    // SISTEMA DE EVALUACIONES
    // ==========================================

    async loadEvaluaciones() {
        console.log('⭐ Cargando evaluaciones...');
        try {
            // Cargar evaluaciones realizadas
            const response = await this.authFetch('/api/evaluaciones/paciente');
            if (response) {
                const data = await response.json();
                if (data.success) {
                    this.evaluaciones = data.evaluaciones || [];
                    this.displayEvaluaciones();
                }
            }

            // Cargar citas pendientes de evaluación
            const pendientesResponse = await this.authFetch('/api/evaluaciones/pendientes');
            if (pendientesResponse) {
                const pendientesData = await pendientesResponse.json();
                if (pendientesData.success) {
                    this.citasPendientes = pendientesData.citas_pendientes || [];
                    this.displayCitasPendientes();
                }
            }
        } catch (error) {
            console.error('❌ Error cargando evaluaciones:', error);
            this.showAlert('Error al cargar las evaluaciones', 'danger');
        }
    }

    displayEvaluaciones() {
        const container = document.getElementById('evaluacionesContainer');
        if (!container) return;

        if (this.evaluaciones.length === 0) {
            container.innerHTML = `
                <div class="text-center p-4">
                    <i class="bi bi-star display-4 text-muted"></i>
                    <h5 class="text-muted mt-3">No hay evaluaciones realizadas</h5>
                    <p class="text-muted">Las evaluaciones aparecerán aquí después de completar tus citas.</p>
                </div>
            `;
            return;
        }

        const evaluacionesHtml = this.evaluaciones.map(evaluacion => {
            const fechaEvaluacion = new Date(evaluacion.fecha_evaluacion).toLocaleDateString();
            const fechaCita = new Date(evaluacion.cita_fecha).toLocaleDateString();
            
            const estrellasSServicio = this.generarEstrellasHtml(evaluacion.calificacion_servicio);
            const estrellasOdontologo = this.generarEstrellasHtml(evaluacion.calificacion_odontologo);

            return `
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <h6 class="card-title mb-0">Dr. ${evaluacion.odontologo_nombre}</h6>
                                <small class="text-muted">${fechaEvaluacion}</small>
                            </div>
                            
                            <p class="text-muted mb-2">
                                <i class="bi bi-calendar"></i> Cita: ${fechaCita}
                            </p>
                            
                            <div class="mb-2">
                                <small class="text-muted">Calificación del Servicio:</small>
                                <div class="d-flex align-items-center">
                                    ${estrellasSServicio}
                                    <span class="ms-2 badge bg-primary">${evaluacion.calificacion_servicio}/5</span>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <small class="text-muted">Calificación del Odontólogo:</small>
                                <div class="d-flex align-items-center">
                                    ${estrellasOdontologo}
                                    <span class="ms-2 badge bg-primary">${evaluacion.calificacion_odontologo}/5</span>
                                </div>
                            </div>
                            
                            ${evaluacion.comentarios ? `
                                <div class="mb-2">
                                    <small class="text-muted">Comentarios:</small>
                                    <p class="text-sm">${evaluacion.comentarios}</p>
                                </div>
                            ` : ''}
                            
                            <div class="text-end">
                                ${evaluacion.recomendaria ? 
                                    '<span class="badge bg-success">Recomendaría</span>' : 
                                    '<span class="badge bg-secondary">No recomendaría</span>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5><i class="bi bi-star-fill text-warning"></i> Mis Evaluaciones</h5>
                <span class="badge bg-info">${this.evaluaciones.length} evaluación(es)</span>
            </div>
            <div class="row">
                ${evaluacionesHtml}
            </div>
        `;
    }

    displayCitasPendientes() {
        const container = document.getElementById('citasPendientesContainer');
        if (!container) return;

        if (this.citasPendientes.length === 0) {
            container.innerHTML = `
                <div class="text-center p-4">
                    <i class="bi bi-check-circle display-4 text-success"></i>
                    <h6 class="text-muted mt-3">No hay citas pendientes de evaluación</h6>
                </div>
            `;
            return;
        }

        const citasHtml = this.citasPendientes.map(cita => {
            const fechaCita = new Date(cita.fecha).toLocaleDateString();
            const horaCita = cita.hora.substring(0, 5);

            return `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Dr. ${cita.odontologo_nombre}</h6>
                            <p class="card-text">
                                <i class="bi bi-calendar"></i> ${fechaCita} - ${horaCita}
                            </p>
                            <button class="btn btn-warning btn-sm" 
                                    onclick="dashboardPaciente.mostrarFormularioEvaluacion(${cita.id}, '${cita.odontologo_nombre}', ${cita.odontologo_id})">
                                <i class="bi bi-star"></i> Evaluar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5><i class="bi bi-clock text-warning"></i> Citas Pendientes de Evaluación</h5>
                <span class="badge bg-warning">${this.citasPendientes.length} pendiente(s)</span>
            </div>
            <div class="row">
                ${citasHtml}
            </div>
        `;
    }

    generarEstrellasHtml(calificacion) {
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

    mostrarFormularioEvaluacion(citaId, odontologoNombre, odontologoId) {
        const modal = new bootstrap.Modal(document.getElementById('evaluacionModal'));
        
        // Llenar datos del modal
        document.getElementById('evaluacionCitaId').value = citaId;
        document.getElementById('evaluacionOdontologoId').value = odontologoId;
        document.getElementById('evaluacionOdontologoNombre').textContent = odontologoNombre;
        
        // Limpiar formulario
        document.getElementById('evaluacionForm').reset();
        document.getElementById('evaluacionCitaId').value = citaId;
        document.getElementById('evaluacionOdontologoId').value = odontologoId;
        
        // Resetear estrellas
        this.resetearEstrellas();
        
        modal.show();
    }

    configurarEvaluacionForm() {
        const form = document.getElementById('evaluacionForm');
        const estrellas = document.querySelectorAll('.star-rating i');
        
        // Configurar interactividad de estrellas
        estrellas.forEach((estrella, index) => {
            estrella.addEventListener('mouseenter', () => {
                this.resaltarEstrellas(estrella.dataset.campo, index + 1);
            });
            
            estrella.addEventListener('click', () => {
                this.seleccionarEstrellas(estrella.dataset.campo, index + 1);
            });
        });
        
        // Configurar envío del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.enviarEvaluacion();
        });
    }

    resaltarEstrellas(campo, cantidad) {
        const estrellas = document.querySelectorAll(`[data-campo="${campo}"]`);
        estrellas.forEach((estrella, index) => {
            if (index < cantidad) {
                estrella.className = 'bi bi-star-fill text-warning';
            } else {
                estrella.className = 'bi bi-star text-muted';
            }
        });
    }

    seleccionarEstrellas(campo, cantidad) {
        document.getElementById(campo).value = cantidad;
        this.resaltarEstrellas(campo, cantidad);
    }

    resetearEstrellas() {
        const estrellas = document.querySelectorAll('.star-rating i');
        estrellas.forEach(estrella => {
            estrella.className = 'bi bi-star text-muted';
        });
    }

    async enviarEvaluacion() {
        try {
            const form = document.getElementById('evaluacionForm');
            const formData = new FormData(form);
            
            const evaluacionData = {
                cita_id: parseInt(formData.get('cita_id')),
                odontologo_id: parseInt(formData.get('odontologo_id')),
                calificacion_servicio: parseInt(formData.get('calificacion_servicio')),
                calificacion_odontologo: parseInt(formData.get('calificacion_odontologo')),
                comentarios: formData.get('comentarios'),
                recomendaria: formData.get('recomendaria') === 'on' ? 1 : 0
            };

            // Validar datos
            if (!evaluacionData.calificacion_servicio || !evaluacionData.calificacion_odontologo) {
                this.showAlert('Por favor califica tanto el servicio como al odontólogo', 'warning');
                return;
            }

            console.log('⭐ Enviando evaluación:', evaluacionData);

            const response = await this.authFetch('/api/evaluaciones/crear', {
                method: 'POST',
                body: JSON.stringify(evaluacionData)
            });

            if (response) {
                const data = await response.json();
                if (data.success) {
                    this.showAlert('Evaluación enviada exitosamente. ¡Gracias por tu retroalimentación!', 'success');
                    
                    // Cerrar modal y recargar datos
                    bootstrap.Modal.getInstance(document.getElementById('evaluacionModal')).hide();
                    await this.loadEvaluaciones();
                } else {
                    this.showAlert(data.message || 'Error al enviar la evaluación', 'danger');
                }
            }
        } catch (error) {
            console.error('❌ Error enviando evaluación:', error);
            this.showAlert('Error al enviar la evaluación', 'danger');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardPaciente = new DashboardPaciente();
});
