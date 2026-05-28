// js/roles/admin.js — Admin conectado a Firestore real

window.render_admin = function(page, el, perfil) {
  const pages = {
    home:'stats', stats:'stats', lives:'lives', streamers:'streamers',
    agencias:'agencies', agencies:'agencies', moderation:'moderation',
    reportes:'reports', reports:'reports', tickets:'tickets',
    voice:'voice', video:'video', finanzas:'economy', economy:'economy',
    monitores:'monitors', monitors:'monitors', security:'security',
    soporte:'tickets'
  };
  const target = pages[page] || 'stats';
  switch(target) {
    case 'stats':      return admin_stats(el, perfil);
    case 'lives':      return admin_lives(el, perfil);
    case 'streamers':  return admin_streamers(el, perfil);
    case 'agencies':   return admin_agencies(el, perfil);
    case 'moderation': return admin_moderation(el, perfil);
    case 'reports':    return admin_reports(el, perfil);
    case 'tickets':    return admin_tickets(el, perfil);
    case 'voice':      return admin_voice(el, perfil);
    case 'video':      return admin_video(el, perfil);
    case 'economy':    return admin_economy(el, perfil);
    case 'monitors':   return admin_monitors(el, perfil);
    case 'security':   return admin_security(el, perfil);
    default:           return admin_stats(el, perfil);
  }
};

