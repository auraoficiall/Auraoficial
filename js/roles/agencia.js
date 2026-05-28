// js/roles/agencia.js — Agencia conectada a Firestore real

window.render_agencia = function(page, el, perfil) {
  switch(page) {
    case 'home':       return ag_dashboard(el, perfil);
    case 'streamers':  return ag_streamers(el, perfil);
    case 'finanzas':   return ag_ganancias(el, perfil);
    case 'stats':      return ag_estadisticas(el, perfil);
    case 'lives':      return ag_lives(el, perfil);
    case 'mensajes':   return ag_mensajes(el, perfil);
    case 'metas':      return ag_metas(el, perfil);
    default:           return ag_dashboard(el, perfil);
  }
};

function agCard(c) { return `<div class="card" style="margin-bottom:14px">${c}</div>`; }

// ── 1. DASHBOARD ─────────────────────────
function ag_dashboard(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🏢 Mi <span>Agencia</span></h1>
      <p>Panel de control · @${p.nick||p.nombre}</p>
    </div>
    <div id="agStatsGrid" class="stats-grid">
      <div class="stat-card"><div class="stat-label">Cargando...</div></div>
    </div>
    <div id="agDashContent"></div>
  `;

  // Cargar streamers de esta agencia
  agCargarMisStreamers(p).then(streamers => {
    const live = streamers.filter(s => s.liveActivo).length;
    const totalStars = streamers.reduce((a,s) => a + (s.estrellas||0), 0);
    const comision = (totalStars * 0.15).toFixed(0);

    const grid = document.getElementById('agStatsGrid');
    if (grid) grid.innerHTML = `
      <div class="stat-card"><div class="stat-label">👩 Mis streamers</div><div class="stat-value" style="color:#4ade80">${streamers.length}</div></div>
      <div class="stat-card"><div class="stat-label">🔴 En vivo ahora</div><div class="stat-value" style="color:#EF4444">${live}</div></div>
      <div class="stat-card"><div class="stat-label">⭐ Estrellas equipo</div><div class="stat-value" style="color:var(--gold)">${totalStars.toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">💰 Tu comisión (15%)</div><div class="stat-value" style="color:#22c55e">${comision}★</div></div>
    `;

    const cont = document.getElementById('agDashContent');
    if (!cont) return;
    cont.innerHTML = `
      ${agCard(`
        <div class="section-title" style="margin-bottom:12px">🔗 Link de invitación</div>
        <div style="font-size:12px;color:var(--mu);margin-bottom:10px">Comparte este link con tus streamers para que se registren directamente en tu agencia</div>
        <button onclick="agGenerarLink()" style="width:100%;padding:12px;border-radius:10px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:var(--gold);font-weight:700;font-size:13px;cursor:pointer">
          🔗 Generar mi link de invitación
        </button>
        <div id="agLinkInvitacion"></div>
      `)}
      ${agCard(`
        <div class="section-title">⚡ Acciones rápidas</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">
          ${[
            {icon:'👩',label:'Mis streamers',fn:"navigate('streamers')"},
            {icon:'💰',label:'Ganancias',fn:"navigate('finanzas')"},
            {icon:'💬',label:'Mensajes',fn:"navigate('mensajes')"},
            {icon:'📺',label:'Ver lives',fn:"navigate('lives')"},
            {icon:'📊',label:'Estadísticas',fn:"navigate('stats')"},
            {icon:'🎯',label:'Metas',fn:"navigate('metas')"},
          ].map(b=>`
            <button onclick="${b.fn}" class="btn-sm" style="padding:12px;display:flex;flex-direction:column;align-items:center;gap:4px">
              <span style="font-size:22px">${b.icon}</span>
              <span style="font-size:11px">${b.label}</span>
            </button>
          `).join('')}
        </div>
      `)}
      ${streamers.length > 0 ? agCard(`
        <div class="section-title">👩 Mis streamers</div>
        ${streamers.slice(0,3).map(s=>`
          <div class="card-row" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <div class="card-avatar">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
            <div class="card-info">
              <div class="card-name">@${s.nick||s.nombre}</div>
              <div class="card-sub">${s.pais||'—'} · ⭐ ${(s.estrellas||0).toLocaleString()}</div>
            </div>
            <span class="badge ${s.estado==='activo'?'badge-green':'badge-red'}">${s.estado||'activo'}</span>
          </div>
        `).join('')}
        ${streamers.length > 3 ? `<div style="text-align:center;margin-top:10px"><button onclick="navigate('streamers')" class="btn-link">Ver todos (${streamers.length}) →</button></div>` : ''}
      `) : agCard(`
        <div style="text-align:center;padding:20px;color:var(--mu)">
          <div style="font-size:36px;opacity:0.3;margin-bottom:10px">👩</div>
          No tienes streamers en tu agencia aún.<br>
          <span style="font-size:12px">El Admin puede asignar streamers a tu agencia.</span>
        </div>
      `)}
    `;
  });
}

// ── HELPER: cargar streamers de esta agencia ──
async function agCargarMisStreamers(p) {
  try {
    const todos = await window.fsGetAll?.('usuarios') || [];
    // Streamers asignados a esta agencia
    return todos.filter(u => u.rol === 'streamer' && (u.agencia_uid === p.uid || u.agencia === p.nick));
  } catch(e) { return []; }
}

// ── 2. MIS STREAMERS ─────────────────────
function ag_streamers(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>👩 Mis <span>Streamers</span></h1>
      <p>Gestiona tu equipo de talento</p>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="input-group" style="flex:1;min-width:180px">
        <span class="input-icon">🔍</span>
        <input type="text" placeholder="Buscar streamer..." oninput="agFiltrar(this.value)">
      </div>
    </div>
    <div id="agStreamersContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  agCargarMisStreamers(p).then(streamers => {
    window._agStreamers = streamers;
    agRenderStreamers(streamers);
  });

  window.agFiltrar = function(q) {
    if (!window._agStreamers) return;
    const f = q ? window._agStreamers.filter(s =>
      (s.nick||s.nombre||'').toLowerCase().includes(q.toLowerCase())
    ) : window._agStreamers;
    agRenderStreamers(f);
  };
}

function agRenderStreamers(streamers) {
  const cont = document.getElementById('agStreamersContent');
  if (!cont) return;
  if (streamers.length === 0) {
    cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
      <div style="font-size:40px;opacity:0.3;margin-bottom:12px">👩</div>
      No tienes streamers asignados aún.<br>
      <span style="font-size:12px">Contacta al Admin para que asigne streamers a tu agencia.</span>
    </div>`;
    return;
  }
  cont.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">
    ${streamers.map(s=>`
      <div class="card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <div class="card-avatar" style="width:48px;height:48px;font-size:20px">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:14px">@${s.nick||s.nombre}</div>
            <div style="font-size:11px;color:var(--mu)">${s.pais||'—'} · ${s.email||'—'}</div>
          </div>
          <span class="badge ${s.estado==='activo'?'badge-green':s.estado==='suspendido'?'badge-red':'badge-orange'}">${s.estado||'activo'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:12px">
          <div style="text-align:center">
            <div style="color:var(--gold);font-weight:700">${(s.estrellas||0).toLocaleString()}</div>
            <div style="color:var(--mu)">Estrellas</div>
          </div>
          <div style="text-align:center">
            <div style="color:#4ade80;font-weight:700">${s.seguidores||0}</div>
            <div style="color:var(--mu)">Fans</div>
          </div>
          <div style="text-align:center">
            <div style="color:#60A5FA;font-weight:700">${s.liveActivo?'🔴 LIVE':'Offline'}</div>
            <div style="color:var(--mu)">Estado</div>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="agVerPerfil('${s.id}')" class="btn-sm" style="flex:1">Ver perfil</button>
          <button onclick="agContactar('${s.id}','${s.nick||s.nombre}')" class="btn-sm neutral" style="flex:1">💬 Chat</button>
        </div>
      </div>
    `).join('')}
  </div>`;

  window.agVerPerfil = function(uid) {
    const s = window._agStreamers?.find(x=>x.id===uid);
    if (s) toast(`@${s.nick||s.nombre} · ${s.email} · ${s.pais||'—'} · ⭐${s.estrellas||0}`,'info');
  };
  window.agContactar = function(uid, nick) {
    navigate('mensajes');
    toast(`Abriendo chat con @${nick}`,'info');
  };
}

// ── 3. GANANCIAS ─────────────────────────
function ag_ganancias(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>💰 <span>Ganancias</span></h1>
      <p>Comisiones y pagos de tu agencia</p>
    </div>
    <div id="agGanContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  agCargarMisStreamers(p).then(streamers => {
    const totalStars = streamers.reduce((a,s)=>a+(s.estrellas||0),0);
    const comision = Math.floor(totalStars * 0.15);
    const cont = document.getElementById('agGanContent');
    if (!cont) return;
    cont.innerHTML = `
      <div style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#0d0d0d,#1a0800);border:1px solid rgba(212,175,55,0.3);margin-bottom:20px;position:relative;overflow:hidden">
        <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(212,175,55,0.15),transparent 70%)"></div>
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--mu);margin-bottom:8px">Tu comisión disponible (15%)</div>
        <div style="font-family:'Cinzel',serif;font-size:44px;font-weight:900;color:var(--gold)">${comision.toLocaleString()} ⭐</div>
        <div style="font-size:12px;color:var(--mu);margin-top:6px">de ${totalStars.toLocaleString()} ⭐ generadas por tu equipo</div>
        <button onclick="agSolicitarRetiro(${comision})" class="btn-primary" style="margin-top:16px;width:100%;padding:14px">💳 Solicitar retiro</button>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">👩 Streamers</div><div class="stat-value" style="color:#4ade80">${streamers.length}</div></div>
        <div class="stat-card"><div class="stat-label">⭐ Total generado</div><div class="stat-value" style="color:var(--gold)">${totalStars.toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">💰 Tu 15%</div><div class="stat-value" style="color:#22c55e">${comision.toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">💳 Retiros</div><div class="stat-value">0</div></div>
      </div>
      ${agCard(`
        <div class="section-title">📋 Historial de retiros</div>
        <div id="agRetirosList" style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
      `)}
    `;
    agCargarRetiros(p);
  });

  window.agSolicitarRetiro = function(monto) {
    if (monto <= 0) { toast('No tienes saldo disponible','error'); return; }
    const metodo = prompt('Método de pago:\n1. PayPal\n2. Transferencia\n3. Crypto\n\nEscribe el método:');
    if (!metodo) return;
    window.fsAdd?.('retiros', {
      monto, metodo, estado: 'pendiente',
      uid_agencia: p.uid, nick: p.nick||p.nombre
    }).then(()=>{
      toast(`Retiro de ${monto}★ solicitado ✓`,'success');
      agCargarRetiros(p);
    }).catch(()=>toast('Error al solicitar','error'));
  };
}

function agCargarRetiros(p) {
  window.fsGetAll?.('retiros').then(retiros => {
    const cont = document.getElementById('agRetirosList');
    if (!cont) return;
    const misRetiros = retiros?.filter(r => r.uid_agencia === p.uid) || [];
    if (misRetiros.length === 0) {
      cont.textContent = 'No hay retiros solicitados aún.';
      return;
    }
    cont.innerHTML = misRetiros.map(r=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <div>
          <div style="font-weight:600">${r.monto?.toLocaleString()||0} ⭐</div>
          <div style="font-size:11px;color:var(--mu)">${r.metodo} · ${r.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Reciente'}</div>
        </div>
        <span class="badge ${r.estado==='pagado'?'badge-green':r.estado==='rechazado'?'badge-red':'badge-orange'}">${r.estado||'pendiente'}</span>
      </div>
    `).join('');
  }).catch(()=>{});
}

