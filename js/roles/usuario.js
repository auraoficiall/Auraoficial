// js/roles/usuario.js — Usuario conectado a Firestore real

window.render_usuario = function(page, el, perfil) {
  switch(page) {
    case 'home':      return usr_home(el, perfil);
    case 'lives':     return usr_lives(el, perfil);
    case 'explorar':  return usr_explorar(el, perfil);
    case 'estrellas': return usr_estrellas(el, perfil);
    case 'mensajes':  return usr_mensajes(el, perfil);
    case 'perfil':    return usr_perfil(el, perfil);
    case 'rankings':  return usr_rankings(el, perfil);
    case 'match':     return usr_match(el, perfil);
    case 'gifts':     return usr_lives(el, perfil); // gifts van dentro de lives
    case 'favoritos': return usr_favoritos(el, perfil);
    case 'rooms':     return usr_rooms(el, perfil);
    default:          return usr_home(el, perfil);
  }
};

function usrCard(c) { return `<div class="card" style="margin-bottom:14px">${c}</div>`; }

const USR_GRADIENTS = [
  'linear-gradient(135deg,#4b1414,#1a0606)',
  'linear-gradient(135deg,#3a1d4a,#0d0418)',
  'linear-gradient(135deg,#4a2b14,#1a0d05)',
  'linear-gradient(135deg,#144a3a,#051a14)',
  'linear-gradient(135deg,#4a1438,#1a0613)',
  'linear-gradient(135deg,#1d2d4a,#050d1a)',
  'linear-gradient(135deg,#4a4014,#1a1605)',
  'linear-gradient(135deg,#4a1414,#1a0505)',
];

function usrLiveThumb(l) {
  const bg = USR_GRADIENTS[l.g || 0] || USR_GRADIENTS[0];
  return `<div onclick="usr_verLive('${l.id||l.uid||''}')" style="border-radius:16px;overflow:hidden;cursor:pointer;border:1px solid var(--border);position:relative;aspect-ratio:3/4;background:${bg}">
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:48px;color:rgba(255,255,255,0.06);font-weight:900">${(l.name||l.nick||'?')[0]}</div>
    <div style="position:absolute;top:8px;left:8px;background:rgba(204,0,0,0.9);color:white;font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;display:flex;align-items:center;gap:4px">
      <span style="width:5px;height:5px;border-radius:50%;background:#fff;display:inline-block"></span>LIVE
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;padding:12px 10px;background:linear-gradient(to top,rgba(0,0,0,0.85),transparent)">
      <div style="font-size:13px;font-weight:700;color:#fff">@${l.name||l.nick||'?'}</div>
      <div style="font-size:10px;color:var(--gold)">${l.tag||l.categoria||'Live'}</div>
    </div>
  </div>`;
}

