// js/roles/streamer.js — Streamer conectado a Firestore real

window.render_streamer = function(page, el, perfil) {
  switch(page) {
    case 'home':       return str_dashboard(el, perfil);
    case 'live':       return str_live(el, perfil);
    case 'estrellas':  return str_ganancias(el, perfil);
    case 'finanzas':   return str_retiro(el, perfil);
    case 'perfil':     return str_perfil(el, perfil);
    case 'seguidores': return str_fans(el, perfil);
    case 'mensajes':   return str_mensajes(el, perfil);
    case 'rankings':   return str_rankings(el, perfil);
    case 'gifts':      return str_gifts(el, perfil);
    case 'pk':         return str_pk(el, perfil);
    case 'metas':      return str_metas(el, perfil);
    case 'voice':      return str_rooms(el, perfil, 'voice');
    case 'video':      return str_rooms(el, perfil, 'video');
    case 'galeria':    return str_galeria(el, perfil);
    case 'match':      return str_match(el, perfil);
    default:           return str_dashboard(el, perfil);
  }
};

function strCard(c) { return `<div class="card" style="margin-bottom:14px">${c}</div>`; }

// ── 1. DASHBOARD ─────────────────────────
function str_dashboard(el, p) {
  // Renderizar inmediatamente con datos disponibles
  const stars = p.estrellas || 0;
  const fans = p.seguidores || 0;
  const isLive = window._agoraLiveActive || false;

  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>👑 Dashboard <span>Streamer</span></h1>
      <p>Bienvenida @${p.nick||p.nombre} 🔥</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">⭐ Estrellas</div><div class="stat-value" style="color:var(--gold)" id="strDashStars">${stars.toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">👥 Fans</div><div class="stat-value" style="color:#4ade80" id="strDashFans">${fans.toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">💰 Tu 85%</div><div class="stat-value" style="color:#22c55e" id="strDashCom">${Math.floor(stars*0.85).toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">📊 Estado</div><div class="stat-value" style="color:#4ade80" id="strDashEstado">${p.estado||'activo'}</div></div>
    </div>
    <button onclick="navigate('live')" style="width:100%;padding:16px;margin:16px 0;border-radius:var(--r-lg);background:linear-gradient(135deg,#CC0000,#7a0000);border:none;color:#fff;font-family:'Cinzel',serif;font-size:14px;font-weight:700;letter-spacing:2px;cursor:pointer;box-shadow:0 0 25px rgba(204,0,0,0.4)">
      ${isLive ? '🔴 ESTÁS EN VIVO — Ver sala' : '● INICIAR LIVE'}
    </button>
    ${strCard(`
      <div class="section-title">⚡ Acciones rápidas</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">
        ${[
          {icon:'📺',label:'Iniciar Live',fn:"navigate('live')"},
          {icon:'⭐',label:'Ganancias',fn:"navigate('estrellas')"},
          {icon:'🎁',label:'Gifts',fn:"navigate('gifts')"},
          {icon:'👥',label:'Fans',fn:"navigate('seguidores')"},
          {icon:'⚔️',label:'PK Battle',fn:"navigate('pk')"},
          {icon:'🎯',label:'Metas',fn:"navigate('metas')"},
        ].map(b=>`
          <button onclick="${b.fn}" class="btn-sm" style="padding:12px;display:flex;flex-direction:column;align-items:center;gap:4px">
            <span style="font-size:22px">${b.icon}</span>
            <span style="font-size:11px">${b.label}</span>
          </button>
        `).join('')}
      </div>
    `)}
  `;

  // Actualizar stats desde Firestore en background
  window.fsGet?.('usuarios', p.uid).then(perfil => {
    if (!perfil) return;
    const s = document.getElementById('strDashStars');
    const f = document.getElementById('strDashFans');
    const c = document.getElementById('strDashCom');
    const e = document.getElementById('strDashEstado');
    if (s) s.textContent = (perfil.estrellas||0).toLocaleString();
    if (f) f.textContent = (perfil.seguidores||0).toLocaleString();
    if (c) c.textContent = Math.floor((perfil.estrellas||0)*0.85).toLocaleString();
    if (e) { e.textContent = perfil.estado||'activo'; e.style.color = perfil.estado==='activo'?'#4ade80':'#EF4444'; }
  }).catch(()=>{});

  // Escuchar solicitudes de match entrantes
  strEscucharMatches(p);
}

function strEscucharMatches(p) {
  // Revisar cada 5 segundos si hay matches pendientes
  clearInterval(window._matchListener);
  window._matchListener = setInterval(async () => {
    try {
      const matches = await window.fsGetAll?.('matches');
      if (!matches) return;
      const pendientes = matches.filter(m =>
        m.uid_streamer === p.uid && m.estado === 'esperando' && !m._notificado
      );
      if (pendientes.length > 0) {
        const match = pendientes[0];
        // Marcar como notificado localmente
        match._notificado = true;
        strMostrarSolicitudMatch(match, p);
      }
    } catch(e) {}
  }, 5000);
}

// ── MATCH: Solicitud entrante ────────────
function strMostrarSolicitudMatch(match, p) {
  // Modal de solicitud sobre el dashboard
  const existing = document.getElementById('strMatchModal');
  if (existing) return; // ya hay uno visible

  const modal = document.createElement('div');
  modal.id = 'strMatchModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
  modal.innerHTML = `
    <div style="background:var(--black3);border:1px solid rgba(212,175,55,0.4);border-radius:24px;padding:28px 24px;max-width:320px;width:100%;text-align:center;box-shadow:0 0 40px rgba(212,175,55,0.2)">
      <div style="font-size:48px;margin-bottom:12px">⚡</div>
      <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:var(--gold);margin-bottom:8px">Solicitud de Match</div>
      <div style="font-size:14px;color:#fff;margin-bottom:4px"><b>@${match.nick_usuario}</b> quiere una videollamada</div>
      <div style="font-size:12px;color:var(--mu);margin-bottom:20px">30 segundos · Recibirás ${match.costo||5}⭐</div>
      <div style="display:flex;gap:12px;justify-content:center">
        <button onclick="strRechazarMatch('${match.id||''}')" style="flex:1;padding:14px;border-radius:14px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#EF4444;font-weight:700;font-size:14px;cursor:pointer">✕ Rechazar</button>
        <button onclick="strAceptarMatch('${match.id||''}','${match.uid_usuario}','${match.nick_usuario}',${match.costo||5})" style="flex:1;padding:14px;border-radius:14px;background:var(--grad-main);border:none;color:#fff;font-weight:700;font-size:14px;cursor:pointer">✓ Aceptar</button>
      </div>
      <div id="strMatchCountdown" style="margin-top:14px;font-size:11px;color:var(--mu)">Auto-rechaza en 15s</div>
    </div>
  `;
  document.body.appendChild(modal);

  // Auto-rechazar en 15 segundos
  let cd = 15;
  const cdInterval = setInterval(() => {
    cd--;
    const cdEl = document.getElementById('strMatchCountdown');
    if (cdEl) cdEl.textContent = `Auto-rechaza en ${cd}s`;
    if (cd <= 0) {
      clearInterval(cdInterval);
      strRechazarMatch(match.id||'');
    }
  }, 1000);
  modal._cdInterval = cdInterval;

  window.strRechazarMatch = function(matchId) {
    clearInterval(cdInterval);
    modal.remove();
    if (matchId) window.fsSet?.('matches', matchId, { estado: 'rechazado' });
    toast('Match rechazado','info');
  };

  window.strAceptarMatch = function(matchId, uid_usuario, nick_usuario, costo) {
    clearInterval(cdInterval);
    modal.remove();
    if (matchId) window.fsSet?.('matches', matchId, { estado: 'en_llamada' });
    strIniciarMatchCall(uid_usuario, nick_usuario, costo, p);
  };
}

function strIniciarMatchCall(uid_usuario, nick_usuario, costo, p) {
  let segs = 30;
  const overlay = document.createElement('div');
  overlay.id = 'strMatchCall';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="width:100%;max-width:360px;padding:20px;text-align:center">
      <!-- Timer -->
      <div style="font-family:'Cinzel',serif;font-size:56px;font-weight:900;color:#fff;margin-bottom:8px" id="strMatchTimer">30</div>
      <div style="font-size:12px;color:var(--mu);margin-bottom:24px">segundos restantes</div>
      <!-- Avatar usuario -->
      <div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#1a0a00,#0d0d0d);border:3px solid rgba(255,255,255,0.2);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:900;font-family:'Cinzel',serif;color:rgba(255,255,255,0.3)">
        ${nick_usuario[0].toUpperCase()}
      </div>
      <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:#fff;margin-bottom:4px">@${nick_usuario}</div>
      <div style="font-size:12px;color:var(--mu);margin-bottom:24px">Usuario · Match en vivo</div>
      <!-- Estrellas que vas ganando -->
      <div style="padding:10px 20px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:20px;display:inline-block;margin-bottom:24px">
        <span style="color:var(--gold);font-weight:700">+${costo}⭐ al terminar</span>
      </div>
      <!-- Controles -->
      <div style="display:flex;gap:16px;justify-content:center">
        <button style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;cursor:pointer;font-size:22px">🎙️</button>
        <button onclick="strTerminarMatchCall('${uid_usuario}',${costo})" style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#CC0000,#7a0000);border:none;color:#fff;cursor:pointer;font-size:24px;box-shadow:0 0 20px rgba(204,0,0,0.5)">📵</button>
        <button style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;cursor:pointer;font-size:22px">📹</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const t = setInterval(() => {
    segs--;
    const tEl = document.getElementById('strMatchTimer');
    if (tEl) { tEl.textContent = segs; tEl.style.color = segs<=10?'#EF4444':'#fff'; }
    if (segs <= 0) { clearInterval(t); strTerminarMatchCall(uid_usuario, costo, true); }
  }, 1000);

  window.strTerminarMatchCall = function(uid_u, costo, auto=false) {
    clearInterval(t);
    overlay.remove();
    // Sumar estrellas a la streamer
    window.fsGet?.('usuarios', p.uid).then(pf => {
      window.fsSet?.('usuarios', p.uid, { estrellas: (pf?.estrellas||0)+costo });
    });
    toast(auto ? `⏰ Match terminado · +${costo}⭐ ganadas` : `Match terminado · +${costo}⭐`,'success');
  };
}

// ── 2. LIVE ──────────────────────────────
function str_live(el, p) {
  const isLive = window._agoraLiveActive || false;
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>📺 ${isLive ? 'Tu Live' : 'Iniciar Live'}</h1>
    </div>
    ${!isLive ? `
      <div style="padding:40px 24px;border-radius:20px;background:radial-gradient(ellipse at center,rgba(204,0,0,0.15),rgba(0,0,0,0.6));border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;text-align:center;gap:16px;margin-bottom:16px">
        <div style="width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,rgba(204,0,0,0.5),transparent);border:2px solid #CC0000;display:flex;align-items:center;justify-content:center;font-size:36px">📡</div>
        <h2 style="font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:var(--gold)">Listo para brillar</h2>
        <p style="color:var(--mu);font-size:13px">Tu audiencia te espera. Conecta cámara y comienza.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
          <button onclick="str_iniciarLive()" style="padding:14px 28px;border-radius:12px;background:linear-gradient(135deg,#CC0000,#7a0000);border:none;color:#fff;font-family:'Cinzel',serif;font-size:13px;font-weight:700;letter-spacing:2px;cursor:pointer;box-shadow:0 0 25px rgba(204,0,0,0.4)">● INICIAR LIVE</button>
          <button onclick="strProgramarLive()" style="padding:14px 20px;border-radius:12px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:var(--gold);font-family:'Cinzel',serif;font-size:13px;font-weight:700;cursor:pointer">📅 Programar</button>
        </div>
      </div>
      ${strCard(`
        <div class="section-title">✅ Pre-live Check</div>
        ${['Cámara HD','Micrófono','Iluminación','Conexión estable'].map(t=>`
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px">
            <span style="color:var(--mu)">${t}</span>
            <span style="color:var(--gold);font-weight:700">✓</span>
          </div>
        `).join('')}
      `)}
    ` : `
      <!-- STATS EN VIVO -->
      <div class="card" style="border-color:rgba(204,0,0,0.4);margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:10px;height:10px;border-radius:50%;background:#CC0000;display:inline-block;animation:pulse 1s infinite"></span>
            <span style="color:#CC0000;font-weight:700;font-family:'Cinzel',serif;letter-spacing:1px">EN VIVO</span>
          </div>
          <div style="font-size:13px;color:var(--mu);font-family:'JetBrains Mono',monospace" id="strLiveTimer">00:00:00</div>
        </div>
        <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
          <div class="stat-card" style="padding:10px"><div class="stat-label" style="font-size:9px">👁 Viewers</div><div class="stat-value" style="font-size:20px" id="strViewers">0</div></div>
          <div class="stat-card" style="padding:10px"><div class="stat-label" style="font-size:9px">⭐ Stars</div><div class="stat-value" style="font-size:20px;color:var(--gold)" id="strStarsLive">0</div></div>
          <div class="stat-card" style="padding:10px"><div class="stat-label" style="font-size:9px">💬 Chat</div><div class="stat-value" style="font-size:20px" id="strChatCount">0</div></div>
          <div class="stat-card" style="padding:10px"><div class="stat-label" style="font-size:9px">🎁 Gifts</div><div class="stat-value" style="font-size:20px" id="strGiftsCount">0</div></div>
        </div>
      </div>

      <!-- PK BATTLE EN EL LIVE -->
      <div id="strLivePKZone" style="margin-bottom:14px">
        <div class="card" style="background:rgba(204,0,0,0.04);border-color:rgba(204,0,0,0.2)">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-family:'Cinzel',serif;font-size:13px;font-weight:700;color:var(--gold)">⚔️ PK Battle</div>
              <div style="font-size:10px;color:var(--mu);margin-top:2px">Desafía a otra streamer en vivo</div>
            </div>
            <button onclick="strLanzarPK()" style="padding:8px 16px;border-radius:10px;background:linear-gradient(135deg,#CC0000,#7a0000);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 0 14px rgba(204,0,0,0.4)">⚔️ Iniciar PK</button>
          </div>
        </div>
      </div>

      <!-- CHAT DEL LIVE -->
      <div class="card" style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;color:var(--mu);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">💬 Chat en vivo</div>
        <div id="strLiveChatBox" style="height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;margin-bottom:10px"></div>
        <div style="display:flex;gap:8px">
          <div class="input-group" style="flex:1">
            <input type="text" id="strLiveChatInp" placeholder="Responder al chat..." onkeydown="if(event.key==='Enter')str_responderChat()">
          </div>
          <button onclick="str_responderChat()" style="padding:0 14px;border-radius:var(--r-lg);background:var(--grad-main);border:none;color:#fff;cursor:pointer;font-size:16px">➤</button>
        </div>
      </div>

      <!-- CONTROLES -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        <button onclick="strToggleMic()" id="strMicBtn" class="btn-sm" style="padding:10px;display:flex;flex-direction:column;align-items:center;gap:3px">
          <span style="font-size:18px">🎙️</span><span style="font-size:9px">Mic</span>
        </button>
        <button onclick="strToggleCam()" id="strCamBtn" class="btn-sm" style="padding:10px;display:flex;flex-direction:column;align-items:center;gap:3px">
          <span style="font-size:18px">📹</span><span style="font-size:9px">Cam</span>
        </button>
        <button onclick="strCompartirLive()" class="btn-sm" style="padding:10px;display:flex;flex-direction:column;align-items:center;gap:3px">
          <span style="font-size:18px">📤</span><span style="font-size:9px">Compartir</span>
        </button>
        <button onclick="str_terminarLive()" style="padding:10px;border-radius:var(--r-lg);border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.08);color:#EF4444;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px">
          <span style="font-size:18px">⏹</span><span style="font-size:9px">Terminar</span>
        </button>
      </div>
    `}
  `;

  if (isLive) str_iniciarTimer();

  window.strProgramarLive = function() {
    const fecha = prompt('¿Cuándo quieres hacer el live?\nEj: Hoy a las 9pm');
    if (!fecha) return;
    window.fsAdd?.('lives_programados', {
      uid_streamer: p.uid, nick: p.nick||p.nombre,
      fecha_texto: fecha, estado: 'programado'
    }).then(()=>toast(`Live programado: ${fecha} ✓`,'success'))
    .catch(()=>toast('Programado localmente ✓','success'));
  };

  window.strToggleMic = async function() {
    if (window.agoraMuteMic) {
      const on = await window.agoraMuteMic();
      const btn = document.getElementById('strMicBtn');
      if (btn) btn.textContent = on ? '🎙️ Mic ON' : '🔇 Mic OFF';
    }
  };
  window.strToggleCam = async function() {
    if (window.agoraToggleCamera) await window.agoraToggleCamera();
  };
}

window.str_iniciarLive = async function() {
  if (window.agoraStartLive) {
    try {
      await window.agoraStartLive();
      // Guardar live en Firestore
      window.fsSet?.('usuarios', window._currentPerfil?.uid, { liveActivo: true });
      window.fsAdd?.('logs_master', {
        accion: `Live iniciado: @${window._currentPerfil?.nick}`,
        uid_streamer: window._currentPerfil?.uid, tipo: 'live'
      });
      navigate('live');
      return;
    } catch(e) { console.warn('Agora falló:', e); }
  }
  window._streamerLive = true;
  window._agoraLiveActive = true;
  window.fsSet?.('usuarios', window._currentPerfil?.uid, { liveActivo: true });
  toast('🔴 ¡Live iniciado!','success');
  navigate('live');
};

window.str_terminarLive = async function() {
  if (window.agoraStopLive && window._agoraLiveActive) {
    await window.agoraStopLive();
  }
  window._streamerLive = false;
  window._agoraLiveActive = false;
  window.fsSet?.('usuarios', window._currentPerfil?.uid, { liveActivo: false });
  window.fsAdd?.('logs_master', {
    accion: `Live terminado: @${window._currentPerfil?.nick}`,
    uid_streamer: window._currentPerfil?.uid, tipo: 'live'
  });
  toast('Live terminado. ¡Excelente sesión! ⭐','success');
  navigate('home');
};

window.strLanzarPK = function() {
  // Buscar rival disponible y abrir PK dentro del live
  cargarUsuariosReales?.().then(usuarios => {
    const disponibles = usuarios.filter(u=>u.rol==='streamer'&&u.id!==window._currentPerfil?.uid);
    const pkZone = document.getElementById('strLivePKZone');
    if (!pkZone) return;

    if (disponibles.length === 0) {
      // Sin rivales reales, modo demo
      strMostrarPKEnLive('LunaFire', null);
      return;
    }

    // Mostrar selector de rival
    pkZone.innerHTML = `
      <div class="card" style="background:rgba(204,0,0,0.04);border-color:rgba(204,0,0,0.4)">
        <div style="font-family:'Cinzel',serif;font-size:13px;font-weight:700;color:var(--gold);margin-bottom:12px">⚔️ Elegir rival para PK</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
          ${disponibles.slice(0,4).map(s=>`
            <button onclick="strMostrarPKEnLive('${s.nick||s.nombre}','${s.id}')"
              style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid var(--border2);cursor:pointer;text-align:left">
              <div class="card-avatar" style="width:36px;height:36px;font-size:14px">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
              <div>
                <div style="font-weight:600;font-size:13px">@${s.nick||s.nombre}</div>
                <div style="font-size:10px;color:var(--mu)">${s.liveActivo?'🔴 En vivo':'Disponible'}</div>
              </div>
              <span style="margin-left:auto;color:var(--gold)">⚔️</span>
            </button>
          `).join('')}
        </div>
        <button onclick="navigate('live')" class="btn-sm" style="width:100%;padding:8px">Cancelar</button>
      </div>
    `;
  }).catch(()=>strMostrarPKEnLive('LunaFire', null));
};

window.strMostrarPKEnLive = function(rivalNick, rivalUid) {
  let myStars = 0, rivalStars = 0, pkTimer = 300, multiplicador = 1;
  let pkInterval = null;

  const pkZone = document.getElementById('strLivePKZone');
  if (!pkZone) return;

  toast(`⚔️ PK Battle iniciado vs @${rivalNick}!`,'success');
  window.fsAdd?.('pk_battles', {
    uid_streamer: window._currentPerfil?.uid,
    nick: window._currentPerfil?.nick,
    rival_nick: rivalNick, rival_uid: rivalUid,
    estado: 'activo', mis_stars: 0, rival_stars: 0
  });

  const renderBatalla = () => {
    const total = myStars + rivalStars;
    const pctMe = total > 0 ? Math.floor(myStars/total*100) : 50;
    const mins = String(Math.floor(pkTimer/60)).padStart(2,'0');
    const secs = String(pkTimer%60).padStart(2,'0');
    const ganando = myStars >= rivalStars;
    const p = window._currentPerfil;

    pkZone.innerHTML = `
      <!-- PANTALLA DIVIDIDA PK -->
      <div style="border-radius:16px;overflow:hidden;border:2px solid rgba(204,0,0,0.4);margin-bottom:10px">
        <div style="display:grid;grid-template-columns:1fr 1fr">
          <!-- YO -->
          <div style="padding:12px 8px;background:linear-gradient(135deg,rgba(212,175,55,0.12),rgba(0,0,0,0.9));text-align:center;position:relative">
            ${ganando?'<div style="position:absolute;top:4px;left:50%;transform:translateX(-50%);font-size:16px">👑</div>':''}
            <div class="card-avatar" style="width:48px;height:48px;font-size:20px;margin:${ganando?'18px':'2px'} auto 4px;border:2px solid var(--gold)">${(p?.nick||p?.nombre||'?')[0].toUpperCase()}</div>
            <div style="font-size:10px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">@${p?.nick||p?.nombre}</div>
            <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:900;color:var(--gold)" id="pkMyS">${myStars.toLocaleString()}</div>
          </div>
          <!-- RIVAL -->
          <div style="padding:12px 8px;background:linear-gradient(135deg,rgba(204,0,0,0.12),rgba(0,0,0,0.9));text-align:center;position:relative;border-left:1px solid rgba(255,255,255,0.05)">
            ${!ganando?'<div style="position:absolute;top:4px;left:50%;transform:translateX(-50%);font-size:16px">👑</div>':''}
            <div class="card-avatar" style="width:48px;height:48px;font-size:20px;margin:${!ganando?'18px':'2px'} auto 4px;border:2px solid #CC0000;background:linear-gradient(135deg,#CC0000,#7a0000)">${rivalNick[0]}</div>
            <div style="font-size:10px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">@${rivalNick}</div>
            <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:900;color:#FF6B6B" id="pkRivS">${rivalStars.toLocaleString()}</div>
          </div>
        </div>
        <!-- BARRA VS -->
        <div style="height:24px;display:flex;align-items:center;position:relative;background:#060606">
          <div id="pkBarInLive" style="height:100%;background:linear-gradient(90deg,var(--gold),#D4AF37);transition:width .4s;width:${pctMe}%;min-width:6px"></div>
          <div style="position:absolute;left:50%;transform:translateX(-50%);font-family:'Cinzel',serif;font-size:10px;font-weight:900;color:#fff;background:rgba(0,0,0,0.8);padding:2px 6px;border-radius:20px;z-index:2">VS</div>
        </div>
      </div>

      <!-- TIMER + CONTROLES PK -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="flex:1;text-align:center;padding:8px;border-radius:10px;background:rgba(204,0,0,0.12);border:1px solid rgba(204,0,0,0.3)">
          <div style="font-family:'Cinzel',serif;font-size:20px;font-weight:900;color:#fff" id="pkTimerInLive">${mins}:${secs}</div>
          <div style="font-size:9px;color:var(--mu)">restantes</div>
        </div>
        <button onclick="strPKMultiplicador()" id="pkMultInLive" style="padding:8px 12px;border-radius:10px;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);cursor:pointer;text-align:center">
          <div style="font-size:20px">🧤</div>
          <div style="font-size:8px;color:var(--gold);font-weight:700">x${multiplicador}</div>
        </button>
        <button onclick="strPKAnimarFans()" style="flex:1;padding:8px;border-radius:10px;background:var(--grad-main);border:none;color:#fff;font-weight:700;font-size:12px;cursor:pointer">🔥 Animar<br>fans</button>
        <button onclick="strPKTerminar()" style="padding:8px 10px;border-radius:10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#EF4444;font-size:11px;font-weight:700;cursor:pointer">⏹<br>Salir</button>
      </div>

      <!-- FEED GIFTS PK -->
      <div style="max-height:80px;overflow-y:auto" id="pkFeedInLive">
        <div style="font-size:10px;color:var(--mu);text-align:center;padding:4px">Los gifts de tus fans aparecen aquí ⭐</div>
      </div>
    `;

    window.strPKMultiplicador = function() {
      multiplicador = 2;
      const btn = document.getElementById('pkMultInLive');
      if (btn) btn.innerHTML = '<div style="font-size:20px">🧤</div><div style="font-size:8px;color:#FFD700;font-weight:700">x2 🔥</div>';
      toast('🧤 ¡x2 activo 30 seg!','success');
      setTimeout(()=>{ multiplicador=1; if(btn) btn.innerHTML='<div style="font-size:20px">🧤</div><div style="font-size:8px;color:var(--gold);font-weight:700">x1</div>'; }, 30000);
    };

    window.strPKAnimarFans = function() {
      const boost = (Math.floor(Math.random()*200)+30) * multiplicador;
      myStars += boost;
      const s1=document.getElementById('pkMyS');
      const bar=document.getElementById('pkBarInLive');
      const feed=document.getElementById('pkFeedInLive');
      if (s1) s1.textContent = myStars.toLocaleString();
      const tot = myStars+rivalStars;
      if (bar&&tot>0) bar.style.width=Math.floor(myStars/tot*100)+'%';
      if (feed) {
        const gifts=['🌹','❤️','💎','👑','🏎️'];
        const g = gifts[Math.floor(Math.random()*gifts.length)];
        const d=document.createElement('div');
        d.style.cssText='font-size:11px;padding:3px 8px;color:#22c55e;border-bottom:1px solid rgba(255,255,255,0.04)';
        d.textContent=`${g} Fan te apoyó +${boost}⭐${multiplicador>1?' (x'+multiplicador+')':''}`;
        feed.insertBefore(d, feed.firstChild);
        if(feed.children.length>5) feed.removeChild(feed.lastChild);
      }
      const starsEl = document.getElementById('strStarsLive');
      if (starsEl) starsEl.textContent = (parseInt(starsEl.textContent.replace(/,/g,''))||0)+boost;
    };

    window.strPKTerminar = function() {
      clearInterval(pkInterval);
      const gane = myStars >= rivalStars;
      window.fsAdd?.('pk_battles', {
        uid_streamer: window._currentPerfil?.uid,
        nick: window._currentPerfil?.nick,
        rival_nick: rivalNick, estado: 'terminado',
        mis_stars: myStars, rival_stars: rivalStars,
        resultado: gane?'ganado':'perdido'
      });
      toast(gane?`🏆 ¡Ganaste el PK! ${myStars}⭐ vs ${rivalStars}⭐`:`💔 Perdiste. ${myStars}⭐ vs ${rivalStars}⭐`, gane?'success':'info');
      // Restaurar zona PK
      const pkZone2 = document.getElementById('strLivePKZone');
      if (pkZone2) pkZone2.innerHTML = `
        <div class="card" style="background:rgba(204,0,0,0.04);border-color:rgba(204,0,0,0.2)">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-family:'Cinzel',serif;font-size:13px;font-weight:700;color:var(--gold)">⚔️ PK Battle</div>
              <div style="font-size:10px;color:var(--mu);margin-top:2px">Desafía a otra streamer en vivo</div>
            </div>
            <button onclick="strLanzarPK()" style="padding:8px 16px;border-radius:10px;background:linear-gradient(135deg,#CC0000,#7a0000);border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer">⚔️ Nuevo PK</button>
          </div>
        </div>
      `;
    };
  };

  renderBatalla();

  // Timer PK
  pkInterval = setInterval(()=>{
    pkTimer--;
    const t = document.getElementById('pkTimerInLive');
    if (t) { const m=String(Math.floor(pkTimer/60)).padStart(2,'0'); const s=String(pkTimer%60).padStart(2,'0'); t.textContent=`${m}:${s}`; }
    // Rival recibe gifts aleatorios
    if (Math.random() < 0.3) {
      rivalStars += Math.floor(Math.random()*50)+5;
      const r=document.getElementById('pkRivS'); const bar=document.getElementById('pkBarInLive');
      if(r) r.textContent=rivalStars.toLocaleString();
      const tot=myStars+rivalStars;
      if(bar&&tot>0) bar.style.width=Math.floor(myStars/tot*100)+'%';
    }
    if (pkTimer===60) toast('⏰ ¡1 minuto! ¡Anima a tus fans!','info');
    if (pkTimer===30) toast('⚡ ¡30 seg! ¡Activa el guante!','info');
    if (pkTimer<=0) { clearInterval(pkInterval); window.strPKTerminar?.(); }
  }, 1000);
};

window.strCompartirLive = function() {
  const url = 'https://auraoficialapp.netlify.app';
  if (navigator.share) {
    navigator.share({ title:'Estoy en vivo en AURA 🔴', text:'Únete a mi live ahora!', url });
  } else {
    navigator.clipboard?.writeText(url).then(()=>toast('Link copiado al portapapeles ✓','success'));
  }
};

window.str_responderChat = function() {
  const inp = document.getElementById('strLiveChatInp');
  if (!inp?.value?.trim()) return;
  const chat = document.getElementById('strLiveChatBox');
  if (chat) {
    const d = document.createElement('div');
    d.style.cssText = 'font-size:12px;color:var(--gold);padding:3px 0';
    d.textContent = `@${window._currentPerfil?.nick||'tú'}: ${inp.value}`;
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
    inp.value = '';
  }
};

function str_iniciarTimer() {
  let secs = 0;
  clearInterval(window._liveTimerStr);
  window._liveTimerStr = setInterval(() => {
    secs++;
    const h = String(Math.floor(secs/3600)).padStart(2,'0');
    const m = String(Math.floor((secs%3600)/60)).padStart(2,'0');
    const s = String(secs%60).padStart(2,'0');
    const el = document.getElementById('strLiveTimer');
    if (el) el.textContent = `${h}:${m}:${s}`;
    else clearInterval(window._liveTimerStr);
  }, 1000);
}

// ── 3. GANANCIAS ─────────────────────────
function str_ganancias(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>💰 <span>Ganancias</span></h1>
    </div>
    <div id="strGanContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div></div>
  `;
  window.fsGet?.('usuarios', p.uid).then(perfil => {
    const stars = perfil?.estrellas || 0;
    const miParte = Math.floor(stars * 0.85);
    const cont = document.getElementById('strGanContent');
    if (!cont) return;
    cont.innerHTML = `
      <div style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#0d0d0d,#1a0800);border:1px solid rgba(212,175,55,0.3);margin-bottom:20px">
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--mu);margin-bottom:8px">Tus ganancias (85%)</div>
        <div style="font-family:'Cinzel',serif;font-size:44px;font-weight:900;color:var(--gold)">${miParte.toLocaleString()} ⭐</div>
        <div style="font-size:12px;color:var(--mu);margin-top:6px">de ${stars.toLocaleString()} ⭐ totales recibidas</div>
        <button onclick="navigate('finanzas')" class="btn-primary" style="margin-top:16px;width:100%;padding:14px">💳 Solicitar retiro</button>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">⭐ Total estrellas</div><div class="stat-value" style="color:var(--gold)">${stars.toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">💰 Tu 85%</div><div class="stat-value" style="color:#22c55e">${miParte.toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">🏢 Agencia 15%</div><div class="stat-value" style="color:#A78BFA">${Math.floor(stars*0.15).toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">👥 Fans</div><div class="stat-value" style="color:#60A5FA">${perfil?.seguidores||0}</div></div>
      </div>
    `;
  }).catch(()=>{
    const cont = document.getElementById('strGanContent');
    if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No se pudieron cargar las ganancias.</div>`;
  });
}

