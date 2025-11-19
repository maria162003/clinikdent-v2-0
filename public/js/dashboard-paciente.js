// Dashboard Paciente JavaScript
class DashboardPaciente {
    constructor() {
        this.currentSection = 'dashboard';
        this.citas = [];
        this.historial = [];
        this.perfil = {};
        this.charts = {};
        this.notificaciones = [];
        this.configuracion = {
            horasMinCancelacion: 2 // Valor por defecto
        };
        
        // Pagination configuration
        this.pagination = {
            citas: { currentPage: 1, itemsPerPage: 10, totalItems: 0 },
            historial: { currentPage: 1, itemsPerPage: 10, totalItems: 0 },
            facturasPendientes: { currentPage: 1, itemsPerPage: 10, totalItems: 0 },
            historialPagos: { currentPage: 1, itemsPerPage: 10, totalItems: 0 },
            evaluacionesPendientes: { currentPage: 1, itemsPerPage: 10, totalItems: 0 },
            evaluacionesRealizadas: { currentPage: 1, itemsPerPage: 10, totalItems: 0 }
        };
        
        this.init();
    }

    // ==========================================
    // SISTEMA DE AUTENTICACION UNIFICADO
    // ==========================================
    
    getUserId() {
        return localStorage.getItem('userId') || localStorage.getItem('user')?.id;
    }

