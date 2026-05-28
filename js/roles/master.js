// js/roles/master.js — Master conectado a Firestore real

window.render_master = function(page, el, perfil) {
  const pages = {
    home:'global', stats:'global', global:'global',
    economy:'economy', finanzas:'economy',
    lives:'lives', streamers:'streamers',
    agencias:'agencies', agencies:'agencies',
    admins:'admins', moderadores:'admins',
    security:'security', seguridad:'security',
    analytics:'analytics',
    alerts:'alerts', reportes:'alerts',
    control:'control', config:'control',
    tickets:'tickets', soporte:'tickets',
    realtime:'realtime', actividad:'realtime',
    usuarios:'streamers',
  };
  const target = pages[page] || 'global';
  switch(target) {
    case 'global':    return master_global(el, perfil);
    case 'economy':   return master_economy(el, perfil);
    case 'lives':     return master_lives(el, perfil);
    case 'streamers': return master_streamers(el, perfil);
    case 'agencies':  return master_agencies(el, perfil);
    case 'admins':    return master_admins(el, perfil);
    case 'security':  return master_security(el, perfil);
    case 'analytics': return master_analytics(el, perfil);
    case 'alerts':    return master_alerts(el, perfil);
    case 'control':   return master_control(el, perfil);
    case 'tickets':   return master_tickets(el, perfil);
    case 'realtime':  return master_realtime(el, perfil);
    default:          return master_global(el, perfil);
  }
};

function mBar(pct, color) {
  return `<div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.05);overflow:hidden;margin-top:6px">
    <div style="width:${Math.min(pct,100)}%;height:100%;background:${color||'var(--grad-main)'};border-radius:3px"></div>
  </div>`;
}
function mCard(content) {
  return `<div class="card" style="margin-bottom:16px">${content}</div>`;
}
function mTable(headers, rows) {
  return `<div style="overflow-x:auto"><table class="data-table" style="width:100%">
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}
function rolColor(rol) {
  return {master:'var(--gold)',admin:'rgba(255,255,255,0.7)',moderador:'#a8d8f0',agencia:'#A78BFA',streamer:'#4ade80',usuario:'#93c5fd'}[rol]||'#fff';
}

// ── 1. PLATAFORMA GLOBAL ─────────────────
function master_global(el, p) {
  el.innerHTML = `<div class="dash-welcome aura-fade-up">
    <h1>🌍 Plataforma <span>Global</span></h1>
    <p>Cargando estadísticas reales...</p>
  </div>
  <div id="masterGlobalStats" class="stats-grid"></div>
  <div id="masterGlobalContent"></div>`;

  // Cargar stats reales de Firestore
  cargarStatsReales().then(stats => {
    document.getElementById('masterGlobalStats').innerHTML = `
      ${mStatCard('👥 Usuarios totales', stats.usuarios, '#60A5FA')}
      ${mStatCard('🎤 Streamers', stats.streamers, '#4ade80')}
      ${mStatCard('⏳ Pendientes', stats.pendientes, '#FFA500')}
      ${mStatCard('🚫 Suspendidos', stats.suspendidos, '#EF4444')}
    `;
    document.getElementById('masterGlobalContent').innerHTML = `
      ${mCard(`
        <div class="section-title">⚡ Estado del Sistema</div>
        ${[['Firebase Auth','Operativo','#22c55e'],['Firestore','Operativo','#22c55e'],['Agora RTC','Operativo','#22c55e'],['Netlify CDN','Operativo','#22c55e'],['Storage','Operativo','#22c55e']].map(([k,v,c])=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px">
            <span style="color:var(--mu)">${k}</span>
            <span style="display:flex;align-items:center;gap:6px;font-weight:600;color:${c}">
              <span style="width:8px;height:8px;border-radius:50%;background:${c};display:inline-block"></span>${v}
            </span>
          </div>
        `).join('')}
      `)}
    `;
  });
}

