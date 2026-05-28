// js/roles/moderador.js — Monitor conectado a Firestore real

window.render_moderador = function(page, el, perfil) {
  switch(page) {
    case 'home':        return mod_dashboard(el, perfil);
    case 'lives':       return mod_lives(el, perfil);
    case 'reportes':    return mod_reportes(el, perfil);
    case 'perfiles':    return mod_perfiles(el, perfil);
    case 'voice':       return mod_voice(el, perfil);
    case 'video':       return mod_video(el, perfil);
    case 'tickets':     return mod_tickets(el, perfil);
    case 'infracciones':return mod_infracciones(el, perfil);
    case 'bloqueos':    return mod_bloqueos(el, perfil);
    case 'actividad':   return mod_actividad(el, perfil);
    case 'escalar':     return mod_escalar(el, perfil);
    default:            return mod_dashboard(el, perfil);
  }
};

function mCard(c) { return `<div class="card" style="margin-bottom:14px">${c}</div>`; }
function mTable(headers, rows) {
  return `<div style="overflow-x:auto"><table class="data-table" style="width:100%">
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

// ── 1. DASHBOARD ─────────────────────────
function mod_dashboard(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>👁 Monitor <span>Dashboard</span></h1>
      <p>Bienvenido @${p.nick||p.nombre} — Centro de monitoreo</p>
    </div>
    <div id="modStatsGrid" class="stats-grid">
      <div class="stat-card"><div class="stat-label">Cargando...</div></div>
    </div>
    <div id="modDashContent"></div>
  `;

  cargarStatsReales().then(stats => {
    document.getElementById('modStatsGrid').innerHTML = `
      <div class="stat-card"><div class="stat-label">👥 Usuarios totales</div><div class="stat-value" style="color:#60A5FA">${stats.usuarios}</div></div>
      <div class="stat-card"><div class="stat-label">🎤 Streamers</div><div class="stat-value" style="color:#4ade80">${stats.streamers}</div></div>
      <div class="stat-card"><div class="stat-label">⚠️ Reportes</div><div class="stat-value" style="color:#FFA500" id="modReportesCount">...</div></div>
      <div class="stat-card"><div class="stat-label">🔴 Lives activos</div><div class="stat-value" style="color:#EF4444">0</div></div>
    `;
    // Cargar conteo de reportes
    window.fsGetAll?.('reportes').then(r => {
      const el2 = document.getElementById('modReportesCount');
      if (el2) el2.textContent = r?.filter(x=>x.estado!=='resuelto').length || 0;
    }).catch(()=>{});
  });

  // Acciones rápidas del monitor
  const cont = document.getElementById('modDashContent');
  if (cont) cont.innerHTML = `
    ${mCard(`
      <div class="section-title">⚡ Mis acciones rápidas</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">
        ${[
          {icon:'⚠️',label:'Ver reportes',fn:"navigate('reportes')"},
          {icon:'💬',label:'Ver tickets',fn:"navigate('tickets')"},
          {icon:'🚫',label:'Infracciones',fn:"navigate('infracciones')"},
          {icon:'👤',label:'Perfiles',fn:"navigate('perfiles')"},
          {icon:'📺',label:'Lives',fn:"navigate('lives')"},
          {icon:'⬆️',label:'Escalar',fn:"navigate('escalar')"},
        ].map(b=>`
          <button onclick="${b.fn}" class="btn-sm" style="padding:12px;display:flex;flex-direction:column;align-items:center;gap:4px">
            <span style="font-size:22px">${b.icon}</span>
            <span style="font-size:11px">${b.label}</span>
          </button>
        `).join('')}
      </div>
    `)}
    ${mCard(`
      <div class="section-title">📋 Actividad reciente</div>
      <div id="modActividadReciente" style="color:var(--mu);font-size:13px;padding:10px">Cargando...</div>
    `)}
  `;

  window.fsLogsRecientes?.('logs_admin', 5).then(logs => {
    const act = document.getElementById('modActividadReciente');
    if (!act) return;
    if (!logs || logs.length === 0) {
      act.textContent = 'No hay actividad reciente aún.';
      return;
    }
    act.innerHTML = logs.map(l=>`
      <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;justify-content:space-between">
        <span>${l.accion}</span>
        <span style="color:var(--mu);font-size:11px">${l.createdAt?.toDate?.()?.toLocaleString?.() || 'Reciente'}</span>
      </div>
    `).join('');
  }).catch(()=>{});
}

