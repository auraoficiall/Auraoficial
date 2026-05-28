// js/agora-live.js — AURA Live con Agora RTC
// App ID: a505786a220343ba86f2c5224fe9c52d

const AGORA_CONFIG = {
  appId: 'a505786a220343ba86f2c5224fe9c52d',
  token: '007eJxTYNBUUdrteXzbRYFjhWL37n3MMg4uzk3Wvf6SZ8PSU3L2DtIKDImmBqbmFmaJRkYGxibGSYkWZmlGyaZGRiZpqZZAOuX+dvGshkBGhvnFVQyMUAjiczIklhYl6uZklqUyMAAAnFggQw==',
  channel: 'aura-live',
};

// Estado global del live
window._agoraClient = null;
window._agoraLocalTracks = { video: null, audio: null };
window._agoraLiveActive = false;
window._agoraViewers = [];

// ── INICIAR LIVE (Streamer) ───────────────────────────────
window.agoraStartLive = async function() {
  try {
    toast('📡 Conectando con Agora...', 'info');

    // Cargar SDK de Agora dinámicamente
    if (!window.AgoraRTC) {
      await loadAgoraSDK();
    }

    const AgoraRTC = window.AgoraRTC;

    // Crear cliente en modo host
    window._agoraClient = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    await window._agoraClient.setClientRole('host');

    // Unirse al canal
    const uid = Math.floor(Math.random() * 100000);
    await window._agoraClient.join(
      AGORA_CONFIG.appId,
      AGORA_CONFIG.channel,
      AGORA_CONFIG.token,
      uid
    );

    // Crear tracks de cámara y micrófono
    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
      { encoderConfig: 'high_quality' },
      { encoderConfig: { width: 720, height: 1280, frameRate: 30, bitrateMax: 2000 } }
    );

    window._agoraLocalTracks.audio = audioTrack;
    window._agoraLocalTracks.video = videoTrack;

    // Publicar tracks
    await window._agoraClient.publish([audioTrack, videoTrack]);

    window._agoraLiveActive = true;
    window._streamerLive = true;

    // Mostrar preview de la cámara
    mostrarCamaraStreamer(videoTrack);

    // Escuchar cuando entran viewers
    window._agoraClient.on('user-published', async (user, mediaType) => {
      await window._agoraClient.subscribe(user, mediaType);
      window._agoraViewers.push(user.uid);
      actualizarViewers();
    });

    window._agoraClient.on('user-unpublished', (user) => {
      window._agoraViewers = window._agoraViewers.filter(id => id !== user.uid);
      actualizarViewers();
    });

    toast('🔴 ¡Live iniciado! Tu audiencia te espera', 'success');

  } catch(e) {
    console.error('Agora error:', e);
    toast('Error al iniciar live: ' + (e.message || e), 'error');
    await agoraStopLive();
  }
};

// ── DETENER LIVE ─────────────────────────────────────────
window.agoraStopLive = async function() {
  try {
    if (window._agoraLocalTracks.video) {
      window._agoraLocalTracks.video.stop();
      window._agoraLocalTracks.video.close();
    }
    if (window._agoraLocalTracks.audio) {
      window._agoraLocalTracks.audio.stop();
      window._agoraLocalTracks.audio.close();
    }
    if (window._agoraClient) {
      await window._agoraClient.leave();
    }
  } catch(e) { console.error(e); }

  window._agoraClient = null;
  window._agoraLocalTracks = { video: null, audio: null };
  window._agoraLiveActive = false;
  window._streamerLive = false;
  window._agoraViewers = [];

  // Cerrar overlay del live
  const overlay = document.getElementById('agoraLiveOverlay');
  if (overlay) overlay.remove();

  toast('Live terminado. ¡Excelente sesión! ⭐', 'success');
  navigate('home');
};

