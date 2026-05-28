// js/test_sistema.js — Sistema de pruebas automáticas AURA
// Solo visible para el Master en modo desarrollo

window.AURA_TEST = {
  resultados: [],
  pasados: 0,
  fallados: 0,

  log(nombre, ok, detalle='') {
    this.resultados.push({ nombre, ok, detalle });
    if (ok) this.pasados++; else this.fallados++;
    console.log(`${ok ? '✅' : '❌'} ${nombre}${detalle ? ' · ' + detalle : ''}`);
  },

  async ejecutar() {
    this.resultados = [];
    this.pasados = 0;
    this.fallados = 0;
    console.log('🔍 Iniciando pruebas del sistema AURA...');

    // ── 1. FIREBASE ──
    try {
      const ok = !!window._db && !!window._auth;
      this.log('Firebase inicializado', ok, ok ? 'db y auth listos' : 'falta _db o _auth');
    } catch(e) { this.log('Firebase inicializado', false, e.message); }

    // ── 2. HELPERS FIRESTORE ──
    const helpers = ['fsGet','fsSet','fsAdd','fsGetAll','fsLogsRecientes'];
    helpers.forEach(h => {
      this.log(`Helper ${h} disponible`, typeof window[h] === 'function');
    });

    // ── 3. USUARIO AUTENTICADO ──
    try {
      const user = window._currentUser;
      this.log('Usuario autenticado', !!user, user?.email || 'sin usuario');
    } catch(e) { this.log('Usuario autenticado', false, e.message); }

    // ── 4. PERFIL EN FIRESTORE ──
    try {
      const perfil = await window.fsGet('usuarios', window._currentUser?.uid);
      this.log('Perfil en Firestore', !!perfil, perfil ? `@${perfil.nick} · ${perfil.rol}` : 'no encontrado');
      if (perfil) {
        this.log('Perfil tiene rol', !!perfil.rol, perfil.rol);
        this.log('Perfil tiene estado activo', perfil.estado === 'activo', perfil.estado);
        this.log('Perfil tiene nivel (streamer)', perfil.rol !== 'streamer' || !!perfil.nivel, perfil.nivel||'N/A');
      }
    } catch(e) { this.log('Perfil en Firestore', false, e.message); }

    // ── 5. COLECCIONES FIRESTORE ──
    const colecciones = ['usuarios','logs_master','reportes','tickets','alertas','retiros','matches','historial_estrellas','pk_battles','metas_semanales'];
    for (const col of colecciones) {
      try {
        const data = await window.fsGetAll(col);
        this.log(`Colección ${col}`, true, `${data?.length || 0} documentos`);
      } catch(e) {
        this.log(`Colección ${col}`, false, e.message.includes('permission') ? 'Sin permisos' : e.message);
      }
    }

    // ── 6. CONFIG PLATAFORMA ──
    try {
      const tarifas = await window.fsGet('config_plataforma', 'tarifas');
      this.log('Tarifas configuradas', !!tarifas, tarifas ? `mensaje:${tarifas.mensaje}⭐` : 'usando defaults');
    } catch(e) { this.log('Tarifas configuradas', false, e.message); }

    try {
      const cartera = await window.fsGet('config_plataforma', 'cartera');
      this.log('Cartera Master', !!cartera, cartera ? `${cartera.total_estrellas||0}⭐` : 'vacía (normal si es nueva)');
    } catch(e) { this.log('Cartera Master', false, e.message); }

    // ── 7. SISTEMA DE NIVELES ──
    try {
      const nv = window.AURA_NIVELES;
      this.log('Sistema de niveles cargado', !!nv && Object.keys(nv).length === 4, Object.keys(nv||{}).join(', '));
      const dist = window.calcularDistribucion?.(1000, 'bronce');
      this.log('Cálculo distribución Bronce (1000⭐)', dist?.streamer === 200 && dist?.agencia === 100 && dist?.master === 700,
        dist ? `str:${dist.streamer} ag:${dist.agencia} master:${dist.master}` : 'error');
      const dist2 = window.calcularDistribucion?.(1000, 'diamante');
      this.log('Cálculo distribución Diamante (1000⭐)', dist2?.streamer === 350 && dist2?.agencia === 200 && dist2?.master === 450,
        dist2 ? `str:${dist2.streamer} ag:${dist2.agencia} master:${dist2.master}` : 'error');
    } catch(e) { this.log('Sistema de niveles', false, e.message); }

    // ── 8. AGORA ──
    this.log('Agora SDK cargado', typeof AgoraRTC !== 'undefined' || typeof window.agoraStartLive === 'function', 'SDK live');
    this.log('Token Agora configurado', typeof window.agoraStartLive === 'function', 'función disponible');

    // ── 9. FUNCIONES CRÍTICAS ──
    const funciones = [
      'cargarStatsReales', 'cargarUsuariosReales', 'transferirConNivel',
      'calcularDistribucion', 'getNivel', 'subirNivel', 'bajarNivel',
      'evaluarNivelStreamer', 'cargarEstadisticasEconomia', 'masterControl',
      'render_master', 'render_admin', 'render_moderador',
      'render_agencia', 'render_streamer', 'render_usuario',
      'navigate', 'toast'
    ];
    funciones.forEach(f => {
      this.log(`Función ${f}()`, typeof window[f] === 'function');
    });

    // ── 10. FLUJO DE ESTRELLAS (simulado) ──
    try {
      const usuarios = await window.fsGetAll('usuarios');
      const streamer = usuarios.find(u => u.rol === 'streamer');
      const usuario = usuarios.find(u => u.rol === 'usuario');
      this.log('Hay al menos 1 streamer', !!streamer, streamer ? `@${streamer.nick}` : 'ninguna registrada');
      this.log('Hay al menos 1 usuario', !!usuario, usuario ? `@${usuario.nick}` : 'ninguno registrado');
      if (streamer && usuario) {
        const dist = window.calcularDistribucion?.(100, streamer.nivel||'bronce');
        this.log('Simulación gift 100⭐', !!dist, `str:${dist?.streamer}⭐ ag:${dist?.agencia}⭐ aura:${dist?.master}⭐`);
      }
    } catch(e) { this.log('Flujo de estrellas', false, e.message); }

    // ── 11. SERVICE WORKER ──
    try {
      const swOk = 'serviceWorker' in navigator;
      const reg = await navigator.serviceWorker.getRegistration().catch(()=>null);
      this.log('Service Worker registrado', !!reg, reg ? 'Network First activo' : 'no registrado');
    } catch(e) { this.log('Service Worker', false, e.message); }

    // ── 12. PWA ──
    this.log('PWA manifest', !!document.querySelector('link[rel="manifest"]'));
    this.log('Meta viewport correcto', !!document.querySelector('meta[name="viewport"]'));

    return this.resultados;
  }
};

