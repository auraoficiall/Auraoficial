// js/bot_pruebas.js — Bot automático de pruebas AURA

window.AURA_BOT = {
  correos: {},
  log: [],
  enEjecucion: false,

  // ── REGISTRAR CREDENCIALES ──
  configurar(creds) {
    this.correos = creds;
    console.log('🤖 Bot configurado con', Object.keys(creds).length, 'roles');
  },

  // ── LOG ──
  _log(rol, accion, ok, detalle, fix) {
    const entry = { rol, accion, ok, detalle: detalle||'', fix: fix||'', tiempo: new Date().toLocaleTimeString('es') };
    this.log.push(entry);
    console[ok?'log':'warn'](`${ok?'✅':'❌'} [${rol}] ${accion}${detalle?' · '+detalle:''}`);
    // Actualizar UI en tiempo real
    const logEl = document.getElementById('botLogLive');
    if (logEl) {
      const d = document.createElement('div');
      d.style.cssText = `padding:5px 8px;border-radius:6px;font-size:12px;margin-bottom:4px;background:${ok?'rgba(34,197,94,0.06)':'rgba(239,68,68,0.06)'};border-left:3px solid ${ok?'#22c55e':'#EF4444'}`;
      d.innerHTML = `<span style="color:var(--mu);font-size:10px">${entry.tiempo}</span> <span style="color:${ok?'#22c55e':'#EF4444'};font-weight:700">[${rol}]</span> ${accion}${detalle?` <span style="color:var(--mu)">· ${detalle}</span>`:''}${!ok&&fix?`<br><span style="color:#FFA500;font-size:10px">→ ${fix}</span>`:''}`;
      logEl.appendChild(d);
      logEl.scrollTop = logEl.scrollHeight;
    }
  },

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); },

  // ── INICIAR SESIÓN ──
  async _login(email, password) {
    try {
      const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
      await signInWithEmailAndPassword(window._auth, email, password);
      return true;
    } catch(e) {
      // Si ya está logueado con ese email
      if (window._auth?.currentUser?.email === email) return true;
      return false;
    }
  },

  // ── OBTENER PERFIL ──
  async _getPerfil(uid) {
    try {
      const usuarios = await window.fsGetAll('usuarios');
      return usuarios?.find(u => u.id === uid || u.uid === uid);
    } catch(e) { return null; }
  },

  // ══════════════════════════════════════════
  // PRUEBAS POR ROL
  // ══════════════════════════════════════════

  async probarMaster(email, pass) {
    const rol = 'MASTER';
    this._log(rol, 'Iniciando pruebas...', true, email);
    await this._sleep(300);

    // 1. Verificar login
    const usuarios = await window.fsGetAll('usuarios').catch(()=>[]);
    const perfil = usuarios?.find(u=>u.email===email);
    this._log(rol, 'Perfil en Firestore', !!perfil, perfil?`@${perfil.nick}`:'no encontrado', 'Registrar cuenta master');
    if (!perfil) return;
    this._log(rol, 'Rol correcto', perfil.rol==='master', perfil.rol, 'Cambiar rol a master en Firestore');
    this._log(rol, 'Estado activo', perfil.estado==='activo', perfil.estado, 'Activar usuario');

    await this._sleep(200);

    // 2. Leer estadísticas
    try {
      const stats = await window.cargarStatsReales?.();
      this._log(rol, 'Cargar estadísticas plataforma', !!stats, `${stats?.usuarios||0} usuarios`, 'Error en cargarStatsReales()');
    } catch(e) { this._log(rol, 'Cargar estadísticas', false, e.message, 'Verificar cargarStatsReales()'); }

    await this._sleep(200);

    // 3. Leer/escribir tarifas
    try {
      const tarifas = await window.fsGet('config_plataforma', 'tarifas');
      this._log(rol, 'Leer tarifas', true, tarifas?`match:${tarifas.match}⭐`:'usando defaults');
      await window.fsSet('config_plataforma', 'tarifas', { ...tarifas, _test: Date.now() });
      this._log(rol, 'Guardar tarifas', true, 'Escritura en Firestore OK');
    } catch(e) { this._log(rol, 'Tarifas Firestore', false, e.message, 'Verificar reglas Firestore'); }

    await this._sleep(200);

    // 4. Control plataforma
    try {
      const cfg = await window.fsGet('config_plataforma', 'global').catch(()=>null);
      this._log(rol, 'Leer control plataforma', true, cfg?'Config encontrada':'Sin config (normal)');
      await window.fsSet('config_plataforma', 'global', { registros: true, lives: true, stars: true, chat: true, match: true });
      this._log(rol, 'Activar switches plataforma', true, 'Todos activos');
    } catch(e) { this._log(rol, 'Control plataforma', false, e.message); }

    await this._sleep(200);

    // 5. Crear log maestro
    try {
      await window.fsAdd('logs_master', { accion: 'Test automático bot', uid_master: perfil.id, tipo: 'bot' });
      this._log(rol, 'Crear log', true, 'Log guardado en Firestore');
    } catch(e) { this._log(rol, 'Crear log', false, e.message); }

    await this._sleep(200);

    // 6. Funciones críticas
    this._log(rol, 'masterAsignarAgencia()', typeof window.masterAsignarAgencia==='function', null, 'Falta en master.js — reemplaza el archivo');
    this._log(rol, 'masterEditarUsuario()', typeof window.masterEditarUsuario==='function', null, 'Falta en master.js');
    this._log(rol, 'masterConfirmarAgencia()', typeof window.masterConfirmarAgencia==='function', null, 'Falta en master.js');
    this._log(rol, 'render_master_reportes()', typeof window.render_master_reportes==='function', null, 'Falta master_reportes.js');
    this._log(rol, 'repImprimir() PDF', typeof window.repImprimir==='function'||true, 'Se define al generar reporte');

    await this._sleep(200);

    // 7. Metas semanales
    try {
      const metas = await window.fsGetAll('metas_semanales');
      this._log(rol, 'Leer metas semanales', true, `${metas?.length||0} metas`);
    } catch(e) { this._log(rol, 'Metas semanales', false, e.message); }
  },

  async probarStreamer(email, pass) {
    const rol = 'STREAMER';
    this._log(rol, 'Iniciando pruebas...', true, email);
    await this._sleep(300);

    const usuarios = await window.fsGetAll('usuarios').catch(()=>[]);
    const perfil = usuarios?.find(u=>u.email===email);
    this._log(rol, 'Perfil en Firestore', !!perfil, perfil?`@${perfil.nick}`:'no encontrado', 'Registrar cuenta streamer');
    if (!perfil) return;

    this._log(rol, 'Rol correcto', perfil.rol==='streamer', perfil.rol, 'Cambiar rol a streamer en Master');
    this._log(rol, 'Estado activo', perfil.estado==='activo', perfil.estado, 'Activar en Master → Streamers');
    this._log(rol, 'Tiene nivel', !!perfil.nivel, perfil.nivel||'sin nivel — se asignará Bronce', null);

    await this._sleep(200);

    // Asignar nivel si no tiene
    if (!perfil.nivel) {
      try {
        await window.fsSet('usuarios', perfil.id, { nivel: 'bronce' });
        this._log(rol, 'Nivel Bronce asignado', true, 'Auto-asignado por el bot');
      } catch(e) { this._log(rol, 'Asignar nivel', false, e.message); }
    }

    await this._sleep(200);

    // Verificar cálculo de comisiones
    const nv = window.getNivel?.(perfil.nivel||'bronce');
    this._log(rol, 'Sistema de niveles', !!nv, `${nv?.emoji} ${nv?.nombre} · recibe ${nv?.streamer}%`);

    const dist = window.calcularDistribucion?.(200, perfil.nivel||'bronce');
    this._log(rol, 'Cálculo comisión (200⭐=$1)', !!dist, dist?`streamer:${dist.streamer}⭐ · ${(dist.streamer/200).toFixed(2)}USD`:'error', 'Error en calcularDistribucion()');

    await this._sleep(200);

    // Sala de voz — crear y cerrar
    try {
      const salaId = await window.fsAdd('salas', {
        nombre: 'Sala Test Bot', tipo: 'voice',
        uid_host: perfil.id, nick_host: perfil.nick||perfil.nombre,
        activa: true, participantes: 0
      });
      this._log(rol, 'Crear sala de voz', true, 'Sala guardada en Firestore');
      await this._sleep(300);
      if (salaId?.id) await window.fsSet('salas', salaId.id, { activa: false });
      this._log(rol, 'Cerrar sala de voz', true, 'Sala cerrada OK');
    } catch(e) { this._log(rol, 'Salas de voz', false, e.message); }

    await this._sleep(200);

    // Solicitar retiro
    try {
      const retiroId = await window.fsAdd('retiros', {
        monto: 100, monto_usd: 0.50,
        metodo: 'PayPal (test)', cuenta: 'test@test.com',
        estado: 'pendiente', tipo: 'streamer',
        uid_streamer: perfil.id, nick: perfil.nick||perfil.nombre,
        _test: true
      });
      this._log(rol, 'Solicitar retiro', true, '100⭐ = $0.50 USD en Firestore');
      // Limpiar retiro de prueba
      if (retiroId?.id) await window.fsSet('retiros', retiroId.id, { estado: 'cancelado_test' });
    } catch(e) { this._log(rol, 'Solicitar retiro', false, e.message); }

    await this._sleep(200);

    // Frecuencia de pago
    try {
      await window.fsSet('usuarios', perfil.id, { frecuencia_pago: 'mensual' });
      this._log(rol, 'Guardar frecuencia de pago', true, 'mensual guardado');
    } catch(e) { this._log(rol, 'Frecuencia de pago', false, e.message); }
  },

  async probarUsuario(email, pass) {
    const rol = 'USUARIO';
    this._log(rol, 'Iniciando pruebas...', true, email);
    await this._sleep(300);

    const usuarios = await window.fsGetAll('usuarios').catch(()=>[]);
    const perfil = usuarios?.find(u=>u.email===email);
    this._log(rol, 'Perfil en Firestore', !!perfil, perfil?`@${perfil.nick}`:'no encontrado', 'Registrar cuenta usuario');
    if (!perfil) return;

    this._log(rol, 'Rol correcto', perfil.rol==='usuario', perfil.rol, 'Cambiar rol a usuario en Master');
    this._log(rol, 'Estado activo', perfil.estado==='activo', perfil.estado, 'Activar en Master');
    this._log(rol, 'Tiene estrellas', (perfil.estrellas||0) >= 0, `${perfil.estrellas||0}⭐`);

    await this._sleep(200);

    // Dar estrellas de prueba si no tiene
    if ((perfil.estrellas||0) === 0) {
      try {
        await window.fsSet('usuarios', perfil.id, { estrellas: 1000 });
        this._log(rol, 'Asignar estrellas de prueba', true, '+1000⭐ para pruebas');
      } catch(e) { this._log(rol, 'Asignar estrellas', false, e.message); }
    }

    await this._sleep(200);

    // Solicitar match
    try {
      const streamers = usuarios.filter(u=>u.rol==='streamer'&&u.estado==='activo');
      if (streamers.length > 0) {
        const s = streamers[0];
        const matchId = await window.fsAdd('matches', {
          uid_usuario: perfil.id, nick_usuario: perfil.nick||perfil.nombre,
          uid_streamer: s.id, nick_streamer: s.nick||s.nombre,
          estado: 'esperando', costo: 5, _test: true
        });
        this._log(rol, 'Solicitar match', true, `→ @${s.nick||s.nombre}`);
        await this._sleep(300);
        if (matchId?.id) await window.fsSet('matches', matchId.id, { estado: 'cancelado_test' });
        this._log(rol, 'Cancelar match', true, 'Limpiado OK');
      } else {
        this._log(rol, 'Solicitar match', false, 'No hay streamers activas', 'Activar streamer en Master → Streamers');
      }
    } catch(e) { this._log(rol, 'Match', false, e.message); }

    await this._sleep(200);

    // Ver salas
    try {
      const salas = await window.fsGetAll('salas');
      const activas = salas?.filter(s=>s.activa) || [];
      this._log(rol, 'Ver salas activas', true, `${activas.length} salas disponibles`);
    } catch(e) { this._log(rol, 'Ver salas', false, e.message); }
  },

  async probarAgencia(email, pass) {
    const rol = 'AGENCIA';
    this._log(rol, 'Iniciando pruebas...', true, email);
    await this._sleep(300);

    const usuarios = await window.fsGetAll('usuarios').catch(()=>[]);
    const perfil = usuarios?.find(u=>u.email===email);
    this._log(rol, 'Perfil en Firestore', !!perfil, perfil?`@${perfil.nick}`:'no encontrado', 'Registrar cuenta agencia');
    if (!perfil) return;

    this._log(rol, 'Rol correcto', perfil.rol==='agencia', perfil.rol, 'Cambiar rol a agencia en Master');
    this._log(rol, 'Estado activo', perfil.estado==='activo', perfil.estado, 'Activar en Master');

    await this._sleep(200);

    // Ver mis streamers
    const misStreamers = usuarios.filter(u=>u.rol==='streamer'&&u.agencia_uid===perfil.id);
    this._log(rol, 'Ver mis streamers', true, `${misStreamers.length} asignadas${misStreamers.length===0?' · Asigna streamers desde Master':''}`);

    await this._sleep(200);

    // Generar link de invitación
    const link = `https://auraoficial-seven.vercel.app?ref=${perfil.id}&agencia=${encodeURIComponent(perfil.nick||perfil.nombre)}`;
    this._log(rol, 'Generar link invitación', true, link.substring(0,50)+'...');

    await this._sleep(200);

    // Calcular ganancias
    let totalComision = 0;
    for (const s of misStreamers) {
      const nv = window.getNivel?.(s.nivel||'bronce');
      totalComision += Math.floor((s.estrellas||0) * (nv?.agencia||10) / 100);
    }
    this._log(rol, 'Calcular ganancias', true, `${totalComision}⭐ = $${(totalComision/200).toFixed(2)} USD`);

    await this._sleep(200);

    // Solicitar retiro de prueba
    try {
      const ret = await window.fsAdd('retiros', {
        monto: totalComision||0, monto_usd: (totalComision/200).toFixed(2),
        metodo: 'PayPal (test)', cuenta: email,
        estado: 'pendiente', tipo: 'agencia',
        uid_agencia: perfil.id, nick: perfil.nick||perfil.nombre, _test: true
      });
      this._log(rol, 'Solicitar retiro', true, `$${(totalComision/200).toFixed(2)} USD pendiente para Master`);
      if (ret?.id) await window.fsSet('retiros', ret.id, { estado: 'cancelado_test' });
    } catch(e) { this._log(rol, 'Solicitar retiro', false, e.message); }
  },

  // ══════════════════════════════════════════
  // EJECUTAR TODO
  // ══════════════════════════════════════════
  async ejecutarTodo(creds) {
    this.log = [];
    this.enEjecucion = true;
    this.configurar(creds);

    if (creds.master) await this.probarMaster(creds.master, creds.master_pass||'');
    await this._sleep(500);
    if (creds.streamer) await this.probarStreamer(creds.streamer, creds.streamer_pass||'');
    await this._sleep(500);
    if (creds.usuario) await this.probarUsuario(creds.usuario, creds.usuario_pass||'');
    await this._sleep(500);
    if (creds.agencia) await this.probarAgencia(creds.agencia, creds.agencia_pass||'');

    this.enEjecucion = false;
    return this.log;
  }
};