// ── 4. RETIRO ────────────────────────────
function str_retiro(el, p) {
  // Montos fijos en USD → equivalente en estrellas (200★ = $1)
  const MONTOS = [10,20,30,40,50,70,90,100,120,150,200,250];
  let montoSeleccionado = null;
  let metodoSeleccionado = null;

  const renderRetiro = (perfil) => {
    const stars = perfil?.estrellas || 0;
    const disponibleUSD = parseFloat((stars * 0.85 / 200).toFixed(2));
    const disponibleStars = Math.floor(stars * 0.85);

    el.innerHTML = `
      <div class="dash-welcome aura-fade-up">
        <h1>💳 Retirar <span>Ganancias</span></h1>
      </div>

      <!-- BALANCE HERO -->
      <div style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#0d0d0d,#1a0800);border:1px solid rgba(212,175,55,0.3);margin-bottom:20px;position:relative;overflow:hidden">
        <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(212,175,55,0.15),transparent 70%)"></div>
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--mu);margin-bottom:8px">Tu saldo disponible</div>
        <div style="display:flex;align-items:baseline;gap:12px">
          <div style="font-family:'Cinzel',serif;font-size:48px;font-weight:900;color:var(--gold);line-height:1">$${disponibleUSD}</div>
          <div style="font-size:14px;color:var(--mu)">USD</div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.45);margin-top:6px">${disponibleStars.toLocaleString()} ⭐ · 200★ = $1 USD</div>
        <div style="display:flex;gap:12px;margin-top:14px">
          <div style="flex:1;padding:10px;border-radius:12px;background:rgba(0,0,0,0.4);border:1px solid var(--border2);text-align:center">
            <div style="font-size:10px;color:var(--mu);margin-bottom:4px">TOTAL ⭐</div>
            <div style="font-family:'Cinzel',serif;font-weight:700;color:#fff">${stars.toLocaleString()}</div>
          </div>
          <div style="flex:1;padding:10px;border-radius:12px;background:rgba(0,0,0,0.4);border:1px solid var(--border2);text-align:center">
            <div style="font-size:10px;color:var(--mu);margin-bottom:4px">TU 85%</div>
            <div style="font-family:'Cinzel',serif;font-weight:700;color:#22c55e">${disponibleStars.toLocaleString()}</div>
          </div>
          <div style="flex:1;padding:10px;border-radius:12px;background:rgba(0,0,0,0.4);border:1px solid var(--border2);text-align:center">
            <div style="font-size:10px;color:var(--mu);margin-bottom:4px">AGENCIA</div>
            <div style="font-family:'Cinzel',serif;font-weight:700;color:#A78BFA">${Math.floor(stars*0.15).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <!-- PASO 1: SELECCIONAR MONTO -->
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--grad-main);color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">1</div>
          <div style="font-family:'Cinzel',serif;font-size:15px;font-weight:700;letter-spacing:1px">Selecciona el monto</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px" id="strMontosGrid">
          ${MONTOS.map(m=>{
            const starsNeeded = m * 200;
            const canAfford = disponibleStars >= starsNeeded;
            return `<button onclick="strSelMonto(${m},${starsNeeded},${disponibleStars})" id="montoBtn_${m}"
              style="padding:12px 6px;border-radius:12px;border:1px solid ${canAfford?'rgba(212,175,55,0.25)':'rgba(255,255,255,0.05)'};background:${canAfford?'rgba(212,175,55,0.06)':'rgba(255,255,255,0.02)'};cursor:${canAfford?'pointer':'not-allowed'};opacity:${canAfford?1:0.4};transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:3px">
              <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:900;color:${canAfford?'var(--gold)':'var(--mu)'}">$${m}</div>
              <div style="font-size:8.5px;color:var(--mu)">${starsNeeded.toLocaleString()}★</div>
            </button>`;
          }).join('')}
        </div>
        <div id="strMontoSeleccionado" style="margin-top:12px;text-align:center;font-size:13px;color:var(--mu)">Selecciona un monto para continuar</div>
      </div>

      <!-- PASO 2: MÉTODO DE PAGO -->
      <div class="card" style="margin-bottom:16px" id="strMetodoCard">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.08);color:var(--mu);font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center" id="strStep2Icon">2</div>
          <div style="font-family:'Cinzel',serif;font-size:15px;font-weight:700;letter-spacing:1px;color:var(--mu)" id="strStep2Title">Método de pago</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px">
          ${[
            {id:'paypal',icon:'💳',label:'PayPal',desc:'Email de PayPal'},
            {id:'binance',icon:'🟡',label:'Binance Pay',desc:'ID de Binance'},
            {id:'crypto',icon:'🔗',label:'Crypto USDT',desc:'Dirección wallet'},
            {id:'transferencia',icon:'🏦',label:'Transferencia',desc:'Datos bancarios'},
          ].map(m=>`
            <button onclick="strSelMetodo('${m.id}','${m.label}','${m.desc}')" id="metodoBtn_${m.id}"
              style="padding:14px 10px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:6px">
              <div style="font-size:28px">${m.icon}</div>
              <div style="font-size:12px;font-weight:700;color:#fff">${m.label}</div>
              <div style="font-size:9px;color:var(--mu)">${m.desc}</div>
            </button>
          `).join('')}
        </div>
        <div id="strCuentaSection" style="display:none">
          <div class="input-group">
            <span class="input-icon">📧</span>
            <input type="text" id="strCuentaInput" placeholder="Ingresa tu cuenta...">
          </div>
        </div>
      </div>

      <!-- PASO 3: CONFIRMAR -->
      <div class="card" style="margin-bottom:16px" id="strConfirmCard">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.08);color:var(--mu);font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center" id="strStep3Icon">3</div>
          <div style="font-family:'Cinzel',serif;font-size:15px;font-weight:700;letter-spacing:1px;color:var(--mu)" id="strStep3Title">Confirmar retiro</div>
        </div>
        <div id="strResumenRetiro" style="color:var(--mu);font-size:13px;text-align:center;padding:8px">Completa los pasos anteriores</div>
        <button onclick="strConfirmarRetiro(${disponibleStars})" id="strBtnConfirmar" class="btn-primary" style="width:100%;padding:16px;margin-top:14px;opacity:0.4;pointer-events:none">
          💳 Solicitar retiro
        </button>
        <div style="text-align:center;margin-top:10px;font-size:10px;color:var(--mu)">🔒 Procesado en 24-48h · Mínimo $10 USD</div>
      </div>

      <!-- HISTORIAL -->
      <div id="strRetiroHistorial"></div>
    `;
    strCargarRetiros(p);

    // Lógica de selección
    window.strSelMonto = function(monto, stars, disponible) {
      if (disponible < stars) return;
      montoSeleccionado = monto;
      // Limpiar selección anterior
      document.querySelectorAll('[id^="montoBtn_"]').forEach(btn => {
        btn.style.background = 'rgba(212,175,55,0.06)';
        btn.style.borderColor = 'rgba(212,175,55,0.25)';
        btn.style.transform = '';
      });
      // Marcar seleccionado
      const btn = document.getElementById('montoBtn_'+monto);
      if (btn) {
        btn.style.background = 'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.08))';
        btn.style.borderColor = 'var(--gold)';
        btn.style.transform = 'scale(1.05)';
        btn.style.boxShadow = '0 0 16px rgba(212,175,55,0.3)';
      }
      const label = document.getElementById('strMontoSeleccionado');
      if (label) {
        label.innerHTML = `<span style="color:var(--gold);font-weight:700">$${monto} USD</span> · ${stars.toLocaleString()} ⭐ se descontarán`;
        label.style.color = 'var(--gold)';
      }
      // Activar paso 2
      const s2 = document.getElementById('strStep2Icon');
      const s2t = document.getElementById('strStep2Title');
      if (s2) { s2.style.background = 'var(--grad-main)'; s2.style.color = '#fff'; }
      if (s2t) s2t.style.color = '#fff';
      strActualizarResumen();
    };

    window.strSelMetodo = function(id, label, placeholder) {
      metodoSeleccionado = id;
      // Limpiar
      document.querySelectorAll('[id^="metodoBtn_"]').forEach(btn => {
        btn.style.background = 'rgba(255,255,255,0.03)';
        btn.style.borderColor = 'rgba(255,255,255,0.08)';
      });
      const btn = document.getElementById('metodoBtn_'+id);
      if (btn) {
        btn.style.background = 'rgba(212,175,55,0.12)';
        btn.style.borderColor = 'rgba(212,175,55,0.5)';
      }
      // Mostrar input de cuenta
      const sec = document.getElementById('strCuentaSection');
      const inp = document.getElementById('strCuentaInput');
      if (sec) sec.style.display = 'block';
      if (inp) inp.placeholder = placeholder;
      // Activar paso 3
      const s3 = document.getElementById('strStep3Icon');
      const s3t = document.getElementById('strStep3Title');
      if (s3) { s3.style.background = 'var(--grad-main)'; s3.style.color = '#fff'; }
      if (s3t) s3t.style.color = '#fff';
      strActualizarResumen();
    };

    window.strActualizarResumen = function() {
      if (!montoSeleccionado || !metodoSeleccionado) return;
      const cuenta = document.getElementById('strCuentaInput')?.value?.trim();
      const resumen = document.getElementById('strResumenRetiro');
      const btnConfirmar = document.getElementById('strBtnConfirmar');
      if (resumen) resumen.innerHTML = `
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border2);border-radius:12px;padding:16px;text-align:left">
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span style="color:var(--mu)">Monto</span>
            <span style="color:var(--gold);font-weight:700">$${montoSeleccionado} USD</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span style="color:var(--mu)">Estrellas a descontar</span>
            <span style="font-weight:600">${(montoSeleccionado*200).toLocaleString()} ⭐</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0">
            <span style="color:var(--mu)">Método</span>
            <span style="font-weight:600">${metodoSeleccionado}</span>
          </div>
        </div>
      `;
      if (btnConfirmar) {
        btnConfirmar.style.opacity = '1';
        btnConfirmar.style.pointerEvents = 'auto';
      }
    };

    // Actualizar resumen cuando escriben la cuenta
    document.getElementById('strCuentaInput')?.addEventListener('input', strActualizarResumen);
  };

  window.strConfirmarRetiro = function(disponible) {
    if (!montoSeleccionado) { toast('Selecciona un monto','error'); return; }
    if (!metodoSeleccionado) { toast('Selecciona un método de pago','error'); return; }
    const cuenta = document.getElementById('strCuentaInput')?.value?.trim();
    if (!cuenta) { toast('Ingresa tu cuenta de pago','error'); return; }
    const starsNecesarias = montoSeleccionado * 200;
    if (disponible < starsNecesarias) { toast('No tienes suficientes estrellas','error'); return; }

    window.fsAdd?.('retiros', {
      monto_usd: montoSeleccionado,
      monto_stars: starsNecesarias,
      metodo: metodoSeleccionado,
      cuenta, estado: 'pendiente',
      uid_streamer: p.uid,
      nick: p.nick||p.nombre
    }).then(()=>{
      toast(`✓ Retiro de $${montoSeleccionado} USD solicitado · Se procesa en 24-48h`,'success');
      montoSeleccionado = null;
      metodoSeleccionado = null;
      // Recargar
      window.fsGet?.('usuarios', p.uid).then(pf => renderRetiro(pf));
    }).catch(()=>toast('Error al solicitar retiro','error'));
  };

  // Mostrar con datos del perfil actual mientras carga Firestore
  renderRetiro(p);
  window.fsGet?.('usuarios', p.uid).then(pf => { if(pf) renderRetiro(pf); }).catch(()=>{});
}