function mStatCard(label, value, color) {
  return `<div class="stat-card">
    <div class="stat-label">${label}</div>
    <div class="stat-value" style="color:${color||'var(--gold)'}">${value}</div>
  </div>`;
}

// ── 2. ECONOMÍA ───────────────────────────
function master_economy(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>💰 Economía <span>Total</span></h1>
      <p>Flujo financiero · ingresos, payouts y reservas</p>
    </div>
    <div style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#0d0d0d,#1a0800);border:1px solid rgba(212,175,55,0.3);margin-bottom:20px">
      <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--mu);margin-bottom:8px">Ingresos plataforma</div>
      <div id="masterEconBalance" style="font-family:'Cinzel',serif;font-size:40px;font-weight:900;color:var(--gold)">Cargando...</div>
    </div>
    <div id="masterEconContent"></div>
  `;

  cargarStatsReales().then(stats => {
    document.getElementById('masterEconBalance').textContent = `${stats.usuarios} usuarios registrados`;
    document.getElementById('masterEconContent').innerHTML = `
      <div class="stats-grid">
        ${mStatCard('👥 Usuarios', stats.usuarios, '#60A5FA')}
        ${mStatCard('🎤 Streamers', stats.streamers, '#4ade80')}
        ${mStatCard('🏢 Agencias', stats.agencias, '#A78BFA')}
        ${mStatCard('⏳ Pendientes aprobación', stats.pendientes, '#FFA500')}
      </div>
      ${mCard(`
        <div class="section-title">📋 Retiros pendientes</div>
        <div style="text-align:center;padding:20px;color:var(--mu);font-size:13px">
          Los retiros aparecerán aquí cuando los streamers los soliciten
        </div>
      `)}
    `;
  });
}

// ── 3. LIVES & SALAS ─────────────────────
function master_lives(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🔴 Lives & <span>Salas</span></h1>
      <p>Lives activos en tiempo real</p>
    </div>
    <div id="masterLivesContent">
      <div class="stats-grid">
        ${mStatCard('🔴 Lives activos', 0, '#EF4444')}
        ${mStatCard('👁 Viewers', 0, '#22c55e')}
        ${mStatCard('🎤 Salas voz', 0, '#A78BFA')}
        ${mStatCard('📹 Salas video', 0, '#60A5FA')}
      </div>
      ${mCard(`
        <div class="section-title">📺 Lives activos</div>
        <div style="text-align:center;padding:30px;color:var(--mu);font-size:13px">
          <div style="font-size:40px;opacity:0.3;margin-bottom:12px">📺</div>
          No hay lives activos en este momento.<br>
          Cuando una streamer inicie un live aparecerá aquí.
        </div>
      `)}
    </div>
  `;
}

// ── 4. STREAMERS ─────────────────────────
function master_streamers(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>👩 <span>Usuarios & Streamers</span></h1>
      <p>Cargando usuarios reales...</p>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="input-group" style="flex:1;min-width:200px">
        <span class="input-icon">🔍</span>
        <input type="text" id="masterBuscarUser" placeholder="Buscar por nick o email..." oninput="masterFiltrarUsers(this.value)">
      </div>
      <button class="btn-sm" onclick="masterCrearAdmin()">+ Nuevo Admin</button>
    </div>
    <div id="masterUsersTable">
      <div style="text-align:center;padding:30px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  cargarUsuariosReales().then(usuarios => {
    window._masterUsuarios = usuarios;
    renderMasterUsers(usuarios);
  });
}

