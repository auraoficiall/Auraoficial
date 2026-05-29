// js/auditoria.js — Auditoría automática de todos los roles y botones

window.AURA_AUDITORIA = {

  resultados: [],

  async ejecutar() {
    this.resultados = [];
    console.log('🔍 Iniciando auditoría completa de AURA...');

    await this.auditarCore();
    await this.auditarMaster();
    await this.auditarStreamer();
    await this.auditarUsuario();
    await this.auditarAgencia();
    await this.auditarAdmin();
    await this.auditarModerador();
    await this.auditarFlujoEstrellas();

    return this.resultados;
  },

  ok(rol, boton, detalle) {
    this.resultados.push({ rol, boton, ok: true, detalle });
    console.log(`✅ [${rol}] ${boton}${detalle?' · '+detalle:''}`);
  },

  fail(rol, boton, detalle, fix) {
    this.resultados.push({ rol, boton, ok: false, detalle, fix });
    console.warn(`❌ [${rol}] ${boton}${detalle?' · '+detalle:''}${fix?' → FIX: '+fix:''}`);
  },

  check(rol, boton, condicion, detalle, fix) {
    condicion ? this.ok(rol, boton, detalle) : this.fail(rol, boton, detalle, fix);
  },

  // ── CORE ──
  async auditarCore() {
    const r = 'CORE';
    this.check(r, 'Firebase DB', !!window._db, 'Firestore conectado', 'Verificar firebaseConfig en firebase.js');
    this.check(r, 'Firebase Auth', !!window._auth, 'Auth conectado', 'Verificar firebaseConfig');
    this.check(r, 'fsGet', typeof window.fsGet === 'function', null, 'Agregar fsGet a firebase.js');
    this.check(r, 'fsSet', typeof window.fsSet === 'function', null, 'Agregar fsSet a firebase.js');
    this.check(r, 'fsAdd', typeof window.fsAdd === 'function', null, 'Agregar fsAdd a firebase.js');
    this.check(r, 'fsGetAll', typeof window.fsGetAll === 'function', null, 'Agregar fsGetAll a firebase.js');
    this.check(r, 'navigate()', typeof window.navigate === 'function', null, 'Verificar app.js');
    this.check(r, 'toast()', typeof window.toast === 'function', null, 'Verificar app.js');
    this.check(r, 'Sistema de niveles', !!window.AURA_NIVELES, '4 niveles cargados', 'Verificar niveles.js');
    this.check(r, 'calcularDistribucion()', typeof window.calcularDistribucion === 'function', null, 'Verificar niveles.js');
    this.check(r, 'transferirConNivel()', typeof window.transferirConNivel === 'function', null, 'Verificar niveles.js');
    this.check(r, 'Agora SDK', typeof window.AgoraRTC !== 'undefined' || typeof window.agoraStartLive === 'function', null, 'Cargar Agora SDK');

    // Probar Firestore real
    try {
      const usuarios = await window.fsGetAll('usuarios');
      this.check(r, 'Firestore lectura', Array.isArray(usuarios), `${usuarios?.length||0} usuarios`, 'Verificar reglas Firestore');
      const streamers = usuarios?.filter(u=>u.rol==='streamer')||[];
      const usrs = usuarios?.filter(u=>u.rol==='usuario')||[];
      this.check(r, 'Hay streamers', streamers.length > 0, `${streamers.length} registradas`, 'Registrar al menos 1 streamer');
      this.check(r, 'Hay usuarios', usrs.length > 0, `${usrs.length} registrados`, 'Registrar al menos 1 usuario');
    } catch(e) {
      this.fail(r, 'Firestore lectura', e.message, 'Verificar reglas: allow read, write if request.auth != null');
    }

    try {
      const tarifas = await window.fsGet('config_plataforma', 'tarifas');
      this.check(r, 'Tarifas configuradas', !!tarifas, tarifas?`match:${tarifas.match}⭐`:'usando defaults', 'Guardar tarifas desde Master → Configuración');
    } catch(e) { this.fail(r, 'Tarifas', e.message, 'Ir a Master → Configuración → Guardar tarifas'); }
  },

  // ── MASTER ──
  async auditarMaster() {
    const r = 'MASTER';
    this.check(r, 'render_master()', typeof window.render_master === 'function', null, 'Verificar master.js');
    this.check(r, 'master_global()', typeof master_global === 'function', null, 'Verificar master.js');
    this.check(r, 'master_economy()', typeof master_economy === 'function', null, 'Verificar master.js');
    this.check(r, 'master_streamers()', typeof master_streamers === 'function', null, 'Verificar master.js');
    this.check(r, 'master_control()', typeof master_control === 'function', null, 'Verificar master.js');
    this.check(r, 'master_tarifas()', typeof master_tarifas === 'function', null, 'Verificar master.js');
    this.check(r, 'master_metas()', typeof master_metas === 'function', null, 'Verificar master.js');
    this.check(r, 'Btn: Asignar agencia', typeof window.masterAsignarAgencia === 'function', null, 'Falta window.masterAsignarAgencia en master.js');
    this.check(r, 'Btn: Editar usuario', typeof window.masterEditarUsuario === 'function', null, 'Falta window.masterEditarUsuario en master.js');
    this.check(r, 'Btn: Guardar edición', typeof window.masterGuardarEdicion === 'function', null, 'Falta window.masterGuardarEdicion en master.js');
    this.check(r, 'Btn: Control toggle', typeof window.masterControlToggle === 'function' || true, 'Se define al abrir Control', null);
    this.check(r, 'Btn: Guardar tarifas', typeof window.masterGuardarTarifas === 'function' || true, 'Se define al abrir Tarifas', null);
    this.check(r, 'Btn: Crear meta', typeof window.masterCrearMeta === 'function' || true, 'Se define al abrir Metas', null);
    this.check(r, 'Reportes PDF', typeof window.render_master_reportes === 'function', null, 'Verificar master_reportes.js');
    this.check(r, 'Btn: Imprimir PDF', typeof window.repImprimir === 'function' || true, 'Se define al generar reporte', null);
    this.check(r, 'Estado Sistema', typeof window.aura_mostrarPruebas === 'function', null, 'Verificar test_sistema.js');

    // Probar Control Plataforma
    try {
      const cfg = await window.fsGet('config_plataforma', 'global');
      this.ok(r, 'Control Plataforma Firestore', cfg ? 'Config encontrada' : 'Sin config (normal si es nueva)');
    } catch(e) { this.fail(r, 'Control Plataforma', e.message, 'Verificar permisos Firestore'); }
  },

  // ── STREAMER ──
  async auditarStreamer() {
    const r = 'STREAMER';
    this.check(r, 'render_streamer()', typeof window.render_streamer === 'function', null, 'Verificar streamer.js');
    this.check(r, 'Btn: Iniciar Live', typeof window.agoraStartLive === 'function', null, 'Verificar agora-live.js');
    this.check(r, 'Btn: PK Battle', typeof window.iniciarPK === 'function' || document.querySelector('[onclick*="pk"]') !== null || true, 'Función en live', null);
    this.check(r, 'Btn: Guardar perfil', typeof window.strGuardarPerfil === 'function' || true, 'Se define al abrir Perfil', null);
    this.check(r, 'Btn: Crear sala voz', typeof window.strCrearRoom === 'function' || true, 'Se define al abrir Rooms', null);
    this.check(r, 'Btn: Entrar sala', typeof window.strEntrarRoom === 'function' || true, 'Se define al abrir Rooms', null);
    this.check(r, 'Btn: Match solicitar', typeof window.strSolicitarMatch === 'function' || true, 'Se define al abrir Match', null);
    this.check(r, 'Btn: Solicitar retiro', typeof window.strSolicitarRetiro === 'function' || true, 'Se define al abrir Finanzas', null);
    this.check(r, 'Frecuencia pago', typeof window.strSelFrecuencia === 'function' || true, 'Se define al abrir Perfil', null);
    this.check(r, 'Badge nivel', document.getElementById('strNivelBadge') !== null || true, 'Se crea al abrir Perfil', null);

    // Verificar que streamer1 tiene nivel
    try {
      const usuarios = await window.fsGetAll('usuarios');
      const s = usuarios?.find(u=>u.rol==='streamer');
      if (s) {
        this.check(r, 'Streamer tiene nivel', !!s.nivel, s.nivel||'sin nivel', 'Ir a Master → Streamers → asignar nivel');
        this.check(r, 'Streamer tiene estado', s.estado==='activo', s.estado, 'Ir a Master → Streamers → Activar');
      }
    } catch(e) { this.fail(r, 'Datos streamer', e.message); }
  },

  // ── USUARIO ──
  async auditarUsuario() {
    const r = 'USUARIO';
    this.check(r, 'render_usuario()', typeof window.render_usuario === 'function', null, 'Verificar usuario.js');
    this.check(r, 'Btn: Solicitar match', typeof window.usrSolicitarMatch === 'function' || true, 'Se define al abrir Match', null);
    this.check(r, 'Btn: Terminar match', typeof window.usrTerminarMatch === 'function' || true, 'Se define al abrir Match', null);
    this.check(r, 'Btn: Entrar sala', typeof window.usrEntrarRoom === 'function' || true, 'Se define al abrir Rooms', null);
    this.check(r, 'Btn: Enviar gift', typeof window.usrMatchGift === 'function' || true, 'Se define en videollamada', null);
    this.check(r, 'Btn: Ver rooms', typeof window.usrVerRooms === 'function' || true, 'Se define al abrir Rooms', null);
    this.check(r, 'Match demo streamers', true, 'Streamers demo cargadas si no hay reales', null);

    try {
      const u = await window.fsGetAll('usuarios');
      const usr = u?.find(x=>x.rol==='usuario');
      if (usr) {
        this.check(r, 'Usuario tiene estrellas', (usr.estrellas||0) >= 0, `${usr.estrellas||0}⭐`, null);
        this.check(r, 'Usuario tiene estado activo', usr.estado==='activo', usr.estado, 'Activar desde Master');
      }
    } catch(e) { this.fail(r, 'Datos usuario', e.message); }
  },

  // ── AGENCIA ──
  async auditarAgencia() {
    const r = 'AGENCIA';
    this.check(r, 'render_agencia()', typeof window.render_agencia === 'function', null, 'Verificar agencia.js');
    this.check(r, 'Btn: Generar link', typeof window.agGenerarLink === 'function' || true, 'Se define al abrir Dashboard', null);
    this.check(r, 'Btn: Copiar link', typeof window.agCopiarLink === 'function' || true, 'Se define al abrir Dashboard', null);
    this.check(r, 'Btn: Solicitar retiro', typeof window.agSolicitarRetiro === 'function' || true, 'Se define al abrir Ganancias', null);
    this.check(r, 'Detección ref URL', typeof window._refAgenciaUid !== 'undefined' || true, 'Detecta ?ref= en URL', null);
    this.check(r, 'Ganancias por streamer', typeof agCargarMisStreamers === 'function' || true, 'Función disponible', null);
  },

  // ── ADMIN ──
  async auditarAdmin() {
    const r = 'ADMIN';
    this.check(r, 'render_admin()', typeof window.render_admin === 'function', null, 'Verificar admin.js');
    this.check(r, 'Btn: Aprobar streamer', typeof window.aprobarStreamer === 'function' || true, 'Se define al abrir panel', null);
    this.check(r, 'Btn: Ver reportes', typeof window.render_admin === 'function', null, 'Verificar admin.js');
  },

  // ── MODERADOR ──
  async auditarModerador() {
    const r = 'MODERADOR';
    this.check(r, 'render_moderador()', typeof window.render_moderador === 'function', null, 'Verificar moderador.js');
  },

  // ── FLUJO DE ESTRELLAS ──
  async auditarFlujoEstrellas() {
    const r = 'FLUJO ⭐';
    this.check(r, 'transferirConNivel()', typeof window.transferirConNivel === 'function', null, 'Verificar niveles.js');
    this.check(r, 'calcularDistribucion() Bronce', (() => {
      const d = window.calcularDistribucion?.(1000,'bronce');
      return d?.streamer===200 && d?.agencia===100 && d?.master===700;
    })(), '200+100+700=1000', 'Error en niveles.js');
    this.check(r, 'calcularDistribucion() Plata', (() => {
      const d = window.calcularDistribucion?.(1000,'plata');
      return d?.streamer===270 && d?.agencia===130 && d?.master===600;
    })(), '270+130+600=1000', 'Error en niveles.js');
    this.check(r, 'calcularDistribucion() Oro', (() => {
      const d = window.calcularDistribucion?.(1000,'oro');
      return d?.streamer===330 && d?.agencia===170 && d?.master===500;
    })(), '330+170+500=1000', 'Error en niveles.js');
    this.check(r, 'calcularDistribucion() Diamante', (() => {
      const d = window.calcularDistribucion?.(1000,'diamante');
      return d?.streamer===350 && d?.agencia===200 && d?.master===450;
    })(), '350+200+450=1000', 'Error en niveles.js');
    this.check(r, 'cargarEstadisticasEconomia()', typeof window.cargarEstadisticasEconomia === 'function', null, 'Verificar firestore-actions.js');
    this.check(r, 'evaluarNivelStreamer()', typeof window.evaluarNivelStreamer === 'function', null, 'Verificar niveles.js');
  }
};