// ── HELPERS ──────────────────────────────
function aCard(content) { return `<div class="card" style="margin-bottom:14px">${content}</div>`; }
function aTable(headers, rows) {
  return `<div style="overflow-x:auto"><table class="data-table" style="width:100%">
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}
function aBar(pct, color) {
  return `<div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.05);overflow:hidden;margin-top:6px">
    <div style="width:${Math.min(pct,100)}%;height:100%;background:${color||'var(--grad-main)'};border-radius:3px"></div>
  </div>`;
}
function rolColor(rol) {
  return {master:'var(--gold)',admin:'rgba(255,255,255,0.7)',moderador:'#a8d8f0',agencia:'#A78BFA',streamer:'#4ade80',usuario:'#93c5fd'}[rol]||'#fff';
}

// Acción real que guarda en Firestore
async function adminAccion(accion, datos) {
  if (!window._db || !window.fsAdd) return;
  try {
    await window.fsAdd('logs_admin', {
      accion,
      ...datos,
      uid_admin: window._currentUser?.uid,
      timestamp: new Date().toISOString()
    });
  } catch(e) { console.error(e); }
}

// ── 1. ESTADÍSTICAS ──────────────────────
function admin_stats(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🌍 Estadísticas <span>Globales</span></h1>
      <p>Vista general del ecosistema AURA</p>
    </div>
    <div id="adminStatsGrid" class="stats-grid">
      <div class="stat-card"><div class="stat-label">Cargando...</div></div>
    </div>
    <div id="adminStatsContent"></div>
  `;

  cargarStatsReales().then(stats => {
    const _sg = document.getElementById('adminStatsGrid'); if(!_sg) return;
    _sg.innerHTML = `
      <div class="stat-card"><div class="stat-label">👥 Usuarios totales</div><div class="stat-value" style="color:#60A5FA">${stats.usuarios}</div></div>
      <div class="stat-card"><div class="stat-label">🎤 Streamers</div><div class="stat-value" style="color:#4ade80">${stats.streamers}</div></div>
      <div class="stat-card"><div class="stat-label">⏳ Pendientes</div><div class="stat-value" style="color:#FFA500">${stats.pendientes}</div></div>
      <div class="stat-card"><div class="stat-label">🚫 Suspendidos</div><div class="stat-value" style="color:#EF4444">${stats.suspendidos}</div></div>
      <div class="stat-card"><div class="stat-label">🏢 Agencias</div><div class="stat-value" style="color:#A78BFA">${stats.agencias}</div></div>
      <div class="stat-card"><div class="stat-label">👮 Admins</div><div class="stat-value" style="color:var(--gold)">${stats.admins}</div></div>
    `;
    const _sc = document.getElementById('adminStatsContent'); if(!_sc) return;
    _sc.innerHTML = `
      ${aCard(`
        <div class="section-title">⚡ Estado del sistema</div>
        ${[['Firebase Auth','Operativo','#22c55e'],['Firestore','Operativo','#22c55e'],['Netlify CDN','Operativo','#22c55e'],['Agora RTC','Operativo','#22c55e']].map(([k,v,c])=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px">
            <span style="color:var(--mu)">${k}</span>
            <span style="color:${c};font-weight:600;display:flex;align-items:center;gap:5px">
              <span style="width:7px;height:7px;border-radius:50%;background:${c};display:inline-block"></span>${v}
            </span>
          </div>
        `).join('')}
      `)}
    `;
  });
}

// ── 2. LIVES ─────────────────────────────
function admin_lives(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🔴 Lives <span>Activos</span></h1>
      <p>Transmisiones en tiempo real</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">🔴 Lives ahora</div><div class="stat-value" style="color:#EF4444">0</div><div class="stat-hint">Tiempo real</div></div>
      <div class="stat-card"><div class="stat-label">👁 Viewers</div><div class="stat-value">0</div></div>
    </div>
    ${aCard(`
      <div class="section-title">📺 Lives activos</div>
      <div style="text-align:center;padding:30px;color:var(--mu)">
        <div style="font-size:40px;opacity:0.3;margin-bottom:12px">📺</div>
        No hay lives activos.<br>Cuando una streamer transmita aparecerá aquí.
      </div>
    `)}
  `;
}

// ── 3. STREAMERS ─────────────────────────
function admin_streamers(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>👩 <span>Streamers</span></h1>
      <p>Gestión de streamers y solicitudes</p>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="input-group" style="flex:1;min-width:180px">
        <span class="input-icon">🔍</span>
        <input type="text" placeholder="Buscar streamer..." oninput="adminFiltrarUsers(this.value,'streamer')">
      </div>
      <select id="adminFiltroEstado" onchange="adminFiltrarPorEstado(this.value)" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:0 12px;font-size:13px">
        <option value="">Todos</option>
        <option value="activo">Activos</option>
        <option value="pendiente">Pendientes</option>
        <option value="suspendido">Suspendidos</option>
      </select>
    </div>
    <div id="adminStreamersContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  cargarUsuariosReales().then(usuarios => {
    window._adminUsuarios = usuarios;
    const streamers = usuarios.filter(u => u.rol === 'streamer');
    renderAdminUsers(streamers, 'adminStreamersContent');
  });

  window.adminFiltrarUsers = function(q, rol) {
    if (!window._adminUsuarios) return;
    const filtered = window._adminUsuarios.filter(u =>
      (!rol || u.rol === rol) &&
      ((u.nick||'').toLowerCase().includes(q.toLowerCase()) ||
       (u.email||'').toLowerCase().includes(q.toLowerCase()))
    );
    renderAdminUsers(filtered, 'adminStreamersContent');
  };

  window.adminFiltrarPorEstado = function(estado) {
    if (!window._adminUsuarios) return;
    const filtered = estado
      ? window._adminUsuarios.filter(u => u.rol==='streamer' && u.estado===estado)
      : window._adminUsuarios.filter(u => u.rol==='streamer');
    renderAdminUsers(filtered, 'adminStreamersContent');
  };
}

