// js/app.js
// Detectar link de invitación de agencia
(function() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  const agencia = params.get('agencia');
  if (ref) {
    window._refAgenciaUid = ref;
    window._refAgenciaNick = agencia ? decodeURIComponent(agencia) : null;
    // Guardar en sessionStorage para que persista durante el registro
    sessionStorage.setItem('aura_ref_uid', ref);
    sessionStorage.setItem('aura_ref_nick', agencia ? decodeURIComponent(agencia) : '');
    console.log('🔗 Link de invitación detectado · Agencia:', window._refAgenciaNick);
  } else {
    // Recuperar si ya estaba guardado
    window._refAgenciaUid = sessionStorage.getItem('aura_ref_uid') || null;
    window._refAgenciaNick = sessionStorage.getItem('aura_ref_nick') || null;
  }
})();

// js/app.js — AURA Core App

// ── INICIAR APP según rol ────────────────────────────────
window.iniciarApp = function(perfil) {
  if (perfil.rol === 'streamer' && perfil.estado === 'pendiente') {
    showScreen('pendingScreen');
    return;
  }
  showScreen('appScreen');
  renderHeader(perfil);
  renderSidebar(perfil);
  navigate('home');
};

// ── HEADER ───────────────────────────────────────────────
function renderHeader(perfil) {
  const av = document.getElementById('headerAvatar');
  if (!av) return;
  if (perfil.avatar) {
    av.style.backgroundImage = `url(${perfil.avatar})`;
    av.style.backgroundSize = 'cover';
    av.textContent = '';
  } else {
    av.textContent = (perfil.nick || perfil.nombre || '?')[0].toUpperCase();
  }
}

