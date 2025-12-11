// Dashboard Admin JavaScript - Versión Funcional Simplificada
console.log('🔥 Iniciando Dashboard Admin...');

// Variable global para evitar múltiples inicializaciones
window.dashboardInitialized = false;

class DashboardAdmin {
    constructor() {
        if (window.dashboardInitialized) {
            console.log('⚠️ Dashboard ya inicializado');
            return;
        }
        
        console.log('🚀 Construyendo DashboardAdmin...');
        window.dashboardInitialized = true;
        
        this.currentSection = 'dashboard';
        this.users = [];
        this.citas = [];
        this.currentUser = null;
        
        this.init();
    }

    getAuthHeaders() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id;
        
        return {
            'Content-Type': 'application/json',
            'user-id': userId || '1'
        };
    }

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
        console.log('🔄 Inicializando dashboard...');
        this.loadUserInfo();
        this.setupEventListeners();
        this.loadDashboardData();
    }

    async loadUserInfo() {
        console.log('👤 Cargando información de usuario...');
        
        try {
            let userData = localStorage.getItem('user');
            let user;
            
            if (!userData) {
                console.log('🔧 Creando usuario por defecto');
                user = {
                    id: 1,
                    nombre: 'Administrador',
                    apellido: 'Sistema',
                    email: 'admin@clinikdent.com',
                    rol: 'administrador'
                };
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('userId', '1');
            } else {
                user = JSON.parse(userData);
            }
            
            this.currentUser = user;
            
            // Actualizar el nombre en la interfaz
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim();
                userNameElement.textContent = nombreCompleto || 'Administrador';
                console.log('✅ Nombre de usuario actualizado:', nombreCompleto);
            } else {
                console.warn('⚠️ Elemento userName no encontrado');
            }
            
            // Actualizar rol si existe
            const userRoleElement = document.getElementById('userRole');
            if (userRoleElement) {
                userRoleElement.textContent = user.rol || 'Administrador';
            }
            
        } catch (error) {
            console.error('❌ Error cargando usuario:', error);
            // Fallback seguro
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = 'Administrador';
            }
        }
    }

    setupEventListeners() {
        console.log('🔗 Configurando event listeners...');
        
        // Manejar clicks en navegación
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Manejar clicks en botones de sección
        document.querySelectorAll('[onclick*="showSection"]').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const onclick = element.getAttribute('onclick');
                const match = onclick.match(/showSection\('([^']+)'\)/);
                if (match) {
                    this.showSection(match[1]);
                }
            });
        });
    }

    async loadDashboardData() {
        console.log('📊 Cargando datos del dashboard...');
        
        try {
            // Cargar estadísticas básicas
            await Promise.all([
                this.loadUsers(),
                this.loadCitas(),
                this.loadInventory(),
                this.loadPayments()
            ]);
            
            this.updateDashboardCounters();
            console.log('✅ Datos del dashboard cargados');
            
        } catch (error) {
            console.error('❌ Error cargando datos del dashboard:', error);
        }
    }

    async loadUsers() {
        try {
            const response = await this.authFetch('/api/usuarios');
            if (response.ok) {
                this.users = await response.json();
                console.log('✅ Usuarios cargados:', this.users.length);
            }
        } catch (error) {
            console.error('❌ Error cargando usuarios:', error);
            this.users = [];
        }
    }

    async loadCitas() {
        try {
            const response = await this.authFetch('/api/citas/obtener-todas');
            if (response.ok) {
                this.citas = await response.json();
                console.log('✅ Citas cargadas:', this.citas.length);
            }
        } catch (error) {
            console.error('❌ Error cargando citas:', error);
            this.citas = [];
        }
    }

    async loadInventory() {
        try {
            const response = await this.authFetch('/api/inventario');
            if (response.ok) {
                const inventory = await response.json();
                this.inventory = inventory;
                console.log('✅ Inventario cargado');
            }
        } catch (error) {
            console.error('❌ Error cargando inventario:', error);
            this.inventory = { equipos: [] };
        }
    }

    async loadPayments() {
        try {
            const response = await this.authFetch('/api/pagos');
            if (response.ok) {
                this.payments = await response.json();
                console.log('✅ Pagos cargados:', this.payments.length);
            }
        } catch (error) {
            console.error('❌ Error cargando pagos:', error);
            this.payments = [];
        }
    }

    updateDashboardCounters() {
        console.log('🔢 Actualizando contadores...');
        
        // Actualizar contadores en el dashboard
        const updates = [
            { id: 'totalUsuarios', value: this.users.length || 0 },
            { id: 'totalCitas', value: this.citas.length || 0 },
            { id: 'totalPagos', value: this.payments?.length || 0 },
            { id: 'totalInventario', value: this.inventory?.equipos?.length || 0 }
        ];

        updates.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`✅ Actualizado ${id}: ${value}`);
            }
        });
    }

    showSection(section) {
        console.log('🔄 Cambiando a sección:', section);
        this.currentSection = section;
        
        // Ocultar todas las secciones
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.style.display = 'none';
        });
        
        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(`section-${section}`);
        if (targetSection) {
            targetSection.style.display = 'block';
            
            // Cargar datos específicos de la sección
            this.loadSectionData(section);
        } else {
            console.warn(`⚠️ Sección no encontrada: section-${section}`);
        }
        
        // Actualizar navegación activa
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async loadSectionData(section) {
        console.log('📦 Cargando datos para sección:', section);
        
        try {
            switch (section) {
                case 'usuarios':
                    await this.loadUsersSection();
                    break;
                case 'inventario':
                    await this.loadInventorySection();
                    break;
                case 'pagos':
                    await this.loadPaymentsSection();
                    break;
                case 'reportes':
                    await this.loadReportsSection();
                    break;
                case 'configuracion':
                    await this.loadConfigSection();
                    break;
                default:
                    console.log('🏠 Sección dashboard por defecto');
            }
        } catch (error) {
            console.error(`❌ Error cargando sección ${section}:`, error);
        }
    }

    async loadUsersSection() {
        console.log('👥 Cargando sección usuarios...');
        // La lógica específica de usuarios se manejará con los módulos existentes
    }

    async loadInventorySection() {
        console.log('📦 Cargando sección inventario...');
        // La lógica específica de inventario se manejará con los módulos existentes
    }

    async loadPaymentsSection() {
        console.log('💰 Cargando sección pagos...');
        // La lógica específica de pagos se manejará con los módulos existentes
    }

    async loadReportsSection() {
        console.log('📊 Cargando sección reportes...');
        try {
            const response = await this.authFetch('/api/reportes/resumen-general');
            if (response.ok) {
                const reports = await response.json();
                console.log('✅ Reportes cargados');
            }
        } catch (error) {
            console.error('❌ Error cargando reportes:', error);
        }
    }

    async loadConfigSection() {
        console.log('⚙️ Cargando sección configuración...');
        try {
            const response = await this.authFetch('/api/configuracion/sistema');
            if (response.ok) {
                const config = await response.json();
                console.log('✅ Configuración cargada');
            }
        } catch (error) {
            console.error('❌ Error cargando configuración:', error);
        }
    }
}

// Función global para compatibilidad
window.showSection = function(section) {
    if (window.dashboardInstance) {
        window.dashboardInstance.showSection(section);
    } else {
        console.error('❌ Dashboard no inicializado');
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM listo, iniciando dashboard...');
    
    if (!window.dashboardInstance) {
        window.dashboardInstance = new DashboardAdmin();
        console.log('✅ Dashboard Admin inicializado exitosamente');
    } else {
        console.log('⚠️ Dashboard ya existe');
    }
});

console.log('🎯 dashboard-admin-simple.js cargado');
