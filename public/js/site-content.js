(() => {
  const API_URL = '/api/site-content';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  const state = { data: null, fetchedAt: 0 };

  const newsContainer = document.getElementById('newsCards');
  const teamContainer = document.getElementById('teamCards');

  if (!newsContainer && !teamContainer) {
    return;
  }

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const fetchWithTimeout = (url, timeout = 6000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { signal: controller.signal })
      .finally(() => clearTimeout(timer));
  };

  const formatBadgeDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
    return `${day} ${month}`;
  };

  const createNewsCard = (item) => {
    const col = document.createElement('div');
    col.className = 'col-md-4';

    const badge = escapeHtml(item.badge_text || formatBadgeDate(item.fecha_publicacion));
    const imageUrl = escapeHtml(item.imagen_url || 'images/news-placeholder.jpg');
    const resumen = escapeHtml(item.resumen || item.contenido || '');
    const linkText = escapeHtml(item.boton_texto || 'Leer más');
    const linkUrl = escapeHtml(item.boton_url || 'noticias.html');
    const title = escapeHtml(item.titulo || 'Noticia destacada');
    const category = escapeHtml(item.categoria || 'Actualidad');

    col.innerHTML = `
      <div class="card news-card h-100 border-0 shadow-sm">
        ${badge ? `<div class="badge bg-primary position-absolute top-0 start-0 m-2">${badge}</div>` : ''}
        <img src="${imageUrl}" class="card-img-top" alt="${title}">
        <div class="card-body">
          <h3 class="h5">${title}</h3>
          <p class="card-text">${resumen}</p>
        </div>
        <div class="card-footer bg-transparent border-0 d-flex justify-content-between align-items-center">
          <span class="text-muted small">${category}</span>
          <a href="${linkUrl}" class="btn btn-sm btn-outline-primary">
            <i class="fas fa-arrow-right me-1"></i> ${linkText}
          </a>
        </div>
      </div>`;

    return col;
  };

  const createTeamCard = (member) => {
    const col = document.createElement('div');
    col.className = 'col-md-3 col-sm-6';
    const photo = escapeHtml(member.foto_url || 'images/doctor-placeholder.jpg');
    const expertise = escapeHtml(member.especialidad || member.cargo || 'Profesional');
    const name = escapeHtml(member.nombre || 'Integrante del equipo');
    const description = escapeHtml(member.descripcion || '');
    const linkedin = member.linkedin_url ? escapeHtml(member.linkedin_url) : '';

    col.innerHTML = `
      <div class="card team-card h-100 border-0 shadow-sm">
        <img src="${photo}" class="card-img-top rounded-circle mx-auto mt-3" style="width: 150px; height: 150px; object-fit: cover;" alt="${name}">
        <div class="card-body text-center">
          <h3 class="h5">${name}</h3>
          <p class="text-muted">${expertise}</p>
          <p class="card-text">${description}</p>
          ${linkedin ? `<a href="${linkedin}" class="btn btn-sm btn-outline-primary" target="_blank" rel="noopener">
            <i class="fab fa-linkedin"></i>
          </a>` : ''}
        </div>
      </div>`;

    return col;
  };

  const renderNews = (items = []) => {
    if (!newsContainer || !Array.isArray(items) || !items.length) {
      return;
    }
    newsContainer.dataset.static = 'false';
    newsContainer.innerHTML = '';
    items.slice(0, 3).forEach((item) => {
      newsContainer.appendChild(createNewsCard(item));
    });
  };

  const renderTeam = (members = []) => {
    if (!teamContainer || !Array.isArray(members) || !members.length) {
      return;
    }
    teamContainer.dataset.static = 'false';
    teamContainer.innerHTML = '';
    members.forEach((member) => {
      teamContainer.appendChild(createTeamCard(member));
    });
  };

  const loadContent = async () => {
    try {
      if (state.data && Date.now() - state.fetchedAt < CACHE_TTL) {
        renderNews(state.data.noticias);
        renderTeam(state.data.equipo);
        return;
      }

      const response = await fetchWithTimeout(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (payload && payload.success !== false) {
        state.data = payload;
        state.fetchedAt = Date.now();
        renderNews(payload.noticias);
        renderTeam(payload.equipo);
      }
    } catch (error) {
      console.warn('[Landing] No se pudo cargar contenido dinámico, usando fallback estático.', error.message);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContent);
  } else {
    loadContent();
  }
})();