// ── SIDEBAR por rol ──────────────────────────────────────
window.renderSidebar = function(perfil) {
  const mini = document.getElementById('userProfileMini');
  const nav  = document.getElementById('sidebarNav');
  if (!mini || !nav) return;

  // Mini perfil
  const roleColors = {
    master: '#D4AF37', admin: 'rgba(255,255,255,0.7)',
    moderador: '#a8d8f0', agencia: '#A78BFA',
    streamer: '#4ade80', usuario: '#93c5fd'
  };
  const color = roleColors[perfil.rol] || '#fff';
  mini.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:44px;height:44px;border-radius:50%;background:${color}20;
                  border:2px solid ${color};display:flex;align-items:center;
                  justify-content:center;font-size:18px;font-weight:700;color:${color}">
        ${(perfil.nick||perfil.nombre||'?')[0].toUpperCase()}
      </div>
      <div>
        <div style="font-size:14px;font-weight:600;color:#fff">@${perfil.nick||perfil.nombre}</div>
        <div style="font-size:11px;color:${color};text-transform:uppercase;letter-spacing:1px">${perfil.rol}</div>
      </div>
    </div>
    <div style="display:flex;gap:16px;margin-top:12px">
      <div style="text-align:center">
        <div style="font-size:14px;font-weight:700;color:#D4AF37">⭐ ${(perfil.estrellas||0).toLocaleString()}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.4)">Estrellas</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:14px;font-weight:700;color:#fff">${(perfil.seguidores||0).toLocaleString()}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.4)">Seguidores</div>
      </div>
    </div>
  `;

  // Menús por rol
  const menus = {
        master: [
      { sec: 'NÚCLEO GLOBAL' },
      { icon:'🌍', label:'Plataforma Global', page:'home' },
      { icon:'💰', label:'Economía Total', page:'finanzas' },
      { icon:'🔴', label:'Lives & Salas', page:'lives' },
      { sec: 'GESTIÓN' },
      { icon:'👩', label:'Streamers', page:'streamers' },
      { icon:'🏢', label:'Agencies', page:'agencias' },
      { icon:'👮', label:'Admins', page:'admins' },
      { sec: 'SISTEMA' },
      { icon:'🛡️', label:'Seguridad Global', page:'security' },
      { icon:'📊', label:'Analytics', page:'stats' },
      { icon:'⚠️', label:'Alertas Sistema', page:'reportes' },
      { icon:'🔒', label:'Control Plataforma', page:'config' },
      { icon:'💬', label:'Tickets Críticos', page:'tickets' },
      { icon:'📡', label:'Actividad Realtime', page:'actividad' },
      { sec: 'CONFIGURACIÓN' },
      { icon:'💳', label:'Tarifas & Precios', page:'tarifas' },
      { icon:'🎯', label:'Metas Semanales', page:'metas' },
      { icon:'📊', label:'Contabilidad', page:'reportes' },
      { icon:'🔍', label:'Estado Sistema', page:'sistema' },
    ],
        admin: [
      { sec: 'ADMINISTRACIÓN' },
      { icon:'🌍', label:'Estadísticas Globales', page:'stats' },
      { icon:'🔴', label:'Lives Activos', page:'lives' },
      { icon:'👩', label:'Streamers', page:'streamers' },
      { icon:'🏢', label:'Agencies', page:'agencias' },
      { sec: 'CONTROL' },
      { icon:'🛡️', label:'Moderación', page:'moderation' },
      { icon:'⚠️', label:'Reportes Críticos', page:'reportes' },
      { icon:'💬', label:'Tickets', page:'tickets' },
      { sec: 'SALAS' },
      { icon:'🎤', label:'Voice Rooms', page:'voice' },
      { icon:'📹', label:'Video Rooms', page:'video' },
      { sec: 'SISTEMA' },
      { icon:'📊', label:'Economía', page:'finanzas' },
      { icon:'👮', label:'Monitores', page:'monitores' },
      { icon:'🔒', label:'Seguridad', page:'security' },
    ],
        moderador: [
      { sec: 'PANEL MONITOR' },
      { icon:'⬡', label:'Dashboard', page:'home' },
      { icon:'🔴', label:'Lives Activos', page:'lives' },
      { icon:'⚠️', label:'Reportes', page:'reportes' },
      { icon:'👤', label:'Perfiles Sospechosos', page:'perfiles' },
      { sec: 'SALAS' },
      { icon:'🎤', label:'Voice Rooms', page:'voice' },
      { icon:'📹', label:'Video Rooms', page:'video' },
      { sec: 'GESTIÓN' },
      { icon:'💬', label:'Soporte', page:'tickets' },
      { icon:'🚫', label:'Infracciones', page:'infracciones' },
      { icon:'🔒', label:'Bloqueos IP', page:'bloqueos' },
      { icon:'📊', label:'Actividad', page:'actividad' },
      { icon:'🛡️', label:'Escalar Caso', page:'escalar' },
    ],
        agencia: [
      { sec: 'MI AGENCIA' },
      { icon:'🏢', label:'Dashboard', page:'home' },
      { icon:'👩', label:'Mis Streamers', page:'streamers' },
      { icon:'📡', label:'Ver Lives', page:'lives' },
      { sec: 'FINANZAS' },
      { icon:'💳', label:'Ganancias', page:'finanzas' },
      { icon:'📊', label:'Estadísticas', page:'stats' },
      { icon:'🎯', label:'Metas', page:'metas' },
      { sec: 'COMUNICACIÓN' },
      { icon:'✉️', label:'Mensajes', page:'mensajes' },
    ],
        streamer: [
      { sec: 'MI CANAL' },
      { icon:'👑', label:'Dashboard', page:'home' },
      { icon:'📺', label:'Iniciar Live', page:'live' },
      { sec: 'GANANCIAS' },
      { icon:'💰', label:'Ganancias', page:'estrellas' },
      { icon:'💳', label:'Retirar', page:'finanzas' },
      { icon:'🎁', label:'Gifts recibidos', page:'gifts' },
      { sec: 'COMUNIDAD' },
      { icon:'❤️', label:'Fans', page:'seguidores' },
      { icon:'💬', label:'Mensajes', page:'mensajes' },
      { icon:'🏆', label:'Rankings', page:'rankings' },
      { icon:'⚔️', label:'PK Battles', page:'pk' },
      { icon:'⚡', label:'Match', page:'match' },
      { sec: 'MÁS' },
      { icon:'🎯', label:'Metas', page:'metas' },
      { icon:'🎤', label:'Voice Rooms', page:'voice' },
      { icon:'📹', label:'Video Rooms', page:'video' },
      { icon:'🖼️', label:'Galería Premium', page:'galeria' },
      { icon:'👤', label:'Mi Perfil', page:'perfil' },
    ],
        usuario: [
      { sec: 'DESCUBRIR' },
      { icon:'🏠', label:'Inicio', page:'home' },
      { icon:'📺', label:'Lives', page:'lives' },
      { icon:'🔍', label:'Explorar', page:'explorar' },
      { icon:'⚡', label:'Match', page:'match' },
      { sec: 'MI CUENTA' },
      { icon:'⭐', label:'Wallet & Estrellas', page:'estrellas' },
      { icon:'❤️', label:'Favoritas', page:'favoritos' },
      { icon:'💬', label:'Mensajes', page:'mensajes' },
      { icon:'🎤', label:'Voice & Video', page:'rooms' },
      { icon:'🏆', label:'Rankings', page:'rankings' },
      { icon:'👤', label:'Mi Perfil', page:'perfil' },
    ]
  };

  const items = menus[perfil.rol] || menus.usuario;
  nav.innerHTML = items.map(item => {
    if (item.sec) return `<div class="nav-section-title">${item.sec}</div>`;
    return `<button class="nav-item" onclick="navigate('${item.page}');closeSidebar()" data-page="${item.page}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </button>`;
  }).join('');
};

// ── NAVIGATE ─────────────────────────────────────────────
window.navigate = function(page) {
  const perfil = window._currentPerfil;
  if (!perfil) return;

  // Marcar activo en sidebar
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  const content = document.getElementById('appContent');
  if (!content) return;

  // Delegamos al módulo del rol correspondiente
  const rolFn = window[`render_${perfil.rol}`];
  if (rolFn) {
    rolFn(page, content, perfil);
  } else {
    content.innerHTML = `<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3)">
      Página en construcción: ${page}
    </div>`;
  }
};

// ── COMPONENTES COMPARTIDOS ───────────────────────────────
window.renderWelcome = function(nombre, rol, sub) {
  return `<div class="dash-welcome">
    <h1>Bienvenido, ${nombre} ${rolEmoji(rol)}</h1>
    <p>${sub || 'Panel de ' + rol}</p>
  </div>`;
};

window.renderStats = function(stats) {
  return `<div class="stats-grid">
    ${stats.map(s => `
      <div class="stat-card">
        <div class="stat-icon">${s.icon}</div>
        <div class="stat-value">${typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('')}
  </div>`;
};

window.renderActions = function(actions) {
  return `<div class="action-grid">
    ${actions.map(a => `
      <button class="action-btn" onclick="${a.fn}">
        <span class="ab-icon">${a.icon}</span>
        <span class="ab-label">${a.label}</span>
      </button>
    `).join('')}
  </div>`;
};

function rolEmoji(rol) {
  return { master:'👑', admin:'⚙️', moderador:'🛡️', agencia:'🏢', streamer:'🎤', usuario:'👤' }[rol] || '';
}