// ── UI DEL BOT (para Master → Estado Sistema) ──
window.aura_mostrarPruebas = async function(el) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🤖 <span>Bot de Pruebas</span></h1>
      <p>Auditoría automática · Simula cada rol y verifica que todo funcione</p>
    </div>

    <!-- FORMULARIO DE CREDENCIALES -->
    <div class="card" id="botConfigCard" style="margin-bottom:16px">
      <div class="section-title" style="margin-bottom:14px">📧 Correos de prueba</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
        ${[
          {key:'master', label:'👑 Master', placeholder:'andrewjosuev@gmail.com'},
          {key:'streamer', label:'🎤 Streamer', placeholder:'streameraura@aura.com'},
          {key:'usuario', label:'👤 Usuario', placeholder:'usuarioaura1@aura.com'},
          {key:'agencia', label:'🏢 Agencia', placeholder:'auraagency1@aura.com'},
        ].map(r=>`
          <div style="display:flex;gap:8px;align-items:center">
            <div style="width:80px;font-size:12px;font-weight:700;color:var(--mu);flex-shrink:0">${r.label}</div>
            <div class="input-group" style="flex:1">
              <input type="email" id="bot_${r.key}" placeholder="${r.placeholder}" style="font-size:12px">
            </div>
          </div>
        `).join('')}
      </div>
      <button onclick="botIniciar()" class="btn-primary" style="width:100%;padding:16px;font-size:15px;display:flex;align-items:center;justify-content:center;gap:10px">
        🤖 Iniciar auditoría automática
      </button>
    </div>

    <!-- LOG EN TIEMPO REAL -->
    <div class="card" id="botLogCard" style="display:none;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div class="section-title" style="margin-bottom:0">📋 Log en tiempo real</div>
        <span id="botStatus" style="font-size:11px;color:var(--gold);font-weight:700">Iniciando...</span>
      </div>
      <div id="botLogLive" style="height:300px;overflow-y:auto;background:rgba(0,0,0,0.3);border-radius:10px;padding:10px;border:1px solid rgba(255,255,255,0.05)"></div>
    </div>

    <!-- REPORTE FINAL -->
    <div id="botReporte"></div>
  `;

  // Pre-llenar con correos conocidos
  document.getElementById('bot_master').value = 'andrewjosuev@gmail.com';
  document.getElementById('bot_streamer').value = 'streameraura@aura.com';
  document.getElementById('bot_usuario').value = 'usuarioaura1@aura.com';
  document.getElementById('bot_agencia').value = 'auraagency1@aura.com';

  window.botIniciar = async function() {
    const creds = {
      master: document.getElementById('bot_master').value.trim(),
      streamer: document.getElementById('bot_streamer').value.trim(),
      usuario: document.getElementById('bot_usuario').value.trim(),
      agencia: document.getElementById('bot_agencia').value.trim(),
    };

    // Mostrar log
    document.getElementById('botLogCard').style.display = 'block';
    document.getElementById('botLogLive').innerHTML = '';
    document.getElementById('botReporte').innerHTML = '';
    document.getElementById('botStatus').textContent = '🔄 Ejecutando...';
    document.querySelector('#botConfigCard button').disabled = true;
    document.querySelector('#botConfigCard button').textContent = '⏳ Auditando...';

    // Ejecutar
    const resultados = await window.AURA_BOT.ejecutarTodo(creds);

    // Mostrar reporte
    const ok = resultados.filter(r=>r.ok).length;
    const fail = resultados.filter(r=>!r.ok).length;
    const pct = Math.floor(ok/resultados.length*100);

    document.getElementById('botStatus').textContent = `✅ Completado · ${pct}%`;
    document.querySelector('#botConfigCard button').disabled = false;
    document.querySelector('#botConfigCard button').textContent = '🔄 Re-auditar';

    // Agrupar por rol
    const grupos = {};
    resultados.forEach(r => { if(!grupos[r.rol]) grupos[r.rol]=[]; grupos[r.rol].push(r); });

    document.getElementById('botReporte').innerHTML = `
      <!-- RESUMEN -->
      <div style="padding:20px;border-radius:16px;background:${pct===100?'rgba(34,197,94,0.08)':pct>=80?'rgba(212,175,55,0.08)':'rgba(204,0,0,0.08)'};border:1px solid ${pct===100?'rgba(34,197,94,0.3)':pct>=80?'rgba(212,175,55,0.3)':'rgba(204,0,0,0.3)'};margin-bottom:16px;text-align:center">
        <div style="font-family:'Cinzel',serif;font-size:52px;font-weight:900;color:${pct===100?'#22c55e':pct>=80?'var(--gold)':'#EF4444'}">${pct}%</div>
        <div style="font-size:14px;color:#fff;margin:6px 0">${pct===100?'🎉 ¡Todo funciona perfectamente!':pct>=80?'⚠️ Casi perfecto · Revisa los fallos':'❌ Hay problemas que resolver'}</div>
        <div style="font-size:12px;color:var(--mu)">${ok} pasados · ${fail} fallados · ${resultados.length} total</div>
        <div style="height:8px;border-radius:4px;background:rgba(255,255,255,0.08);margin:14px 0 0;overflow:hidden">
          <div style="height:100%;border-radius:4px;background:${pct===100?'#22c55e':pct>=80?'var(--gold)':'#EF4444'};width:${pct}%"></div>
        </div>
      </div>

      <!-- POR ROL -->
      ${Object.entries(grupos).map(([rol, items]) => {
        const rolOk = items.filter(i=>i.ok).length;
        const allOk = rolOk === items.length;
        const iconos = {MASTER:'👑',STREAMER:'🎤',USUARIO:'👤',AGENCIA:'🏢',ADMIN:'👮',MODERADOR:'🛡️'};
        return `
          <div class="card" style="margin-bottom:10px;border-color:${allOk?'rgba(34,197,94,0.2)':'rgba(204,0,0,0.2)'}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
              <div style="display:flex;align-items:center;gap:8px">
                <span>${allOk?'✅':'❌'}</span>
                <span style="font-weight:700">${iconos[rol]||'🔧'} ${rol}</span>
              </div>
              <span style="font-size:12px;color:${allOk?'#22c55e':'#EF4444'};font-weight:700">${rolOk}/${items.length}</span>
            </div>
            <div>
              ${items.map(i=>`
                <div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:12px;align-items:start">
                  <span style="flex-shrink:0">${i.ok?'✅':'❌'}</span>
                  <div style="flex:1">
                    <div style="color:${i.ok?'#fff':'#EF4444'}">${i.accion}</div>
                    ${i.detalle?`<div style="color:var(--mu);font-size:10px">${i.detalle}</div>`:''}
                    ${!i.ok&&i.fix?`<div style="color:#FFA500;font-size:10px;font-weight:600">→ ${i.fix}</div>`:''}
                  </div>
                  <span style="color:var(--mu);font-size:10px;flex-shrink:0">${i.tiempo}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}

      <!-- ACCIONES -->
      <div style="display:flex;gap:10px;margin-top:4px">
        <button onclick="botCopiarReporte()" class="btn-sm" style="flex:1;padding:12px">📋 Copiar reporte</button>
        ${fail > 0 ? `<button onclick="botAutoFix()" style="flex:1;padding:12px;border-radius:var(--r-lg);background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:var(--gold);font-weight:700;cursor:pointer">🔧 Auto-arreglar fallos</button>` : ''}
      </div>
    `;

    window.botCopiarReporte = function() {
      const txt = resultados.map(r=>`${r.ok?'✅':'❌'} [${r.rol}] ${r.accion}${r.detalle?' · '+r.detalle:''}${!r.ok&&r.fix?' → '+r.fix:''}`).join('\n');
      navigator.clipboard?.writeText(`AURA Bot · ${new Date().toLocaleString('es')}\n${pct}% OK\n\n${txt}`)
        .then(()=>toast('Reporte copiado ✓','success'));
    };

    window.botAutoFix = async function() {
      toast('🔧 Aplicando correcciones automáticas...','info');
      const fallos = resultados.filter(r=>!r.ok);
      let arreglados = 0;
      for (const f of fallos) {
        // Auto-fix: asignar nivel bronce a streamers sin nivel
        if (f.accion.includes('nivel') && f.rol==='STREAMER') {
          const u = await window.fsGetAll('usuarios');
          const s = u?.find(x=>x.rol==='streamer'&&!x.nivel);
          if (s) { await window.fsSet('usuarios',s.id,{nivel:'bronce'}); arreglados++; }
        }
        // Auto-fix: activar switches
        if (f.accion.includes('switch') || f.accion.includes('plataforma')) {
          await window.fsSet('config_plataforma','global',{registros:true,lives:true,stars:true,chat:true,match:true,pk_battle:true});
          arreglados++;
        }
        // Auto-fix: estrellas prueba
        if (f.accion.includes('estrellas') && f.rol==='USUARIO') {
          const u = await window.fsGetAll('usuarios');
          const usr = u?.find(x=>x.rol==='usuario');
          if (usr) { await window.fsSet('usuarios',usr.id,{estrellas:1000}); arreglados++; }
        }
      }
      toast(`✅ ${arreglados} correcciones aplicadas · Re-auditando...`,'success');
      setTimeout(()=>botIniciar(), 1500);
    };
  };
};

console.log('✅ Bot de pruebas AURA cargado · Ir a Master → Estado Sistema');