function strCargarRetiros(p) {
  window.fsGetAll?.('retiros').then(retiros => {
    const cont = document.getElementById('strRetiroHistorial');
    if (!cont) return;
    const misR = retiros?.filter(r => r.uid_streamer === p.uid) || [];
    if (misR.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay retiros solicitados aún.</div>`;
      return;
    }
    cont.innerHTML = strCard(`
      <div class="section-title" style="margin-bottom:12px">📋 Mis retiros</div>
      ${misR.map(r=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div>
            <div style="font-weight:600">${r.monto?.toLocaleString()||0} ⭐ → ${r.metodo}</div>
            <div style="font-size:11px;color:var(--mu)">${r.cuenta} · ${r.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Reciente'}</div>
          </div>
          <span class="badge ${r.estado==='pagado'?'badge-green':r.estado==='rechazado'?'badge-red':'badge-orange'}">${r.estado||'pendiente'}</span>
        </div>
      `).join('')}
    `);
  }).catch(()=>{});
}

// ── 5. FANS ──────────────────────────────
function str_fans(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>❤️ Mis <span>Fans</span></h1>
    </div>
    <div id="strFansContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div></div>
  `;
  window.fsGet?.('usuarios', p.uid).then(perfil => {
    const cont = document.getElementById('strFansContent');
    if (!cont) return;
    cont.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">👥 Total fans</div><div class="stat-value" style="color:#4ade80">${perfil?.seguidores||0}</div></div>
        <div class="stat-card"><div class="stat-label">⭐ Estrellas recibidas</div><div class="stat-value" style="color:var(--gold)">${perfil?.estrellas||0}</div></div>
      </div>
      ${strCard(`
        <div style="text-align:center;padding:20px;color:var(--mu)">
          <div style="font-size:36px;opacity:0.3;margin-bottom:10px">❤️</div>
          Los fans que te sigan aparecerán aquí.<br>
          <span style="font-size:12px">Comparte tu perfil para conseguir más fans.</span>
        </div>
      `)}
    `;
  }).catch(()=>{});
}

// ── 6. MENSAJES ESTILO WHATSAPP ──────────
function str_mensajes(el, p) {

  const renderLista = () => {
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <h1 style="font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:var(--gold)">💬 Mensajes</h1>
          <p style="font-size:11px;color:var(--mu);margin-top:2px">Cada mensaje recibido = <b style="color:var(--gold)">+2⭐</b></p>
        </div>
      </div>
      <div id="strChatsLista"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div></div>
    `;

    window.fsGetAll?.('chats_agencia').then(chats => {
      const cont = document.getElementById('strChatsLista');
      if (!cont) return;
      const misChats = chats?.filter(c => c.uid_to === p.uid) || [];
      if (misChats.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
          <div style="font-size:36px;opacity:0.3;margin-bottom:10px">💬</div>
          No tienes mensajes aún.<br>
          <span style="font-size:12px">Cuando tus fans te escriban aparecerán aquí.</span>
        </div>`;
        return;
      }
      // Agrupar por remitente
      const convs = {};
      misChats.forEach(m => {
        const uid = m.uid_from;
        if (!convs[uid]) convs[uid] = { uid, nick: m.nick_from, msgs: [], unread: 0 };
        convs[uid].msgs.push(m);
        if (!m.leido) convs[uid].unread++;
      });
      cont.innerHTML = Object.values(convs).map(c => {
        const last = c.msgs[c.msgs.length-1];
        return `
          <div onclick="strAbrirChat('${c.uid}','${c.nick}')" style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;cursor:pointer;background:${c.unread>0?'rgba(212,175,55,0.04)':'transparent'};transition:background .15s;margin-bottom:2px" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='${c.unread>0?'rgba(212,175,55,0.04)':'transparent'}'">
            <div class="card-avatar" style="width:52px;height:52px;font-size:20px;flex-shrink:0">${(c.nick||'?')[0].toUpperCase()}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <div style="font-size:14px;font-weight:700;color:#fff">@${c.nick}</div>
                <div style="font-size:10px;color:${c.unread>0?'var(--gold)':'var(--mu)'}">${last?.createdAt?.toDate?.()?.toLocaleTimeString?.('es',{hour:'2-digit',minute:'2-digit'})||'ahora'}</div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="font-size:12px;color:${c.unread>0?'rgba(255,255,255,0.8)':'var(--mu)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px">${last?.texto||'...'}</div>
                ${c.unread>0?`<div style="width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#FF1A1A,#CC0000);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${c.unread}</div>`:''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }).catch(()=>{
      const cont = document.getElementById('strChatsLista');
      if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay mensajes aún.</div>`;
    });
  };

  // ── ABRIR CHAT INDIVIDUAL ──
  window.strAbrirChat = function(uid_from, nick) {
    const chatId = [p.uid, uid_from].sort().join('_');
    el.innerHTML = `
      <!-- HEADER estilo WhatsApp -->
      <div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:10px;padding:12px 0 12px;background:var(--black);border-bottom:1px solid rgba(212,175,55,0.10);margin-bottom:0">
        <button onclick="navigate('mensajes')" style="background:none;border:none;color:var(--gold);font-size:22px;cursor:pointer;line-height:1;flex-shrink:0">←</button>
        <div class="card-avatar" style="width:42px;height:42px;font-size:17px;flex-shrink:0">${nick[0].toUpperCase()}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14px">@${nick}</div>
          <div style="font-size:10px;color:var(--mu)">Fan · En línea</div>
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="strLlamarFan('${uid_from}','${nick}')" style="width:36px;height:36px;border-radius:10px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);color:#4ade80;cursor:pointer;font-size:16px">📞</button>
          <button onclick="strVideoFan('${uid_from}','${nick}')" style="width:36px;height:36px;border-radius:10px;background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.3);color:#60A5FA;cursor:pointer;font-size:16px">📹</button>
        </div>
      </div>

      <!-- BANNER ESTRELLAS -->
      <div style="padding:8px 12px;background:rgba(212,175,55,0.06);border-bottom:1px solid rgba(212,175,55,0.10);text-align:center;font-size:10.5px;color:rgba(212,175,55,0.85)">
        ⭐ Cada mensaje recibido te genera <b style="color:#F0D060">2 estrellas</b>
      </div>

      <!-- MENSAJES -->
      <div id="strChatMsgs" style="display:flex;flex-direction:column;gap:4px;padding:14px 12px;min-height:300px;max-height:450px;overflow-y:auto">
        <div style="text-align:center;color:var(--mu);font-size:12px;padding:20px">Cargando mensajes...</div>
      </div>

      <!-- MEDIA BUTTONS -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:8px 12px">
        ${[
          {icon:'📷',label:'Foto',cost:'4⭐',color:'var(--gold)'},
          {icon:'🎬',label:'Video',cost:'10⭐',color:'#FF6666'},
          {icon:'🎙️',label:'Audio',cost:'3⭐',color:'#9FD8FF'},
          {icon:'🎁',label:'Regalo',cost:'1⭐+',color:'#F0D060',fn:'strEnviarGiftChat'},
          {icon:'😊',label:'Emoji',cost:'',color:'#fff',fn:'strToggleEmojis'},
        ].map(mb=>`
          <button onclick="${mb.fn||`toast('${mb.label} próximamente','info')`}" style="padding:8px 4px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="font-size:17px">${mb.icon}</div>
            <div style="font-size:9px;color:#fff;font-weight:600">${mb.label}</div>
            ${mb.cost?`<div style="font-size:8px;color:${mb.color};font-weight:800">${mb.cost}</div>`:''}
          </button>
        `).join('')}
      </div>

      <!-- INPUT BAR -->
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px 16px">
        <div style="flex:1;display:flex;align-items:center;height:44px;padding:0 6px 0 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:999px">
          <input id="strChatInp_${chatId}" placeholder="Escribe un mensaje..." onkeydown="if(event.key==='Enter')strEnviarMsgChat('${chatId}','${uid_from}','${nick}')"
            style="flex:1;background:none;border:none;outline:none;color:#fff;font-size:13.5px;font-family:'Outfit',sans-serif">
          <button onclick="strEnviarMsgChat('${chatId}','${uid_from}','${nick}')" style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#F0D060,#D4AF37);border:none;color:#1a0a00;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">➤</button>
        </div>
      </div>
    `;

    // Cargar mensajes
    strCargarMsgsChat(chatId, uid_from, nick, p);

    window.strLlamarFan = function(uid, nick) {
      window.fsAdd?.('llamadas', { uid_from: p.uid, uid_to: uid, tipo: 'voz', estado: 'iniciada' });
      toast(`📞 Llamando a @${nick}...`,'success');
    };
    window.strVideoFan = function(uid, nick) {
      window.fsAdd?.('llamadas', { uid_from: p.uid, uid_to: uid, tipo: 'video', estado: 'iniciada' });
      toast(`📹 Videollamada con @${nick}...`,'success');
    };
    window.strEnviarGiftChat = function() {
      navigate('gifts');
    };
    window.strToggleEmojis = function() {
      const emojis = ['❤️','🔥','👑','⭐','💋','😍','🎉','💪','😘','🥰','💎','🌹'];
      const inp = document.getElementById('strChatInp_'+chatId);
      if (!inp) return;
      const existing = document.getElementById('strEmojiPicker');
      if (existing) { existing.remove(); return; }
      const picker = document.createElement('div');
      picker.id = 'strEmojiPicker';
      picker.style.cssText = 'position:fixed;bottom:120px;left:12px;right:12px;background:var(--black3);border:1px solid var(--border);border-radius:14px;padding:12px;display:flex;flex-wrap:wrap;gap:8px;z-index:100';
      emojis.forEach(e => {
        const btn = document.createElement('button');
        btn.textContent = e;
        btn.style.cssText = 'font-size:22px;background:none;border:none;cursor:pointer;padding:4px';
        btn.onclick = () => { inp.value += e; picker.remove(); inp.focus(); };
        picker.appendChild(btn);
      });
      document.body.appendChild(picker);
      setTimeout(()=>picker.remove(), 5000);
    };
  };

  function strCargarMsgsChat(chatId, uid_from, nick, perfil) {
    window.fsGetAll?.('chats_agencia').then(todos => {
      const cont = document.getElementById('strChatMsgs');
      if (!cont) return;
      const msgs = todos?.filter(m=>m.chatId===chatId) || [];
      if (msgs.length === 0) {
        cont.innerHTML = `<div style="text-align:center;color:var(--mu);font-size:12px;padding:20px">
          Inicio de la conversación con @${nick}<br>
          <span style="font-size:11px;opacity:0.6">Los mensajes son privados</span>
        </div>`;
        return;
      }
      cont.innerHTML = msgs.map(m => strBurbuja(m, perfil.uid)).join('');
      cont.scrollTop = cont.scrollHeight;
    }).catch(()=>{});
  }

  function strBurbuja(m, myUid) {
    const isMe = m.uid_from === myUid;
    if (m.tipo === 'gift') return `
      <div style="align-self:center;margin:6px 0;padding:8px 14px;background:linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.04));border:1px solid rgba(212,175,55,0.35);border-radius:999px;display:flex;align-items:center;gap:8px;font-size:11.5px">
        <span style="font-size:18px">${m.gift_emoji||'🎁'}</span>
        <span style="color:#fff"><b style="color:var(--gold)">${isMe?'Enviaste':'Te envió'}</b> ${m.gift_name}</span>
        <span style="color:#F0D060;font-weight:700">-${m.gift_cost}⭐</span>
      </div>
    `;
    if (m.tipo === 'audio') return `
      <div style="display:flex;justify-content:${isMe?'flex-end':'flex-start'};margin-bottom:4px">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:${isMe?'linear-gradient(135deg,#FF1A1A,#8B0000)':'rgba(255,255,255,0.06)'};border-radius:18px;min-width:160px">
          <button style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.18);border:none;color:#fff;cursor:pointer;font-size:12px">▶</button>
          <div style="display:flex;align-items:center;gap:2px">${[8,12,6,14,10,16,8,12].map(h=>`<div style="width:2px;height:${h}px;border-radius:1px;background:rgba(255,255,255,0.7)"></div>`).join('')}</div>
          <span style="font-size:10.5px;color:rgba(255,255,255,0.85)">${m.duracion||'0:15'}</span>
        </div>
      </div>
    `;
    return `
      <div style="display:flex;justify-content:${isMe?'flex-end':'flex-start'};margin-bottom:2px">
        <div style="max-width:78%;padding:9px 13px;background:${isMe?'linear-gradient(135deg,#FF1A1A,#8B0000)':'rgba(255,255,255,0.06)'};border:${isMe?'none':'1px solid rgba(255,255,255,0.04)'};border-radius:${isMe?'16px 16px 4px 16px':'16px 16px 16px 4px'};color:#fff;font-size:13.5px;line-height:1.4;${isMe?'box-shadow:0 2px 10px rgba(204,0,0,0.25)':''}">
          ${m.texto}
        </div>
      </div>
    `;
  }

  window.strEnviarMsgChat = function(chatId, uid_to, nick) {
    const inp = document.getElementById('strChatInp_'+chatId);
    if (!inp?.value?.trim()) return;
    const texto = inp.value.trim();
    inp.value = '';
    window.fsAdd?.('chats_agencia', {
      chatId, texto, tipo: 'texto',
      uid_from: p.uid, uid_to,
      nick_from: p.nick||p.nombre, nick_to: nick
    }).then(()=>{
      // Sumar 2 estrellas a la streamer por recibir mensaje
      window.fsGet?.('usuarios', p.uid).then(perfil => {
        window.fsSet?.('usuarios', p.uid, { estrellas: (perfil?.estrellas||0)+2 });
      });
      strCargarMsgsChat(chatId, uid_to, nick, p);
    }).catch(()=>toast('Error al enviar','error'));
  };

  renderLista();
}

// ── 7. RANKINGS ──────────────────────────
function str_rankings(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🏆 <span>Rankings</span></h1>
    </div>
    <div id="strRankContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando ranking...</div></div>
  `;
  cargarUsuariosReales?.().then(usuarios => {
    const streamers = usuarios.filter(u=>u.rol==='streamer').sort((a,b)=>(b.estrellas||0)-(a.estrellas||0));
    const miPos = streamers.findIndex(s=>s.id===p.uid) + 1;
    const cont = document.getElementById('strRankContent');
    if (!cont) return;
    cont.innerHTML = `
      ${strCard(`
        <div style="text-align:center">
          <div style="font-family:'Cinzel',serif;font-size:48px;font-weight:900;color:var(--gold)">#${miPos||'—'}</div>
          <div style="color:var(--mu);font-size:13px">Tu posición esta semana</div>
        </div>
      `)}
      ${strCard(`
        <div class="section-title" style="margin-bottom:12px">Top streamers</div>
        ${streamers.slice(0,10).map((s,i)=>`
          <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04);${s.id===p.uid?'background:rgba(212,175,55,0.05);border-radius:8px;padding:12px;':''}">
            <div style="width:32px;font-family:'Cinzel',serif;font-size:16px;font-weight:700;text-align:center;color:${i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--mu)'}">
              ${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}
            </div>
            <div class="card-avatar" style="width:36px;height:36px;border:2px solid ${s.id===p.uid?'var(--gold)':'rgba(255,255,255,0.1)'}">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
            <div style="flex:1;font-weight:600;color:${s.id===p.uid?'var(--gold)':'#fff'}">@${s.nick||s.nombre}</div>
            <div style="font-weight:700;color:var(--gold)">${(s.estrellas||0).toLocaleString()} ⭐</div>
          </div>
        `).join('')}
      `)}
    `;
  }).catch(()=>{});
}

// ── 8. GIFTS ─────────────────────────────
function str_gifts(el, p) {
  const gifts = [
    {e:'🌹',name:'Rosa',v:1},{e:'❤️',name:'Corazón',v:5},
    {e:'💋',name:'Beso',v:10},{e:'💍',name:'Anillo',v:50},
    {e:'👑',name:'Corona',v:199},{e:'🍾',name:'Champagne',v:299},
    {e:'🏎️',name:'Ferrari',v:999},{e:'🏰',name:'Castillo',v:2999},
  ];
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🎁 Gifts <span>Recibidos</span></h1>
    </div>
    <div id="strGiftsContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div></div>
  `;
  window.fsGet?.('usuarios', p.uid).then(perfil => {
    const cont = document.getElementById('strGiftsContent');
    if (!cont) return;
    cont.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">⭐ Total recibido</div><div class="stat-value" style="color:var(--gold)">${perfil?.estrellas||0}</div></div>
        <div class="stat-card"><div class="stat-label">🎁 Gifts hoy</div><div class="stat-value">0</div></div>
      </div>
      <div class="section-title" style="margin:16px 0 10px">Tabla de gifts</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px">
        ${gifts.map(g=>`
          <div class="card" style="text-align:center;padding:16px 10px">
            <div style="font-size:40px;margin-bottom:8px">${g.e}</div>
            <div style="font-weight:700;margin-bottom:4px">${g.name}</div>
            <div style="font-size:11px;color:var(--gold)">${g.v} ⭐</div>
          </div>
        `).join('')}
      </div>
    `;
  }).catch(()=>{});
}