function renderMasterUsers(usuarios) {
  const cont = document.getElementById('masterUsersTable');
  if (!cont) return;
  if (usuarios.length === 0) {
    cont.innerHTML = `<div style="text-align:center;padding:30px;color:var(--mu)">
      No hay usuarios registrados aún.<br>Cuando alguien se registre aparecerá aquí.
    </div>`;
    return;
  }
  cont.innerHTML = mCard(mTable(
    ['Nick','Email','Rol','País','Estado','Acciones'],
    usuarios.map(u => [
      `<span style="font-weight:600;color:${rolColor(u.rol)}">@${u.nick||u.nombre||'?'}</span>`,
      `<span style="color:var(--mu);font-size:12px">${u.email||'—'}</span>`,
      `<span class="badge" style="background:${rolColor(u.rol)}18;color:${rolColor(u.rol)};border-color:${rolColor(u.rol)}40">${u.rol}</span>`,
      u.pais||'—',
      `<span class="badge ${u.estado==='activo'?'badge-green':u.estado==='pendiente'?'badge-orange':'badge-red'}">${u.estado||'activo'}</span>`,
      `<div style="display:flex;gap:4px;flex-wrap:wrap">
        ${u.estado==='pendiente'?`<button onclick="masterAprobarStreamer('${u.id}')" class="btn-sm green" style="padding:4px 8px;font-size:10px">✓ Aprobar</button>`:''}
        <button onclick="masterGestionarUsuario('${u.id}','${u.estado==='activo'?'suspender':'activar'}')" class="btn-sm ${u.estado==='activo'?'danger':''}" style="padding:4px 8px;font-size:10px">${u.estado==='activo'?'Suspender':'Activar'}</button>
        <button onclick="masterCambiarRol('${u.id}',prompt('Nuevo rol (usuario/streamer/admin/agencia/moderador):','${u.rol}'))" class="btn-sm neutral" style="padding:4px 8px;font-size:10px">Rol</button>
      </div>`
    ])
  ));
}

window.masterFiltrarUsers = function(q) {
  if (!window._masterUsuarios) return;
  const filtered = q ? window._masterUsuarios.filter(u =>
    (u.nick||'').toLowerCase().includes(q.toLowerCase()) ||
    (u.email||'').toLowerCase().includes(q.toLowerCase()) ||
    (u.nombre||'').toLowerCase().includes(q.toLowerCase())
  ) : window._masterUsuarios;
  renderMasterUsers(filtered);
};

// ── 5. AGENCIAS ───────────────────────────
function master_agencies(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🏢 <span>Agencias</span></h1>
      <p>Agencias registradas en AURA</p>
    </div>
    <div id="masterAgenciasContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  cargarUsuariosReales().then(usuarios => {
    const agencias = usuarios.filter(u => u.rol === 'agencia');
    const cont = document.getElementById('masterAgenciasContent');
    if (!cont) return;
    if (agencias.length === 0) {
      cont.innerHTML = `
        <button class="btn-sm" style="margin-bottom:16px;padding:10px 20px" onclick="toast('Para crear una agencia el usuario debe registrarse y luego asignarle el rol agencia','info')">+ Nueva Agencia</button>
        <div class="card" style="text-align:center;padding:30px;color:var(--mu)">
          <div style="font-size:40px;opacity:0.3;margin-bottom:12px">🏢</div>
          No hay agencias registradas.<br>Asigna el rol "agencia" a un usuario para crear una.
        </div>`;
      return;
    }
    cont.innerHTML = `
      <button class="btn-sm" style="margin-bottom:16px;padding:10px 20px" onclick="toast('Asigna el rol agencia desde la sección Usuarios','info')">+ Nueva Agencia</button>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
        ${agencias.map(a=>`
          <div class="card">
            <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:14px">
              <div>
                <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:var(--gold)">@${a.nick||a.nombre}</div>
                <div style="font-size:11px;color:var(--mu);margin-top:4px">${a.email}</div>
              </div>
              <span class="badge ${a.estado==='activo'?'badge-green':'badge-red'}">${a.estado||'activo'}</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px">
              <button onclick="toast('Perfil de @${a.nick}: ${a.email}','info')" class="btn-sm" style="flex:1">Ver detalles</button>
              <button onclick="masterGestionarUsuario('${a.id}','${a.estado==='activo'?'suspender':'activar'}')" class="btn-sm ${a.estado==='activo'?'danger':''}" style="flex:1">${a.estado==='activo'?'Suspender':'Activar'}</button>
            </div>
          </div>
        `).join('')}
      </div>`;
  });
}