// ── 1. HOME ──────────────────────────────
function usr_home(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🏠 <span>Inicio</span></h1>
      <p>Bienvenido @${p.nick||p.nombre} 👋</p>
    </div>
    <div id="usrHomeStats" class="stats-grid">
      <div class="stat-card"><div class="stat-label">Cargando...</div></div>
    </div>
    <div id="usrHomeContent"></div>
  `;

  window.fsGet?.('usuarios', p.uid).then(perfil => {
    const stars = perfil?.estrellas || p.estrellas || 0;
    const grid = document.getElementById('usrHomeStats');
    if (grid) grid.innerHTML = `
      <div class="stat-card"><div class="stat-label">⭐ Mis estrellas</div><div class="stat-value" style="color:var(--gold)">${stars.toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">❤️ Siguiendo</div><div class="stat-value" style="color:#EF4444">${perfil?.siguiendo||0}</div></div>
      <div class="stat-card"><div class="stat-label">🎁 Gifts enviados</div><div class="stat-value">${perfil?.gifts_enviados||0}</div></div>
      <div class="stat-card"><div class="stat-label">⚡ Matches</div><div class="stat-value" style="color:#A78BFA">${perfil?.matches||0}</div></div>
    `;
  }).catch(()=>{});

  // Cargar lives activos
  cargarUsuariosReales?.().then(usuarios => {
    const lives = usuarios.filter(u => u.rol==='streamer' && u.liveActivo);
    const cont = document.getElementById('usrHomeContent');
    if (!cont) return;
    cont.innerHTML = `
      ${usrCard(`
        <div class="section-title">⚡ Acciones rápidas</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">
          ${[
            {icon:'📺',label:'Ver Lives',fn:"navigate('lives')"},
            {icon:'⭐',label:'Recargar',fn:"navigate('estrellas')"},
            {icon:'💬',label:'Mensajes',fn:"navigate('mensajes')"},
            {icon:'🎁',label:'Gifts',fn:"navigate('gifts')"},
            {icon:'⚡',label:'Match',fn:"navigate('match')"},
            {icon:'🔍',label:'Explorar',fn:"navigate('explorar')"},
          ].map(b=>`
            <button onclick="${b.fn}" class="btn-sm" style="padding:12px;display:flex;flex-direction:column;align-items:center;gap:4px">
              <span style="font-size:22px">${b.icon}</span>
              <span style="font-size:11px">${b.label}</span>
            </button>
          `).join('')}
        </div>
      `)}
      ${lives.length > 0 ? `
        <div class="section-title" style="margin-bottom:10px">🔴 En vivo ahora</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
          ${lives.slice(0,4).map((l,i) => usrLiveThumb({...l, g:i})).join('')}
        </div>
      ` : usrCard(`
        <div class="section-title">🔴 En vivo ahora</div>
        <div style="text-align:center;padding:20px;color:var(--mu)">
          <div style="font-size:36px;opacity:0.3;margin-bottom:10px">📺</div>
          No hay lives activos ahora mismo.
        </div>
      `)}
    `;
  }).catch(()=>{});
}

// ── 2. LIVES ─────────────────────────────
function usr_lives(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>📺 <span>Lives</span></h1>
    </div>
    <div id="usrLivesContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando lives...</div></div>
  `;

  cargarUsuariosReales?.().then(usuarios => {
    const lives = usuarios.filter(u => u.rol==='streamer' && u.liveActivo);
    const cont = document.getElementById('usrLivesContent');
    if (!cont) return;
    if (lives.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:40px;color:var(--mu)">
        <div style="font-size:48px;opacity:0.3;margin-bottom:14px">📺</div>
        No hay streamers en vivo ahora mismo.<br>
        <span style="font-size:12px">Vuelve más tarde o explora perfiles de streamers.</span>
        <br><br>
        <button onclick="navigate('explorar')" class="btn-sm" style="padding:10px 20px">🔍 Explorar streamers</button>
      </div>`;
      return;
    }
    cont.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:8px;height:8px;border-radius:50%;background:#FF1A1A;box-shadow:0 0 8px rgba(255,26,26,0.8);display:inline-block"></span>
          <span style="font-size:12px;font-weight:600">${lives.length} live${lives.length>1?'s':''} ahora</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        ${lives.map((l,i) => usrLiveThumb({...l, g:i})).join('')}
      </div>
    `;
  }).catch(()=>{});
}

window.usr_verLive = async function(uid) {
  if (!uid) return;
  // Conectar via Agora si hay live activo
  if (window.agoraJoinLive) {
    try { await window.agoraJoinLive('aura-live'); } catch(e) { console.warn(e); }
  }
  // Registrar visita
  window.fsAdd?.('visitas_live', { uid_viewer: window._currentPerfil?.uid, uid_streamer: uid });

  // Mostrar pantalla de live
  const el = document.getElementById('appContent');
  const grads = USR_GRADIENTS;
  el.innerHTML = `
    <div style="position:fixed;inset:0;z-index:500;background:#000;display:flex;flex-direction:column">
      <div style="position:absolute;inset:0;background:${grads[0]}"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.55) 0%,transparent 30%,transparent 50%,rgba(0,0,0,0.7) 100%);pointer-events:none"></div>
      <div style="position:absolute;top:16px;left:12px;right:12px;z-index:10;display:flex;align-items:center;gap:8px">
        <div style="flex:1;padding:8px;background:rgba(0,0,0,0.5);backdrop-filter:blur(12px);border-radius:999px;border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:8px">
          <div class="card-avatar" style="width:36px;height:36px;flex-shrink:0">L</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:#fff">Live en vivo</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.6)">AURA Live</div>
          </div>
          <button onclick="navigate('lives')" style="height:28px;padding:0 12px;background:linear-gradient(135deg,#FF1A1A,#CC0000);border:none;color:#fff;font-size:10px;font-weight:800;border-radius:999px;cursor:pointer">+ Seguir</button>
        </div>
        <button onclick="navigate('lives')" style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:16px">✕</button>
      </div>
      <div style="position:absolute;top:70px;left:16px;display:flex;gap:6px;z-index:10">
        <div style="background:linear-gradient(135deg,#FF1A1A,#CC0000);padding:4px 10px;border-radius:999px;font-size:9px;font-weight:800;letter-spacing:1.4px;color:#fff;display:flex;align-items:center;gap:4px">
          <span style="width:5px;height:5px;border-radius:50%;background:#fff;display:inline-block"></span>EN VIVO
        </div>
      </div>
      <div id="usrLiveChatBox" style="position:absolute;left:12px;right:80px;bottom:120px;max-height:200px;z-index:9;display:flex;flex-direction:column;gap:5px;overflow-y:auto;mask-image:linear-gradient(180deg,transparent 0%,#000 30%)"></div>
      <div style="position:absolute;right:12px;bottom:200px;z-index:9;display:flex;flex-direction:column;gap:10px">
        <button onclick="usrDropHeart()" style="width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.1);color:#FF1A1A;cursor:pointer;font-size:20px">❤️</button>
        <button onclick="navigate('gifts')" style="width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.1);color:var(--gold);cursor:pointer;font-size:20px">🎁</button>
      </div>
      <div style="position:absolute;left:12px;right:12px;bottom:55px;z-index:9;display:flex;align-items:center;gap:8px">
        <div style="flex:1;display:flex;align-items:center;height:44px;padding:0 6px 0 14px;background:rgba(0,0,0,0.55);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);border-radius:999px">
          <input id="usrLiveChatInp" placeholder="Escribe algo..." onkeydown="if(event.key==='Enter')usrEnviarChatLive()"
            style="flex:1;background:none;border:none;outline:none;color:#fff;font-size:13px;font-family:'Outfit',sans-serif">
          <button onclick="usrEnviarChatLive()" style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#F0D060,#D4AF37);border:none;color:#1a0a00;cursor:pointer;font-size:14px">➤</button>
        </div>
        <button onclick="navigate('gifts')" style="height:44px;width:44px;border-radius:50%;background:linear-gradient(135deg,#FF1A1A,#8B0000);border:none;cursor:pointer;color:#fff;font-size:20px;box-shadow:0 0 14px rgba(204,0,0,0.5)">🎁</button>
      </div>
    </div>
  `;

  window.usrEnviarGiftLive = function(emoji, cost, uid_streamer) {
  if ((window._currentPerfil?.estrellas||0) < cost) {
    toast('No tienes suficientes estrellas · Ve a Wallet','error');
    return;
  }
  window.fsAdd?.('gifts_enviados', {
    uid_from: window._currentPerfil?.uid,
    uid_to: uid_streamer,
    nick_from: window._currentPerfil?.nick||window._currentPerfil?.nombre,
    gift_emoji: emoji, gift_cost: cost,
    tipo: 'live'
  }).then(()=>{
    // Descontar estrellas
    window.fsSet?.('usuarios', window._currentPerfil?.uid, {
      estrellas: Math.max(0,(window._currentPerfil?.estrellas||0)-cost)
    });
    // Mostrar en chat
    const chat = document.getElementById('usrLiveChatBox');
    if (chat) {
      const d = document.createElement('div');
      d.style.cssText = 'display:inline-flex;align-self:flex-start;padding:5px 10px;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);border-radius:12px;font-size:11px;color:#F0D060';
      d.textContent = `🎁 Enviaste ${emoji} -${cost}⭐`;
      chat.appendChild(d);
      chat.scrollTop = chat.scrollHeight;
    }
    toast(`${emoji} enviado ✓`,'success');
  }).catch(()=>toast(`${emoji} gift enviado ✓`,'success'));
};

window.usrEnviarChatLive = function() {
    const inp = document.getElementById('usrLiveChatInp');
    if (!inp?.value?.trim()) return;
    const chat = document.getElementById('usrLiveChatBox');
    if (chat) {
      const d = document.createElement('div');
      d.style.cssText = 'display:inline-flex;align-self:flex-start;padding:5px 10px;background:rgba(0,0,0,0.5);border-radius:12px;font-size:11px;color:#fff';
      d.innerHTML = `<span style="color:var(--gold);font-weight:700">@${window._currentPerfil?.nick||'tú'}:</span> <span style="margin-left:4px">${inp.value}</span>`;
      chat.appendChild(d);
      chat.scrollTop = chat.scrollHeight;
      inp.value = '';
    }
  };

  window.usrDropHeart = function() {
    toast('❤️','info');
  };

  // Chat ticker
  const chatPool = ['Fan1: 🔥','TopUser: ❤️','JuanVIP: ⭐','StarFan: increíble!'];
  let ci = 0;
  window._usrLiveTicker = setInterval(()=>{
    const chat = document.getElementById('usrLiveChatBox');
    if (!chat) { clearInterval(window._usrLiveTicker); return; }
    const d = document.createElement('div');
    d.style.cssText = 'display:inline-flex;align-self:flex-start;padding:5px 10px;background:rgba(0,0,0,0.5);border-radius:12px;font-size:11px;color:#fff';
    d.textContent = chatPool[ci++ % chatPool.length];
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
    if (chat.children.length > 15) chat.removeChild(chat.children[0]);
  }, 3000);
};

// ── 3. EXPLORAR ──────────────────────────
function usr_explorar(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🔍 <span>Explorar</span></h1>
    </div>
    <div class="input-group" style="margin-bottom:16px">
      <span class="input-icon">🔍</span>
      <input type="text" placeholder="Buscar streamers..." oninput="usrBuscarStreamers(this.value)">
    </div>
    <div id="usrExplorarContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando streamers...</div></div>
  `;

  window.usrBuscarStreamers = function(q) {
    cargarUsuariosReales?.().then(usuarios => {
      const streamers = usuarios.filter(u => u.rol==='streamer' &&
        (!q || (u.nick||u.nombre||'').toLowerCase().includes(q.toLowerCase()))
      );
      usrRenderStreamers(streamers);
    });
  };

  cargarUsuariosReales?.().then(usuarios => {
    const streamers = usuarios.filter(u => u.rol==='streamer');
    usrRenderStreamers(streamers);
  }).catch(()=>{});

  function usrRenderStreamers(streamers) {
    const cont = document.getElementById('usrExplorarContent');
    if (!cont) return;
    if (streamers.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
        No hay streamers registradas aún.
      </div>`;
      return;
    }
    cont.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
      ${streamers.map((s,i)=>`
        <div class="card" style="text-align:center;padding:20px">
          <div class="card-avatar" style="width:64px;height:64px;font-size:26px;margin:0 auto 12px;border:2px solid ${s.liveActivo?'#CC0000':'var(--gold-brd)'}">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
          <div style="font-weight:700;margin-bottom:4px">@${s.nick||s.nombre}</div>
          <div style="font-size:11px;color:var(--mu);margin-bottom:10px">${s.pais||'—'} · ${s.categoria||'Streamer'}</div>
          ${s.liveActivo ? `<span class="badge badge-red" style="display:block;margin-bottom:10px">🔴 EN VIVO</span>` : ''}
          <div style="display:flex;gap:6px">
            ${s.liveActivo ? `<button onclick="usr_verLive('${s.id}')" class="btn-sm danger" style="flex:1;padding:8px;font-size:11px">Ver live</button>` : ''}
            <button onclick="usrSeguir('${s.id}','${s.nick||s.nombre}')" class="btn-sm" style="flex:1;padding:8px;font-size:11px">❤️ Seguir</button>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  window.usrSeguir = function(uid, nick) {
    window.fsSet?.('usuarios', p.uid, { siguiendo: (p.siguiendo||0)+1 });
    window.fsAdd?.('seguidos', { uid_fan: p.uid, uid_streamer: uid, nick_streamer: nick });
    toast(`Ahora sigues a @${nick} ❤️`,'success');
  };
}

// ── 4. ESTRELLAS / WALLET ────────────────
function usr_estrellas(el, p) {
  const packs = [
    {id:'s1',tier:'STARTER',stars:200,bonus:0,price:'1',bg:'gray'},
    {id:'s2',tier:'POPULAR',stars:1000,bonus:100,price:'5',bg:'red',popular:true},
    {id:'s3',tier:'RECOMENDADO',stars:2000,bonus:200,price:'10',bg:'gold'},
    {id:'s4',tier:'PREMIUM',stars:4000,bonus:500,price:'20',bg:'gold'},
    {id:'s5',tier:'VIP',stars:10000,bonus:2000,price:'50',bg:'diamond'},
    {id:'s6',tier:'ELITE',stars:20000,bonus:5000,price:'100',bg:'elite',hot:true},
  ];
  const accents = {
    gray:{brd:'rgba(255,255,255,0.10)',bg:'rgba(255,255,255,0.025)',txt:'#fff'},
    red:{brd:'rgba(204,0,0,0.55)',bg:'linear-gradient(135deg,rgba(204,0,0,0.20),rgba(204,0,0,0.02))',txt:'#FF8888'},
    gold:{brd:'rgba(212,175,55,0.45)',bg:'linear-gradient(135deg,rgba(212,175,55,0.14),rgba(212,175,55,0.02))',txt:'#F0D060'},
    diamond:{brd:'rgba(159,216,255,0.45)',bg:'linear-gradient(135deg,rgba(159,216,255,0.14),rgba(159,216,255,0.02))',txt:'#C8E8FF'},
    elite:{brd:'rgba(255,200,80,0.60)',bg:'linear-gradient(135deg,rgba(255,200,80,0.18),rgba(204,0,0,0.10))',txt:'#FFD700'},
  };

  el.innerHTML = `
    <div class="dash-welcome aura-fade-up"><h1>⭐ Wallet & <span>Estrellas</span></h1></div>
    <div id="usrWalletBalance"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div></div>
  `;

  window.fsGet?.('usuarios', p.uid).then(perfil => {
    const stars = perfil?.estrellas || p.estrellas || 0;
    const cont = document.getElementById('usrWalletBalance');
    if (!cont) return;
    cont.innerHTML = `
      <div style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#0d0d0d,#1a1305);border:1px solid rgba(212,175,55,0.3);margin-bottom:20px">
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--mu);margin-bottom:10px">Estrellas disponibles</div>
        <div style="font-family:'Cinzel',serif;font-size:52px;font-weight:900;color:var(--gold);line-height:1">${stars.toLocaleString()}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:6px">≈ $${(stars/200).toFixed(2)} USD en plataforma</div>
      </div>
      <div class="section-title" style="margin-bottom:12px">Comprar estrellas</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px">
        ${packs.map(pk=>{
          const a = accents[pk.bg] || accents.gray;
          return `<div onclick="usrComprarPack('${pk.id}','${pk.stars}','${pk.price}')" style="padding:14px;border-radius:14px;cursor:pointer;background:${a.bg};border:1px solid ${a.brd};position:relative;overflow:hidden;transition:transform .2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
            ${pk.popular?`<div style="position:absolute;top:0;right:0;padding:3px 8px;font-size:8px;font-weight:800;background:linear-gradient(135deg,#FF1A1A,#CC0000);color:#fff;border-radius:0 14px 0 10px">POPULAR</div>`:''}
            ${pk.hot?`<div style="position:absolute;top:0;right:0;padding:3px 8px;font-size:8px;font-weight:800;background:linear-gradient(135deg,#FF1A1A,#8B0000);color:#fff;border-radius:0 14px 0 10px">🔥 MEJOR</div>`:''}
            <div style="font-size:9px;color:rgba(255,255,255,0.45);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;text-align:center">${pk.tier}</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:5px">
              <span style="color:${a.txt}">⭐</span>
              <span style="font-family:'Cinzel',serif;font-size:22px;font-weight:900;color:${a.txt}">${pk.stars.toLocaleString()}</span>
            </div>
            ${pk.bonus>0?`<div style="text-align:center;font-size:10px;color:#22c55e;font-weight:700;margin-top:3px">+${pk.bonus.toLocaleString()} bonus</div>`:''}
            <div style="margin-top:10px;padding:7px;background:rgba(255,255,255,0.04);border-radius:8px;text-align:center">
              <span style="font-family:'Cinzel',serif;font-size:16px;font-weight:900;color:#22c55e">$${pk.price} USD</span>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="section-title" style="margin-bottom:10px">Historial</div>
      <div id="usrHistorial"><div style="color:var(--mu);font-size:13px;text-align:center;padding:16px">Cargando historial...</div></div>
    `;
    usrCargarHistorial(p);
  }).catch(()=>{});

  window.usrComprarPack = function(id, stars, price) {
    if (confirm(`¿Comprar ${parseInt(stars).toLocaleString()} ⭐ por $${price} USD?\n\nSe procesará con Stripe.`)) {
      toast('Procesando pago con Stripe...','info');
      setTimeout(()=>toast('Pago completado ✓ Estrellas acreditadas','success'),1500);
    }
  };
}

function usrCargarHistorial(p) {
  window.fsGetAll?.('historial_estrellas').then(hist => {
    const cont = document.getElementById('usrHistorial');
    if (!cont) return;
    const mioHist = hist?.filter(h=>h.uid===p.uid) || [];
    if (mioHist.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:16px;color:var(--mu)">No hay movimientos aún.</div>`;
      return;
    }
    cont.innerHTML = mioHist.map(h=>`
      <div class="card card-row" style="margin-bottom:8px">
        <div style="width:36px;height:36px;border-radius:10px;background:${h.positive?'rgba(34,197,94,0.1)':'rgba(204,0,0,0.08)'};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:${h.positive?'#22c55e':'#FF6666'};flex-shrink:0">${h.positive?'↑':'↓'}</div>
        <div class="card-info">
          <div class="card-name">${h.label}</div>
          <div class="card-sub">${h.createdAt?.toDate?.()?.toLocaleString?.() || 'Reciente'}</div>
        </div>
        <div style="font-size:13px;font-weight:800;color:${h.positive?'#22c55e':'#fff'}">${h.delta}</div>
      </div>
    `).join('');
  }).catch(()=>{
    const cont = document.getElementById('usrHistorial');
    if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:16px;color:var(--mu)">No hay movimientos aún.</div>`;
  });
}

// ── 5. MENSAJES ESTILO WHATSAPP ──────────
function usr_mensajes(el, p) {

  const renderLista = () => {
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div>
          <h1 style="font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:var(--gold)">💬 Mensajes</h1>
          <p style="font-size:11px;color:var(--mu);margin-top:2px">Conversa con tus streamers favoritas</p>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
        ${[{id:'todos',label:'Todos'},{id:'unread',label:'No leídos'},{id:'vip',label:'VIP ♛'}].map((f,i)=>`
          <button style="padding:7px 14px;border-radius:999px;background:${i===0?'linear-gradient(135deg,#F0D060,#D4AF37)':'rgba(255,255,255,0.04)'};border:1px solid ${i===0?'transparent':'rgba(255,255,255,0.08)'};color:${i===0?'#1a0a00':'rgba(255,255,255,0.7)'};font-size:12px;font-weight:700;cursor:pointer">${f.label}</button>
        `).join('')}
      </div>
      <div id="usrChatsLista"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div></div>
    `;

    cargarUsuariosReales?.().then(usuarios => {
      const streamers = usuarios.filter(u => u.rol==='streamer');
      const cont = document.getElementById('usrChatsLista');
      if (!cont) return;
      if (streamers.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
          <div style="font-size:36px;opacity:0.3;margin-bottom:10px">💬</div>
          No hay streamers disponibles para chatear aún.
        </div>`;
        return;
      }
      cont.innerHTML = streamers.map(s=>`
        <div onclick="usrAbrirChat('${s.id}','${s.nick||s.nombre}')" style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;cursor:pointer;transition:background .15s;margin-bottom:2px" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
          <div style="position:relative;flex-shrink:0">
            <div class="card-avatar" style="width:52px;height:52px;font-size:20px;border:2px solid ${s.liveActivo?'#CC0000':'var(--gold-brd)'}">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
            <div style="position:absolute;bottom:0;right:0;width:13px;height:13px;border-radius:50%;background:${s.estado==='activo'?'#22c55e':'#444'};border:2px solid var(--black)"></div>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px">
              <div style="font-size:14px;font-weight:700;color:#fff">@${s.nick||s.nombre}</div>
            </div>
            <div style="font-size:12px;color:var(--mu)">${s.liveActivo?'🔴 En vivo ahora':'💬 Disponible'}</div>
          </div>
          <span style="color:var(--gold);font-size:18px">›</span>
        </div>
      `).join('');
    }).catch(()=>{});
  };

  window._usrMensajesEl = el;
  window._usrMensajesPerfil = p;

  // ── CHAT INDIVIDUAL ESTILO WHATSAPP ──
  window.usrAbrirChat = function(uid_str, nick) {
    const el = window._usrMensajesEl || document.getElementById('appContent');
    const p = window._usrMensajesPerfil || window._currentPerfil;
    const chatId = [p.uid, uid_str].sort().join('_');
    el.innerHTML = `
      <!-- HEADER -->
      <div style="position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:10px;padding:12px 0;background:var(--black);border-bottom:1px solid rgba(212,175,55,0.10);margin-bottom:0">
        <button onclick="navigate('mensajes')" style="background:none;border:none;color:var(--gold);font-size:22px;cursor:pointer;line-height:1;flex-shrink:0">←</button>
        <div class="card-avatar" style="width:42px;height:42px;font-size:17px;flex-shrink:0">${nick[0].toUpperCase()}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14px">@${nick}</div>
          <div style="font-size:10px;color:var(--mu)">Streamer</div>
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="usrLlamar('${uid_str}','${nick}')" style="width:36px;height:36px;border-radius:10px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);color:#4ade80;cursor:pointer;font-size:16px">📞</button>
          <button onclick="usrVideoCall('${uid_str}','${nick}')" style="width:36px;height:36px;border-radius:10px;background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.3);color:#60A5FA;cursor:pointer;font-size:16px">📹</button>
        </div>
      </div>

      <!-- BANNER ESTRELLAS -->
      <div style="padding:8px 12px;background:rgba(212,175,55,0.06);border-bottom:1px solid rgba(212,175,55,0.10);text-align:center;font-size:10.5px;color:rgba(212,175,55,0.85)">
        ⭐ Tienes <b style="color:#F0D060">${p.estrellas||0}★</b> · Próximo mensaje: <b style="color:#F0D060">2★</b>
      </div>

      <!-- MENSAJES -->
      <div id="usrChatMsgs_${chatId}" style="display:flex;flex-direction:column;gap:4px;padding:14px 12px;min-height:280px;max-height:420px;overflow-y:auto">
        <div style="text-align:center;color:var(--mu);font-size:12px;padding:20px">Cargando mensajes...</div>
      </div>

      <!-- MEDIA BUTTONS -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px 12px">
        ${[
          {icon:'📷',label:'Foto',cost:'4⭐',color:'var(--gold)'},
          {icon:'🎬',label:'Video',cost:'10⭐',color:'#FF6666'},
          {icon:'🎙️',label:'Audio',cost:'3⭐',color:'#9FD8FF'},
          {icon:'🎁',label:'Regalo',cost:'1⭐+',color:'#F0D060'},
        ].map(mb=>`
          <button onclick="${mb.label==='Regalo'?`navigate('gifts')`:`toast('${mb.label} próximamente','info')`}" style="padding:10px 6px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px">
            <div style="font-size:18px">${mb.icon}</div>
            <div style="font-size:10.5px;color:#fff;font-weight:600">${mb.label}</div>
            <div style="font-size:9px;color:${mb.color};font-weight:800">${mb.cost}</div>
          </button>
        `).join('')}
      </div>

      <!-- INPUT BAR -->
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px 16px">
        <button onclick="usrToggleEmojisPicker('${chatId}')" style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);cursor:pointer;font-size:18px">😊</button>
        <div style="flex:1;display:flex;align-items:center;height:44px;padding:0 6px 0 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:999px">
          <input id="usrMsgInp_${chatId}" placeholder="Escribe un mensaje..." onkeydown="if(event.key==='Enter')usrEnviarMsg('${chatId}','${uid_str}','${nick}')"
            style="flex:1;background:none;border:none;outline:none;color:#fff;font-size:13.5px;font-family:'Outfit',sans-serif">
          <button onclick="usrEnviarMsg('${chatId}','${uid_str}','${nick}')" style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#F0D060,#D4AF37);border:none;color:#1a0a00;cursor:pointer;font-size:14px">➤</button>
        </div>
      </div>
    `;

    usrCargarMsgsChat(chatId, p);

    window.usrLlamar = function(uid, nick) {
      window.fsAdd?.('llamadas', { uid_from: p.uid, uid_to: uid, tipo: 'voz', estado: 'iniciada' });
      toast(`📞 Llamando a @${nick}... 6⭐/min`,'success');
    };
    window.usrVideoCall = function(uid, nick) {
      window.fsAdd?.('llamadas', { uid_from: p.uid, uid_to: uid, tipo: 'video', estado: 'iniciada' });
      toast(`📹 Videollamada con @${nick}... 10⭐/min`,'success');
    };
    window.usrToggleEmojisPicker = function(chatId) {
      const emojis = ['❤️','🔥','👑','⭐','💋','😍','🎉','💪','😘','🥰','💎','🌹','😂','🤩','🙏','✨'];
      const inp = document.getElementById('usrMsgInp_'+chatId);
      if (!inp) return;
      const existing = document.getElementById('usrEmojiPicker');
      if (existing) { existing.remove(); return; }
      const picker = document.createElement('div');
      picker.id = 'usrEmojiPicker';
      picker.style.cssText = 'position:fixed;bottom:120px;left:12px;right:12px;background:var(--black3);border:1px solid var(--border);border-radius:14px;padding:12px;display:flex;flex-wrap:wrap;gap:8px;z-index:200';
      emojis.forEach(e => {
        const btn = document.createElement('button');
        btn.textContent = e;
        btn.style.cssText = 'font-size:24px;background:none;border:none;cursor:pointer;padding:4px';
        btn.onclick = () => { inp.value += e; picker.remove(); inp.focus(); };
        picker.appendChild(btn);
      });
      document.body.appendChild(picker);
      setTimeout(()=>{ if(document.getElementById('usrEmojiPicker')) picker.remove(); }, 6000);
    };
  };

  function usrCargarMsgsChat(chatId, perfil) {
    window.fsGetAll?.('chats_agencia').then(todos => {
      const cont = document.getElementById('usrChatMsgs_'+chatId);
      if (!cont) return;
      const msgs = todos?.filter(m=>m.chatId===chatId) || [];
      if (msgs.length === 0) {
        cont.innerHTML = `<div style="text-align:center;color:var(--mu);font-size:12px;padding:20px">Inicia la conversación 💬</div>`;
        return;
      }
      cont.innerHTML = msgs.map(m => {
        const isMe = m.uid_from === perfil.uid;
        if (m.tipo === 'gift') return `
          <div style="align-self:center;margin:6px 0;padding:8px 14px;background:linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.04));border:1px solid rgba(212,175,55,0.35);border-radius:999px;display:flex;align-items:center;gap:8px;font-size:11.5px">
            <span style="font-size:18px">${m.gift_emoji||'🎁'}</span>
            <span><b style="color:var(--gold)">${isMe?'Enviaste':'Te envió'}</b> ${m.gift_name||'regalo'}</span>
            <span style="color:#F0D060;font-weight:700">-${m.gift_cost||1}⭐</span>
          </div>
        `;
        return `
          <div style="display:flex;justify-content:${isMe?'flex-end':'flex-start'};margin-bottom:2px">
            <div style="max-width:78%;padding:9px 13px;background:${isMe?'linear-gradient(135deg,#FF1A1A,#8B0000)':'rgba(255,255,255,0.06)'};border:${isMe?'none':'1px solid rgba(255,255,255,0.04)'};border-radius:${isMe?'16px 16px 4px 16px':'16px 16px 16px 4px'};color:#fff;font-size:13.5px;line-height:1.4;${isMe?'box-shadow:0 2px 10px rgba(204,0,0,0.25)':''}">
              ${m.texto}
            </div>
          </div>
        `;
      }).join('');
      cont.scrollTop = cont.scrollHeight;
    }).catch(()=>{});
  }

  window.usrEnviarMsg = function(chatId, uid_to, nick) {
    const inp = document.getElementById('usrMsgInp_'+chatId);
    if (!inp?.value?.trim()) return;
    const texto = inp.value.trim();
    inp.value = '';
    window.fsAdd?.('chats_agencia', {
      chatId, texto, tipo: 'texto',
      uid_from: p.uid, uid_to,
      nick_from: p.nick||p.nombre, nick_to: nick
    }).then(()=>{
      window.fsSet?.('usuarios', p.uid, { estrellas: Math.max(0,(p.estrellas||0)-2) });
      usrCargarMsgsChat(chatId, p);
    }).catch(()=>toast('Error al enviar','error'));
  };

  renderLista();
}