// ── VER LIVE (Usuario/Viewer) ────────────────────────────
window.agoraJoinLive = async function(channelName) {
  try {
    toast('📡 Entrando al live...', 'info');

    if (!window.AgoraRTC) await loadAgoraSDK();

    const AgoraRTC = window.AgoraRTC;
    const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    await client.setClientRole('audience');

    const uid = Math.floor(Math.random() * 100000);
    await client.join(
      AGORA_CONFIG.appId,
      channelName || AGORA_CONFIG.channel,
      AGORA_CONFIG.token,
      uid
    );

    window._agoraViewerClient = client;

    // Cuando llegue el video del streamer
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        mostrarVideoViewer(user.videoTrack);
      }
      if (mediaType === 'audio') {
        user.audioTrack.play();
      }
    });

    toast('✅ Conectado al live', 'success');

  } catch(e) {
    console.error('Agora viewer error:', e);
    toast('No se pudo conectar al live: ' + (e.message || e), 'error');
  }
};

// ── TOGGLE MIC ───────────────────────────────────────────
window.agoraMuteMic = async function() {
  if (!window._agoraLocalTracks.audio) return;
  const muted = window._agoraLocalTracks.audio.muted;
  await window._agoraLocalTracks.audio.setMuted(!muted);
  toast(muted ? '🎙️ Micrófono activado' : '🔇 Micrófono silenciado', 'info');
  return !muted;
};

// ── TOGGLE CÁMARA ────────────────────────────────────────
window.agoraToggleCamera = async function() {
  if (!window._agoraLocalTracks.video) return;
  const muted = window._agoraLocalTracks.video.muted;
  await window._agoraLocalTracks.video.setMuted(!muted);
  toast(muted ? '📹 Cámara activada' : '📷 Cámara apagada', 'info');
};