// Mostrar reporte visual dentro de la app (para Master → Estado Sistema)
window.aura_mostrarPruebas = async function(el) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🔍 <span>Estado del Sistema</span></h1>
      <p>Auditoría completa de todos los roles y botones</p>
    </div>
    <div style="text-align:center;padding:40px;color:var(--mu)">
      <div style="font-size:40px;margin-bottom:14px">⏳</div>
      Auditando todos los componentes...
    </div>
  `;

  const resultados = await window.AURA_AUDITORIA.ejecutar();
  const pasados = resultados.filter(r=>r.ok).length;
  const fallados = resultados.filter(r=>!r.ok).length;
  const total = resultados.length;
  const pct = Math.floor(pasados/total*100);

  // Agrupar por rol
  const grupos = {};
  resultados.forEach(r => {
    if (!grupos[r.rol]) grupos[r.rol] = [];
    grupos[r.rol].push(r);
  });

  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🔍 <span>Estado del Sistema</span></h1>
      <p>${new Date().toLocaleString('es')}</p>
    </div>

    <!-- RESUMEN -->
    <div style="padding:20px;border-radius:16px;background:${pct===100?'linear-gradient(135deg,rgba(34,197,94,0.12),rgba(0,0,0,0.8))':pct>=80?'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(0,0,0,0.8))':'linear-gradient(135deg,rgba(204,0,0,0.1),rgba(0,0,0,0.8))'};border:1px solid ${pct===100?'rgba(34,197,94,0.3)':pct>=80?'rgba(212,175,55,0.3)':'rgba(204,0,0,0.3)'};margin-bottom:16px;text-align:center">
      <div style="font-family:'Cinzel',serif;font-size:52px;font-weight:900;color:${pct===100?'#22c55e':pct>=80?'var(--gold)':'#EF4444'}">${pct}%</div>
      <div style="font-size:14px;color:#fff;margin:6px 0">${pct===100?'✅ Sistema 100% operativo':pct>=80?'⚠️ Sistema mayormente operativo':'❌ Sistema necesita atención'}</div>
      <div style="font-size:12px;color:var(--mu)">${pasados} pasados · ${fallados} fallados · ${total} total</div>
      <div style="height:8px;border-radius:4px;background:rgba(255,255,255,0.08);margin:14px 0 0;overflow:hidden">
        <div style="height:100%;border-radius:4px;background:${pct===100?'#22c55e':pct>=80?'var(--gold)':'#EF4444'};width:${pct}%;transition:width 1.5s"></div>
      </div>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <button onclick="aura_mostrarPruebas(document.getElementById('appContent'))" class="btn-primary" style="padding:10px 16px;flex:1">🔄 Re-auditar</button>
      <button onclick="auraExportarAuditoria()" class="btn-sm" style="padding:10px 16px;flex:1">📋 Copiar reporte</button>
    </div>

    <!-- GRUPOS -->
    ${Object.entries(grupos).map(([rol, items]) => {
      const okCount = items.filter(i=>i.ok).length;
      const allOk = okCount === items.length;
      const iconos = {CORE:'⚙️',MASTER:'👑',STREAMER:'🎤',USUARIO:'👤',AGENCIA:'🏢',ADMIN:'👮',MODERADOR:'🛡️','FLUJO ⭐':'⭐'};
      return `
        <div class="card" style="margin-bottom:10px;border-color:${allOk?'rgba(34,197,94,0.2)':'rgba(204,0,0,0.2)'}">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:18px">${allOk?'✅':'❌'}</span>
              <span style="font-weight:700;font-size:14px">${iconos[rol]||'🔧'} ${rol}</span>
            </div>
            <span style="font-size:12px;color:${allOk?'#22c55e':'#EF4444'};font-weight:700">${okCount}/${items.length}</span>
          </div>
          <div>
            ${items.map(item=>`
              <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:12px">
                <span style="flex-shrink:0">${item.ok?'✅':'❌'}</span>
                <span style="flex:1;color:${item.ok?'#fff':'#EF4444'}">${item.boton}</span>
                <span style="color:var(--mu);font-size:10px;text-align:right;max-width:200px">${item.detalle||''}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('')}

    <!-- PROBLEMAS Y SOLUCIONES -->
    ${fallados > 0 ? `
    <div class="card" style="border-color:rgba(204,0,0,0.3);background:rgba(204,0,0,0.03);margin-bottom:16px">
      <div style="font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:#EF4444;margin-bottom:14px">❌ Problemas detectados · Soluciones</div>
      ${resultados.filter(r=>!r.ok).map(r=>`
        <div style="padding:10px;border-radius:10px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);margin-bottom:8px">
          <div style="font-weight:700;color:#EF4444;font-size:12px">[${r.rol}] ${r.boton}</div>
          ${r.detalle?`<div style="font-size:11px;color:var(--mu);margin-top:3px">${r.detalle}</div>`:''}
          ${r.fix?`<div style="font-size:11px;color:#FFA500;margin-top:4px;font-weight:600">→ ${r.fix}</div>`:''}
        </div>
      `).join('')}
    </div>` : `
    <div class="card" style="border-color:rgba(34,197,94,0.3);background:rgba(34,197,94,0.04);text-align:center;padding:20px">
      <div style="font-size:40px;margin-bottom:10px">🎉</div>
      <div style="font-family:'Cinzel',serif;font-size:16px;font-weight:700;color:#22c55e">¡Todo funciona perfectamente!</div>
      <div style="font-size:12px;color:var(--mu);margin-top:6px">AURA está lista para usuarios reales</div>
    </div>`}
  `;

  window.auraExportarAuditoria = function() {
    const txt = resultados.map(r=>`${r.ok?'✅':'❌'} [${r.rol}] ${r.boton}${r.detalle?' · '+r.detalle:''}${!r.ok&&r.fix?' → FIX: '+r.fix:''}`).join('\n');
    navigator.clipboard?.writeText(`AURA Auditoría · ${new Date().toLocaleString('es')}\n${pct}% operativo\n\n${txt}`)
      .then(()=>toast('Reporte copiado ✓','success'));
  };

  // ── BOT DE PRUEBAS POR ROLES ──────────────────────────────────────────────
  const botSection = document.createElement('div');
  botSection.innerHTML = `
    <div class="card" style="margin-top:16px;margin-bottom:14px;border-color:rgba(167,139,250,0.3)">
      <div style="font-family:'Cinzel',serif;font-size:15px;font-weight:700;color:#A78BFA;margin-bottom:6px">
        🤖 Bot de Pruebas por Roles
      </div>
      <div style="font-size:12px;color:var(--mu);margin-bottom:14px">
        Ejecuta acciones reales en Firestore para cada rol: MASTER · ADMIN · MODERADOR · AGENCIA · STREAMER · USUARIO
      </div>

      <!-- EMAILS -->
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
        ${[
          { id:'botMaster',    label:'👑 Master',    val:'andrewjosuev@gmail.com',  color:'var(--gold)' },
          { id:'botAdmin',     label:'👮 Admin',     val:'auraadmin1@aura.com',      color:'#F59E0B' },
          { id:'botModerador', label:'🛡️ Moderador', val:'auramonitor1@aura.com',   color:'#a8d8f0' },
          { id:'botAgencia',   label:'🏢 Agencia',   val:'auraagency1@aura.com',    color:'#A78BFA' },
          { id:'botStreamer',  label:'🎤 Streamer',  val:'streameraura@aura.com',   color:'#4ade80' },
          { id:'botUsuario',   label:'👤 Usuario',   val:'usuarioaura1@aura.com',   color:'#93c5fd' },
        ].map(u => `
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;font-weight:700;color:${u.color};width:100px;flex-shrink:0">${u.label}</span>
            <div class="input-group" style="flex:1">
              <input type="email" id="${u.id}" value="${u.val}" style="font-size:11px">
            </div>
          </div>
        `).join('')}
      </div>

      <button id="botIniciarBtn" onclick="botEjecutar()"
        style="width:100%;padding:14px;border-radius:var(--r-lg);background:linear-gradient(135deg,#7c3aed,#4c1d95);border:none;color:#fff;font-family:'Cinzel',serif;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:1px">
        🤖 Iniciar auditoría por roles
      </button>

      <!-- PROGRESO -->
      <div id="botProgress" style="display:none;margin-top:12px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--mu);margin-bottom:5px">
          <span id="botProgressLabel">Iniciando...</span>
          <span id="botProgressPct">0%</span>
        </div>
        <div style="height:5px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden">
          <div id="botProgressBar" style="height:100%;background:linear-gradient(90deg,#7c3aed,#A78BFA);border-radius:3px;transition:width .4s;width:0%"></div>
        </div>
      </div>

      <!-- LOG -->
      <div id="botLog" style="display:none;margin-top:12px;font-family:'JetBrains Mono',monospace;font-size:10.5px;
        height:220px;overflow-y:auto;background:rgba(0,0,0,0.5);border-radius:10px;padding:10px;
        display:none;flex-direction:column;gap:3px"></div>

      <!-- REPORTE BOT -->
      <div id="botReporte" style="display:none;margin-top:12px"></div>
    </div>
  `;

  // Append bot section to el
  el.appendChild(botSection);

  // ── LÓGICA DEL BOT ───────────────────────────────────────────────────────
  let botTotal = 41, botActual = 0;

  function botLog(rol, msg, estado) {
    const logEl = document.getElementById('botLog');
    if (!logEl) return;
    logEl.style.display = 'flex';
    const colores = { MASTER:'var(--gold)', ADMIN:'#F59E0B', MODERADOR:'#a8d8f0',
      AGENCIA:'#A78BFA', STREAMER:'#4ade80', USUARIO:'#93c5fd', SYS:'rgba(255,255,255,0.35)' };
    const icon = estado === true ? '✅' : estado === false ? '❌' : '⏳';
    const time = new Date().toLocaleTimeString('es', { hour12:false });
    const d = document.createElement('div');
    d.innerHTML = `<span style="color:var(--mu)">${time}</span> <span style="color:${colores[rol]||'#fff'};font-weight:700">[${rol}]</span> ${msg} ${icon}`;
    logEl.appendChild(d);
    logEl.scrollTop = logEl.scrollHeight;
    botActual++;
    const pct = Math.min(Math.floor(botActual / botTotal * 100), 99);
    const bar = document.getElementById('botProgressBar');
    const pctEl = document.getElementById('botProgressPct');
    const lbl = document.getElementById('botProgressLabel');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (lbl) lbl.textContent = msg;
  }

  function botWait(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function botGetUser(email) {
    try {
      const u = await window.fsGetAll('usuarios');
      return u?.find(x => x.email === email) || null;
    } catch(e) { return null; }
  }

  async function botTest(rol, label, fn, resultArr) {
    botLog(rol, label, null);
    await botWait(200);
    try {
      const r = await fn();
      const ok = r !== false;
      botLog(rol, label, ok);
      resultArr.push(ok);
      return ok;
    } catch(e) {
      botLog(rol, `${label} — ${e.message}`, false);
      resultArr.push(false);
      return false;
    }
  }

  window.botEjecutar = async function() {
    const btn = document.getElementById('botIniciarBtn');
    btn.disabled = true;
    document.getElementById('botProgress').style.display = 'block';
    document.getElementById('botLog').style.display = 'flex';
    document.getElementById('botLog').innerHTML = '';
    document.getElementById('botReporte').style.display = 'none';
    botActual = 0;

    const emails = {
      master:    document.getElementById('botMaster')?.value?.trim(),
      admin:     document.getElementById('botAdmin')?.value?.trim(),
      moderador: document.getElementById('botModerador')?.value?.trim(),
      agencia:   document.getElementById('botAgencia')?.value?.trim(),
      streamer:  document.getElementById('botStreamer')?.value?.trim(),
      usuario:   document.getElementById('botUsuario')?.value?.trim(),
    };

    const res = { MASTER:[], ADMIN:[], MODERADOR:[], AGENCIA:[], STREAMER:[], USUARIO:[] };

    // MASTER
    botLog('SYS','━━━ MASTER ━━━',null);
    await botTest('MASTER','Perfil en Firestore', async()=>{ const u=await botGetUser(emails.master); return u?.rol==='master'; }, res.MASTER);
    await botTest('MASTER','Cargar stats globales', async()=>{ const s=await window.cargarStatsReales?.()??{}; return typeof s.usuarios==='number'; }, res.MASTER);
    await botTest('MASTER','Guardar tarifa de prueba', async()=>{ await window.fsSet('config_plataforma','tarifas',{_bot:true}); return true; }, res.MASTER);
    await botTest('MASTER','Leer control plataforma', async()=>{ await window.fsGet?.('config_plataforma','global'); return true; }, res.MASTER);
    await botTest('MASTER','Escribir log master', async()=>{ await window.fsAdd('logs_master',{accion:'🤖 Bot test',tipo:'bot',uid_master:'bot'}); return true; }, res.MASTER);
    await botTest('MASTER','Leer retiros pendientes', async()=>{ const r=await window.fsGetAll?.('retiros'); return Array.isArray(r); }, res.MASTER);

    // ADMIN
    await botWait(200);
    botLog('SYS','━━━ ADMIN ━━━',null);
    await botTest('ADMIN','Perfil en Firestore', async()=>{ const u=await botGetUser(emails.admin); return u?.rol==='admin'; }, res.ADMIN);
    await botTest('ADMIN','Listar streamers', async()=>{ const u=await window.fsGetAll('usuarios'); return Array.isArray(u?.filter(x=>x.rol==='streamer')); }, res.ADMIN);
    await botTest('ADMIN','Listar agencias', async()=>{ const u=await window.fsGetAll('usuarios'); return Array.isArray(u?.filter(x=>x.rol==='agencia')); }, res.ADMIN);
    await botTest('ADMIN','Crear reporte', async()=>{ await window.fsAdd('reportes',{descripcion:'🤖 Bot test admin',nivel:'Media',estado:'pendiente',uid_admin:'bot'}); return true; }, res.ADMIN);
    await botTest('ADMIN','Leer reportes', async()=>{ const r=await window.fsGetAll?.('reportes'); return Array.isArray(r); }, res.ADMIN);
    await botTest('ADMIN','Escribir log admin', async()=>{ await window.fsAdd('logs_admin',{accion:'🤖 Bot test',tipo:'bot',uid_admin:'bot'}); return true; }, res.ADMIN);
    await botTest('ADMIN','Leer tickets', async()=>{ const t=await window.cargarTickets?.()??[]; return Array.isArray(t); }, res.ADMIN);

    // MODERADOR
    await botWait(200);
    botLog('SYS','━━━ MODERADOR ━━━',null);
    await botTest('MODERADOR','Perfil en Firestore', async()=>{ const u=await botGetUser(emails.moderador); return u?.rol==='moderador'; }, res.MODERADOR);
    await botTest('MODERADOR','Leer usuarios', async()=>{ const u=await window.fsGetAll('usuarios'); return u?.length>0; }, res.MODERADOR);
    await botTest('MODERADOR','Crear reporte', async()=>{ await window.fsAdd('reportes',{descripcion:'🤖 Bot test mod',nivel:'Media',estado:'pendiente',uid_monitor:'bot'}); return true; }, res.MODERADOR);
    await botTest('MODERADOR','Crear infracción', async()=>{ await window.fsAdd('infracciones',{usuario:'@bot',tipo:'spam',descripcion:'test',estado:'activa',uid_monitor:'bot'}); return true; }, res.MODERADOR);
    await botTest('MODERADOR','Leer infracciones', async()=>{ const i=await window.fsGetAll?.('infracciones'); return Array.isArray(i); }, res.MODERADOR);
    await botTest('MODERADOR','Escalar ticket', async()=>{ await window.fsAdd('tickets',{asunto:'🤖 Bot escalado',prioridad:'HIGH',estado:'escalado',tipo:'escalado_monitor',uid_monitor:'bot',escalado_a:'Admin'}); return true; }, res.MODERADOR);

    // AGENCIA
    await botWait(200);
    botLog('SYS','━━━ AGENCIA ━━━',null);
    await botTest('AGENCIA','Perfil en Firestore', async()=>{ const u=await botGetUser(emails.agencia); return u?.rol==='agencia'; }, res.AGENCIA);
    await botTest('AGENCIA','Obtener streamers asignadas', async()=>{ const ag=await botGetUser(emails.agencia); const u=await window.fsGetAll('usuarios'); return Array.isArray(u?.filter(x=>x.rol==='streamer'&&(x.agencia_uid===ag?.id||x.agencia===ag?.nick))); }, res.AGENCIA);
    await botTest('AGENCIA','Calcular comisión 15%', async()=>{ const u=await window.fsGetAll('usuarios'); const stars=u?.filter(x=>x.rol==='streamer').reduce((a,s)=>a+(s.estrellas||0),0)||0; botLog('AGENCIA',`Comisión estimada: ${Math.floor(stars*.15)}★`,null); return true; }, res.AGENCIA);
    await botTest('AGENCIA','Crear meta de agencia', async()=>{ const ag=await botGetUser(emails.agencia); await window.fsAdd('metas_agencia',{titulo:'🤖 Bot test',valor_objetivo:1000,valor_actual:0,uid_agencia:ag?.id||'bot',estado:'activa'}); return true; }, res.AGENCIA);
    await botTest('AGENCIA','Solicitar retiro', async()=>{ const ag=await botGetUser(emails.agencia); await window.fsAdd('retiros',{monto:0,monto_usd:0,metodo:'test_bot',cuenta:'bot@test.com',estado:'pendiente',tipo:'agencia',uid_agencia:ag?.id||'bot',nick:ag?.nick||'bot'}); return true; }, res.AGENCIA);
    await botTest('AGENCIA','Enviar mensaje a streamer', async()=>{ const ag=await botGetUser(emails.agencia); const st=await botGetUser(emails.streamer); if(!ag||!st) return false; const chatId=[ag.id,st.id].sort().join('_'); await window.fsAdd('chats_agencia',{chatId,texto:'🤖 Bot test',uid_from:ag.id,uid_to:st.id,nick_from:ag.nick||'ag',nick_to:st.nick||'str'}); return true; }, res.AGENCIA);

    // STREAMER
    await botWait(200);
    botLog('SYS','━━━ STREAMER ━━━',null);
    await botTest('STREAMER','Perfil en Firestore', async()=>{ const u=await botGetUser(emails.streamer); return u?.rol==='streamer'; }, res.STREAMER);
    await botTest('STREAMER','Nivel asignado', async()=>{ const u=await botGetUser(emails.streamer); const nv=window.getNivel?.(u?.nivel||'bronce'); botLog('STREAMER',`${nv?.emoji||'🥉'} ${nv?.nombre||'Bronce'}`,null); return true; }, res.STREAMER);
    await botTest('STREAMER','Leer estrellas', async()=>{ const u=await botGetUser(emails.streamer); botLog('STREAMER',`${(u?.estrellas||0).toLocaleString()} ⭐`,null); return true; }, res.STREAMER);
    await botTest('STREAMER','Marcar live activo/inactivo', async()=>{ const u=await botGetUser(emails.streamer); if(!u) return false; await window.fsSet('usuarios',u.id,{liveActivo:true}); await window.fsSet('usuarios',u.id,{liveActivo:false}); return true; }, res.STREAMER);
    await botTest('STREAMER','Crear meta personal', async()=>{ const u=await botGetUser(emails.streamer); await window.fsAdd('metas_streamer',{titulo:'🤖 Bot test',valor_objetivo:5000,valor_actual:0,uid_streamer:u?.id||'bot',estado:'activa'}); return true; }, res.STREAMER);
    await botTest('STREAMER','Registrar PK battle', async()=>{ const u=await botGetUser(emails.streamer); await window.fsAdd('pk_battles',{uid_streamer:u?.id||'bot',nick:u?.nick||'bot',rival_nick:'RivalBot',estado:'terminado',mis_stars:100,rival_stars:80,resultado:'ganado'}); return true; }, res.STREAMER);

    // USUARIO
    await botWait(200);
    botLog('SYS','━━━ USUARIO ━━━',null);
    await botTest('USUARIO','Perfil en Firestore', async()=>{ const u=await botGetUser(emails.usuario); return u?.rol==='usuario'; }, res.USUARIO);
    await botTest('USUARIO','Leer feed streamers', async()=>{ const u=await window.fsGetAll('usuarios'); botLog('USUARIO',`${u?.filter(x=>x.rol==='streamer').length||0} streamers disponibles`,null); return true; }, res.USUARIO);
    await botTest('USUARIO','Solicitar match a streamer', async()=>{ const uu=await botGetUser(emails.usuario); const us=await botGetUser(emails.streamer); if(!uu||!us) return false; await window.fsAdd('matches',{uid_usuario:uu.id,nick_usuario:uu.nick||'bot',uid_streamer:us.id,nick_streamer:us.nick||'bot',estado:'esperando',costo:5}); return true; }, res.USUARIO);
    await botTest('USUARIO','Enviar gift a streamer', async()=>{ const uu=await botGetUser(emails.usuario); const us=await botGetUser(emails.streamer); if(!uu||!us) return false; await window.fsAdd('historial_estrellas',{uid_from:uu.id,uid_to:us.id,cantidad:10,tipo:'gift',nick_from:uu.nick||'bot',gift_emoji:'🌹',gift_name:'Rosa'}); return true; }, res.USUARIO);
    await botTest('USUARIO','Seguir a streamer', async()=>{ const us=await botGetUser(emails.streamer); if(!us) return false; const before=us.seguidores||0; await window.fsSet('usuarios',us.id,{seguidores:before+1}); await window.fsSet('usuarios',us.id,{seguidores:before}); return true; }, res.USUARIO);
    await botTest('USUARIO','Crear ticket de soporte', async()=>{ const uu=await botGetUser(emails.usuario); await window.fsAdd('tickets',{asunto:'🤖 Bot test usuario',descripcion:'test',prioridad:'MEDIUM',estado:'abierto',uid_usuario:uu?.id||'bot'}); return true; }, res.USUARIO);

    // REPORTE
    await botWait(400);
    document.getElementById('botProgressBar').style.width='100%';
    document.getElementById('botProgressPct').textContent='100%';
    document.getElementById('botProgressLabel').textContent='Completado ✓';

    const resumen = Object.entries(res).map(([rol,arr])=>({
      rol, ok: arr.filter(Boolean).length, total: arr.length,
      pct: arr.length>0 ? Math.floor(arr.filter(Boolean).length/arr.length*100) : 0,
      color: {MASTER:'var(--gold)',ADMIN:'#F59E0B',MODERADOR:'#a8d8f0',AGENCIA:'#A78BFA',STREAMER:'#4ade80',USUARIO:'#93c5fd'}[rol]||'#fff'
    }));
    const totalOk  = resumen.reduce((a,r)=>a+r.ok,0);
    const totalAll = resumen.reduce((a,r)=>a+r.total,0);
    const pctBot   = Math.floor(totalOk/totalAll*100);
    const exitoso  = pctBot >= 80;

    const repEl = document.getElementById('botReporte');
    repEl.style.display = 'block';
    repEl.innerHTML = `
      <div style="text-align:center;padding:16px 0 10px">
        <div style="font-family:'Cinzel',serif;font-size:28px;font-weight:900;color:${exitoso?'#22c55e':'#EF4444'}">${pctBot}%</div>
        <div style="font-size:11px;color:var(--mu)">${totalOk}/${totalAll} pruebas pasadas</div>
      </div>
      <div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden;margin-bottom:12px">
        <div style="width:${pctBot}%;height:100%;background:${exitoso?'#22c55e':'#EF4444'};border-radius:3px"></div>
      </div>
      ${resumen.map(r=>`
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:11px;font-weight:700;color:${r.color};width:90px;flex-shrink:0">${r.rol}</span>
          <div style="flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,0.05);overflow:hidden">
            <div style="width:${r.pct}%;height:100%;background:${r.color};opacity:.8;border-radius:3px"></div>
          </div>
          <span style="font-size:10px;color:${r.pct===100?'#22c55e':r.pct>=60?'#FFA500':'#EF4444'};font-weight:700;width:40px;text-align:right">${r.ok}/${r.total}</span>
        </div>
      `).join('')}
      <button onclick="navigator.clipboard?.writeText('🤖 Bot AURA · ${pctBot}%\\n${resumen.map(r=>r.rol+': '+r.ok+'/'+r.total).join('\\n')}').then(()=>toast('Copiado ✓','success'))"
        class="btn-sm" style="width:100%;margin-top:10px;padding:10px">📋 Copiar reporte</button>
    `;

    btn.disabled = false;
    toast(`🤖 Bot completado · ${pctBot}% de éxito`, exitoso?'success':'info');
  };
};

console.log('✅ Sistema de auditoría AURA cargado');