// Función para mostrar los resultados en el dashboard del Master
window.aura_mostrarPruebas = async function(el) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🔍 <span>Estado del Sistema</span></h1>
      <p>Verificación automática de todos los componentes de AURA</p>
    </div>
    <div style="text-align:center;padding:30px;color:var(--mu)">
      <div style="font-size:40px;margin-bottom:14px">⏳</div>
      Ejecutando pruebas...
    </div>
  `;

  const resultados = await window.AURA_TEST.ejecutar();
  const pasados = window.AURA_TEST.pasados;
  const fallados = window.AURA_TEST.fallados;
  const total = pasados + fallados;
  const pct = Math.floor(pasados/total*100);

  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🔍 <span>Estado del Sistema</span></h1>
      <p>Verificación automática · ${new Date().toLocaleString('es')}</p>
    </div>

    <!-- RESUMEN -->
    <div style="padding:20px;border-radius:16px;background:${pct===100?'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(0,0,0,0.8))':pct>70?'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(0,0,0,0.8))':'linear-gradient(135deg,rgba(204,0,0,0.1),rgba(0,0,0,0.8))'};border:1px solid ${pct===100?'rgba(34,197,94,0.3)':pct>70?'rgba(212,175,55,0.3)':'rgba(204,0,0,0.3)'};margin-bottom:16px;text-align:center">
      <div style="font-family:'Cinzel',serif;font-size:48px;font-weight:900;color:${pct===100?'#22c55e':pct>70?'var(--gold)':'#EF4444'}">${pct}%</div>
      <div style="font-size:14px;color:#fff;margin:8px 0">${pct===100?'✅ Sistema completamente operativo':pct>70?'⚠️ Sistema mayormente operativo':'❌ Sistema necesita atención'}</div>
      <div style="font-size:12px;color:var(--mu)">${pasados} pasados · ${fallados} fallados · ${total} total</div>
      <!-- BARRA DE PROGRESO -->
      <div style="height:8px;border-radius:4px;background:rgba(255,255,255,0.08);margin:14px 0 0;overflow:hidden">
        <div style="height:100%;border-radius:4px;background:${pct===100?'#22c55e':pct>70?'var(--gold)':'#EF4444'};width:${pct}%;transition:width 1s"></div>
      </div>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <button onclick="aura_mostrarPruebas(document.getElementById('appContent'))" class="btn-sm" style="padding:10px 16px">🔄 Re-ejecutar</button>
      <button onclick="aura_exportarPruebas()" class="btn-sm neutral" style="padding:10px 16px">📋 Copiar reporte</button>
    </div>

    <!-- RESULTADOS -->
    ${['Firebase y Auth','Helpers Firestore','Colecciones','Niveles y Cálculos','Funciones del sistema','Flujo de estrellas','PWA y SW'].map((categoria, ci) => {
      const rangos = [[0,4],[5,9],[10,19],[20,24],[25,41],[42,44],[45,47]];
      const [desde, hasta] = rangos[ci] || [0,0];
      const items = resultados.slice(desde, hasta+1);
      if (!items.length) return '';
      const catOk = items.every(i=>i.ok);
      return `
        <div class="card" style="margin-bottom:10px;border-color:${catOk?'rgba(34,197,94,0.2)':'rgba(204,0,0,0.2)'}">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:18px">${catOk?'✅':'❌'}</span>
              <span style="font-weight:700;font-size:14px">${categoria}</span>
            </div>
            <span style="font-size:11px;color:${catOk?'#22c55e':'#EF4444'}">${items.filter(i=>i.ok).length}/${items.length}</span>
          </div>
          <div>
            ${items.map(r=>`
              <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:12px">
                <span style="flex-shrink:0">${r.ok?'✅':'❌'}</span>
                <span style="flex:1;color:${r.ok?'#fff':'#EF4444'}">${r.nombre}</span>
                <span style="color:var(--mu);font-size:10px;text-align:right;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.detalle||''}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('')}

    ${fallados > 0 ? `
    <div class="card" style="border-color:rgba(204,0,0,0.3);background:rgba(204,0,0,0.04);margin-bottom:16px">
      <div class="section-title" style="color:#EF4444;margin-bottom:10px">❌ Problemas detectados</div>
      ${resultados.filter(r=>!r.ok).map(r=>`
        <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div style="font-weight:600;color:#EF4444;font-size:13px">❌ ${r.nombre}</div>
          <div style="font-size:11px;color:var(--mu);margin-top:2px">${r.detalle||'Sin detalles'}</div>
          <div style="font-size:11px;color:#FFA500;margin-top:4px">${getSolucion(r.nombre)}</div>
        </div>
      `).join('')}
    </div>` : ''}
  `;

  window.aura_exportarPruebas = function() {
    const texto = resultados.map(r=>`${r.ok?'✅':'❌'} ${r.nombre}${r.detalle?' · '+r.detalle:''}`).join('\n');
    navigator.clipboard?.writeText(`AURA Sistema · ${new Date().toLocaleString('es')}\n${pct}% operativo\n\n${texto}`)
      .then(()=>toast('Reporte copiado al portapapeles ✓','success'));
  };
};

function getSolucion(nombre) {
  if (nombre.includes('Colección')) return '→ Verifica las reglas de Firestore (deben permitir read/write si auth != null)';
  if (nombre.includes('Agora')) return '→ Genera un nuevo token en console.agora.io · canal: aura-live';
  if (nombre.includes('Perfil')) return '→ El usuario no tiene documento en Firestore/usuarios';
  if (nombre.includes('estado activo')) return '→ Cambia estado a "activo" en Firestore';
  if (nombre.includes('nivel')) return '→ Agrega campo nivel:"bronce" al documento de la streamer';
  if (nombre.includes('Tarifas')) return '→ Normal si es la primera vez. Guarda tarifas en Configuración';
  if (nombre.includes('streamer')) return '→ Registra al menos una streamer en la app';
  if (nombre.includes('usuario')) return '→ Registra al menos un usuario en la app';
  return '→ Revisa la consola del navegador para más detalles';
}

console.log('✅ Sistema de pruebas AURA cargado');