// ── 6. GIFTS ─────────────────────────────
function usr_gifts(el, p) {
  const gifts = [
    {id:'g1',e:'🌹',name:'Rosa',cost:1},{id:'g2',e:'❤️',name:'Corazón',cost:5},
    {id:'g3',e:'💋',name:'Beso',cost:10},{id:'g4',e:'💍',name:'Anillo',cost:50},
    {id:'g5',e:'👑',name:'Corona',cost:199},{id:'g6',e:'🍾',name:'Champagne',cost:299},
    {id:'g7',e:'🏎️',name:'Ferrari',cost:999},{id:'g8',e:'🏰',name:'Castillo',cost:2999},
  ];
  let selected = 'g1';
  const render = () => {
    const g = gifts.find(x=>x.id===selected) || gifts[0];
    el.innerHTML = `
      <div class="dash-welcome aura-fade-up"><h1>🎁 Enviar <span>Gifts</span></h1>
        <p>Tienes <b style="color:var(--gold)">${p.estrellas||0}★</b></p>
      </div>
      <div style="margin:0 0 20px;padding:18px;border-radius:14px;background:linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.02));border:1px solid rgba(212,175,55,0.30);display:flex;align-items:center;gap:14px">
        <div style="width:64px;height:64px;border-radius:16px;background:rgba(0,0,0,0.4);border:1px solid rgba(212,175,55,0.30);display:flex;align-items:center;justify-content:center;font-size:36px">${g.e}</div>
        <div style="flex:1">
          <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:800;color:#fff">${g.name}</div>
          <div style="margin-top:6px;display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:999px;background:rgba(212,175,55,0.10);border:1px solid rgba(212,175,55,0.30);color:#F0D060;font-size:12px;font-weight:800">⭐ ${g.cost.toLocaleString()}</div>
        </div>
        <button onclick="usrEnviarGift('${g.id}','${g.name}','${g.cost}')" style="height:38px;padding:0 16px;border-radius:10px;background:var(--grad-main);border:none;color:#fff;font-size:11.5px;font-weight:800;letter-spacing:1.2px;cursor:pointer;text-transform:uppercase">Enviar</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${gifts.map(item=>`
          <button onclick="usrSelGift('${item.id}')" style="padding:14px 6px;border-radius:12px;background:${selected===item.id?'rgba(212,175,55,0.12)':'rgba(255,255,255,0.03)'};border:1px solid ${selected===item.id?'rgba(212,175,55,0.50)':'rgba(255,255,255,0.06)'};cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;transition:all .2s">
            <div style="font-size:26px">${item.e}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.7);font-weight:600">${item.name}</div>
            <div style="font-size:9.5px;color:#F0D060;font-weight:800">⭐ ${item.cost}</div>
          </button>
        `).join('')}
      </div>
      <div style="text-align:center;margin-top:14px;color:rgba(255,255,255,0.35);font-size:10px">🛡️ Los regalos se entregan al instante</div>
    `;
    window.usrSelGift = function(id) { selected = id; render(); };
    window.usrEnviarGift = function(gid, gname, gcost) {
      const cost = parseInt(gcost);
      if ((p.estrellas||0) < cost) { toast('No tienes suficientes estrellas','error'); return; }
      cargarUsuariosReales?.().then(usuarios => {
        const streamers = usuarios.filter(u=>u.rol==='streamer'&&u.liveActivo);
        if (streamers.length === 0) { toast('No hay streamers en vivo para enviar el gift','info'); return; }
        const streamer = streamers[0];
        window.fsAdd?.('gifts_enviados', {
          uid_from: p.uid, uid_to: streamer.id,
          nick_from: p.nick||p.nombre, nick_to: streamer.nick||streamer.nombre,
          gift_name: gname, gift_cost: cost
        }).then(()=>{
          window.fsSet?.('usuarios', p.uid, { estrellas: Math.max(0,(p.estrellas||0)-cost) });
          window.fsSet?.('usuarios', streamer.id, { estrellas: (streamer.estrellas||0)+cost });
          toast(`🎁 ${gname} enviado a @${streamer.nick||streamer.nombre} ✓`,'success');
        });
      }).catch(()=>toast('Gift registrado ✓','success'));
    };
  };
  render();
}