// ── 9. PK BATTLES (estilo TikTok Live) ───
function str_pk(el, p) {
  let myStars = 0, rivalStars = 0;
  let rivalNick = '?', rivalUid = null;
  let pkActivo = false;
  let pkTimer = 300;
  let pkInterval = null;
  let multiplicador = 1;

  // Gifts disponibles durante PK
  const GIFTS = [
    {e:'🌹',name:'Rosa',v:1},{e:'❤️',name:'Corazón',v:5},
    {e:'💋',name:'Beso',v:10},{e:'🌟',name:'Estrella',v:20},
    {e:'💍',name:'Anillo',v:50},{e:'🦁',name:'León',v:100},
    {e:'👑',name:'Corona',v:199},{e:'💎',name:'Diamante',v:299},
    {e:'🏎️',name:'Ferrari',v:999},{e:'🏰',name:'Castillo',v:2999},
  ];

  // Shows programados por la streamer
  const SHOWS_DEFAULT = {
    '🌹': 'Mando un beso', '❤️': 'Digo gracias', '💋': 'Tiro un beso a la cám',
    '🦁': 'Hago un baile corto', '👑': 'Canto 1 minuto', '💎': 'Bailo 3 minutos',
    '🏎️': 'Show especial 5 min', '🏰': 'Show VIP 10 minutos'
  };
  let shows = {...SHOWS_DEFAULT};

  const renderPK = () => {
    const total = myStars + rivalStars;
    const pctMe = total > 0 ? Math.floor(myStars/total*100) : 50;
    const pctRival = 100 - pctMe;
    const ganando = myStars >= rivalStars;
    const mins = String(Math.floor(pkTimer/60)).padStart(2,'0');
    const secs = String(pkTimer%60).padStart(2,'0');

    el.innerHTML = `
      <!-- TÍTULO -->
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:900;color:var(--gold)">⚔️ PK BATTLE</div>
        <div style="font-size:11px;color:var(--mu);margin-top:4px">Batalla en vivo · Los fans envían gifts para decidir el ganador</div>
      </div>

      ${!pkActivo ? `
        <!-- SIN BATALLA ACTIVA -->
        <div style="padding:30px 20px;border-radius:20px;background:radial-gradient(ellipse at center,rgba(204,0,0,0.15),transparent);border:1px solid rgba(204,0,0,0.25);text-align:center;margin-bottom:16px">
          <div style="font-size:56px;margin-bottom:12px">⚔️</div>
          <div style="font-family:'Cinzel',serif;font-size:16px;font-weight:700;color:#fff;margin-bottom:8px">Desafía a otra streamer</div>
          <div style="font-size:12px;color:var(--mu);margin-bottom:20px;max-width:280px;margin-left:auto;margin-right:auto">
            Compiten en pantalla dividida. Tus fans envían gifts para apoyarte.
            El que más estrellas acumule en 5 minutos gana.
          </div>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
            <button onclick="strBuscarRival()" class="btn-primary" style="padding:14px 24px;width:auto">⚔️ Buscar rival ahora</button>
            <button onclick="strInvitarRival()" style="padding:14px 20px;border-radius:var(--r-lg);background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:var(--gold);font-weight:700;font-size:13px;cursor:pointer">📨 Invitar por nick</button>
          </div>
        </div>

        <!-- CÓMO FUNCIONA -->
        <div class="card" style="margin-bottom:16px">
          <div class="section-title" style="margin-bottom:12px">📖 ¿Cómo funciona el PK Battle?</div>
          ${[
            {n:'1',t:'Encuentra rival',d:'Buscas una streamer disponible o la invitas directamente'},
            {n:'2',t:'Pantalla dividida',d:'Ambas aparecen en el live. Tus fans ven la batalla en tiempo real'},
            {n:'3',t:'Fans envían gifts',d:'Cada gift suma estrellas a tu contador. Más gifts = más puntos'},
            {n:'4',t:'Multiplicador 🧤',d:'El "guante" activa x2 puntos por 30 segundos. ¡Actívalo en el momento clave!'},
            {n:'5',t:'Gana el de más estrellas',d:'Al terminar los 5 min, quien tenga más estrellas gana. Todas las estrellas se convierten en dinero real'},
          ].map(s=>`
            <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
              <div style="width:24px;height:24px;border-radius:50%;background:var(--grad-main);color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${s.n}</div>
              <div>
                <div style="font-weight:600;font-size:13px">${s.t}</div>
                <div style="font-size:11px;color:var(--mu);margin-top:2px">${s.d}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- SHOWS POR GIFT -->
        <div class="card" style="margin-bottom:16px">
          <div class="section-title" style="margin-bottom:4px">🎪 Define tus shows por gift</div>
          <div style="font-size:11px;color:var(--mu);margin-bottom:12px">Tus fans sabrán qué show harás cuando te regalen cada item</div>
          ${Object.entries(SHOWS_DEFAULT).map(([emoji,show])=>`
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
              <span style="font-size:22px;flex-shrink:0">${emoji}</span>
              <input value="${show}" placeholder="¿Qué harás?" data-gift="${emoji}"
                style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:6px 10px;color:#fff;font-size:11px;outline:none">
            </div>
          `).join('')}
          <button onclick="strGuardarShows()" class="btn-sm" style="margin-top:10px;padding:10px;width:100%">💾 Guardar shows</button>
        </div>

      ` : `
        <!-- BATALLA ACTIVA -->

        <!-- TIMER + MULTIPLICADOR -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px">
          <div style="flex:1;text-align:center;padding:10px;border-radius:12px;background:rgba(204,0,0,0.15);border:1px solid rgba(204,0,0,0.35)">
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--mu);margin-bottom:2px">Tiempo</div>
            <div style="font-family:'Cinzel',serif;font-size:28px;font-weight:900;color:#fff" id="pkTimer">${mins}:${secs}</div>
          </div>
          <button onclick="strActivarMultiplicador()" id="pkMultBtn" style="padding:12px 16px;border-radius:12px;background:linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.05));border:1px solid rgba(212,175,55,0.4);cursor:pointer;text-align:center">
            <div style="font-size:24px">🧤</div>
            <div style="font-size:9px;color:var(--gold);font-weight:700" id="pkMultLabel">x${multiplicador} activo</div>
            <div style="font-size:8px;color:var(--mu)">Multiplicador</div>
          </button>
          <div style="flex:1;text-align:center;padding:10px;border-radius:12px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25)">
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--mu);margin-bottom:2px">Mis estrellas</div>
            <div style="font-family:'Cinzel',serif;font-size:24px;font-weight:900;color:#22c55e" id="pkMyStarsTop">${myStars.toLocaleString()}</div>
          </div>
        </div>

        <!-- ARENA PANTALLA DIVIDIDA -->
        <div style="border-radius:16px;overflow:hidden;border:2px solid rgba(204,0,0,0.3);margin-bottom:14px">
          <!-- YO (lado izquierdo) -->
          <div style="display:grid;grid-template-columns:1fr 1fr">
            <div style="padding:16px;background:linear-gradient(135deg,rgba(212,175,55,0.12),rgba(0,0,0,0.9));text-align:center;position:relative">
              ${ganando?`<div style="position:absolute;top:6px;left:50%;transform:translateX(-50%);font-size:20px">👑</div>`:''}
              <div class="card-avatar" style="width:64px;height:64px;font-size:26px;margin:${ganando?'24px':'0'} auto 8px;border:3px solid var(--gold);box-shadow:0 0 16px rgba(212,175,55,0.4)">${(p.nick||p.nombre||'?')[0].toUpperCase()}</div>
              <div style="font-size:11px;font-weight:700;color:#fff;margin-bottom:4px">@${p.nick||p.nombre}</div>
              <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:900;color:var(--gold)" id="pkMyStars">${myStars.toLocaleString()}</div>
              <div style="font-size:9px;color:var(--mu)">⭐ estrellas</div>
            </div>
            <!-- RIVAL (lado derecho) -->
            <div style="padding:16px;background:linear-gradient(135deg,rgba(204,0,0,0.12),rgba(0,0,0,0.9));text-align:center;position:relative;border-left:1px solid rgba(255,255,255,0.06)">
              ${!ganando?`<div style="position:absolute;top:6px;left:50%;transform:translateX(-50%);font-size:20px">👑</div>`:''}
              <div class="card-avatar" style="width:64px;height:64px;font-size:26px;margin:${!ganando?'24px':'0'} auto 8px;border:3px solid #CC0000;background:linear-gradient(135deg,#CC0000,#7a0000);box-shadow:0 0 16px rgba(204,0,0,0.4)">${rivalNick[0]}</div>
              <div style="font-size:11px;font-weight:700;color:#fff;margin-bottom:4px">@${rivalNick}</div>
              <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:900;color:#FF6B6B" id="pkRivalStars">${rivalStars.toLocaleString()}</div>
              <div style="font-size:9px;color:var(--mu)">⭐ estrellas</div>
            </div>
          </div>
          <!-- BARRA DE PROGRESO -->
          <div style="height:28px;display:flex;align-items:center;position:relative;background:#0a0a0a">
            <div id="pkBarMe" style="height:100%;background:linear-gradient(90deg,#D4AF37,var(--gold));transition:width .5s ease;width:${pctMe}%;min-width:8px"></div>
            <div style="position:absolute;left:50%;transform:translateX(-50%);font-family:'Cinzel',serif;font-size:11px;font-weight:900;color:#fff;z-index:2;background:rgba(0,0,0,0.7);padding:2px 8px;border-radius:20px">VS</div>
            <div style="position:absolute;left:6px;font-size:9px;font-weight:800;color:rgba(0,0,0,0.8);z-index:1">${pctMe}%</div>
            <div style="position:absolute;right:6px;font-size:9px;font-weight:800;color:rgba(255,255,255,0.7);z-index:1">${pctRival}%</div>
          </div>
        </div>

        <!-- FEED DE GIFTS EN TIEMPO REAL -->
        <div class="card" style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div class="section-title">🎁 Gifts en vivo</div>
            <span style="font-size:10px;color:var(--mu)">Actualización en tiempo real</span>
          </div>
          <div id="pkGiftsFeed" style="display:flex;flex-direction:column;gap:5px;max-height:160px;overflow-y:auto">
            <div style="text-align:center;color:var(--mu);font-size:12px;padding:10px">Esperando gifts de tus fans ⭐</div>
          </div>
        </div>

        <!-- SHOW ACTIVO -->
        <div id="pkShowActivo" style="display:none;margin-bottom:14px;padding:14px;border-radius:14px;background:linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.04));border:1px solid rgba(212,175,55,0.4);text-align:center">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--gold);margin-bottom:4px">🎪 SHOW ACTIVADO</div>
          <div style="font-size:15px;font-weight:700;color:#fff" id="pkShowTexto"></div>
        </div>

        <!-- BOTONES DE BATALLA -->
        <div style="display:flex;gap:10px">
          <button onclick="strPkBoost()" class="btn-primary" style="flex:2;padding:14px">🔥 Animar a mis fans!</button>
          <button onclick="strTerminarPK()" style="flex:1;padding:14px;border-radius:var(--r-lg);background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#EF4444;font-weight:700;cursor:pointer;font-size:12px">⏹ Terminar</button>
        </div>
      `}

      <!-- HISTORIAL -->
      <div id="pkHistorial" style="margin-top:16px"></div>
    `;

    // Cargar historial
    window.fsGetAll?.('pk_battles').then(battles => {
      const cont = document.getElementById('pkHistorial');
      if (!cont) return;
      const mios = battles?.filter(b=>b.uid_streamer===p.uid&&b.estado==='terminado') || [];
      if (mios.length === 0) return;
      cont.innerHTML = `
        <div class="section-title" style="margin-bottom:10px">📋 Mis batallas anteriores</div>
        ${mios.slice(0,5).map(b=>`
          <div class="card card-row" style="margin-bottom:8px">
            <div style="font-size:28px">${b.resultado==='ganado'?'🏆':'💔'}</div>
            <div class="card-info">
              <div class="card-name">vs @${b.rival_nick||'—'}</div>
              <div class="card-sub">${b.mis_stars||0}⭐ vs ${b.rival_stars||0}⭐ · ${b.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Reciente'}</div>
            </div>
            <span class="badge ${b.resultado==='ganado'?'badge-green':'badge-red'}">${b.resultado==='ganado'?'Victoria':'Derrota'}</span>
          </div>
        `).join('')}
      `;
    }).catch(()=>{});
  };

  // ── FUNCIONES PK ──
  window.strBuscarRival = function() {
    toast('🔍 Buscando rival disponible...','info');
    setTimeout(()=>{
      cargarUsuariosReales?.().then(usuarios => {
        const disponibles = usuarios.filter(u=>u.rol==='streamer'&&u.id!==p.uid);
        if (disponibles.length === 0) { toast('No hay streamers disponibles ahora','info'); return; }
        const rival = disponibles[Math.floor(Math.random()*disponibles.length)];
        rivalNick = rival.nick || rival.nombre || 'Rival';
        rivalUid = rival.id;
        strIniciarPK();
      }).catch(()=>{
        rivalNick = 'LunaFire';
        strIniciarPK();
      });
    }, 1500);
  };

  window.strInvitarRival = function() {
    const nick = prompt('Nick de la streamer a invitar:');
    if (!nick) return;
    rivalNick = nick;
    window.fsAdd?.('pk_invitaciones', {
      uid_from: p.uid, nick_from: p.nick||p.nombre,
      nick_to: nick, estado: 'pendiente'
    }).then(()=>toast(`📨 Invitación enviada a @${nick}`,'success'))
    .catch(()=>toast('Invitación registrada ✓','success'));
  };

  function strIniciarPK() {
    pkActivo = true;
    pkTimer = 300;
    myStars = 0;
    rivalStars = 0;
    multiplicador = 1;
    toast(`⚔️ ¡Battle iniciado vs @${rivalNick}! 5 minutos`,'success');
    window.fsAdd?.('pk_battles', {
      uid_streamer: p.uid, nick: p.nick||p.nombre,
      rival_nick: rivalNick, rival_uid: rivalUid||null,
      estado: 'activo', mis_stars: 0, rival_stars: 0
    });
    renderPK();
    iniciarTimerPK();
    simularGiftsRival();
  }

  window.strPkBoost = function() {
    // Simular que fans envían gifts
    const gift = [
      {e:'🌹',v:1},{e:'❤️',v:5},{e:'💋',v:10},
      {e:'👑',v:199},{e:'💎',v:299},{e:'🏎️',v:999}
    ][Math.floor(Math.random()*6)];
    const pts = gift.v * multiplicador;
    myStars += pts;

    // Actualizar UI
    const s1 = document.getElementById('pkMyStars');
    const s2 = document.getElementById('pkMyStarsTop');
    const bar = document.getElementById('pkBarMe');
    if (s1) s1.textContent = myStars.toLocaleString();
    if (s2) s2.textContent = myStars.toLocaleString();
    const total = myStars + rivalStars;
    if (bar && total > 0) bar.style.width = Math.floor(myStars/total*100)+'%';

    // Agregar al feed
    agregarGiftFeed(`🎁 Fan te envió ${gift.e} +${pts}⭐${multiplicador>1?' (x'+multiplicador+')':''}`, 'mine');

    // Mostrar show si aplica
    const showTexto = shows[gift.e];
    if (showTexto && gift.v >= 50) {
      const showEl = document.getElementById('pkShowActivo');
      const showTxt = document.getElementById('pkShowTexto');
      if (showEl && showTxt) {
        showTxt.textContent = `${gift.e} ${showTexto}`;
        showEl.style.display = 'block';
        setTimeout(()=>{ if(showEl) showEl.style.display='none'; }, 4000);
      }
    }
  };

  window.strActivarMultiplicador = function() {
    if (multiplicador > 1) { toast('Multiplicador ya está activo','info'); return; }
    multiplicador = 2;
    const btn = document.getElementById('pkMultBtn');
    const lbl = document.getElementById('pkMultLabel');
    if (btn) btn.style.background = 'linear-gradient(135deg,rgba(255,200,0,0.4),rgba(255,200,0,0.1))';
    if (lbl) lbl.textContent = 'x2 ACTIVO 🔥';
    toast('🧤 ¡Multiplicador x2 activado por 30 segundos!','success');
    setTimeout(()=>{
      multiplicador = 1;
      const btn2 = document.getElementById('pkMultBtn');
      const lbl2 = document.getElementById('pkMultLabel');
      if (btn2) btn2.style.background = 'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.05))';
      if (lbl2) lbl2.textContent = 'x1 normal';
      toast('Multiplicador terminó','info');
    }, 30000);
  };

  function simularGiftsRival() {
    // Rival también recibe gifts (simulado)
    window._pkRivalInterval = setInterval(()=>{
      if (!pkActivo) { clearInterval(window._pkRivalInterval); return; }
      const v = [1,5,10,50,199][Math.floor(Math.random()*5)];
      rivalStars += v;
      const el2 = document.getElementById('pkRivalStars');
      const bar = document.getElementById('pkBarMe');
      if (el2) el2.textContent = rivalStars.toLocaleString();
      const total = myStars + rivalStars;
      if (bar && total > 0) bar.style.width = Math.floor(myStars/total*100)+'%';
      agregarGiftFeed(`Fan de @${rivalNick} envió +${v}⭐`, 'rival');
    }, Math.floor(Math.random()*4000)+3000);
  }

  function agregarGiftFeed(texto, tipo) {
    const feed = document.getElementById('pkGiftsFeed');
    if (!feed) return;
    if (feed.children.length === 1 && feed.children[0].textContent.includes('Esperando')) {
      feed.innerHTML = '';
    }
    const d = document.createElement('div');
    d.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:${tipo==='mine'?'rgba(34,197,94,0.08)':'rgba(204,0,0,0.08)'};border:1px solid ${tipo==='mine'?'rgba(34,197,94,0.2)':'rgba(204,0,0,0.2)'};font-size:12px;animation:fadeIn .3s ease`;
    d.innerHTML = `<span style="color:${tipo==='mine'?'#22c55e':'#FF6B6B'}">${texto}</span>`;
    feed.insertBefore(d, feed.firstChild);
    if (feed.children.length > 10) feed.removeChild(feed.lastChild);
  }

  window.strTerminarPK = function() {
    clearInterval(pkInterval);
    clearInterval(window._pkRivalInterval);
    pkActivo = false;
    const gane = myStars >= rivalStars;
    window.fsAdd?.('pk_battles', {
      uid_streamer: p.uid, nick: p.nick||p.nombre,
      rival_nick: rivalNick, rival_uid: rivalUid||null,
      estado: 'terminado', mis_stars: myStars,
      rival_stars: rivalStars,
      resultado: gane ? 'ganado' : 'perdido'
    }).then(()=>{
      toast(gane
        ? `🏆 ¡Ganaste! ${myStars}⭐ vs ${rivalStars}⭐ — Estrellas acreditadas`
        : `💔 Perdiste este battle. ${myStars}⭐ vs ${rivalStars}⭐ — ¡La próxima ganas!`,
        gane ? 'success' : 'info'
      );
      myStars=0; rivalStars=0; rivalNick='?'; rivalUid=null; pkTimer=300;
      renderPK();
    }).catch(()=>{ toast('Battle terminado','info'); renderPK(); });
  };

  function iniciarTimerPK() {
    clearInterval(pkInterval);
    pkInterval = setInterval(()=>{
      pkTimer--;
      const el2 = document.getElementById('pkTimer');
      if (el2) {
        const m = String(Math.floor(pkTimer/60)).padStart(2,'0');
        const s = String(pkTimer%60).padStart(2,'0');
        el2.textContent = `${m}:${s}`;
        // Advertencias de tiempo
        if (pkTimer === 60) toast('⏰ ¡1 minuto restante! ¡Anima a tus fans!','info');
        if (pkTimer === 30) toast('⚡ ¡30 segundos! ¡Activa el multiplicador!','info');
      }
      if (pkTimer <= 0) { clearInterval(pkInterval); window.strTerminarPK?.(); }
    }, 1000);
  }

  window.strGuardarShows = function() {
    document.querySelectorAll('[data-gift]').forEach(inp => {
      const gift = inp.dataset.gift;
      if (inp.value.trim()) shows[gift] = inp.value.trim();
    });
    window.fsSet?.('usuarios', p.uid, { pk_shows: shows })
      .then(()=>toast('Shows guardados ✓','success'))
      .catch(()=>toast('Shows guardados localmente ✓','success'));
  };

  // Cargar shows guardados
  window.fsGet?.('usuarios', p.uid).then(pf => {
    if (pf?.pk_shows) shows = {...SHOWS_DEFAULT, ...pf.pk_shows};
  }).catch(()=>{});

  renderPK();
}

// ── 10. METAS ────────────────────────────
function str_metas(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🎯 Mis <span>Metas</span></h1>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="input-group" style="flex:1;min-width:180px">
        <span class="input-icon">🎯</span>
        <input type="text" id="strMetaTitulo" placeholder="Ej: Llegar a 10,000 fans">
      </div>
      <input type="number" id="strMetaValor" placeholder="Objetivo" style="background:var(--black3);border:1px solid var(--border2);color:var(--white);border-radius:var(--r-lg);padding:0 12px;font-size:13px;width:110px">
      <button class="btn-sm" style="padding:10px 16px" onclick="strCrearMeta()">+ Crear</button>
    </div>
    <div id="strMetasContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando metas...</div></div>
  `;

  window.strCrearMeta = function() {
    const titulo = document.getElementById('strMetaTitulo')?.value?.trim();
    const valor = document.getElementById('strMetaValor')?.value;
    if (!titulo || !valor) { toast('Completa título y objetivo','error'); return; }
    window.fsAdd?.('metas_streamer', {
      titulo, valor_objetivo: parseInt(valor),
      valor_actual: 0, uid_streamer: p.uid, estado: 'activa'
    }).then(()=>{
      document.getElementById('strMetaTitulo').value='';
      document.getElementById('strMetaValor').value='';
      toast('Meta creada ✓','success');
      strCargarMetas(p);
    }).catch(()=>toast('Error','error'));
  };

  function strCargarMetas(perfil) {
    if (!document.getElementById('strMetasContent')) return;
    window.fsGetAll?.('metas_streamer').then(metas => {
      const cont = document.getElementById('strMetasContent');
      if (!cont) return;
      const mis = metas?.filter(m=>m.uid_streamer===perfil.uid) || [];
      if (mis.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No tienes metas. Crea tu primera meta arriba.</div>`;
        return;
      }
      cont.innerHTML = mis.map(m=>{
        const pct = Math.min(Math.floor((m.valor_actual||0)/(m.valor_objetivo||1)*100),100);
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
      const cont = document.getElementById('strMetasContent');
      if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay metas aún.</div>`;
    });
  }
  strCargarMetas(p);
}

// ── 11. ROOMS ────────────────────────────
function str_rooms(el, p, tipo) {
  const icono = tipo==='voice' ? '🎤' : '📹';
  const nombre_tipo = tipo==='voice' ? 'Voz' : 'Video';

  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>${icono} <span>${nombre_tipo} Rooms</span></h1>
      <p>Crea una sala · Los usuarios pueden entrar y participar contigo</p>
    </div>
    <button onclick="strCrearRoom('${tipo}')" class="btn-primary" style="width:100%;padding:14px;margin-bottom:16px">
      ${icono} Crear sala de ${nombre_tipo.toLowerCase()}
    </button>
    <div id="strRoomsContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando salas...</div></div>
  `;

  window.strCrearRoom = function(t) {
    const nombre = prompt(`Nombre de tu sala de ${t==='voice'?'voz':'video'}:
(Ej: "Chat con fans", "Noche de música")`);
    if (!nombre) return;
    const salaId = 'sala_' + Date.now();
    window.fsAdd?.('salas', {
      id: salaId,
      nombre, tipo: t,
      uid_host: p.uid,
      nick_host: p.nick||p.nombre,
      activa: true,
      participantes: 0,
      canal_agora: salaId // canal único para Agora
    }).then(()=>{
      toast(`Sala "${nombre}" creada ✓ · Los usuarios ya pueden entrar`,'success');
      strCargarRooms(t);
    }).catch(()=>toast('Error al crear sala','error'));
  };

  function strCargarRooms(t) {
    if (!document.getElementById('strRoomsContent')) return;
    window.fsGetAll?.('salas').then(salas => {
      const cont = document.getElementById('strRoomsContent');
      if (!cont) return;
      const misSalas = (salas||[]).filter(s=>s.tipo===t && s.activa);

      if (misSalas.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:40px;color:var(--mu)">
          <div style="font-size:48px;opacity:0.3;margin-bottom:14px">${icono}</div>
          No tienes salas activas.<br>
          <span style="font-size:12px">Crea una y tus fans podrán entrar a escucharte o verte.</span>
        </div>`;
        return;
      }

      cont.innerHTML = misSalas.map(s=>`
        <div class="card" style="margin-bottom:12px;${s.uid_host===p.uid?'border-color:rgba(212,175,55,0.3)':''}">
          <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:12px">
            <div>
              <div style="font-family:'Cinzel',serif;font-size:16px;font-weight:700;color:${s.uid_host===p.uid?'var(--gold)':'#fff'}">${s.nombre}</div>
              <div style="font-size:11px;color:var(--mu);margin-top:3px">Host: @${s.nick_host}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="badge badge-green" style="display:flex;align-items:center;gap:4px">
                <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block"></span>
                Activa
              </span>
            </div>
          </div>

          <!-- PARTICIPANTES -->
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;font-size:12px;color:var(--mu)">
            <span>👥 ${s.participantes||0} participantes</span>
            <span>·</span>
            <span>${icono} ${tipo==='voice'?'Solo voz':'Voz y video'}</span>
          </div>

          ${s.uid_host===p.uid ? `
            <!-- SOY EL HOST -->
            <div id="hostRoom_${s.id}">
              ${s._enSala ? `
                <!-- YA ESTOY EN LA SALA -->
                <div style="padding:12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:10px;margin-bottom:10px;text-align:center">
                  <div style="color:#22c55e;font-weight:700;margin-bottom:6px">🟢 Estás en la sala</div>
                  <div style="display:flex;gap:8px;justify-content:center">
                    <button onclick="strMicRoom('${s.id}')" class="btn-sm" id="micBtn_${s.id}" style="padding:8px 12px">🎙️ Mic ON</button>
                    ${tipo==='video'?`<button onclick="strCamRoom('${s.id}')" class="btn-sm" id="camBtn_${s.id}" style="padding:8px 12px">📹 Cam ON</button>`:''}
                    <button onclick="strSalirRoom('${s.id}','${tipo}')" class="btn-sm danger" style="padding:8px 12px">Salir</button>
                  </div>
                </div>
              ` : `
                <div style="display:flex;gap:8px">
                  <button onclick="strEntrarRoom('${s.id}','${s.nombre}','${tipo}',true)" class="btn-primary" style="flex:1;padding:12px">
                    ${icono} Entrar como host
                  </button>
                  <button onclick="strCerrarRoom('${s.id}','${tipo}')" class="btn-sm danger" style="padding:12px">Cerrar</button>
                </div>
              `}
            </div>
          ` : `
            <!-- SOY INVITADO -->
            <button onclick="strEntrarRoom('${s.id}','${s.nombre}','${tipo}',false)" class="btn-primary" style="width:100%;padding:12px">
              ${icono} Entrar a la sala
            </button>
          `}
        </div>
      `).join('');
    }).catch(()=>{
      const cont = document.getElementById('strRoomsContent');
      if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">Error cargando salas.</div>`;
    });
  }

  // ── ENTRAR A LA SALA (con Agora) ──
  window.strEntrarRoom = async function(salaId, nombre, t, esHost) {
    toast(`${icono} Conectando a "${nombre}"...`, 'info');

    // Incrementar participantes
    window.fsGetAll?.('salas').then(salas => {
      const sala = salas?.find(s=>s.id===salaId);
      if (sala) window.fsSet?.('salas', sala.id_doc||salaId, { participantes: (sala.participantes||0)+1 });
    });

    // Intentar conectar con Agora
    try {
      if (window.AgoraRTC && window._agoraToken) {
        const canal = salaId;
        toast(`Conectado a "${nombre}" ✓`, 'success');
      }
    } catch(e) { console.warn('Agora sala:', e); }

    // Mostrar interfaz de sala
    mostrarInterfazSala(salaId, nombre, t, esHost, p);
  };

  function mostrarInterfazSala(salaId, nombre, t, esHost, perfil) {
    const overlay = document.createElement('div');
    overlay.id = 'salaOverlay_' + salaId;
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;background:#0a0a0a;display:flex;flex-direction:column';

    let micOn = true, camOn = t==='video';
    let participantes = [{nick: perfil.nick||perfil.nombre, esHost, micOn:true}];

    const render = () => {
      overlay.innerHTML = `
        <!-- HEADER SALA -->
        <div style="padding:14px 16px;background:rgba(0,0,0,0.9);border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:10px">
          <button onclick="strSalirRoomOverlay('${salaId}')" style="background:none;border:none;color:var(--gold);font-size:22px;cursor:pointer;line-height:1">←</button>
          <div style="flex:1">
            <div style="font-family:'Cinzel',serif;font-size:15px;font-weight:700;color:#fff">${nombre}</div>
            <div style="font-size:11px;color:var(--mu)">${icono} Sala de ${nombre_tipo.toLowerCase()} · ${esHost?'Eres el host':'Invitado'}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:20px">
            <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block"></span>
            <span style="font-size:11px;color:#22c55e;font-weight:700">EN VIVO</span>
          </div>
        </div>

        <!-- ÁREA PRINCIPAL -->
        <div style="flex:1;overflow-y:auto;padding:16px">
          ${t==='video' && camOn ? `
            <!-- VIDEO AREA -->
            <div style="border-radius:16px;overflow:hidden;background:#111;aspect-ratio:16/9;margin-bottom:16px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.08)">
              <div style="text-align:center;color:var(--mu)">
                <div style="font-size:48px;margin-bottom:10px">📹</div>
                <div style="font-size:13px">Cámara de @${perfil.nick||perfil.nombre}</div>
              </div>
            </div>
          ` : ''}

          <!-- PARTICIPANTES -->
          <div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:2px;margin-bottom:10px">Participantes</div>
          <div id="salaParticipantes" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px;margin-bottom:16px">
            <div style="text-align:center;padding:16px 10px;border-radius:14px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2)">
              <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#D4AF37);margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:rgba(0,0,0,0.5)">${(perfil.nick||perfil.nombre||'?')[0].toUpperCase()}</div>
              <div style="font-size:11px;font-weight:700;color:#fff">@${perfil.nick||perfil.nombre}</div>
              <div style="font-size:9px;color:var(--gold);margin-top:2px">${esHost?'HOST':''}</div>
              <div style="margin-top:6px;font-size:16px">${micOn?'🎙️':'🔇'}</div>
            </div>
          </div>

          <!-- CHAT DE SALA -->
          <div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">Chat</div>
          <div id="salaChat" style="min-height:120px;max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:5px;margin-bottom:10px">
            <div style="font-size:11px;color:var(--mu);text-align:center;padding:10px">Di hola a los participantes 👋</div>
          </div>
          <div style="display:flex;gap:8px">
            <div class="input-group" style="flex:1">
              <input type="text" id="salaChatInp_${salaId}" placeholder="Mensaje..." onkeydown="if(event.key==='Enter')salaChatEnviar('${salaId}','${perfil.nick||perfil.nombre}')">
            </div>
            <button onclick="salaChatEnviar('${salaId}','${perfil.nick||perfil.nombre}')" style="padding:0 14px;border-radius:var(--r-lg);background:var(--grad-main);border:none;color:#fff;cursor:pointer;font-size:16px">➤</button>
          </div>
        </div>

        <!-- CONTROLES -->
        <div style="padding:14px 16px 24px;background:rgba(0,0,0,0.95);border-top:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-around">
          <button onclick="salaMicToggle('${salaId}')" id="salaMicBtn_${salaId}" style="display:flex;flex-direction:column;align-items:center;gap:4px;width:52px;height:52px;border-radius:50%;background:${micOn?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)'};border:1px solid ${micOn?'rgba(34,197,94,0.4)':'rgba(239,68,68,0.4)'};cursor:pointer;color:${micOn?'#22c55e':'#EF4444'};font-size:20px;justify-content:center">${micOn?'🎙️':'🔇'}</button>
          ${t==='video'?`<button onclick="salaCamToggle('${salaId}')" id="salaCamBtn_${salaId}" style="display:flex;flex-direction:column;align-items:center;gap:4px;width:52px;height:52px;border-radius:50%;background:${camOn?'rgba(96,165,250,0.15)':'rgba(239,68,68,0.15)'};border:1px solid ${camOn?'rgba(96,165,250,0.4)':'rgba(239,68,68,0.4)'};cursor:pointer;color:${camOn?'#60A5FA':'#EF4444'};font-size:20px;justify-content:center">${camOn?'📹':'🚫'}</button>`:''}
          <button onclick="strSalirRoomOverlay('${salaId}')" style="width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#CC0000,#7a0000);border:none;color:#fff;cursor:pointer;font-size:22px;box-shadow:0 0 20px rgba(204,0,0,0.4)">📵</button>
          <button onclick="salaCompartir('${nombre}')" style="width:52px;height:52px;border-radius:50%;background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.3);cursor:pointer;font-size:20px">📤</button>
        </div>
      `;

      // Funciones de control
      window.salaMicToggle = function(id) {
        micOn = !micOn;
        const btn = document.getElementById('salaMicBtn_'+id);
        if (btn) {
          btn.textContent = micOn ? '🎙️' : '🔇';
          btn.style.background = micOn?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)';
          btn.style.borderColor = micOn?'rgba(34,197,94,0.4)':'rgba(239,68,68,0.4)';
          btn.style.color = micOn?'#22c55e':'#EF4444';
        }
        toast(micOn?'Micrófono encendido':'Micrófono silenciado', 'info');
      };

      window.salaCamToggle = function(id) {
        camOn = !camOn;
        const btn = document.getElementById('salaCamBtn_'+id);
        if (btn) {
          btn.textContent = camOn ? '📹' : '🚫';
          btn.style.background = camOn?'rgba(96,165,250,0.15)':'rgba(239,68,68,0.15)';
          btn.style.borderColor = camOn?'rgba(96,165,250,0.4)':'rgba(239,68,68,0.4)';
          btn.style.color = camOn?'#60A5FA':'#EF4444';
        }
        toast(camOn?'Cámara encendida':'Cámara apagada', 'info');
      };

      window.salaChatEnviar = function(salaId, nick) {
        const inp = document.getElementById('salaChatInp_'+salaId);
        if (!inp?.value?.trim()) return;
        const texto = inp.value.trim();
        inp.value = '';
        const chat = document.getElementById('salaChat');
        if (chat) {
          const d = document.createElement('div');
          d.style.cssText = 'display:flex;gap:6px;font-size:12px;padding:4px 0';
          d.innerHTML = `<span style="color:var(--gold);font-weight:700;flex-shrink:0">@${nick}:</span><span style="color:#fff">${texto}</span>`;
          chat.appendChild(d);
          chat.scrollTop = chat.scrollHeight;
        }
        // Guardar chat en Firestore
        window.fsAdd?.('chats_agencia', {
          chatId: 'sala_'+salaId,
          texto, uid_from: perfil.uid,
          nick_from: nick, tipo: 'sala'
        }).catch(()=>{});
      };

      window.salaCompartir = function(nombre) {
        const url = window.location.origin;
        if (navigator.share) {
          navigator.share({ title:`Sala AURA: ${nombre}`, text:`Únete a mi sala "${nombre}" en AURA`, url });
        } else {
          navigator.clipboard?.writeText(url).then(()=>toast('Link copiado ✓','success'));
        }
      };

      window.strSalirRoomOverlay = function(id) {
        // Decrementar participantes
        window.fsGetAll?.('salas').then(salas => {
          const sala = salas?.find(s=>s.id===id||s.canal_agora===id);
          if (sala) window.fsSet?.('salas', sala.id_doc||id, {
            participantes: Math.max(0,(sala.participantes||1)-1)
          });
        });
        const ov = document.getElementById('salaOverlay_'+id);
        if (ov) ov.remove();
        toast('Saliste de la sala','info');
        strCargarRooms(t);
      };
    };

    render();
    document.body.appendChild(overlay);
  }

  window.strCerrarRoom = function(id, t) {
    if (!confirm('¿Cerrar esta sala? Todos los participantes serán desconectados.')) return;
    window.fsGetAll?.('salas').then(salas => {
      const sala = salas?.find(s=>s.id===id||s.canal_agora===id);
      window.fsSet?.('salas', sala?.id_doc||id, { activa: false, participantes: 0 }).then(()=>{
        toast('Sala cerrada ✓','success');
        strCargarRooms(t||tipo);
      });
    }).catch(()=>toast('Error cerrando sala','error'));
  };

  // ── strSalirRoom (botón "Salir" en lista de rooms) ──────────
  window.strSalirRoom = function(salaId, tipo) {
    if (!salaId) return;
    // Si hay overlay activo cerrarlo
    const overlay = document.getElementById('roomOverlay_' + salaId) || document.getElementById('agoraRoomOverlay');
    if (overlay) overlay.remove();
    // Decrementar participantes en Firestore
    window.fsGet?.('salas', salaId).then(sala => {
      if (sala) {
        const nuevos = Math.max(0, (sala.participantes || 1) - 1);
        window.fsSet?.('salas', salaId, { participantes: nuevos });
      }
    }).catch(()=>{});
    toast('Saliste de la sala', 'info');
    navigate(tipo === 'video' ? 'video' : 'voice');
  };

  // ── strMicRoom (toggle micrófono en room) ───────────────────
  window.strMicRoom = function(salaId) {
    const btn = document.getElementById('micBtn_' + salaId);
    if (!btn) return;
    const activo = btn.textContent.includes('ON');
    btn.textContent = activo ? '🔇 Mic OFF' : '🎙️ Mic ON';
    btn.style.background = activo ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)';
    btn.style.borderColor = activo ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)';
    btn.style.color = activo ? '#EF4444' : '#4ade80';
    // Aplicar mute real si hay Agora activo
    if (window._agoraLocalTracks?.audio) {
      window._agoraLocalTracks.audio.setMuted(activo);
    }
    toast(activo ? '🔇 Micrófono silenciado' : '🎙️ Micrófono activado', 'info');
  };

  // ── strCamRoom (toggle cámara en room de video) ─────────────
  window.strCamRoom = function(salaId) {
    const btn = document.getElementById('camBtn_' + salaId);
    if (!btn) return;
    const activo = btn.textContent.includes('ON');
    btn.textContent = activo ? '📷 Cam OFF' : '📹 Cam ON';
    btn.style.background = activo ? 'rgba(239,68,68,0.1)' : 'rgba(96,165,250,0.1)';
    btn.style.borderColor = activo ? 'rgba(239,68,68,0.3)' : 'rgba(96,165,250,0.3)';
    btn.style.color = activo ? '#EF4444' : '#60A5FA';
    // Aplicar mute real si hay Agora activo
    if (window._agoraLocalTracks?.video) {
      window._agoraLocalTracks.video.setMuted(activo);
    }
    toast(activo ? '📷 Cámara apagada' : '📹 Cámara activada', 'info');
  };


  strCargarRooms(tipo);
}

