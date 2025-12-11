(function(){
  const LABELS = {
    inicio: 'Inicio',
    servicios: 'Servicios',
    equipo: 'Equipo',
    testimonios: 'Testimonios',
    noticias: 'Noticias',
    faqs: 'FAQs',
    pqrs: 'PQRS'
  };

  function createBar(){
    let bar = document.getElementById('breadcrumbs-bar');
    if (bar) return bar;
    bar = document.createElement('nav');
    bar.id = 'breadcrumbs-bar';
    bar.setAttribute('aria-label','breadcrumb');
    bar.style.cssText = 'position:sticky; top:70px; z-index:1030; background:#fff; border-bottom:1px solid #eee;';
    bar.innerHTML = '<ol class="breadcrumb container my-2 mb-0 py-2"><li class="breadcrumb-item"><a href="#inicio">Inicio</a></li><li class="breadcrumb-item active" aria-current="page">Inicio</li></ol>';
    const navbar = document.querySelector('nav.navbar');
    if (navbar && navbar.parentNode) {
      navbar.parentNode.insertBefore(bar, navbar.nextSibling);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }
    return bar;
  }

  function updateTrail(currentId){
    const bar = createBar();
    const ol = bar.querySelector('ol.breadcrumb');
    const label = LABELS[currentId] || 'Sección';
    ol.innerHTML = `
      <li class="breadcrumb-item"><a href="#inicio">Inicio</a></li>
      <li class="breadcrumb-item active" aria-current="page">${label}</li>
    `;
  }

  function observeSections(){
    const sections = Object.keys(LABELS).map(id => document.getElementById(id)).filter(Boolean);
    if (sections.length === 0) return;

    const opts = { root: null, rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] };
    const io = new IntersectionObserver((entries)=>{
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) {
        updateTrail(visible[0].target.id);
      }
    }, opts);
    sections.forEach(sec => io.observe(sec));
  }

  function init(){
    createBar();
    observeSections();
    // Update on hash navigation too
    window.addEventListener('hashchange', () => {
      const id = (location.hash || '#inicio').replace('#','');
      updateTrail(id);
    });
    // On load, set based on hash if present
    const initial = (location.hash || '#inicio').replace('#','');
    updateTrail(initial);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