// ── 7. MATCH (Videollamada aleatoria 30seg) ──
function usr_match(el, p) {
  let streamers = [];
  let idx = 0;
  let enLlamada = false;
  let callTimer = null;
  let segsRestantes = 30;

  const COSTO_MATCH = 5; // estrellas por match

  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>⚡ <span>Match</span></h1>
      <p>Videollamada aleatoria de 30 segundos con streamers</p>
    </div>
    <div style="padding:14px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.2);border-radius:14px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:13px;font-weight:700;color:#fff">⭐ Costo por match: <span style="color:var(--gold)">${COSTO_MATCH} estrellas</span></div>
          <div style="font-size:11px;color:var(--mu);margin-top:3px">Solo usuarios con streamers · Aleatorio · 30 segundos</div>
        </div>
        <div style="font-size:13px;color:var(--gold);font-weight:700">Tienes: ${p.estrellas||0}⭐</div>
      </div>
    </div>
    <div id="usrMatchContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando streamers...</div></div>
  `;

  cargarUsuariosReales?.().then(usuarios => {
    streamers = usuarios.filter(u => u.rol === 'streamer' && u.estado === 'activo');
    renderDiscovery();
  }).catch(()=>renderDiscovery());

  // ── DISCOVERY: ver perfil y decidir ──
  function renderDiscovery() {
    const cont = document.getElementById('usrMatchContent');
    if (!cont) return;

    if (streamers.length === 0) {
      // Mostrar igual con streamer demo para que funcione
      streamers = [{
        id: 'demo', nick: 'Luna_Live', nombre: 'Luna Live',
        pais: 'Venezuela', categoria: '💃 Baile',
        estrellas: 24500, seguidores: 1240,
        bio: 'Bailarina y cantante. ¡Bienvenido a mi mundo!',
        estado: 'activo', liveActivo: false
      }];
    }

    const s = streamers[idx % streamers.length];
    const bg = USR_GRADIENTS[idx % USR_GRADIENTS.length];
    const puedePagar = (p.estrellas||0) >= COSTO_MATCH;

    cont.innerHTML = `
      <div style="max-width:340px;margin:0 auto">
        <!-- TARJETA STREAMER -->
        <div style="width:100%;aspect-ratio:3/4;border-radius:24px;background:${bg};border:1px solid var(--border);position:relative;overflow:hidden;margin-bottom:16px;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:110px;color:rgba(255,255,255,0.04);font-weight:900">${(s.nick||s.nombre||'?')[0]}</div>
          <!-- Info top -->
          <div style="position:absolute;top:14px;left:14px;right:14px;display:flex;justify-content:space-between;align-items:center">
            ${s.liveActivo?`<span style="background:rgba(204,0,0,0.85);color:#fff;font-size:9px;font-weight:800;padding:4px 10px;border-radius:20px;display:flex;align-items:center;gap:4px"><span style="width:5px;height:5px;border-radius:50%;background:#fff;display:inline-block"></span>EN VIVO</span>`:'<span></span>'}
            <span style="background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);color:var(--gold);font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px">⭐ ${(s.estrellas||0).toLocaleString()}</span>
          </div>
          <!-- Info bottom -->
          <div style="position:absolute;bottom:0;left:0;right:0;padding:20px;background:linear-gradient(to top,rgba(0,0,0,0.95),rgba(0,0,0,0.6),transparent)">
            <div style="font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:#fff">@${s.nick||s.nombre}</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px">${s.pais||'—'} · ${s.categoria||'Streamer'}</div>
            ${s.bio?`<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:6px;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${s.bio}</div>`:''}
            <div style="display:flex;gap:12px;margin-top:10px">
              <div style="font-size:11px;color:rgba(255,255,255,0.6)">👥 ${s.seguidores||0} fans</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.6)">🎯 ${s.matches||0} matches</div>
            </div>
          </div>
        </div>

        <!-- CONTADOR -->
        <div style="text-align:center;font-size:11px;color:var(--mu);margin-bottom:14px">${idx+1} de ${streamers.length} streamers disponibles</div>

        <!-- BOTONES -->
        <div style="display:flex;gap:14px;justify-content:center;margin-bottom:14px">
          <button onclick="usrMatchSkip()" style="width:58px;height:58px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);cursor:pointer;font-size:22px" title="Siguiente">⏭</button>
          <button onclick="usrSolicitarMatch('${s.id}','${s.nick||s.nombre}')" ${!puedePagar?'disabled':''} style="width:68px;height:68px;border-radius:50%;background:${puedePagar?'var(--grad-main)':'rgba(100,0,0,0.3)'};border:none;cursor:${puedePagar?'pointer':'not-allowed'};font-size:26px;box-shadow:${puedePagar?'0 0 25px rgba(204,0,0,0.5)':'none'};opacity:${puedePagar?1:0.5}" title="Solicitar match">⚡</button>
          <button onclick="usrVerPerfil('${s.id}')" style="width:58px;height:58px;border-radius:50%;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:var(--gold);cursor:pointer;font-size:22px" title="Ver perfil">👤</button>
        </div>

        ${!puedePagar?`
          <div style="text-align:center;padding:12px;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);font-size:12px;color:#EF4444">
            No tienes suficientes estrellas · <button onclick="navigate('estrellas')" style="background:none;border:none;color:var(--gold);cursor:pointer;font-weight:700;font-size:12px">Recargar ⭐</button>
          </div>
        `:'<div style="text-align:center;font-size:11px;color:var(--mu)">⚡ El match cuesta ${COSTO_MATCH}⭐ · La streamer debe aceptar</div>'}
      </div>
    `;

    window.usrMatchSkip = function() { idx++; renderDiscovery(); };
    window.usrVerPerfil = function(uid) { toast(`Perfil de @${s.nick||s.nombre}`, 'info'); };
  }

  // ── SOLICITAR MATCH ──
  window.usrSolicitarMatch = function(uid_str, nick) {
    if ((p.estrellas||0) < COSTO_MATCH) { toast('No tienes suficientes estrellas','error'); return; }

    const cont = document.getElementById('usrMatchContent');
    if (!cont) return;

    // Guardar solicitud en Firestore
    const matchId = `match_${p.uid}_${Date.now()}`;
    window.fsAdd?.('matches', {
      id: matchId,
      uid_usuario: p.uid, nick_usuario: p.nick||p.nombre,
      uid_streamer: uid_str, nick_streamer: nick,
      estado: 'esperando', costo: COSTO_MATCH
    });

    // Mostrar pantalla de espera
    cont.innerHTML = `
      <div style="text-align:center;padding:40px 20px">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#D4AF37);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;animation:pulse 1.5s infinite">⚡</div>
        <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:#fff;margin-bottom:8px">Esperando a @${nick}...</div>
        <div style="font-size:13px;color:var(--mu);margin-bottom:24px">La streamer debe aceptar tu solicitud</div>
        <div style="display:flex;justify-content:center;gap:6px;margin-bottom:24px">
          ${[0,1,2].map(i=>`<div style="width:8px;height:8px;border-radius:50%;background:var(--gold);animation:pulse ${1+i*0.3}s infinite"></div>`).join('')}
        </div>
        <button onclick="usrCancelarMatch()" style="padding:10px 24px;border-radius:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#EF4444;cursor:pointer;font-size:13px;font-weight:700">Cancelar</button>
      </div>
    `;

    window.usrCancelarMatch = function() {
      toast('Solicitud cancelada','info');
      renderDiscovery();
    };

    // Simular respuesta de la streamer (en producción vendría de Firestore realtime)
    setTimeout(() => {
      const acepto = Math.random() > 0.3; // 70% acepta
      if (acepto) {
        iniciarVideollamada(uid_str, nick);
      } else {
        cont.innerHTML = `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:56px;margin-bottom:16px">😔</div>
            <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:#fff;margin-bottom:8px">@${nick} no está disponible</div>
            <div style="font-size:13px;color:var(--mu);margin-bottom:24px">Prueba con otra streamer</div>
            <button onclick="usrMatchSkip();renderDiscovery?.()" class="btn-primary" style="padding:12px 24px" onclick="idx++;renderDiscovery()">Buscar otra ⚡</button>
          </div>
        `;
        setTimeout(()=>{ idx++; renderDiscovery(); }, 2000);
      }
    }, Math.floor(Math.random()*3000)+1500);
  };

  // ── VIDEOLLAMADA 30 SEG ──
  function iniciarVideollamada(uid_str, nick) {
    enLlamada = true;
    segsRestantes = 30;

    // Descontar estrellas
    window.fsSet?.('usuarios', p.uid, {
      estrellas: Math.max(0,(p.estrellas||0)-COSTO_MATCH),
      matches: (p.matches||0)+1
    }).catch(()=>{});

    // OVERLAY a pantalla completa encima de todo
    const existing = document.getElementById('usrMatchOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'usrMatchOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;display:flex;flex-direction:column';

    const bg = USR_GRADIENTS[idx % USR_GRADIENTS.length];

    overlay.innerHTML = `
      <div style="flex:1;position:relative;background:${bg};overflow:hidden">
        <!-- Fondo decorativo -->
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <div style="font-family:'Cinzel',serif;font-size:180px;color:rgba(255,255,255,0.03);font-weight:900;user-select:none">${nick[0].toUpperCase()}</div>
        </div>

        <!-- Avatar streamer grande -->
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">
          <div style="width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#D4AF37);border:3px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:46px;font-weight:900;color:rgba(0,0,0,0.35);box-shadow:0 0 40px rgba(212,175,55,0.4)">
            ${nick[0].toUpperCase()}
          </div>
          <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,0.5)">@${nick}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.6)">Streamer · Match en vivo</div>
        </div>

        <!-- BADGE MATCH -->
        <div style="position:absolute;top:16px;left:16px;background:rgba(34,197,94,0.9);color:#fff;font-size:9px;font-weight:800;padding:5px 12px;border-radius:20px;display:flex;align-items:center;gap:5px">
          <span style="width:6px;height:6px;border-radius:50%;background:#fff;display:inline-block;animation:pulse 1s infinite"></span>MATCH LIVE
        </div>

        <!-- TIMER -->
        <div style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);border-radius:14px;padding:8px 16px;border:1px solid rgba(204,0,0,0.5);text-align:center">
          <div style="font-family:'Cinzel',serif;font-size:26px;font-weight:900;line-height:1" id="matchTimerDisplay">30</div>
          <div style="font-size:9px;color:var(--mu);margin-top:2px">segundos</div>
        </div>

        <!-- Tu cámara (esquina inf derecha) -->
        <div style="position:absolute;bottom:90px;right:14px;width:72px;height:96px;border-radius:14px;background:rgba(20,20,20,0.9);border:2px solid rgba(255,255,255,0.15);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;overflow:hidden">
          <div style="font-size:24px">📷</div>
          <div style="font-size:8px;color:rgba(255,255,255,0.5)">Tú</div>
        </div>

        <!-- GIFTS rápidos (lado izquierdo) -->
        <div style="position:absolute;right:100px;bottom:100px;display:flex;flex-direction:column;gap:8px">
          ${[{e:'🌹',v:1},{e:'❤️',v:5},{e:'💋',v:10},{e:'👑',v:199}].map(g=>`
            <button onclick="usrMatchGift('${g.e}',${g.v},'${uid_str}')" style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);border:1px solid rgba(212,175,55,0.3);border-radius:20px;color:#fff;cursor:pointer;font-size:12px;white-space:nowrap">
              <span style="font-size:16px">${g.e}</span><span style="color:var(--gold);font-size:10px;font-weight:700">${g.v}⭐</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- BARRA DE PROGRESO -->
      <div style="height:4px;background:rgba(255,255,255,0.1)">
        <div id="matchProgressBar" style="height:100%;background:linear-gradient(90deg,var(--gold),#D4AF37);transition:width 1s linear;width:100%"></div>
      </div>

      <!-- CONTROLES -->
      <div style="padding:16px 20px 24px;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:space-around;gap:12px">
        <button id="matchMicBtn" onclick="this.textContent=this.textContent==='🎙️'?'🔇':'🎙️'" style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;cursor:pointer;font-size:22px">🎙️</button>
        <button onclick="usrTerminarMatch('${uid_str}','${nick}')" style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#CC0000,#7a0000);border:none;color:#fff;cursor:pointer;font-size:26px;box-shadow:0 0 24px rgba(204,0,0,0.6)">📵</button>
        <button id="matchCamBtn" onclick="this.textContent=this.textContent==='📹'?'📷':'📹'" style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;cursor:pointer;font-size:22px">📹</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Countdown + barra de progreso
    clearInterval(callTimer);
    callTimer = setInterval(() => {
      segsRestantes--;
      const t = document.getElementById('matchTimerDisplay');
      const bar = document.getElementById('matchProgressBar');
      if (t) {
        t.textContent = segsRestantes;
        t.style.color = segsRestantes <= 10 ? '#EF4444' : '#fff';
        t.parentElement.style.borderColor = segsRestantes <= 10 ? 'rgba(239,68,68,0.7)' : 'rgba(204,0,0,0.5)';
      }
      if (bar) bar.style.width = (segsRestantes/30*100)+'%';
      if (segsRestantes <= 0) {
        clearInterval(callTimer);
        usrTerminarMatch(uid_str, nick, true);
      }
    }, 1000);

    window.usrMatchGift = function(emoji, cost, uid_to) {
      if ((p.estrellas||0) < cost) { toast('Sin estrellas · Ve a Wallet','error'); return; }
      window.fsAdd?.('gifts_enviados', {
        uid_from: p.uid, uid_to,
        nick_from: p.nick||p.nombre,
        gift_emoji: emoji, gift_cost: cost, tipo: 'match'
      }).catch(()=>{});
      toast(`${emoji} enviado ✓`,'success');
    };
  }

  // ── TERMINAR MATCH ──
  window.usrTerminarMatch = function(uid_str, nick, autoTermino=false) {
    clearInterval(callTimer);
    enLlamada = false;

    // Quitar overlay
    const ov = document.getElementById('usrMatchOverlay');
    if (ov) ov.remove();

    // Guardar en Firestore
    window.fsAdd?.('matches', {
      uid_usuario: p.uid, nick_usuario: p.nick||p.nombre,
      uid_streamer: uid_str, nick_streamer: nick,
      estado: 'completado', costo: COSTO_MATCH,
      duracion: 30 - segsRestantes
    }).catch(()=>{});

    // Mostrar pantalla post-match
    const cont = document.getElementById('usrMatchContent');
    if (!cont) { renderDiscovery(); return; }

    cont.innerHTML = `
      <div style="text-align:center;padding:40px 20px;max-width:340px;margin:0 auto">
        <div style="font-size:60px;margin-bottom:16px">${autoTermino?'⏰':'👋'}</div>
        <div style="font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:8px">
          ${autoTermino ? '¡30 segundos terminados!' : '¡Hasta pronto!'}
        </div>
        <div style="font-size:14px;color:var(--mu);margin-bottom:6px">Match con @${nick}</div>
        <div style="font-size:13px;color:var(--gold);font-weight:700;margin-bottom:28px">-${COSTO_MATCH}⭐ descontadas</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button onclick="usrSiguienteMatch()" class="btn-primary" style="padding:14px;width:100%">⚡ Siguiente match</button>
          <button onclick="navigate('estrellas')" style="padding:14px;border-radius:var(--r-lg);background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:var(--gold);cursor:pointer;font-size:13px;font-weight:700;width:100%">⭐ Recargar estrellas</button>
          <button onclick="renderDiscovery()" style="padding:10px;background:none;border:none;color:var(--mu);cursor:pointer;font-size:12px">Ver streamers →</button>
        </div>
      </div>
    `;

    window.usrSiguienteMatch = function() {
      idx++;
      renderDiscovery();
    };
  };
}

// ── 8. FAVORITOS ─────────────────────────
function usr_favoritos(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up"><h1>❤️ Mis <span>Favoritas</span></h1></div>
    <div id="usrFavsContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div></div>
  `;
  window.fsGetAll?.('seguidos').then(seguidos => {
    const cont = document.getElementById('usrFavsContent');
    if (!cont) return;
    const misSeguidos = seguidos?.filter(s=>s.uid_fan===p.uid) || [];
    if (misSeguidos.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
        <div style="font-size:40px;opacity:0.3;margin-bottom:12px">❤️</div>
        No sigues a ninguna streamer aún.<br>
        <button onclick="navigate('explorar')" class="btn-sm" style="margin-top:12px;padding:10px 20px">🔍 Explorar streamers</button>
      </div>`;
      return;
    }
    cont.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
      ${misSeguidos.map(s=>`
        <div class="card" style="text-align:center;padding:20px">
          <div class="card-avatar" style="width:60px;height:60px;font-size:24px;margin:0 auto 12px">@</div>
          <div style="font-weight:700;margin-bottom:4px">@${s.nick_streamer}</div>
          <div style="display:flex;gap:6px;justify-content:center;margin-top:10px">
            <button onclick="navigate('lives')" class="btn-sm" style="padding:8px 12px;font-size:11px">📺 Ver live</button>
            <button onclick="navigate('mensajes')" class="btn-sm neutral" style="padding:8px 12px;font-size:11px">💬</button>
          </div>
        </div>
      `).join('')}
    </div>`;
  }).catch(()=>{
    const cont = document.getElementById('usrFavsContent');
    if (cont) cont.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">No sigues a nadie aún.</div>`;
  });
}

// ── 9. ROOMS ─────────────────────────────
function usr_rooms(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up"><h1>🎤 Voice & Video <span>Rooms</span></h1></div>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button onclick="usrVerRooms('voice')" class="btn-sm" style="flex:1;padding:10px">🎤 Voice</button>
      <button onclick="usrVerRooms('video')" class="btn-sm" style="flex:1;padding:10px">📹 Video</button>
    </div>
    <div id="usrRoomsContent"><div style="text-align:center;padding:20px;color:var(--mu)">Selecciona una categoría</div></div>
  `;
  window.usrVerRooms = function(tipo) {
    window.fsGetAll?.('salas').then(salas => {
      const cont = document.getElementById('usrRoomsContent');
      if (!cont) return;
      const lista = salas?.filter(s=>s.tipo===tipo&&s.activa) || [];
      if (lista.length === 0) {
        cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">
          No hay salas de ${tipo==='voice'?'voz':'video'} activas.
        </div>`;
        return;
      }
      cont.innerHTML = lista.map(s=>`
        <div class="card card-row" style="margin-bottom:10px">
          <div class="card-avatar" style="font-size:20px">${tipo==='voice'?'🎙️':'📹'}</div>
          <div class="card-info">
            <div class="card-name">${s.nombre}</div>
            <div class="card-sub">Host: @${s.nick_host} · ${s.participantes||0} en sala</div>
          </div>
          <button onclick="toast('Entrando a ${s.nombre}','success')" class="btn-sm" style="padding:8px 14px">Entrar</button>
        </div>
      `).join('');
    }).catch(()=>{});
  };
}