    getAuthHeaders() {
        const userId = this.getUserId();
        if (!userId) {
            console.error('No se encontro userId para autenticacion');
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
                console.error(' Error de autenticacion, redirigiendo al login');
                this.redirectToLogin();
                return null;
            }
            
            return response;
        } catch (error) {
            console.error(' Error en peticion autenticada:', error);
            throw error;
        }
    }

    init() {
        this.setupEventListeners();
        this.loadUserInfo();
        this.loadConfiguracion();
        this.loadDashboardData();
        this.loadNotifications();
        this.initializeCharts();
        this.setMinDate();
        this.setupSecurityMeasures();
        this.configurarEvaluacionForm();
        this.configurarPagoRapido();
    }

    setupSecurityMeasures() {
        // Prevenir el acceso mediante boton atras despues del logout
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                // La pagina se cargo desde el cache del navegador
                this.checkAuthStatus();
            }
        });

        // Verificar estado de autenticacion al cargar la pagina
        this.checkAuthStatus();

        // Manejar el evento popstate (boton atras/adelante)
        window.addEventListener('popstate', () => {
            this.checkAuthStatus();
        });
    }

    checkAuthStatus() {
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        
        if (!userId || userRole !== 'paciente') {
            console.log('Usuario no autenticado o rol incorrecto');
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        // Limpiar cualquier dato de sesion
        localStorage.clear();
        sessionStorage.clear();
        
        // Reemplazar la entrada actual del historial para prevenir regreso
        window.location.replace('/index.html?session=expired');
    }

    // ==========================================
    // CARGA DE CONFIGURACION
    // ==========================================
    
    async loadConfiguracion() {
        try {
            const response = await this.authFetch('/api/configuracion/sistema');
            if (response && response.ok) {
                const config = await response.json();
                this.configuracion.horasMinCancelacion = config.citas?.anticipacion_minima || 2;
                console.log(`⚙️ Configuración cargada: ${this.configuracion.horasMinCancelacion} horas mínimas para cancelación`);
            }
        } catch (error) {
            console.error('❌ Error cargando configuración:', error);
            // Mantener valor por defecto en caso de error
        }
    }

    // ==========================================
    // SISTEMA DE BREADCRUMBS
    // ==========================================

    // Breadcrumb functionality
    updateBreadcrumb(sectionName) {
        const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
        const breadcrumbIcon = document.getElementById('breadcrumbIcon');
        
        const sectionConfig = {
            dashboard: { name: 'Inicio', icon: 'bi-speedometer2' },
            citas: { name: 'Mis Citas', icon: 'bi-calendar3' },
            historial: { name: 'Mi Historial', icon: 'bi-file-medical' },
            perfil: { name: 'Mi Perfil', icon: 'bi-person' },
            evaluaciones: { name: 'Evaluaciones', icon: 'bi-star' },
            pagos: { name: 'Mis Pagos', icon: 'bi-wallet2' }
        };
        
        if (breadcrumbCurrent && breadcrumbIcon && sectionConfig[sectionName]) {
            breadcrumbCurrent.textContent = sectionConfig[sectionName].name;
            breadcrumbIcon.className = `bi ${sectionConfig[sectionName].icon} me-1 text-muted`;
        }
        
        this.currentSection = sectionName;
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

        // Cambio de contrasena
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

        // Validación de domingos en el campo de fecha para agendar cita
        const citaFechaInput = document.getElementById('citaFecha');
        if (citaFechaInput) {
            citaFechaInput.addEventListener('change', (e) => {
                const fechaSeleccionada = new Date(e.target.value + 'T00:00:00');
                const diaSemana = fechaSeleccionada.getDay();
                
                if (diaSemana === 0) {
                    this.showAlert('⚠️ La clínica no atiende los domingos. Horario: Lunes a Sábado.', 'warning');
                    e.target.value = ''; // Limpiar el campo
                }
            });
        }

        // Validación de domingos en el campo de fecha para reprogramar cita
        const nuevaFechaInput = document.getElementById('nuevaFecha');
        if (nuevaFechaInput) {
            nuevaFechaInput.addEventListener('change', (e) => {
                const fechaSeleccionada = new Date(e.target.value + 'T00:00:00');
                const diaSemana = fechaSeleccionada.getDay();
                
                if (diaSemana === 0) {
                    this.showAlert('⚠️ La clínica no atiende los domingos. Horario: Lunes a Sábado.', 'warning');
                    e.target.value = ''; // Limpiar el campo
                }
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
            
            // Add event listener to prevent Sundays
            fechaInput.addEventListener('change', (e) => {
                const selectedDate = new Date(e.target.value + 'T00:00:00');
                const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
                
                if (dayOfWeek === 0) {
                    this.showAlert('❌ No se pueden agendar citas los domingos. La clínica permanece cerrada.', 'warning');
                    e.target.value = '';
                }
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
            citas: 'Mis Citas',
            historial: 'Mi Historial',
            perfil: 'Mi Perfil',
            evaluaciones: 'Evaluaciones',
            pagos: 'Mis Pagos'
        };
        return titles[section] || 'Inicio';
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
            
            // Cargar informacion adicional del perfil
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
            // Nota: el email no esta en los datos actuales del login, se puede agregar despues
        }
    }

    // ==========================================
    // SISTEMA DE PAGINACION
    // ==========================================

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
        prevItem.innerHTML = `<a class="page-link" href="#" onclick="dashboardPaciente.changePage('${section}', ${config.currentPage - 1})">Anterior</a>`;
        paginationList.appendChild(prevItem);
        
        // Page numbers
        const startPage = Math.max(1, config.currentPage - 2);
        const endPage = Math.min(totalPages, config.currentPage + 2);
        
        if (startPage > 1) {
            const firstItem = document.createElement('li');
            firstItem.className = 'page-item';
            firstItem.innerHTML = `<a class="page-link" href="#" onclick="dashboardPaciente.changePage('${section}', 1)">1</a>`;
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
            pageItem.innerHTML = `<a class="page-link" href="#" onclick="dashboardPaciente.changePage('${section}', ${i})">${i}</a>`;
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
            lastItem.innerHTML = `<a class="page-link" href="#" onclick="dashboardPaciente.changePage('${section}', ${totalPages})">${totalPages}</a>`;
            paginationList.appendChild(lastItem);
        }
        
        // Next button
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${config.currentPage === totalPages ? 'disabled' : ''}`;
        nextItem.innerHTML = `<a class="page-link" href="#" onclick="dashboardPaciente.changePage('${section}', ${config.currentPage + 1})">Siguiente</a>`;
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
            case 'citas':
                this.loadCitas();
                break;
            case 'historial':
                this.loadHistorial();
                break;
            case 'facturasPendientes':
            case 'historialPagos':
                this.loadPagos(); // Usar la funcion existente que maneja ambos casos
                break;
            case 'evaluacionesPendientes':
            case 'evaluacionesRealizadas':
                this.loadEvaluaciones(); // Usar la funcion existente que maneja evaluaciones
                break;
        }
    }

    // Change items per page handler
    changeItemsPerPage(section, newItemsPerPage) {
        const config = this.pagination[section];
        if (!config) return;
        
        const oldItemsPerPage = config.itemsPerPage;
        const newItemsPerPageNum = parseInt(newItemsPerPage);
        
        // Calculate what should be the new current page to maintain relative position
        const currentFirstItem = (config.currentPage - 1) * oldItemsPerPage + 1;
        const newCurrentPage = Math.ceil(currentFirstItem / newItemsPerPageNum);
        
        config.itemsPerPage = newItemsPerPageNum;
        config.currentPage = Math.max(1, newCurrentPage);
        
        // Reload data for specific section
        this.changePage(section, config.currentPage);
    }

    async loadDashboardData() {
        console.log(' Cargando datos del dashboard...');
        try {
            // Obtener datos del usuario desde localStorage
            const userData = localStorage.getItem('user');
            if (!userData) {
                console.error(' No hay datos de usuario');
                return;
            }
            
            const userInfo = JSON.parse(userData);
            const userId = userInfo.id;
            console.log(`👤 Cargando dashboard para usuario ID: ${userId}`);
            
            // Cargar citas para calcular estadisticas
            await this.loadCitas();
            
            // Calcular y mostrar estadisticas basadas en citas reales
            this.calculateDashboardStats();
            
            // Cargar proximas citas para el timeline
            this.loadProximasCitas();
            
        } catch (error) {
            console.error(' Error loading dashboard data:', error);
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
        console.log('🕐 Fecha actual:', ahora);
        console.log(' Total de citas:', this.citas.length);
        
        // Filtrar citas futuras y pasadas
        const citasFuturas = this.citas.filter(cita => {
            try {
                // Mejor manejo de la fecha - usar ISO format o construccion manual
                const fechaStr = cita.fecha.split('T')[0]; // YYYY-MM-DD
                const [year, month, day] = fechaStr.split('-');
                const [hour, minute] = cita.hora.split(':');
                
                // Crear fecha con constructor especifico (mes -1 porque Date usa 0-11)
                const fechaCita = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
                
                console.log(` Cita ${cita.id}: ${fechaStr} ${cita.hora} -> ${fechaCita} | Futura: ${fechaCita > ahora} | Estado: ${cita.estado}`);
                
                return fechaCita > ahora && cita.estado !== 'cancelada';
            } catch (error) {
                console.error(' Error procesando fecha de cita:', cita, error);
                return false;
            }
        });
        
        const citasPasadas = this.citas.filter(cita => {
            try {
                const fechaStr = cita.fecha.split('T')[0];
                const [year, month, day] = fechaStr.split('-');
                const [hour, minute] = cita.hora.split(':');
                const fechaCita = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
                return fechaCita <= ahora && cita.estado !== 'cancelada';
            } catch (error) {
                console.error(' Error procesando fecha de cita pasada:', cita, error);
                return false;
            }
        });
        
        console.log(`Citas futuras encontradas: ${citasFuturas.length}`);
        console.log(`📚 Citas pasadas encontradas: ${citasPasadas.length}`);

        // Proxima cita
        if (citasFuturas.length > 0) {
            // Ordenar por fecha y hora mas proxima
            citasFuturas.sort((a, b) => {
                const fechaStrA = a.fecha.split('T')[0];
                const [yearA, monthA, dayA] = fechaStrA.split('-');
                const [hourA, minuteA] = a.hora.split(':');
                const fechaA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA), parseInt(hourA), parseInt(minuteA));
                
                const fechaStrB = b.fecha.split('T')[0];
                const [yearB, monthB, dayB] = fechaStrB.split('-');
                const [hourB, minuteB] = b.hora.split(':');
                const fechaB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB), parseInt(hourB), parseInt(minuteB));
                
                return fechaA - fechaB;
            });
            
            const proximaCita = citasFuturas[0];
            const fechaCita = new Date(proximaCita.fecha);
            const fechaFormateada = fechaCita.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const horaFormateada = proximaCita.hora.substring(0, 5); // HH:MM
            
            console.log(' Proxima cita seleccionada:', proximaCita);
            
            document.getElementById('proximaCita').textContent = `${fechaFormateada} ${horaFormateada}`;
            
            // Mi Odontologo (del proximo cita)
            const odontologoNombre = proximaCita.odontologo_nombre && proximaCita.odontologo_apellido 
                ? `Dr. ${proximaCita.odontologo_nombre} ${proximaCita.odontologo_apellido}`
                : 'Dr. Asignado';
            document.getElementById('miOdontologo').textContent = odontologoNombre;
        } else {
            document.getElementById('proximaCita').textContent = 'Sin citas programadas';
            document.getElementById('miOdontologo').textContent = 'N/A';
        }

        // Ultima visita
        if (citasPasadas.length > 0) {
            // Ordenar por fecha mas reciente
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
        console.log(' Cargando proximas citas para el timeline...');
        
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

        // Ordenar por fecha y hora mas proxima
        citasFuturas.sort((a, b) => {
            const fechaA = new Date(`${a.fecha.split('T')[0]} ${a.hora}`);
            const fechaB = new Date(`${b.fecha.split('T')[0]} ${b.hora}`);
            return fechaA - fechaB;
        });

        // Tomar solo las proximas 3 citas
        const proximasTres = citasFuturas.slice(0, 3);

        if (proximasTres.length === 0) {
            document.getElementById('proximasCitas').innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="bi bi-calendar-check" style="font-size: 2rem;"></i>
                    <p class="mt-2">No hay proximas citas</p>
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
                        <span class="badge ${this.getEstadoBadgeClass(cita.estado)} mt-2">${this.formatEstado(cita.estado)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    initializeCharts() {
        console.log(' Inicializando graficos con datos reales...');
        
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
        console.log(' Cargando citas del paciente...');
        try {
            const userId = this.getUserId();
            if (!userId) {
                console.error(' No hay datos de usuario');
                this.showAlert('No hay datos de usuario. Por favor, inicie sesion nuevamente.', 'warning');
                return;
            }
            
            console.log(`👤 Cargando citas para usuario ID: ${userId}`);
            
            const res = await this.authFetch(`/api/citas/${userId}`);
            console.log('📡 Respuesta del servidor:', res.status, res.statusText);
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const citas = await res.json();
            console.log(' Citas recibidas:', citas);
            
            this.citas = citas;
            this.renderCitasTable();
            
            // Actualizar contador de citas
            const citasCount = document.getElementById('citasCount');
            if (citasCount) {
                citasCount.textContent = citas.length;
            }
            
        } catch (err) {
            console.error(' Error al cargar citas:', err);
            this.showAlert('Error al cargar las citas. Intentelo nuevamente.', 'danger');
            
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
        
        const totalCitas = this.citas ? this.citas.length : 0;
        
        // Generate pagination
        this.generatePagination('citas', totalCitas);
        
        if (!this.citas || this.citas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No tienes citas programadas</td></tr>';
            return;
        }
        
        // Apply pagination
        const config = this.pagination.citas;
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = startIndex + config.itemsPerPage;
        const paginatedCitas = this.citas.slice(startIndex, endIndex);
        
        tbody.innerHTML = '';
        paginatedCitas.forEach(cita => {
            const fecha = new Date(cita.fecha).toLocaleDateString('es-ES');
            const hora = cita.hora || 'N/A';
            const motivo = cita.motivo || 'Consulta general';
            const estado = cita.estado || 'programada';
            
            // Formatear nombre del odontologo
            const odontologoNombre = cita.odontologo_nombre && cita.odontologo_apellido 
                ? `Dr. ${cita.odontologo_nombre} ${cita.odontologo_apellido}`
                : 'Dr. Por asignar';
            
            // Verificar si se puede reprogramar (no completada, no cancelada, no del pasado, más de 24h)
            const fechaActual = new Date();
            // Construcción robusta de la fecha y hora de la cita evitando parseos ambiguos
            const base = new Date(cita.fecha);
            const [hh, mm = '0', ss = '0'] = (cita.hora || '00:00:00').split(':');
            const fechaCita = new Date(
                base.getFullYear(),
                base.getMonth(),
                base.getDate(),
                parseInt(hh, 10) || 0,
                parseInt(mm, 10) || 0,
                parseInt(ss, 10) || 0,
                0
            );
            const diffHoras = (fechaCita - fechaActual) / (1000 * 60 * 60);
            // Permitir reprogramar solo si faltan más de 24 horas
            const puedeReprogramar = estado !== 'completada' && estado !== 'cancelada' && diffHoras > 24;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fecha}</td>
                <td>${hora}</td>
                <td>${odontologoNombre}</td>
                <td>${motivo}</td>
                <td><span class="badge bg-${this.getEstadoBadgeClass(estado)}">${estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="dashboardPaciente.verDetalleCita(${cita.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" 
                            onclick="dashboardPaciente.reprogramarCita(${cita.id})" 
                            title="${puedeReprogramar ? 'Reprogramar' : 'No se puede reprogramar'}"
                            ${!puedeReprogramar ? 'disabled' : ''}>
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
        // Aqui deberias mostrar el modal para crear/editar cita
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
                console.log('No hay usuario logueado');
                return;
            }
            
            console.log(' Cargando historial para paciente ID:', userId);
            const res = await this.authFetch(`/api/historial/paciente/${userId}`);
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            
            const response = await res.json();
            console.log('Historial cargado:', response.total || 0, 'registros');
            this.historial = response.data || response.historial || [];
            this.renderHistorialTable();
        } catch (err) {
            console.error(' Error al cargar historial:', err);
            this.historial = [];
            this.renderHistorialTable();
        }
    }

    renderHistorialTable() {
        const tbody = document.querySelector('#historialTable tbody');
        if (!tbody) {
            console.log('No se encontro la tabla de historial');
            return;
        }
        
        const totalHistorial = this.historial ? this.historial.length : 0;
        
        // Generate pagination
        this.generatePagination('historial', totalHistorial);
        
        tbody.innerHTML = '';
        
        if (!this.historial || this.historial.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay historiales registrados</td></tr>';
            return;
        }
        
        // Apply pagination
        const config = this.pagination.historial;
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = startIndex + config.itemsPerPage;
        const paginatedHistorial = this.historial.slice(startIndex, endIndex);
        
        paginatedHistorial.forEach(h => {
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
        // Aqui deberias mostrar el modal para crear/editar historial
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
                            <h5 class="modal-title">Detalle del Historial Clinico</h5>
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
                                    <label class="form-label fw-bold">Diagnostico:</label>
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
            // Estados de historial
            case 'en_proceso': return 'bg-light text-dark border';
            case 'completado': return 'bg-light text-dark border';
            case 'pendiente': return 'bg-light text-dark border';
            case 'cancelado': return 'bg-light text-dark border';
            case 'revision': return 'bg-light text-dark border';
            // Estados de citas
            case 'programada': return 'bg-light text-dark border';
            case 'confirmada': return 'bg-light text-dark border';
            case 'completada': return 'bg-light text-dark border';
            case 'cancelada': return 'bg-light text-dark border';
            default: return 'bg-light text-dark border';
        }
    }

    formatEstado(estado) {
        switch(estado) {
            // Estados de historial
            case 'en_proceso': return 'En Proceso';
            case 'completado': return 'Completado';
            case 'pendiente': return 'Pendiente';
            case 'cancelado': return 'Cancelado';
            // Estados de citas
            case 'programada': return 'Programada';
            case 'confirmada': return 'Confirmada ✓';
            case 'completada': return 'Completada';
            case 'cancelada': return 'Cancelada';
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
                console.error(' No hay datos de usuario');
                this.showAlert('No hay datos de usuario. Por favor, inicie sesion nuevamente.', 'warning');
                return;
            }
            
            console.log(`👤 Cargando perfil para usuario ID: ${userId}`);
            
            // Hacer peticion al backend para obtener datos completos del usuario
            const res = await this.authFetch(`/api/usuarios/${userId}/perfil`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const usuario = await res.json();
            console.log(' Datos del perfil recibidos:', usuario);
            
            this.perfil = usuario;
            this.renderPerfil(this.perfil);
            
        } catch (error) {
            console.error(' Error loading perfil:', error);
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
            this.showAlert(' Error al cargar el perfil. Se muestran datos basicos.', 'warning');
        }
    }

    renderPerfil(perfil) {
        console.log('🎨 Renderizando perfil:', perfil);
        
        // Update profile display
        document.getElementById('perfilNombre').textContent = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim();
        document.getElementById('perfilEmail').textContent = perfil.correo || 'Sin correo';
        document.getElementById('perfilTelefono').textContent = perfil.telefono || 'Sin telefono';

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
            'confirmada': 'bg-light text-dark border',
            'programada': 'bg-light text-dark border',
            'completada': 'bg-light text-dark border',
            'cancelada': 'bg-light text-dark border',
            'revision': 'bg-light text-dark border'
        };
        return classes[estado] || 'bg-light text-dark border';
    }

    async openCitaModal() {
        const modal = new bootstrap.Modal(document.getElementById('citaModal'));
        document.getElementById('citaForm').reset();
        
        // Set minimum date
        this.setMinDate();
        
        // Cargar odontologos disponibles
        await this.loadOdontologosDisponibles();
        
        modal.show();
    }

    async loadOdontologosDisponibles() {
        try {
            console.log('Cargando odontologos disponibles desde API...');
            
            // Llamada real a la API para obtener odontologos
            const response = await this.authFetch('/api/usuarios/odontologos');
            const odontologos = await response.json();
            
            console.log('Odontologos encontrados:', odontologos);
            
            // Actualizar el select de odontologos en el modal
            const selectOdontologo = document.getElementById('citaOdontologo');
            if (selectOdontologo) {
                selectOdontologo.innerHTML = '<option value="">Seleccione un odontologo...</option>';
                
                odontologos.forEach(odontologo => {
                    const option = document.createElement('option');
                    option.value = odontologo.id;
                    option.textContent = `Dr. ${odontologo.nombre} ${odontologo.apellido || ''}`;
                    selectOdontologo.appendChild(option);
                });
                
                console.log(`Se cargaron ${odontologos.length} odontologos en el selector`);
            }
            
        } catch (error) {
            console.error('Error al cargar odontologos:', error);
            
            // En caso de error, usar datos de respaldo con todos los odontologos reales
            console.log('Usando datos de respaldo de odontologos');
            const odontologosRespaldo = [
              {
                "id": 13,
                "nombre": "Andres Fabian",
                "apellido": "Melo Melo",
                "correo": "meloandres@gmail.com",
                "telefono": "3009498541",
                "activo": true
              },
              {
                "id": 2,
                "nombre": "Carlos andres",
                "apellido": "Rodriguez Fajardo",
                "correo": "carlos@gmail.com",
                "telefono": "3001234501",
                "activo": true
              },
              {
                "id": 19,
                "nombre": "dasheira",
                "apellido": "penaloza",
                "correo": "dasheira@penaloza.com",
                "telefono": "3216542",
                "activo": true
              }
            ];
            
            const selectOdontologo = document.getElementById('citaOdontologo');
            if (selectOdontologo) {
                selectOdontologo.innerHTML = '<option value="">Seleccione un odontologo...</option>';
                
                odontologosRespaldo.forEach(odontologo => {
                    const option = document.createElement('option');
                    option.value = odontologo.id;
                    option.textContent = `Dr. ${odontologo.nombre} ${odontologo.apellido || ''}`;
                    selectOdontologo.appendChild(option);
                });
                
                console.log(`Se cargaron ${odontologosRespaldo.length} odontologos de respaldo en el selector`);
            }
            this.showAlert('Error al cargar la lista de odontologos', 'warning');
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
        
        // Validar que se haya seleccionado un odontólogo
        const odontologoId = document.getElementById('citaOdontologo').value;
        if (!odontologoId) {
            this.showAlert('Por favor, seleccione un odontólogo para la cita.', 'warning');
            return;
        }
        
        // Validar que no sea domingo
        const fechaSeleccionada = document.getElementById('citaFecha').value;
        const fecha = new Date(fechaSeleccionada + 'T00:00:00');
        const dayOfWeek = fecha.getDay();
        
        if (dayOfWeek === 0) {
            this.showAlert('❌ No se pueden agendar citas los domingos. La clínica permanece cerrada.', 'danger');
            return;
        }
        
        // Deshabilitar boton durante el proceso
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Agendando...';
        submitBtn.disabled = true;
        
        try {
            const userId = this.getUserId();
            if (!userId) {
                throw new Error('No hay datos de usuario. Por favor, inicie sesion nuevamente.');
            }
            
            console.log('👤 Usuario logueado ID:', userId);
            
            const formData = {
                id_paciente: userId,
                odontologo_id: document.getElementById('citaOdontologo').value,
                fecha: document.getElementById('citaFecha').value,
                hora: document.getElementById('citaHora').value,
                motivo: document.getElementById('citaTratamiento').value,
                notas: document.getElementById('citaObservaciones').value
            };
            
            console.log(' Datos de la cita a enviar:', formData);
            
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
                // Mostrar mensaje personalizado basado en si fue confirmada automaticamente
                let mensaje = ' Cita agendada exitosamente.';
                if (result.confirmadaAutomaticamente) {
                    mensaje += ' Su cita ha sido confirmada automaticamente y ya aparece en el calendario del odontologo asignado.';
                } else {
                    mensaje += ' Su cita esta pendiente de confirmacion debido al horario seleccionado. Recibira una notificacion cuando sea confirmada.';
                }
                
                this.showAlert(mensaje, 'success');
                
                // Mostrar informacion adicional del odontologo asignado
                if (result.odontologoAsignado) {
                    setTimeout(() => {
                        this.showAlert(`🦷 Odontologo asignado: Dr. ${result.odontologoAsignado.nombre} ${result.odontologoAsignado.apellido}`, 'info');
                    }, 2000);
                }
                
                // Close modal and refresh list
                const modal = bootstrap.Modal.getInstance(document.getElementById('citaModal'));
                if (modal) {
                    modal.hide();
                }
                
                // Reset form
                form.reset();
                form.classList.remove('was-validated');
                
                // Refresh citas list
                console.log(' Recargando lista de citas...');
                await this.loadCitas();
            } else {
                throw new Error(result.msg || 'Error al agendar la cita');
            }
            
        } catch (error) {
            console.error(' Error agendando cita:', error);
            this.showAlert(` ${error.message || 'Error al agendar la cita. Intentelo nuevamente.'}`, 'danger');
        } finally {
            // Restaurar boton
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
        
        // Auto-hide despues de 5 segundos
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
            this.showAlert(' Nombre, apellido y correo electronico son requeridos.', 'danger');
            return;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.correo)) {
            this.showAlert(' Por favor, ingrese un correo electronico valido.', 'danger');
            return;
        }
        
        try {
            const userId = this.perfil.id;
            console.log('📡 Enviando actualizacion de perfil:', formData);
            
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
                
                // Salir del modo edicion
                this.togglePerfilEdit(false);
                
                // Actualizar la visualizacion
                this.renderPerfil(this.perfil);
                
                this.showAlert(' Perfil actualizado exitosamente.', 'success');
                
            } else {
                throw new Error(result.msg || 'Error al actualizar el perfil');
            }
            
        } catch (error) {
            console.error(' Error al guardar perfil:', error);
            this.showAlert(` ${error.message || 'Error al actualizar el perfil. Intentelo nuevamente.'}`, 'danger');
        }
    }

    reprogramarCita(citaId) {
        const cita = this.citas.find(c => c.id === citaId);
        if (!cita) {
            this.showAlert('Cita no encontrada.', 'danger');
            return;
        }

        // Verificar que la cita no este cancelada
        if (cita.estado === 'cancelada') {
            this.showAlert('No se puede reprogramar una cita cancelada.', 'warning');
            return;
        }

        // Verificar que la cita no este completada
        if (cita.estado === 'completada') {
            this.showAlert('No se puede reprogramar una cita que ya fue completada.', 'warning');
            return;
        }

        // Verificar restriccion de 24 horas y que no sea del pasado
        const fechaActual = new Date();
        // Construcción robusta de la fecha-hora de la cita para evitar errores de parseo (DD/MM vs MM/DD)
        const base = new Date(cita.fecha);
        const [hh, mm = '0', ss = '0'] = (cita.hora || '00:00:00').split(':');
        const fechaCita = new Date(
            base.getFullYear(),
            base.getMonth(),
            base.getDate(),
            parseInt(hh, 10) || 0,
            parseInt(mm, 10) || 0,
            parseInt(ss, 10) || 0,
            0
        );
        const diffHoras = (fechaCita - fechaActual) / (1000 * 60 * 60);
        
        // Si la cita es del pasado
        if (diffHoras < 0) {
            this.showAlert('No se puede reprogramar una cita que ya pasó.', 'warning');
            return;
        }
        
        // Si la cita es en menos de 24 horas
        if (diffHoras < 24) {
            this.showAlert('No se puede reprogramar la cita con menos de 24 horas de anticipación.', 'warning');
            return;
        }

        // Llenar los datos de la cita actual en el modal
        document.getElementById('reprogramarCitaId').value = citaId;
        document.getElementById('citaActualFecha').textContent = new Date(cita.fecha).toLocaleDateString('es-ES');
        document.getElementById('citaActualHora').textContent = cita.hora;
        document.getElementById('citaActualMotivo').textContent = cita.motivo || 'No especificado';

        // Configurar fecha minima (manana)
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        document.getElementById('nuevaFecha').min = manana.toISOString().split('T')[0];

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('reprogramarModal'));
        modal.show();
    }

    async confirmarReprogramar() {
        console.log(' Confirmando reprogramacion...');
        const form = document.getElementById('reprogramarForm');
        const submitBtn = document.getElementById('confirmarReprogramarBtn');
        
        // Validar formulario
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            this.showAlert('Por favor, complete los campos requeridos.', 'warning');
            return;
        }

        // Deshabilitar boton durante el proceso
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

            console.log(' Datos de reprogramacion:', formData);

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
                this.showAlert(' Cita reprogramada exitosamente.', 'success');
                
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
            console.error(' Error reprogramando cita:', error);
            this.showAlert(` ${error.message || 'Error al reprogramar la cita. Intentelo nuevamente.'}`, 'danger');
        } finally {
            // Restaurar boton
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
        
        console.log(`⏱️ Diferencia de horas: ${diffHoras.toFixed(1)}`);

        const horasMinimas = this.configuracion.horasMinCancelacion;

        if (diffHoras >= horasMinimas) {
            // Mas de las horas minimas configuradas: permitir eliminar
            await this.mostrarModalAccionCita({
                tipo: 'eliminar',
                fecha: new Date(cita.fecha).toLocaleDateString('es-ES'),
                hora: cita.hora,
                diffHoras: diffHoras.toFixed(1)
            }, async (accionSeleccionada) => {
                if (accionSeleccionada === 'eliminar') {
                    await this.ejecutarAccionCita(citaId, 'eliminar', `/api/citas/${citaId}/eliminar`, 'DELETE', 'eliminada completamente');
                }
            });
        } else {
            // Menos de las horas minimas: no permitir
            this.showAlert(
                `No se puede eliminar la cita con menos de ${horasMinimas} horas de anticipación. Faltan ${diffHoras.toFixed(1)} horas.`,
                'warning'
            );
            return;
        }
    }

    async ejecutarAccionCita(citaId, accion, endpoint, method, mensaje) {
        console.log(`🎬 Accion seleccionada: ${accion}`);

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
            this.showAlert(`⚠️ ${error.message || `Error al ${accion} la cita. Intentelo nuevamente.`}`, 'danger');
        }
    }

    mostrarModalAccionCita(config, callback) {
        return new Promise((resolve) => {
            const modalElement = document.getElementById('confirmarAccionCitaModal');
            if (!modalElement) {
                console.error('❌ Modal confirmarAccionCitaModal no encontrado');
                resolve(null);
                return;
            }

            const modal = new bootstrap.Modal(modalElement);
            const modalHeader = document.getElementById('modalAccionHeader');
            const modalTitle = document.getElementById('modalAccionTitle');
            const modalContent = document.getElementById('modalAccionContent');
            const modalNota = document.getElementById('modalAccionNota');
            const modalNotaText = document.getElementById('modalAccionNotaText');
            const confirmarBtn = document.getElementById('modalAccionConfirmarBtn');

            if (!modalHeader || !modalTitle || !modalContent || !modalNota || !modalNotaText || !confirmarBtn) {
                console.error('❌ Elementos del modal no encontrados:', {
                    modalHeader: !!modalHeader,
                    modalTitle: !!modalTitle,
                    modalContent: !!modalContent,
                    modalNota: !!modalNota,
                    modalNotaText: !!modalNotaText,
                    confirmarBtn: !!confirmarBtn
                });
                resolve(null);
                return;
            }

            // Configurar modal para eliminar
            modalHeader.style.background = '#f8f9fa';
            modalHeader.style.color = '#212529';
            modalTitle.innerHTML = '<i class="bi bi-exclamation-circle me-2"></i>Confirmar Eliminación';
            modalContent.innerHTML = `
                <div>
                    <div class="border rounded p-3 mb-3" style="background-color: #f8f9fa;">
                        <div class="d-flex align-items-center justify-content-center">
                            <i class="bi bi-calendar3 me-2 text-muted"></i>
                            <span class="fw-medium">${config.fecha}</span>
                            <span class="mx-2 text-muted">•</span>
                            <i class="bi bi-clock me-2 text-muted"></i>
                            <span class="fw-medium">${config.hora}</span>
                        </div>
                    </div>
                    <p class="mb-0 text-center">¿Está seguro de que desea eliminar completamente esta cita?</p>
                </div>
            `;
            modalNota.style.display = 'flex';
            modalNota.className = 'alert alert-light d-flex align-items-start mb-0';
            modalNota.style.border = '1px solid #dee2e6';
            modalNotaText.innerHTML = `Faltan <strong>${config.diffHoras} horas</strong> para la cita.`;
            confirmarBtn.style.display = 'inline-block';
            confirmarBtn.className = 'btn btn-outline-danger';
            confirmarBtn.innerHTML = '<i class="bi bi-trash me-1"></i> Eliminar Cita';

            confirmarBtn.onclick = () => {
                modal.hide();
                callback('eliminar');
                resolve('eliminar');
            };

            modal.show();

            // Limpiar cuando se cierra
            modalElement.addEventListener('hidden.bs.modal', () => {
                resolve(null);
            }, { once: true });
        });
    }

    verDetalleCita(citaId) {
        const cita = this.citas.find(c => c.id === citaId);
        if (!cita) return;
        
        console.log('Ver detalle de cita:', cita);
        this.mostrarModalDetallesCita(cita);
    }

    mostrarModalDetallesCita(cita) {
        // Formatear fecha
        const fechaFormateada = new Date(cita.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Formatear hora
        const horaFormateada = cita.hora.substring(0, 5); // Quitar segundos

        // Nombre del doctor
        const nombreDoctor = cita.odontologo_nombre && cita.odontologo_apellido 
            ? `Dr. ${cita.odontologo_nombre} ${cita.odontologo_apellido}`
            : 'Dr. Carlos Rodriguez';

        // Llenar el modal
        document.getElementById('detalleFecha').textContent = fechaFormateada;
        document.getElementById('detalleHora').textContent = horaFormateada;
        document.getElementById('detalleDoctor').textContent = nombreDoctor;
        document.getElementById('detalleMotivo').textContent = cita.motivo || 'Consulta general';

        // Estado con colores y descripciones amigables
        const estadoBadge = document.getElementById('detalleEstadoBadge');
        const estadoDescripcion = document.getElementById('detalleEstadoDescripcion');
        
        switch(cita.estado) {
            case 'confirmada':
                estadoBadge.className = 'badge fs-6 py-2 px-3 bg-success';
                estadoBadge.innerHTML = '<i class="bi bi-check-circle me-1"></i>Confirmada';
                estadoDescripcion.textContent = '¡Perfecto! Tu cita esta confirmada. Te esperamos puntualmente.';
                break;
            case 'programada':
                estadoBadge.className = 'badge fs-6 py-2 px-3 bg-warning text-dark';
                estadoBadge.innerHTML = '<i class="bi bi-clock me-1"></i>Programada';
                estadoDescripcion.textContent = 'Tu cita esta programada. Pronto recibiras la confirmacion.';
                break;
            case 'completada':
                estadoBadge.className = 'badge fs-6 py-2 px-3 bg-info';
                estadoBadge.innerHTML = '<i class="bi bi-check2-all me-1"></i>Completada';
                estadoDescripcion.textContent = 'Esta cita ya fue realizada. ¡Esperamos que haya sido de tu agrado!';
                break;
            case 'cancelada':
                estadoBadge.className = 'badge fs-6 py-2 px-3 bg-danger';
                estadoBadge.innerHTML = '<i class="bi bi-x-circle me-1"></i>Cancelada';
                estadoDescripcion.textContent = 'Esta cita fue cancelada.';
                break;
            default:
                estadoBadge.className = 'badge fs-6 py-2 px-3 bg-secondary';
                estadoBadge.innerHTML = '<i class="bi bi-question-circle me-1"></i>Estado desconocido';
                estadoDescripcion.textContent = '';
        }

        // Mostrar notas si existen
        const notasContainer = document.getElementById('detalleNotasContainer');
        const notasElement = document.getElementById('detalleNotas');
        if (cita.notas && cita.notas.trim()) {
            notasElement.textContent = cita.notas;
            notasContainer.style.display = 'block';
        } else {
            notasContainer.style.display = 'none';
        }

        // Configurar boton de reprogramar
        const reprogramarBtn = document.getElementById('reprogramarCitaBtn');
        if (cita.estado === 'completada' || cita.estado === 'cancelada') {
            reprogramarBtn.style.display = 'none';
        } else {
            reprogramarBtn.style.display = 'inline-block';
            reprogramarBtn.onclick = () => this.reprogramarCita(cita.id);
        }

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('detallesCitaModal'));
        modal.show();
    }

    // Función de reprogramación eliminada - ya existe una implementación completa arriba

    // Funciones de Notificaciones
    async loadNotifications() {
        console.log('🔔 Cargando notificaciones...');
        try {
            // Generar notificaciones basadas en las citas
            this.generateNotificationsFromCitas();
            this.renderNotifications();
        } catch (error) {
            console.error(' Error cargando notificaciones:', error);
        }
    }

    generateNotificationsFromCitas() {
        const ahora = new Date();
        const manana = new Date(ahora);
        manana.setDate(ahora.getDate() + 1);
        const proximaSemana = new Date(ahora);
        proximaSemana.setDate(ahora.getDate() + 7);

        this.notificaciones = [];

        if (this.citas && this.citas.length > 0) {
            this.citas.forEach(cita => {
                if (cita.estado === 'cancelada') return;

                const fechaStr = cita.fecha.split('T')[0];
                const fechaCita = new Date(`${fechaStr} ${cita.hora}`);
                const diffHoras = (fechaCita - ahora) / (1000 * 60 * 60);

                // Notificacion para cita del dia siguiente
                if (diffHoras > 0 && diffHoras <= 24) {
                    this.notificaciones.push({
                        id: `cita-manana-${cita.id}`,
                        tipo: 'cita_manana',
                        titulo: 'Cita Manana',
                        mensaje: `Tienes una cita manana a las ${cita.hora.substring(0, 5)} para ${cita.motivo}`,
                        fecha: ahora.toISOString(),
                        leida: false,
                        icono: 'bi-calendar-check',
                        color: 'text-warning'
                    });
                }

                // Notificacion para citas proximas (2-7 dias)
                if (diffHoras > 24 && diffHoras <= 168) {
                    const diasRestantes = Math.ceil(diffHoras / 24);
                    this.notificaciones.push({
                        id: `cita-proxima-${cita.id}`,
                        tipo: 'cita_proxima',
                        titulo: 'Cita Proxima',
                        mensaje: `Tienes una cita en ${diasRestantes} dias para ${cita.motivo}`,
                        fecha: ahora.toISOString(),
                        leida: false,
                        icono: 'bi-calendar',
                        color: 'text-info'
                    });
                }
            });
        }

        // Notificacion de bienvenida si es nuevo usuario
        const isNewUser = !localStorage.getItem('visited_before');
        if (isNewUser) {
            this.notificaciones.push({
                id: 'bienvenida',
                tipo: 'bienvenida',
                titulo: '¡Bienvenido!',
                mensaje: 'Gracias por usar nuestro sistema de citas odontologicas',
                fecha: ahora.toISOString(),
                leida: false,
                icono: 'bi-heart',
                color: 'text-success'
            });
            localStorage.setItem('visited_before', 'true');
        }

        // Ordenar por fecha mas reciente
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
        console.log('🔐 Cerrando sesion del paciente...');
        
        // Usar el middleware de autenticacion si esta disponible
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
        
        // Limpiar sessionStorage tambien
        sessionStorage.clear();
        
        // Limpiar datos de la clase
        this.citas = [];
        this.historial = [];
        this.perfil = {};
        this.notificaciones = [];
        
        // Destruir graficos si existen
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        
        // Invalidar la sesion en el historial del navegador
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, '/index.html');
        }
        
        // Marcar que estamos cerrando sesion
        window.loggingOut = true;
        
        // Redirigir con un pequeno delay para asegurar limpieza
        setTimeout(() => {
            // Forzar navegacion sin posibilidad de volver atras
            window.location.replace('/index.html?logout=true');
        }, 100);
    }

    // 🔐 FUNCIONALIDAD DE CAMBIO DE CONTRASENA
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
            feedback = 'Muy debil';
        } else if (strength < 60) {
            strengthBar.classList.add('bg-warning');
            feedback = 'Debil';
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
        
        // Obtener informacion del usuario
        const userData = JSON.parse(localStorage.getItem('user'));
        
        console.log('🔑 Iniciando cambio de contrasena...');
        
        // Validaciones basicas
        if (!newPassword || !confirmPassword) {
            this.showPasswordAlert('error', 'Nueva contrasena y confirmacion son obligatorias.');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showPasswordAlert('error', 'La nueva contrasena debe tener al menos 6 caracteres.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showPasswordAlert('error', 'Las contrasenas no coinciden.');
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
                isTokenLogin: true // FORZAR como token login para que no pida contrasena actual
            };
            
            console.log('🔑 Enviando peticion como token login (forzado)');
            
            const response = await this.authFetch('/api/auth/cambiar-password-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({
                    new_password: newPassword,
                    userId: userData.id
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showPasswordAlert('success', '¡Contrasena cambiada exitosamente!');
                
                setTimeout(() => {
                    bootstrap.Modal.getInstance(document.getElementById('cambiarPasswordModal')).hide();
                }, 1500);
            } else {
                this.showPasswordAlert('error', result.msg || 'Error al cambiar la contrasena.');
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.showPasswordAlert('error', 'Error de conexion. Intenta nuevamente.');
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
        document.getElementById('passwordStrengthText').textContent = 'Ingresa una contrasena';
        document.getElementById('passwordChangeAlert').innerHTML = '';
        document.querySelectorAll('#cambiarPasswordForm .is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
    }

    configurarModalPassword() {
        console.log(' configurarModalPassword ejecutandose...');
        const userData = JSON.parse(localStorage.getItem('user'));
        console.log(' userData completo:', userData);
        
        // SOLUCION TEMPORAL: Verificar si la contrasena actual es un token de 6 digitos
        const currentPasswordGroup = document.querySelector('#passwordActual').closest('.mb-3');
        const alertContainer = document.getElementById('passwordChangeAlert');
        
        console.log(' currentPasswordGroup encontrado:', !!currentPasswordGroup);
        console.log(' alertContainer encontrado:', !!alertContainer);
        
        // Ocultar campo de contrasena actual y mostrar mensaje
        currentPasswordGroup.style.display = 'none';
        alertContainer.innerHTML = `
            <div class="alert alert-warning" role="alert">
                <i class="bi bi-info-circle"></i> Si iniciaste sesion con un token de recuperacion, 
                puedes cambiar tu contrasena sin ingresar la contrasena actual.
            </div>
        `;
        
        console.log('Campo de contrasena actual ocultado por defecto');
    }

    // ==========================================
    // SISTEMA DE PAGOS
    // ==========================================
    
    async loadPagos() {
        try {
            console.log('💳 Cargando datos de pagos del paciente...');
            
            // Obtener el ID del usuario desde localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            const userId = user?.id || this.userData?.id;
            
            if (!userId) {
                console.log(' No se pudo obtener el ID del usuario');
                this.displayFacturasPendientes(true);
                this.displayHistorialPagos(true);
                return;
            }
            
            // Cargar facturas del paciente usando la nueva API de MercadoPago
            const responseFacturas = await this.authFetch('/api/mercadopago/transacciones?usuario_id=' + userId);
            
            if (!responseFacturas) {
                console.log(' No se pudieron cargar las transacciones');
                this.displayFacturasPendientes(true);
                this.displayHistorialPagos(true);
                return;
            }
            
            const dataFacturas = await responseFacturas.json();
            console.log('💳 Respuesta de transacciones MercadoPago:', dataFacturas);
            
            // Procesar transacciones de MercadoPago
            let transacciones = [];
            if (dataFacturas.success && dataFacturas.transacciones) {
                transacciones = dataFacturas.transacciones;
            } else if (Array.isArray(dataFacturas)) {
                transacciones = dataFacturas;
            }
            
            // Convertir transacciones a formato de facturas para mantener compatibilidad
            this.facturasPendientes = transacciones
                .filter(t => t.estado === 'pending' || t.estado === 'pendiente')
                .map(t => ({
                    id: t.id,
                    concepto: t.datos_pago?.description || 'Pago de tratamiento',
                    monto: t.monto,
                    fecha_vencimiento: t.fecha_creacion,
                    estado: 'pendiente',
                    preference_id: t.preference_id
                }));
                
            this.facturasPagadas = transacciones
                .filter(t => t.estado === 'approved' || t.estado === 'pagada')
                .map(t => ({
                    id: t.id,
                    concepto: t.datos_pago?.description || 'Pago de tratamiento',
                    monto: t.monto,
                    fecha_pago: t.fecha_actualizacion,
                    estado: 'pagada',
                    metodo_pago: 'MercadoPago'
                }));
            
            // Actualizar UI
            this.displayFacturasPendientes();
            this.displayHistorialPagos();
            
            console.log('Datos de pagos cargados correctamente');
            
        } catch (error) {
            console.error(' Error al cargar datos de pagos:', error);
            
            // Mostrar estado de error en las secciones
            this.displayFacturasPendientes(true);
            this.displayHistorialPagos(true);
        }
    }
    
    displayFacturasPendientes(hasError = false) {
        const container = document.getElementById('facturasPendientesContainer');
        if (!container) return;

        const totalFacturas = this.facturasPendientes ? this.facturasPendientes.length : 0;
        
        // Generate pagination
        this.generatePagination('facturasPendientes', totalFacturas);

        if (hasError) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                    <p class="mt-2">Error al obtener facturas</p>
                    <button class="btn btn-outline-primary btn-sm" onclick="dashboardPaciente.loadPagos()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            `;
            return;
        }

        if (!this.facturasPendientes || this.facturasPendientes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-check-circle-fill fs-1 text-success"></i>
                    <p class="mt-2">¡Excelente! No tienes facturas pendientes</p>
                    <small>Todos tus pagos estan al dia</small>
                </div>
            `;
            return;
        }

        // Apply pagination
        const config = this.pagination.facturasPendientes;
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = startIndex + config.itemsPerPage;
        const paginatedFacturas = this.facturasPendientes.slice(startIndex, endIndex);

        const facturasPendientesHtml = paginatedFacturas.map(factura => `
            <div class="card mb-3 border-warning">
                <div class="card-header d-flex justify-content-between align-items-center bg-warning bg-opacity-25">
                    <h6 class="card-title mb-0">Pago Pendiente</h6>
                    <span class="badge bg-warning">Pendiente</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <p class="mb-2"><strong>Concepto:</strong> ${factura.concepto || factura.descripcion || 'Servicio dental'}</p>
                            <p class="mb-2"><strong>Fecha:</strong> ${this.formatFecha(factura.fecha_vencimiento)}</p>
                            <div class="d-flex align-items-center">
                                <img src="https://http2.mlstatic.com/storage/logos-api-admin/51b446b0-571c-11e8-9a2d-4b2bd7b1bf77-xl@2x.png" 
                                     alt="MercadoPago" height="20" class="me-2">
                                <small class="text-muted">Pago seguro con MercadoPago</small>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <h5 class="text-primary mb-3">$${this.formatMoney(factura.monto)}</h5>
                            <div class="d-grid gap-2">
                                <button class="btn btn-success btn-sm" onclick="dashboardPaciente.pagarConMercadoPago(${factura.id}, ${factura.monto}, '${factura.concepto || factura.descripcion || 'Servicio dental'}')">
                                    <i class="bi bi-credit-card"></i> Pagar con MercadoPago
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="dashboardPaciente.cancelarFactura(${factura.id}, '${factura.concepto || factura.descripcion || 'Servicio dental'}')">
                                    <i class="bi bi-x-circle"></i> Cancelar Factura
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = facturasPendientesHtml;
    }
    
    displayHistorialPagos(hasError = false) {
        const container = document.getElementById('historialPagosContainer');
        if (!container) return;

        const totalPagos = this.facturasPagadas ? this.facturasPagadas.length : 0;
        
        // Generate pagination
        this.generatePagination('historialPagos', totalPagos);

        if (hasError) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                    <p class="mt-2">Error al obtener historial de pagos</p>
                    <button class="btn btn-outline-primary btn-sm" onclick="dashboardPaciente.loadPagos()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            `;
            return;
        }

        if (!this.facturasPagadas || this.facturasPagadas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-receipt fs-1"></i>
                    <p class="mt-2">No hay pagos registrados aun</p>
                    <small>Aqui apareceran tus pagos completados</small>
                </div>
            `;
            return;
        }

        // Apply pagination
        const config = this.pagination.historialPagos;
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = startIndex + config.itemsPerPage;
        const paginatedPagos = this.facturasPagadas.slice(startIndex, endIndex);

        const historialHtml = paginatedPagos.map(factura => `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="card-title mb-0">Pago Completado</h6>
                    <span class="badge bg-success">Pagada</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <p class="mb-2"><strong>Concepto:</strong> ${factura.concepto || factura.descripcion || 'Servicio dental'}</p>
                            <p class="mb-2"><strong>Fecha de Pago:</strong> ${this.formatFecha(factura.fecha_pago)}</p>
                            <div class="d-flex align-items-center">
                                <img src="https://http2.mlstatic.com/storage/logos-api-admin/51b446b0-571c-11e8-9a2d-4b2bd7b1bf77-xl@2x.png" 
                                     alt="MercadoPago" height="20" class="me-2">
                                <small class="text-muted">Procesado por MercadoPago</small>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <h5 class="text-success mb-3">$${this.formatMoney(factura.monto)}</h5>
                            <span class="badge bg-light text-dark">ID: ${factura.id}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = historialHtml;
    }
    
    // Funcion para procesar pagos con MercadoPago
    async pagarConMercadoPago(facturaId, monto, descripcion) {
        let btnPagar = null;
        let originalText = '';
        
        try {
            console.log('💳 Iniciando pago con MercadoPago:', { facturaId, monto, descripcion });
            
            // Obtener el ID del usuario desde localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            const userId = user?.id || this.userData?.id;
            
            if (!userId) {
                throw new Error('No se pudo obtener el ID del usuario');
            }
            
            // Mostrar loading - buscar el boton de pago
            if (event && event.target) {
                btnPagar = event.target;
                originalText = btnPagar.innerHTML;
                btnPagar.disabled = true;
                btnPagar.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';
            }
            
            // Crear preferencia de pago usando el nuevo endpoint
            const response = await this.authFetch('/api/mercadopago/crear-preferencia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    titulo: descripcion || 'Servicio Dental - Clinikdent',
                    descripcion: `${descripcion} - Cliente: ${user.nombre} ${user.apellido}`,
                    precio: parseFloat(monto),
                    cantidad: 1,
                    usuario_id: userId
                })
            });
            
            if (!response || !response.ok) {
                throw new Error('Error al crear la preferencia de pago');
            }
            
            const data = await response.json();
            console.log('💳 Respuesta de MercadoPago:', data);
            
            if (data.success && data.init_point) {
                // Mostrar modal con informacion del pago
                this.showPaymentModal(data, monto, descripcion);
            } else {
                throw new Error(data.error || 'Error al procesar el pago');
            }
            
        } catch (error) {
            console.error(' Error al procesar pago:', error);
            this.showAlert('Error al procesar el pago: ' + error.message, 'danger');
        } finally {
            // Restaurar boton
            if (btnPagar && originalText) {
                btnPagar.disabled = false;
                btnPagar.innerHTML = originalText;
            }
        }
    }

    // Mostrar modal de pago con opciones
    showPaymentModal(paymentData, monto, descripcion) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'paymentModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-credit-card me-2"></i>
                            Pagar con MercadoPago
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <i class="bi bi-phone fs-1 text-primary mb-3"></i>
                                        <h6>Pagar desde el celular</h6>
                                        <p class="text-muted small">Escanea el codigo QR</p>
                                        <button class="btn btn-primary" onclick="window.open('${paymentData.init_point}', '_blank')">
                                            <i class="bi bi-qr-code"></i> Abrir QR
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <i class="bi bi-laptop fs-1 text-success mb-3"></i>
                                        <h6>Pagar desde el computador</h6>
                                        <p class="text-muted small">Ir directamente a MercadoPago</p>
                                        <button class="btn btn-success" onclick="window.open('${paymentData.init_point}', '_blank')">
                                            <i class="bi bi-arrow-right-circle"></i> Ir a Pagar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-4 p-3 bg-light rounded">
                            <div class="row">
                                <div class="col-6">
                                    <strong>Servicio:</strong><br>
                                    <span class="text-muted">${descripcion}</span>
                                </div>
                                <div class="col-6 text-end">
                                    <strong>Total a pagar:</strong><br>
                                    <span class="fs-4 text-primary">$${this.formatMoney(monto)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-3">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle me-2"></i>
                                <strong>Informacion importante:</strong>
                                <ul class="mb-0 mt-2">
                                    <li>El pago es procesado de forma segura por MercadoPago</li>
                                    <li>Recibiras una confirmacion por email</li>
                                    <li>Puedes pagar con tarjeta, PSE, o efectivo en puntos autorizados</li>
                                    <li>Una vez completado el pago, se actualizara automaticamente aqui</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="window.open('${paymentData.init_point}', '_blank')">
                            <i class="bi bi-credit-card me-2"></i>
                            Proceder al Pago
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.appendChild(modal);
        
        // Mostrar modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Limpiar modal cuando se cierre
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
            // Recargar datos despues de cerrar el modal
            setTimeout(() => {
                this.loadPagos();
            }, 2000);
        });
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
        
        // Configurar visibilidad de campos segun tipo
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
            
            // Ajustar datos segun tipo de metodo
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
                    
                    this.showAlert('Metodo de pago agregado correctamente', 'success');
                } else {
                    throw new Error(data.message || 'Error al crear metodo de pago');
                }
            }
        } catch (error) {
            console.error(' Error creando metodo de pago:', error);
            this.showAlert('Error al agregar metodo de pago', 'danger');
        }
    }
    
    async eliminarMetodoPago(metodoId) {
        if (!confirm('¿Estas seguro de que deseas eliminar este metodo de pago?')) {
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
                    this.showAlert('Metodo de pago eliminado correctamente', 'success');
                } else {
                    throw new Error(data.message || 'Error al eliminar metodo de pago');
                }
            }
        } catch (error) {
            console.error(' Error eliminando metodo de pago:', error);
            this.showAlert('Error al eliminar metodo de pago', 'danger');
        }
    }
    
    abrirModalPago(facturaId) {
        const factura = this.facturasPendientes.find(f => f.id === facturaId);
        if (!factura) {
            this.showAlert('Factura no encontrada', 'danger');
            return;
        }
        
        // Llenar informacion de la factura
        document.getElementById('pagoFacturaId').value = facturaId;
        document.getElementById('pagoFacturaInfo').textContent = factura.numero_factura;
        document.getElementById('pagoMontoInfo').textContent = `Monto: $${this.formatMoney(factura.monto)}`;
        
        // Llenar metodos de pago disponibles
        const metodoPagoSelect = document.getElementById('metodoPagoSelect');
        metodoPagoSelect.innerHTML = '<option value="">Selecciona un metodo de pago</option>';
        
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
                this.showAlert('Debe seleccionar un metodo de pago', 'warning');
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
            console.error(' Error al procesar pago:', error);
            this.showAlert('Error al procesar el pago: ' + error.message, 'danger');
        } finally {
            // Restaurar boton
            if (btnPagar) {
                btnPagar.disabled = false;
                btnPagar.innerHTML = originalText;
            }
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

            // Cargar citas pendientes de evaluacion
            const pendientesResponse = await this.authFetch('/api/evaluaciones/pendientes');
            if (pendientesResponse) {
                const pendientesData = await pendientesResponse.json();
                if (pendientesData.success) {
                    this.citasPendientes = pendientesData.citas_pendientes || [];
                    this.displayCitasPendientes();
                }
            }
        } catch (error) {
            console.error(' Error cargando evaluaciones:', error);
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
                    <p class="text-muted">Las evaluaciones apareceran aqui despues de completar tus citas.</p>
                </div>
            `;
            return;
        }

        const evaluacionesHtml = this.evaluaciones.map(evaluacion => {
            const fechaEvaluacion = new Date(evaluacion.fecha_evaluacion).toLocaleDateString();
            const fechaCita = new Date(evaluacion.cita_fecha).toLocaleDateString();
            
            const estrellasSServicio = this.generarEstrellasHtml(evaluacion.calificacion_servicio);
            const estrellasOdontologo = this.generarEstrellasHtml(evaluacion.calificacion_odontologo);
            const estrellasInstalaciones = this.generarEstrellasHtml(evaluacion.calificacion_instalaciones);
            const estrellasLimpieza = this.generarEstrellasHtml(evaluacion.calificacion_limpieza);
            const estrellasPuntualidad = this.generarEstrellasHtml(evaluacion.calificacion_puntualidad);
            const estrellasAtencion = this.generarEstrellasHtml(evaluacion.calificacion_atencion);

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
                                <small class="text-muted">Servicio:</small>
                                <div class="d-flex align-items-center">
                                    ${estrellasSServicio}
                                    <span class="ms-2 badge bg-primary">${evaluacion.calificacion_servicio}/5</span>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <small class="text-muted">Odontologo:</small>
                                <div class="d-flex align-items-center">
                                    ${estrellasOdontologo}
                                    <span class="ms-2 badge bg-primary">${evaluacion.calificacion_odontologo}/5</span>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <small class="text-muted">Instalaciones:</small>
                                <div class="d-flex align-items-center">
                                    ${estrellasInstalaciones}
                                    <span class="ms-2 badge bg-success">${evaluacion.calificacion_instalaciones}/5</span>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <small class="text-muted">Limpieza:</small>
                                <div class="d-flex align-items-center">
                                    ${estrellasLimpieza}
                                    <span class="ms-2 badge bg-info">${evaluacion.calificacion_limpieza}/5</span>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <small class="text-muted">Puntualidad:</small>
                                <div class="d-flex align-items-center">
                                    ${estrellasPuntualidad}
                                    <span class="ms-2 badge bg-warning">${evaluacion.calificacion_puntualidad}/5</span>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <small class="text-muted">Atencion:</small>
                                <div class="d-flex align-items-center">
                                    ${estrellasAtencion}
                                    <span class="ms-2 badge bg-secondary">${evaluacion.calificacion_atencion}/5</span>
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
                                    '<span class="badge bg-success">Recomendaria</span>' : 
                                    '<span class="badge bg-secondary">No recomendaria</span>'
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
                <span class="badge bg-info">${this.evaluaciones.length} evaluacion(es)</span>
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
                    <h6 class="text-muted mt-3">No hay citas pendientes de evaluacion</h6>
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
                <h5><i class="bi bi-clock text-warning"></i> Citas Pendientes de Evaluacion</h5>
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
        
        // Limpiar todas las estrellas
        document.querySelectorAll('.star-rating i').forEach(star => {
            star.classList.remove('bi-star-fill', 'text-warning');
            star.classList.add('bi-star', 'text-muted');
        });
        
        // Limpiar todos los campos hidden
        ['calificacion_servicio', 'calificacion_odontologo', 'calificacion_instalaciones', 
         'calificacion_limpieza', 'calificacion_puntualidad', 'calificacion_atencion'].forEach(campo => {
            const element = document.getElementById(campo);
            if (element) element.value = '';
        });
        
        // Resetear estrellas
        this.resetearEstrellas();
        
        // Mostrar modal
        modal.show();
        
        // Hacer scroll al inicio
        setTimeout(() => {
            const modalElement = document.getElementById('evaluacionModal');
            const modalBody = modalElement.querySelector('.modal-body');
            if (modalBody) {
                modalBody.scrollTop = 0;
            }
        }, 100);
    }

    configurarEvaluacionForm() {
        const form = document.getElementById('evaluacionForm');
        
        // Usar delegacion de eventos en el contenedor del formulario
        if (form) {
            // Evento de click
            form.addEventListener('click', (e) => {
                if (e.target.matches('.star-rating i')) {
                    const estrella = e.target;
                    const campo = estrella.dataset.campo;
                    const estrellasDelCampo = Array.from(estrella.parentElement.children);
                    const posicion = estrellasDelCampo.indexOf(estrella) + 1;
                    
                    // Establecer valor directamente
                    const input = document.getElementById(campo);
                    if (input) {
                        input.value = posicion;
                        console.log(`${campo} = ${posicion}`);
                    } else {
                        console.error(` Input ${campo} no encontrado`);
                    }
                    
                    // Actualizar estrellas visualmente
                    this.resaltarEstrellas(campo, posicion);
                }
            });
            
            // Evento de hover
            form.addEventListener('mouseover', (e) => {
                if (e.target.matches('.star-rating i')) {
                    const estrella = e.target;
                    const campo = estrella.dataset.campo;
                    const estrellasDelCampo = Array.from(estrella.parentElement.children);
                    const posicion = estrellasDelCampo.indexOf(estrella) + 1;
                    
                    this.resaltarEstrellas(campo, posicion);
                }
            });
        }
        
        // Configurar envio del formulario
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.enviarEvaluacion();
            });
        }
        
        // Configurar envio del formulario mediante el boton
        const enviarBtn = document.getElementById('enviarEvaluacionBtn');
        if (enviarBtn) {
            enviarBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.enviarEvaluacion();
            });
        }
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
        // Establecer valor en el input hidden
        const inputElement = document.getElementById(campo);
        if (inputElement) {
            inputElement.value = cantidad;
        }
        
        // Resaltar estrellas visualmente
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
            if (!form) {
                this.showAlert('Error al procesar el formulario', 'danger');
                return;
            }
            
            const formData = new FormData(form);
            
            // Obtener valores
            const citaId = formData.get('cita_id') || document.getElementById('evaluacionCitaId').value;
            const odontologoId = formData.get('odontologo_id') || document.getElementById('evaluacionOdontologoId').value;
            const calificacionServicio = formData.get('calificacion_servicio') || document.getElementById('calificacion_servicio').value;
            const calificacionOdontologo = formData.get('calificacion_odontologo') || document.getElementById('calificacion_odontologo').value;
            const calificacionInstalaciones = formData.get('calificacion_instalaciones') || document.getElementById('calificacion_instalaciones').value;
            const calificacionLimpieza = formData.get('calificacion_limpieza') || document.getElementById('calificacion_limpieza').value;
            const calificacionPuntualidad = formData.get('calificacion_puntualidad') || document.getElementById('calificacion_puntualidad').value;
            const calificacionAtencion = formData.get('calificacion_atencion') || document.getElementById('calificacion_atencion').value;
            const comentarios = formData.get('comentarios') || document.getElementById('comentarios').value || '';
            const recomendaria = (formData.get('recomendaria') === 'on' || document.getElementById('recomendaria')?.checked) ? 1 : 0;
            
            const evaluacionData = {
                cita_id: parseInt(citaId),
                odontologo_id: parseInt(odontologoId),
                calificacion_servicio: parseInt(calificacionServicio),
                calificacion_odontologo: parseInt(calificacionOdontologo),
                calificacion_instalaciones: parseInt(calificacionInstalaciones),
                calificacion_limpieza: parseInt(calificacionLimpieza),
                calificacion_puntualidad: parseInt(calificacionPuntualidad),
                calificacion_atencion: parseInt(calificacionAtencion),
                comentarios: comentarios,
                recomendaria: recomendaria
            };

            // Validar datos con mensajes especificos
            const camposFaltantes = [];
            if (!evaluacionData.calificacion_servicio) camposFaltantes.push('Calificacion del Servicio');
            if (!evaluacionData.calificacion_odontologo) camposFaltantes.push('Calificacion del Odontologo');
            if (!evaluacionData.calificacion_instalaciones) camposFaltantes.push('Calificacion de las Instalaciones');
            if (!evaluacionData.calificacion_limpieza) camposFaltantes.push('Calificacion de la Limpieza');
            if (!evaluacionData.calificacion_puntualidad) camposFaltantes.push('Calificacion de la Puntualidad');
            if (!evaluacionData.calificacion_atencion) camposFaltantes.push('Calificacion de la Atencion');
            
            if (camposFaltantes.length > 0) {
                this.showAlert(`Por favor completa: ${camposFaltantes.join(', ')}`, 'warning');
                return;
            }

            const response = await this.authFetch('/api/evaluaciones/crear', {
                method: 'POST',
                body: JSON.stringify(evaluacionData)
            });

            if (response) {
                const data = await response.json();
                if (data.success) {
                    this.showAlert('Evaluacion enviada exitosamente. ¡Gracias por tu retroalimentacion!', 'success');
                    
                    // Cerrar modal y recargar datos
                    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('evaluacionModal'));
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                    await this.loadEvaluaciones();
                } else {
                    this.showAlert(data.message || 'Error al enviar la evaluacion', 'danger');
                }
            }
        } catch (error) {
            console.error('Error al enviar la evaluacion:', error);
            this.showAlert('Error al enviar la evaluacion', 'danger');
        }
    }
    // Configurar formulario de pago rapido
    configurarPagoRapido() {
        const tipoServicioSelect = document.getElementById('tipoServicio');
        const precioInput = document.getElementById('precioServicio');
        const descripcionInput = document.getElementById('descripcionServicio');
        const pagoForm = document.getElementById('pagoRapidoForm');

        if (tipoServicioSelect && precioInput && descripcionInput) {
            // Actualizar precio cuando se selecciona un servicio
            tipoServicioSelect.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                const precio = selectedOption.dataset.precio;
                const servicio = selectedOption.text;
                
                if (precio && precio !== '0') {
                    precioInput.value = precio;
                    descripcionInput.value = servicio + ' - Clinica Dental Clinikdent';
                } else if (this.value === 'otro') {
                    precioInput.value = '';
                    descripcionInput.value = 'Servicio personalizado - Clinica Dental Clinikdent';
                    precioInput.focus();
                }
            });
        }

        if (pagoForm) {
            pagoForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.procesarPagoRapido();
            });
        }
    }

    // Procesar pago rapido
    async procesarPagoRapido() {
        try {
            const tipoServicio = document.getElementById('tipoServicio').value;
            const precio = document.getElementById('precioServicio').value;
            const descripcion = document.getElementById('descripcionServicio').value;

            // Validaciones
            if (!tipoServicio) {
                this.showAlert('Por favor selecciona un tipo de servicio', 'warning');
                return;
            }

            if (!precio || parseFloat(precio) < 1000) {
                this.showAlert('El precio debe ser mayor a $1,000', 'warning');
                return;
            }

            // Obtener datos del usuario
            const user = JSON.parse(localStorage.getItem('user'));
            const userId = user?.id;
            
            if (!userId) {
                this.showAlert('Error: No se pudo obtener la informacion del usuario', 'danger');
                return;
            }

            // Determinar titulo del servicio
            const tipoServicioSelect = document.getElementById('tipoServicio');
            const selectedOption = tipoServicioSelect.options[tipoServicioSelect.selectedIndex];
            const titulo = selectedOption.text.split(' - ')[0] || 'Servicio Dental';

            console.log('💳 Procesando pago rapido:', { titulo, precio, descripcion });

            // Mostrar loading en el boton
            const submitBtn = document.querySelector('#pagoRapidoForm button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';

            // Crear preferencia de pago
            const response = await this.authFetch('/api/mercadopago/crear-preferencia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    titulo: titulo,
                    descripcion: descripcion || `${titulo} - Cliente: ${user.nombre} ${user.apellido}`,
                    precio: parseFloat(precio),
                    cantidad: 1,
                    usuario_id: userId
                })
            });

            if (!response || !response.ok) {
                throw new Error('Error al crear la preferencia de pago');
            }

            const data = await response.json();
            console.log('💳 Respuesta de MercadoPago:', data);

            if (data.success && data.init_point) {
                // Mostrar modal de pago
                this.showPaymentModal(data, precio, titulo);
                
                // Limpiar formulario
                document.getElementById('pagoRapidoForm').reset();
                
                this.showAlert('Preferencia de pago creada exitosamente', 'success');
            } else {
                throw new Error(data.error || 'Error al procesar el pago');
            }

        } catch (error) {
            console.error(' Error en pago rapido:', error);
            this.showAlert('Error al procesar el pago: ' + error.message, 'danger');
        } finally {
            // Restaurar boton
            const submitBtn = document.querySelector('#pagoRapidoForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-credit-card me-2"></i>Proceder al Pago con MercadoPago';
            }
        }
    }

    // ==========================================
    // FUNCIONES DE UTILIDAD
    // ==========================================

    formatFecha(fecha) {
        if (!fecha) return 'No disponible';
        
        try {
            const date = new Date(fecha);
            if (isNaN(date.getTime())) {
                return 'Fecha invalida';
            }
            
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return 'Error en fecha';
        }
    }

    formatMoney(cantidad) {
        if (!cantidad || isNaN(cantidad)) return '0';
        
        try {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(cantidad).replace('COP', '').trim();
        } catch (error) {
            console.error('Error al formatear dinero:', error);
            return cantidad.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
    }

    // Metodo para cancelar factura pendiente
    async cancelarFactura(facturaId, concepto) {
        try {
            // Mostrar confirmacion
            const confirmacion = confirm(
                `¿Estas seguro de que deseas cancelar esta factura?\n\n` +
                `Concepto: ${concepto}\n` +
                `ID: ${facturaId}\n\n` +
                `Esta accion no se puede deshacer.`
            );
            
            if (!confirmacion) {
                return;
            }

            // Obtener datos del usuario
            const user = JSON.parse(localStorage.getItem('user'));
            const userId = user?.id || this.userData?.id;
            
            if (!userId) {
                throw new Error('No se pudo obtener el ID del usuario');
            }

            // Mostrar loading
            this.showAlert('Cancelando factura...', 'info');

            // Llamar al endpoint de cancelacion
            const response = await this.authFetch(`/api/mercadopago/cancelar-factura/${facturaId}?usuario_id=${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId
                }
            });

            if (!response || !response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al cancelar la factura');
            }

            const data = await response.json();
            console.log('Factura cancelada:', data);

            if (data.success) {
                this.showAlert(`Factura cancelada exitosamente: ${concepto}`, 'success');
                
                // Recargar las facturas para actualizar la vista
                setTimeout(() => {
                    this.loadPagos();
                }, 1500);
                
            } else {
                throw new Error(data.error || 'Error desconocido al cancelar la factura');
            }

        } catch (error) {
            console.error(' Error al cancelar factura:', error);
            this.showAlert('Error al cancelar la factura: ' + error.message, 'danger');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardPaciente = new DashboardPaciente();
});