// ── 2. LIVES ACTIVOS ─────────────────────
function mod_lives(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🔴 Lives <span>Activos</span></h1>
      <p>Monitorea las transmisiones en tiempo real</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">🔴 En vivo ahora</div><div class="stat-value" style="color:#EF4444">0</div></div>
      <div class="stat-card"><div class="stat-label">👁 Viewers totales</div><div class="stat-value">0</div></div>
    </div>
    ${mCard(`
      <div class="section-title">📺 Lives activos</div>
      <div style="text-align:center;padding:30px;color:var(--mu)">
        <div style="font-size:40px;opacity:0.3;margin-bottom:12px">📺</div>
        No hay lives activos ahora mismo.<br>
        <span style="font-size:12px">Cuando una streamer transmita, podrás monitorear y cerrar su live desde aquí.</span>
      </div>
    `)}
    ${mCard(`
      <div class="section-title">⚡ Acciones de moderación en lives</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        <button onclick="modCerrarLive()" class="btn-sm danger" style="padding:12px">📺 Cerrar live</button>
        <button onclick="modAdvertirStreamer()" class="btn-sm" style="padding:12px">⚠️ Advertir streamer</button>
        <button onclick="modSilenciarChat()" class="btn-sm" style="padding:12px">🔇 Silenciar chat</button>
        <button onclick="modReportarLive()" class="btn-sm danger" style="padding:12px">🚨 Reportar contenido</button>
      </div>
    `)}
  `;

  window.modCerrarLive = function() {
    const nick = prompt('Nick del streamer a cerrar live:');
    if (!nick) return;
    window.fsAdd?.('logs_admin', { accion:`Monitor cerró live: @${nick}`, uid_admin:p.uid, tipo:'live' })
      .then(()=>toast(`Live de @${nick} cerrado ✓`,'success')).catch(()=>toast('Registrado ✓','success'));
  };
  window.modAdvertirStreamer = function() {
    const nick = prompt('Nick del streamer a advertir:');
    if (!nick) return;
    const motivo = prompt('Motivo de la advertencia:');
    if (!motivo) return;
    window.fsAdd?.('logs_admin', { accion:`Advertencia a @${nick}: ${motivo}`, uid_admin:p.uid, tipo:'advertencia' })
      .then(()=>toast(`Advertencia enviada a @${nick} ✓`,'success')).catch(()=>toast('Registrado ✓','success'));
  };
  window.modSilenciarChat = function() {
    const nick = prompt('Nick del streamer cuyo chat silenciar:');
    if (!nick) return;
    window.fsAdd?.('logs_admin', { accion:`Chat silenciado: @${nick}`, uid_admin:p.uid, tipo:'chat' })
      .then(()=>toast(`Chat de @${nick} silenciado ✓`,'success')).catch(()=>toast('Registrado ✓','success'));
  };
  window.modReportarLive = function() {
    const nick = prompt('Nick del streamer a reportar:');
    if (!nick) return;
    const motivo = prompt('Motivo del reporte:');
    if (!motivo) return;
    window.fsAdd?.('reportes', {
      descripcion: `Contenido inapropiado en live de @${nick}: ${motivo}`,
      usuario: nick, nivel: 'Alta', estado: 'pendiente',
      uid_monitor: p.uid
    }).then(()=>toast(`Live de @${nick} reportado ✓`,'success')).catch(()=>toast('Registrado ✓','success'));
  };
}

// ── 3. REPORTES ───────────────────────────
function mod_reportes(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>⚠️ <span>Reportes</span></h1>
      <p>Gestiona los reportes de la plataforma</p>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="input-group" style="flex:1;min-width:180px">
        <span class="input-icon">📝</span>
        <input type="text" id="modReporteDesc" placeholder="Descripción del reporte...">
      </div>
      <input type="text" id="modReporteUser" placeholder="@usuario" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:0 12px;font-size:13px;width:120px">
      <select id="modReporteNivel" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:0 12px;font-size:13px">
        <option value="Media">Media</option>
        <option value="Alta">Alta</option>
        <option value="Crítica">Crítica</option>
      </select>
      <button class="btn-sm danger" style="padding:10px 16px" onclick="modCrearReporte()">+ Crear</button>
    </div>
    <div id="modReportesContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando reportes...</div>
    </div>
  `;

  window.modCrearReporte = function() {
    const desc = document.getElementById('modReporteDesc')?.value?.trim();
    const user = document.getElementById('modReporteUser')?.value?.trim();
    const nivel = document.getElementById('modReporteNivel')?.value;
    if (!desc) { toast('Escribe la descripción','error'); return; }
    window.fsAdd?.('reportes', {
      descripcion: desc, usuario: user, nivel,
      estado: 'pendiente', uid_monitor: p.uid
    }).then(()=>{
      document.getElementById('modReporteDesc').value='';
      document.getElementById('modReporteUser').value='';
      toast('Reporte creado ✓','success');
      modCargarReportes();
    }).catch(()=>toast('Error al crear reporte','error'));
  };

  function modCargarReportes() {
    if (!document.getElementById('modReportesContent')) return;
    window.fsGetAll?.('reportes').then(reportes => {
      const cont = document.getElementById('modReportesContent');
      if (!cont) return;
      if (!reportes || reportes.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">No hay reportes aún.</div>`;
        return;
      }
      const cN = {'Alta':'#EF4444','Crítica':'#DC2626','Media':'#FFA500'};
      cont.innerHTML = reportes.map(r=>`
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <div style="flex:1">
              <div style="font-weight:600;font-size:13px">${r.descripcion}</div>
              <div style="font-size:11px;color:var(--mu);margin-top:2px">${r.usuario||'Sin usuario'} · ${r.createdAt?.toDate?.()?.toLocaleString?.() || 'Reciente'}</div>
            </div>
            <span class="badge" style="background:${(cN[r.nivel]||'var(--gold)')}18;color:${(cN[r.nivel]||'var(--gold)')};border-color:${(cN[r.nivel]||'var(--gold)')}40;flex-shrink:0">${r.nivel||'Media'}</span>
            <span class="badge ${r.estado==='resuelto'?'badge-green':r.estado==='escalado'?'badge-red':'badge-orange'}" style="flex-shrink:0">${r.estado||'pendiente'}</span>
          </div>
          ${r.estado!=='resuelto'?`
            <div style="display:flex;gap:6px">
              <button onclick="modResolverReporte('${r.id}')" class="btn-sm green" style="padding:5px 10px;font-size:11px">✓ Resolver</button>
              <button onclick="modEscalarReporte('${r.id}')" class="btn-sm danger" style="padding:5px 10px;font-size:11px">⬆ Escalar</button>
            </div>
          `:''}
        </div>
      `).join('');
    }).catch(()=>{
      const cont = document.getElementById('modReportesContent');
      if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay reportes aún.</div>`;
    });
  }

  window.modResolverReporte = function(id) {
    window.fsSet?.('reportes', id, { estado:'resuelto' }).then(()=>{
      window.fsAdd?.('logs_admin', { accion:`Reporte resuelto: ${id}`, uid_admin:p.uid, tipo:'reporte' });
      toast('Reporte resuelto ✓','success'); modCargarReportes();
    }).catch(()=>toast('Error','error'));
  };
  window.modEscalarReporte = function(id) {
    window.fsSet?.('reportes', id, { estado:'escalado' }).then(()=>{
      window.fsAdd?.('logs_admin', { accion:`Reporte escalado al Admin: ${id}`, uid_admin:p.uid, tipo:'escalado' });
      toast('Escalado al Admin ✓','info'); modCargarReportes();
    }).catch(()=>toast('Error','error'));
  };

  modCargarReportes();
}

// ── 4. PERFILES SOSPECHOSOS ───────────────
function mod_perfiles(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>👤 Perfiles <span>Sospechosos</span></h1>
      <p>Usuarios reportados o con comportamiento irregular</p>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <div class="input-group" style="flex:1">
        <span class="input-icon">🔍</span>
        <input type="text" placeholder="Buscar usuario..." oninput="modBuscarPerfil(this.value)">
      </div>
    </div>
    <div id="modPerfilesContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando usuarios...</div>
    </div>
  `;

  window.modBuscarPerfil = function(q) {
    if (!window._modUsuarios) return;
    const filtered = q
      ? window._modUsuarios.filter(u =>
          (u.nick||'').toLowerCase().includes(q.toLowerCase()) ||
          (u.email||'').toLowerCase().includes(q.toLowerCase())
        )
      : window._modUsuarios;
    modRenderPerfiles(filtered);
  };

  function modRenderPerfiles(usuarios) {
    const cont = document.getElementById('modPerfilesContent');
    if (!cont) return;
    if (usuarios.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">No hay usuarios registrados aún.</div>`;
      return;
    }
    cont.innerHTML = usuarios.map(u=>`
      <div class="card card-row" style="margin-bottom:8px">
        <div class="card-avatar" style="width:40px;height:40px">${(u.nick||u.nombre||'?')[0].toUpperCase()}</div>
        <div class="card-info">
          <div class="card-name">@${u.nick||u.nombre||'?'}</div>
          <div class="card-sub">${u.email} · ${u.pais||'—'} · ${u.rol}</div>
        </div>
        <span class="badge ${u.estado==='activo'?'badge-green':u.estado==='suspendido'?'badge-red':'badge-orange'}">${u.estado||'activo'}</span>
        <div style="display:flex;gap:4px">
          <button onclick="modSuspender('${u.id}','${u.estado||'activo'}')" class="btn-sm ${u.estado==='activo'?'danger':''}" style="padding:4px 8px;font-size:10px">${u.estado==='activo'?'Suspender':'Activar'}</button>
          <button onclick="modReportarUsuario('${u.id}','${u.nick||u.nombre||'?'}')" class="btn-sm neutral" style="padding:4px 8px;font-size:10px">Reportar</button>
        </div>
      </div>
    `).join('');
  }

  window.modSuspender = function(uid, estadoActual) {
    const nuevo = estadoActual === 'activo' ? 'suspendido' : 'activo';
    window.fsSet?.('usuarios', uid, { estado: nuevo }).then(()=>{
      window.fsAdd?.('logs_admin', { accion:`Monitor ${nuevo} usuario: ${uid}`, uid_admin:p.uid, tipo:'usuario' });
      toast(`Usuario ${nuevo} ✓`,'success');
      cargarUsuariosReales().then(u=>{ window._modUsuarios=u; modRenderPerfiles(u); });
    }).catch(()=>toast('Error','error'));
  };

  window.modReportarUsuario = function(uid, nick) {
    const motivo = prompt(`Motivo del reporte para @${nick}:`);
    if (!motivo) return;
    window.fsAdd?.('reportes', {
      descripcion: `Usuario sospechoso @${nick}: ${motivo}`,
      usuario: nick, nivel: 'Alta', estado: 'pendiente', uid_monitor: p.uid
    }).then(()=>toast(`@${nick} reportado ✓`,'success')).catch(()=>toast('Error','error'));
  };

  cargarUsuariosReales().then(u=>{ window._modUsuarios=u; modRenderPerfiles(u); });
}

// ── 5. VOICE ROOMS ───────────────────────
function mod_voice(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🎤 Voice <span>Rooms</span></h1>
      <p>Monitorea las salas de voz activas</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">🎤 Salas activas</div><div class="stat-value">0</div></div>
      <div class="stat-card"><div class="stat-label">👥 Participantes</div><div class="stat-value">0</div></div>
    </div>
    ${mCard(`
      <div style="text-align:center;padding:30px;color:var(--mu)">
        <div style="font-size:40px;opacity:0.3;margin-bottom:12px">🎤</div>
        No hay salas de voz activas.<br>
        <span style="font-size:12px">Cuando los usuarios creen salas, aparecerán aquí para monitorear.</span>
      </div>
    `)}
    ${mCard(`
      <div class="section-title">⚡ Acciones</div>
      <div style="display:flex;gap:8px">
        <button onclick="modCerrarVoiceRoom()" class="btn-sm danger" style="flex:1;padding:12px">🔒 Cerrar sala</button>
        <button onclick="modReportarVoiceRoom()" class="btn-sm" style="flex:1;padding:12px">⚠️ Reportar sala</button>
      </div>
    `)}
  `;
  window.modCerrarVoiceRoom = function() {
    const sala = prompt('Nombre de la sala a cerrar:');
    if (!sala) return;
    window.fsAdd?.('logs_admin', { accion:`Voice room cerrado: ${sala}`, uid_admin:p.uid, tipo:'sala' })
      .then(()=>toast(`Sala "${sala}" cerrada ✓`,'success')).catch(()=>toast('Registrado ✓','success'));
  };
  window.modReportarVoiceRoom = function() {
    const sala = prompt('Nombre de la sala a reportar:');
    if (!sala) return;
    window.fsAdd?.('reportes', { descripcion:`Voice room sospechosa: ${sala}`, nivel:'Alta', estado:'pendiente', uid_monitor:p.uid })
      .then(()=>toast(`Sala reportada ✓`,'success')).catch(()=>toast('Registrado ✓','success'));
  };
}

// ── 6. VIDEO ROOMS ───────────────────────
function mod_video(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>📹 Video <span>Rooms</span></h1>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">📹 Salas activas</div><div class="stat-value">0</div></div>
      <div class="stat-card"><div class="stat-label">👥 Participantes</div><div class="stat-value">0</div></div>
    </div>
    ${mCard(`
      <div style="text-align:center;padding:30px;color:var(--mu)">
        <div style="font-size:40px;opacity:0.3;margin-bottom:12px">📹</div>
        No hay salas de video activas.
      </div>
    `)}
    ${mCard(`
      <div class="section-title">⚡ Acciones</div>
      <div style="display:flex;gap:8px">
        <button onclick="modCerrarVideoRoom()" class="btn-sm danger" style="flex:1;padding:12px">🔒 Cerrar sala</button>
        <button onclick="modReportarVideoRoom()" class="btn-sm" style="flex:1;padding:12px">⚠️ Reportar sala</button>
      </div>
    `)}
  `;
  window.modCerrarVideoRoom = function() {
    const sala = prompt('Nombre de la sala de video a cerrar:');
    if (!sala) return;
    window.fsAdd?.('logs_admin', { accion:`Video room cerrado: ${sala}`, uid_admin:p.uid, tipo:'sala' })
      .then(()=>toast(`Sala "${sala}" cerrada ✓`,'success')).catch(()=>toast('Registrado ✓','success'));
  };
  window.modReportarVideoRoom = function() {
    const sala = prompt('Nombre de la sala de video a reportar:');
    if (!sala) return;
    window.fsAdd?.('reportes', { descripcion:`Video room sospechosa: ${sala}`, nivel:'Alta', estado:'pendiente', uid_monitor:p.uid })
      .then(()=>toast(`Sala reportada ✓`,'success')).catch(()=>toast('Registrado ✓','success'));
  };
}

// ── 7. TICKETS ────────────────────────────
function mod_tickets(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>💬 <span>Tickets</span></h1>
      <p>Gestiona los tickets de soporte</p>
    </div>
    <div id="modTicketsContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando tickets...</div>
    </div>
  `;

  window.cargarTickets?.().then(tickets => {
    const cont = document.getElementById('modTicketsContent');
    if (!cont) return;
    if (!tickets || tickets.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
        No hay tickets aún.
      </div>`;
      return;
    }
    const cP = {HIGH:'#FFA500',CRITICAL:'#EF4444',MEDIUM:'var(--gold)'};
    cont.innerHTML = tickets.map(t=>`
      <div class="card card-row" style="margin-bottom:10px">
        <div class="card-info">
          <div class="card-name">${t.asunto||'Sin asunto'}</div>
          <div class="card-sub">${t.descripcion||''}</div>
        </div>
        <span class="badge" style="background:${(cP[t.prioridad]||'var(--gold)')}18;color:${(cP[t.prioridad]||'var(--gold)')};border-color:${(cP[t.prioridad]||'var(--gold)')}40;flex-shrink:0">${t.prioridad||'MEDIUM'}</span>
        <span class="badge ${t.estado==='resuelto'?'badge-green':'badge-orange'}" style="flex-shrink:0">${t.estado||'abierto'}</span>
        ${t.estado!=='resuelto'?`
          <div style="display:flex;gap:4px">
            <button onclick="modResolverTicket('${t.id}')" class="btn-sm green" style="padding:5px 10px;font-size:11px">✓</button>
            <button onclick="modEscalarTicket('${t.id}')" class="btn-sm danger" style="padding:5px 10px;font-size:11px">⬆</button>
          </div>
        `:''}
      </div>
    `).join('');
  }).catch(()=>{
    const cont = document.getElementById('modTicketsContent');
    if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay tickets aún.</div>`;
  });

  window.modResolverTicket = function(id) {
    window.resolverTicket?.(id).then(()=>navigate('tickets'));
  };
  window.modEscalarTicket = function(id) {
    window.fsSet?.('tickets', id, { estado:'escalado' }).then(()=>{
      window.fsAdd?.('logs_admin', { accion:`Ticket escalado: ${id}`, uid_admin:p.uid, tipo:'ticket' });
      toast('Ticket escalado al Admin ✓','info'); navigate('tickets');
    }).catch(()=>toast('Error','error'));
  };
}

// ── 8. INFRACCIONES ──────────────────────
function mod_infracciones(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🚫 <span>Infracciones</span></h1>
      <p>Registra y gestiona infracciones de usuarios</p>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="input-group" style="flex:1;min-width:150px">
        <span class="input-icon">👤</span>
        <input type="text" id="infUser" placeholder="@usuario">
      </div>
      <select id="infTipo" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:0 12px;font-size:13px">
        <option value="spam">Spam</option>
        <option value="acoso">Acoso</option>
        <option value="contenido_inapropiado">Contenido inapropiado</option>
        <option value="fraude">Fraude</option>
        <option value="otro">Otro</option>
      </select>
      <div class="input-group" style="flex:1;min-width:150px">
        <span class="input-icon">📝</span>
        <input type="text" id="infDesc" placeholder="Descripción...">
      </div>
      <button class="btn-sm danger" style="padding:10px 16px" onclick="modCrearInfraccion()">+ Infracción</button>
    </div>
    <div id="modInfraccionesContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando infracciones...</div>
    </div>
  `;

  window.modCrearInfraccion = function() {
    const user = document.getElementById('infUser')?.value?.trim();
    const tipo = document.getElementById('infTipo')?.value;
    const desc = document.getElementById('infDesc')?.value?.trim();
    if (!user || !desc) { toast('Completa todos los campos','error'); return; }
    window.fsAdd?.('infracciones', {
      usuario: user, tipo, descripcion: desc,
      estado: 'activa', uid_monitor: p.uid
    }).then(()=>{
      document.getElementById('infUser').value='';
      document.getElementById('infDesc').value='';
      toast(`Infracción registrada para @${user} ✓`,'success');
      modCargarInfracciones();
    }).catch(()=>toast('Error al registrar','error'));
  };

  function modCargarInfracciones() {
    if (!document.getElementById('modInfraccionesContent')) return;
    window.fsGetAll?.('infracciones').then(infs=>{
      const cont = document.getElementById('modInfraccionesContent');
      if (!cont) return;
      if (!infs || infs.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">No hay infracciones registradas.</div>`;
        return;
      }
      cont.innerHTML = infs.map(i=>`
        <div class="card card-row" style="margin-bottom:8px">
          <div class="card-info">
            <div class="card-name">@${i.usuario} · <span style="color:var(--gold)">${i.tipo}</span></div>
            <div class="card-sub">${i.descripcion}</div>
          </div>
          <span class="badge ${i.estado==='activa'?'badge-red':'badge-green'}">${i.estado}</span>
          ${i.estado==='activa'?`<button onclick="modResolverInfraccion('${i.id}')" class="btn-sm" style="padding:4px 8px;font-size:10px">Resolver</button>`:''}
        </div>
      `).join('');
    }).catch(()=>{
      const cont = document.getElementById('modInfraccionesContent');
      if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay infracciones aún.</div>`;
    });
  }

  window.modResolverInfraccion = function(id) {
    window.fsSet?.('infracciones', id, { estado:'resuelta' }).then(()=>{
      toast('Infracción resuelta ✓','success'); modCargarInfracciones();
    }).catch(()=>toast('Error','error'));
  };

  modCargarInfracciones();
}

// ── 9. BLOQUEOS ───────────────────────────
function mod_bloqueos(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🚫 <span>Bloqueos IP</span></h1>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="input-group" style="flex:1;min-width:150px">
        <span class="input-icon">🌐</span>
        <input type="text" id="modIp" placeholder="IP a bloquear ej: 192.168.1.1">
      </div>
      <div class="input-group" style="flex:1;min-width:150px">
        <span class="input-icon">📝</span>
        <input type="text" id="modIpMotivo" placeholder="Motivo del bloqueo">
      </div>
      <button class="btn-sm danger" style="padding:10px 16px" onclick="modBloquearIP()">🚫 Bloquear</button>
    </div>
    <div id="modBloqueosContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando bloqueos...</div>
    </div>
  `;

  window.modBloquearIP = function() {
    const ip = document.getElementById('modIp')?.value?.trim();
    const motivo = document.getElementById('modIpMotivo')?.value?.trim();
    if (!ip || !motivo) { toast('Completa IP y motivo','error'); return; }
    window.bloquearIP?.(ip, motivo).then(()=>{
      document.getElementById('modIp').value='';
      document.getElementById('modIpMotivo').value='';
      modCargarBloqueos();
    }).catch(()=>toast('Error','error'));
  };

  function modCargarBloqueos() {
    if (!document.getElementById('modBloqueosContent')) return;
    window.fsGetAll?.('bloqueos_ip').then(bloqueos=>{
      const cont = document.getElementById('modBloqueosContent');
      if (!cont) return;
      if (!bloqueos || bloqueos.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">No hay IPs bloqueadas.</div>`;
        return;
      }
      cont.innerHTML = mCard(bloqueos.map(b=>`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div style="font-family:monospace;color:#EF4444;font-size:13px;font-weight:600">${b.ip||b.nombre||'—'}</div>
          <div style="flex:1;font-size:12px;color:var(--mu)">${b.motivo||'—'}</div>
          <span class="badge ${b.activo!==false?'badge-red':'badge-neutral'}">${b.activo!==false?'Activo':'Inactivo'}</span>
          ${b.activo!==false?`<button onclick="modDesbloquearIP('${b.id}')" class="btn-sm" style="padding:4px 8px;font-size:10px">Desbloquear</button>`:''}
        </div>
      `).join(''));
    }).catch(()=>{
      const cont = document.getElementById('modBloqueosContent');
      if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay IPs bloqueadas.</div>`;
    });
  }

  window.modDesbloquearIP = function(id) {
    window.fsSet?.('bloqueos_ip', id, { activo: false }).then(()=>{
      toast('IP desbloqueada ✓','success'); modCargarBloqueos();
    }).catch(()=>toast('Error','error'));
  };

  modCargarBloqueos();
}

// ── 10. ACTIVIDAD ─────────────────────────
function mod_actividad(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>📊 Actividad <span>Plataforma</span></h1>
    </div>
    <div id="modActContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando actividad...</div>
    </div>
    <button onclick="modRecargarActividad()" class="btn-sm" style="margin-top:12px;padding:8px 16px">🔄 Actualizar</button>
  `;

  window.modRecargarActividad = function() {
    const cont = document.getElementById('modActContent');
    if (cont) cont.innerHTML = '<div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>';
    Promise.all([
      window.fsLogsRecientes?.('logs_admin', 20) || Promise.resolve([]),
      window.fsLogsRecientes?.('logs_master', 10) || Promise.resolve([]),
    ]).then(([logsAdmin, logsMaster]) => {
      if (!document.getElementById('modActContent')) return;
      const todos = [...(logsAdmin||[]), ...(logsMaster||[])].sort((a,b)=>b.createdAt?.seconds - a.createdAt?.seconds);
      const cont2 = document.getElementById('modActContent');
      if (!cont2) return;
      if (todos.length === 0) {
        cont2.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">No hay actividad registrada aún.</div>`;
        return;
      }
      cont2.innerHTML = mCard(`
        <div class="section-title">📋 Log de actividad</div>
        <div style="font-size:12px;line-height:1.8">
          ${todos.slice(0,30).map(l=>`
            <div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);display:flex;justify-content:space-between;gap:10px">
              <span style="color:var(--gold)">${l.accion||'Acción'}</span>
              <span style="color:var(--mu);font-size:10px;flex-shrink:0">${l.createdAt?.toDate?.()?.toLocaleString?.() || 'Reciente'}</span>
            </div>
          `).join('')}
        </div>
      `);
    }).catch(()=>{
      const cont3 = document.getElementById('modActContent');
      if (cont3) cont3.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay actividad aún.</div>`;
    });
  };
  window.modRecargarActividad();
}

// ── 11. ESCALAR CASO ─────────────────────
function mod_escalar(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>⬆️ Escalar <span>Caso</span></h1>
      <p>Escala casos críticos al Admin o Master</p>
    </div>
    ${mCard(`
      <div class="section-title">📋 Nuevo caso escalado</div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">
        <div class="input-group">
          <span class="input-icon">📝</span>
          <input type="text" id="escalarTitulo" placeholder="Título del caso">
        </div>
        <div class="input-group">
          <span class="input-icon">👤</span>
          <input type="text" id="escalarUsuario" placeholder="Usuario involucrado (@nick)">
        </div>
        <textarea id="escalarDesc" placeholder="Descripción detallada del caso..."
          style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:12px;font-size:13px;font-family:'Outfit',sans-serif;resize:none;height:80px;outline:none"></textarea>
        <select id="escalarNivel" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:12px;font-size:13px">
          <option value="Admin">Escalar a Admin</option>
          <option value="Master">Escalar a Master (crítico)</option>
        </select>
        <button class="btn-primary" onclick="modEscalarCaso()" style="padding:14px">⬆️ Escalar caso ahora</button>
      </div>
    `)}
    <div id="modCasosEscalados">
      <div class="section-title" style="margin:16px 0 10px">📋 Casos escalados anteriores</div>
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  window.modEscalarCaso = function() {
    const titulo = document.getElementById('escalarTitulo')?.value?.trim();
    const usuario = document.getElementById('escalarUsuario')?.value?.trim();
    const desc = document.getElementById('escalarDesc')?.value?.trim();
    const nivel = document.getElementById('escalarNivel')?.value;
    if (!titulo || !desc) { toast('Completa título y descripción','error'); return; }
    window.fsAdd?.('tickets', {
      asunto: titulo, descripcion: desc,
      usuario, prioridad: nivel==='Master'?'CRITICAL':'HIGH',
      estado: 'escalado', tipo: 'escalado_monitor',
      uid_monitor: p.uid, escalado_a: nivel
    }).then(()=>{
      document.getElementById('escalarTitulo').value='';
      document.getElementById('escalarUsuario').value='';
      document.getElementById('escalarDesc').value='';
      toast(`✓ Caso escalado al ${nivel}`,'success');
      modCargarCasosEscalados();
    }).catch(()=>toast('Error al escalar','error'));
  };

  function modCargarCasosEscalados() {
    window.cargarTickets?.().then(tickets=>{
      const casos = tickets?.filter(t=>t.tipo==='escalado_monitor') || [];
      const cont = document.getElementById('modCasosEscalados');
      if (!cont) return;
      if (casos.length === 0) {
        cont.innerHTML = `<div class="section-title" style="margin:16px 0 10px">📋 Casos escalados anteriores</div>
          <div class="card" style="text-align:center;padding:20px;color:var(--mu)">No has escalado casos aún.</div>`;
        return;
      }
      cont.innerHTML = `<div class="section-title" style="margin:16px 0 10px">📋 Casos escalados anteriores</div>` +
        casos.map(t=>`
          <div class="card card-row" style="margin-bottom:8px">
            <div class="card-info">
              <div class="card-name">${t.asunto}</div>
              <div class="card-sub">${t.usuario||''} · Escalado a ${t.escalado_a||'Admin'}</div>
            </div>
            <span class="badge ${t.estado==='resuelto'?'badge-green':'badge-orange'}">${t.estado}</span>
          </div>
        `).join('');
    }).catch(()=>{});
  }
  modCargarCasosEscalados();
}
