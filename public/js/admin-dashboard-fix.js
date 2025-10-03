// Dashboard Admin JavaScript - Versión Corregida y Simplificada
console.log('🔥 Iniciando Dashboard Admin Corregido...');

// Evitar múltiples instancias
if (window.dashboardAdminFixed) {
    console.log('⚠️ Dashboard Admin ya existe');
} else {
    window.dashboardAdminFixed = true;
    
    class DashboardAdmin {
        constructor() {
            console.log('🚀 Construyendo DashboardAdmin...');
            this.currentSection = 'dashboard';
            this.users = [];
            this.citas = [];
            this.init();
        }

        // Obtener headers de autenticación
        getAuthHeaders() {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = localStorage.getItem('userId') || user.id;
            
            return {
                'Content-Type': 'application/json',
                'user-id': userId || '1'
            };
        }

        // Hacer petición con autenticación
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
            this.setupEventListeners();
            this.loadUserInfo();
            this.loadDashboardData();
        }

        setupEventListeners() {
            console.log('🔗 Configurando event listeners...');
            
            // Navigation listeners
            document.querySelectorAll('[data-section]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = e.target.getAttribute('data-section');
                    this.showSection(section);
                });
            });
        }

        async loadUserInfo() {
            console.log('👤 Cargando información de usuario...');
            
            try {
                let userData = localStorage.getItem('user');
                let user;
                
                if (!userData) {
                    console.log('🔧 No hay datos de usuario, usando por defecto');
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
                
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim();
                    userNameElement.textContent = nombreCompleto || 'Administrador';
                    console.log('✅ Usuario cargado:', nombreCompleto);
                }
            } catch (error) {
                console.error('❌ Error cargando usuario:', error);
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = 'Administrador';
                }
            }
        }

        async loadDashboardData() {
            console.log('📊 Cargando datos del dashboard...');
            
            try {
                // Cargar usuarios
                const usersResponse = await this.authFetch('/api/usuarios');
                if (usersResponse.ok) {
                    this.users = await usersResponse.json();
                    console.log('✅ Usuarios cargados:', this.users.length);
                }
                
                // Cargar citas
                const citasResponse = await this.authFetch('/api/citas/obtener-todas');
                if (citasResponse.ok) {
                    this.citas = await citasResponse.json();
                    console.log('✅ Citas cargadas:', this.citas.length);
                }
                
                // Actualizar contadores del dashboard
                this.updateDashboardCounters();
                
            } catch (error) {
                console.error('❌ Error cargando datos:', error);
            }
        }

        updateDashboardCounters() {
            console.log('🔢 Actualizando contadores...');
            
            // Actualizar contadores básicos
            const totalUsuarios = document.getElementById('totalUsuarios');
            if (totalUsuarios) {
                totalUsuarios.textContent = this.users.length || 0;
            }
            
            const totalCitas = document.getElementById('totalCitas');
            if (totalCitas) {
                totalCitas.textContent = this.citas.length || 0;
            }
            
            console.log('✅ Contadores actualizados');
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
                default:
                    console.log('🏠 Sección dashboard por defecto');
            }
        }

        async loadUsersSection() {
            console.log('👥 Cargando sección usuarios...');
            try {
                const response = await this.authFetch('/api/usuarios');
                if (response.ok) {
                    const users = await response.json();
                    this.renderUsersTable(users);
                }
            } catch (error) {
                console.error('❌ Error cargando usuarios:', error);
            }
        }

        async loadInventorySection() {
            console.log('📦 Cargando sección inventario...');
            try {
                const response = await this.authFetch('/api/inventario');
                if (response.ok) {
                    const inventory = await response.json();
                    console.log('✅ Inventario cargado');
                }
            } catch (error) {
                console.error('❌ Error cargando inventario:', error);
            }
        }

        async loadPaymentsSection() {
            console.log('💰 Cargando sección pagos...');
            try {
                const response = await this.authFetch('/api/pagos');
                if (response.ok) {
                    const payments = await response.json();
                    console.log('✅ Pagos cargados');
                }
            } catch (error) {
                console.error('❌ Error cargando pagos:', error);
            }
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

        renderUsersTable(users) {
            console.log('🔄 Renderizando tabla de usuarios...');
            const tableBody = document.getElementById('usersTableBody');
            if (!tableBody) return;
            
            tableBody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.nombre || ''} ${user.apellido || ''}</td>
                    <td>${user.email || ''}</td>
                    <td>${user.rol || ''}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})">
                            Editar
                        </button>
                    </td>
                </tr>
            `).join('');
            
            console.log('✅ Tabla de usuarios renderizada');
        }
    }

    // Funciones globales auxiliares
    window.editUser = function(userId) {
        console.log('✏️ Editando usuario:', userId);
        alert(`Editando usuario ID: ${userId}`);
    };

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🏁 DOM listo, iniciando dashboard...');
        
        if (!window.dashboardAdminInstance) {
            window.dashboardAdminInstance = new DashboardAdmin();
            console.log('✅ Dashboard Admin inicializado');
        } else {
            console.log('⚠️ Dashboard ya existe');
        }
    });
}

console.log('🎯 Archivo dashboard-admin-fixed.js cargado');