// ── 4. ESTADÍSTICAS ───────────────────────
function ag_estadisticas(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>📊 <span>Estadísticas</span></h1>
    </div>
    <div id="agStatsContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  agCargarMisStreamers(p).then(streamers => {
    const cont = document.getElementById('agStatsContent');
    if (!cont) return;
    const totalStars = streamers.reduce((a,s)=>a+(s.estrellas||0),0);
    const totalFans = streamers.reduce((a,s)=>a+(s.seguidores||0),0);
    cont.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">👩 Streamers</div><div class="stat-value" style="color:#4ade80">${streamers.length}</div></div>
        <div class="stat-card"><div class="stat-label">⭐ Estrellas totales</div><div class="stat-value" style="color:var(--gold)">${totalStars.toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">👥 Fans totales</div><div class="stat-value" style="color:#60A5FA">${totalFans.toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">💰 Comisión (15%)</div><div class="stat-value" style="color:#22c55e">${Math.floor(totalStars*0.15).toLocaleString()}</div></div>
      </div>
      ${agCard(`
        <div class="section-title">👩 Rendimiento por streamer</div>
        ${streamers.length === 0
          ? '<div style="text-align:center;padding:20px;color:var(--mu)">No tienes streamers asignados aún.</div>'
          : streamers.map(s=>{
              const pct = totalStars > 0 ? Math.floor((s.estrellas||0)/totalStars*100) : 0;
              return `
                <div style="margin-bottom:14px">
                  <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                    <span>@${s.nick||s.nombre}</span>
                    <span style="color:var(--gold)">${(s.estrellas||0).toLocaleString()} ⭐ (${pct}%)</span>
                  </div>
                  <div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.05);overflow:hidden">
                    <div style="width:${pct}%;height:100%;background:var(--grad-main);border-radius:3px"></div>
                  </div>
                </div>
              `;
            }).join('')
        }
      `)}
    `;
  });
}

// ── 5. VER LIVES ─────────────────────────
function ag_lives(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>📺 <span>Lives</span></h1>
      <p>Monitorea los lives de tus streamers</p>
    </div>
    <div id="agLivesContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
  `;

  agCargarMisStreamers(p).then(streamers => {
    const cont = document.getElementById('agLivesContent');
    if (!cont) return;
    const enVivo = streamers.filter(s => s.liveActivo);
    cont.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">🔴 En vivo</div><div class="stat-value" style="color:#EF4444">${enVivo.length}</div></div>
        <div class="stat-card"><div class="stat-label">👩 Total equipo</div><div class="stat-value">${streamers.length}</div></div>
      </div>
      ${enVivo.length > 0 ? `
        <div class="section-title" style="margin:16px 0 10px">🔴 Transmitiendo ahora</div>
        ${enVivo.map(s=>`
          <div class="card card-row" style="margin-bottom:10px">
            <div class="card-avatar">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
            <div class="card-info">
              <div class="card-name">@${s.nick||s.nombre}</div>
              <div class="card-sub">${s.pais||'—'}</div>
            </div>
            <span class="badge badge-red">🔴 LIVE</span>
          </div>
        `).join('')}
      ` : agCard(`
        <div style="text-align:center;padding:30px;color:var(--mu)">
          <div style="font-size:40px;opacity:0.3;margin-bottom:12px">📺</div>
          Ninguna de tus streamers está en vivo ahora.
        </div>
      `)}
      ${streamers.length > 0 ? `
        <div class="section-title" style="margin:16px 0 10px">👥 Todo el equipo</div>
        ${streamers.map(s=>`
          <div class="card card-row" style="margin-bottom:8px">
            <div class="card-avatar">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
            <div class="card-info">
              <div class="card-name">@${s.nick||s.nombre}</div>
              <div class="card-sub">⭐ ${(s.estrellas||0).toLocaleString()} · ${s.pais||'—'}</div>
            </div>
            <span class="badge ${s.liveActivo?'badge-red':s.estado==='activo'?'badge-green':'badge-neutral'}">${s.liveActivo?'🔴 LIVE':s.estado||'activo'}</span>
          </div>
        `).join('')}
      ` : ''}
    `;
  });
}

// ── 6. MENSAJES ───────────────────────────
function ag_mensajes(el, p) {
  let chatActivo = null;

  const renderLista = () => {
    agCargarMisStreamers(p).then(streamers => {
      el.innerHTML = `
        <div class="dash-welcome aura-fade-up">
          <h1>💬 <span>Mensajes</span></h1>
          <p>Chat con tus streamers</p>
        </div>
        ${streamers.length === 0 ? agCard(`
          <div style="text-align:center;padding:30px;color:var(--mu)">
            No tienes streamers asignados aún para chatear.
          </div>
        `) : streamers.map(s=>`
          <div onclick="agAbrirChat('${s.id}','${s.nick||s.nombre}')" class="card card-row" style="margin-bottom:8px;cursor:pointer" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
            <div class="card-avatar" style="width:48px;height:48px;font-size:20px">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
            <div class="card-info">
              <div class="card-name">@${s.nick||s.nombre}</div>
              <div class="card-sub">${s.estado==='activo'?'🟢 Activa':'⚫ Offline'}</div>
            </div>
            <span style="color:var(--gold);font-size:18px">›</span>
          </div>
        `).join('')}
      `;
    });
  };

  window.agAbrirChat = function(uid, nick) {
    const chatId = [p.uid, uid].sort().join('_');
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <button onclick="navigate('mensajes')" style="background:none;border:none;color:var(--gold);font-size:22px;cursor:pointer">←</button>
        <div class="card-avatar">${nick[0].toUpperCase()}</div>
        <div style="font-weight:700">@${nick}</div>
      </div>
      <div id="agChatMsgs" style="display:flex;flex-direction:column;gap:8px;min-height:200px;max-height:400px;overflow-y:auto;margin-bottom:16px">
        <div style="text-align:center;color:var(--mu);font-size:12px">Cargando mensajes...</div>
      </div>
      <div style="display:flex;gap:8px">
        <div class="input-group" style="flex:1">
          <input type="text" id="agMsgInput" placeholder="Escribe un mensaje..." onkeydown="if(event.key==='Enter')agEnviarMsg('${chatId}','${nick}','${uid}')">
        </div>
        <button onclick="agEnviarMsg('${chatId}','${nick}','${uid}')" style="padding:0 16px;border-radius:var(--r-lg);background:var(--grad-main);border:none;color:#fff;cursor:pointer;font-size:16px">➤</button>
      </div>
    `;
    agCargarChat(chatId, p);
  };

  window.agCargarChat = function(chatId, perfil) {
    window.fsGetAll?.(`chats_agencia`).then(msgs => {
      const cont = document.getElementById('agChatMsgs');
      if (!cont) return;
      const misMsgs = msgs?.filter(m => m.chatId === chatId) || [];
      if (misMsgs.length === 0) {
        cont.innerHTML = '<div style="text-align:center;color:var(--mu);font-size:12px;padding:20px">No hay mensajes aún. ¡Sé el primero!</div>';
        return;
      }
      cont.innerHTML = misMsgs.map(m=>`
        <div style="display:flex;justify-content:${m.uid_from===perfil.uid?'flex-end':'flex-start'}">
          <div style="max-width:75%;padding:9px 13px;background:${m.uid_from===perfil.uid?'linear-gradient(135deg,#FF1A1A,#8B0000)':'rgba(255,255,255,0.06)'};border-radius:${m.uid_from===perfil.uid?'16px 16px 4px 16px':'16px 16px 16px 4px'};color:#fff;font-size:13px">
            ${m.texto}
          </div>
        </div>
      `).join('');
      cont.scrollTop = cont.scrollHeight;
    }).catch(()=>{});
  };

  window.agEnviarMsg = function(chatId, nick, uid_to) {
    const inp = document.getElementById('agMsgInput');
    if (!inp?.value?.trim()) return;
    const texto = inp.value.trim();
    inp.value = '';
    window.fsAdd?.('chats_agencia', {
      chatId, texto,
      uid_from: p.uid, uid_to,
      nick_from: p.nick||p.nombre, nick_to: nick
    }).then(()=>{
      agCargarChat(chatId, p);
    }).catch(()=>toast('Error al enviar','error'));
  };

  renderLista();
}

// ── 7. METAS ─────────────────────────────
function ag_metas(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🎯 <span>Metas</span></h1>
      <p>Objetivos de tu agencia</p>
    </div>
    <div id="agMetasContent">
      <div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div>
    </div>
    <div style="margin-top:16px">
      <div class="section-title" style="margin-bottom:10px">+ Nueva meta</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="input-group" style="flex:1;min-width:180px">
          <span class="input-icon">🎯</span>
          <input type="text" id="metaTitulo" placeholder="Título de la meta">
        </div>
        <input type="number" id="metaValor" placeholder="Valor objetivo" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:0 12px;font-size:13px;width:120px">
        <button class="btn-sm" style="padding:10px 16px" onclick="agCrearMeta()">+ Crear</button>
      </div>
    </div>
  `;

  window.agCrearMeta = function() {
    const titulo = document.getElementById('metaTitulo')?.value?.trim();
    const valor = document.getElementById('metaValor')?.value;
    if (!titulo || !valor) { toast('Completa título y valor','error'); return; }
    window.fsAdd?.('metas_agencia', {
      titulo, valor_objetivo: parseInt(valor),
      valor_actual: 0, uid_agencia: p.uid, estado: 'activa'
    }).then(()=>{
      document.getElementById('metaTitulo').value='';
      document.getElementById('metaValor').value='';
      toast('Meta creada ✓','success');
      agCargarMetas(p);
    }).catch(()=>toast('Error','error'));
  };

  function agCargarMetas(perfil) {
    if (!document.getElementById('agMetasContent')) return;
    window.fsGetAll?.('metas_agencia').then(metas => {
      const cont = document.getElementById('agMetasContent');
      if (!cont) return;
      const misMetas = metas?.filter(m => m.uid_agencia === perfil.uid) || [];
      if (misMetas.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No tienes metas creadas. Crea tu primera meta abajo.</div>`;
        return;
      }
      cont.innerHTML = misMetas.map(m=>{
        const pct = Math.min(Math.floor((m.valor_actual||0)/(m.valor_objetivo||1)*100), 100);
        return `
          <div class="card" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-weight:600">${m.titulo}</span>
              <span style="color:var(--gold);font-weight:700">${pct}%</span>
            </div>
            <div style="height:8px;border-radius:4px;overflow:hidden;background:rgba(255,255,255,0.05)">
              <div style="width:${pct}%;height:100%;background:${pct>=100?'#22c55e':'var(--grad-main)'};border-radius:4px"></div>
            </div>
            <div style="font-size:11px;color:var(--mu);margin-top:6px">${m.valor_actual||0} / ${m.valor_objetivo}</div>
          </div>
        `;
      }).join('');
    }).catch(()=>{
      const cont = document.getElementById('agMetasContent');
      if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay metas aún.</div>`;
    });
  }
  agCargarMetas(p);
}