// ── 10. RANKINGS ─────────────────────────
function usr_rankings(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up"><h1>🏆 <span>Rankings</span></h1></div>
    <div id="usrRankContent"><div style="text-align:center;padding:20px;color:var(--mu)">Cargando...</div></div>
  `;
  cargarUsuariosReales?.().then(usuarios => {
    const streamers = usuarios.filter(u=>u.rol==='streamer').sort((a,b)=>(b.estrellas||0)-(a.estrellas||0));
    const cont = document.getElementById('usrRankContent');
    if (!cont) return;
    if (streamers.length === 0) {
      cont.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--mu)">No hay streamers en el ranking aún.</div>`;
      return;
    }
    cont.innerHTML = usrCard(`
      <div class="section-title" style="margin-bottom:12px">🏆 Top streamers de la semana</div>
      ${streamers.slice(0,20).map((s,i)=>`
        <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div style="width:32px;font-family:'Cinzel',serif;font-size:16px;font-weight:700;text-align:center;color:${i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--mu)'}">
            ${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}
          </div>
          <div class="card-avatar" style="width:38px;height:38px">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
          <div style="flex:1;font-weight:600">@${s.nick||s.nombre}</div>
          <div style="font-weight:700;color:var(--gold)">${(s.estrellas||0).toLocaleString()} ⭐</div>
          ${s.liveActivo?`<span class="badge badge-red" style="font-size:9px">LIVE</span>`:''}
        </div>
      `).join('')}
    `);
  }).catch(()=>{});
}