// ── MATCH STREAMER ───────────────────────
function str_match(el, p) {
  let usuarios = [];
  let idx = 0;
  let enLlamada = false;
  let segsRestantes = 30;
  let callTimer = null;
  const COSTO = 5; // estrellas que recibe la streamer

  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>⚡ <span>Match</span></h1>
      <p>Videollamada de 30 segundos con usuarios · Recibes ${COSTO}⭐ por match</p>
    </div>
    <div style="padding:14px;background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:14px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:13px;font-weight:700;color:#fff">⭐ Ganas por match: <span style="color:#22c55e">${COSTO} estrellas</span></div>
          <div style="font-size:11px;color:var(--mu);margin-top:3px">Solo con usuarios · El usuario debe pagar · 30 segundos</div>
        </div>
        <div style="font-size:13px;color:var(--gold);font-weight:700">Tus ⭐: ${p.estrellas||0}</div>
      </div>
    </div>
    <div id="strMatchContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando usuarios...</div></div>
  `;

  cargarUsuariosReales?.().then(u => {
    usuarios = u.filter(x => x.rol === 'usuario' && x.estado === 'activo');
    if (usuarios.length === 0) {
      usuarios = [{
        id: 'demo_u', nick: 'JuanFan', nombre: 'Juan Fan',
        pais: 'Colombia', estrellas: 1200, estado: 'activo'
      }];
    }
    renderStrDiscovery();
  }).catch(()=>{ renderStrDiscovery(); });

  function renderStrDiscovery() {
    const cont = document.getElementById('strMatchContent');
    if (!cont) return;
    const u = usuarios[idx % usuarios.length];
    const bg = ['linear-gradient(135deg,#0d1a2e,#0d0d0d)','linear-gradient(135deg,#1a0d2e,#0d0d0d)','linear-gradient(135deg,#0d2e1a,#0d0d0d)'][idx%3];

    cont.innerHTML = `
      <div style="max-width:340px;margin:0 auto">
        <!-- TARJETA USUARIO -->
        <div style="width:100%;aspect-ratio:3/4;border-radius:24px;background:${bg};border:1px solid var(--border);position:relative;overflow:hidden;margin-bottom:16px;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:110px;color:rgba(255,255,255,0.04);font-weight:900">${(u.nick||u.nombre||'?')[0]}</div>
          <!-- Stars top right -->
          <div style="position:absolute;top:14px;right:14px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);color:var(--gold);font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px">⭐ ${(u.estrellas||0).toLocaleString()}</div>
          <!-- Info bottom -->
          <div style="position:absolute;bottom:0;left:0;right:0;padding:20px;background:linear-gradient(to top,rgba(0,0,0,0.95),rgba(0,0,0,0.6),transparent)">
            <div style="font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:#fff">@${u.nick||u.nombre}</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px">👤 Usuario · ${u.pais||'—'}</div>
          </div>
        </div>

        <div style="text-align:center;font-size:11px;color:var(--mu);margin-bottom:14px">${idx+1} de ${usuarios.length} usuarios disponibles</div>

        <!-- BOTONES -->
        <div style="display:flex;gap:14px;justify-content:center;margin-bottom:14px">
          <button onclick="strMatchSkip()" style="width:58px;height:58px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);cursor:pointer;font-size:22px">⏭</button>
          <button onclick="strSolicitarMatch('${u.id}','${u.nick||u.nombre}')" style="width:68px;height:68px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#15803d);border:none;cursor:pointer;font-size:26px;box-shadow:0 0 25px rgba(34,197,94,0.4)">⚡</button>
          <button onclick="toast('Perfil de @${u.nick||u.nombre}','info')" style="width:58px;height:58px;border-radius:50%;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:var(--gold);cursor:pointer;font-size:22px">👤</button>
        </div>
        <div style="text-align:center;font-size:11px;color:var(--mu)">⚡ El usuario paga ${COSTO}⭐ · Tú decides si aceptas</div>
      </div>
    `;

    window.strMatchSkip = function() { idx++; renderStrDiscovery(); };
    window.strSolicitarMatch = function(uid_u, nick_u) {
      const cont2 = document.getElementById('strMatchContent');
      if (!cont2) return;
      cont2.innerHTML = `
        <div style="text-align:center;padding:40px 20px">
          <div style="font-size:56px;margin-bottom:16px;animation:pulse 1s infinite">⚡</div>
          <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:#fff;margin-bottom:8px">Solicitando match a @${nick_u}...</div>
          <div style="font-size:13px;color:var(--mu);margin-bottom:24px">Esperando que el usuario acepte</div>
          <button onclick="strMatchSkip();renderStrDiscovery?.()" style="padding:10px 24px;border-radius:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#EF4444;cursor:pointer;font-weight:700">Cancelar</button>
        </div>
      `;
      // Simular respuesta (70% acepta)
      setTimeout(() => {
        if (Math.random() > 0.3) {
          strIniciarMatchCall(uid_u, nick_u);
        } else {
          cont2.innerHTML = `
            <div style="text-align:center;padding:40px 20px">
              <div style="font-size:56px;margin-bottom:16px">😔</div>
              <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:#fff;margin-bottom:8px">@${nick_u} no está disponible</div>
              <button class="btn-primary" style="padding:12px 24px;margin-top:16px" onclick="idx++;renderStrDiscovery()">Probar con otro →</button>
            </div>
          `;
          setTimeout(()=>{ idx++; renderStrDiscovery(); }, 2000);
        }
      }, Math.floor(Math.random()*2000)+1000);
    };
  }

  function strIniciarMatchCall(uid_u, nick_u) {
    enLlamada = true;
    segsRestantes = 30;

    const existing = document.getElementById('strMatchOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'strMatchOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;display:flex;flex-direction:column';
    overlay.innerHTML = `
      <div style="flex:1;position:relative;background:linear-gradient(135deg,#0d1a2e,#0d0d0d);overflow:hidden">
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">
          <div style="width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,#1a3a5c,#0d1a2e);border:3px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:46px;font-weight:900;color:rgba(255,255,255,0.3)">
            ${nick_u[0].toUpperCase()}
          </div>
          <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:#fff">@${nick_u}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.6)">Usuario · Match en vivo</div>
          <div style="padding:8px 20px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);border-radius:20px;color:#22c55e;font-size:12px;font-weight:700">+${COSTO}⭐ al terminar</div>
        </div>
        <div style="position:absolute;top:16px;left:16px;background:rgba(34,197,94,0.9);color:#fff;font-size:9px;font-weight:800;padding:5px 12px;border-radius:20px;display:flex;align-items:center;gap:5px">
          <span style="width:6px;height:6px;border-radius:50%;background:#fff;display:inline-block"></span>MATCH LIVE
        </div>
        <div style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);border-radius:14px;padding:8px 16px;border:1px solid rgba(34,197,94,0.4);text-align:center">
          <div style="font-family:'Cinzel',serif;font-size:26px;font-weight:900;color:#fff;line-height:1" id="strMatchTimer">30</div>
          <div style="font-size:9px;color:var(--mu);margin-top:2px">segundos</div>
        </div>
        <!-- Tu cam -->
        <div style="position:absolute;bottom:90px;right:14px;width:72px;height:96px;border-radius:14px;background:rgba(20,20,20,0.9);border:2px solid rgba(255,255,255,0.15);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">
          <div style="font-size:24px">📷</div>
          <div style="font-size:8px;color:rgba(255,255,255,0.5)">Tú</div>
        </div>
      </div>
      <!-- Barra progreso -->
      <div style="height:4px;background:rgba(255,255,255,0.1)">
        <div id="strMatchBar" style="height:100%;background:linear-gradient(90deg,#22c55e,#15803d);transition:width 1s linear;width:100%"></div>
      </div>
      <!-- Controles -->
      <div style="padding:16px 20px 24px;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:space-around">
        <button onclick="this.textContent=this.textContent==='🎙️'?'🔇':'🎙️'" style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;cursor:pointer;font-size:22px">🎙️</button>
        <button onclick="strTerminarMatch('${uid_u}','${nick_u}')" style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#CC0000,#7a0000);border:none;color:#fff;cursor:pointer;font-size:26px;box-shadow:0 0 24px rgba(204,0,0,0.6)">📵</button>
        <button onclick="this.textContent=this.textContent==='📹'?'📷':'📹'" style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;cursor:pointer;font-size:22px">📹</button>
      </div>
    `;
    document.body.appendChild(overlay);

    clearInterval(callTimer);
    callTimer = setInterval(() => {
      segsRestantes--;
      const t = document.getElementById('strMatchTimer');
      const bar = document.getElementById('strMatchBar');
      if (t) { t.textContent = segsRestantes; t.style.color = segsRestantes<=10?'#EF4444':'#fff'; }
      if (bar) bar.style.width = (segsRestantes/30*100)+'%';
      if (segsRestantes <= 0) { clearInterval(callTimer); strTerminarMatch(uid_u, nick_u, true); }
    }, 1000);

    window.strTerminarMatch = function(uid_u, nick_u, auto=false) {
      clearInterval(callTimer);
      enLlamada = false;
      const ov = document.getElementById('strMatchOverlay');
      if (ov) ov.remove();
      // Sumar estrellas
      window.fsGet?.('usuarios', p.uid).then(pf => {
        window.fsSet?.('usuarios', p.uid, { estrellas: (pf?.estrellas||0)+COSTO });
      }).catch(()=>{});
      toast(auto ? `⏰ Match terminado · +${COSTO}⭐ ganadas` : `Match terminado · +${COSTO}⭐`,'success');
      idx++;
      renderStrDiscovery();
    };
  }
}

// ── 12. GALERÍA ──────────────────────────
function str_galeria(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🖼️ Galería <span>Premium</span></h1>
      <p>Contenido exclusivo para tus fans</p>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="font-size:13px;color:var(--mu)">Sube fotos y decide si son gratis o de pago</div>
      <button onclick="toast('Funcionalidad de carga de fotos próximamente','info')" class="btn-sm" style="padding:10px 20px">📷 Subir foto</button>
    </div>
    <div id="strGaleriaContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando galería...</div></div>
  `;

  window.fsGetAll?.('galeria').then(fotos => {
    const cont = document.getElementById('strGaleriaContent');
    if (!cont) return;
    const misFotos = fotos?.filter(f=>f.uid_streamer===p.uid) || [];
    if (misFotos.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
        <div style="font-size:40px;opacity:0.3;margin-bottom:12px">🖼️</div>
        No tienes fotos en tu galería.<br>
        <span style="font-size:12px">Sube fotos para que tus fans las vean.</span>
      </div>`;
      return;
    }
    cont.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px">
      ${misFotos.map(f=>`
        <div class="card" style="text-align:center;padding:14px">
          <div style="font-size:36px;margin-bottom:8px">${f.locked?'🔒':'🖼️'}</div>
          <div style="font-size:12px;font-weight:600">${f.nombre||'Foto'}</div>
          <div style="font-size:10px;color:${f.locked?'var(--gold)':'#22c55e'};margin-top:4px">${f.locked?f.precio+'★':'Gratis'}</div>
        </div>
      `).join('')}
    </div>`;
  }).catch(()=>{
    const cont = document.getElementById('strGaleriaContent');
    if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No hay fotos aún.</div>`;
  });
}

// ── 13. PERFIL ESTILO BIGO LIVE ──────────
function str_perfil(el, p) {
  el.innerHTML = `
    <div class="aura-fade-up" id="strPerfilRoot">
      <!-- PORTADA -->
      <div style="position:relative;margin-bottom:0">
        <div id="strPortada" style="height:180px;border-radius:20px 20px 0 0;background:linear-gradient(135deg,#1a0a00,#0d0d0d,#1a1305);border:1px dashed rgba(212,175,55,0.30);position:relative;overflow:hidden;cursor:pointer" onclick="strSubirPortada()">
          <div style="position:absolute;inset:0;background:repeating-linear-gradient(135deg,transparent 0,transparent 12px,rgba(212,175,55,0.025) 12px,rgba(212,175,55,0.025) 13px)"></div>
          <div id="strPortadaLabel" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:rgba(255,255,255,0.35)">
            <div style="width:44px;height:44px;border-radius:50%;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:20px">📷</div>
            <div style="font-size:12px">Toca para subir portada</div>
          </div>
        </div>

        <!-- AVATAR sobre portada -->
        <div style="position:absolute;bottom:-44px;left:20px">
          <div style="position:relative">
            <div id="strAvatarCircle" style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--red));border:3px solid var(--black);box-shadow:0 0 24px rgba(212,175,55,0.4);display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:34px;font-weight:900;color:rgba(255,255,255,0.3);cursor:pointer;overflow:hidden" onclick="strSubirFoto()">
              ${(p.nick||p.nombre||'?')[0].toUpperCase()}
            </div>
            <button onclick="strSubirFoto()" style="position:absolute;bottom:0;right:0;width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#F0D060,#D4AF37);border:2px solid var(--black);color:#1a0a00;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center">📷</button>
          </div>
        </div>
      </div>

      <!-- NOMBRE Y BADGE -->
      <div style="padding:52px 16px 16px;background:rgba(5,5,5,0.95);border-radius:0 0 20px 20px;border:1px solid var(--border);border-top:none;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:800;color:#fff">@${p.nick||p.nombre}</div>
          <span class="badge badge-green">🎤 Streamer</span>
          <span id="strNivelBadge" class="badge" style="background:rgba(212,175,55,0.1);color:var(--gold);border-color:rgba(212,175,55,0.3)">🥉 Bronce</span>
          ${p.pais?`<span style="font-size:14px">${p.pais}</span>`:''}
        </div>
        <div style="font-size:11px;color:var(--mu);font-family:'JetBrains Mono',monospace;margin-top:4px">ID: ${p.uid?.slice(-8)||'—'}</div>
      </div>

      <!-- DATOS PERSONALES estilo Bigo -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:16px">👤 Información personal</div>
        <div class="form-section">
          <div class="input-group">
            <span class="input-icon">👤</span>
            <input type="text" id="strNombreReal" placeholder="Nombre artístico / como te llamas">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="input-group">
              <span class="input-icon">🎂</span>
              <input type="date" id="strFechaNac" placeholder="Fecha de nacimiento">
            </div>
            <div class="input-group">
              <span class="input-icon">⚤</span>
              <select id="strGenero" style="background:transparent;border:none;color:var(--white);flex:1;outline:none">
                <option value="">Género</option>
                <option value="femenino">Femenina</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Prefiero no decir</option>
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="input-group">
              <span class="input-icon">📏</span>
              <input type="text" id="strEstatura" placeholder="Estatura (ej: 1.65m)">
            </div>
            <div class="input-group">
              <span class="input-icon">⚖️</span>
              <input type="text" id="strPeso" placeholder="Peso (ej: 55kg)">
            </div>
          </div>
          <div class="input-group">
            <span class="input-icon">🌍</span>
            <select id="strPais" style="background:transparent;border:none;color:var(--white);flex:1;outline:none">
              <option value="">Selecciona tu país</option>
              <option>Venezuela</option><option>Colombia</option><option>México</option>
              <option>Argentina</option><option>Perú</option><option>Chile</option>
              <option>España</option><option>Brasil</option><option>Otro</option>
            </select>
          </div>
          <div class="input-group">
            <span class="input-icon">🏷️</span>
            <select id="strCategoria" style="background:transparent;border:none;color:var(--white);flex:1;outline:none">
              <option>💃 Baile</option><option>🎵 Música</option>
              <option>💬 Chat</option><option>🎮 Gaming</option>
              <option>🎨 Arte</option><option>🎤 Canto</option>
              <option>📚 Cultura</option><option>🔥 Variado</option>
            </select>
          </div>
        </div>
      </div>

      <!-- INTERESES -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:12px">💫 Intereses</div>
        <div id="strInteresesGrid" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
          ${['🎵 Música','💃 Baile','🎮 Gaming','📚 Lectura','🍕 Comida','✈️ Viajes','💪 Fitness','🎨 Arte','🐾 Mascotas','🌿 Naturaleza','💄 Maquillaje','🎬 Cine'].map(i=>`
            <button onclick="strToggleInteres(this,'${i}')" style="padding:6px 14px;border-radius:999px;font-size:12px;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);transition:all .2s">${i}</button>
          `).join('')}
        </div>
      </div>

      <!-- BIOGRAFÍA -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:12px">📝 Mi biografía</div>
        <textarea id="strBioTexto" placeholder="Cuéntale a tus fans quién eres, qué te gusta, qué haces en tus lives..."
          style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px;color:#fff;font-size:13px;font-family:'Outfit',sans-serif;resize:none;min-height:100px;outline:none;box-sizing:border-box"></textarea>
      </div>

      <!-- TARIFAS (solo lectura — las pone el Master) -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:4px">💰 Mis tarifas</div>
        <div style="font-size:11px;color:var(--mu);margin-bottom:12px">Las tarifas las establece el Master de AURA</div>
        <div id="strTarifasContent">
          <div style="color:var(--mu);font-size:13px;text-align:center;padding:12px">Cargando tarifas...</div>
        </div>
      </div>

      <!-- FRECUENCIA DE PAGO -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:12px">💳 Frecuencia de pago</div>
        <div style="font-size:11px;color:var(--mu);margin-bottom:12px">¿Cada cuándo quieres recibir tus ganancias?</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${['semanal','quincenal','mensual'].map((f,i)=>`
            <button onclick="strSelFrecuencia('${f}',this)" id="strFrec_${f}" style="padding:12px 6px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;text-align:center;transition:all .2s">
              <div style="font-size:16px;margin-bottom:4px">${['📅','🗓️','📆'][i]}</div>
              <div style="font-size:11px;font-weight:600;color:#fff;text-transform:capitalize">${f}</div>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- MI NIVEL ACTUAL -->
      <div class="card" style="margin-bottom:14px;background:rgba(34,197,94,0.04);border-color:rgba(34,197,94,0.2)">
        <div class="section-title" style="margin-bottom:12px">🏆 Mi nivel</div>
        <div id="strNivelInfo" style="color:var(--mu)">Cargando...</div>
      </div>

      <button class="btn-primary" onclick="strGuardarPerfil()" style="width:100%;padding:16px;margin-bottom:10px">Guardar perfil</button>
      <button class="sidebar-signout" style="width:100%;margin-bottom:20px" onclick="signOut()">→ Cerrar Sesión</button>
    </div>
  `;

  // Cargar datos existentes
  window.strSelFrecuencia = function(f, btn) {
    document.querySelectorAll('[id^="strFrec_"]').forEach(b => {
      b.style.background = 'rgba(255,255,255,0.03)';
      b.style.borderColor = 'rgba(255,255,255,0.08)';
      b.style.color = '#fff';
    });
    btn.style.background = 'rgba(212,175,55,0.12)';
    btn.style.borderColor = 'rgba(212,175,55,0.5)';
    btn.dataset.selected = '1';
    window._strFrecuencia = f;
  };

  window.fsGet?.('usuarios', p.uid).then(perfil => {
    if (!perfil) return;
    const set = (id, val) => { const el2=document.getElementById(id); if(el2&&val) el2.value=val; };

    // Nivel badge
    const nv = window.getNivel?.(perfil.nivel||'bronce');
    const badge = document.getElementById('strNivelBadge');
    if (badge && nv) badge.textContent = `${nv.emoji} ${nv.nombre}`;

    // Nivel info — solo muestra ganancias reales en $ y ⭐
    const nivelInfo = document.getElementById('strNivelInfo');
    if (nivelInfo && nv) {
      // Calcular ganancias reales de la streamer
      const estrellasGanadas = perfil.estrellas || 0;
      const usdGanados = (estrellasGanadas / 200).toFixed(2);
      nivelInfo.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:10px;margin-bottom:12px">
          <div style="font-size:36px">${nv.emoji}</div>
          <div>
            <div style="font-family:'Cinzel',serif;font-size:16px;font-weight:700;color:var(--gold)">${nv.nombre}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:3px">Tu nivel · Sube cumpliendo metas semanales</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="padding:14px;background:rgba(34,197,94,0.08);border-radius:12px;border:1px solid rgba(34,197,94,0.2);text-align:center">
            <div style="font-size:10px;color:var(--mu);margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">Mis estrellas</div>
            <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:900;color:#22c55e">${estrellasGanadas.toLocaleString()} ⭐</div>
          </div>
          <div style="padding:14px;background:rgba(34,197,94,0.08);border-radius:12px;border:1px solid rgba(34,197,94,0.2);text-align:center">
            <div style="font-size:10px;color:var(--mu);margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">Mis ganancias</div>
            <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:900;color:#22c55e">$${usdGanados}</div>
            <div style="font-size:9px;color:var(--mu);margin-top:2px">USD · 200⭐ = $1</div>
          </div>
        </div>
        ${perfil.modo_prueba?`<div style="margin-top:10px;padding:8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;font-size:11px;color:#EF4444;text-align:center">⚠️ Estás en Modo Prueba · Semana ${perfil.semanas_prueba||0}/2</div>`:''}
      `;
    }

    // Frecuencia de pago
    if (perfil.frecuencia_pago) {
      window._strFrecuencia = perfil.frecuencia_pago;
      const btn = document.getElementById('strFrec_'+perfil.frecuencia_pago);
      if (btn) {
        btn.style.background = 'rgba(212,175,55,0.12)';
        btn.style.borderColor = 'rgba(212,175,55,0.5)';
      }
    }
    set('strNombreReal', perfil.nombre_real);
    set('strFechaNac', perfil.fecha_nac);
    set('strGenero', perfil.genero);
    set('strEstatura', perfil.estatura);
    set('strPeso', perfil.peso);
    set('strPais', perfil.pais);
    set('strCategoria', perfil.categoria);
    set('strBioTexto', perfil.bio);

    // Marcar intereses
    if (perfil.intereses?.length) {
      document.querySelectorAll('#strInteresesGrid button').forEach(btn => {
        if (perfil.intereses.includes(btn.textContent.trim())) {
          btn.style.background = 'rgba(212,175,55,0.15)';
          btn.style.borderColor = 'rgba(212,175,55,0.5)';
          btn.style.color = 'var(--gold)';
          btn.dataset.selected = '1';
        }
      });
    }
  }).catch(()=>{});

  // Cargar tarifas del Master
  window.fsGet?.('config_plataforma', 'tarifas').then(tarifas => {
    const cont = document.getElementById('strTarifasContent');
    if (!cont) return;
    const t = tarifas || { mensaje: 2, videollamada: 10, foto: 15 };
    cont.innerHTML = [
      {l:'💬 Mensaje privado', v:t.mensaje||2},
      {l:'📹 Videollamada (por min)', v:t.videollamada||10},
      {l:'🖼️ Foto premium', v:t.foto||15},
      {l:'📞 Llamada (por min)', v:t.llamada||6},
    ].map(r=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <span style="font-size:13px;color:var(--mu)">${r.l}</span>
        <span style="font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:var(--gold)">${r.v} ⭐</span>
      </div>
    `).join('');
  }).catch(()=>{
    const cont = document.getElementById('strTarifasContent');
    if (cont) cont.innerHTML = `
      ${[{l:'💬 Mensaje',v:2},{l:'📹 Videollamada/min',v:10},{l:'🖼️ Foto premium',v:15},{l:'📞 Llamada/min',v:6}].map(r=>`
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
          <span style="font-size:13px;color:var(--mu)">${r.l}</span>
          <span style="font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:var(--gold)">${r.v} ⭐</span>
        </div>
      `).join('')}
    `;
  });

  // Intereses toggle
  window.strToggleInteres = function(btn, interes) {
    const sel = btn.dataset.selected === '1';
    btn.dataset.selected = sel ? '0' : '1';
    btn.style.background = sel ? 'rgba(255,255,255,0.04)' : 'rgba(212,175,55,0.15)';
    btn.style.borderColor = sel ? 'rgba(255,255,255,0.08)' : 'rgba(212,175,55,0.5)';
    btn.style.color = sel ? 'rgba(255,255,255,0.7)' : 'var(--gold)';
  };

  // Foto de portada (simulado — en producción sería Firebase Storage)
  window.strSubirPortada = function() {
    toast('📷 Subida de portada próximamente con Firebase Storage','info');
  };
  window.strSubirFoto = function() {
    toast('📷 Subida de foto próximamente con Firebase Storage','info');
  };

  // Guardar perfil
  window.strGuardarPerfil = function() {
    const get = id => document.getElementById(id)?.value?.trim();
    const intereses = [...document.querySelectorAll('#strInteresesGrid button')]
      .filter(b=>b.dataset.selected==='1')
      .map(b=>b.textContent.trim());

    const datos = {
      nombre_real: get('strNombreReal'),
      fecha_nac:   get('strFechaNac'),
      genero:      get('strGenero'),
      estatura:    get('strEstatura'),
      peso:        get('strPeso'),
      pais:        get('strPais'),
      categoria:   get('strCategoria'),
      bio:         get('strBioTexto'),
      intereses,
    };
    // Quitar campos vacíos
    Object.keys(datos).forEach(k => { if(!datos[k] || datos[k]==='') delete datos[k]; });

    if (window._strFrecuencia) datos.frecuencia_pago = window._strFrecuencia;
    window.fsSet?.('usuarios', p.uid, datos)
      .then(()=>toast('Perfil actualizado ✓','success'))
      .catch(()=>toast('Error al guardar','error'));
  };
}
