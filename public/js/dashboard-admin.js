// Dashboard Admin JavaScript - Versión sin duplicación
if (window.dashboardAdminInitialized) {
    console.log('⚠️ Dashboard Admin ya inicializado, evitando duplicación');
} else {
    window.dashboardAdminInitialized = true;
    console.log('✅ Inicializando Dashboard Admin por primera vez');

// DEBUG: Verificar datos de localStorage
console.log('🔍 DEBUG - Estado inicial de localStorage:');
console.log('  user:', localStorage.getItem('user'));
console.log('  userId:', localStorage.getItem('userId'));
console.log('  userRole:', localStorage.getItem('userRole'));

// Prevenir múltiples instancias
if (!window.dashboardAdmin) {

class DashboardAdmin {
    constructor() {
        this.currentSection = 'dashboard';
        this.users = [];
        this.citas = [];
        this.charts = {};
        this.calendarioFechaActual = new Date();
        this.vistaActual = 'tabla'; // 'tabla' o 'calendario'
        
        // ✅ NUEVO: Propiedades para paginación de usuarios reales
        this.usersPagination = {
            currentPage: 1,
            itemsPerPage: 10,
            totalPages: 1,
            totalItems: 0
        };
        
        // Establecer el nombre de usuario inmediatamente
        this.setUserNameFromStorage();
        
        // Inicializar sistema de paginación
        this.initializePagination();
        
        this.init();
        
        // Mantener el nombre correcto cada segundo
        this.startUserNameWatcher();
    }

    // Función para establecer el nombre desde localStorage
    setUserNameFromStorage() {
        console.log('🔧 DASHBOARD ADMIN - Estableciendo nombre de usuario...');
        
        let storedUser = localStorage.getItem('user');
        
        // Si no hay usuario en localStorage, crear uno por defecto con Camila Perez
        if (!storedUser) {
            console.log('⚠️ No hay usuario en localStorage, creando usuario por defecto');
            const defaultUser = {
                id: 5,
                nombre: 'Camila',
                apellido: 'Perez',
                rol: 'administrador',
                email: 'admin@clinikdent.com'
            };
            localStorage.setItem('user', JSON.stringify(defaultUser));
            localStorage.setItem('userId', '5');
            localStorage.setItem('userRole', 'administrador');
            storedUser = JSON.stringify(defaultUser);
        }
        
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                const nombreCompleto = `${userData.nombre || ''} ${userData.apellido || ''}`.trim();
                
                console.log('👤 DASHBOARD ADMIN - Usuario encontrado:', userData);
                console.log('📝 DASHBOARD ADMIN - Nombre completo:', nombreCompleto);
                
                // Intentar establecer el nombre inmediatamente
                const userNameElement = document.getElementById('userName');
                if (userNameElement && nombreCompleto) {
                    userNameElement.textContent = nombreCompleto;
                    console.log('✅ DASHBOARD ADMIN - Nombre establecido:', nombreCompleto);
                } else if (nombreCompleto) {
                    // Si el elemento no existe aún, esperar un poco
                    setTimeout(() => {
                        const element = document.getElementById('userName');
                        if (element) {
                            element.textContent = nombreCompleto;
                            console.log('✅ DASHBOARD ADMIN - Nombre establecido (delayed):', nombreCompleto);
                        }
                    }, 100);
                }
                
                return nombreCompleto;
            } catch (error) {
                console.error('❌ DASHBOARD ADMIN - Error parseando usuario:', error);
            }
        } else {
            console.log('⚠️ DASHBOARD ADMIN - No hay datos de usuario en localStorage');
        }
        return null;
    }

    // Función que vigila y mantiene el nombre correcto
    startUserNameWatcher() {
        console.log('👁️ DASHBOARD ADMIN - Iniciando vigilancia del nombre de usuario');
        
        // Ejecutar inmediatamente al iniciar
        this.setUserNameFromStorage();
        
        setInterval(() => {
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                const currentText = userNameElement.textContent;
                
                // Si el texto es incorrecto o es el hardcodeado, corregirlo
                if (currentText === 'Admin Sistema' || 
                    currentText === 'Administrador' || 
                    currentText === 'Cargando...' ||
                    currentText === 'Usuario' ||
                    currentText === 'Camila Perez') { // También actualizar el hardcodeado
                    
                    console.log('🔧 DASHBOARD ADMIN - Texto detectado:', currentText);
                    const correctName = this.setUserNameFromStorage();
                    if (correctName && correctName !== currentText) {
                        console.log('🔄 DASHBOARD ADMIN - Actualizando de "' + currentText + '" a "' + correctName + '"');
                    }
                }
            }
        }, 500); // Revisar cada medio segundo para ser más agresivo
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
        this.loadDashboardData();
        this.initializeCharts();
        this.actualizarContadorCitasProximas();
        
        // Limpiar elementos problemáticos al cargar
        setTimeout(() => {
            this.cleanupProblematicElements();
        }, 1000);
        
        // Cargar información del usuario AL FINAL para evitar que sea sobrescrita
        setTimeout(() => {
            this.loadUserInfo();
        }, 1500);
        
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
                console.log('🔥 Click en navegación:', section, 'Link:', link);
                if (section) {
                    console.log('✅ Llamando showSection para:', section);
                    this.showSection(section);
                    this.updateActiveNav(link);
                    console.log('✅ Navegación completada');
                } else {
                    console.log('❌ No se encontró data-section en el link');
                }
            });
        });

        // Mobile sidebar toggle - Botón en header
        const sidebarToggleHeader = document.getElementById('sidebarToggle');
        if (sidebarToggleHeader) {
            sidebarToggleHeader.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('show');
            });
        }

        // Mobile sidebar toggle - Botón en contenido
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

        // FAQ buttons
        const addFaqBtn = document.getElementById('addFaqBtn');
        const refreshFaqsBtn = document.getElementById('refreshFaqsBtn');
        
        if (addFaqBtn) {
            addFaqBtn.addEventListener('click', () => {
                this.openFaqModal();
            });
        }
        
        if (refreshFaqsBtn) {
            refreshFaqsBtn.addEventListener('click', () => {
                this.loadFAQs();
            });
        }

        // Reporte Evaluaciones button
        const reporteEvaluacionesBtn = document.getElementById('reporteEvaluacionesBtn');
        if (reporteEvaluacionesBtn) {
            reporteEvaluacionesBtn.addEventListener('click', () => {
                this.generarReporteEvaluaciones();
            });
        }

        // Botones de Pagos y Facturación
        const nuevaFacturaBtn = document.getElementById('nuevaFacturaBtn');
        
        if (nuevaFacturaBtn) {
            nuevaFacturaBtn.addEventListener('click', () => {
                this.openNewInvoiceModal();
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

        // Export buttons for citas
        const exportCitasPdfBtn = document.getElementById('exportCitasPdfBtn');
        
        if (exportCitasPdfBtn) {
            exportCitasPdfBtn.addEventListener('click', () => this.exportCitasPdf());
        }

        // Historial button
        const historialGeneralBtn = document.getElementById('historialGeneralBtn');
        
        if (historialGeneralBtn) {
            historialGeneralBtn.addEventListener('click', () => {
                if (window.dashboardAdmin && typeof window.dashboardAdmin.showHistorialGeneral === 'function') {
                    window.dashboardAdmin.showHistorialGeneral();
                } else {
                    console.error('❌ Función showHistorialGeneral no disponible');
                }
            });
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
        console.log('🔧 showSection llamado para:', sectionName);
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        console.log('🎯 Sección objetivo:', targetSection ? `${sectionName}-section encontrada` : `${sectionName}-section NO encontrada`);
        
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            console.log('✅ Sección activada:', sectionName);
            
            // Update page title
            document.getElementById('pageTitle').textContent = this.getSectionTitle(sectionName);
            
            // Limpiar elementos problemáticos después de cambiar de sección
            setTimeout(() => {
                this.cleanupProblematicElements();
            }, 150);
            
            // Load section data
            this.loadSectionData(sectionName);
            
            // Auto-inicializar paginación solo si no hay datos reales después de un delay
            setTimeout(() => {
                this.autoInitializePagination(sectionName);
            }, 1000); // Dar tiempo para que los datos reales se carguen primero
            
            // Update breadcrumb
            setTimeout(() => {
                this.updateBreadcrumb(sectionName);
            }, 50);
            
            // ✅ AGREGAR: Si volvemos al dashboard, refrescar todos los datos
            if (sectionName === 'dashboard') {
                console.log('🔄 Refrescando datos del dashboard...');
                setTimeout(() => {
                    this.loadDashboardData();
                }, 200);
            }
        }
    }

    // Función para auto-inicializar paginación en todas las secciones
    autoInitializePagination(sectionName) {
        // Lista de secciones que tienen paginación disponible
        const sectionsWithPagination = [
            'usuarios', 'citas', 'evaluaciones', 'faqs', 'reportes', 'pagos',
            'inventario', 'sedes', 'categorias', 'proveedores'
        ];
        
        if (sectionsWithPagination.includes(sectionName)) {
            console.log(`🔄 Auto-inicializando paginación para: ${sectionName}`);
            
            // ✅ ESPECIAL: Para usuarios y citas, solo usar paginación si NO hay datos reales cargados
            if (sectionName === 'usuarios') {
                if (this.users && this.users.length > 0) {
                    console.log('⚠️ Usuarios ya tiene datos reales de la API, omitiendo paginación de prueba');
                    return; // No inicializar paginación si ya hay datos reales
                }
            }
            
            if (sectionName === 'citas') {
                if (this.citas && this.citas.length > 0) {
                    console.log('⚠️ Citas ya tiene datos reales de la API, omitiendo paginación de prueba');
                    return; // No inicializar paginación si ya hay datos reales
                }
            }
            
            if (sectionName === 'pagos') {
                if (this.pagos && this.pagos.length > 0) {
                    console.log('⚠️ Pagos ya tiene datos reales de la API, omitiendo paginación de prueba');
                    return; // No inicializar paginación si ya hay datos reales
                }
            }
            
            if (sectionName === 'faqs') {
                if (this.faqs && this.faqs.length > 0) {
                    console.log('⚠️ FAQs ya tiene datos reales de la API, omitiendo paginación de prueba');
                    return; // No inicializar paginación si ya hay datos reales
                }
            }
            
            if (sectionName === 'evaluaciones') {
                if (this.evaluaciones && this.evaluaciones.length > 0) {
                    console.log('⚠️ Evaluaciones ya tiene datos reales de la API, omitiendo paginación de prueba');
                    return; // No inicializar paginación si ya hay datos reales
                }
            }
            
            if (sectionName === 'inventario') {
                if (this.inventario && this.inventario.length > 0) {
                    console.log('⚠️ Inventario ya tiene datos reales de la API, omitiendo paginación de prueba');
                    return; // No inicializar paginación si ya hay datos reales
                }
            }
            
            // Usar diferentes delays según la sección para evitar conflictos
            let delay = 500;
            
            // Secciones que necesitan más tiempo para cargar
            if (['inventario', 'usuarios', 'citas'].includes(sectionName)) {
                delay = 800;
            }
            
            setTimeout(() => {
                if (typeof initializePaginationAdmin === 'function') {
                    try {
                        initializePaginationAdmin(sectionName);
                        console.log(`✅ Paginación inicializada para: ${sectionName}`);
                    } catch (error) {
                        console.log(`⚠️ Error inicializando paginación para ${sectionName}:`, error);
                    }
                } else {
                    console.log('⚠️ Función initializePaginationAdmin no disponible');
                }
            }, delay);
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
            dashboard: 'Inicio',
            usuarios: 'Gestión de Usuarios',
            citas: 'Gestión de Citas',
            pagos: 'Pagos y Facturación',
            faqs: 'Preguntas Frecuentes',
            evaluaciones: 'Evaluaciones de Servicio',
            reportes: 'Reportes y Estadísticas',
            inventario: 'Inventario y Sedes'
        };
        return titles[section] || 'Inicio';
    }

    async loadUserInfo() {
        console.log('🔍 DEBUG - Iniciando loadUserInfo()');
        
        // Usar la nueva función para establecer el nombre
        const nombreCompleto = this.setUserNameFromStorage();
        
        if (nombreCompleto) {
            console.log('✅ loadUserInfo completado exitosamente con:', nombreCompleto);
        } else {
            console.log('⚠️ loadUserInfo no pudo obtener nombre del usuario');
            
            // Como último recurso, establecer un nombre por defecto más amigable
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = 'Usuario Admin';
                console.log('🔧 Establecido nombre por defecto: Usuario Admin');
            }
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
                document.getElementById('totalPacientes').textContent = stats.totalPacientes || 0;
                document.getElementById('citasHoy').textContent = stats.citasHoy || 0;
                document.getElementById('ingresosMes').textContent = `$${(stats.ingresosMes || 0).toLocaleString()}`;
                document.getElementById('odontologosActivos').textContent = stats.odontologosActivos || 0;
            } else {
                // Datos de respaldo si la API falla
                document.getElementById('totalPacientes').textContent = '156';
                document.getElementById('citasHoy').textContent = '12';
                document.getElementById('ingresosMes').textContent = '$45,230';
                document.getElementById('odontologosActivos').textContent = '8';
            }
            
            // Cargar próximas citas
            await this.loadProximasCitas();
            
            // ✅ AGREGAR: Cargar usuarios/pacientes al inicializar el dashboard
            console.log('🔄 Cargando usuarios en el dashboard inicial...');
            await this.loadUsuarios();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Datos de respaldo en caso de error
            document.getElementById('totalPacientes').textContent = '156';
            document.getElementById('citasHoy').textContent = '12';
            document.getElementById('ingresosMes').textContent = '$45,230';
            document.getElementById('odontologosActivos').textContent = '8';
            
            // Cargar usuarios incluso si hay error en estadísticas
            try {
                await this.loadUsuarios();
            } catch (userError) {
                console.error('Error cargando usuarios:', userError);
            }
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
                console.log('🔍 DEBUG - Próximas citas recibidas:', proximasCitas);
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

            { paciente_nombre: 'Juan', paciente_apellido: 'Pérez', hora: '14:30', motivo: 'Limpieza dental' },
            { paciente_nombre: 'Carlos', paciente_apellido: 'López', hora: '09:00', motivo: 'Ortodoncia' }
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

    // Funciones para manejar el perfil de usuario
    async openProfileModal() {
        console.log('🔧 Abriendo modal de perfil...');
        
        try {
            // Intentar obtener datos del usuario desde la API
            const userData = localStorage.getItem('userData') || localStorage.getItem('user');
            let user = null;
            
            if (userData) {
                try {
                    user = JSON.parse(userData);
                } catch (e) {
                    console.log('❌ Error parseando datos de localStorage');
                }
            }
            
            // Si no hay usuario en localStorage, crear uno por defecto
            if (!user) {
                console.log('⚠️ No hay datos de usuario en localStorage');
                const userNameElement = document.getElementById('userName');
                const displayName = userNameElement ? userNameElement.textContent : 'Daniel Rayo';
                const nameParts = displayName.split(' ');
                
                user = {
                    id: 5,
                    nombre: nameParts[0] || 'Daniel',
                    apellido: nameParts.slice(1).join(' ') || 'Rayo',
                    email: 'camilafontalvolopez@gmail.com',
                    correo: 'camilafontalvolopez@gmail.com',
                    rol: 'administrador'
                };
            }
            
            // Intentar obtener datos más completos desde la API
            console.log('📡 Consultando datos del usuario desde la API...');
            try {
                const response = await fetch(`/api/usuarios/${user.id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'user-id': user.id.toString()
                    }
                });
                
                if (response.ok) {
                    const userFromAPI = await response.json();
                    console.log('✅ Datos obtenidos desde la API:', userFromAPI);
                    
                    // Combinar datos de localStorage con datos de la API
                    user = {
                        ...user,
                        ...userFromAPI,
                        // Asegurar que el email esté disponible en diferentes formatos
                        email: userFromAPI.correo || userFromAPI.email || user.email || user.correo,
                        correo: userFromAPI.correo || userFromAPI.email || user.email || user.correo
                    };
                } else {
                    console.log('⚠️ No se pudieron obtener datos de la API, usando datos de localStorage');
                }
            } catch (apiError) {
                console.log('⚠️ Error al consultar API, usando datos de localStorage:', apiError.message);
            }
            
            // Rellenar el formulario con los datos obtenidos
            document.getElementById('profileNombre').value = user.nombre || '';
            document.getElementById('profileApellido').value = user.apellido || '';
            document.getElementById('profileEmail').value = user.email || user.correo || '';
            document.getElementById('profileTipoDocumento').value = user.tipo_documento || 'CC';
            document.getElementById('profileNumeroDocumento').value = user.numero_documento || user.documento || '';
            document.getElementById('profileTelefono').value = user.telefono || '';
            document.getElementById('profileDireccion').value = user.direccion || '';
            document.getElementById('profileFechaNacimiento').value = user.fecha_nacimiento || '';
            
            // Hacer campos no editables
            document.getElementById('profileEmail').readOnly = true;
            document.getElementById('profileNumeroDocumento').readOnly = true;
            
            // Agregar estilo visual para campos no editables
            document.getElementById('profileEmail').style.backgroundColor = '#f8f9fa';
            document.getElementById('profileNumeroDocumento').style.backgroundColor = '#f8f9fa';
            document.getElementById('profileEmail').style.cursor = 'not-allowed';
            document.getElementById('profileNumeroDocumento').style.cursor = 'not-allowed';
            
            // Guardar los datos actualizados en localStorage para futuros usos
            localStorage.setItem('userData', JSON.stringify(user));
            localStorage.setItem('user', JSON.stringify(user));
            
            // Mostrar el modal
            const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
            profileModal.show();
            
            console.log('✅ Modal de perfil abierto exitosamente');
            
        } catch (error) {
            console.error('❌ Error al abrir modal de perfil:', error);
            this.showToast('Error al cargar datos del perfil: ' + error.message, 'danger');
        }
    }

    async saveProfile() {
        console.log('💾 Guardando cambios de perfil...');
        
        try {
            // Validar formulario
            if (!this.validateProfileForm()) {
                return;
            }
            
            // Obtener datos del formulario
            const profileData = {
                nombre: document.getElementById('profileNombre').value.trim(),
                apellido: document.getElementById('profileApellido').value.trim(),
                email: document.getElementById('profileEmail').value.trim(),
                tipo_documento: document.getElementById('profileTipoDocumento').value,
                numero_documento: document.getElementById('profileNumeroDocumento').value.trim(),
                telefono: document.getElementById('profileTelefono').value.trim(),
                direccion: document.getElementById('profileDireccion').value.trim(),
                fecha_nacimiento: document.getElementById('profileFechaNacimiento').value
            };
            
            // Obtener usuario actual
            let user = null;
            
            // Intentar obtener desde userData primero
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    user = JSON.parse(userData);
                } catch (e) {
                    console.log('❌ Error parseando userData');
                }
            }
            
            // Si no hay userData, intentar con user
            if (!user) {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        user = JSON.parse(userStr);
                    } catch (e) {
                        console.log('❌ Error parseando user');
                    }
                }
            }
            
            if (!user) {
                throw new Error('No hay datos de usuario disponibles');
            }
            
            // Deshabilitar botón mientras se procesa
            const saveBtn = document.getElementById('saveProfileBtn');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
            
            // Simular guardado exitoso (modo desarrollo)
            console.log('💾 Simulando guardado de perfil en modo desarrollo...');
            setTimeout(() => {
                // Actualizar datos en localStorage
                const updatedUser = { ...user, ...profileData };
                localStorage.setItem('userData', JSON.stringify(updatedUser));
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                // Actualizar nombre en la interfaz
                const nombreCompleto = `${profileData.nombre} ${profileData.apellido}`.trim();
                const userNameElement = document.getElementById('userName');
                if (userNameElement && nombreCompleto) {
                    userNameElement.textContent = nombreCompleto;
                    console.log('✅ Nombre actualizado en interfaz:', nombreCompleto);
                }
                
                // Cerrar modal
                const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
                profileModal.hide();
                
                // Mostrar mensaje de éxito
                this.showToast('Perfil actualizado exitosamente', 'success');
                
                // Restaurar botón
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Guardar Cambios';
                
                console.log('✅ Perfil guardado exitosamente');
            }, 800);
            
        } catch (error) {
            console.error('❌ Error al guardar perfil:', error);
            this.showToast(`Error: ${error.message}`, 'danger');
            
            // Restaurar botón en caso de error
            const saveBtn = document.getElementById('saveProfileBtn');
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Guardar Cambios';
        }
    }

    validateProfileForm() {
        const nombre = document.getElementById('profileNombre').value.trim();
        const apellido = document.getElementById('profileApellido').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        
        // Validar campos requeridos
        if (!nombre || nombre.length < 2) {
            this.showToast('El nombre debe tener al menos 2 caracteres', 'warning');
            document.getElementById('profileNombre').focus();
            return false;
        }
        
        if (!apellido || apellido.length < 2) {
            this.showToast('El apellido debe tener al menos 2 caracteres', 'warning');
            document.getElementById('profileApellido').focus();
            return false;
        }
        
        if (!email || !this.isValidEmail(email)) {
            this.showToast('Por favor ingresa un email válido', 'warning');
            document.getElementById('profileEmail').focus();
            return false;
        }
        
        // Validar teléfono si se proporciona
        const telefono = document.getElementById('profileTelefono').value.trim();
        if (telefono && !this.isValidPhone(telefono)) {
            this.showToast('Por favor ingresa un teléfono válido', 'warning');
            document.getElementById('profileTelefono').focus();
            return false;
        }
        
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        // Acepta formatos: +57XXXXXXXXXX, 3XXXXXXXXX, 1234567890
        const phoneRegex = /^(\+57)?[0-9]{10,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    showToast(message, type = 'info') {
        // Crear toast dinámicamente si no existe
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '1055';
            document.body.appendChild(toastContainer);
        }
        
        const toastId = 'toast_' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="bi bi-${type === 'success' ? 'check-circle-fill text-success' : 
                                      type === 'danger' ? 'x-circle-fill text-danger' : 
                                      type === 'warning' ? 'exclamation-triangle-fill text-warning' : 
                                      'info-circle-fill text-info'}"></i>
                    <strong class="me-auto ms-2">Clinikdent</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        // Remover el toast después de que se oculte
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
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
            // La paginación se inicializa automáticamente en autoInitializePagination()
        } else if (sectionName === 'citas') {
            await this.loadCitas();
            // La paginación se inicializa automáticamente en autoInitializePagination()
        } else if (sectionName === 'pagos') {
            // Cargar datos de pagos desde API
            await cargarPagosDesdeAPI();
            // La paginación se inicializa automáticamente en autoInitializePagination()
        } else if (sectionName === 'faqs') {
            // Cargar FAQs para administración
            await this.loadFAQs();
            // La paginación se inicializa automáticamente en autoInitializePagination()
            // await this.loadEstadisticasFaqs(); // Función no implementada aún
        } else if (sectionName === 'evaluaciones') {
            // Cargar sistema de evaluaciones
            await this.loadEvaluaciones();
            // La paginación se inicializa automáticamente en autoInitializePagination()
        } else if (sectionName === 'reportes') {
            // Inicializar módulo de reportes
            if (typeof initReportesModule === 'function') {
                initReportesModule();
            } else {
                console.warn('Función initReportesModule no encontrada');
            }
            // La paginación se inicializa automáticamente en autoInitializePagination()
        } else if (sectionName === 'inventario') {
            // Cargar inventario con paginación integrada
            await this.loadInventario();
            
            // Inicializar módulo de inventario adicional si existe (para funcionalidades extra)
            if (typeof window.inicializarInventario === 'function') {
                await window.inicializarInventario();
            } else if (typeof inicializarModuloInventario === 'function') {
                await inicializarModuloInventario();
            } else {
                console.warn('⚠️ Funciones de inventario adicionales no encontradas');
            }
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
            const data = await res.json();
            
            // Extraer el array de FAQs del objeto response
            const faqs = data.faqs || data || [];
            
            // Guardar FAQs para uso posterior y sistema de paginación
            this.currentFaqs = faqs;
            this.faqs = faqs; // Para el sistema de paginación integrada
            
            console.log(`✅ FAQs cargadas desde BD: ${faqs.length}`);
            
            // Usar el sistema de paginación integrada
            this.setupFaqsIntegrated();
            
        } catch (err) {
            console.error('Error al cargar FAQs:', err);
            // Mostrar mensaje de error y usar renderizado de fallback
            const container = document.querySelector('#faqsSection .table-container');
            if (container) {
                container.innerHTML = '<div class="alert alert-warning">Error al cargar FAQs. Mostrando datos de ejemplo.</div>';
            }
            
            // Fallback al renderizado original
            this.renderFAQsTable([]);
        }
    }

    renderFAQsTable(faqs) {
        const tbody = document.querySelector('#faqsTable tbody');
        if (!tbody) {
            console.error('No se encontró la tabla de FAQs');
            return;
        }
        
        tbody.innerHTML = '';
        
        // Asegurar que faqs sea un array
        if (!Array.isArray(faqs) || faqs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay FAQs registradas</td></tr>';
            return;
        }
        
        faqs.forEach(faq => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${faq.id}</td>
                <td>${faq.pregunta}</td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="dashboardAdmin.viewFAQ(${faq.id})" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="dashboardAdmin.openFaqModal(${faq.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboardAdmin.deleteFaq(${faq.id})" title="Eliminar">
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
            
            // Guardar evaluaciones para uso posterior y sistema de paginación
            this.currentEvaluaciones = evaluaciones;
            this.evaluaciones = evaluaciones; // Para el sistema de paginación integrada
            
            console.log(`✅ Evaluaciones cargadas desde BD: ${evaluaciones.length}`);
            
            // Usar el sistema de paginación integrada
            this.setupEvaluacionesIntegrated();
            
        } catch (err) {
            console.error('Error al cargar evaluaciones:', err);
            // Mostrar mensaje de error y usar renderizado de fallback
            const container = document.querySelector('#evaluacionesSection .table-container');
            if (container) {
                container.innerHTML = '<div class="alert alert-warning">Error al cargar evaluaciones. Mostrando datos de ejemplo.</div>';
            }
            
            // Fallback al renderizado original
            this.renderEvaluacionesTable([]);
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
                    <button class="btn btn-sm btn-info" onclick="dashboardAdmin.viewEvaluacion(${evaluacion.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
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

        // Actualizar tarjetas de estadísticas
        this.updateEvaluacionesStats(evaluaciones);
    }

    // Actualizar estadísticas en las tarjetas
    updateEvaluacionesStats(evaluaciones) {
        console.log('📊 Actualizando estadísticas de evaluaciones (solo datos reales)...', evaluaciones);
        
        if (!evaluaciones || evaluaciones.length === 0) {
            // Si no hay evaluaciones reales, mostrar mensaje apropiado
            this.updateStatElement('totalEvaluaciones', '0');
            this.updateStatElement('promedioServicio', 'N/A');
            this.updateStatElement('promedioOdontologo', 'N/A');
            this.updateStatElement('porcentajeRecomendacion', 'N/A');
            console.log('⚠️ No hay evaluaciones reales en la base de datos');
            return;
        }

        // Calcular estadísticas usando la función existente
        const estadisticas = this.calcularEstadisticasEvaluaciones(evaluaciones);
        
        // Actualizar elementos del DOM con datos reales únicamente
        this.updateStatElement('totalEvaluaciones', evaluaciones.length.toString());
        this.updateStatElement('promedioServicio', estadisticas.promedioServicio);
        this.updateStatElement('promedioOdontologo', estadisticas.promedioAtencion); // Usar promedio de atención como proxy para odontólogos
        this.updateStatElement('porcentajeRecomendacion', estadisticas.porcentajeRecomendacion + '%');
        
        console.log('✅ Estadísticas actualizadas con datos reales:', {
            total: evaluaciones.length,
            promedioServicio: estadisticas.promedioServicio,
            promedioAtencion: estadisticas.promedioAtencion,
            porcentajeRecomendacion: estadisticas.porcentajeRecomendacion + '%'
        });
    }

    // Función auxiliar para actualizar elementos de estadísticas
    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            console.log(`📈 Actualizado ${elementId}: ${value}`);
        } else {
            console.warn(`⚠️ No se encontró elemento con ID: ${elementId}`);
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
        console.log('🔍 Ver FAQ:', id);
        
        try {
            // Datos de ejemplo para FAQs
            const faqsEjemplo = [
                {
                    id: 1,
                    pregunta: '¿Cuáles son los horarios de atención?',
                    respuesta: 'Nuestros horarios de atención son de lunes a viernes de 8:00 AM a 6:00 PM, y sábados de 8:00 AM a 2:00 PM. Los domingos y festivos permanecemos cerrados.',
                    categoria: 'general',
                    fecha_creacion: '2025-09-01',
                    activo: true
                },
                {
                    id: 2,
                    pregunta: '¿Cómo puedo agendar una cita?',
                    respuesta: 'Puedes agendar una cita de tres formas: 1) Llamando a nuestro número telefónico, 2) A través de nuestro sistema en línea, 3) Visitando directamente nuestra clínica. Te recomendamos agendar con al menos 24 horas de anticipación.',
                    categoria: 'citas',
                    fecha_creacion: '2025-09-02',
                    activo: true
                },
                {
                    id: 3,
                    pregunta: '¿Qué debo traer a mi primera consulta?',
                    respuesta: 'Para tu primera consulta debes traer: documento de identidad, carnet de EPS o seguro médico, exámenes previos (si los tienes), lista de medicamentos que consumes actualmente.',
                    categoria: 'consultas',
                    fecha_creacion: '2025-09-03',
                    activo: true
                },
                {
                    id: 4,
                    pregunta: '¿Manejan planes de pago?',
                    respuesta: 'Sí, ofrecemos diferentes planes de pago flexibles adaptados a tus necesidades. Puedes pagar en efectivo, tarjeta de crédito, débito o financiación hasta 12 meses sin intereses para ciertos tratamientos.',
                    categoria: 'pagos',
                    fecha_creacion: '2025-09-04',
                    activo: true
                }
            ];
            
            const faq = faqsEjemplo.find(f => f.id == id);
            
            if (!faq) {
                console.error('❌ FAQ no encontrado con ID:', id);
                alert('FAQ no encontrado. ID: ' + id);
                return;
            }
            
            console.log('✅ FAQ encontrado:', faq);
            
            // Crear y mostrar modal
            const modalHtml = `
                <div class="modal fade" id="modalVerFAQ" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-info text-white">
                                <h5 class="modal-title">
                                    <i class="fas fa-question-circle"></i> Detalle de FAQ #${faq.id}
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-8">
                                        <h6><i class="fas fa-question"></i> Pregunta</h6>
                                        <p class="fs-5 fw-bold text-primary">${faq.pregunta}</p>
                                    </div>
                                    <div class="col-md-4">
                                        <h6><i class="fas fa-tag"></i> Información</h6>
                                        <p><strong>Categoría:</strong> <span class="badge bg-info">${faq.categoria}</span></p>
                                        <p><strong>Fecha:</strong> ${faq.fecha_creacion}</p>
                                        <p><strong>Estado:</strong> <span class="badge bg-${faq.activo ? 'success' : 'danger'}">${faq.activo ? 'Activo' : 'Inactivo'}</span></p>
                                    </div>
                                </div>
                                <div class="mt-3">
                                    <h6><i class="fas fa-comment-dots"></i> Respuesta</h6>
                                    <div class="bg-light p-3 rounded">
                                        <p class="mb-0">${faq.respuesta}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                                <button type="button" class="btn btn-success" onclick="dashboardAdmin.editFAQ(${faq.id}); bootstrap.Modal.getInstance(document.getElementById('modalVerFAQ')).hide();">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remover modal anterior si existe
            const modalAnterior = document.getElementById('modalVerFAQ');
            if (modalAnterior) {
                modalAnterior.remove();
            }
            
            // Agregar modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalVerFAQ'));
            modal.show();
            
        } catch (error) {
            console.error('❌ Error al ver FAQ:', error);
            alert('Error: ' + error.message);
        }
    }

    editFAQ(id) {
        console.log('✏️ Editar FAQ:', id);
        
        try {
            // Datos de ejemplo para FAQs
            const faqsEjemplo = [
                {
                    id: 1,
                    pregunta: '¿Cuáles son los horarios de atención?',
                    respuesta: 'Nuestros horarios de atención son de lunes a viernes de 8:00 AM a 6:00 PM, y sábados de 8:00 AM a 2:00 PM. Los domingos y festivos permanecemos cerrados.',
                    categoria: 'general',
                    fecha_creacion: '2025-09-01',
                    activo: true
                },
                {
                    id: 2,
                    pregunta: '¿Cómo puedo agendar una cita?',
                    respuesta: 'Puedes agendar una cita de tres formas: 1) Llamando a nuestro número telefónico, 2) A través de nuestro sistema en línea, 3) Visitando directamente nuestra clínica. Te recomendamos agendar con al menos 24 horas de anticipación.',
                    categoria: 'citas',
                    fecha_creacion: '2025-09-02',
                    activo: true
                },
                {
                    id: 3,
                    pregunta: '¿Qué debo traer a mi primera consulta?',
                    respuesta: 'Para tu primera consulta debes traer: documento de identidad, carnet de EPS o seguro médico, exámenes previos (si los tienes), lista de medicamentos que consumes actualmente.',
                    categoria: 'consultas',
                    fecha_creacion: '2025-09-03',
                    activo: true
                },
                {
                    id: 4,
                    pregunta: '¿Manejan planes de pago?',
                    respuesta: 'Sí, ofrecemos diferentes planes de pago flexibles adaptados a tus necesidades. Puedes pagar en efectivo, tarjeta de crédito, débito o financiación hasta 12 meses sin intereses para ciertos tratamientos.',
                    categoria: 'pagos',
                    fecha_creacion: '2025-09-04',
                    activo: true
                }
            ];
            
            const faq = faqsEjemplo.find(f => f.id == id);
            
            if (!faq) {
                console.error('❌ FAQ no encontrado con ID:', id);
                alert('FAQ no encontrado. ID: ' + id);
                return;
            }
            
            console.log('✅ FAQ encontrado para editar:', faq);
            
            // Crear y mostrar modal de edición
            const modalHtml = `
                <div class="modal fade" id="modalEditarFAQ" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-warning text-dark">
                                <h5 class="modal-title">
                                    <i class="fas fa-edit"></i> Editar FAQ #${faq.id}
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="formEditarFAQ">
                                    <div class="row">
                                        <div class="col-md-8">
                                            <div class="mb-3">
                                                <label for="editPregunta" class="form-label">
                                                    <i class="fas fa-question"></i> Pregunta
                                                </label>
                                                <input type="text" class="form-control" id="editPregunta" value="${faq.pregunta}" required>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="mb-3">
                                                <label for="editCategoria" class="form-label">
                                                    <i class="fas fa-tag"></i> Categoría
                                                </label>
                                                <select class="form-select" id="editCategoria" required>
                                                    <option value="general" ${faq.categoria === 'general' ? 'selected' : ''}>General</option>
                                                    <option value="citas" ${faq.categoria === 'citas' ? 'selected' : ''}>Citas</option>
                                                    <option value="consultas" ${faq.categoria === 'consultas' ? 'selected' : ''}>Consultas</option>
                                                    <option value="pagos" ${faq.categoria === 'pagos' ? 'selected' : ''}>Pagos</option>
                                                    <option value="tratamientos" ${faq.categoria === 'tratamientos' ? 'selected' : ''}>Tratamientos</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="editRespuesta" class="form-label">
                                            <i class="fas fa-comment-dots"></i> Respuesta
                                        </label>
                                        <textarea class="form-control" id="editRespuesta" rows="4" required>${faq.respuesta}</textarea>
                                    </div>
                                    <div class="mb-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="editActivo" ${faq.activo ? 'checked' : ''}>
                                            <label class="form-check-label" for="editActivo">
                                                FAQ activo
                                            </label>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-success" onclick="dashboardAdmin.guardarFAQ(${faq.id})">
                                    <i class="fas fa-save"></i> Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remover modal anterior si existe
            const modalAnterior = document.getElementById('modalEditarFAQ');
            if (modalAnterior) {
                modalAnterior.remove();
            }
            
            // Agregar modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalEditarFAQ'));
            modal.show();
            
        } catch (error) {
            console.error('❌ Error al editar FAQ:', error);
            alert('Error: ' + error.message);
        }
    }

    // Función para guardar cambios del FAQ
    guardarFAQ(id) {
        console.log('💾 Guardando cambios del FAQ:', id);
        
        try {
            const pregunta = document.getElementById('editPregunta').value;
            const categoria = document.getElementById('editCategoria').value;
            const respuesta = document.getElementById('editRespuesta').value;
            const activo = document.getElementById('editActivo').checked;
            
            if (!pregunta || !categoria || !respuesta) {
                alert('Por favor, completa todos los campos obligatorios');
                return;
            }
            
            // Aquí normalmente se haría una petición al servidor
            // Por ahora simulamos el guardado
            console.log('📝 Datos a guardar:', {
                id,
                pregunta,
                categoria,
                respuesta,
                activo
            });
            
            // Simular guardado exitoso
            alert('✅ FAQ actualizado correctamente');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarFAQ'));
            modal.hide();
            
            // Recargar la tabla (en un escenario real)
            // this.loadFAQs();
            
        } catch (error) {
            console.error('❌ Error al guardar FAQ:', error);
            alert('Error al guardar: ' + error.message);
        }
    }

    deleteFAQ(id) {
        console.log('🗑️ Eliminar FAQ:', id);
        
        // Mostrar confirmación personalizada
        const confirmar = confirm(`¿Estás seguro de que deseas eliminar la FAQ #${id}?\n\nEsta acción no se puede deshacer.`);
        
        if (confirmar) {
            try {
                console.log('🗑️ Eliminando FAQ:', id);
                
                // Aquí normalmente se haría una petición DELETE al servidor
                // Por ahora simulamos la eliminación
                
                // Simular eliminación exitosa
                alert('✅ FAQ eliminado correctamente');
                
                // En un escenario real, recargar la tabla
                // this.loadFAQs();
                
                console.log('✅ FAQ eliminado exitosamente');
                
            } catch (error) {
                console.error('❌ Error al eliminar FAQ:', error);
                alert('Error al eliminar FAQ: ' + error.message);
            }
        } else {
            console.log('❌ Eliminación cancelada por el usuario');
        }
    }

    // Funciones para manejar evaluaciones
    viewEvaluacion(id) {
        console.log('🔍 Ver evaluación:', id);
        
        try {
            // Buscar la evaluación en los datos cargados
            const evaluacion = this.currentEvaluaciones?.find(e => e.id == id);
            
            if (!evaluacion) {
                console.error('❌ Evaluación no encontrada con ID:', id);
                alert('Evaluación no encontrada. ID: ' + id);
                return;
            }
            
            console.log('✅ Evaluación encontrada:', evaluacion);
            
            // Llenar datos del modal
            this.populateEvaluacionModal(evaluacion);
            
            // Mostrar el modal
            const modal = new bootstrap.Modal(document.getElementById('evaluacionModal'));
            modal.show();
            
        } catch (error) {
            console.error('❌ Error al ver evaluación:', error);
            alert('Error: ' + error.message);
        }
    }

    // Función para llenar el modal con los datos de la evaluación
    populateEvaluacionModal(evaluacion) {
        // Información básica
        document.getElementById('evalPacienteNombre').textContent = evaluacion.paciente_nombre || 'No especificado';
        document.getElementById('evalOdontologoNombre').textContent = evaluacion.odontologo_nombre || 'No especificado';
        
        // Formatear fecha
        const fecha = evaluacion.fecha_evaluacion ? 
            new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 
            (evaluacion.created_at ? new Date(evaluacion.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
            }) : 'Fecha no disponible');
        
        document.getElementById('evalFecha').textContent = fecha;
        
        // Calificaciones individuales
        this.setCalificacion('evalServicio', evaluacion.calificacion_servicio);
        this.setCalificacion('evalAtencion', evaluacion.calificacion_atencion);
        this.setCalificacion('evalInstalaciones', evaluacion.calificacion_instalaciones);
        
        // Calcular y mostrar promedio
        let promedio = 'N/A';
        if (evaluacion.calificacion_servicio && evaluacion.calificacion_atencion && evaluacion.calificacion_instalaciones) {
            promedio = ((evaluacion.calificacion_servicio + evaluacion.calificacion_atencion + evaluacion.calificacion_instalaciones) / 3).toFixed(1);
            this.setCalificacion('evalPromedio', parseFloat(promedio));
        } else {
            document.getElementById('evalPromedioScore').textContent = 'N/A';
            document.getElementById('evalPromedioStars').innerHTML = '<span class="text-muted">Sin datos</span>';
        }
        
        // Comentarios
        const comentarios = evaluacion.comentarios;
        if (comentarios && comentarios.trim() !== '') {
            document.getElementById('evalComentarios').textContent = comentarios;
            document.getElementById('evalComentariosCard').style.display = 'block';
        } else {
            document.getElementById('evalComentariosCard').style.display = 'none';
        }
        
        // Recomendación
        const recomendacion = document.getElementById('evalRecomendacion');
        const recomendacionTexto = document.getElementById('evalRecomendacionTexto');
        
        if (evaluacion.recomendaria === true || evaluacion.recomendaria === 'true' || evaluacion.recomendaria === 1) {
            recomendacionTexto.textContent = 'Sí recomendaría el servicio';
            recomendacion.className = 'd-inline-block px-4 py-2 rounded-pill recomendaria-si';
            recomendacion.innerHTML = '<i class="bi bi-hand-thumbs-up me-2"></i><span id="evalRecomendacionTexto">Sí recomendaría el servicio</span>';
        } else {
            recomendacionTexto.textContent = 'No recomendaría el servicio';
            recomendacion.className = 'd-inline-block px-4 py-2 rounded-pill recomendaria-no';
            recomendacion.innerHTML = '<i class="bi bi-hand-thumbs-down me-2"></i><span id="evalRecomendacionTexto">No recomendaría el servicio</span>';
        }
    }

    // Función auxiliar para establecer calificación con estrellas
    setCalificacion(prefix, calificacion) {
        const scoreElement = document.getElementById(prefix + 'Score');
        const starsElement = document.getElementById(prefix + 'Stars');
        
        if (calificacion && calificacion > 0) {
            scoreElement.textContent = calificacion + '/5';
            starsElement.innerHTML = this.generateStars(calificacion);
        } else {
            scoreElement.textContent = 'N/A';
            starsElement.innerHTML = '<span class="text-muted">Sin calificación</span>';
        }
    }

    // Función para generar estrellas HTML
    generateStars(rating) {
        let starsHtml = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = (rating % 1) >= 0.5;
        
        // Estrellas llenas
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="bi bi-star-fill star filled"></i>';
        }
        
        // Media estrella
        if (hasHalfStar) {
            starsHtml += '<i class="bi bi-star-half star half"></i>';
        }
        
        // Estrellas vacías
        const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < remainingStars; i++) {
            starsHtml += '<i class="bi bi-star star"></i>';
        }
        
        return starsHtml;
    }

    // Generar reporte PDF de evaluaciones
    async generarReporteEvaluaciones() {
        try {
            console.log('📊 Generando reporte de evaluaciones...');
            
            // Mostrar indicador de carga
            const btn = document.getElementById('reporteEvaluacionesBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Generando...';
            btn.disabled = true;
            
            // Obtener las evaluaciones si no están cargadas
            if (!this.currentEvaluaciones || this.currentEvaluaciones.length === 0) {
                await this.loadEvaluaciones();
            }
            
            const evaluaciones = this.currentEvaluaciones || [];
            
            if (evaluaciones.length === 0) {
                alert('No hay evaluaciones para generar el reporte');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }
            
            // Crear el PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configuración del documento
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            let yPosition = margin;
            
            // Título del reporte
            doc.setFontSize(20);
            doc.setTextColor(40, 40, 40);
            doc.text('REPORTE DE EVALUACIONES', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;
            
            // Información del reporte
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 10;
            doc.text(`Total de evaluaciones: ${evaluaciones.length}`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;
            
            // Estadísticas generales
            const estadisticas = this.calcularEstadisticasEvaluaciones(evaluaciones);
            
            doc.setFontSize(16);
            doc.setTextColor(40, 40, 40);
            doc.text('RESUMEN ESTADÍSTICO', margin, yPosition);
            yPosition += 15;
            
            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);
            doc.text(`• Calificación promedio general: ${estadisticas.promedioGeneral}/5`, margin, yPosition);
            yPosition += 8;
            doc.text(`• Promedio calificación servicio: ${estadisticas.promedioServicio}/5`, margin, yPosition);
            yPosition += 8;
            doc.text(`• Promedio calificación atención: ${estadisticas.promedioAtencion}/5`, margin, yPosition);
            yPosition += 8;
            doc.text(`• Promedio calificación instalaciones: ${estadisticas.promedioInstalaciones}/5`, margin, yPosition);
            yPosition += 8;
            doc.text(`• Porcentaje de recomendación: ${estadisticas.porcentajeRecomendacion}%`, margin, yPosition);
            yPosition += 20;
            
            // Lista de evaluaciones
            doc.setFontSize(16);
            doc.setTextColor(40, 40, 40);
            doc.text('EVALUACIONES DETALLADAS', margin, yPosition);
            yPosition += 15;
            
            // Recorrer cada evaluación
            evaluaciones.forEach((evaluacion, index) => {
                // Verificar si necesitamos una nueva página
                if (yPosition > pageHeight - 60) {
                    doc.addPage();
                    yPosition = margin;
                }
                
                const fecha = evaluacion.fecha_evaluacion ? 
                    new Date(evaluacion.fecha_evaluacion).toLocaleDateString() : 
                    (evaluacion.created_at ? new Date(evaluacion.created_at).toLocaleDateString() : 'N/A');
                
                const promedio = evaluacion.calificacion_servicio && evaluacion.calificacion_atencion && evaluacion.calificacion_instalaciones ? 
                    ((evaluacion.calificacion_servicio + evaluacion.calificacion_atencion + evaluacion.calificacion_instalaciones) / 3).toFixed(1) : 'N/A';
                
                // Encabezado de la evaluación
                doc.setFontSize(12);
                doc.setTextColor(40, 40, 40);
                doc.text(`${index + 1}. EVALUACIÓN #${evaluacion.id}`, margin, yPosition);
                yPosition += 10;
                
                // Información básica
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                doc.text(`Paciente: ${evaluacion.paciente_nombre || 'N/A'}`, margin + 5, yPosition);
                yPosition += 6;
                doc.text(`Odontólogo: ${evaluacion.odontologo_nombre || 'N/A'}`, margin + 5, yPosition);
                yPosition += 6;
                doc.text(`Fecha: ${fecha}`, margin + 5, yPosition);
                yPosition += 6;
                doc.text(`Promedio: ${promedio}/5 - Recomendaría: ${evaluacion.recomendaria ? 'Sí' : 'No'}`, margin + 5, yPosition);
                yPosition += 10;
                
                // Comentarios (si existen)
                if (evaluacion.comentarios) {
                    doc.text('Comentarios:', margin + 5, yPosition);
                    yPosition += 6;
                    
                    // Dividir comentarios en líneas para evitar desbordamiento
                    const comentarios = doc.splitTextToSize(evaluacion.comentarios, pageWidth - margin * 2 - 10);
                    comentarios.forEach(linea => {
                        if (yPosition > pageHeight - 30) {
                            doc.addPage();
                            yPosition = margin;
                        }
                        doc.text(linea, margin + 10, yPosition);
                        yPosition += 5;
                    });
                }
                
                yPosition += 8;
                
                // Línea separadora
                doc.setDrawColor(200, 200, 200);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 10;
            });
            
            // Guardar el PDF
            const fechaHoy = new Date().toISOString().split('T')[0];
            doc.save(`reporte-evaluaciones-${fechaHoy}.pdf`);
            
            console.log('✅ Reporte de evaluaciones generado exitosamente');
            
            // Mostrar mensaje de éxito
            this.showAlert('Reporte de evaluaciones generado y descargado exitosamente', 'success');
            
        } catch (error) {
            console.error('❌ Error al generar reporte de evaluaciones:', error);
            this.showAlert('Error al generar el reporte: ' + error.message, 'danger');
        } finally {
            // Restaurar botón
            const btn = document.getElementById('reporteEvaluacionesBtn');
            if (btn) {
                btn.innerHTML = '<i class="bi bi-graph-up"></i> Reporte de Evaluaciones';
                btn.disabled = false;
            }
        }
    }

    // Calcular estadísticas de evaluaciones
    calcularEstadisticasEvaluaciones(evaluaciones) {
        if (!evaluaciones || evaluaciones.length === 0) {
            return {
                promedioGeneral: '0.0',
                promedioServicio: '0.0',
                promedioAtencion: '0.0',
                promedioInstalaciones: '0.0',
                porcentajeRecomendacion: '0'
            };
        }
        
        let sumaServicio = 0, sumaAtencion = 0, sumaInstalaciones = 0;
        let evaluacionesConCalificacion = 0;
        let recomendaciones = 0;
        
        evaluaciones.forEach(evaluacion => {
            if (evaluacion.calificacion_servicio && evaluacion.calificacion_atencion && evaluacion.calificacion_instalaciones) {
                sumaServicio += evaluacion.calificacion_servicio;
                sumaAtencion += evaluacion.calificacion_atencion;
                sumaInstalaciones += evaluacion.calificacion_instalaciones;
                evaluacionesConCalificacion++;
            }
            
            if (evaluacion.recomendaria) {
                recomendaciones++;
            }
        });
        
        const promedioServicio = evaluacionesConCalificacion > 0 ? (sumaServicio / evaluacionesConCalificacion).toFixed(1) : '0.0';
        const promedioAtencion = evaluacionesConCalificacion > 0 ? (sumaAtencion / evaluacionesConCalificacion).toFixed(1) : '0.0';
        const promedioInstalaciones = evaluacionesConCalificacion > 0 ? (sumaInstalaciones / evaluacionesConCalificacion).toFixed(1) : '0.0';
        const promedioGeneral = evaluacionesConCalificacion > 0 ? 
            ((sumaServicio + sumaAtencion + sumaInstalaciones) / (evaluacionesConCalificacion * 3)).toFixed(1) : '0.0';
        const porcentajeRecomendacion = evaluaciones.length > 0 ? 
            Math.round((recomendaciones / evaluaciones.length) * 100) : 0;
        
        return {
            promedioGeneral,
            promedioServicio,
            promedioAtencion,
            promedioInstalaciones,
            porcentajeRecomendacion: porcentajeRecomendacion.toString()
        };
    }

    // Abrir modal para nueva factura
    async openNewInvoiceModal() {
        console.log('📄 Abriendo modal para nueva factura...');
        
        // Eliminar modal anterior si existe
        const existingModal = document.getElementById('tempNewInvoiceModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Siempre crear el modal dinámico mejorado
        await this.createNewInvoiceModal();
    }

    // Crear modal completo para nueva factura con datos reales
    async createNewInvoiceModal() {
        const modalHTML = `
        <div class="modal fade" id="tempNewInvoiceModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-receipt"></i> Registrar Nuevo Pago/Factura
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="newInvoiceForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="invoicePersonType" class="form-label">Tipo de Persona</label>
                                    <select class="form-select" id="invoicePersonType" required>
                                        <option value="">Seleccionar tipo...</option>
                                        <option value="paciente">Paciente</option>
                                        <option value="odontologo">Odontólogo</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="invoicePerson" class="form-label">Persona</label>
                                    <select class="form-select" id="invoicePerson" required disabled>
                                        <option value="">Seleccione tipo primero...</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="invoiceMethod" class="form-label">Método de Pago</label>
                                    <select class="form-select" id="invoiceMethod" required>
                                        <option value="">Seleccionar método...</option>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta de credito">Tarjeta de Crédito</option>
                                        <option value="transferencia">Transferencia</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="invoiceAmount" class="form-label">Monto Total (COP)</label>
                                    <input type="number" class="form-control" id="invoiceAmount" min="0" step="1000" required placeholder="$">
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="invoiceConcept" class="form-label">Concepto</label>
                                <select class="form-select" id="invoiceConcept" required>
                                    <option value="">Seleccionar concepto...</option>
                                    <option value="Pago de tratamiento">Pago de tratamiento</option>
                                    <option value="Consulta">Consulta</option>
                                    <option value="Limpieza">Limpieza</option>
                                    <option value="Blanqueamiento">Blanqueamiento</option>
                                    <option value="Ortodoncia">Ortodoncia</option>
                                    <option value="Endodoncia">Endodoncia</option>
                                    <option value="Extracción">Extracción</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="invoiceTreatments" class="form-label">Tratamientos Asociados</label>
                                <div class="form-control" style="height: auto; min-height: 100px;">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="limpieza" id="treat1">
                                        <label class="form-check-label" for="treat1">Limpieza Dental - $50,000</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="blanqueamiento" id="treat2">
                                        <label class="form-check-label" for="treat2">Blanqueamiento - $150,000</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="ortodoncia" id="treat3">
                                        <label class="form-check-label" for="treat3">Ortodoncia - $200,000</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="endodoncia" id="treat4">
                                        <label class="form-check-label" for="treat4">Endodoncia - $120,000</label>
                                    </div>
                                </div>
                                <small class="text-muted">Seleccione los tratamientos asociados a este pago</small>
                            </div>
                            
                            <div class="mb-3">
                                <label for="invoiceReference" class="form-label">Referencia de Pago</label>
                                <input type="text" class="form-control" id="invoiceReference" placeholder="Opcional - Ej: Número de transacción">
                            </div>
                            
                            <div class="mb-3">
                                <label for="invoiceObservations" class="form-label">Observaciones</label>
                                <textarea class="form-control" id="invoiceObservations" rows="3" placeholder="Observaciones adicionales sobre este pago"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-success" onclick="dashboardAdmin.saveNewInvoice()">
                            <i class="bi bi-save"></i> Registrar Pago
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Cargar datos dinámicamente
        await this.loadModalData();
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('tempNewInvoiceModal'));
        modal.show();
        
        // Event listeners
        this.setupModalEventListeners();
    }

    // Cargar datos para el modal
    async loadModalData() {
        try {
            // Cargar usuarios (pacientes y odontólogos)
            const usersRes = await this.authFetch('/api/usuarios');
            const usersData = await usersRes.json();
            const usuarios = usersData.usuarios || usersData || [];
            
            console.log('👥 Usuarios cargados para modal:', usuarios);
            
            // Separar por roles
            this.modalPacientes = usuarios.filter(u => u.rol === 'paciente' || u.tipo_usuario === 'paciente');
            this.modalOdontologos = usuarios.filter(u => u.rol === 'odontologo' || u.tipo_usuario === 'odontologo');
            
            console.log('🦷 Pacientes:', this.modalPacientes);
            console.log('👨‍⚕️ Odontólogos:', this.modalOdontologos);
            
        } catch (error) {
            console.error('❌ Error cargando datos para modal:', error);
            // Datos de respaldo
            this.modalPacientes = [

                { id: 2, nombre: 'Carlos López', email: 'carlos@email.com' }
            ];
            this.modalOdontologos = [
                { id: 1, nombre: 'Dr. Carlos', email: 'drcarlos@clinik.com' }
            ];
        }
    }

    // Configurar event listeners del modal
    setupModalEventListeners() {
        const typeSelect = document.getElementById('invoicePersonType');
        const personSelect = document.getElementById('invoicePerson');
        const conceptSelect = document.getElementById('invoiceConcept');
        const amountField = document.getElementById('invoiceAmount');
        
        // Cambio de tipo de persona
        typeSelect.addEventListener('change', (e) => {
            const type = e.target.value;
            personSelect.disabled = false;
            personSelect.innerHTML = '<option value="">Seleccionar...</option>';
            
            if (type === 'paciente') {
                this.modalPacientes.forEach(paciente => {
                    personSelect.innerHTML += `<option value="${paciente.id}">${paciente.nombre || paciente.email}</option>`;
                });
            } else if (type === 'odontologo') {
                this.modalOdontologos.forEach(odontologo => {
                    personSelect.innerHTML += `<option value="${odontologo.id}">${odontologo.nombre || odontologo.email}</option>`;
                });
            }
        });
        
        // Auto-completar monto según concepto
        conceptSelect.addEventListener('change', (e) => {
            const concept = e.target.value;
            switch(concept) {
                case 'Consulta':
                    amountField.value = 30000;
                    break;
                case 'Limpieza':
                    amountField.value = 50000;
                    break;
                case 'Blanqueamiento':
                    amountField.value = 150000;
                    break;
                case 'Ortodoncia':
                    amountField.value = 200000;
                    break;
                case 'Endodoncia':
                    amountField.value = 120000;
                    break;
                case 'Extracción':
                    amountField.value = 80000;
                    break;
                default:
                    // No cambiar el monto para otros casos
                    break;
            }
        });
    }

    // Guardar nueva factura/pago
    saveNewInvoice() {
        const personType = document.getElementById('invoicePersonType').value;
        const person = document.getElementById('invoicePerson').value;
        const method = document.getElementById('invoiceMethod').value;
        const amount = document.getElementById('invoiceAmount').value;
        const concept = document.getElementById('invoiceConcept').value;
        const reference = document.getElementById('invoiceReference').value;
        const observations = document.getElementById('invoiceObservations').value;
        
        // Validación de campos requeridos
        if (!personType || !person || !method || !amount || !concept) {
            this.showAlert('Por favor complete todos los campos requeridos', 'warning');
            return;
        }
        
        // Obtener nombre de la persona seleccionada
        const personSelect = document.getElementById('invoicePerson');
        const personName = personSelect.options[personSelect.selectedIndex].text;
        
        // Obtener tratamientos seleccionados
        const treatments = [];
        document.querySelectorAll('#tempNewInvoiceModal input[type="checkbox"]:checked').forEach(checkbox => {
            treatments.push(checkbox.value);
        });
        
        const invoiceData = {
            personType,
            personId: person,
            personName,
            method,
            amount: parseInt(amount),
            concept,
            treatments,
            reference,
            observations,
            fecha: new Date().toISOString().split('T')[0]
        };
        
        console.log('🧾 Guardando nueva factura/pago:', invoiceData);
        
        // Simular guardado exitoso (aquí conectarías con tu API)
        this.showAlert(`Pago registrado exitosamente para ${personName}`, 'success');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('tempNewInvoiceModal'));
        if (modal) {
            modal.hide();
        }
        
        // Limpiar modal después de cerrar
        setTimeout(() => {
            const modalElement = document.getElementById('tempNewInvoiceModal');
            if (modalElement) {
                modalElement.remove();
            }
        }, 500);
        
        // Recargar datos de pagos si estamos en esa sección
        if (this.currentSection === 'pagos') {
            setTimeout(() => {
                this.loadSectionData('pagos');
            }, 1000);
        }
    }

    async loadUsuarios() {
        try {
            console.log('🔄 Iniciando carga de usuarios...');
            
            // Obtener headers de autenticación
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = localStorage.getItem('userId') || user.id;
            
            const res = await fetch('/api/usuarios', {
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId || '1'
                }
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const usuarios = await res.json();
            
            console.log('✅ Usuarios obtenidos desde API:', usuarios.length);
            
            // Si no hay usuarios de la API, usar datos de ejemplo
            if (!usuarios || usuarios.length === 0) {
                console.log('⚠️ No hay usuarios, usando datos de ejemplo');
                this.users = [
                    {
                        id: 1,
                        nombre: 'Admin',
                        apellido: 'Principal',
                        correo: 'admin@clinikdent.com',
                        telefono: '3001234567',
                        rol: 'administrador',
                        estado: 'activo'
                    },
                    {
                        id: 2,
                        nombre: 'Dr. Carlos',
                        apellido: 'Rodriguez',
                        correo: 'carlos@clinikdent.com',
                        telefono: '3001234568',
                        rol: 'odontologo',
                        estado: 'activo'
                    },
                    {
                        id: 3,

                        correo: 'maria@clinikdent.com',
                        telefono: '3001234569',
                        rol: 'paciente',
                        estado: 'activo'
                    },
                    {
                        id: 4,
                        nombre: 'Juan',
                        apellido: 'Pérez',
                        correo: 'juan@clinikdent.com',
                        telefono: '3001234570',
                        rol: 'paciente',
                        estado: 'activo'
                    },
                    {
                        id: 5,
                        nombre: 'Camila',
                        apellido: 'Perez',
                        correo: 'camila@clinikdent.com',
                        telefono: '3001234571',
                        rol: 'administrador',
                        estado: 'activo'
                    }
                ];
            } else {
                this.users = usuarios;
            }
            
            console.log('📋 Total usuarios cargados:', this.users.length);
            
            // ✅ NUEVO: Si hay usuarios reales, inicializar paginación con datos reales
            if (this.users.length > 10) {
                this.initializeRealUsersPagination();
            } else {
                this.renderUsuariosTable();
            }
            
        } catch (err) {
            console.error('❌ Error al cargar usuarios:', err);
            
            // Fallback con datos de ejemplo en caso de error
            console.log('🆘 Usando datos de fallback');
            this.users = [
                {
                    id: 1,
                    nombre: 'Admin',
                    apellido: 'Principal',
                    correo: 'admin@clinikdent.com',
                    telefono: '3001234567',
                    rol: 'administrador',
                    estado: 'activo'
                },
                {
                    id: 2,
                    nombre: 'Dr. Carlos',
                    apellido: 'Rodriguez',
                    correo: 'carlos@clinikdent.com',
                    telefono: '3001234568',
                    rol: 'odontologo',
                    estado: 'activo'
                },
                {
                    id: 3,

                    correo: 'maria@clinikdent.com',
                    telefono: '3001234569',
                    rol: 'paciente',
                    estado: 'activo'
                },
                {
                    id: 4,
                    nombre: 'Juan',
                    apellido: 'Pérez',
                    correo: 'juan@clinikdent.com',
                    telefono: '3001234570',
                    rol: 'paciente',
                    estado: 'activo'
                },
                {
                    id: 5,
                    nombre: 'Camila',
                    apellido: 'Perez',
                    correo: 'camila@clinikdent.com',
                    telefono: '3001234571',
                    rol: 'administrador',
                    estado: 'activo'
                }
            ];
            
            this.renderUsuariosTable();
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

    // ✅ NUEVO: Funciones de paginación para usuarios reales
    initializeRealUsersPagination() {
        console.log('🔄 Inicializando paginación para usuarios reales...');
        
        this.usersPagination.totalItems = this.users.length;
        this.usersPagination.totalPages = Math.ceil(this.usersPagination.totalItems / this.usersPagination.itemsPerPage);
        this.usersPagination.currentPage = 1;
        
        this.renderUsersPage();
        this.renderUsersPaginationControls();
        this.showUsersPaginationInfo();
        
        console.log(`✅ Paginación usuarios: ${this.usersPagination.totalItems} usuarios, ${this.usersPagination.totalPages} páginas`);
    }
    
    renderUsersPage() {
        const startIndex = (this.usersPagination.currentPage - 1) * this.usersPagination.itemsPerPage;
        const endIndex = startIndex + this.usersPagination.itemsPerPage;
        const pageUsers = this.users.slice(startIndex, endIndex);
        
        const tbody = document.querySelector('#usuariosTable tbody');
        if (!tbody) {
            console.error('No se encontró la tabla de usuarios');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (pageUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay usuarios en esta página</td></tr>';
            return;
        }
        
        pageUsers.forEach(user => {
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
    
    renderUsersPaginationControls() {
        const paginationContainer = document.getElementById('usuariosPagination');
        if (!paginationContainer) {
            console.warn('No se encontró el contenedor de paginación de usuarios');
            return;
        }
        
        if (this.usersPagination.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        
        let paginationHTML = '<nav aria-label="Navegación de usuarios"><ul class="pagination pagination-sm mb-0">';
        
        // Botón Anterior
        const prevDisabled = this.usersPagination.currentPage === 1 ? 'disabled' : '';
        paginationHTML += `
            <li class="page-item ${prevDisabled}">
                <a class="page-link" href="#" onclick="dashboardAdmin.goToUsersPage(${this.usersPagination.currentPage - 1})" ${prevDisabled ? 'tabindex="-1" aria-disabled="true"' : ''}>
                    <i class="bi bi-chevron-left"></i> Anterior
                </a>
            </li>
        `;
        
        // Números de página
        let startPage = Math.max(1, this.usersPagination.currentPage - 2);
        let endPage = Math.min(this.usersPagination.totalPages, this.usersPagination.currentPage + 2);
        
        // Ajustar si estamos cerca del inicio
        if (this.usersPagination.currentPage <= 3) {
            endPage = Math.min(5, this.usersPagination.totalPages);
        }
        
        // Ajustar si estamos cerca del final
        if (this.usersPagination.currentPage > this.usersPagination.totalPages - 3) {
            startPage = Math.max(1, this.usersPagination.totalPages - 4);
        }
        
        // Primera página si no está visible
        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="dashboardAdmin.goToUsersPage(1)">1</a>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        // Páginas visibles
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.usersPagination.currentPage ? 'active' : '';
            paginationHTML += `
                <li class="page-item ${isActive}">
                    <a class="page-link" href="#" onclick="dashboardAdmin.goToUsersPage(${i})">${i}</a>
                </li>
            `;
        }
        
        // Última página si no está visible
        if (endPage < this.usersPagination.totalPages) {
            if (endPage < this.usersPagination.totalPages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="dashboardAdmin.goToUsersPage(${this.usersPagination.totalPages})">${this.usersPagination.totalPages}</a>
                </li>
            `;
        }
        
        // Botón Siguiente
        const nextDisabled = this.usersPagination.currentPage === this.usersPagination.totalPages ? 'disabled' : '';
        paginationHTML += `
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" onclick="dashboardAdmin.goToUsersPage(${this.usersPagination.currentPage + 1})" ${nextDisabled ? 'tabindex="-1" aria-disabled="true"' : ''}>
                    Siguiente <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;
        
        paginationHTML += '</ul></nav>';
        paginationContainer.innerHTML = paginationHTML;
    }
    
    showUsersPaginationInfo() {
        const infoContainer = document.getElementById('usuariosPaginationInfo');
        if (!infoContainer) return;
        
        if (this.usersPagination.totalItems > 0) {
            const startItem = (this.usersPagination.currentPage - 1) * this.usersPagination.itemsPerPage + 1;
            const endItem = Math.min(startItem + this.usersPagination.itemsPerPage - 1, this.usersPagination.totalItems);
            
            infoContainer.style.display = 'flex';
            infoContainer.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="text-muted">
                        Mostrando <strong>${endItem - startItem + 1}</strong> de <strong>${this.usersPagination.totalItems}</strong> usuarios
                    </span>
                </div>
                <div class="d-flex align-items-center">
                    <span class="text-muted">
                        Página <strong>${this.usersPagination.currentPage}</strong> de <strong>${this.usersPagination.totalPages}</strong>
                    </span>
                </div>
            `;
        } else {
            infoContainer.style.display = 'none';
        }
    }
    
    goToUsersPage(page) {
        if (page < 1 || page > this.usersPagination.totalPages) return;
        
        this.usersPagination.currentPage = page;
        this.renderUsersPage();
        this.renderUsersPaginationControls();
        this.showUsersPaginationInfo();
        
        console.log(`📄 Navegando a página ${page} de usuarios`);
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
        // Buscar información del usuario a eliminar
        const user = this.users.find(u => u.id === id);
        const userName = user ? `${user.nombre} ${user.apellido}` : 'Usuario';
        const userEmail = user ? user.correo : '';
        
        // Configurar el modal de confirmación
        document.getElementById('deleteUserName').textContent = userName;
        document.getElementById('deleteUserEmail').textContent = userEmail;
        
        // Mostrar modal de confirmación
        const confirmModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
        confirmModal.show();
        
        // Configurar el botón de confirmación
        document.getElementById('confirmDeleteBtn').onclick = async () => {
            confirmModal.hide();
            
            // Mostrar modal de carga
            this.showResultModal('loading', 'Eliminando...', 'Por favor espera mientras eliminamos el usuario.');
            
            try {
                const response = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
                
                if (response.ok) {
                    // Éxito
                    this.showResultModal('success', '¡Usuario Eliminado!', 'El usuario ha sido eliminado exitosamente del sistema.');
                    
                    // Recargar datos después de un breve delay
                    setTimeout(async () => {
                        await this.loadUsuarios();
                        await this.loadDashboardData();
                    }, 1500);
                } else {
                    const error = await response.json();
                    this.showResultModal('error', 'Error al Eliminar', error.msg || 'No se pudo eliminar el usuario. Inténtalo de nuevo.');
                }
            } catch (err) {
                console.error('Error al eliminar usuario:', err);
                this.showResultModal('error', 'Error de Conexión', 'Hubo un problema de conexión. Verifica tu internet e inténtalo de nuevo.');
            }
        };
    }
    
    // Función auxiliar para mostrar modales de resultado
    showResultModal(type, title, message) {
        const resultModal = document.getElementById('resultModal');
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        
        // Configurar según el tipo
        switch (type) {
            case 'success':
                resultIcon.innerHTML = '<i class="bi bi-check-circle-fill text-success fs-1"></i>';
                resultIcon.className = 'd-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10';
                resultTitle.textContent = title;
                resultTitle.className = 'fw-bold mb-2 text-success';
                break;
                
            case 'error':
                resultIcon.innerHTML = '<i class="bi bi-x-circle-fill text-danger fs-1"></i>';
                resultIcon.className = 'd-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10';
                resultTitle.textContent = title;
                resultTitle.className = 'fw-bold mb-2 text-danger';
                break;
                
            case 'loading':
                resultIcon.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
                resultIcon.className = 'd-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10';
                resultTitle.textContent = title;
                resultTitle.className = 'fw-bold mb-2 text-primary';
                break;
        }
        
        resultMessage.textContent = message;
        
        const modal = new bootstrap.Modal(resultModal);
        modal.show();
        
        // Para el tipo loading, cerrar automáticamente después de que se complete la operación
        if (type === 'loading') {
            // No auto-cerrar, se cierra cuando se muestra el resultado final
            return;
        }
    }

    // Debug functionality removed per user request

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

        // Integrar con el sistema general de paginación
        this.setupCitasPaginationIntegrated();
    }

    // Nueva función para configurar paginación de citas integrada
    setupCitasPaginationIntegrated() {
        // Configurar en el sistema general de paginación
        if (!this.paginationConfig) {
            this.paginationConfig = {};
        }
        
        // Registrar configuración de citas en el sistema general
        this.paginationConfig['citas'] = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: this.citas.length,
            totalPages: Math.ceil(this.citas.length / 10)
        };

        // Obtener valor actual del selector si existe
        const selector = document.getElementById('citasItemsPerPage');
        if (selector && selector.value) {
            this.paginationConfig['citas'].itemsPerPage = parseInt(selector.value);
            this.paginationConfig['citas'].totalPages = Math.ceil(this.citas.length / parseInt(selector.value));
        }

        // Renderizar la página actual
        this.renderCitasPageIntegrated();
        
        // Actualizar información de paginación
        this.updatePaginationInfo('citas');
        
        // Generar controles de paginación
        this.generatePagination('citas');
        
        console.log('✅ Paginación de citas integrada con el sistema general');
    }

    renderCitasPageIntegrated() {
        const tbody = document.getElementById('citasTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        const config = this.paginationConfig['citas'];
        if (!config) return;

        // Calcular índices para la página actual
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = Math.min(startIndex + config.itemsPerPage, this.citas.length);
        const currentPageCitas = this.citas.slice(startIndex, endIndex);

        // Renderizar citas de la página actual
        currentPageCitas.forEach(cita => {
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
                        <button class="btn btn-sm btn-success" onclick="dashboardAdmin.editarCita(${cita.id})" title="Editar cita" style="background: #198754 !important; background-image: none !important; border-color: #198754 !important;">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="dashboardAdmin.eliminarCita(${cita.id})" title="Eliminar cita" style="background: #dc3545 !important; background-image: none !important; border-color: #dc3545 !important;">
                            <i class="bi bi-trash"></i>
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

    editarCita(id) {
        const cita = this.citas.find(c => c.id === id);
        if (!cita) {
            alert('Cita no encontrada');
            return;
        }

        // Aquí iría la lógica para abrir modal de edición
        // Por ahora solo mostramos un alert con la información
        alert(`✏️ Editar Cita #${id}\nPaciente: ${cita.paciente_completo}\nFecha: ${cita.fecha_formateada}\nHora: ${cita.hora}\nEstado: ${cita.estado}`);
        
        // TODO: Implementar modal de edición de citas
        console.log('TODO: Implementar modal de edición para cita:', cita);
    }

    // Sistema de alertas y confirmaciones mejoradas
    showCustomConfirm(options) {
        return new Promise((resolve) => {
            // Crear overlay
            const overlay = document.createElement('div');
            overlay.className = 'custom-confirm-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.2s ease-out;
            `;

            // Crear modal
            const modal = document.createElement('div');
            modal.className = 'custom-confirm-modal';
            modal.style.cssText = `
                background: white;
                border-radius: 12px;
                padding: 0;
                max-width: 480px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                animation: slideIn 0.3s ease-out;
                overflow: hidden;
            `;

            const iconColors = {
                delete: '#dc3545',
                warning: '#ffc107',
                info: '#17a2b8',
                success: '#28a745'
            };

            const iconIcons = {
                delete: 'bi-trash',
                warning: 'bi-exclamation-triangle',
                info: 'bi-info-circle',
                success: 'bi-check-circle'
            };

            const iconColor = iconColors[options.type] || iconColors.warning;
            const iconClass = iconIcons[options.type] || iconIcons.warning;

            modal.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, ${iconColor}15, ${iconColor}05);
                    padding: 2rem 2rem 1rem 2rem;
                    text-align: center;
                    border-bottom: 1px solid #eee;
                ">
                    <div style="
                        width: 64px;
                        height: 64px;
                        background: ${iconColor};
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 1rem;
                        color: white;
                        font-size: 28px;
                    ">
                        <i class="bi ${iconClass}"></i>
                    </div>
                    <h5 style="margin: 0; color: #333; font-weight: 600;">
                        ${options.title || '¿Confirmar acción?'}
                    </h5>
                </div>
                <div style="padding: 1.5rem 2rem;">
                    <p style="margin: 0 0 1rem 0; color: #666; line-height: 1.5; text-align: left;">
                        ${options.message || '¿Está seguro de que desea continuar?'}
                    </p>
                    ${options.details ? `
                        <div style="
                            background: #f8f9fa;
                            border: 1px solid #dee2e6;
                            border-radius: 6px;
                            padding: 0.75rem;
                            margin-bottom: 1rem;
                            font-size: 0.9em;
                            color: #495057;
                        ">
                            ${options.details}
                        </div>
                    ` : ''}
                    ${options.warning ? `
                        <div style="
                            background: #fff3cd;
                            border: 1px solid #ffeaa7;
                            border-radius: 6px;
                            padding: 0.75rem;
                            margin-bottom: 1rem;
                            font-size: 0.85em;
                            color: #856404;
                        ">
                            <i class="bi bi-exclamation-triangle" style="margin-right: 0.5rem;"></i>
                            ${options.warning}
                        </div>
                    ` : ''}
                </div>
                <div style="
                    padding: 1rem 2rem 2rem 2rem;
                    display: flex;
                    gap: 0.75rem;
                    justify-content: flex-end;
                ">
                    <button type="button" class="custom-confirm-cancel" style="
                        padding: 0.75rem 1.5rem;
                        border: 1px solid #ddd;
                        background: white;
                        color: #666;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s;
                        min-width: 100px;
                    ">
                        ${options.cancelText || 'Cancelar'}
                    </button>
                    <button type="button" class="custom-confirm-accept" style="
                        padding: 0.75rem 1.5rem;
                        border: none;
                        background: ${iconColor};
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s;
                        min-width: 100px;
                    ">
                        ${options.confirmText || 'Aceptar'}
                    </button>
                </div>
            `;

            // Agregar estilos de animación
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.9) translateY(-20px);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .custom-confirm-cancel:hover {
                    background: #f8f9fa !important;
                    border-color: #adb5bd !important;
                }
                .custom-confirm-accept:hover {
                    opacity: 0.9 !important;
                    transform: translateY(-1px) !important;
                }
            `;
            document.head.appendChild(style);

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Event listeners
            const cancelBtn = modal.querySelector('.custom-confirm-cancel');
            const acceptBtn = modal.querySelector('.custom-confirm-accept');

            const cleanup = () => {
                document.body.removeChild(overlay);
                document.head.removeChild(style);
            };

            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };

            acceptBtn.onclick = () => {
                cleanup();
                resolve(true);
            };

            // Cerrar con overlay
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            };

            // Cerrar con ESC
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }

    async eliminarCita(id) {
        const cita = this.citas.find(c => c.id === id);
        if (!cita) {
            alert('Cita no encontrada');
            return;
        }

        // Usar confirmación personalizada mejorada
        const confirmed = await this.showCustomConfirm({
            type: 'delete',
            title: '¿Eliminar cita?',
            message: `¿Está seguro de eliminar la cita de ${cita.paciente_completo}?`,
            details: `<strong>Fecha:</strong> ${cita.fecha_formateada}<br><strong>Hora:</strong> ${cita.hora}`,
            warning: 'Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/citas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.msg || 'Error al eliminar cita');
            }

            alert('✅ Cita eliminada correctamente');
            
            // Recargar las citas
            this.loadCitas();
            
        } catch (error) {
            console.error('Error al eliminar cita:', error);
            alert(`❌ Error al eliminar cita: ${error.message}`);
        }
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

    // ========================================
    // FUNCIONES PARA PAGOS INTEGRADAS
    // ========================================

    setupPagosIntegrated() {
        // Configurar en el sistema general de paginación
        if (!this.paginationConfig) {
            this.paginationConfig = {};
        }
        
        // Registrar configuración de pagos en el sistema general
        this.paginationConfig['pagos'] = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: this.pagos.length,
            totalPages: Math.ceil(this.pagos.length / 10)
        };

        // Obtener valor actual del selector si existe
        const selector = document.getElementById('pagosItemsPerPage');
        if (selector && selector.value) {
            this.paginationConfig['pagos'].itemsPerPage = parseInt(selector.value);
            this.paginationConfig['pagos'].totalPages = Math.ceil(this.pagos.length / parseInt(selector.value));
        }

        // Renderizar la página actual
        this.renderPagosPageIntegrated();
        
        // Actualizar información de paginación
        this.updatePaginationInfo('pagos');
        
        // Generar controles de paginación
        this.generatePagination('pagos');
        
        console.log('✅ Paginación de pagos integrada con el sistema general');
    }

    renderPagosPageIntegrated() {
        const tbody = document.getElementById('pagosTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        const config = this.paginationConfig['pagos'];
        if (!config) return;

        // Calcular índices para la página actual
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = Math.min(startIndex + config.itemsPerPage, this.pagos.length);
        const currentPagePagos = this.pagos.slice(startIndex, endIndex);

        if (currentPagePagos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="bi bi-inbox display-6 d-block mb-2"></i>
                        No hay pagos registrados
                    </td>
                </tr>
            `;
            return;
        }

        // Renderizar pagos de la página actual
        currentPagePagos.forEach(pago => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pago.id}</td>
                <td>${pago.fecha_pago || '2025-09-24'}</td>
                <td>${pago.paciente_nombre || 'Sin nombre'}</td>
                <td>${pago.concepto || 'Pago realizado'}</td>
                <td>$${pago.monto.toLocaleString()}</td>
                <td>${(pago.metodo_pago || 'efectivo').replace(/_/g, ' ')}</td>
                <td>
                    <span class="badge bg-success">
                        ${pago.estado || 'completado'}
                    </span>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary" onclick="verDetallePago(${pago.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Función específica para configurar paginación integrada de FAQs
    setupFaqsIntegrated() {
        if (!this.faqs || this.faqs.length === 0) {
            console.log('⚠️ No hay FAQs para configurar paginación');
            return;
        }
        
        console.log(`🔧 Configurando paginación integrada para ${this.faqs.length} FAQs`);
        
        // Configurar paginación
        this.paginationConfig.faqs = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: this.faqs.length,
            totalPages: Math.ceil(this.faqs.length / 10)
        };
        
        // Renderizar primera página
        this.renderFaqsPageIntegrated();
        
        // Actualizar información de paginación
        this.updatePaginationInfo('faqs');
        this.generatePagination('faqs');
        
        console.log('✅ Paginación de FAQs configurada correctamente');
    }

    // Función específica para renderizar página de FAQs con paginación integrada
    renderFaqsPageIntegrated() {
        const tbody = document.querySelector('#faqsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        const config = this.paginationConfig['faqs'];
        if (!config) return;

        // Calcular índices para la página actual
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = Math.min(startIndex + config.itemsPerPage, this.faqs.length);
        const currentPageFaqs = this.faqs.slice(startIndex, endIndex);

        if (currentPageFaqs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted py-4">
                        <i class="bi bi-question-circle display-6 d-block mb-2"></i>
                        No hay FAQs registradas
                    </td>
                </tr>
            `;
            return;
        }

        // Renderizar cada FAQ de la página actual
        currentPageFaqs.forEach(faq => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${faq.id}</td>
                <td>${faq.pregunta}</td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="dashboardAdmin.viewFAQ(${faq.id})" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="dashboardAdmin.openFaqModal(${faq.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboardAdmin.deleteFaq(${faq.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Función específica para configurar paginación integrada de Evaluaciones
    setupEvaluacionesIntegrated() {
        if (!this.evaluaciones || this.evaluaciones.length === 0) {
            console.log('⚠️ No hay Evaluaciones para configurar paginación');
            return;
        }
        
        console.log(`🔧 Configurando paginación integrada para ${this.evaluaciones.length} Evaluaciones`);
        
        // Configurar paginación
        this.paginationConfig.evaluaciones = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: this.evaluaciones.length,
            totalPages: Math.ceil(this.evaluaciones.length / 10)
        };
        
        // Renderizar primera página
        this.renderEvaluacionesPageIntegrated();
        
        // Actualizar información de paginación
        this.updatePaginationInfo('evaluaciones');
        this.generatePagination('evaluaciones');
        
        console.log('✅ Paginación de Evaluaciones configurada correctamente');
    }

    // Función específica para renderizar página de Evaluaciones con paginación integrada
    renderEvaluacionesPageIntegrated() {
        const tbody = document.querySelector('#evaluacionesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        const config = this.paginationConfig['evaluaciones'];
        if (!config) return;

        // Calcular índices para la página actual
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = Math.min(startIndex + config.itemsPerPage, this.evaluaciones.length);
        const currentPageEvaluaciones = this.evaluaciones.slice(startIndex, endIndex);

        if (currentPageEvaluaciones.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="bi bi-star display-6 d-block mb-2"></i>
                        No hay evaluaciones registradas
                    </td>
                </tr>
            `;
            return;
        }

        // Renderizar cada evaluación de la página actual
        currentPageEvaluaciones.forEach(evaluacion => {
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
                    <button class="btn btn-sm btn-info" onclick="dashboardAdmin.viewEvaluacion(${evaluacion.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar estadísticas solo con los datos de la página actual si es necesario
        // Solo actualizar las estadísticas generales una vez con todos los datos
        if (config.currentPage === 1) {
            this.updateEvaluacionesStats(this.evaluaciones);
        }
    }

    async loadInventario() {
        try {
            console.log('📦 Cargando inventario...');
            const res = await this.authFetch('/api/inventario');
            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            const inventario = await res.json();
            
            // Guardar inventario para uso posterior y sistema de paginación
            this.inventario = inventario;
            
            console.log(`✅ Inventario cargado desde BD: ${inventario.length} items`);
            
            // Usar el sistema de paginación integrada
            this.setupInventarioIntegrated();
            
        } catch (err) {
            console.error('Error al cargar inventario:', err);
            // Usar renderizado de fallback
            const tbody = document.querySelector('#inventarioTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="12" class="text-center text-danger">Error al cargar inventario</td></tr>';
            }
        }
    }
    
    // Función para renderizar tabla de inventario (faltaba esta función global)
    renderInventarioTable(inventario) {
        console.log('📦 Renderizando tabla de inventario con', inventario.length, 'items');
        
        const tbody = document.querySelector('#inventarioTableBody');
        if (!tbody) {
            console.error('No se encontró el tbody del inventario');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!inventario || inventario.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center text-muted py-4">
                        <i class="bi bi-box display-6 d-block mb-2"></i>
                        No hay productos en el inventario
                    </td>
                </tr>
            `;
            return;
        }
        
        inventario.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="form-check-input"></td>
                <td>${item.id || item.codigo || 'N/A'}</td>
                <td>${item.nombre || item.producto || item.equipo_nombre || 'Producto'}</td>
                <td>${item.categoria || item.equipo_categoria || 'Sin categoría'}</td>
                <td>${item.sede_nombre || 'Sin sede'}</td>
                <td>${item.cantidad || item.stock || 0}</td>
                <td>${item.stock_minimo || 0}</td>
                <td>$${(item.precio || item.equipo_precio || 0).toLocaleString()}</td>
                <td>$${((item.cantidad || 0) * (item.precio || item.equipo_precio || 0)).toLocaleString()}</td>
                <td><span class="badge bg-${(item.estado || 'activo') === 'activo' ? 'success' : 'secondary'}">${(item.estado || 'activo').toUpperCase()}</span></td>
                <td>${new Date(item.fecha_actualizacion || item.created_at || Date.now()).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="dashboardAdmin.openInventarioModal('${item.codigo || item.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="dashboardAdmin.deleteInventario('${item.codigo || item.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        console.log('✅ Tabla de inventario renderizada correctamente');
    }

    // Función específica para configurar paginación integrada de Inventario
    setupInventarioIntegrated() {
        if (!this.inventario || this.inventario.length === 0) {
            console.log('⚠️ No hay items de Inventario para configurar paginación');
            return;
        }
        
        console.log(`🔧 Configurando paginación integrada para ${this.inventario.length} items de Inventario`);
        
        // Configurar paginación
        this.paginationConfig.inventario = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: this.inventario.length,
            totalPages: Math.ceil(this.inventario.length / 10)
        };
        
        // Renderizar primera página
        this.renderInventarioPageIntegrated();
        
        // Actualizar información de paginación
        this.updatePaginationInfo('inventario');
        this.generatePagination('inventario');
        
        console.log('✅ Paginación de Inventario configurada correctamente');
    }

    // Función específica para renderizar página de Inventario con paginación integrada
    renderInventarioPageIntegrated() {
        const tbody = document.querySelector('#inventarioTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        const config = this.paginationConfig['inventario'];
        if (!config) return;

        // Calcular índices para la página actual
        const startIndex = (config.currentPage - 1) * config.itemsPerPage;
        const endIndex = Math.min(startIndex + config.itemsPerPage, this.inventario.length);
        const currentPageInventario = this.inventario.slice(startIndex, endIndex);

        if (currentPageInventario.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center text-muted py-4">
                        <i class="bi bi-box display-6 d-block mb-2"></i>
                        No hay productos en el inventario
                    </td>
                </tr>
            `;
            return;
        }

        // Renderizar cada item de inventario de la página actual
        currentPageInventario.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="form-check-input"></td>
                <td>${item.id || item.codigo || 'N/A'}</td>
                <td>${item.nombre || item.producto || item.equipo_nombre || 'Producto'}</td>
                <td>${item.categoria || item.equipo_categoria || 'Sin categoría'}</td>
                <td>${item.sede_nombre || 'Sin sede'}</td>
                <td>${item.cantidad || item.stock || 0}</td>
                <td>${item.stock_minimo || 0}</td>
                <td>$${(item.precio || item.equipo_precio || 0).toLocaleString()}</td>
                <td>$${((item.cantidad || 0) * (item.precio || item.equipo_precio || 0)).toLocaleString()}</td>
                <td><span class="badge bg-${(item.estado || 'activo') === 'activo' ? 'success' : 'secondary'}">${(item.estado || 'activo').toUpperCase()}</span></td>
                <td>${new Date(item.fecha_actualizacion || item.created_at || Date.now()).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="dashboardAdmin.openInventarioModal('${item.codigo || item.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="dashboardAdmin.deleteInventario('${item.codigo || item.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
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
        // Usar confirmación personalizada mejorada
        const confirmed = await this.showCustomConfirm({
            type: 'delete',
            title: '¿Eliminar producto?',
            message: `¿Está seguro de que desea eliminar este producto del inventario?`,
            details: `<strong>Código:</strong> ${codigo}`,
            warning: 'Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });
        
        if (!confirmed) return;
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

    // Excel export functionality removed - PDF export still available

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

    async showHistorialGeneral() {
        try {
            console.log('📊 Cargando historial general...');
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('historialGeneralModal'));
            modal.show();
            
            // Show loading state
            this.showLoadingInHistorial(true);
            
            // Fetch historial data
            const response = await fetch('/api/citas/admin/historial-general', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.populateHistorialData(data.estadisticas, data.citas);
            } else {
                throw new Error(data.message || 'Error al obtener historial');
            }
            
        } catch (error) {
            console.error('❌ Error al cargar historial:', error);
            this.showAlert('danger', 'Error al cargar el historial: ' + error.message);
        } finally {
            this.showLoadingInHistorial(false);
        }
    }
    
    showLoadingInHistorial(show) {
        const tbody = document.querySelector('#historialTable tbody');
        const estadisticasCards = document.querySelectorAll('#historialGeneralModal .card-title');
        
        if (show) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></td></tr>';
            estadisticasCards.forEach(card => card.textContent = '...');
        }
    }
    
    populateHistorialData(estadisticas, citas) {
        // Update statistics cards
        document.getElementById('totalCitasCambios').textContent = estadisticas.total_citas_con_cambios || 0;
        document.getElementById('totalReasignaciones').textContent = estadisticas.total_reasignaciones || 0;
        document.getElementById('totalCambiosEstado').textContent = estadisticas.total_cambios_estado || 0;
        document.getElementById('totalReprogramaciones').textContent = estadisticas.total_reprogramaciones || 0;
        
        // Update table
        const tbody = document.querySelector('#historialTable tbody');
        
        if (!citas || citas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No se encontraron citas con historial de cambios</td></tr>';
            return;
        }
        
        tbody.innerHTML = citas.map(cita => {
            const fecha = new Date(cita.fecha).toLocaleDateString('es-ES');
            const ultimoCambio = cita.ultimo_cambio ? cita.ultimo_cambio.substring(0, 50) + '...' : 'Sin detalles';
            
            return `
                <tr>
                    <td>${cita.id}</td>
                    <td>${fecha}</td>
                    <td>${cita.paciente || 'N/A'}</td>
                    <td>${cita.odontologo || 'N/A'}</td>
                    <td><span class="badge bg-${this.getEstadoBadgeColor(cita.estado)}">${cita.estado}</span></td>
                    <td>
                        <span class="badge bg-primary">${cita.total_cambios}</span>
                        <small class="text-muted d-block">
                            R: ${cita.tipos_cambios.reasignaciones} | 
                            E: ${cita.tipos_cambios.cambios_estado} | 
                            P: ${cita.tipos_cambios.reprogramaciones}
                        </small>
                    </td>
                    <td title="${cita.ultimo_cambio || ''}">${ultimoCambio}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" onclick="window.dashboardAdmin.showHistorialEspecifico(${cita.id})">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    getEstadoBadgeColor(estado) {
        const colorMap = {
            'confirmada': 'success',
            'pendiente': 'warning',
            'cancelada': 'danger',
            'completada': 'info',
            'en_curso': 'primary'
        };
        return colorMap[estado] || 'secondary';
    }
    
    async showHistorialEspecifico(citaId) {
        try {
            console.log(`📋 Cargando historial específico para cita ${citaId}...`);
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('historialEspecificoModal'));
            modal.show();
            
            // Update modal title
            document.getElementById('historialEspecificoModalLabel').innerHTML = 
                `<i class="bi bi-clock-history"></i> Historial Detallado - Cita #${citaId}`;
            
            // Show loading
            const modalBody = document.querySelector('#historialEspecificoModal .modal-body');
            modalBody.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
            
            // Fetch specific historial data
            const response = await fetch(`/api/citas/${citaId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.populateHistorialEspecifico(data.cita);
            } else {
                throw new Error(data.message || 'Error al obtener detalles de la cita');
            }
            
        } catch (error) {
            console.error('❌ Error al cargar historial específico:', error);
            this.showAlert('danger', 'Error al cargar el historial detallado: ' + error.message);
        }
    }
    
    populateHistorialEspecifico(cita) {
        const modalBody = document.querySelector('#historialEspecificoModal .modal-body');
        const notas = cita.notas || '';
        const cambios = notas.split('\n').filter(linea => linea.trim() !== '');
        
        let historialHTML = `
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">Información de la Cita</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>ID:</strong> ${cita.id}</p>
                            <p><strong>Fecha:</strong> ${new Date(cita.fecha).toLocaleDateString('es-ES')}</p>
                            <p><strong>Hora:</strong> ${cita.hora}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Estado:</strong> <span class="badge bg-${this.getEstadoBadgeColor(cita.estado)}">${cita.estado}</span></p>
                            <p><strong>Paciente:</strong> ${cita.paciente_nombre || 'N/A'}</p>
                            <p><strong>Odontólogo:</strong> ${cita.odontologo_nombre || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (cambios.length === 0) {
            historialHTML += `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> Esta cita no tiene registros de cambios.
                </div>
            `;
        } else {
            historialHTML += `
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Historial de Cambios</h6>
                    </div>
                    <div class="card-body">
                        <div class="timeline">
            `;
            
            cambios.forEach((cambio, index) => {
                const iconClass = this.getChangeIcon(cambio);
                const badgeClass = this.getChangeBadgeClass(cambio);
                
                historialHTML += `
                    <div class="timeline-item mb-3">
                        <div class="d-flex align-items-start">
                            <span class="badge ${badgeClass} me-3 mt-1">
                                <i class="${iconClass}"></i>
                            </span>
                            <div class="flex-grow-1">
                                <p class="mb-1">${cambio}</p>
                                <small class="text-muted">Registro ${index + 1} de ${cambios.length}</small>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            historialHTML += `
                        </div>
                    </div>
                </div>
            `;
        }
        
        modalBody.innerHTML = historialHTML;
    }
    
    getChangeIcon(cambio) {
        if (cambio.includes('Reasignación:')) return 'bi bi-person-check';
        if (cambio.includes('Estado cambiado:')) return 'bi bi-arrow-repeat';
        if (cambio.includes('Reprogramación:')) return 'bi bi-calendar-event';
        return 'bi bi-pencil';
    }
    
    getChangeBadgeClass(cambio) {
        if (cambio.includes('Reasignación:')) return 'bg-warning';
        if (cambio.includes('Estado cambiado:')) return 'bg-info';
        if (cambio.includes('Reprogramación:')) return 'bg-success';
        return 'bg-secondary';
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
                const estadoClass = this.getStatusBadgeClass(cita.estado);
                html += `
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">
                                <i class="bi bi-clock"></i> ${cita.hora}
                                <span class="badge bg-${estadoClass} ms-2">${cita.estado}</span>
                            </h6>
                        </div>
                        <p class="mb-1">
                            <i class="bi bi-person"></i> ${cita.paciente_completo}
                        </p>
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
        modalDiv.id = 'citasDelDiaModal';
        modalDiv.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-calendar-day"></i> Citas - ${fechaFormateada}
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

    // Sistema de paginación
    initializePagination() {
        this.paginationConfig = {
            usuarios: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 1 },
            citas: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 1 },
            inventario: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 1 },
            pagos: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 1 },
            evaluaciones: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 1 }
        };
    }

    changeItemsPerPage(section, value) {
        // Manejo especial para citas con datos reales
        if (section === 'citas' && this.citas && this.citas.length > 0) {
            const config = this.paginationConfig[section] || {};
            config.itemsPerPage = parseInt(value);
            config.currentPage = 1;
            config.totalItems = this.citas.length;
            config.totalPages = Math.ceil(config.totalItems / config.itemsPerPage);
            
            this.paginationConfig[section] = config;
            
            // Re-renderizar la tabla con nueva paginación
            this.renderCitasPageIntegrated();
            this.updatePaginationInfo(section);
            this.generatePagination(section);
            
            console.log(`✅ Citas: Cambiado a ${value} elementos por página (datos reales)`);
            return;
        }
        
        // Manejo especial para pagos con datos reales
        if (section === 'pagos' && this.pagos && this.pagos.length > 0) {
            const config = this.paginationConfig[section] || {};
            config.itemsPerPage = parseInt(value);
            config.currentPage = 1;
            config.totalItems = this.pagos.length;
            config.totalPages = Math.ceil(config.totalItems / config.itemsPerPage);
            
            this.paginationConfig[section] = config;
            
            // Re-renderizar la tabla con nueva paginación
            this.renderPagosPageIntegrated();
            this.updatePaginationInfo(section);
            this.generatePagination(section);
            
            console.log(`✅ Pagos: Cambiado a ${value} elementos por página (datos reales)`);
            return;
        }
        
        // Manejo especial para FAQs con datos reales
        if (section === 'faqs' && this.faqs && this.faqs.length > 0) {
            const config = this.paginationConfig[section] || {};
            config.itemsPerPage = parseInt(value);
            config.currentPage = 1;
            config.totalItems = this.faqs.length;
            config.totalPages = Math.ceil(config.totalItems / config.itemsPerPage);
            
            this.paginationConfig[section] = config;
            
            // Re-renderizar la tabla con nueva paginación
            this.renderFaqsPageIntegrated();
            this.updatePaginationInfo(section);
            this.generatePagination(section);
            
            console.log(`✅ FAQs: Cambiado a ${value} elementos por página (datos reales)`);
            return;
        }
        
        // Manejo especial para Evaluaciones con datos reales
        if (section === 'evaluaciones' && this.evaluaciones && this.evaluaciones.length > 0) {
            const config = this.paginationConfig[section] || {};
            config.itemsPerPage = parseInt(value);
            config.currentPage = 1;
            config.totalItems = this.evaluaciones.length;
            config.totalPages = Math.ceil(config.totalItems / config.itemsPerPage);
            
            this.paginationConfig[section] = config;
            
            // Re-renderizar la tabla con nueva paginación
            this.renderEvaluacionesPageIntegrated();
            this.updatePaginationInfo(section);
            this.generatePagination(section);
            
            console.log(`✅ Evaluaciones: Cambiado a ${value} elementos por página (datos reales)`);
            return;
        }
        
        // Manejo especial para Inventario con datos reales
        if (section === 'inventario' && this.inventario && this.inventario.length > 0) {
            const config = this.paginationConfig[section] || {};
            config.itemsPerPage = parseInt(value);
            config.currentPage = 1;
            config.totalItems = this.inventario.length;
            config.totalPages = Math.ceil(config.totalItems / config.itemsPerPage);
            
            this.paginationConfig[section] = config;
            
            // Re-renderizar la tabla con nueva paginación
            this.renderInventarioPageIntegrated();
            this.updatePaginationInfo(section);
            this.generatePagination(section);
            
            console.log(`✅ Inventario: Cambiado a ${value} elementos por página (datos reales)`);
            return;
        }
        
        // Comportamiento normal para otras secciones
        const config = this.paginationConfig[section];
        if (!config) return;
        
        config.itemsPerPage = parseInt(value);
        config.currentPage = 1;
        this.updatePaginationInfo(section);
        this.generatePagination(section);
        console.log(`${section}: Cambiado a ${value} elementos por página`);
    }

    changePage(section, page) {
        // Manejo especial para citas con datos reales
        if (section === 'citas' && this.citas && this.citas.length > 0) {
            const config = this.paginationConfig[section];
            if (!config || page < 1 || page > config.totalPages) return;
            
            config.currentPage = page;
            
            // Re-renderizar la tabla con nueva página
            this.renderCitasPageIntegrated();
            this.updatePaginationInfo(section);
            this.generatePagination(section);
            
            console.log(`✅ Citas: Cambiado a página ${page} (datos reales)`);
            return;
        }
        
        // Manejo especial para pagos con datos reales
        if (section === 'pagos' && this.pagos && this.pagos.length > 0) {
            const config = this.paginationConfig[section];
            if (!config || page < 1 || page > config.totalPages) return;
            
            config.currentPage = page;
            
            // Re-renderizar la tabla con nueva página
            this.renderPagosPageIntegrated();
            this.updatePaginationInfo(section);
            this.generatePagination(section);
            
            console.log(`✅ Pagos: Cambiado a página ${page} (datos reales)`);
            return;
        }
        
        // Manejo especial para FAQs con datos reales
        if (section === 'faqs' && this.faqs && this.faqs.length > 0) {
            const config = this.paginationConfig[section];
            if (!config || page < 1 || page > config.totalPages) return;
            
            config.currentPage = page;
            
            // Re-renderizar la tabla con nueva página
            this.renderFaqsPageIntegrated();
            this.updatePaginationInfo(section);
            this.generatePagination(section);
            
            console.log(`✅ FAQs: Cambiado a página ${page} (datos reales)`);
            return;
        }
        
        // Manejo especial para Evaluaciones con datos reales
        if (section === 'evaluaciones' && this.evaluaciones && this.evaluaciones.length > 0) {
            const config = this.paginationConfig[section];
            if (!config || page < 1 || page > config.totalPages) return;
            
            config.currentPage = page;
            
            // Re-renderizar la tabla con nueva página
            this.renderEvaluacionesPageIntegrated();
            this.updatePaginationInfo(section);
            this.generatePagination(section);
            
            console.log(`✅ Evaluaciones: Cambiado a página ${page} (datos reales)`);
            return;
        }
        
        // Manejo especial para Inventario con datos reales
        if (section === 'inventario' && this.inventario && this.inventario.length > 0) {
            const config = this.paginationConfig[section];
            if (!config || page < 1 || page > config.totalPages) return;
            
            config.currentPage = page;
            
            // Re-renderizar la tabla con nueva página
            this.renderInventarioPageIntegrated();
            this.updatePaginationInfo(section);
            this.generatePagination(section);
            
            console.log(`✅ Inventario: Cambiado a página ${page} (datos reales)`);
            return;
        }
        
        // Comportamiento normal para otras secciones
        const config = this.paginationConfig[section];
        if (!config || page < 1 || page > config.totalPages) return;
        
        config.currentPage = page;
        this.updatePaginationInfo(section);
        this.generatePagination(section);
        console.log(`${section}: Cambiado a página ${page}`);
    }

    updatePaginationInfo(section) {
        const config = this.paginationConfig[section];
        const start = (config.currentPage - 1) * config.itemsPerPage + 1;
        const end = Math.min(config.currentPage * config.itemsPerPage, config.totalItems);
        
        const showingElement = document.getElementById(`${section}Showing`);
        const totalElement = document.getElementById(`${section}Total`);
        const currentPageElement = document.getElementById(`${section}CurrentPage`);
        const totalPagesElement = document.getElementById(`${section}TotalPages`);
        const paginationInfo = document.getElementById(`${section}PaginationInfo`);
        
        if (showingElement) showingElement.textContent = `${start}-${end}`;
        if (totalElement) totalElement.textContent = config.totalItems;
        if (currentPageElement) currentPageElement.textContent = config.currentPage;
        if (totalPagesElement) totalPagesElement.textContent = config.totalPages;
        
        if (paginationInfo) {
            paginationInfo.style.display = config.totalItems > 0 ? 'flex' : 'none';
        }
    }

    generatePagination(section) {
        const config = this.paginationConfig[section];
        const paginationContainer = document.getElementById(`${section}Pagination`);
        
        if (!paginationContainer) return;
        
        if (config.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        let paginationHTML = '<ul class="pagination pagination-sm justify-content-center mb-0">';
        
        // Botón anterior
            paginationHTML += `
                <li class="page-item ${config.currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePageAdmin('${section}', ${config.currentPage - 1}); return false;">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
            `;        // Páginas numeradas
        const startPage = Math.max(1, config.currentPage - 2);
        const endPage = Math.min(config.totalPages, config.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePageAdmin('${section}', 1); return false;">1</a></li>`;
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<li class="page-item ${i === config.currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="changePageAdmin('${section}', ${i}); return false;">${i}</a></li>`;
        }
        
        if (endPage < config.totalPages) {
            if (endPage < config.totalPages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePageAdmin('${section}', ${config.totalPages}); return false;">${config.totalPages}</a></li>`;
        }
        
        // Botón siguiente
        paginationHTML += `
            <li class="page-item ${config.currentPage === config.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePageAdmin('${section}', ${config.currentPage + 1}); return false;">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;
        
        paginationHTML += '</ul>';
        paginationContainer.innerHTML = paginationHTML;
    }

    // Función para actualizar breadcrumb
    updateBreadcrumb(section, subsection = null) {
        const breadcrumbElement = document.getElementById('currentBreadcrumb');
        if (!breadcrumbElement) return;
        
        const sectionNames = {
            'dashboard': 'Inicio',
            'usuarios': 'Usuarios',
            'citas': 'Citas',
            'reportes': 'Reportes',
            'faqs': 'FAQs',
            'evaluaciones': 'Evaluaciones',
            'inventario': 'Inventario',
            'pagos': 'Pagos y Servicios'
        };
        
        let breadcrumbText = sectionNames[section] || section;
        if (subsection) {
            breadcrumbText += ` > ${subsection}`;
        }
        
        breadcrumbElement.textContent = breadcrumbText;
    }

    // Métodos para manejar FAQs
    openFaqModal(id = null) {
        const modal = new bootstrap.Modal(document.getElementById('faqModal'));
        document.getElementById('faqForm').reset();
        
        if (id) {
            // Editar FAQ existente
            document.getElementById('faqModalLabel').textContent = 'Editar FAQ';
            
            // Buscar la FAQ en los datos cargados
            const faq = this.currentFaqs?.find(f => f.id === id);
            if (faq) {
                document.getElementById('faqPregunta').value = faq.pregunta || '';
                document.getElementById('faqRespuesta').value = faq.respuesta || '';
                document.getElementById('faqActiva').checked = faq.activa !== false;
            }
        } else {
            // Nueva FAQ
            document.getElementById('faqModalLabel').textContent = 'Nueva Pregunta Frecuente';
            document.getElementById('faqActiva').checked = true;
        }
        
        // Configurar el botón de guardar
        const saveBtn = document.getElementById('saveFaqBtn');
        saveBtn.onclick = null;
        saveBtn.onclick = () => this.saveFaq(id);
        
        modal.show();
    }

    async saveFaq(id = null) {
        const pregunta = document.getElementById('faqPregunta').value.trim();
        const respuesta = document.getElementById('faqRespuesta').value.trim();
        const activa = document.getElementById('faqActiva').checked;
        
        // Validaciones
        if (!pregunta || !respuesta) {
            alert('Por favor complete todos los campos obligatorios');
            return;
        }
        
        const faqData = {
            pregunta,
            respuesta,
            activa
        };
        
        try {
            let response;
            if (id) {
                // Actualizar FAQ existente
                response = await this.authFetch(`/api/faqs/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(faqData)
                });
            } else {
                // Crear nueva FAQ
                response = await this.authFetch('/api/faqs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(faqData)
                });
            }
            
            if (response.ok) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('faqModal'));
                modal.hide();
                
                // Mostrar mensaje de éxito
                this.showAlert(`FAQ ${id ? 'actualizada' : 'creada'} exitosamente`, 'success');
                
                // Recargar la lista de FAQs
                await this.loadFAQs();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al guardar la FAQ');
            }
        } catch (error) {
            console.error('Error al guardar FAQ:', error);
            this.showAlert('Error al guardar la FAQ: ' + error.message, 'danger');
        }
    }

    async deleteFaq(id) {
        if (!confirm('¿Está seguro de que desea eliminar esta FAQ?')) {
            return;
        }
        
        try {
            const response = await this.authFetch(`/api/faqs/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.showAlert('FAQ eliminada exitosamente', 'success');
                await this.loadFAQs(); // Recargar la lista
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar la FAQ');
            }
        } catch (error) {
            console.error('Error al eliminar FAQ:', error);
            this.showAlert('Error al eliminar la FAQ: ' + error.message, 'danger');
        }
    }

    viewFAQ(id) {
        // Buscar la FAQ en los datos cargados
        const faq = this.currentFaqs?.find(f => f.id === id);
        if (faq) {
            const estado = faq.activa ? 'Activa' : 'Inactiva';
            alert(`Pregunta: ${faq.pregunta}\n\nRespuesta: ${faq.respuesta}\n\nEstado: ${estado}`);
        } else {
            this.showAlert('FAQ no encontrada', 'warning');
        }
    }

    showAlert(message, type = 'info') {
        // Crear elemento de alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
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
    if (!window.dashboardAdmin) {
        console.log('🚀 Creando instancia única de DashboardAdmin');
        window.dashboardAdmin = new DashboardAdmin();
    } else {
        console.log('⚠️ DashboardAdmin ya existe, saltando inicialización');
    }
    
    // Event listeners para tabs de inventario
    const inventarioTabs = document.querySelectorAll('#inventarioTab button[data-bs-toggle="tab"]');
    inventarioTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', (event) => {
            const targetId = event.target.getAttribute('data-bs-target');
            console.log('📋 Tab de inventario cambiado:', targetId);
            
            switch (targetId) {
                case '#equipos-inventario':
                    console.log('🔧 Cargando equipos...');
                    if (typeof cargarInventario === 'function') {
                        cargarInventario();
                    }
                    // Inicializar paginación para inventario
                    setTimeout(() => {
                        if (typeof initializePaginationAdmin === 'function') {
                            initializePaginationAdmin('inventario');
                        }
                    }, 500);
                    break;
                case '#sedes-gestion':
                    console.log('🏢 Cargando sedes...');
                    if (typeof cargarGestionSedes === 'function') {
                        cargarGestionSedes();
                    }
                    // Inicializar paginación para sedes
                    setTimeout(() => {
                        if (typeof initializePaginationAdmin === 'function') {
                            initializePaginationAdmin('sedes');
                        }
                    }, 500);
                    break;
                case '#proveedores-inventario':
                    console.log('🚚 Cargando proveedores...');
                    if (typeof cargarProveedores === 'function') {
                        cargarProveedores();
                    }
                    // Inicializar paginación para proveedores
                    setTimeout(() => {
                        if (typeof initializePaginationAdmin === 'function') {
                            initializePaginationAdmin('proveedores');
                        }
                    }, 500);
                    break;
                case '#categorias-inventario':
                    console.log('🏷️ Cargando categorías...');
                    if (typeof cargarCategorias === 'function') {
                        cargarCategorias();
                    }
                    // Inicializar paginación para categorias
                    setTimeout(() => {
                        if (typeof initializePaginationAdmin === 'function') {
                            initializePaginationAdmin('categorias');
                        }
                    }, 500);
                    break;
                case '#movimientos-inventario':
                    console.log('📦 Cargando movimientos...');
                    if (typeof cargarMovimientos === 'function') {
                        cargarMovimientos();
                    }
                    break;
            }
        });
    });
    
    // Cargar proveedores por defecto al ir a la sección de inventario
    setTimeout(() => {
        const inventarioSection = document.getElementById('inventario-section');
        if (inventarioSection && !inventarioSection.classList.contains('d-none')) {
            console.log('📦 Cargando datos iniciales de inventario...');
            if (typeof cargarInventario === 'function') {
                cargarInventario();
            }
        }
    }, 1000);
});

} // Cierre del check de dashboardAdmin
} // Cierre del check de inicialización

// ==========================================
// FUNCIONES GLOBALES PARA PAGOS Y FACTURAS EN DASHBOARD ADMIN
// ==========================================

// Función para formatear moneda
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

// Datos de ejemplo para pagos - DESHABILITADOS para usar API real
// window.pagosEjemplo = [];

// Datos de ejemplo para facturas
window.facturasEjemplo = [
    {
        id: 1,
        numero_factura: 'FAC-001-2025',

        total: 150000,
        subtotal: 126050,
        impuestos: 23950,
        fecha_emision: '2025-09-01',
        fecha_vencimiento: '2025-09-15',
        estado: 'pagada',
        concepto: 'Consulta general',
        descripcion: 'Consulta general odontológica y limpieza dental'
    },
    {
        id: 2,
        numero_factura: 'FAC-002-2025',
        paciente_nombre: 'Juan Pérez',
        total: 75000,
        subtotal: 63025,
        impuestos: 11975,
        fecha_emision: '2025-09-05',
        fecha_vencimiento: '2025-09-19',
        estado: 'pendiente',
        concepto: 'Limpieza dental',
        descripcion: 'Profilaxis y fluorización'
    },
    {
        id: 3,
        numero_factura: 'FAC-003-2025',
        paciente_nombre: 'Ana López',
        total: 300000,
        subtotal: 252100,
        impuestos: 47900,
        fecha_emision: '2025-09-08',
        fecha_vencimiento: '2025-09-22',
        estado: 'pagada',
        concepto: 'Endodoncia',
        descripcion: 'Tratamiento de conductos pieza 16'
    },
    {
        id: 4,
        numero_factura: 'FAC-004-2025',
        paciente_nombre: 'Carlos Rodríguez',
        total: 450000,
        subtotal: 378151,
        impuestos: 71849,
        fecha_emision: '2025-09-10',
        fecha_vencimiento: '2025-09-24',
        estado: 'vencida',
        concepto: 'Ortodoncia',
        descripcion: 'Instalación de brackets metálicos'
    }
];

// ==========================================
// FUNCIONES GLOBALES PARA PAGOS (Dashboard Admin)
// ==========================================

// Función principal para ver pago
window.verPago = async function(id) {
    console.log('🔍 DASHBOARD ADMIN - Ver detalles del pago:', id);
    
    try {
        // Obtener datos del pago desde la API
        const response = await fetch(`/api/pagos/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const pago = await response.json();
        
        if (!pago) {
            console.error('❌ Pago no encontrado con ID:', id);
            alert('Pago no encontrado. ID: ' + id);
            return;
        }
        
        console.log('✅ Pago encontrado:', pago);
        
        // Crear y mostrar modal manualmente
        const modalHtml = `
            <div class="modal fade" id="modalPagoTemporal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-dollar-sign"></i> Detalles del Pago #${pago.id}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-user"></i> Información del Paciente</h6>
                                    <p><strong>Nombre:</strong> ${pago.paciente_nombre}</p>
                                    <p><strong>Concepto:</strong> ${pago.concepto}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-calendar"></i> Información del Pago</h6>
                                    <p><strong>Fecha:</strong> ${pago.fecha}</p>
                                    <p><strong>Método:</strong> ${pago.metodo_pago}</p>
                                    <p><strong>Estado:</strong> <span class="badge bg-${pago.estado === 'completado' ? 'success' : 'warning'}">${pago.estado}</span></p>
                                </div>
                            </div>
                            <div class="mt-3">
                                <h6><i class="fas fa-file-alt"></i> Descripción</h6>
                                <p>${pago.descripcion}</p>
                            </div>
                            <div class="mt-3 text-center">
                                <h5 class="text-success">
                                    <i class="fas fa-money-bill-wave"></i> Monto Total: ${formatearMoneda(pago.monto)}
                                </h5>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-success" onclick="window.imprimirPago(${pago.id})">
                                <i class="fas fa-print"></i> Imprimir Recibo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalPagoTemporal');
        if (modalAnterior) {
            modalAnterior.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalPagoTemporal'));
        modal.show();
        
    } catch (error) {
        console.error('❌ Error al ver pago:', error);
        alert('Error: ' + error.message);
    }
};

// Función principal para imprimir pago
window.imprimirPago = async function(id) {
    console.log('🖨️ DASHBOARD ADMIN - Imprimir pago:', id);
    
    try {
        // Obtener datos del pago desde la API
        const response = await fetch(`/api/pagos/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const pago = await response.json();
        
        if (!pago) {
            alert('Pago no encontrado para imprimir');
            return;
        }
        
        // Crear contenido de impresión
        const contenidoImpresion = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recibo de Pago ${pago.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #28a745; padding-bottom: 20px; }
                    .logo { font-size: 28px; font-weight: bold; color: #28a745; }
                    .recibo-numero { font-size: 24px; font-weight: bold; color: #28a745; }
                    .info-section { display: flex; justify-content: space-between; margin: 30px 0; }
                    .info-box { width: 48%; background: #f8f9fa; padding: 15px; border-radius: 8px; }
                    .monto { text-align: center; margin: 30px 0; background: #d4edda; padding: 20px; border-radius: 8px; }
                    .monto-valor { font-size: 36px; font-weight: bold; color: #155724; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo">🦷 CLINIK DENT</div>
                        <div>Clínica Odontológica</div>
                        <div>NIT: 900.123.456-7</div>
                    </div>
                    <div>
                        <div class="recibo-numero">RECIBO DE PAGO</div>
                        <div class="recibo-numero">#${pago.id}</div>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-box">
                        <h4>DATOS DEL PACIENTE</h4>
                        <p><strong>Nombre:</strong> ${pago.paciente_nombre}</p>
                        <p><strong>Concepto:</strong> ${pago.concepto}</p>
                    </div>
                    <div class="info-box">
                        <h4>INFORMACIÓN DE PAGO</h4>
                        <p><strong>Fecha:</strong> ${pago.fecha}</p>
                        <p><strong>Método de Pago:</strong> ${pago.metodo_pago}</p>
                        <p><strong>Estado:</strong> ${pago.estado}</p>
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <h4>DESCRIPCIÓN DEL SERVICIO</h4>
                    <p>${pago.descripcion}</p>
                </div>
                
                <div class="monto">
                    <div>MONTO PAGADO</div>
                    <div class="monto-valor">${formatearMoneda(pago.monto)}</div>
                </div>
                
                <div style="text-align: center; margin-top: 40px; color: #666;">
                    <p>Gracias por su pago</p>
                    <p>Este recibo fue generado electrónicamente</p>
                </div>
            </body>
            </html>
        `;
        
        // Abrir ventana de impresión
        const ventana = window.open('', '_blank', 'width=800,height=600');
        ventana.document.write(contenidoImpresion);
        ventana.document.close();
        ventana.focus();
        ventana.print();
        
        // Cerrar después de un momento
        setTimeout(() => ventana.close(), 1000);
        
    } catch (error) {
        console.error('❌ Error al imprimir pago:', error);
        alert('Error al imprimir: ' + error.message);
    }
};

// ==========================================
// FUNCIONES GLOBALES PARA FACTURAS (Dashboard Admin)
// ==========================================

// Función principal para ver factura
window.verFactura = function(id) {
    console.log('🔍 DASHBOARD ADMIN - Ver detalles de la factura:', id);
    
    try {
        const factura = window.facturasEjemplo.find(f => f.id == id);
        
        if (!factura) {
            console.error('❌ Factura no encontrada con ID:', id);
            alert('Factura no encontrada. ID: ' + id);
            return;
        }
        
        console.log('✅ Factura encontrada:', factura);
        
        // Crear y mostrar modal manualmente
        const modalHtml = `
            <div class="modal fade" id="modalFacturaTemporal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-file-invoice"></i> Detalles de la Factura ${factura.numero_factura}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-file-invoice"></i> Información de la Factura</h6>
                                    <p><strong>Número:</strong> ${factura.numero_factura}</p>
                                    <p><strong>Fecha de Emisión:</strong> ${factura.fecha_emision}</p>
                                    <p><strong>Fecha de Vencimiento:</strong> ${factura.fecha_vencimiento}</p>
                                    <p><strong>Estado:</strong> <span class="badge bg-${factura.estado === 'pagada' ? 'success' : factura.estado === 'pendiente' ? 'warning' : 'danger'}">${factura.estado}</span></p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-user"></i> Información del Paciente</h6>
                                    <p><strong>Nombre:</strong> ${factura.paciente_nombre}</p>
                                    <p><strong>Concepto:</strong> ${factura.concepto}</p>
                                </div>
                            </div>
                            <div class="mt-3">
                                <h6><i class="fas fa-calculator"></i> Información Financiera</h6>
                                <div class="row">
                                    <div class="col-md-8">
                                        <p><strong>Descripción:</strong> ${factura.descripcion}</p>
                                    </div>
                                    <div class="col-md-4">
                                        <p><strong>Subtotal:</strong> ${formatearMoneda(factura.subtotal)}</p>
                                        <p><strong>IVA:</strong> ${formatearMoneda(factura.impuestos)}</p>
                                        <p><strong>Total:</strong> <span class="text-success fs-5">${formatearMoneda(factura.total)}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            ${factura.estado !== 'pagada' ? `<button type="button" class="btn btn-success" onclick="window.cobrarFactura(${factura.id})"><i class="fas fa-dollar-sign"></i> Cobrar</button>` : ''}
                            <button type="button" class="btn btn-primary" onclick="window.imprimirFactura(${factura.id})">
                                <i class="fas fa-print"></i> Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalFacturaTemporal');
        if (modalAnterior) {
            modalAnterior.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalFacturaTemporal'));
        modal.show();
        
    } catch (error) {
        console.error('❌ Error al ver factura:', error);
        alert('Error: ' + error.message);
    }
};

// Función principal para imprimir factura
window.imprimirFactura = function(id) {
    console.log('🖨️ DASHBOARD ADMIN - Imprimir factura:', id);
    
    try {
        const factura = window.facturasEjemplo.find(f => f.id == id);
        
        if (!factura) {
            alert('Factura no encontrada para imprimir');
            return;
        }
        
        // Crear contenido de impresión
        const contenidoImpresion = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Factura ${factura.numero_factura}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #007bff; padding-bottom: 20px; }
                    .logo { font-size: 28px; font-weight: bold; color: #007bff; }
                    .factura-numero { font-size: 24px; font-weight: bold; color: #007bff; }
                    .info-section { display: flex; justify-content: space-between; margin: 30px 0; }
                    .info-box { width: 48%; background: #f8f9fa; padding: 15px; border-radius: 8px; }
                    .totales { margin-left: 60%; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; }
                    .total-final { font-size: 18px; font-weight: bold; color: #28a745; border-top: 2px solid #28a745; padding-top: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo">🦷 CLINIK DENT</div>
                        <div>Clínica Odontológica</div>
                        <div>NIT: 900.123.456-7</div>
                    </div>
                    <div>
                        <div class="factura-numero">FACTURA</div>
                        <div class="factura-numero">${factura.numero_factura}</div>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-box">
                        <h4>DATOS DEL PACIENTE</h4>
                        <p><strong>Nombre:</strong> ${factura.paciente_nombre}</p>
                        <p><strong>Concepto:</strong> ${factura.concepto}</p>
                    </div>
                    <div class="info-box">
                        <h4>INFORMACIÓN DE FACTURA</h4>
                        <p><strong>Fecha de Emisión:</strong> ${factura.fecha_emision}</p>
                        <p><strong>Fecha de Vencimiento:</strong> ${factura.fecha_vencimiento}</p>
                        <p><strong>Estado:</strong> ${factura.estado}</p>
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <h4>DESCRIPCIÓN DE SERVICIOS</h4>
                    <p>${factura.descripcion}</p>
                </div>
                
                <div class="totales">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Subtotal:</span>
                        <span>${formatearMoneda(factura.subtotal)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>IVA (19%):</span>
                        <span>${formatearMoneda(factura.impuestos)}</span>
                    </div>
                    <div class="total-final" style="display: flex; justify-content: space-between;">
                        <span>TOTAL A PAGAR:</span>
                        <span>${formatearMoneda(factura.total)}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 40px; color: #666;">
                    <p>Gracias por confiar en Clinik Dent</p>
                    <p>Esta factura fue generada electrónicamente</p>
                </div>
            </body>
            </html>
        `;
        
        // Abrir ventana de impresión
        const ventana = window.open('', '_blank', 'width=800,height=600');
        ventana.document.write(contenidoImpresion);
        ventana.document.close();
        ventana.focus();
        ventana.print();
        
        // Cerrar después de un momento
        setTimeout(() => ventana.close(), 1000);
        
    } catch (error) {
        console.error('❌ Error al imprimir factura:', error);
        alert('Error al imprimir: ' + error.message);
    }
};

// Función para cobrar factura
window.cobrarFactura = function(id) {
    console.log('💰 DASHBOARD ADMIN - Cobrar factura:', id);
    alert(`Funcionalidad de cobro para factura ${id} - Se puede integrar con el sistema de pagos`);
};

// ===== FUNCIONES GLOBALES PARA INVENTARIO Y SEDES =====

// Función de notificación global
window.showNotification = function(message, type = 'success') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Crear el toast
    const toastContainer = document.querySelector('.toast-container') || (() => {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    })();
    
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="bi bi-${
                    type === 'success' ? 'check-circle-fill text-success' :
                    type === 'error' ? 'x-circle-fill text-danger' :
                    type === 'warning' ? 'exclamation-triangle-fill text-warning' :
                    'info-circle-fill text-info'
                } me-2"></i>
                <strong class="me-auto">${
                    type === 'success' ? 'Éxito' :
                    type === 'error' ? 'Error' :
                    type === 'warning' ? 'Advertencia' :
                    'Información'
                }</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: type === 'error' ? 6000 : 4000
    });
    
    toast.show();
    
    // Limpiar el toast después de que se oculte
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
};

// Aliases para funciones de inventario (equipos)
window.verDetallesInventario = function(id) {
    console.log('🔍 Ver detalles del equipo:', id);
    if (typeof verDetallesEquipo === 'function') {
        return verDetallesEquipo(id);
    } else {
        console.warn('Función verDetallesEquipo no encontrada, mostrando información básica');
        showNotification(`Ver detalles del equipo #${id}`, 'info');
    }
};

window.editarInventario = function(id) {
    console.log('✏️ Editar equipo:', id);
    if (typeof editarEquipo === 'function') {
        return editarEquipo(id);
    } else {
        console.warn('Función editarEquipo no encontrada');
        showNotification('Función de edición en desarrollo', 'warning');
    }
};

window.eliminarInventario = function(id) {
    console.log('🗑️ Eliminar equipo:', id);
    if (typeof eliminarEquipo === 'function') {
        return eliminarEquipo(id);
    } else {
        console.warn('Función eliminarEquipo no encontrada');
        if (confirm(`¿Está seguro de que desea eliminar el equipo #${id}?`)) {
            showNotification('Función de eliminación en desarrollo', 'warning');
        }
    }
};

console.log('✅ Funciones globales para pagos y facturas cargadas en Dashboard Admin');
console.log('✅ Funciones globales para inventario y sedes cargadas en Dashboard Admin');

// Función adicional para asegurar que el usuario se carga correctamente
// Se ejecuta después de que todo el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DEBUG - DOM completamente cargado');
    
    // Esperamos un poco más para que todos los otros scripts terminen
    setTimeout(() => {
        console.log('🔍 DEBUG - Verificando usuario final...');
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                const nombreCompleto = `${userData.nombre || ''} ${userData.apellido || ''}`.trim();
                
                console.log('🔍 DEBUG - Usuario en localStorage:', userData);
                console.log('🔍 DEBUG - Nombre completo calculado:', nombreCompleto);
                
                const userNameElement = document.getElementById('userName');
                if (userNameElement && nombreCompleto) {
                    // Solo actualizar si no es el nombre que queremos
                    const currentText = userNameElement.textContent;
                    if (currentText === 'Cargando...' || currentText === 'Administrador' || currentText === 'Admin Sistema') {
                        userNameElement.textContent = nombreCompleto;
                        console.log('✅ DEBUG - Nombre actualizado finalmente a:', nombreCompleto);
                    } else {
                        console.log('ℹ️ DEBUG - Nombre ya está correcto:', currentText);
                    }
                }
            } catch (error) {
                console.error('❌ DEBUG - Error parseando usuario:', error);
            }
        } else {
            console.log('❌ DEBUG - No hay usuario en localStorage');
        }
    }, 2000); // Esperamos 2 segundos para estar seguros
});

// ========================================
// FUNCIONES DE CARGA DE PAGOS DESDE API
// ========================================

async function cargarPagosDesdeAPI() {
    try {
        console.log('💰 Cargando pagos desde API...');
        
        const response = await fetch('/api/pagos');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Datos de pagos recibidos:', data);
        
        // Almacenar datos en dashboardAdmin para paginación
        if (window.dashboardAdmin) {
            window.dashboardAdmin.pagos = data.pagos || [];
            console.log(`📋 Pagos almacenados: ${window.dashboardAdmin.pagos.length}`);
            
            // Configurar paginación integrada
            window.dashboardAdmin.setupPagosIntegrated();
        } else {
            // Fallback si dashboardAdmin no está disponible
            renderPagosDirectly(data.pagos || []);
        }
        
    } catch (error) {
        console.error('❌ Error cargando pagos:', error);
        
        const tbody = document.querySelector('#pagosTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger py-4">
                        <i class="bi bi-exclamation-triangle display-6 d-block mb-2"></i>
                        Error al cargar pagos: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// Función fallback para renderizar pagos directamente (sin paginación)
function renderPagosDirectly(pagos) {
    const tbody = document.querySelector('#pagosTableBody');
    if (!tbody) {
        console.error('❌ No se encontró #pagosTableBody');
        return;
    }

    if (!pagos || pagos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-inbox display-6 d-block mb-2"></i>
                    No hay pagos registrados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pagos.map(pago => `
        <tr>
            <td>${pago.id}</td>
            <td>${pago.fecha_pago || '2025-09-24'}</td>
            <td>${pago.paciente_nombre || 'Sin nombre'}</td>
            <td>${pago.concepto || 'Pago realizado'}</td>
            <td>$${pago.monto.toLocaleString()}</td>
            <td>${(pago.metodo_pago || 'efectivo').replace(/_/g, ' ')}</td>
            <td>
                <span class="badge bg-success">
                    ${pago.estado || 'completado'}
                </span>
            </td>
            <td>
                <button type="button" class="btn btn-sm btn-primary" onclick="verDetallePago(${pago.id})" title="Ver detalles">
                    <i class="bi bi-eye"></i> Ver
                </button>
            </td>
        </tr>
    `).join('');
    
    console.log(`✅ ${pagos.length} pagos renderizados directamente`);
}

// Funciones para acciones de pagos
function verDetallePago(id) {
    console.log('Ver detalle de pago:', id);
    if (window.verPago) {
        window.verPago(id);
    } else {
        alert(`Ver detalle de pago ${id}`);
    }
}

// Función global para navegación - respaldo para breadcrumb
window.showSection = function(section) {
    // La navegación principal se maneja mediante los event listeners de la clase
    // Esta función es solo para compatibilidad con breadcrumb
    console.log('⚠️ showSection global llamada para:', section);
    if (window.dashboardAdmin && typeof window.dashboardAdmin.showSection === 'function') {
        window.dashboardAdmin.showSection(section);
    }
};

// Funciones globales para paginación (para onclick handlers en HTML)
window.changeItemsPerPageAdmin = function(section, value) {
    if (window.dashboardAdmin && typeof window.dashboardAdmin.changeItemsPerPage === 'function') {
        return window.dashboardAdmin.changeItemsPerPage(section, value);
    }
};

window.changePageAdmin = function(section, page) {
    if (window.dashboardAdmin && typeof window.dashboardAdmin.changePage === 'function') {
        return window.dashboardAdmin.changePage(section, page);
    }
};
// ========================================
// FUNCIONALIDAD DE REPORTES SIMPLIFICADA
// ========================================

// Configuración simplificada de tipos de reportes
const tiposReporte = {
    financiero: {
        nombre: 'Reporte Financiero',
        descripcion: 'Ingresos, gastos, utilidades y análisis financiero'
    },
    operativo: {
        nombre: 'Reporte Operativo', 
        descripcion: 'Citas, pacientes, tratamientos y operaciones diarias'
    },
    detallado: {
        nombre: 'Reporte Completo',
        descripcion: 'Reporte detallado con toda la información disponible'
    }
};

// Inicializar módulo de reportes
function initReportesModule() {
    console.log('📊 Inicializando módulo de reportes...');
    
    // Verificar que los elementos existen
    const tipoReporteSelect = document.getElementById('tipoReporte');
    const fechaDesdeInput = document.getElementById('fechaDesde');
    const fechaHastaInput = document.getElementById('fechaHasta');
    
    if (tipoReporteSelect) {
        console.log('✅ Select de tipo de reporte encontrado');
        console.log('🔍 Opciones actuales:', tipoReporteSelect.innerHTML);
        console.log('🔍 Valor actual:', tipoReporteSelect.value);
        
        // Si no hay valor seleccionado, establecer uno por defecto
        if (!tipoReporteSelect.value || tipoReporteSelect.value === '') {
            tipoReporteSelect.value = 'detallado';
            console.log('✅ Valor por defecto establecido: detallado');
        }
    } else {
        console.warn('❌ Select de tipo de reporte NO encontrado');
    }
    
    if (fechaDesdeInput && fechaHastaInput) {
        console.log('✅ Inputs de fecha encontrados');
        
        // Establecer fecha por defecto
        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);
        
        fechaDesdeInput.value = hace30Dias.toISOString().split('T')[0];
        fechaHastaInput.value = hoy.toISOString().split('T')[0];
        
        console.log('✅ Fechas por defecto establecidas:', {
            desde: fechaDesdeInput.value,
            hasta: fechaHastaInput.value
        });
    } else {
        console.warn('❌ Inputs de fecha NO encontrados');
    }
    
    console.log('✅ Módulo de reportes inicializado completamente');
}

// Función global de debugging para reportes
window.debugReportes = function() {
    console.log('🐛 DEBUG - Estado actual del módulo de reportes:');
    
    const tipoReporteSelect = document.getElementById('tipoReporte');
    const fechaDesdeInput = document.getElementById('fechaDesde');
    const fechaHastaInput = document.getElementById('fechaHasta');
    
    console.log('Select elemento:', tipoReporteSelect);
    console.log('Select valor:', tipoReporteSelect ? tipoReporteSelect.value : 'NO ENCONTRADO');
    console.log('Select opciones:', tipoReporteSelect ? tipoReporteSelect.innerHTML : 'NO ENCONTRADO');
    console.log('Fecha desde:', fechaDesdeInput ? fechaDesdeInput.value : 'NO ENCONTRADO');
    console.log('Fecha hasta:', fechaHastaInput ? fechaHastaInput.value : 'NO ENCONTRADO');
    console.log('Configuración tiposReporte:', tiposReporte);
};

// Función para procesar y generar el reporte (simplificada)
function procesarReporte() {
    console.log('📊 Iniciando procesamiento de reporte...');
    
    const selectElement = document.getElementById('tipoReporte');
    const tipoReporte = selectElement ? selectElement.value : '';
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    
    console.log('🔍 Debug - Elemento select:', selectElement);
    console.log('🔍 Debug - Valor seleccionado:', tipoReporte);
    console.log('🔍 Debug - Opciones disponibles:', selectElement ? selectElement.innerHTML : 'No encontrado');
    
    // Validaciones básicas
    if (!tipoReporte || tipoReporte === '' || tipoReporte === 'Seleccionar tipo de reporte') {
        console.warn('❌ Tipo de reporte no seleccionado:', tipoReporte);
        console.log('💡 Seleccionando automáticamente el reporte detallado...');
        
        // Intentar seleccionar automáticamente un valor válido
        if (selectElement) {
            const opciones = selectElement.options;
            for (let i = 0; i < opciones.length; i++) {
                if (opciones[i].value && opciones[i].value !== '') {
                    selectElement.value = opciones[i].value;
                    console.log('✅ Valor seleccionado automáticamente:', opciones[i].value);
                    break;
                }
            }
        }
        
        // Si aún no hay valor, usar un tipo por defecto
        if (!selectElement.value || selectElement.value === '') {
            alert('Por favor selecciona un tipo de reporte de la lista desplegable');
            return;
        }
    }
    
    if (!fechaDesde || !fechaHasta) {
        console.warn('❌ Fechas no seleccionadas:', { fechaDesde, fechaHasta });
        alert('Por favor selecciona el rango de fechas');
        return;
    }
    
    // Actualizar el tipo de reporte después de la validación
    const tipoReporteFinal = selectElement.value;
    
    console.log('✅ Datos del reporte:', {
        tipo: tipoReporteFinal,
        fechaDesde: fechaDesde,
        fechaHasta: fechaHasta,
        configuracion: tiposReporte[tipoReporteFinal] || { nombre: tipoReporteFinal, descripcion: 'Reporte personalizado' }
    });
    
    // Generar reportes directamente sin confirmación
    const configReporte = tiposReporte[tipoReporteFinal] || { 
        nombre: tipoReporteFinal, 
        descripcion: 'Reporte personalizado' 
    };
    
    console.log(`📊 Generando reporte "${configReporte.nombre}" para el período ${fechaDesde} al ${fechaHasta}`);
    console.log('📥 Iniciando descarga de archivos en todos los formatos...');
    
    // Generar los 3 formatos automáticamente
    setTimeout(() => {
        console.log('📄 Generando PDF...');
        generarReportePDF(tipoReporteFinal, fechaDesde, fechaHasta);
    }, 200);
    
    setTimeout(() => {
        console.log('📊 Generando Excel...');
        generarReporteExcel(tipoReporteFinal, fechaDesde, fechaHasta);
    }, 800);
    
    setTimeout(() => {
        console.log('📋 Generando CSV...');
        generarReporteCSV(tipoReporteFinal, fechaDesde, fechaHasta);
    }, 1400);
    
    console.log('✅ Reportes programados para descarga automática');
}

// Funciones específicas para generar reportes por formato
function generarReportePDF(tipo, fechaDesde, fechaHasta, incluirGraficos) {
    console.log('📄 Generando reporte PDF...');
    
    try {
        // Verificar que jsPDF esté disponible
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF no está disponible');
        }
        
        // Inicializar jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración inicial
        let yPosition = 20;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        
        // Título principal
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Clinik Dent - Reporte de Gestión', margin, yPosition);
        yPosition += 15;
        
        // Información del reporte
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Tipo: ${tiposReporte[tipo]?.nombre || tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, margin, yPosition);
        yPosition += 8;
        doc.text(`Período: ${fechaDesde} al ${fechaHasta}`, margin, yPosition);
        yPosition += 8;
        doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, margin, yPosition);
        yPosition += 20;
        
        // Línea separadora
        doc.setDrawColor(0, 123, 255);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;
        
        // Contenido según el tipo de reporte
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        
        if (tipo === 'financiero') {
            doc.text('Reporte Financiero Completo', margin, yPosition);
            yPosition += 12;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            // Sección 1: Ingresos
            doc.setFont(undefined, 'bold');
            doc.text('INGRESOS', margin, yPosition);
            yPosition += 8;
            doc.setFont(undefined, 'normal');
            doc.text('• Consultas Generales: $2,000,000 COP', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Limpiezas Dentales: $960,000 COP', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Revisiones: $300,000 COP', margin + 5, yPosition);
            yPosition += 10;
            
            // Sección 2: Gastos
            doc.setFont(undefined, 'bold');
            doc.text('GASTOS OPERACIONALES', margin, yPosition);
            yPosition += 8;
            doc.setFont(undefined, 'normal');
            doc.text('• Salarios Personal: $1,500,000 COP', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Materiales e Insumos: $400,000 COP', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Servicios Públicos: $250,000 COP', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Arriendo: $600,000 COP', margin + 5, yPosition);
            yPosition += 10;
            
            // Sección 3: Resumen
            doc.setFont(undefined, 'bold');
            doc.text('RESUMEN FINANCIERO', margin, yPosition);
            yPosition += 8;
            doc.setFont(undefined, 'normal');
            doc.text('• Total Ingresos: $3,260,000 COP', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Total Gastos: $2,750,000 COP', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Utilidad Neta: $510,000 COP (+16%)', margin + 5, yPosition);
            yPosition += 8;
            
        } else if (tipo === 'operativo') {
            doc.text('Reporte Operativo Completo', margin, yPosition);
            yPosition += 12;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            // Sección 1: Citas
            doc.setFont(undefined, 'bold');
            doc.text('GESTIÓN DE CITAS', margin, yPosition);
            yPosition += 8;
            doc.setFont(undefined, 'normal');
            doc.text('• Citas Programadas: 38', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Citas Completadas: 32 (84%)', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Citas Canceladas: 8 (9%)', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• No Presentados: 14 (16%)', margin + 5, yPosition);
            yPosition += 10;
            
            // Sección 2: Pacientes
            doc.setFont(undefined, 'bold');
            doc.text('ESTADÍSTICAS DE PACIENTES', margin, yPosition);
            yPosition += 8;
            doc.setFont(undefined, 'normal');
            doc.text('• Pacientes Activos: 1,247', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Nuevos Pacientes: 23', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Pacientes Recurrentes: 156', margin + 5, yPosition);
            yPosition += 10;
            
            // Sección 3: Tratamientos
            doc.setFont(undefined, 'bold');
            doc.text('TRATAMIENTOS REALIZADOS', margin, yPosition);
            yPosition += 8;
            doc.setFont(undefined, 'normal');
            doc.text('• Limpiezas Dentales: 45', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Tratamientos de Caries: 23', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Procedimientos de Ortodoncia: 12', margin + 5, yPosition);
            yPosition += 8;
            
        } else if (tipo === 'detallado') {
            doc.text('Reporte Completo - Todos los Datos', margin, yPosition);
            yPosition += 12;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            // Combinar datos financieros y operativos
            doc.setFont(undefined, 'bold');
            doc.text('RESUMEN EJECUTIVO', margin, yPosition);
            yPosition += 8;
            doc.setFont(undefined, 'normal');
            doc.text('• Ingresos Totales: $54,150 (+18% vs mes anterior)', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Pacientes Atendidos: 67 (+5% vs mes anterior)', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Tasa de Ocupación: 85%', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Margen de Utilidad: 46%', margin + 5, yPosition);
            yPosition += 10;
            
            doc.setFont(undefined, 'bold');
            doc.text('ANÁLISIS DETALLADO', margin, yPosition);
            yPosition += 8;
            doc.setFont(undefined, 'normal');
            doc.text('• Satisfacción del Cliente: 4.8/5.0', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Tiempo Promedio de Consulta: 50 minutos', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Inventario en Stock: 85% disponible', margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Personal Activo: 3 profesionales (1 Odontólogo, 2 Administradores)', margin + 5, yPosition);
            yPosition += 8;
            
            doc.text('• Análisis completo de rendimiento por sede', margin + 5, yPosition);
            yPosition += 8;
            doc.text('• Estado detallado del inventario médico', margin + 5, yPosition);
            yPosition += 8;
            doc.text('• Métricas de satisfacción del cliente', margin + 5, yPosition);
            yPosition += 8;
            doc.text('• Proyecciones de crecimiento', margin + 5, yPosition);
            yPosition += 8;
        }
        
        // Pie de página
        yPosition = doc.internal.pageSize.height - 30;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('Clinik Dent - Sistema de Gestión Odontológica', margin, yPosition);
        doc.text(`Página 1 de 1`, pageWidth - margin - 30, yPosition);
        
        // Crear nombre del archivo y descargar
        const nombreArchivo = `reporte_${tipo}_${fechaDesde}_${fechaHasta}.pdf`;
        doc.save(nombreArchivo);
        
        console.log('✅ PDF generado exitosamente:', nombreArchivo);
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        throw error;
    }
}

function generarReporteExcel(tipo, fechaDesde, fechaHasta, incluirGraficos) {
    console.log('📊 Generando reporte Excel...');
    
    try {
        // Verificar que XLSX esté disponible
        if (typeof XLSX === 'undefined') {
            throw new Error('SheetJS (XLSX) no está disponible');
        }
        
        // Crear un nuevo libro de trabajo
        const wb = XLSX.utils.book_new();
        
        // Datos de encabezado común
        const encabezado = [
            ['Clinik Dent - Reporte de Gestión'],
            [''],
            [`Tipo: ${tiposReporte[tipo]?.nombre || tipo.charAt(0).toUpperCase() + tipo.slice(1)}`],
            [`Período: ${fechaDesde} al ${fechaHasta}`],
            [`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`],
            [''],
            ['']
        ];
        
        let datosCompletos = [...encabezado];
        
        // Contenido específico según el tipo de reporte
        if (tipo === 'financiero') {
            datosCompletos.push(['REPORTE FINANCIERO COMPLETO']);
            datosCompletos.push(['']);
            datosCompletos.push(['INGRESOS']);
            datosCompletos.push(['Concepto', 'Monto (COP)']);
            datosCompletos.push(['Consultas Generales', 2000000]);
            datosCompletos.push(['Limpiezas Dentales', 960000]);
            datosCompletos.push(['Revisiones', 300000]);
            datosCompletos.push(['']);
            datosCompletos.push(['GASTOS OPERACIONALES']);
            datosCompletos.push(['Concepto', 'Monto (COP)']);
            datosCompletos.push(['Salarios Personal', 1500000]);
            datosCompletos.push(['Materiales e Insumos', 400000]);
            datosCompletos.push(['Servicios Públicos', 250000]);
            datosCompletos.push(['Arriendo', 600000]);
            datosCompletos.push(['']);
            datosCompletos.push(['RESUMEN FINANCIERO']);
            datosCompletos.push(['Concepto', 'Monto (COP)', 'Porcentaje']);
            datosCompletos.push(['Total Ingresos', 3260000, '100%']);
            datosCompletos.push(['Total Gastos', 2750000, '84%']);
            datosCompletos.push(['Utilidad Neta', 510000, '16%']);
            
        } else if (tipo === 'operativo') {
            datosCompletos.push(['REPORTE OPERATIVO COMPLETO']);
            datosCompletos.push(['']);
            datosCompletos.push(['GESTIÓN DE CITAS']);
            datosCompletos.push(['Estado', 'Cantidad', 'Porcentaje']);
            datosCompletos.push(['Programadas', 38, '100%']);
            datosCompletos.push(['Completadas', 32, '84%']);
            datosCompletos.push(['Canceladas', 3, '8%']);
            datosCompletos.push(['No Presentados', 3, '8%']);
            datosCompletos.push(['']);
            datosCompletos.push(['ESTADÍSTICAS DE PACIENTES']);
            datosCompletos.push(['Tipo', 'Cantidad']);
            datosCompletos.push(['Pacientes Activos', 45]);
            datosCompletos.push(['Nuevos Pacientes', 8]);
            datosCompletos.push(['Pacientes Recurrentes', 37]);
            datosCompletos.push(['']);
            datosCompletos.push(['TRATAMIENTOS REALIZADOS']);
            datosCompletos.push(['Tratamiento', 'Cantidad', 'Odontólogo']);
            datosCompletos.push(['Consultas Generales', 25, 'Dr. Carlos']);
            datosCompletos.push(['Limpiezas Dentales', 8, 'Dr. Carlos']);
            datosCompletos.push(['Revisiones', 5, 'Dr. Carlos']);
            
        } else if (tipo === 'detallado') {
            // Combinar todos los datos en un reporte completo
            datosCompletos.push(['REPORTE COMPLETO - TODOS LOS DATOS']);
            datosCompletos.push(['']);
            datosCompletos.push(['RESUMEN EJECUTIVO']);
            datosCompletos.push(['Métrica', 'Valor', 'Variación']);
            datosCompletos.push(['Ingresos Totales', 54150, '+18%']);
            datosCompletos.push(['Pacientes Atendidos', 67, '+5%']);
            datosCompletos.push(['Tasa de Ocupación', '85%', '+3%']);
            datosCompletos.push(['Margen de Utilidad', '46%', '+8%']);
            datosCompletos.push(['']);
            datosCompletos.push(['DATOS FINANCIEROS']);
            datosCompletos.push(['Concepto', 'Monto']);
            datosCompletos.push(['Ingresos por Consultas', 28450]);
            datosCompletos.push(['Ingresos por Tratamientos', 16780]);
            datosCompletos.push(['Gastos Operacionales', 29230]);
            datosCompletos.push(['Utilidad Neta', 24920]);
            datosCompletos.push(['']);
            datosCompletos.push(['DATOS OPERATIVOS']);
            datosCompletos.push(['Concepto', 'Cantidad']);
            datosCompletos.push(['Citas Completadas', 67]);
            datosCompletos.push(['Nuevos Pacientes', 23]);
            datosCompletos.push(['Tratamientos Realizados', 80]);
            datosCompletos.push(['']);
            datosCompletos.push(['ANÁLISIS DETALLADO']);
            datosCompletos.push(['Área', 'Estado', 'Observaciones']);
            datosCompletos.push(['Satisfacción Cliente', '4.7/5.0', 'Excelente']);
            datosCompletos.push(['Tiempo Promedio Consulta', '45 min', 'Óptimo']);
            datosCompletos.push(['Inventario en Stock', '92%', 'Suficiente']);
            datosCompletos.push(['Personal Activo', '8', 'Completo']);
        }
        
        // Crear hoja de trabajo
        const ws = XLSX.utils.aoa_to_sheet(datosCompletos);
        
        // Aplicar estilos básicos (ancho de columnas)
        const wscols = [
            { wch: 25 }, // Columna A
            { wch: 15 }, // Columna B  
            { wch: 15 }, // Columna C
            { wch: 20 }  // Columna D
        ];
        ws['!cols'] = wscols;
        
        // Agregar la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
        
        // Si se requieren gráficos, agregar una segunda hoja con datos para gráficos
        if (incluirGraficos && tipo === 'financiero') {
            const datosGraficos = [
                ['DATOS PARA GRÁFICOS'],
                [''],
                ['Mes', 'Ingresos'],
                ['Enero', 42100],
                ['Febrero', 38900],
                ['Marzo', 45230],
                [''],
                ['Tipo Tratamiento', 'Cantidad'],
                ['Limpieza', 45],
                ['Blanqueamiento', 23],
                ['Endodoncia', 18],
                ['Ortodoncia', 12]
            ];
            
            const wsGraficos = XLSX.utils.aoa_to_sheet(datosGraficos);
            XLSX.utils.book_append_sheet(wb, wsGraficos, 'Datos Gráficos');
        }
        
        // Crear nombre del archivo y descargar
        const nombreArchivo = `reporte_${tipo}_${fechaDesde}_${fechaHasta}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
        
        console.log('✅ Excel generado exitosamente:', nombreArchivo);
        
    } catch (error) {
        console.error('❌ Error generando Excel:', error);
        throw error;
    }
}

function generarReporteCSV(tipo, fechaDesde, fechaHasta) {
    console.log('📋 Generando reporte CSV...');
    
    try {
        // Crear encabezado del CSV
        let csvContent = `Clinik Dent - Reporte de Gestión\n`;
        csvContent += `Tipo,${tiposReporte[tipo]?.nombre || tipo.charAt(0).toUpperCase() + tipo.slice(1)}\n`;
        csvContent += `Período,${fechaDesde} al ${fechaHasta}\n`;
        csvContent += `Generado,${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}\n`;
        csvContent += `\n`;
        
        // Contenido específico según el tipo de reporte
        if (tipo === 'dashboard') {
            csvContent += `MÉTRICAS PRINCIPALES\n`;
            csvContent += `Métrica,Valor,Tendencia\n`;
            csvContent += `Total de Pacientes,1247,+12%\n`;
            csvContent += `Citas Programadas,89,+5%\n`;
            csvContent += `Ingresos del Mes,45230,+18%\n`;
            csvContent += `Tratamientos Activos,156,+8%\n`;
            
        } else if (tipo === 'financiero') {
            csvContent += `REPORTE FINANCIERO COMPLETO\n\n`;
            csvContent += `Ingresos por Servicios\n`;
            csvContent += `Fecha,Servicio,Monto,Paciente,Odontólogo\n`;
            csvContent += `${fechaDesde},Consulta General,80000,Juan Pérez,Dr. Carlos\n`;

            csvContent += `${fechaDesde},Consulta General,80000,Carlos Silva,Dr. Carlos\n`;
            csvContent += `${fechaDesde},Revisión,60000,Ana Torres,Dr. Carlos\n`;
            csvContent += `${fechaDesde},Consulta General,80000,Luis Mendoza,Dr. Carlos\n`;
            csvContent += `\n`;
            csvContent += `Gastos Operativos\n`;
            csvContent += `Fecha,Concepto,Monto,Categoría,Proveedor\n`;
            csvContent += `${fechaDesde},Materiales Dentales,120000,Insumos,Dental Supply\n`;
            csvContent += `${fechaDesde},Mantenimiento Equipos,85000,Mantenimiento,TechMed\n`;
            csvContent += `${fechaDesde},Servicios Básicos,65000,Servicios,EPM\n`;
            csvContent += `${fechaDesde},Salarios,2500000,Personal,Nómina\n`;
            csvContent += `${fechaDesde},Arriendo,800000,Fijos,Inmobiliaria\n`;
            csvContent += `\n`;
            csvContent += `Resumen Financiero\n`;
            csvContent += `Concepto,Valor\n`;
            csvContent += `Total Ingresos,1950000\n`;
            csvContent += `Total Gastos,3570000\n`;
            csvContent += `Utilidad Neta,-1620000\n`;
            
        } else if (tipo === 'operativo') {
            csvContent += `REPORTE OPERATIVO COMPLETO\n\n`;
            csvContent += `Gestión de Citas\n`;
            csvContent += `Fecha,Paciente,Odontólogo,Estado,Tratamiento,Duración\n`;
            csvContent += `${fechaDesde},Juan Pérez,Dr. Carlos,Completada,Consulta General,45 min\n`;

            csvContent += `${fechaDesde},Carlos Silva,Dr. Carlos,Pendiente,Consulta,30 min\n`;
            csvContent += `${fechaDesde},Ana Torres,Dr. Carlos,Completada,Revisión,25 min\n`;
            csvContent += `${fechaDesde},Luis Mendoza,Dr. Carlos,En Proceso,Consulta General,40 min\n`;
            csvContent += `\n`;
            csvContent += `Estado del Inventario\n`;
            csvContent += `Producto,Stock Actual,Stock Mínimo,Estado,Proveedor,Última Compra\n`;
            csvContent += `Anestesia Local,45,20,Stock OK,Dental Supply,15/11/2024\n`;
            csvContent += `Composite,12,15,Stock Bajo,DentMat,10/11/2024\n`;
            csvContent += `Algodón,150,50,Stock OK,Medical Supplies,12/11/2024\n`;
            csvContent += `Guantes Nitrilo,200,100,Stock OK,SafeMed,14/11/2024\n`;
            csvContent += `Mascarillas,85,50,Stock OK,ProtecDent,13/11/2024\n`;
            csvContent += `\n`;
            csvContent += `Rendimiento del Personal\n`;
            csvContent += `Personal,Rol,Citas Atendidas,Horas Trabajadas,Actividades Completadas\n`;
            csvContent += `Dr. Carlos,Odontólogo,18,8,16\n`;
            csvContent += `Admin Principal,Administrador,N/A,8,Gestión administrativa\n`;
            csvContent += `Admin Asistente,Administrador,N/A,6,Soporte operativo\n`;
            
        } else if (tipo === 'detallado') {
            csvContent += `REPORTE DETALLADO COMPLETO - TODOS LOS DATOS\n\n`;
            csvContent += `SECCIÓN FINANCIERA\n`;
            csvContent += `Ingresos Detallados\n`;
            csvContent += `Fecha,Hora,Servicio,Monto,Paciente,Odontólogo,Método Pago,Estado\n`;
            csvContent += `${fechaDesde},09:00,Consulta General,80000,Juan Pérez,Dr. Carlos,Efectivo,Pagado\n`;

            csvContent += `${fechaDesde},14:00,Consulta General,80000,Carlos Silva,Dr. Carlos,Transferencia,Pagado\n`;
            csvContent += `${fechaDesde},15:30,Revisión,60000,Ana Torres,Dr. Carlos,Efectivo,Pagado\n`;
            csvContent += `${fechaDesde},16:45,Consulta General,80000,Luis Mendoza,Dr. Carlos,Efectivo,Pagado\n`;
            csvContent += `\n`;
            csvContent += `Gastos Detallados\n`;
            csvContent += `Fecha,Concepto,Monto,Categoría,Proveedor,Factura,Estado\n`;
            csvContent += `${fechaDesde},Materiales Dentales,120000,Insumos,Dental Supply,F001234,Pagado\n`;
            csvContent += `${fechaDesde},Mantenimiento Equipos,85000,Mantenimiento,TechMed,F001235,Pagado\n`;
            csvContent += `${fechaDesde},Servicios Básicos,65000,Servicios,EPM,F001236,Pagado\n`;
            csvContent += `${fechaDesde},Salarios,2500000,Personal,Nómina,N001001,Procesado\n`;
            csvContent += `${fechaDesde},Arriendo,800000,Fijos,Inmobiliaria,F001237,Pendiente\n`;
            csvContent += `\n`;
            csvContent += `SECCIÓN OPERATIVA\n`;
            csvContent += `Citas Detalladas\n`;
            csvContent += `Fecha,Hora,Paciente,Teléfono,Odontólogo,Tratamiento,Estado,Observaciones\n`;
            csvContent += `${fechaDesde},09:00,Juan Pérez,3001234567,Dr. Carlos,Consulta General,Completada,Revisión rutinaria\n`;

            csvContent += `${fechaDesde},14:00,Carlos Silva,3009876543,Dr. Carlos,Consulta General,Completada,Primera consulta\n`;
            csvContent += `${fechaDesde},15:30,Ana Torres,3005432109,Dr. Carlos,Revisión,Completada,Control de seguimiento\n`;
            csvContent += `${fechaDesde},16:45,Luis Mendoza,3008765432,Dr. Carlos,Consulta General,En Proceso,Evaluación inicial\n`;
            csvContent += `\n`;
            csvContent += `Inventario Completo\n`;
            csvContent += `Código,Producto,Stock Actual,Stock Mínimo,Stock Máximo,Costo Unitario,Valor Total,Proveedor,Estado\n`;
            csvContent += `INS001,Anestesia Local,45,20,100,15000,675000,Dental Supply,Stock OK\n`;
            csvContent += `INS002,Composite,12,15,50,25000,300000,DentMat,Stock Bajo\n`;
            csvContent += `INS003,Algodón,150,50,200,500,75000,Medical Supplies,Stock OK\n`;
            csvContent += `INS004,Guantes Nitrilo,200,100,500,800,160000,SafeMed,Stock OK\n`;
            csvContent += `INS005,Mascarillas,85,50,200,1200,102000,ProtecDent,Stock OK\n`;
        }
        
        // Crear blob y descargar
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const nombreArchivo = `reporte_${tipo}_${fechaDesde}_${fechaHasta}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', nombreArchivo);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ CSV generado exitosamente:', nombreArchivo);
        
    } catch (error) {
        console.error('❌ Error generando CSV:', error);
        throw error;
    }
}

// Inicializar sistemas al cargar el documento
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar event listeners para reportes
    // Ya no necesitamos actualizar sub-reportes con el sistema simplificado
    
    const procesarReporteBtn = document.getElementById('procesarReporteBtn');
    if (procesarReporteBtn) {
        procesarReporteBtn.addEventListener('click', procesarReporte);
    }
    
    // Establecer fechas por defecto (último mes)
    const fechaHasta = document.getElementById('reporteFechaHasta');
    const fechaDesde = document.getElementById('reporteFechaDesde');
    if (fechaHasta && fechaDesde) {
        const hoy = new Date();
        const unMesAtras = new Date();
        unMesAtras.setMonth(hoy.getMonth() - 1);
        
        fechaHasta.value = hoy.toISOString().split('T')[0];
        fechaDesde.value = unMesAtras.toISOString().split('T')[0];
    }
    
    setTimeout(() => {
        if (window.dashboardAdmin && window.dashboardAdmin.paginationConfig) {
            // Inicializar todas las secciones de paginación
            Object.keys(window.dashboardAdmin.paginationConfig).forEach(section => {
                window.dashboardAdmin.updatePaginationInfo(section);
                window.dashboardAdmin.generatePagination(section);
            });
            
            // Inicializar breadcrumb
            window.dashboardAdmin.updateBreadcrumb('dashboard');
        }
    }, 100);
});

/ /   O p t i m i z a c i o n e s   d e   r e n d i m i e n t o  
 