// ── MOSTRAR CÁMARA DEL STREAMER ──────────────────────────
function mostrarCamaraStreamer(videoTrack) {
  // Eliminar overlay anterior si existe
  const prev = document.getElementById('agoraLiveOverlay');
  if (prev) prev.remove();

  const overlay = document.createElement('div');
  overlay.id = 'agoraLiveOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:600;background:#000;
    display:flex;flex-direction:column;
  `;

  overlay.innerHTML = `
    <!-- Header -->
    <div style="position:absolute;top:0;left:0;right:0;z-index:10;padding:16px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(180deg,rgba(0,0,0,0.7),transparent)">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="background:var(--red);color:white;font-size:10px;font-weight:800;padding:4px 10px;border-radius:20px;display:flex;align-items:center;gap:5px;letter-spacing:1px">
          <span style="width:6px;height:6px;border-radius:50%;background:#fff;display:inline-block"></span>EN VIVO
        </div>
        <div id="agoraViewerCount" style="background:rgba(0,0,0,0.6);color:#fff;font-size:12px;padding:4px 10px;border-radius:20px">👁 0 viewers</div>
      </div>
      <div style="display:flex;gap:8px">
        <div id="agoraTimer" style="background:rgba(0,0,0,0.6);color:#fff;font-size:12px;padding:4px 10px;border-radius:20px">00:00:00</div>
      </div>
    </div>

    <!-- Video container -->
    <div id="agoraVideoContainer" style="flex:1;position:relative;background:#000"></div>

    <!-- PK Battle button flotante (lado derecho arriba) -->
    <button onclick="agoraLanzarPK()" id="agoraPKBtn" style="position:absolute;top:70px;right:12px;z-index:15;padding:8px 12px;border-radius:12px;background:linear-gradient(135deg,rgba(204,0,0,0.85),rgba(100,0,0,0.9));border:1px solid rgba(255,100,100,0.4);color:#fff;font-size:11px;font-weight:800;cursor:pointer;letter-spacing:1px;backdrop-filter:blur(8px);box-shadow:0 0 16px rgba(204,0,0,0.5)">⚔️ PK</button>

    <!-- Zona PK Battle (aparece cuando se activa) -->
    <div id="agoraPKZone" style="position:absolute;top:110px;left:0;right:0;z-index:14;display:none"></div>

    <!-- Controles -->
    <div style="position:absolute;bottom:0;left:0;right:0;padding:16px;background:linear-gradient(0deg,rgba(0,0,0,0.9),transparent);display:flex;align-items:center;gap:10px">
      <button id="agoraMicBtn" onclick="agoraMuteMic().then(on=>document.getElementById('agoraMicBtn').textContent=on?'🎙️':'🔇')" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:18px;cursor:pointer">🎙️</button>
      <button id="agoraCamBtn" onclick="agoraToggleCamera()" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:18px;cursor:pointer">📹</button>
      <button onclick="agoraCompartir()" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:18px;cursor:pointer">📤</button>
      <div style="flex:1"></div>
      <div id="agoraStarsCounter" style="background:rgba(212,175,55,0.2);border:1px solid rgba(212,175,55,0.4);padding:7px 14px;border-radius:20px;color:var(--gold);font-weight:700;font-size:13px">⭐ 0</div>
      <button onclick="agoraStopLive()" style="padding:10px 16px;border-radius:12px;background:linear-gradient(135deg,#CC0000,#7a0000);border:none;color:#fff;font-family:'Cinzel',serif;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:1px">⏹ Terminar</button>
    </div>

    <!-- Chat flotante -->
    <div id="agoraLiveChat" style="position:absolute;left:12px;right:12px;bottom:80px;max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;mask-image:linear-gradient(180deg,transparent 0%,#000 30%)"></div>
  `;

  document.body.appendChild(overlay);

  // Reproducir video en el container
  videoTrack.play('agoraVideoContainer');

  // Timer del live
  let secs = 0;
  window._agoraTimerInterval = setInterval(() => {
    secs++;
    const h = String(Math.floor(secs/3600)).padStart(2,'0');
    const m = String(Math.floor((secs%3600)/60)).padStart(2,'0');
    const s = String(secs%60).padStart(2,'0');
    const el = document.getElementById('agoraTimer');
    if (el) el.textContent = `${h}:${m}:${s}`;

    // Simular gifts cada 15 segundos
    if (secs % 15 === 0) simularGift();
  }, 1000);

  // Chat simulado
  window._agoraChatInterval = setInterval(() => {
    agregarMensajeChat(['JuanVIP: 🔥 Increíble!','@fan_top: ❤️','👑 Diego: corona!','StarFan: ⭐⭐⭐','TopUser: hermosa!'][Math.floor(Math.random()*5)]);
  }, 3000);
}

// ── MOSTRAR VIDEO VIEWER ─────────────────────────────────
function mostrarVideoViewer(videoTrack) {
  const container = document.getElementById('agoraViewerVideo');
  if (container) videoTrack.play('agoraViewerVideo');
}

// ── HELPERS ──────────────────────────────────────────────
function actualizarViewers() {
  const el = document.getElementById('agoraViewerCount');
  if (el) el.textContent = `👁 ${window._agoraViewers.length} viewers`;
}

function agregarMensajeChat(msg) {
  const chat = document.getElementById('agoraLiveChat');
  if (!chat) return;
  const d = document.createElement('div');
  d.style.cssText = 'display:inline-flex;align-self:flex-start;padding:5px 10px;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.06);border-radius:12px;font-size:11px;color:#fff';
  d.textContent = msg;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
  if (chat.children.length > 15) chat.removeChild(chat.children[0]);
}

let _totalStars = 0;
function simularGift() {
  const gifts = [{e:'⭐',v:50},{e:'💎',v:200},{e:'👑',v:500},{e:'🌹',v:10}];
  const g = gifts[Math.floor(Math.random()*gifts.length)];
  _totalStars += g.v;
  const el = document.getElementById('agoraStarsCounter');
  if (el) el.textContent = `⭐ ${_totalStars.toLocaleString()}`;
  agregarMensajeChat(`🎁 @fan_${Math.floor(Math.random()*999)} envió ${g.e} +${g.v}⭐`);
}

// ── CARGAR SDK DE AGORA ──────────────────────────────────
function loadAgoraSDK() {
  return new Promise((resolve, reject) => {
    if (window.AgoraRTC) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.22.0.js';
    script.onload = () => {
      console.log('✅ Agora SDK cargado');
      resolve();
    };
    script.onerror = () => reject(new Error('No se pudo cargar Agora SDK'));
    document.head.appendChild(script);
  });
}
