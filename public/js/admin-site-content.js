(() => {
  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const DEV_SITE_CONTENT_KEY = 'clinikdent-local-admin';

  class AdminSiteContent {
    constructor() {
      this.apiBase = '/api/site-content';
      this.newsListEl = document.getElementById('newsList');
      this.teamListEl = document.getElementById('teamList');
      this.newsEmptyEl = document.getElementById('newsEmptyState');
      this.teamEmptyEl = document.getElementById('teamEmptyState');
      this.readonlyAlert = document.getElementById('contentReadonlyAlert');
      this.addNewsBtn = document.getElementById('addNewsBtn');
      this.addTeamBtn = document.getElementById('addTeamBtn');
      this.refreshNewsBtn = document.getElementById('refreshNewsBtn');
      this.refreshTeamBtn = document.getElementById('refreshTeamBtn');
      this.newsForm = document.getElementById('newsForm');
      this.teamForm = document.getElementById('teamForm');
      this.newsModalEl = document.getElementById('newsModal');
      this.teamModalEl = document.getElementById('teamModal');
      this.newsModal = this.newsModalEl ? new bootstrap.Modal(this.newsModalEl) : null;
      this.teamModal = this.teamModalEl ? new bootstrap.Modal(this.teamModalEl) : null;
      this.isReadOnly = false;
      this.newsItems = [];
      this.teamItems = [];
      this.lastRefresh = 0;
      this.devBypassKey = DEV_SITE_CONTENT_KEY;
      this.cachedUser = undefined;

      if (!this.newsListEl && !this.teamListEl) {
        return;
      }

      this.bindEvents();
      this.refreshAll(true);
    }

    bindEvents() {
      this.addNewsBtn?.addEventListener('click', () => this.openNewsModal());
      this.addTeamBtn?.addEventListener('click', () => this.openTeamModal());
      this.refreshNewsBtn?.addEventListener('click', () => this.refreshNews(true));
      this.refreshTeamBtn?.addEventListener('click', () => this.refreshTeam(true));

      this.newsForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        this.saveNews();
      });

      this.teamForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        this.saveTeamMember();
      });

      this.newsListEl?.addEventListener('click', (event) => this.handleListAction(event, 'noticias'));
      this.teamListEl?.addEventListener('click', (event) => this.handleListAction(event, 'equipo'));
    }

    handleListAction(event, collection) {
      const button = event.target.closest('button[data-action]');
      if (!button || this.isReadOnly) {
        return;
      }

      const id = Number(button.dataset.id);
      if (!id) return;
      const action = button.dataset.action;

      if (collection === 'noticias') {
        if (action === 'edit') {
          this.openNewsModal(id);
        } else if (action === 'toggle') {
          this.toggleItem('noticias', id);
        } else if (action === 'delete') {
          this.deleteItem('noticias', id);
        }
      } else if (collection === 'equipo') {
        if (action === 'edit') {
          this.openTeamModal(id);
        } else if (action === 'toggle') {
          this.toggleItem('equipo', id);
        } else if (action === 'delete') {
          this.deleteItem('equipo', id);
        }
      }
    }

    async refreshAll(force = false) {
      const now = Date.now();
      if (!force && now - this.lastRefresh < 15000) {
        return;
      }
      this.lastRefresh = now;
      this.cachedUser = undefined;
      await Promise.all([this.refreshNews(force), this.refreshTeam(force)]);
    }

    async refreshNews() {
      const items = await this.fetchCollection('noticias');
      this.newsItems = items;
      this.renderNews();
    }

    async refreshTeam() {
      const items = await this.fetchCollection('equipo');
      this.teamItems = items;
      this.renderTeam();
    }

    async fetchCollection(collection) {
      const accessCheck = this.buildAuthHeaders(true);
      if (!accessCheck.allowed) {
        this.setReadOnly(true);
        return this.fetchPublicFallback(collection);
      }
      try {
        const payload = await this.adminFetch(`/${collection}`);
        this.setReadOnly(false);
        return payload.data || [];
      } catch (error) {
        console.warn(`[Contenido] Error consultando ${collection}:`, error.message);
        this.notify('No se pudo cargar el contenido actualizado. Mostrando datos públicos.', 'warning');
        this.setReadOnly(true);
        return this.fetchPublicFallback(collection);
      }
    }

    async fetchPublicFallback(collection) {
      try {
        const response = await fetch(this.apiBase);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = await response.json();
        const data = payload[collection] || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('[Contenido] Error en fallback público:', error.message);
        return [];
      }
    }

    setReadOnly(state) {
      if (this.isReadOnly === state) return;
      this.isReadOnly = state;
      const toggleAttr = (el) => {
        if (!el) return;
        if (state) {
          el.setAttribute('disabled', 'disabled');
        } else {
          el.removeAttribute('disabled');
        }
      };
      toggleAttr(this.addNewsBtn);
      toggleAttr(this.addTeamBtn);
      toggleAttr(this.refreshNewsBtn);
      toggleAttr(this.refreshTeamBtn);
      if (this.readonlyAlert) {
        this.readonlyAlert.classList.toggle('d-none', !state);
      }
    }

    renderNews() {
      if (!this.newsListEl) return;
      if (!this.newsItems.length) {
        this.newsListEl.innerHTML = '';
        if (this.newsEmptyEl) {
          this.newsEmptyEl.classList.remove('d-none');
          this.newsListEl.appendChild(this.newsEmptyEl);
        }
        return;
      }
      if (this.newsEmptyEl) this.newsEmptyEl.classList.add('d-none');
      const items = this.newsItems
        .map((item) => this.buildNewsItem(item))
        .join('');
      this.newsListEl.innerHTML = items;
    }

    renderTeam() {
      if (!this.teamListEl) return;
      if (!this.teamItems.length) {
        this.teamListEl.innerHTML = '';
        if (this.teamEmptyEl) {
          this.teamEmptyEl.classList.remove('d-none');
          this.teamListEl.appendChild(this.teamEmptyEl);
        }
        return;
      }
      if (this.teamEmptyEl) this.teamEmptyEl.classList.add('d-none');
      const items = this.teamItems
        .map((item) => this.buildTeamItem(item))
        .join('');
      this.teamListEl.innerHTML = items;
    }

    buildNewsItem(item) {
      const statusClass = item.activo ? 'bg-success' : 'bg-secondary';
      const statusText = item.activo ? 'Visible' : 'Oculto';
      const fecha = item.fecha_publicacion ? new Date(item.fecha_publicacion).toLocaleDateString('es-CO') : 'Sin fecha';
      const summaryRaw = item.resumen || item.contenido || '';
      const summary = escapeHtml(summaryRaw.substring(0, 90)) + (summaryRaw.length > 90 ? '…' : '');
      const title = escapeHtml(item.titulo || 'Sin título');
      const category = escapeHtml(item.categoria || 'General');
      return `
        <div class="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="fw-semibold">${title}</span>
              <span class="badge ${statusClass}">${statusText}</span>
              <span class="badge bg-light text-dark">${category}</span>
            </div>
            <small class="text-muted d-block">${fecha} · ${summary}</small>
          </div>
          ${this.renderActions('noticias', item)}
        </div>`;
    }

    buildTeamItem(item) {
      const statusClass = item.activo ? 'bg-success' : 'bg-secondary';
      const statusText = item.activo ? 'Visible' : 'Oculto';
      const name = escapeHtml(item.nombre || 'Sin nombre');
      const specialty = escapeHtml(item.especialidad || item.cargo || 'Especialidad no definida');
      const descriptionRaw = item.descripcion || '';
      const description = escapeHtml(descriptionRaw.substring(0, 90)) + (descriptionRaw.length > 90 ? '…' : '');
      return `
        <div class="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="fw-semibold">${name}</span>
              <span class="badge ${statusClass}">${statusText}</span>
            </div>
            <small class="text-muted d-block">${specialty}</small>
            <small class="text-muted d-block">${description}</small>
          </div>
          ${this.renderActions('equipo', item)}
        </div>`;
    }

    renderActions(collection, item) {
      if (this.isReadOnly) {
        return '';
      }
      return `
        <div class="btn-group btn-group-sm flex-shrink-0">
          <button class="btn btn-outline-primary" data-action="edit" data-id="${item.id}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-warning" data-action="toggle" data-id="${item.id}" title="Cambiar visibilidad">
            <i class="bi ${item.activo ? 'bi-eye-slash' : 'bi-eye'}"></i>
          </button>
          <button class="btn btn-outline-danger" data-action="delete" data-id="${item.id}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>`;
    }

    openNewsModal(id = null) {
      if (this.isReadOnly) {
        this.notify('No puedes editar contenido en modo solo lectura.', 'warning');
        return;
      }
      this.resetNewsForm();
      const title = document.getElementById('newsModalLabel');
      if (id) {
        const item = this.newsItems.find((n) => n.id === id);
        if (!item) return;
        this.fillNewsForm(item);
        if (title) title.textContent = 'Editar noticia';
      } else if (title) {
        title.textContent = 'Nueva noticia';
      }
      this.newsModal?.show();
    }

    resetNewsForm() {
      this.newsForm?.reset();
      const idField = document.getElementById('newsId');
      if (idField) idField.value = '';
      const activo = document.getElementById('newsActivo');
      if (activo) activo.checked = true;
    }

    fillNewsForm(item) {
      const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
      };
      setValue('newsId', item.id);
      setValue('newsTitulo', item.titulo);
      setValue('newsResumen', item.resumen || item.contenido || '');
      setValue('newsContenido', item.contenido || '');
      setValue('newsImagen', item.imagen_url || '');
      setValue('newsCategoria', item.categoria || '');
      setValue('newsBadge', item.badge_text || '');
      setValue('newsBotonTexto', item.boton_texto || '');
      setValue('newsBotonUrl', item.boton_url || '');
      setValue('newsOrden', item.orden ?? 0);
      const fecha = document.getElementById('newsFecha');
      if (fecha) {
        fecha.value = item.fecha_publicacion ? new Date(item.fecha_publicacion).toISOString().substring(0, 10) : '';
      }
      const activo = document.getElementById('newsActivo');
      if (activo) activo.checked = item.activo !== false;
    }

    async saveNews() {
      if (this.isReadOnly) return;

      const payload = {
        titulo: document.getElementById('newsTitulo')?.value?.trim(),
        resumen: document.getElementById('newsResumen')?.value?.trim(),
        contenido: document.getElementById('newsContenido')?.value?.trim(),
        imagen_url: document.getElementById('newsImagen')?.value?.trim(),
        categoria: document.getElementById('newsCategoria')?.value?.trim(),
        badge_text: document.getElementById('newsBadge')?.value?.trim(),
        boton_texto: document.getElementById('newsBotonTexto')?.value?.trim(),
        boton_url: document.getElementById('newsBotonUrl')?.value?.trim(),
        fecha_publicacion: document.getElementById('newsFecha')?.value || null,
        orden: Number(document.getElementById('newsOrden')?.value) || 0,
        activo: document.getElementById('newsActivo')?.checked ?? true
      };

      if (!payload.titulo || !payload.resumen) {
        this.notify('Completa al menos el título y el resumen.', 'warning');
        return;
      }

      const id = document.getElementById('newsId')?.value;
      const method = id ? 'PUT' : 'POST';
      const path = id ? `/noticias/${id}` : '/noticias';

      try {
        this.toggleFormState(this.newsForm, true);
        await this.adminFetch(path, { method, body: payload });
        this.notify('Noticia guardada correctamente', 'success');
        this.newsModal?.hide();
        await this.refreshNews(true);
      } catch (error) {
        console.error('[Contenido] Error guardando noticia:', error.message);
        this.notify(error.message, 'danger');
      } finally {
        this.toggleFormState(this.newsForm, false);
      }
    }

    openTeamModal(id = null) {
      if (this.isReadOnly) {
        this.notify('No puedes editar contenido en modo solo lectura.', 'warning');
        return;
      }
      this.resetTeamForm();
      const title = document.getElementById('teamModalLabel');
      if (id) {
        const item = this.teamItems.find((m) => m.id === id);
        if (!item) return;
        this.fillTeamForm(item);
        if (title) title.textContent = 'Editar integrante';
      } else if (title) {
        title.textContent = 'Nuevo integrante';
      }
      this.teamModal?.show();
    }

    resetTeamForm() {
      this.teamForm?.reset();
      const idField = document.getElementById('teamId');
      if (idField) idField.value = '';
      const activo = document.getElementById('teamActivo');
      if (activo) activo.checked = true;
      const orden = document.getElementById('teamOrden');
      if (orden) orden.value = 0;
    }

    fillTeamForm(item) {
      const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
      };
      setValue('teamId', item.id);
      setValue('teamNombre', item.nombre);
      setValue('teamCargo', item.cargo);
      setValue('teamEspecialidad', item.especialidad);
      setValue('teamDescripcion', item.descripcion);
      setValue('teamFoto', item.foto_url);
      setValue('teamLinkedin', item.linkedin_url);
      setValue('teamOrden', item.orden ?? 0);
      const activo = document.getElementById('teamActivo');
      if (activo) activo.checked = item.activo !== false;
    }

    async saveTeamMember() {
      if (this.isReadOnly) return;

      const payload = {
        nombre: document.getElementById('teamNombre')?.value?.trim(),
        cargo: document.getElementById('teamCargo')?.value?.trim(),
        especialidad: document.getElementById('teamEspecialidad')?.value?.trim(),
        descripcion: document.getElementById('teamDescripcion')?.value?.trim(),
        foto_url: document.getElementById('teamFoto')?.value?.trim(),
        linkedin_url: document.getElementById('teamLinkedin')?.value?.trim(),
        orden: Number(document.getElementById('teamOrden')?.value) || 0,
        activo: document.getElementById('teamActivo')?.checked ?? true
      };

      if (!payload.nombre || !payload.descripcion) {
        this.notify('Completa al menos el nombre y la descripción.', 'warning');
        return;
      }

      const id = document.getElementById('teamId')?.value;
      const method = id ? 'PUT' : 'POST';
      const path = id ? `/equipo/${id}` : '/equipo';

      try {
        this.toggleFormState(this.teamForm, true);
        await this.adminFetch(path, { method, body: payload });
        this.notify('Integrante guardado correctamente', 'success');
        this.teamModal?.hide();
        await this.refreshTeam(true);
      } catch (error) {
        console.error('[Contenido] Error guardando integrante:', error.message);
        this.notify(error.message, 'danger');
      } finally {
        this.toggleFormState(this.teamForm, false);
      }
    }

    async toggleItem(collection, id) {
      try {
        await this.adminFetch(`/${collection}/${id}/estado`, {
          method: 'PATCH',
          body: {}
        });
        this.notify('Estado actualizado', 'success');
        if (collection === 'noticias') {
          await this.refreshNews(true);
        } else {
          await this.refreshTeam(true);
        }
      } catch (error) {
        console.error('[Contenido] Error al cambiar estado:', error.message);
        this.notify(error.message, 'danger');
      }
    }

    async deleteItem(collection, id) {
      const confirmed = await this.showConfirmDialog(
        '¿Eliminar este registro?',
        'Esta acción no se puede deshacer. El registro será eliminado permanentemente.',
        'danger'
      );
      if (!confirmed) return;
      try {
        await this.adminFetch(`/${collection}/${id}`, { method: 'DELETE' });
        this.notify('Registro eliminado', 'success');
        if (collection === 'noticias') {
          await this.refreshNews(true);
        } else {
          await this.refreshTeam(true);
        }
      } catch (error) {
        console.error('[Contenido] Error eliminando registro:', error.message);
        this.notify(error.message, 'danger');
      }
    }

    toggleFormState(form, disabled) {
      if (!form) return;
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        if (!submitBtn.dataset.originalLabel) {
          submitBtn.dataset.originalLabel = submitBtn.innerHTML;
        }
        submitBtn.disabled = disabled;
        submitBtn.innerHTML = disabled
          ? '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...'
          : submitBtn.dataset.originalLabel;
      }
      Array.from(form.elements).forEach((el) => {
        if (el.type !== 'hidden') {
          el.disabled = disabled;
        }
      });
    }

    notify(message, type = 'info') {
      if (typeof window.showToast === 'function') {
        window.showToast(message, type);
      } else {
        console.log(`[${type}] ${message}`);
      }
    }

    getStoredUser() {
      if (this.cachedUser === undefined) {
        try {
          this.cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
          this.cachedUser = null;
        }
      }
      return this.cachedUser;
    }

    buildAuthHeaders(requireAdmin = false) {
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        return { headers, mode: 'token', allowed: true };
      }

      const user = this.getStoredUser();
      const role = String(user?.rol || '').toLowerCase();
      if (user && (role === 'administrador' || role === 'admin')) {
        headers['X-Site-Content-Dev'] = this.devBypassKey;
        headers['X-User-Role'] = user.rol;
        headers['X-User-Id'] = user.id || '';
        headers['X-User-Name'] = `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.nombre || 'Administrador';
        return { headers, mode: 'dev', allowed: true };
      }

      return { headers, mode: 'public', allowed: !requireAdmin };
    }

    async adminFetch(path, { method = 'GET', body } = {}) {
      const authMeta = this.buildAuthHeaders(true);
      if (!authMeta.allowed) {
        throw new Error('Se requiere una sesión de administrador para realizar esta acción.');
      }

      const options = {
        method,
        headers: { ...authMeta.headers }
      };

      if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.apiBase}${path}`, options);
      let payload = {};
      try {
        payload = await response.json();
      } catch (error) {
        payload = {};
      }

      if (response.status === 401 || response.status === 403) {
        const reason = authMeta.mode === 'dev'
          ? 'No se pudo validar la sesión administrativa local.'
          : 'Tu sesión expiró. Inicia sesión nuevamente.';
        throw new Error(payload.message || reason);
      }

      if (!response.ok) {
        throw new Error(payload.message || 'Error al procesar la solicitud.');
      }

      return payload;
    }

    ensureLoaded() {
      this.refreshAll(true);
    }

    showConfirmDialog(title, message, variant = 'warning') {
      return new Promise((resolve) => {
        // Remover modal previo si existe
        const existingModal = document.getElementById('confirmDeleteModal');
        if (existingModal) {
          existingModal.remove();
        }

        // Iconos según variante
        const icons = {
          danger: '<i class="fas fa-exclamation-triangle text-danger" style="font-size: 3rem;"></i>',
          warning: '<i class="fas fa-exclamation-circle text-warning" style="font-size: 3rem;"></i>',
          info: '<i class="fas fa-info-circle text-info" style="font-size: 3rem;"></i>'
        };

        // Crear modal
        const modalHTML = `
          <div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content border-0 shadow-lg">
                <div class="modal-body text-center p-4">
                  <div class="mb-3">
                    ${icons[variant] || icons.warning}
                  </div>
                  <h5 class="modal-title mb-3 fw-bold">${title}</h5>
                  <p class="text-muted mb-4">${message}</p>
                  <div class="d-grid gap-2 d-md-flex justify-content-md-center">
                    <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">
                      <i class="fas fa-times me-2"></i>Cancelar
                    </button>
                    <button type="button" class="btn btn-danger px-4" id="confirmDeleteBtn">
                      <i class="fas fa-trash-alt me-2"></i>Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modalElement = document.getElementById('confirmDeleteModal');
        const modal = new bootstrap.Modal(modalElement);
        const confirmBtn = document.getElementById('confirmDeleteBtn');

        confirmBtn.addEventListener('click', () => {
          modal.hide();
          resolve(true);
        });

        modalElement.addEventListener('hidden.bs.modal', () => {
          modalElement.remove();
          resolve(false);
        }, { once: true });

        modal.show();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.siteContentManager = new AdminSiteContent();
  });
})();