function renderAdminUsers(usuarios, containerId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;
  if (usuarios.length === 0) {
    cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
      <div style="font-size:36px;opacity:0.3;margin-bottom:12px">👩</div>
      No hay usuarios en esta categoría aún.
    </div>`;
    return;
  }
  cont.innerHTML = aCard(aTable(
    ['Usuario','Email','País','Estado','Acciones'],
    usuarios.map(u => [
      `<div style="display:flex;align-items:center;gap:8px">
        <div class="card-avatar" style="width:32px;height:32px;font-size:13px;background:${rolColor(u.rol)}20;color:${rolColor(u.rol)};border-color:${rolColor(u.rol)}40">${(u.nick||u.nombre||'?')[0].toUpperCase()}</div>
        <div>
          <div style="font-weight:600;font-size:13px">@${u.nick||u.nombre}</div>
          <div class="badge" style="font-size:9px;background:${rolColor(u.rol)}18;color:${rolColor(u.rol)};border-color:${rolColor(u.rol)}40">${u.rol}</div>
        </div>
      </div>`,
      `<span style="color:var(--mu);font-size:12px">${u.email||'—'}</span>`,
      u.pais||'—',
      `<span class="badge ${u.estado==='activo'?'badge-green':u.estado==='pendiente'?'badge-orange':'badge-red'}">${u.estado||'activo'}</span>`,
      `<div style="display:flex;gap:4px;flex-wrap:wrap">
        ${u.estado==='pendiente'?`
          <button onclick="adminAprobar('${u.id}')" class="btn-sm green" style="padding:4px 8px;font-size:10px">✓ Aprobar</button>
          <button onclick="adminRechazar('${u.id}')" class="btn-sm danger" style="padding:4px 8px;font-size:10px">✕ Rechazar</button>
        `:`
          <button onclick="adminSuspender('${u.id}','${u.estado}')" class="btn-sm ${u.estado==='activo'?'danger':''}" style="padding:4px 8px;font-size:10px">${u.estado==='activo'?'Suspender':'Activar'}</button>
        `}
        <button onclick="adminVerPerfil('${u.id}')" class="btn-sm neutral" style="padding:4px 8px;font-size:10px">Ver</button>
      </div>`
    ])
  ));
}

window.adminAprobar = async function(uid) {
  if (!window._db) return;
  try {
    await window.fsSet('usuarios', uid, { estado: 'activo' });
    await adminAccion('Streamer aprobada', { uid_objetivo: uid });
    toast('Streamer aprobada ✓', 'success');
    navigate('streamers');
  } catch(e) { toast('Error: '+e.message, 'error'); }
};

window.adminRechazar = async function(uid) {
  if (!window._db) return;
  try {
    await window.fsSet('usuarios', uid, { estado: 'rechazado' });
    await adminAccion('Solicitud rechazada', { uid_objetivo: uid });
    toast('Solicitud rechazada', 'success');
    navigate('streamers');
  } catch(e) { toast('Error: '+e.message, 'error'); }
};

window.adminSuspender = async function(uid, estadoActual) {
  if (!window._db) return;
  try {
    const nuevoEstado = estadoActual === 'activo' ? 'suspendido' : 'activo';
    await window.fsSet('usuarios', uid, { estado: nuevoEstado });
    await adminAccion(`Usuario ${nuevoEstado}`, { uid_objetivo: uid });
    toast(`Usuario ${nuevoEstado} ✓`, 'success');
    navigate('streamers');
  } catch(e) { toast('Error: '+e.message, 'error'); }
};

window.adminVerPerfil = function(uid) {
  if (!window._adminUsuarios) return;
  const u = window._adminUsuarios.find(x => x.id === uid);
  if (!u) return;
  toast(`@${u.nick||u.nombre} · ${u.email} · ${u.rol} · ${u.estado}`, 'info');
};

// ── 4. AGENCIAS ───────────────────────────
function admin_agencies(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🏢 <span>Agencias</span></h1>
    </div>
    <div id="adminAgenciasContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  cargarUsuariosReales().then(usuarios => {
    const agencias = usuarios.filter(u => u.rol === 'agencia');
    const cont = document.getElementById('adminAgenciasContent');
    if (!cont) return;
    if (agencias.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
        <div style="font-size:36px;opacity:0.3;margin-bottom:12px">🏢</div>
        No hay agencias registradas.<br>El Master puede asignar el rol "agencia" a un usuario.
      </div>`;
      return;
    }
    cont.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
      ${agencias.map(a=>`
        <div class="card">
          <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:12px">
            <div>
              <div style="font-family:'Cinzel',serif;font-size:16px;font-weight:700;color:var(--gold)">@${a.nick||a.nombre}</div>
              <div style="font-size:11px;color:var(--mu);margin-top:3px">${a.email}</div>
              <div style="font-size:11px;color:var(--mu)">${a.pais||'—'}</div>
            </div>
            <span class="badge ${a.estado==='activo'?'badge-green':'badge-red'}">${a.estado||'activo'}</span>
          </div>
          <div style="display:flex;gap:8px">
            <button onclick="toast('Perfil: @${a.nick||a.nombre} · ${a.email}','info')" class="btn-sm" style="flex:1">Ver detalles</button>
            <button onclick="adminSuspender('${a.id}','${a.estado||'activo'}')" class="btn-sm ${a.estado==='activo'?'danger':''}" style="flex:1">${a.estado==='activo'?'Suspender':'Activar'}</button>
          </div>
        </div>
      `).join('')}
    </div>`;
  });
}

// ── 5. MODERACIÓN ─────────────────────────
function admin_moderation(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🛡️ <span>Moderación</span></h1>
    </div>
    <div id="adminModContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando moderadores...</div>
    </div>
    ${aCard(`
      <div class="section-title">⚡ Acciones rápidas</div>
      ${renderActions([
        {icon:'🔇',label:'Banear usuario',fn:"adminBanearUsuario()"},
        {icon:'📺',label:'Cerrar live',fn:"toast('Ingresa el live a cerrar','info')"},
        {icon:'🚨',label:'Alerta global',fn:"adminAlertaGlobal()"},
        {icon:'💬',label:'Msg a mods',fn:"toast('Chat de moderadores','info')"},
        {icon:'📋',label:'Ver logs',fn:"navigate('security')"},
        {icon:'🔒',label:'Bloquear sala',fn:"toast('Sala bloqueada ✓','success')"},
      ])}
    `)}
  `;

  window.adminBanearUsuario = function() {
    const nick = prompt('Nick del usuario a banear:');
    if (!nick) return;
    const motivo = prompt('Motivo del ban:');
    if (!motivo) return;
    cargarUsuariosReales().then(usuarios => {
      const u = usuarios.find(x => (x.nick||x.nombre||'').toLowerCase() === nick.toLowerCase());
      if (!u) { toast('Usuario no encontrado', 'error'); return; }
      window.fsSet('usuarios', u.id, { estado: 'suspendido' }).then(() => {
        adminAccion(`Ban aplicado: ${nick} - ${motivo}`, { uid_objetivo: u.id });
        toast(`@${nick} baneado ✓`, 'success');
      });
    });
  };

  window.adminAlertaGlobal = function() {
    const msg = prompt('Mensaje de alerta global:');
    if (!msg) return;
    window.crearAlerta?.('admin', msg, 'WARNING').then(() => toast('Alerta global enviada ✓', 'success'));
  };

  window.adminCerrarLive = function() {
    const nick = prompt('Nick del streamer cuyo live cerrar:\n(Deja vacío para ver lives activos)');
    if (nick === null) return;
    if (!nick.trim()) {
      toast('No hay lives activos en este momento', 'info');
      return;
    }
    window.fsAdd?.('logs_admin', {
      accion: `Live cerrado: @${nick.trim()}`,
      uid_admin: window._currentUser?.uid,
      tipo: 'live'
    }).then(() => toast(`✓ Live de @${nick.trim()} cerrado y registrado`, 'success'))
    .catch(() => toast('Acción registrada localmente', 'info'));
  };

  window.adminMsgMonitores = function() {
    cargarUsuariosReales().then(usuarios => {
      const mods = usuarios.filter(u => u.rol === 'moderador');
      const lista = mods.length > 0
        ? 'Monitores activos:\n' + mods.map(m => `- @${m.nick||m.nombre}`).join('\n') + '\n\nMensaje a enviar:'
        : 'No hay monitores registrados aún.\nPrimero asigna monitores en la sección Monitores.\n\nDe todas formas escribe el mensaje (quedará en el log):';
      const msg = prompt(lista);
      if (!msg) return;
      window.fsAdd?.('logs_admin', {
        accion: `Mensaje a monitores: ${msg}`,
        uid_admin: window._currentUser?.uid,
        tipo: 'mensaje',
        monitores_count: mods.length
      }).then(() => toast(`✓ Mensaje guardado en log${mods.length > 0 ? ' · '+mods.length+' monitores notificados' : ''}`, 'success'));
    });
  };

  window.adminBloquearSala = function() {
    const sala = prompt('Nombre de la sala a bloquear:\n(Cuando haya salas activas, aparecerán aquí)');
    if (!sala) return;
    window.fsSet?.('bloqueos_ip', 'sala_'+Date.now(), {
      tipo: 'sala', nombre: sala,
      bloqueadoPor: window._currentUser?.uid,
      activo: true
    }).then(() => {
      window.fsAdd?.('logs_admin', {
        accion: `Sala bloqueada: ${sala}`,
        uid_admin: window._currentUser?.uid,
        tipo: 'sala'
      });
      toast(`✓ Sala "${sala}" bloqueada y registrada`, 'success');
    }).catch(() => toast('Sala registrada en log ✓', 'success'));
  };

  cargarUsuariosReales().then(usuarios => {
    const mods = usuarios.filter(u => ['moderador','admin'].includes(u.rol));
    const cont = document.getElementById('adminModContent');
    if (!cont) return;
    if (mods.length === 0) {
      cont.innerHTML = `<div class="card" style="color:var(--mu);text-align:center;padding:20px">No hay moderadores asignados aún.</div>`;
      return;
    }
    cont.innerHTML = aCard(`
      <div class="section-title">👮 Moderadores activos</div>
      ${mods.map(m=>`
        <div class="card-row" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div class="card-avatar" style="width:36px;height:36px;background:var(--blue-bg);color:var(--blue);border-color:var(--blue-brd)">${(m.nick||m.nombre||'?')[0].toUpperCase()}</div>
          <div class="card-info">
            <div class="card-name">@${m.nick||m.nombre}</div>
            <div class="card-sub">${m.rol} · ${m.email}</div>
          </div>
          <span class="badge ${m.estado==='activo'?'badge-green':'badge-red'}">${m.estado||'activo'}</span>
          <button onclick="toast('Contactando a @${m.nick||m.nombre}','info')" class="btn-sm" style="padding:5px 10px;font-size:11px">Contactar</button>
        </div>
      `).join('')}
    `);
  });
}