// ── 6. ADMINS ────────────────────────────
function master_admins(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>👮 <span>Admins & Moderadores</span></h1>
      <p>Equipo administrativo de AURA</p>
    </div>
    <button class="btn-sm" style="margin-bottom:16px;padding:10px 20px" onclick="masterCrearAdmin()">+ Nuevo Admin</button>
    <div id="masterAdminsContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  cargarUsuariosReales().then(usuarios => {
    const admins = usuarios.filter(u => ['admin','moderador','master'].includes(u.rol));
    const cont = document.getElementById('masterAdminsContent');
    if (!cont) return;
    if (admins.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
        No hay admins aún. Usa el botón "+ Nuevo Admin" para promover un usuario.
      </div>`;
      return;
    }
    cont.innerHTML = mCard(mTable(
      ['Usuario','Email','Rol','Estado','Acciones'],
      admins.map(a => [
        `<span style="font-weight:600">@${a.nick||a.nombre}</span>`,
        `<span style="color:var(--mu);font-size:12px">${a.email}</span>`,
        `<span class="badge" style="background:${rolColor(a.rol)}18;color:${rolColor(a.rol)};border-color:${rolColor(a.rol)}40">${a.rol}</span>`,
        `<span class="badge ${a.estado==='activo'?'badge-green':'badge-red'}">${a.estado||'activo'}</span>`,
        `<div style="display:flex;gap:4px">
          <button onclick="masterGestionarUsuario('${a.id}','${a.estado==='activo'?'suspender':'activar'}')" class="btn-sm ${a.estado==='activo'?'danger':''}" style="padding:4px 8px;font-size:10px">${a.estado==='activo'?'Suspender':'Activar'}</button>
          ${a.rol!=='master'?`<button onclick="masterCambiarRol('${a.id}','usuario')" class="btn-sm neutral" style="padding:4px 8px;font-size:10px">Degradar</button>`:''}
        </div>`
      ])
    ));
  });
}

// ── 7. SEGURIDAD ─────────────────────────
function master_security(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🛡️ Seguridad <span>Global</span></h1>
    </div>
    <div class="stats-grid">
      ${mStatCard('🛡️ Sistema','Operativo','#22c55e')}
      ${mStatCard('🔒 Firebase Auth','Activo','#22c55e')}
      ${mStatCard('🌐 HTTPS','Activo','#22c55e')}
      ${mStatCard('📋 Logs','Activos','#22c55e')}
    </div>
    ${mCard(`
      <div class="section-title">🔒 Bloquear IP</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="input-group" style="flex:1;min-width:150px">
          <span class="input-icon">🌐</span>
          <input type="text" id="ipInput" placeholder="Ej: 192.168.1.1">
        </div>
        <div class="input-group" style="flex:1;min-width:150px">
          <span class="input-icon">📝</span>
          <input type="text" id="ipMotivo" placeholder="Motivo del bloqueo">
        </div>
        <button class="btn-sm danger" style="padding:10px 16px" onclick="masterBloquearIP()">🚫 Bloquear</button>
      </div>
    `)}
    ${mCard(`
      <div class="section-title">📋 Logs recientes del sistema</div>
      <div id="securityLogs" style="font-size:12px;color:var(--mu)">Cargando logs...</div>
    `)}
  `;

  window.masterBloquearIP = function() {
    const ip = document.getElementById('ipInput')?.value?.trim();
    const motivo = document.getElementById('ipMotivo')?.value?.trim();
    if (!ip) { toast('Ingresa una IP', 'error'); return; }
    if (!motivo) { toast('Ingresa el motivo', 'error'); return; }
    bloquearIP(ip, motivo).then(() => {
      document.getElementById('ipInput').value = '';
      document.getElementById('ipMotivo').value = '';
    });
  };

  cargarLogsReales(10).then(logs => {
    const cont = document.getElementById('securityLogs');
    if (!cont) return;
    if (logs.length === 0) {
      cont.textContent = 'No hay logs aún. Las acciones del Master se registrarán aquí.';
      return;
    }
    cont.innerHTML = logs.map(l => `
      <div style="padding:8px;border-radius:8px;background:rgba(255,255,255,0.02);margin-bottom:6px">
        <span style="color:var(--gold)">${l.accion}</span>
        <span style="color:var(--mu);margin-left:8px;font-size:10px">${l.createdAt?.toDate?.()?.toLocaleString?.() || 'Reciente'}</span>
      </div>
    `).join('');
  });
}

// ── 8. ANALYTICS ─────────────────────────
function master_analytics(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>📊 <span>Analytics</span></h1>
      <p>Métricas reales de la plataforma</p>
    </div>
    <div id="analyticsContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  cargarUsuariosReales().then(usuarios => {
    const cont = document.getElementById('analyticsContent');
    if (!cont) return;
    const paises = {};
    usuarios.forEach(u => { if(u.pais) paises[u.pais] = (paises[u.pais]||0)+1; });
    const topPaises = Object.entries(paises).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const roles = { usuario:0, streamer:0, agencia:0, admin:0, moderador:0 };
    usuarios.forEach(u => { if(roles[u.rol]!==undefined) roles[u.rol]++; });

    cont.innerHTML = `
      <div class="stats-grid">
        ${mStatCard('👥 Total usuarios', usuarios.length, '#60A5FA')}
        ${mStatCard('🎤 Streamers', roles.streamer, '#4ade80')}
        ${mStatCard('👤 Usuarios', roles.usuario, '#93c5fd')}
        ${mStatCard('🏢 Agencias', roles.agencia, '#A78BFA')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px">
        ${mCard(`
          <div class="section-title">🌍 Usuarios por país</div>
          ${topPaises.length === 0
            ? '<div style="color:var(--mu);font-size:13px;padding:10px">Sin datos aún</div>'
            : topPaises.map(([pais,cnt]) => `
              <div style="margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                  <span>${pais}</span><span style="color:var(--gold)">${cnt} usuarios</span>
                </div>
                ${mBar((cnt/usuarios.length*100).toFixed(0))}
              </div>
            `).join('')
          }
        `)}
        ${mCard(`
          <div class="section-title">👥 Distribución de roles</div>
          ${Object.entries(roles).map(([rol,cnt]) => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px">
              <span style="color:${rolColor(rol)}">${rol}</span>
              <span style="font-weight:700">${cnt}</span>
            </div>
          `).join('')}
        `)}
      </div>
    `;
  });
}

// ── 9. ALERTAS ───────────────────────────
function master_alerts(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>⚠️ Alertas <span>Sistema</span></h1>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="input-group" style="flex:1;min-width:200px">
        <span class="input-icon">📝</span>
        <input type="text" id="alertaMensaje" placeholder="Mensaje de alerta...">
      </div>
      <select id="alertaNivel" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:0 12px;font-size:13px">
        <option value="INFO">INFO</option>
        <option value="WARNING">WARNING</option>
        <option value="CRITICAL">CRITICAL</option>
      </select>
      <button class="btn-sm danger" style="padding:10px 16px" onclick="masterCrearAlerta()">+ Crear Alerta</button>
    </div>
    <div id="alertasContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando alertas...</div>
    </div>
  `;

  window.masterCrearAlerta = function() {
    const msg = document.getElementById('alertaMensaje')?.value?.trim();
    const nivel = document.getElementById('alertaNivel')?.value;
    if (!msg) { toast('Escribe el mensaje', 'error'); return; }
    crearAlerta('manual', msg, nivel).then(() => {
      document.getElementById('alertaMensaje').value = '';
      cargarAlertas();
      toast('Alerta creada ✓', 'success');
    });
  };

  function cargarAlertas() {
    cargarLogsReales(20).then(logs => {
      const cont = document.getElementById('alertasContent');
      if (!cont) return;
      if (logs.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
          No hay alertas aún. Las acciones del sistema aparecerán aquí.
        </div>`;
        return;
      }
      cont.innerHTML = logs.map(l => {
        const c = l.tipo==='control'?'#EF4444':l.tipo==='admin'?'#FFA500':'var(--gold)';
        return `<div style="display:flex;align-items:center;gap:14px;padding:14px;border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid var(--border2);margin-bottom:8px">
          <span style="background:${c}1A;color:${c};border:1px solid ${c}40;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;flex-shrink:0">${l.tipo?.toUpperCase()||'LOG'}</span>
          <span style="flex:1;font-size:13px">${l.accion}</span>
          <span style="font-size:11px;color:var(--mu);flex-shrink:0">${l.createdAt?.toDate?.()?.toLocaleString?.() || 'Reciente'}</span>
        </div>`;
      }).join('');
    });
  }
  cargarAlertas();
}

// ── 10. CONTROL PLATAFORMA ───────────────
function master_control(el, p) {
  const switches = [
    {key:'mantenimiento',label:'Modo mantenimiento',desc:'Cierra el acceso a toda la plataforma'},
    {key:'registros',label:'Permitir registros',desc:'Bloquea altas de nuevos usuarios'},
    {key:'lives',label:'Permitir lives',desc:'Detiene todas las transmisiones'},
    {key:'payouts',label:'Procesar payouts',desc:'Pausa los retiros de dinero'},
    {key:'stars',label:'Recargas de estrellas',desc:'Bloquea compras de estrellas'},
    {key:'chat',label:'Chat global',desc:'Silencia el chat de toda la app'},
  ];

  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🔒 Control <span>Plataforma</span></h1>
      <p>Switches operativos · Acción inmediata y guardada en Firebase</p>
    </div>
    ${mCard(switches.map((s,i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:14px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border2);margin-bottom:10px">
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600">${s.label}</div>
          <div style="font-size:11px;color:var(--mu);margin-top:2px">${s.desc}</div>
        </div>
        <button onclick="masterControlSwitch('${s.key}',this)" id="sw_${s.key}"
          style="padding:8px 16px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid var(--border2);background:rgba(255,255,255,0.05);color:var(--mu);transition:all .2s">
          OFF
        </button>
      </div>
    `).join(''))}
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:8px">
      <button onclick="masterControl('workers')" class="btn-sm" style="padding:12px">🔄 Reiniciar workers</button>
      <button onclick="masterControl('cache')" class="btn-sm" style="padding:12px">🧹 Purgar caché</button>
      <button onclick="masterControl('deploy')" class="btn-sm" style="padding:12px">📤 Forzar deploy</button>
      <button onclick="if(confirm('⚠️ ¿Activar Kill Switch? Cerrará toda la plataforma.'))masterControl('killswitch')"
        style="padding:12px;border-radius:var(--r-lg);background:var(--grad-main);border:none;color:#fff;font-weight:700;font-size:12px;cursor:pointer">
        🚨 Kill switch global
      </button>
    </div>
  `;

  window.masterControlSwitch = function(key, btn) {
    const isOn = btn.textContent === 'ON';
    btn.textContent = isOn ? 'OFF' : 'ON';
    btn.style.background = isOn ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,var(--gold3),var(--gold))';
    btn.style.color = isOn ? 'var(--mu)' : 'var(--black)';
    btn.style.borderColor = isOn ? 'var(--border2)' : 'var(--gold-brd)';
    masterControl(key);
  };
}

// ── 11. TICKETS ───────────────────────────
function master_tickets(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>💬 Tickets <span>Críticos</span></h1>
    </div>
    <button class="btn-sm" style="margin-bottom:16px;padding:10px 20px" onclick="masterNuevoTicket()">+ Nuevo Ticket</button>
    <div id="ticketsContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando tickets...</div>
    </div>
  `;

  window.masterNuevoTicket = function() {
    const asunto = prompt('Asunto del ticket:');
    if (!asunto) return;
    const desc = prompt('Descripción:');
    if (!desc) return;
    crearTicket({ asunto, descripcion: desc, prioridad: 'HIGH', tipo: 'manual' }).then(() => cargarTicketsList());
  };

  function cargarTicketsList() {
    cargarTickets().then(tickets => {
      const cont = document.getElementById('ticketsContent');
      if (!cont) return;
      if (tickets.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
          No hay tickets aún. Los tickets de soporte aparecerán aquí.
        </div>`;
        return;
      }
      const c = {HIGH:'#FFA500',CRITICAL:'#EF4444',MEDIUM:'var(--gold)'};
      cont.innerHTML = tickets.map(t => `
        <div style="display:flex;align-items:center;gap:14px;padding:14px;border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid var(--border2);margin-bottom:10px">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600">${t.asunto||'Sin asunto'}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:2px">${t.descripcion||''} · ${t.createdAt?.toDate?.()?.toLocaleString?.() || 'Reciente'}</div>
          </div>
          <span style="background:${(c[t.prioridad]||'var(--gold)')}1A;color:${(c[t.prioridad]||'var(--gold)')};border:1px solid ${(c[t.prioridad]||'var(--gold)')}40;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;flex-shrink:0">${t.prioridad||'MEDIUM'}</span>
          <span class="badge ${t.estado==='resuelto'?'badge-green':t.estado==='en_proceso'?'badge-orange':'badge-blue'}" style="flex-shrink:0">${t.estado||'abierto'}</span>
          ${t.estado!=='resuelto'?`<button onclick="resolverTicket('${t.id}').then(()=>navigate('tickets'))" class="btn-sm" style="padding:5px 10px;font-size:10px;flex-shrink:0">Resolver</button>`:''}
        </div>
      `).join('');
    });
  }
  cargarTicketsList();
}

// ── 12. ACTIVIDAD REALTIME ───────────────
function master_realtime(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>📡 Actividad <span>Realtime</span></h1>
      <p>Log real de acciones del sistema</p>
    </div>
    <div class="stats-grid">
      ${mStatCard('📡 Firebase','Conectado','#22c55e')}
      ${mStatCard('🔄 Logs','Tiempo real','var(--gold)')}
      ${mStatCard('🛡️ Auth','Activo','#22c55e')}
    </div>
    <div class="card">
      <div class="section-title" style="margin-bottom:12px">📋 Log de actividad real</div>
      <div id="realtimeLogs" style="font-size:12px;line-height:1.8;height:400px;overflow-y:auto;color:rgba(255,255,255,0.6)">
        Cargando...
      </div>
      <button onclick="master_realtime_reload()" class="btn-sm" style="margin-top:12px;padding:8px 16px">🔄 Actualizar</button>
    </div>
  `;

  window.master_realtime_reload = function() {
    cargarLogsReales(50).then(logs => {
      const cont = document.getElementById('realtimeLogs');
      if (!cont) return;
      if (logs.length === 0) {
        cont.innerHTML = '<div style="text-align:center;padding:20px">No hay actividad registrada aún.<br>Las acciones del Master se guardarán aquí.</div>';
        return;
      }
      cont.innerHTML = logs.map(l => {
        const t = l.createdAt?.toDate?.()?.toLocaleString?.() || 'Reciente';
        return `<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03)">
          <span style="color:var(--gold)">[${t}]</span>
          <span style="color:rgba(255,255,255,0.8);margin-left:8px">${l.accion}</span>
          <span style="color:var(--mu);margin-left:8px">[${l.tipo||'sistema'}]</span>
        </div>`;
      }).join('');
    });
  };
  window.master_realtime_reload();
}