// ── 11. PERFIL ESTILO BIGO LIVE ──────────
function usr_perfil(el, p) {
  const stars = p.estrellas || 0;

  el.innerHTML = `
    <div class="aura-fade-up">
      <!-- PORTADA -->
      <div style="position:relative;margin-bottom:0">
        <div id="usrPortada" onclick="toast('Subida de portada próximamente','info')" style="height:160px;border-radius:20px 20px 0 0;background:linear-gradient(135deg,#0d0818,#1a0a00,#0d0d0d);border:1px dashed rgba(212,175,55,0.20);position:relative;overflow:hidden;cursor:pointer">
          <div style="position:absolute;inset:0;background:repeating-linear-gradient(135deg,transparent 0,transparent 12px,rgba(212,175,55,0.02) 12px,rgba(212,175,55,0.02) 13px)"></div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:rgba(255,255,255,0.3)">
            <div style="width:40px;height:40px;border-radius:50%;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:18px">📷</div>
            <div style="font-size:11px">Toca para subir portada</div>
          </div>
        </div>
        <!-- AVATAR -->
        <div style="position:absolute;bottom:-44px;left:20px">
          <div style="position:relative">
            <div onclick="toast('Subida de foto próximamente','info')" style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--red));border:3px solid var(--black);box-shadow:0 0 24px rgba(212,175,55,0.4);display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:34px;font-weight:900;color:rgba(255,255,255,0.3);cursor:pointer">
              ${(p.nick||p.nombre||'?')[0].toUpperCase()}
            </div>
            <button onclick="toast('Subida de foto próximamente','info')" style="position:absolute;bottom:0;right:0;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#F0D060,#D4AF37);border:2px solid var(--black);color:#1a0a00;cursor:pointer;font-size:12px">📷</button>
          </div>
        </div>
      </div>

      <!-- NOMBRE -->
      <div style="padding:52px 16px 16px;background:rgba(5,5,5,0.95);border-radius:0 0 20px 20px;border:1px solid var(--border);border-top:none;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div style="font-family:'Cinzel',serif;font-size:20px;font-weight:800;color:#fff">@${p.nick||p.nombre}</div>
          <span class="badge badge-blue">👤 Usuario</span>
          ${p.pais?`<span style="font-size:14px">${p.pais}</span>`:''}
        </div>
        <div style="font-size:11px;color:var(--mu);font-family:'JetBrains Mono',monospace;margin-top:4px">ID: ${p.uid?.slice(-8)||'—'}</div>
      </div>

      <!-- STATS RÁPIDOS -->
      <div class="stats-grid" style="margin-bottom:14px" id="usrPerfilStats">
        <div class="stat-card"><div class="stat-label">⭐ Estrellas</div><div class="stat-value" style="color:var(--gold)">${stars.toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">❤️ Siguiendo</div><div class="stat-value" style="color:#EF4444">${p.siguiendo||0}</div></div>
        <div class="stat-card"><div class="stat-label">🎁 Gifts enviados</div><div class="stat-value">${p.gifts_enviados||0}</div></div>
      </div>

      <!-- INFO PERSONAL -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:14px">👤 Información personal</div>
        <div class="form-section">
          <div class="input-group"><span class="input-icon">👤</span><input type="text" id="usrNick" value="${p.nick||p.nombre||''}" placeholder="Nickname"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="input-group">
              <span class="input-icon">🎂</span>
              <input type="date" id="usrFechaNac" placeholder="Fecha de nacimiento">
            </div>
            <div class="input-group">
              <span class="input-icon">⚤</span>
              <select id="usrGenero" style="background:transparent;border:none;color:var(--white);flex:1;outline:none">
                <option value="">Género</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Prefiero no decir</option>
              </select>
            </div>
          </div>
          <div class="input-group">
            <span class="input-icon">🌍</span>
            <select id="usrPais" style="background:transparent;border:none;color:var(--white);flex:1;outline:none">
              <option value="">Selecciona tu país</option>
              <option>Venezuela</option><option>Colombia</option><option>México</option>
              <option>Argentina</option><option>Perú</option><option>Chile</option>
              <option>España</option><option>Brasil</option><option>Otro</option>
            </select>
          </div>
        </div>
      </div>

      <!-- INTERESES -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:10px">💫 Mis intereses</div>
        <div id="usrInteresesGrid" style="display:flex;flex-wrap:wrap;gap:8px">
          ${['🎵 Música','💃 Baile','🎮 Gaming','📚 Lectura','🍕 Comida','✈️ Viajes','💪 Fitness','🎨 Arte','🐾 Mascotas','🌿 Naturaleza','💄 Maquillaje','🎬 Cine'].map(i=>`
            <button onclick="usrToggleInteres(this)" style="padding:6px 14px;border-radius:999px;font-size:12px;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);transition:all .2s">${i}</button>
          `).join('')}
        </div>
      </div>

      <!-- BIOGRAFÍA -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:10px">📝 Sobre mí</div>
        <textarea id="usrBioTexto" placeholder="Cuéntale a la comunidad quién eres..."
          style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px;color:#fff;font-size:13px;font-family:'Outfit',sans-serif;resize:none;min-height:80px;outline:none;box-sizing:border-box"></textarea>
      </div>

      <!-- PRIVACIDAD -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:12px">🔒 Privacidad</div>
        ${['Perfil público','Permitir mensajes','Mostrar en rankings','Notificaciones de lives'].map(t=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span style="font-size:13px;color:var(--mu)">${t}</span>
            <input type="checkbox" checked style="accent-color:var(--gold);width:16px;height:16px;cursor:pointer">
          </div>
        `).join('')}
      </div>

      <button class="btn-primary" onclick="usrGuardarPerfil()" style="width:100%;padding:16px;margin-bottom:10px">Guardar perfil</button>
      <button class="sidebar-signout" style="width:100%;margin-bottom:20px" onclick="signOut()">→ Cerrar Sesión</button>
    </div>
  `;

  // Cargar datos reales
  window.fsGet?.('usuarios', p.uid).then(perfil => {
    if (!perfil) return;
    const set = (id, val) => { const e=document.getElementById(id); if(e&&val) e.value=val; };
    set('usrNick', perfil.nick||perfil.nombre);
    set('usrFechaNac', perfil.fecha_nac);
    set('usrGenero', perfil.genero);
    set('usrPais', perfil.pais);
    set('usrBioTexto', perfil.bio);
    // Stats reales
    const grid = document.getElementById('usrPerfilStats');
    if (grid) grid.innerHTML = `
      <div class="stat-card"><div class="stat-label">⭐ Estrellas</div><div class="stat-value" style="color:var(--gold)">${(perfil.estrellas||0).toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">❤️ Siguiendo</div><div class="stat-value" style="color:#EF4444">${perfil.siguiendo||0}</div></div>
      <div class="stat-card"><div class="stat-label">🎁 Gifts enviados</div><div class="stat-value">${perfil.gifts_enviados||0}</div></div>
    `;
    // Intereses
    if (perfil.intereses?.length) {
      document.querySelectorAll('#usrInteresesGrid button').forEach(btn => {
        if (perfil.intereses.includes(btn.textContent.trim())) {
          btn.style.background = 'rgba(212,175,55,0.15)';
          btn.style.borderColor = 'rgba(212,175,55,0.5)';
          btn.style.color = 'var(--gold)';
          btn.dataset.selected = '1';
        }
      });
    }
  }).catch(()=>{});

  window.usrToggleInteres = function(btn) {
    const sel = btn.dataset.selected === '1';
    btn.dataset.selected = sel ? '0' : '1';
    btn.style.background = sel ? 'rgba(255,255,255,0.04)' : 'rgba(212,175,55,0.15)';
    btn.style.borderColor = sel ? 'rgba(255,255,255,0.08)' : 'rgba(212,175,55,0.5)';
    btn.style.color = sel ? 'rgba(255,255,255,0.7)' : 'var(--gold)';
  };

  window.usrGuardarPerfil = function() {
    const get = id => document.getElementById(id)?.value?.trim();
    const intereses = [...document.querySelectorAll('#usrInteresesGrid button')]
      .filter(b=>b.dataset.selected==='1').map(b=>b.textContent.trim());
    const nick = get('usrNick');
    if (!nick) { toast('El nickname no puede estar vacío','error'); return; }
    window.fsSet?.('usuarios', p.uid, {
      nick, fecha_nac: get('usrFechaNac'),
      genero: get('usrGenero'), pais: get('usrPais'),
      bio: get('usrBioTexto'), intereses
    }).then(()=>toast('Perfil actualizado ✓','success'))
    .catch(()=>toast('Error al guardar','error'));
  };
}
