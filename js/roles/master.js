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
    tarifas:'tarifas', precios:'tarifas',
    metas:'metas', objetivos:'metas',
    reportes:'reportes', contabilidad:'reportes', finanzas_rep:'reportes',
    sistema:'sistema', pruebas:'sistema', test:'sistema',
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
    case 'tarifas':   return master_tarifas(el, perfil);
    case 'metas':     return master_metas(el, perfil);
    case 'reportes':  return window.render_master_reportes(el, perfil);
    case 'sistema':   return window.aura_mostrarPruebas(el);
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
      <p>Flujo real de estrellas en la plataforma</p>
    </div>
    <div id="masterEconHero" style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#0d0d0d,#1a0800);border:1px solid rgba(212,175,55,0.3);margin-bottom:20px">
      <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--mu);margin-bottom:8px">Estrellas totales en circulación</div>
      <div id="masterEconBalance" style="font-family:'Cinzel',serif;font-size:40px;font-weight:900;color:var(--gold)">Cargando...</div>
    </div>
    <div id="masterEconContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando economía...</div></div>
  `;

  window.cargarEstadisticasEconomia?.().then(eco => {
    const bal = document.getElementById('masterEconBalance');
    const cont = document.getElementById('masterEconContent');
    if (bal) bal.textContent = (eco.totalEstrellas||0).toLocaleString() + ' ⭐';
    if (!cont) return;
    cont.innerHTML = `
      <div class="stats-grid">
        ${mStatCard('⭐ En streamers', eco.estrellasStreamers, 'var(--gold)')}
        ${mStatCard('💎 En usuarios', eco.estrellasUsuarios, '#60A5FA')}
        ${mStatCard('🔄 Transacciones', eco.transacciones, '#4ade80')}
        ${mStatCard('📊 Volumen total', eco.volumen, '#A78BFA')}
      </div>
      ${mCard(`
        <div class="section-title" style="margin-bottom:12px">🏆 Top Streamers por estrellas</div>
        ${eco.topStreamers.length === 0
          ? '<div style="text-align:center;padding:20px;color:var(--mu)">No hay streamers registradas aún.</div>'
          : eco.topStreamers.map((s,i)=>`
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
              <div style="font-family:'Cinzel',serif;font-weight:700;color:var(--gold);width:24px">#${i+1}</div>
              <div class="card-avatar" style="width:36px;height:36px;font-size:14px">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
              <div style="flex:1">
                <div style="font-weight:600">@${s.nick||s.nombre}</div>
                <div style="font-size:11px;color:var(--mu)">${s.pais||'—'}</div>
              </div>
              <div style="font-weight:700;color:var(--gold)">${(s.estrellas||0).toLocaleString()} ⭐</div>
            </div>
          `).join('')
        }
      `)}
      ${mCard(`
        <div class="section-title" style="margin-bottom:12px">💎 Top Usuarios por gifts enviados</div>
        ${eco.topUsuarios.length === 0
          ? '<div style="text-align:center;padding:20px;color:var(--mu)">No hay usuarios con actividad aún.</div>'
          : eco.topUsuarios.map((u,i)=>`
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
              <div style="font-family:'Cinzel',serif;font-weight:700;color:#60A5FA;width:24px">#${i+1}</div>
              <div class="card-avatar" style="width:36px;height:36px;font-size:14px">${(u.nick||u.nombre||'?')[0].toUpperCase()}</div>
              <div style="flex:1">
                <div style="font-weight:600">@${u.nick||u.nombre}</div>
              </div>
              <div style="font-weight:700;color:#60A5FA">${u.gifts_enviados||0} gifts</div>
            </div>
          `).join('')
        }
      `)}
      ${mCard(`
        <div class="section-title" style="margin-bottom:12px">💳 Retiros pendientes</div>
        <div id="masterRetirosList"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div></div>
      `)}
    `;
    // Cargar retiros
    window.fsGetAll?.('retiros').then(retiros => {
      const cont2 = document.getElementById('masterRetirosList');
      if (!cont2) return;
      const pendientes = retiros?.filter(r => r.estado === 'pendiente') || [];
      if (pendientes.length === 0) {
        cont2.innerHTML = '<div style="text-align:center;padding:16px;color:var(--mu);font-size:13px">No hay retiros pendientes.</div>';
        return;
      }
      cont2.innerHTML = pendientes.map(r=>`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div style="flex:1">
            <div style="font-weight:600">@${r.nick||'—'} · ${r.monto_usd?'$'+r.monto_usd+' USD':r.monto+'★'}</div>
            <div style="font-size:11px;color:var(--mu)">${r.metodo} · ${r.cuenta||'—'}</div>
          </div>
          <button onclick="masterPagarRetiro('${r.id}')" class="btn-sm green" style="padding:6px 12px;font-size:11px">✓ Pagar</button>
          <button onclick="masterRechazarRetiro('${r.id}')" class="btn-sm danger" style="padding:6px 12px;font-size:11px">✕</button>
        </div>
      `).join('');
    }).catch(()=>{});
  }).catch(()=>{
    const cont = document.getElementById('masterEconContent');
    if (cont) cont.innerHTML = '<div class="card" style="text-align:center;padding:20px;color:var(--mu)">Error cargando economía.</div>';
  });

  window.masterPagarRetiro = function(id) {
    window.fsSet?.('retiros', id, { estado: 'pagado' }).then(()=>{
      window.fsAdd?.('logs_master', { accion:'Retiro pagado', uid_master:p.uid, tipo:'retiro' });
      toast('Retiro marcado como pagado ✓','success');
      navigate('finanzas');
    });
  };
  window.masterRechazarRetiro = function(id) {
    window.fsSet?.('retiros', id, { estado: 'rechazado' }).then(()=>{
      toast('Retiro rechazado','info');
      navigate('finanzas');
    });
  };
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
  // Switches con estado real: true = activado/permitido, false = bloqueado
  const switches = [
    {key:'mantenimiento', label:'Modo mantenimiento', desc:'Enciende = plataforma cerrada para todos', invertido:true},
    {key:'registros',     label:'Permitir registros', desc:'Enciende = nuevos usuarios pueden registrarse', invertido:false},
    {key:'lives',         label:'Permitir lives',     desc:'Enciende = streamers pueden transmitir', invertido:false},
    {key:'payouts',       label:'Procesar payouts',   desc:'Enciende = retiros de dinero activos', invertido:false},
    {key:'stars',         label:'Recargas de estrellas', desc:'Enciende = usuarios pueden comprar estrellas', invertido:false},
    {key:'chat',          label:'Chat global',        desc:'Enciende = chat disponible en toda la app', invertido:false},
    {key:'match',         label:'Sistema Match',      desc:'Enciende = videollamadas de match activas', invertido:false},
    {key:'pk_battle',     label:'PK Battles',         desc:'Enciende = batallas en vivo activas', invertido:false},
  ];

  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🔒 Control <span>Plataforma</span></h1>
      <p>Estado real guardado en Firebase · Se aplica a todos los usuarios</p>
    </div>
    <div id="masterControlContent">
      <div style="text-align:center;padding:30px;color:var(--mu)">Cargando estado del sistema...</div>
    </div>
  `;

  // Cargar estado REAL desde Firestore
  window.fsGet?.('config_plataforma', 'global').then(cfg => {
    const estado = cfg || {};
    const cont = document.getElementById('masterControlContent');
    if (!cont) return;

    cont.innerHTML = `
      ${mCard(`
        <div class="section-title" style="margin-bottom:14px">⚡ Switches del sistema</div>
        ${switches.map(s => {
          // Si es invertido (mantenimiento), true = bloqueado, false = activo
          // Si es normal, true = activo, false = bloqueado
          const valorDB = estado[s.key];
          let activo;
          if (s.invertido) {
            activo = !valorDB; // mantenimiento true = bloqueado, así que switch OFF
          } else {
            // Para los normales: si no está en DB o es null/undefined = activo por defecto
            activo = valorDB === undefined || valorDB === null || valorDB === true || valorDB === false ? (valorDB !== false) : true;
          }

          return `
            <div style="display:flex;align-items:center;gap:12px;padding:14px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid ${activo?'rgba(34,197,94,0.2)':'rgba(204,0,0,0.2)'};margin-bottom:8px;transition:all .3s">
              <div style="width:10px;height:10px;border-radius:50%;background:${activo?'#22c55e':'#EF4444'};box-shadow:0 0 8px ${activo?'rgba(34,197,94,0.6)':'rgba(239,68,68,0.6)'};flex-shrink:0"></div>
              <div style="flex:1">
                <div style="font-size:14px;font-weight:600;color:#fff">${s.label}</div>
                <div style="font-size:11px;color:var(--mu);margin-top:2px">${s.desc}</div>
                <div style="font-size:10px;margin-top:3px;color:${activo?'#22c55e':'#EF4444'};font-weight:700">${activo?'✅ ACTIVO':'❌ BLOQUEADO'}</div>
              </div>
              <label style="position:relative;display:inline-block;width:52px;height:28px;cursor:pointer">
                <input type="checkbox" ${activo?'checked':''} onchange="masterControlToggle('${s.key}',this.checked,${s.invertido})"
                  style="opacity:0;width:0;height:0;position:absolute">
                <span style="position:absolute;inset:0;border-radius:999px;background:${activo?'linear-gradient(135deg,#22c55e,#16a34a)':'rgba(255,255,255,0.1)'};transition:all .3s;border:1px solid ${activo?'#22c55e':'rgba(255,255,255,0.15)'}">
                  <span style="position:absolute;width:22px;height:22px;border-radius:50%;background:#fff;top:2px;left:${activo?'26px':'2px'};transition:left .3s;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></span>
                </span>
              </label>
            </div>
          `;
        }).join('')}
      `)}

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:4px">
        <button onclick="masterControl('workers')" class="btn-sm" style="padding:12px;display:flex;align-items:center;justify-content:center;gap:6px">🔄 Reiniciar workers</button>
        <button onclick="masterControl('cache')" class="btn-sm" style="padding:12px;display:flex;align-items:center;justify-content:center;gap:6px">🧹 Purgar caché CDN</button>
        <button onclick="navigate('control')" class="btn-sm" style="padding:12px;display:flex;align-items:center;justify-content:center;gap:6px">🔄 Actualizar estado</button>
        <button onclick="if(confirm('⚠️ ¿KILL SWITCH? Cerrará TODA la plataforma ahora mismo.'))masterControl('killswitch')"
          style="padding:12px;border-radius:var(--r-lg);background:var(--grad-main);border:none;color:#fff;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
          🚨 Kill Switch Global
        </button>
      </div>
    `;

    // Toggle real con Firestore
    window.masterControlToggle = async function(key, checked, invertido) {
      // Si invertido (mantenimiento): checked=true (switch ON) significa activo=true = bloqueado
      // Si normal: checked=true = activo = true en DB
      const valorAGuardar = invertido ? checked : checked;

      try {
        await window.fsSet('config_plataforma', 'global', { [key]: valorAGuardar });
        await window.fsAdd('logs_master', {
          accion: `Switch ${key}: ${checked?'ACTIVADO':'DESACTIVADO'}`,
          uid_master: p.uid, tipo: 'control'
        });
        const label = switches.find(s=>s.key===key)?.label || key;
        toast(`${checked?'✅':'❌'} ${label} ${checked?'activado':'desactivado'}`, checked?'success':'info');
        // Recargar para mostrar estado actualizado
        setTimeout(()=>navigate('control'), 500);
      } catch(e) {
        toast('Error guardando: ' + e.message, 'error');
      }
    };
  }).catch(err => {
    const cont = document.getElementById('masterControlContent');
    if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:#EF4444">
      Error cargando estado: ${err.message}<br>
      <button onclick="navigate('control')" class="btn-sm" style="margin-top:10px;padding:10px 20px">Reintentar</button>
    </div>`;
  });
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

// ── TARIFAS + NIVELES + CARTERA ──────────
function master_tarifas(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>⚙️ <span>Configuración</span></h1>
      <p>Tarifas, niveles y cartera de AURA</p>
    </div>

    <!-- TABS -->
    <div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px">
      ${['💳 Tarifas','🏆 Niveles','👜 Cartera'].map((t,i)=>`
        <button onclick="masterTab(${i})" id="masterTab${i}" style="padding:8px 16px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid ${i===0?'rgba(212,175,55,0.5)':'rgba(255,255,255,0.1)'};background:${i===0?'rgba(212,175,55,0.1)':'transparent'};color:${i===0?'var(--gold)':'var(--mu)'}">${t}</button>
      `).join('')}
    </div>

    <div id="masterTabContent"></div>
  `;

  // Tab logic
  window.masterTab = function(idx) {
    document.querySelectorAll('[id^="masterTab"]').forEach((btn,i) => {
      btn.style.background = i===idx?'rgba(212,175,55,0.1)':'transparent';
      btn.style.borderColor = i===idx?'rgba(212,175,55,0.5)':'rgba(255,255,255,0.1)';
      btn.style.color = i===idx?'var(--gold)':'var(--mu)';
    });
    if (idx===0) renderTarifasTab();
    if (idx===1) renderNivelesTab();
    if (idx===2) renderCarteraTab();
  };

  // ── TAB 1: TARIFAS ──
  function renderTarifasTab() {
    window.fsGet?.('config_plataforma','tarifas').then(t => {
      const tf = t || {};
      const cont = document.getElementById('masterTabContent');
      if (!cont) return;
      cont.innerHTML = `
        <div class="card" style="margin-bottom:14px">
          <div class="section-title" style="margin-bottom:4px">💬 Servicios</div>
          <div style="font-size:11px;color:var(--mu);margin-bottom:14px">Costo en ⭐ para el usuario</div>
          ${[
            {key:'mensaje',      label:'💬 Mensaje privado',        default:2},
            {key:'audio',        label:'🎙️ Audio privado',          default:3},
            {key:'llamada',      label:'📞 Llamada (por min)',       default:6},
            {key:'match',        label:'⚡ Match (30 seg)',          default:5},
            {key:'videollamada', label:'📹 Videollamada (por min)',  default:10},
            {key:'foto',         label:'🖼️ Foto premium',           default:15},
            {key:'video_premium',label:'🎬 Video premium',          default:30},
          ].map(item=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
              <span style="font-size:13px">${item.label}</span>
              <div style="display:flex;align-items:center;gap:6px">
                <input type="number" id="tf_${item.key}" value="${tf[item.key]||item.default}" min="1"
                  style="width:60px;padding:5px 8px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:13px;text-align:center">
                <span style="color:var(--gold);font-weight:700">⭐</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="card" style="margin-bottom:14px">
          <div class="section-title" style="margin-bottom:14px">💰 Packs de estrellas</div>
          ${[
            {key:'pack_200',   label:'Pack 200⭐',   default:1},
            {key:'pack_1000',  label:'Pack 1,000⭐', default:5},
            {key:'pack_2000',  label:'Pack 2,000⭐', default:10},
            {key:'pack_4000',  label:'Pack 4,000⭐', default:20},
            {key:'pack_10000', label:'Pack 10,000⭐',default:50},
            {key:'pack_20000', label:'Pack 20,000⭐',default:100},
          ].map(item=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
              <span style="font-size:13px">${item.label}</span>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="color:var(--mu);font-size:12px">$</span>
                <input type="number" id="tf_${item.key}" value="${tf[item.key]||item.default}" min="0.1" step="0.5"
                  style="width:60px;padding:5px 8px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:13px;text-align:center">
                <span style="color:#22c55e;font-weight:700">USD</span>
              </div>
            </div>
          `).join('')}
        </div>
        <button onclick="masterGuardarTarifas()" class="btn-primary" style="width:100%;padding:16px">💾 Guardar tarifas</button>
      `;
    }).catch(()=>{});

    window.masterGuardarTarifas = function() {
      const get = id => parseFloat(document.getElementById(id)?.value) || 0;
      const nuevas = {
        mensaje:get('tf_mensaje'), audio:get('tf_audio'),
        llamada:get('tf_llamada'), match:get('tf_match'),
        videollamada:get('tf_videollamada'), foto:get('tf_foto'),
        video_premium:get('tf_video_premium'),
        pack_200:get('tf_pack_200'), pack_1000:get('tf_pack_1000'),
        pack_2000:get('tf_pack_2000'), pack_4000:get('tf_pack_4000'),
        pack_10000:get('tf_pack_10000'), pack_20000:get('tf_pack_20000'),
      };
      window._tarifasCache = null; // limpiar caché
      window.fsSet?.('config_plataforma','tarifas', nuevas).then(()=>{
        window.fsAdd?.('logs_master',{accion:'Tarifas actualizadas',uid_master:p.uid,tipo:'config'});
        toast('✅ Tarifas guardadas en toda la plataforma','success');
      }).catch(()=>toast('Error al guardar','error'));
    };
  }

  // ── TAB 2: NIVELES ──
  function renderNivelesTab() {
    const cont = document.getElementById('masterTabContent');
    if (!cont) return;
    const niveles = window.AURA_NIVELES || {};

    cont.innerHTML = `
      <div style="margin-bottom:16px">
        ${Object.values(niveles).map(n=>`
          <div class="card" style="margin-bottom:10px;border-color:rgba(212,175,55,0.2)">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <span style="font-size:28px">${n.emoji}</span>
              <div>
                <div style="font-family:'Cinzel',serif;font-size:16px;font-weight:700;color:var(--gold)">${n.nombre}</div>
                <div style="font-size:11px;color:var(--mu)">Nivel ${n.orden}</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
              <div style="text-align:center;padding:10px;background:rgba(34,197,94,0.08);border-radius:10px;border:1px solid rgba(34,197,94,0.2)">
                <div style="font-size:11px;color:var(--mu);margin-bottom:4px">Streamer</div>
                <div style="font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:#22c55e">${n.streamer}%</div>
              </div>
              <div style="text-align:center;padding:10px;background:rgba(167,139,250,0.08);border-radius:10px;border:1px solid rgba(167,139,250,0.2)">
                <div style="font-size:11px;color:var(--mu);margin-bottom:4px">Agencia</div>
                <div style="font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:#A78BFA">${n.agencia}%</div>
              </div>
              <div style="text-align:center;padding:10px;background:rgba(212,175,55,0.08);border-radius:10px;border:1px solid rgba(212,175,55,0.2)">
                <div style="font-size:11px;color:var(--mu);margin-bottom:4px">AURA</div>
                <div style="font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:var(--gold)">${n.master}%</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- MODO PRUEBA -->
      <div class="card" style="margin-bottom:14px;border-color:rgba(239,68,68,0.3)">
        <div class="section-title" style="margin-bottom:4px;color:#EF4444">🚨 Modo Prueba</div>
        <div style="font-size:11px;color:var(--mu);margin-bottom:14px">Si la streamer no llega a la meta en 2 semanas, pierde sus estrellas</div>
        <div class="input-group" style="margin-bottom:10px">
          <span class="input-icon">👤</span>
          <input type="text" id="modoPruebaEmail" placeholder="Email de la streamer">
        </div>
        <button onclick="masterActivarPrueba()" style="width:100%;padding:12px;border-radius:var(--r-lg);background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#EF4444;font-weight:700;font-size:13px;cursor:pointer">
          🚨 Activar Modo Prueba
        </button>
      </div>

      <!-- GESTIÓN MANUAL DE NIVEL -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:14px">✏️ Cambiar nivel manualmente</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="input-group">
            <span class="input-icon">👤</span>
            <input type="text" id="cambiarNivelEmail" placeholder="Email de la streamer">
          </div>
          <select id="cambiarNivelVal" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:12px;font-size:13px">
            <option value="bronce">🥉 Bronce</option>
            <option value="plata">🥈 Plata</option>
            <option value="oro">🥇 Oro</option>
            <option value="diamante">💎 Diamante</option>
          </select>
          <button onclick="masterCambiarNivel()" class="btn-sm" style="padding:12px">Cambiar nivel</button>
        </div>
      </div>

      <!-- STREAMERS Y SUS NIVELES -->
      <div class="section-title" style="margin-bottom:10px">👩 Niveles actuales</div>
      <div id="masterNivelesStreamers">
        <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
      </div>
    `;

    // Cargar streamers con sus niveles
    cargarUsuariosReales?.().then(usuarios => {
      const streamers = usuarios.filter(u=>u.rol==='streamer');
      const cont2 = document.getElementById('masterNivelesStreamers');
      if (!cont2) return;
      if (streamers.length === 0) {
        cont2.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay streamers registradas aún.</div>`;
        return;
      }
      cont2.innerHTML = streamers.map(s=>{
        const nv = window.getNivel?.(s.nivel||'bronce');
        return `
          <div class="card card-row" style="margin-bottom:8px">
            <div class="card-avatar">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
            <div class="card-info">
              <div class="card-name">@${s.nick||s.nombre}</div>
              <div class="card-sub">${s.email||'—'}</div>
            </div>
            <span style="font-size:18px">${nv?.emoji||'🥉'}</span>
            <span class="badge" style="background:rgba(212,175,55,0.1);color:var(--gold);border-color:rgba(212,175,55,0.3)">${nv?.nombre||'Bronce'}</span>
            ${s.modo_prueba?'<span class="badge badge-red" style="font-size:9px">⚠️ Prueba</span>':''}
            <span style="font-size:11px;color:var(--gold)">${(s.estrellas||0).toLocaleString()}⭐</span>
          </div>
        `;
      }).join('');
    });

    window.masterActivarPrueba = function() {
      const email = document.getElementById('modoPruebaEmail')?.value?.trim();
      if (!email) { toast('Ingresa el email','error'); return; }
      cargarUsuariosReales?.().then(usuarios => {
        const s = usuarios.find(u=>u.email===email&&u.rol==='streamer');
        if (!s) { toast('Streamer no encontrada','error'); return; }
        window.fsSet?.('usuarios', s.id, { modo_prueba:true, semanas_prueba:0 }).then(()=>{
          window.fsAdd?.('logs_master',{accion:`Modo prueba activado: @${s.nick}`,uid_master:p.uid,tipo:'prueba'});
          toast(`⚠️ Modo prueba activado para @${s.nick}`,'success');
        });
      });
    };

    window.masterCambiarNivel = function() {
      const email = document.getElementById('cambiarNivelEmail')?.value?.trim();
      const nivel = document.getElementById('cambiarNivelVal')?.value;
      if (!email) { toast('Ingresa el email','error'); return; }
      cargarUsuariosReales?.().then(usuarios => {
        const s = usuarios.find(u=>u.email===email&&u.rol==='streamer');
        if (!s) { toast('Streamer no encontrada','error'); return; }
        window.fsSet?.('usuarios', s.id, { nivel }).then(()=>{
          window.fsAdd?.('logs_master',{accion:`Nivel cambiado a ${nivel}: @${s.nick}`,uid_master:p.uid,tipo:'nivel'});
          toast(`✅ @${s.nick} ahora es ${window.getNivel(nivel).emoji} ${window.getNivel(nivel).nombre}`,'success');
          renderNivelesTab();
        });
      });
    };
  }

  // ── TAB 3: CARTERA ──
  function renderCarteraTab() {
    window.fsGet?.('config_plataforma','cartera').then(cartera => {
      const cont = document.getElementById('masterTabContent');
      if (!cont) return;
      const c = cartera || { total_estrellas:0, total_usd:0 };

      cont.innerHTML = `
        <div style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#0d0d0d,#1a0800);border:1px solid rgba(212,175,55,0.3);margin-bottom:20px">
          <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--mu);margin-bottom:8px">Cartera AURA</div>
          <div style="font-family:'Cinzel',serif;font-size:40px;font-weight:900;color:var(--gold)">${(c.total_estrellas||0).toLocaleString()} ⭐</div>
          <div style="font-size:14px;color:#22c55e;margin-top:6px;font-weight:700">≈ $${(c.total_usd||0).toFixed(2)} USD</div>
          <div style="font-size:11px;color:var(--mu);margin-top:4px">200★ = $1.00 USD</div>
        </div>

        <div class="stats-grid" style="margin-bottom:20px">
          <div class="stat-card"><div class="stat-label">⭐ En cartera</div><div class="stat-value" style="color:var(--gold)">${(c.total_estrellas||0).toLocaleString()}</div></div>
          <div class="stat-card"><div class="stat-label">💵 En USD</div><div class="stat-value" style="color:#22c55e">$${(c.total_usd||0).toFixed(0)}</div></div>
        </div>

        <!-- RETIROS PENDIENTES -->
        <div class="section-title" style="margin-bottom:10px">💳 Retiros pendientes de pagar</div>
        <div id="masterCarteraRetiros">
          <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
        </div>

        <!-- DISTRIBUCIÓN MANUAL -->
        <div class="card" style="margin-top:16px">
          <div class="section-title" style="margin-bottom:14px">💸 Pago manual a streamer</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div class="input-group">
              <span class="input-icon">👤</span>
              <input type="text" id="pagoEmail" placeholder="Email de la streamer">
            </div>
            <div class="input-group">
              <span class="input-icon">⭐</span>
              <input type="number" id="pagoMonto" placeholder="Monto en estrellas">
            </div>
            <div class="input-group">
              <span class="input-icon">📝</span>
              <input type="text" id="pagoConcepto" placeholder="Concepto (ej: Bono semanal)">
            </div>
            <button onclick="masterPagoManual()" class="btn-primary" style="padding:14px">💸 Enviar pago</button>
          </div>
        </div>
      `;

      // Cargar retiros
      window.fsGetAll?.('retiros').then(retiros => {
        const cont2 = document.getElementById('masterCarteraRetiros');
        if (!cont2) return;
        const pendientes = retiros?.filter(r=>r.estado==='pendiente') || [];
        if (pendientes.length === 0) {
          cont2.innerHTML = `<div class="card" style="text-align:center;padding:16px;color:var(--mu)">No hay retiros pendientes.</div>`;
          return;
        }
        cont2.innerHTML = pendientes.map(r=>`
          <div class="card" style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
              <div>
                <div style="font-weight:700">@${r.nick||'—'}</div>
                <div style="font-size:12px;color:var(--mu)">${r.metodo} · ${r.cuenta||'—'}</div>
              </div>
              <div style="text-align:right">
                <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:var(--gold)">${r.monto_usd?'$'+r.monto_usd+' USD':r.monto+'★'}</div>
                <div style="font-size:10px;color:var(--mu)">${r.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Reciente'}</div>
              </div>
            </div>
            <div style="display:flex;gap:8px">
              <button onclick="masterPagarRetiro('${r.id}')" class="btn-sm green" style="flex:1;padding:10px">✓ Marcar pagado</button>
              <button onclick="masterRechazarRetiro('${r.id}')" class="btn-sm danger" style="flex:1;padding:10px">✕ Rechazar</button>
            </div>
          </div>
        `).join('');
      }).catch(()=>{});

      window.masterPagoManual = function() {
        const email = document.getElementById('pagoEmail')?.value?.trim();
        const monto = parseInt(document.getElementById('pagoMonto')?.value);
        const concepto = document.getElementById('pagoConcepto')?.value?.trim();
        if (!email || !monto) { toast('Completa email y monto','error'); return; }
        cargarUsuariosReales?.().then(usuarios => {
          const s = usuarios.find(u=>u.email===email);
          if (!s) { toast('Streamer no encontrada','error'); return; }
          window.fsGet?.('usuarios',s.id).then(perfil=>{
            window.fsSet?.('usuarios',s.id,{estrellas:(perfil?.estrellas||0)+monto}).then(()=>{
              window.fsAdd?.('logs_master',{accion:`Pago manual a @${s.nick}: +${monto}⭐ · ${concepto}`,uid_master:p.uid,tipo:'pago'});
              toast(`✅ +${monto}⭐ enviados a @${s.nick}`,'success');
              renderCarteraTab();
            });
          });
        });
      };

      window.masterPagarRetiro = function(id) {
        window.fsSet?.('retiros',id,{estado:'pagado'}).then(()=>{
          window.fsAdd?.('logs_master',{accion:'Retiro pagado',uid_master:p.uid,tipo:'retiro'});
          toast('Retiro marcado como pagado ✓','success');
          renderCarteraTab();
        });
      };
      window.masterRechazarRetiro = function(id) {
        window.fsSet?.('retiros',id,{estado:'rechazado'}).then(()=>{
          toast('Retiro rechazado','info');
          renderCarteraTab();
        });
      };
    }).catch(()=>{});
  }

  // Cargar tab inicial
  renderTarifasTab();
}

// ── METAS SEMANALES ───────────────────────
function master_metas(el, p) {
  const ahora = new Date();
  const diasParaLunes = (8 - ahora.getDay()) % 7 || 7;
  const proximoLunes = new Date(ahora);
  proximoLunes.setDate(ahora.getDate() + diasParaLunes);
  proximoLunes.setHours(0,0,0,0);

  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🎯 Metas <span>Semanales</span></h1>
      <p>Se reinician automáticamente cada lunes</p>
    </div>
    <div style="padding:12px 16px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.2);border-radius:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:13px;color:var(--mu)">Próximo reinicio</div>
      <div style="font-size:13px;font-weight:700;color:var(--gold)">${proximoLunes.toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long'})}</div>
    </div>

    <!-- CREAR META -->
    <div class="card" style="margin-bottom:16px">
      <div class="section-title" style="margin-bottom:14px">+ Nueva meta semanal</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="input-group">
          <span class="input-icon">🎯</span>
          <input type="text" id="metaTitulo" placeholder="Título (ej: Llegar a 10,000 estrellas)">
        </div>
        <div class="input-group">
          <span class="input-icon">📝</span>
          <input type="text" id="metaDesc" placeholder="Descripción para streamers">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="input-group">
            <span class="input-icon">🎁</span>
            <input type="number" id="metaValor" placeholder="Valor objetivo">
          </div>
          <select id="metaTipo" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:0 12px;font-size:13px">
            <option value="estrellas">⭐ Estrellas</option>
            <option value="seguidores">👥 Nuevos fans</option>
            <option value="lives">📺 Horas en live</option>
            <option value="matches">⚡ Matches</option>
            <option value="gifts">🎁 Gifts recibidos</option>
          </select>
        </div>
        <div class="input-group">
          <span class="input-icon">🏆</span>
          <input type="text" id="metaRecompensa" placeholder="Recompensa (ej: +500 estrellas bonus)">
        </div>
        <button onclick="masterCrearMeta()" class="btn-primary" style="padding:14px">🎯 Crear meta semanal</button>
      </div>
    </div>

    <!-- METAS ACTIVAS -->
    <div class="section-title" style="margin-bottom:10px">📋 Metas activas esta semana</div>
    <div id="masterMetasContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando metas...</div>
    </div>
  `;

  window.masterCrearMeta = function() {
    const titulo = document.getElementById('metaTitulo')?.value?.trim();
    const desc = document.getElementById('metaDesc')?.value?.trim();
    const valor = parseInt(document.getElementById('metaValor')?.value);
    const tipo = document.getElementById('metaTipo')?.value;
    const recompensa = document.getElementById('metaRecompensa')?.value?.trim();
    if (!titulo || !valor) { toast('Completa título y valor objetivo','error'); return; }

    window.fsAdd?.('metas_semanales', {
      titulo, descripcion: desc, valor_objetivo: valor,
      tipo, recompensa, estado: 'activa',
      semana: proximoLunes.toISOString(),
      uid_master: p.uid,
      para: 'streamers' // metas son para streamers
    }).then(()=>{
      document.getElementById('metaTitulo').value = '';
      document.getElementById('metaDesc').value = '';
      document.getElementById('metaValor').value = '';
      document.getElementById('metaRecompensa').value = '';
      toast('Meta semanal creada ✓','success');
      masterCargarMetas();
    }).catch(()=>toast('Error al crear meta','error'));
  };

  function masterCargarMetas() {
    if (!document.getElementById('masterMetasContent')) return;
    window.fsGetAll?.('metas_semanales').then(metas => {
      const cont = document.getElementById('masterMetasContent');
      if (!cont) return;
      const activas = metas?.filter(m => m.estado === 'activa') || [];
      if (activas.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">
          No hay metas esta semana. Crea la primera arriba.
        </div>`;
        return;
      }
      cont.innerHTML = activas.map(m=>`
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:10px">
            <div>
              <div style="font-weight:700;font-size:14px">${m.titulo}</div>
              <div style="font-size:11px;color:var(--mu);margin-top:3px">${m.descripcion||''}</div>
            </div>
            <button onclick="masterDesactivarMeta('${m.id}')" style="background:none;border:none;color:rgba(239,68,68,0.6);cursor:pointer;font-size:16px;padding:0">✕</button>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px">
            <span style="color:var(--gold)">🎯 ${m.valor_objetivo?.toLocaleString()} ${m.tipo}</span>
            <span style="color:#22c55e">🏆 ${m.recompensa||'Sin recompensa'}</span>
            <span class="badge badge-green">Activa</span>
          </div>
        </div>
      `).join('');
    }).catch(()=>{
      const cont = document.getElementById('masterMetasContent');
      if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay metas aún.</div>`;
    });
  }

  window.masterDesactivarMeta = function(id) {
    window.fsSet?.('metas_semanales', id, { estado: 'inactiva' }).then(()=>{
      toast('Meta desactivada ✓','success');
      masterCargarMetas();
    });
  };

  masterCargarMetas();
}
