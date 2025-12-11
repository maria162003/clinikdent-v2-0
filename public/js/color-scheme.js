// ============================================================================
// ESQUEMA DE COLORES CLINIK DENT - UTILIDAD CENTRALIZADA
// ============================================================================

window.ColorScheme = {
    // Estados principales (colores Bootstrap estándar)
    status: {
        // Estados activos/positivos - Verde
        active: 'bg-success text-white',
        completed: 'bg-success text-white', 
        confirmada: 'bg-success text-white',
        completada: 'bg-success text-white',
        pagado: 'bg-success text-white',
        aprobado: 'bg-success text-white',
        
        // Estados inactivos/negativos - Rojo
        inactive: 'bg-danger text-white',
        cancelled: 'bg-danger text-white',
        cancelada: 'bg-danger text-white',
        cancelado: 'bg-danger text-white',
        rechazado: 'bg-danger text-white',
        vencido: 'bg-danger text-white',
        
        // Estados neutros/pendientes - Azul/Amarillo
        pending: 'bg-warning text-dark',
        programada: 'bg-info text-white',
        pendiente: 'bg-warning text-dark',
        proceso: 'bg-info text-white',
        revision: 'bg-secondary text-white'
    },
    
    // Roles de usuario
    roles: {
        administrador: 'bg-primary text-white',
        admin: 'bg-primary text-white',
        odontologo: 'bg-info text-white',
        paciente: 'bg-secondary text-white',
        usuario: 'bg-light text-dark'
    },
    
    // Botones de acción estándar
    actions: {
        // Botón editar - Verde
        edit: 'btn btn-success btn-sm',
        editar: 'btn btn-success btn-sm',
        
        // Botón eliminar - Rojo
        delete: 'btn btn-danger btn-sm',
        eliminar: 'btn btn-danger btn-sm',
        
        // Botón ver/detalles - Azul
        view: 'btn btn-primary btn-sm',
        ver: 'btn btn-primary btn-sm',
        detalles: 'btn btn-info btn-sm',
        
        // Botones especiales
        save: 'btn btn-success',
        guardar: 'btn btn-success',
        cancel: 'btn btn-secondary',
        cancelar: 'btn btn-secondary',
        create: 'btn btn-primary',
        crear: 'btn btn-primary',
        nuevo: 'btn btn-primary'
    },
    
    // Funciones helper para aplicar colores dinámicamente
    getStatusClass: function(status) {
        if (!status) return 'bg-secondary text-white';
        const normalized = status.toString().toLowerCase().trim();
        return this.status[normalized] || 'bg-secondary text-white';
    },
    
    getRoleClass: function(role) {
        if (!role) return 'bg-light text-dark';
        const normalized = role.toString().toLowerCase().trim();
        return this.roles[normalized] || 'bg-light text-dark';
    },
    
    getActionClass: function(action) {
        if (!action) return 'btn btn-secondary btn-sm';
        const normalized = action.toString().toLowerCase().trim();
        return this.actions[normalized] || 'btn btn-secondary btn-sm';
    },
    
    // Función para crear badge de estado
    createStatusBadge: function(status, text) {
        const classes = this.getStatusClass(status);
        return `<span class="badge ${classes}">${text || status}</span>`;
    },
    
    // Función para crear badge de rol
    createRoleBadge: function(role, text) {
        const classes = this.getRoleClass(role);
        return `<span class="badge ${classes}">${text || role}</span>`;
    },
    
    // Función para crear botón de acción con icono
    createActionButton: function(action, text, onclick, icon) {
        const classes = this.getActionClass(action);
        const iconHtml = icon ? `<i class="${icon}"></i> ` : '';
        const style = action === 'editar' || action === 'edit' ? 
            'style="background: #198754 !important; background-image: none !important; border-color: #198754 !important;"' :
            action === 'eliminar' || action === 'delete' ?
            'style="background: #dc3545 !important; background-image: none !important; border-color: #dc3545 !important;"' : '';
        return `<button class="${classes}" ${style} onclick="${onclick}" title="${text}">
            ${iconHtml}${text}
        </button>`;
    },
    
    // Aplicar colores a tabla existente
    applyToTable: function(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        // Buscar badges de estado y aplicar colores
        table.querySelectorAll('.badge').forEach(badge => {
            const text = badge.textContent.toLowerCase().trim();
            if (this.status[text]) {
                badge.className = `badge ${this.status[text]}`;
            }
        });
        
        // Buscar botones de acción y aplicar colores con estilos inline
        table.querySelectorAll('button').forEach(button => {
            const text = button.textContent.toLowerCase().trim();
            if (text.includes('editar') || text.includes('edit') || button.querySelector('.bi-pencil')) {
                button.className = this.actions.edit;
                button.style.cssText = 'background: #198754 !important; background-image: none !important; border-color: #198754 !important; color: white !important;';
            } else if (text.includes('eliminar') || text.includes('delete') || button.querySelector('.bi-trash')) {
                button.className = this.actions.delete;
                button.style.cssText = 'background: #dc3545 !important; background-image: none !important; border-color: #dc3545 !important; color: white !important;';
            } else if (text.includes('ver') || text.includes('detalles') || button.querySelector('.bi-eye')) {
                button.className = this.actions.view;
            }
        });
    }
};

// Aplicar automáticamente a cualquier tabla con clase 'color-scheme-table'
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.color-scheme-table').forEach(table => {
        ColorScheme.applyToTable(table.id);
    });
});

console.log('✅ Color Scheme Utility cargado correctamente');