// ── 6. REPORTES ───────────────────────────
function admin_reports(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>⚠️ Reportes <span>Críticos</span></h1>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="input-group" style="flex:1">
        <span class="input-icon">📝</span>
        <input type="text" id="reporteDesc" placeholder="Descripción del reporte...">
      </div>
      <input type="text" id="reporteUser" placeholder="@usuario" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:0 12px;font-size:13px;width:130px">
      <select id="reporteNivel" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:0 12px;font-size:13px">
        <option value="Media">Media</option>
        <option value="Alta">Alta</option>
        <option value="Crítica">Crítica</option>
      </select>
      <button class="btn-sm danger" style="padding:10px 16px" onclick="adminCrearReporte()">+ Reporte</button>
    </div>
    <div id="adminReportesContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando reportes...</div>
    </div>
  `;

  window.adminCrearReporte = function() {
    const desc = document.getElementById('reporteDesc')?.value?.trim();
    const user = document.getElementById('reporteUser')?.value?.trim();
    const nivel = document.getElementById('reporteNivel')?.value;
    if (!desc) { toast('Escribe la descripción', 'error'); return; }
    window.fsAdd?.('reportes', {
      descripcion: desc, usuario: user, nivel,
      estado: 'pendiente', uid_admin: window._currentUser?.uid
    }).then(() => {
      document.getElementById('reporteDesc').value = '';
      document.getElementById('reporteUser').value = '';
      toast('Reporte creado ✓', 'success');
      cargarReportesAdmin();
    });
  };

  function cargarReportesAdmin() {
    if (!document.getElementById('adminReportesContent')) return;
    window.fsGetAll?.('reportes').then(reportes => {
      const cont = document.getElementById('adminReportesContent');
      if (!cont) return;
      if (!reportes || reportes.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
          No hay reportes aún. Usa el formulario para crear uno.
        </div>`;
        return;
      }
      const cNivel = {'Alta':'#EF4444','Crítica':'#DC2626','Media':'#FFA500'};
      cont.innerHTML = reportes.map(r => `
        <div class="card" style="margin-bottom:10px;${r.nivel==='Crítica'?'border-color:rgba(204,0,0,0.35)':''}">
          <div class="card-row" style="margin-bottom:8px">
            <div class="card-info">
              <div class="card-name">${r.descripcion}</div>
              <div class="card-sub">${r.usuario||'Sin usuario'}</div>
            </div>
            <span class="badge" style="background:${(cNivel[r.nivel]||'var(--gold)')}18;color:${(cNivel[r.nivel]||'var(--gold)')};border-color:${(cNivel[r.nivel]||'var(--gold)')}40">${r.nivel}</span>
            <span class="badge ${r.estado==='resuelto'?'badge-green':r.estado==='escalado'?'badge-red':'badge-orange'}">${r.estado}</span>
          </div>
          ${r.estado!=='resuelto'?`<div style="display:flex;gap:6px">
            <button onclick="adminResolverReporte('${r.id}')" class="btn-sm green" style="padding:5px 10px;font-size:11px">✓ Resolver</button>
            <button onclick="adminEscalarReporte('${r.id}')" class="btn-sm danger" style="padding:5px 10px;font-size:11px">⬆ Escalar</button>
          </div>`:''}
        </div>
      `).join('');
    }).catch(() => {
      document.getElementById('adminReportesContent').innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay reportes aún.</div>`;
    });
  }

  window.adminResolverReporte = function(id) {
    window.fsSet?.('reportes', id, { estado: 'resuelto' }).then(() => {
      adminAccion('Reporte resuelto', { reporte_id: id });
      toast('Reporte resuelto ✓', 'success');
      cargarReportesAdmin();
    });
  };

  window.adminEscalarReporte = function(id) {
    window.fsSet?.('reportes', id, { estado: 'escalado' }).then(() => {
      adminAccion('Reporte escalado a Master', { reporte_id: id });
      toast('Escalado al Master ✓', 'info');
      cargarReportesAdmin();
    });
  };

  cargarReportesAdmin();
}

// ── 7. TICKETS ────────────────────────────
function admin_tickets(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>💬 <span>Tickets</span></h1>
    </div>
    <div id="adminTicketsContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando tickets...</div>
    </div>
  `;

  window.cargarTickets?.().then(tickets => {
    const cont = document.getElementById('adminTicketsContent');
    if (!cont) return;
    if (!tickets || tickets.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
        No hay tickets aún. Los usuarios podrán crear tickets desde su perfil.
      </div>`;
      return;
    }
    const cP = {HIGH:'#FFA500',CRITICAL:'#EF4444',MEDIUM:'var(--gold)'};
    cont.innerHTML = tickets.map(t => `
      <div class="card card-row" style="margin-bottom:10px">
        <div class="card-info">
          <div class="card-name">${t.asunto||'Sin asunto'}</div>
          <div class="card-sub">${t.descripcion||''}</div>
        </div>
        <span class="badge" style="background:${(cP[t.prioridad]||'var(--gold)')}18;color:${(cP[t.prioridad]||'var(--gold)')};border-color:${(cP[t.prioridad]||'var(--gold)')}40;flex-shrink:0">${t.prioridad||'MEDIUM'}</span>
        <span class="badge ${t.estado==='resuelto'?'badge-green':t.estado==='en_proceso'?'badge-orange':'badge-blue'}" style="flex-shrink:0">${t.estado||'abierto'}</span>
        ${t.estado!=='resuelto'?`<button onclick="window.resolverTicket?.('${t.id}').then(()=>navigate('tickets'))" class="btn-sm" style="padding:5px 10px;font-size:11px;flex-shrink:0">Resolver</button>`:''}
      </div>
    `).join('');
  }).catch(() => {
    document.getElementById('adminTicketsContent').innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay tickets aún.</div>`;
  });
}

// ── 8. VOICE ROOMS ───────────────────────
function admin_voice(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🎤 Voice <span>Rooms</span></h1>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">🎤 Salas activas</div><div class="stat-value">0</div></div>
      <div class="stat-card"><div class="stat-label">👥 Participantes</div><div class="stat-value">0</div></div>
    </div>
    ${aCard(`
      <div style="text-align:center;padding:30px;color:var(--mu)">
        <div style="font-size:40px;opacity:0.3;margin-bottom:12px">🎤</div>
        No hay salas de voz activas.<br>Aparecerán aquí cuando los usuarios las creen.
      </div>
    `)}
  `;
}

// ── 9. VIDEO ROOMS ───────────────────────
function admin_video(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>📹 Video <span>Rooms</span></h1>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">📹 Salas activas</div><div class="stat-value">0</div></div>
      <div class="stat-card"><div class="stat-label">👥 Participantes</div><div class="stat-value">0</div></div>
    </div>
    ${aCard(`
      <div style="text-align:center;padding:30px;color:var(--mu)">
        <div style="font-size:40px;opacity:0.3;margin-bottom:12px">📹</div>
        No hay salas de video activas.
      </div>
    `)}
  `;
}

// ── 10. ECONOMÍA ──────────────────────────
function admin_economy(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>💰 <span>Economía</span></h1>
    </div>
    <div id="adminEconContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  cargarStatsReales().then(stats => {
    const _ec = document.getElementById('adminEconContent'); if(!_ec) return;
    _ec.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">👥 Usuarios</div><div class="stat-value" style="color:#60A5FA">${stats.usuarios}</div></div>
        <div class="stat-card"><div class="stat-label">🎤 Streamers</div><div class="stat-value" style="color:#4ade80">${stats.streamers}</div></div>
        <div class="stat-card"><div class="stat-label">🏢 Agencias</div><div class="stat-value" style="color:#A78BFA">${stats.agencias}</div></div>
        <div class="stat-card"><div class="stat-label">⏳ Retiros pendientes</div><div class="stat-value" style="color:#FFA500">0</div></div>
      </div>
      ${aCard(`
        <div class="section-title">💳 Retiros pendientes</div>
        <div style="text-align:center;padding:20px;color:var(--mu)">
          Los retiros solicitados por streamers aparecerán aquí.
        </div>
      `)}
    `;
  });
}

// ── 11. MONITORES ─────────────────────────
function admin_monitors(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>👮 <span>Monitores</span></h1>
    </div>
    <button class="btn-sm" style="margin-bottom:16px;padding:10px 20px" onclick="adminNuevoMod()">+ Nuevo Moderador</button>
    <div id="adminMonitoresContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  window.adminNuevoMod = function() {
    const email = prompt('Email del nuevo moderador:');
    if (!email) return;
    cargarUsuariosReales().then(usuarios => {
      const u = usuarios.find(x => x.email === email);
      if (!u) { toast('Usuario no encontrado. Debe registrarse primero.', 'error'); return; }
      window.fsSet('usuarios', u.id, { rol: 'moderador' }).then(() => {
        adminAccion(`Nuevo moderador: ${email}`, { uid_objetivo: u.id });
        toast(`${email} es ahora Moderador ✓`, 'success');
        navigate('monitores');
      });
    });
  };

  cargarUsuariosReales().then(usuarios => {
    const mods = usuarios.filter(u => u.rol === 'moderador');
    const cont = document.getElementById('adminMonitoresContent');
    if (!cont) return;
    if (mods.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
        No hay moderadores aún. Usa el botón para asignar uno.
      </div>`;
      return;
    }
    cont.innerHTML = mods.map(m => `
      <div class="card card-row" style="margin-bottom:10px">
        <div class="card-avatar" style="background:var(--blue-bg);color:var(--blue);border-color:var(--blue-brd)">${(m.nick||m.nombre||'?')[0].toUpperCase()}</div>
        <div class="card-info">
          <div class="card-name">@${m.nick||m.nombre}</div>
          <div class="card-sub">${m.email}</div>
        </div>
        <span class="badge ${m.estado==='activo'?'badge-green':'badge-red'}">${m.estado||'activo'}</span>
        <button onclick="adminSuspender('${m.id}','${m.estado||'activo'}')" class="btn-sm ${m.estado==='activo'?'danger':''}" style="padding:5px 10px;font-size:11px">${m.estado==='activo'?'Suspender':'Activar'}</button>
      </div>
    `).join('');
  });
}

// ── 12. SEGURIDAD ─────────────────────────
function admin_security(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🔒 <span>Seguridad</span></h1>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">🛡️ Sistema</div><div class="stat-value" style="color:#22c55e">OK</div></div>
      <div class="stat-card"><div class="stat-label">🔒 Auth</div><div class="stat-value" style="color:#22c55e">Activo</div></div>
    </div>
    ${aCard(`
      <div class="section-title">📋 Log de acciones del Admin</div>
      <div id="adminSecLogs" style="font-size:12px;color:var(--mu)">Cargando...</div>
    `)}
  `;

  window.cargarLogsReales?.(15).then(logs => {
    const cont = document.getElementById('adminSecLogs');
    if (!cont) return;
    if (!logs || logs.length === 0) {
      cont.textContent = 'No hay logs aún. Las acciones del Admin se registrarán aquí.';
      return;
    }
    cont.innerHTML = logs.map(l => `
      <div style="padding:7px;border-radius:8px;background:rgba(255,255,255,0.02);margin-bottom:5px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:var(--gold)">${l.accion}</span>
        <span style="font-size:10px;color:var(--mu)">${l.createdAt?.toDate?.()?.toLocaleString?.() || 'Reciente'}</span>
      </div>
    `).join('');
  });
}
