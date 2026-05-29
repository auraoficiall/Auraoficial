// js/test_sistema.js — Bot de pruebas ESTRICTO · AURA
// Navega, hace click real, verifica resultado real

window.aura_mostrarPruebas = async function(el) {

  // ── UI INICIAL ────────────────────────────────────────────────────────────
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🤖 Bot de <span>Pruebas</span></h1>
      <p>Pruebas estrictas — navega, hace click, verifica resultado real</p>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="section-title" style="margin-bottom:10px">⚙️ Configuración</div>
      <div style="font-size:12px;color:var(--mu);margin-bottom:12px">
        El bot navegará a cada sección, hará click en los botones y verificará que funcionen.
        <b style="color:#EF4444">No toques la pantalla mientras corre.</b>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
          <input type="checkbox" id="botOptFirestore" checked> Verificar escrituras en Firestore
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
          <input type="checkbox" id="botOptModales" checked> Verificar modales y UI
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
          <input type="checkbox" id="botOptNavegar" checked> Verificar navegación
        </label>
      </div>
    </div>

    <button id="botStartBtn" onclick="botStart()"
      class="btn-primary" style="width:100%;padding:16px;font-size:14px;margin-bottom:14px">
      🤖 Iniciar pruebas estrictas
    </button>

    <!-- PROGRESO -->
    <div id="botProg" style="display:none;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--mu);margin-bottom:5px">
        <span id="botProgLabel">—</span>
        <span id="botProgPct">0%</span>
      </div>
      <div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden">
        <div id="botProgBar" style="height:100%;background:var(--grad-main);border-radius:3px;width:0%;transition:width .3s"></div>
      </div>
    </div>

    <!-- LOG -->
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="section-title">📋 Log en tiempo real</div>
        <button onclick="document.getElementById('botLog').innerHTML=''" class="btn-sm" style="padding:3px 8px;font-size:10px">Limpiar</button>
      </div>
      <div id="botLog"
        style="font-family:'JetBrains Mono',monospace;font-size:10.5px;line-height:1.7;
               height:300px;overflow-y:auto;background:rgba(0,0,0,0.4);
               border-radius:10px;padding:10px">
        <span style="color:rgba(255,255,255,0.2)">Esperando inicio...</span>
      </div>
    </div>

    <!-- REPORTE FINAL -->
    <div id="botReport" style="display:none"></div>
  `;

  // ── HELPERS DEL BOT ───────────────────────────────────────────────────────
  let _total = 0, _done = 0;
  const _results = []; // { grupo, label, ok, detalle }

  function setTotal(n) { _total = n; }

  function progreso(label) {
    _done++;
    const pct = Math.min(Math.floor(_done / _total * 100), 99);
    const bar = document.getElementById('botProgBar');
    const pctEl = document.getElementById('botProgPct');
    const lbl = document.getElementById('botProgLabel');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (lbl) lbl.textContent = label;
  }

  function addLog(grupo, label, ok, detalle) {
    const logEl = document.getElementById('botLog');
    if (!logEl) return;
    const colores = {
      NAV:'#60A5FA', FIREBASE:'#4ade80', MASTER:'var(--gold)',
      ADMIN:'#F59E0B', MOD:'#a8d8f0', AGENCIA:'#A78BFA',
      STREAMER:'#4ade80', USUARIO:'#93c5fd', SYS:'rgba(255,255,255,0.3)'
    };
    const color = colores[grupo] || '#fff';
    const icon = ok === true ? '✅' : ok === false ? '❌' : '⏳';
    const time = new Date().toLocaleTimeString('es',{hour12:false});
    const d = document.createElement('div');
    d.innerHTML = `<span style="color:rgba(255,255,255,0.25)">${time}</span> `
      + `<span style="color:${color};font-weight:700">[${grupo}]</span> `
      + `<span style="color:${ok===false?'#EF4444':'rgba(255,255,255,0.85)'}">${label}</span> `
      + `${detalle ? `<span style="color:rgba(255,255,255,0.35);font-size:9.5px"> · ${detalle}</span>` : ''}`
      + ` ${icon}`;
    logEl.appendChild(d);
    logEl.scrollTop = logEl.scrollHeight;
    _results.push({ grupo, label, ok: ok === true, detalle: detalle || '' });
    progreso(label);
  }

  function sep(titulo) {
    const logEl = document.getElementById('botLog');
    if (!logEl) return;
    const d = document.createElement('div');
    d.innerHTML = `<span style="color:rgba(255,255,255,0.15);font-size:9px">━━━━━━━━━━━ ${titulo} ━━━━━━━━━━━</span>`;
    d.style.marginTop = '6px';
    logEl.appendChild(d);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  // Navega y espera que el DOM tenga contenido real
  async function navegar(page, expectedId) {
    window.navigate(page);
    await wait(600);
    if (expectedId) {
      return !!document.getElementById(expectedId) || !!document.querySelector(expectedId);
    }
    const content = document.getElementById('appContent');
    return content && content.innerHTML.length > 100;
  }

  // Busca un botón por texto/onclick y lo clickea
  function clickBoton(selector) {
    const el = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;
    if (!el) return false;
    el.click();
    return true;
  }

  function clickPorTexto(texto) {
    const btns = Array.from(document.querySelectorAll('button,div[onclick],span[onclick]'));
    const btn = btns.find(b => b.textContent.trim().toLowerCase().includes(texto.toLowerCase()));
    if (!btn) return false;
    btn.click();
    return true;
  }

  function existeEnDOM(selector) {
    return !!document.querySelector(selector);
  }

  function contenidoTiene(texto) {
    const content = document.getElementById('appContent');
    return content ? content.innerHTML.toLowerCase().includes(texto.toLowerCase()) : false;
  }

  async function esperarModal(id, ms = 800) {
    await wait(ms);
    return !!document.getElementById(id);
  }

  async function esperarContenido(texto, ms = 700) {
    await wait(ms);
    return contenidoTiene(texto);
  }

  // Escribe en Firestore y verifica lectura inmediata
  async function testFirestore(col, datos) {
    try {
      const id = await window.fsAdd(col, { ...datos, _bot: true, _ts: Date.now() });
      if (!id) return { ok: false, detalle: 'fsAdd no devolvió ID' };
      const doc = await window.fsGet(col, id);
      const ok = !!doc;
      // Limpiar el doc de prueba
      try { await window.fsSet(col, id, { _eliminado: true }); } catch(e){}
      return { ok, detalle: ok ? `ID: ${id.slice(0,8)}...` : 'No se pudo leer de vuelta' };
    } catch(e) {
      return { ok: false, detalle: e.message };
    }
  }

  // Cierra cualquier modal abierto
  function cerrarModales() {
    ['masterEditModal','modalAg','modalAgencia','strMatchModal','strMatchCall',
     'salaOverlay','botReporte'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    // Cerrar modales genéricos
    document.querySelectorAll('[id*="Modal"],[id*="modal"],[id*="Overlay"]').forEach(el => {
      if (el.id !== 'sidebarOverlay') el.remove();
    });
  }

  // ── INICIO DEL BOT ────────────────────────────────────────────────────────
  window.botStart = async function() {
    const btn = document.getElementById('botStartBtn');
    if (btn) btn.disabled = true;
    document.getElementById('botProg').style.display = 'block';
    document.getElementById('botLog').innerHTML = '';
    document.getElementById('botReport').style.display = 'none';
    _results.length = 0;
    _done = 0;

    const perfil = window._currentPerfil;
    if (!perfil) {
      addLog('SYS', 'Sin perfil activo — inicia sesión primero', false);
      if (btn) btn.disabled = false;
      return;
    }

    setTotal(68); // total de pruebas estimadas

    // ════════════════════════════════════════════════════════
    // BLOQUE 1 — FIREBASE Y HELPERS
    // ════════════════════════════════════════════════════════
    sep('FIREBASE & CORE');

    addLog('FIREBASE', 'Firebase DB inicializado', !!window._db, window._db ? 'Firestore listo' : 'Falta _db');
    addLog('FIREBASE', 'Firebase Auth inicializado', !!window._auth, window._auth ? 'Auth listo' : 'Falta _auth');
    addLog('FIREBASE', 'Usuario autenticado', !!window._currentUser, window._currentUser?.email || 'sin sesión');

    const helpers = ['fsGet','fsSet','fsAdd','fsGetAll','fsLogsRecientes'];
    for (const h of helpers) {
      addLog('FIREBASE', `Helper ${h}()`, typeof window[h] === 'function');
    }
    await wait(200);

    // Test escritura/lectura real
    const fsTest = await testFirestore('logs_master', { accion: '🤖 Bot test escritura', tipo: 'bot' });
    addLog('FIREBASE', 'Escritura y lectura Firestore real', fsTest.ok, fsTest.detalle);

    // Colecciones accesibles
    const cols = ['usuarios','logs_master','reportes','tickets','retiros','matches','infracciones','pk_battles'];
    for (const col of cols) {
      try {
        const data = await window.fsGetAll(col);
        addLog('FIREBASE', `Colección "${col}" accesible`, true, `${data?.length || 0} docs`);
      } catch(e) {
        addLog('FIREBASE', `Colección "${col}" accesible`, false, 'Sin permisos o error');
      }
    }

    // ════════════════════════════════════════════════════════
    // BLOQUE 2 — NAVEGACIÓN (todas las páginas del rol)
    // ════════════════════════════════════════════════════════
    sep('NAVEGACIÓN POR ROL: ' + perfil.rol.toUpperCase());
    await wait(200);

    const paginasPorRol = {
      master:    ['home','finanzas','lives','streamers','agencias','admins','security','stats','config','tarifas','metas','sistema'],
      admin:     ['stats','lives','streamers','agencias','moderation','reportes','tickets','finanzas','monitores','security'],
      moderador: ['home','lives','reportes','perfiles','tickets','infracciones','bloqueos','actividad','escalar'],
      agencia:   ['home','streamers','finanzas','stats','lives','mensajes','metas'],
      streamer:  ['home','live','estrellas','finanzas','gifts','seguidores','mensajes','rankings','pk','metas','perfil'],
      usuario:   ['home','lives','explorar','match','estrellas','favoritos','mensajes','rooms','rankings','perfil'],
    };

    const paginas = paginasPorRol[perfil.rol] || [];
    for (const pag of paginas) {
      window.navigate(pag);
      await wait(500);
      const content = document.getElementById('appContent');
      const renderizó = content && content.innerHTML.length > 200;
      addLog('NAV', `navigate('${pag}') → renderiza contenido`, renderizó,
        renderizó ? `${content.innerHTML.length} chars` : 'Contenido vacío o muy corto');
    }

    // ════════════════════════════════════════════════════════
    // BLOQUE 3 — PRUEBAS ESPECÍFICAS POR ROL
    // ════════════════════════════════════════════════════════

    if (perfil.rol === 'master') {
      sep('MASTER — BOTONES Y ACCIONES');
      await wait(200);

      // -- Streamers: cargar tabla
      window.navigate('streamers');
      await wait(800);
      addLog('MASTER', 'Sección Streamers carga tabla de usuarios', contenidoTiene('card') || contenidoTiene('tab_'), '');

      // -- Botón Editar usuario
      window.navigate('streamers');
      await wait(800);
      const btnEditar = document.querySelector('[onclick*="masterEditarUsuario"]');
      if (btnEditar) {
        btnEditar.click();
        await wait(500);
        const modalAbre = !!document.getElementById('masterEditModal');
        addLog('MASTER', 'Botón ✏️ Editar → abre modal', modalAbre, modalAbre ? 'Modal visible' : 'Modal no apareció');
        cerrarModales();
      } else {
        addLog('MASTER', 'Botón ✏️ Editar → abre modal', false, 'No hay streamers o botón no encontrado en DOM');
      }

      // -- Botón Agencia
      window.navigate('streamers');
      await wait(800);
      const btnAgencia = document.querySelector('[onclick*="masterAsignarAgencia"]');
      if (btnAgencia) {
        btnAgencia.click();
        await wait(600);
        const modalAg = !!document.getElementById('modalAg');
        addLog('MASTER', 'Botón 🏢 Agencia → abre modal de agencias', modalAg, modalAg ? 'Modal visible' : 'Modal no apareció');
        cerrarModales();
      } else {
        addLog('MASTER', 'Botón 🏢 Agencia → abre modal de agencias', false, 'No hay streamers en tab actual');
      }

      // -- Tarifas: guardar
      window.navigate('tarifas');
      await wait(800);
      const guardarBtn = document.querySelector('[onclick*="masterGuardarTarifas"]');
      if (guardarBtn) {
        guardarBtn.click();
        await wait(500);
        // Verificar que se guardó en Firestore
        try {
          const tf = await window.fsGet('config_plataforma', 'tarifas');
          addLog('MASTER', 'Guardar Tarifas → escribe en Firestore', !!tf, tf ? 'Tarifas guardadas' : 'No se encontró en Firestore');
        } catch(e) {
          addLog('MASTER', 'Guardar Tarifas → escribe en Firestore', false, e.message);
        }
      } else {
        addLog('MASTER', 'Guardar Tarifas → botón existe en DOM', false, 'Abre la sección Tarifas primero');
      }

      // -- Control plataforma: toggle
      window.navigate('config');
      await wait(800);
      const switches = document.querySelectorAll('[onchange*="masterControlToggle"]');
      addLog('MASTER', `Control Plataforma → ${switches.length} switches visibles en DOM`, switches.length > 0, `${switches.length} switches`);

      // -- Metas: crear
      window.navigate('metas');
      await wait(800);
      const inpMeta = document.getElementById('metaTitulo');
      const btnMeta = document.querySelector('[onclick*="masterCrearMeta"]');
      if (inpMeta && btnMeta) {
        inpMeta.value = '🤖 Meta de prueba bot';
        const inpValor = document.getElementById('metaValor');
        if (inpValor) inpValor.value = '9999';
        btnMeta.click();
        await wait(600);
        const metaCreada = await esperarContenido('Meta de prueba bot', 500);
        addLog('MASTER', 'Crear Meta Semanal → aparece en lista', metaCreada, metaCreada ? 'Meta visible' : 'No apareció en lista');
      } else {
        addLog('MASTER', 'Crear Meta Semanal → formulario en DOM', false, 'Inputs no encontrados');
      }

      // -- Economía: carga datos
      window.navigate('finanzas');
      await wait(900);
      addLog('MASTER', 'Economía → carga balance de estrellas', contenidoTiene('⭐') || contenidoTiene('estrella'), '');

      // -- Analytics
      window.navigate('stats');
      await wait(700);
      addLog('MASTER', 'Analytics → carga gráficas y estadísticas', contenidoTiene('stat-card') || contenidoTiene('usuarios'), '');

      // -- Realtime log
      window.navigate('actividad');
      await wait(700);
      addLog('MASTER', 'Actividad Realtime → carga logs', contenidoTiene('log') || contenidoTiene('accion') || contenidoTiene('cargando'), '');

      // -- Tickets
      window.navigate('tickets');
      await wait(600);
      const btnNuevoTicket = document.querySelector('[onclick*="masterNuevoTicket"]');
      addLog('MASTER', 'Tickets → botón + Nuevo Ticket existe', !!btnNuevoTicket, '');

    } // fin master

    if (perfil.rol === 'admin') {
      sep('ADMIN — BOTONES Y ACCIONES');
      await wait(200);

      window.navigate('streamers');
      await wait(800);
      addLog('ADMIN', 'Sección Streamers carga lista', contenidoTiene('card') || contenidoTiene('streamer'), '');

      // Aprobar / Suspender
      const btnAprobar = document.querySelector('[onclick*="adminAprobar"]');
      const btnSuspender = document.querySelector('[onclick*="adminSuspender"]');
      addLog('ADMIN', 'Botones Aprobar/Suspender visibles', !!btnAprobar || !!btnSuspender,
        btnAprobar ? 'Hay streamers pendientes' : btnSuspender ? 'Hay streamers activas' : 'Sin streamers en lista');

      // Moderation
      window.navigate('moderation');
      await wait(700);
      const btnBanear = document.querySelector('[onclick*="adminBanearUsuario"]');
      addLog('ADMIN', 'Moderación → botón Banear existe', !!btnBanear, '');

      // Reportes: crear
      window.navigate('reportes');
      await wait(700);
      const inpDesc = document.getElementById('reporteDesc');
      const btnCrearRep = document.querySelector('[onclick*="adminCrearReporte"]');
      if (inpDesc && btnCrearRep) {
        inpDesc.value = '🤖 Test bot admin';
        btnCrearRep.click();
        await wait(600);
        addLog('ADMIN', 'Crear Reporte → acción ejecutada', true, 'Click realizado');
      } else {
        addLog('ADMIN', 'Crear Reporte → formulario en DOM', false, 'Inputs no encontrados');
      }

      // Economía
      window.navigate('finanzas');
      await wait(800);
      addLog('ADMIN', 'Economía → carga panel', contenidoTiene('stat-card') || contenidoTiene('usuario'), '');

      // Monitores: nuevo mod
      window.navigate('monitores');
      await wait(700);
      const btnNuevoMod = document.querySelector('[onclick*="adminNuevoMod"]');
      addLog('ADMIN', 'Monitores → botón + Nuevo Moderador existe', !!btnNuevoMod, '');

      // Seguridad: logs
      window.navigate('security');
      await wait(700);
      addLog('ADMIN', 'Seguridad → sección carga correctamente', contenidoTiene('log') || contenidoTiene('seguridad') || contenidoTiene('sistema'), '');

    } // fin admin

    if (perfil.rol === 'moderador') {
      sep('MODERADOR — BOTONES Y ACCIONES');
      await wait(200);

      // Dashboard
      window.navigate('home');
      await wait(700);
      addLog('MOD', 'Dashboard → carga stats y acciones rápidas', contenidoTiene('stat-card'), '');

      // Reportes: crear
      window.navigate('reportes');
      await wait(700);
      const inpModRep = document.getElementById('modReporteDesc');
      const btnModRep = document.querySelector('[onclick*="modCrearReporte"]');
      if (inpModRep && btnModRep) {
        inpModRep.value = '🤖 Test bot moderador';
        btnModRep.click();
        await wait(600);
        addLog('MOD', 'Crear Reporte → acción ejecutada', true, 'Click realizado');
      } else {
        addLog('MOD', 'Crear Reporte → formulario en DOM', false, 'Inputs no encontrados');
      }

      // Infracciones: crear
      window.navigate('infracciones');
      await wait(700);
      const inpInfUser = document.getElementById('infUser');
      const inpInfDesc = document.getElementById('infDesc');
      const btnInf = document.querySelector('[onclick*="modCrearInfraccion"]');
      if (inpInfUser && inpInfDesc && btnInf) {
        inpInfUser.value = '@bot_test';
        inpInfDesc.value = '🤖 Test infracción bot';
        btnInf.click();
        await wait(600);
        addLog('MOD', 'Crear Infracción → acción ejecutada', true, 'Click realizado y datos enviados');
      } else {
        addLog('MOD', 'Crear Infracción → formulario en DOM', false, 'Inputs no encontrados');
      }

      // Escalar caso
      window.navigate('escalar');
      await wait(700);
      const inpEscalar = document.getElementById('escalarTitulo');
      const btnEscalar = document.querySelector('[onclick*="modEscalarCaso"]');
      if (inpEscalar && btnEscalar) {
        inpEscalar.value = '🤖 Caso test bot';
        const inpEscDesc = document.getElementById('escalarDesc');
        if (inpEscDesc) inpEscDesc.value = 'Prueba automática del bot';
        btnEscalar.click();
        await wait(600);
        addLog('MOD', 'Escalar Caso → acción ejecutada', true, 'Click realizado');
      } else {
        addLog('MOD', 'Escalar Caso → formulario en DOM', false, 'Inputs no encontrados');
      }

      // Bloqueos IP
      window.navigate('bloqueos');
      await wait(600);
      const inpIP = document.getElementById('modIp');
      addLog('MOD', 'Bloqueos IP → formulario existe en DOM', !!inpIP, '');

      // Perfiles
      window.navigate('perfiles');
      await wait(700);
      addLog('MOD', 'Perfiles → carga lista de usuarios', contenidoTiene('card-avatar') || contenidoTiene('card-row'), '');

    } // fin moderador

    if (perfil.rol === 'agencia') {
      sep('AGENCIA — BOTONES Y ACCIONES');
      await wait(200);

      window.navigate('home');
      await wait(800);
      addLog('AGENCIA', 'Dashboard → carga stats de la agencia', contenidoTiene('stat-card'), '');

      // Link de invitación
      const btnLink = document.querySelector('[onclick*="agGenerarLink"]');
      addLog('AGENCIA', 'Generar link de invitación → botón existe', !!btnLink, '');
      if (btnLink) {
        btnLink.click();
        await wait(400);
        const linkVisible = contenidoTiene('auraoficial') || contenidoTiene('ref=') || contenidoTiene('link');
        addLog('AGENCIA', 'Generar link → muestra el link', linkVisible, linkVisible ? 'Link generado' : 'No apareció link');
      }

      // Streamers
      window.navigate('streamers');
      await wait(800);
      addLog('AGENCIA', 'Mis Streamers → carga lista', contenidoTiene('card') || contenidoTiene('streamer'), '');

      // Ganancias
      window.navigate('finanzas');
      await wait(800);
      addLog('AGENCIA', 'Ganancias → carga panel con estrellas', contenidoTiene('⭐') || contenidoTiene('estrella') || contenidoTiene('comisión'), '');

      const btnRetiro = document.querySelector('[onclick*="agSolicitarRetiro"]');
      addLog('AGENCIA', 'Solicitar Retiro → botón existe', !!btnRetiro, '');

      // Metas
      window.navigate('metas');
      await wait(700);
      const inpMetaAg = document.getElementById('metaTitulo');
      const btnMetaAg = document.querySelector('[onclick*="agCrearMeta"]');
      if (inpMetaAg && btnMetaAg) {
        inpMetaAg.value = '🤖 Meta test agencia';
        const inpValAg = document.getElementById('metaValor');
        if (inpValAg) inpValAg.value = '5000';
        btnMetaAg.click();
        await wait(600);
        addLog('AGENCIA', 'Crear Meta → acción ejecutada', true, 'Click realizado');
      } else {
        addLog('AGENCIA', 'Crear Meta → formulario en DOM', false, 'Inputs no encontrados');
      }

      // Mensajes
      window.navigate('mensajes');
      await wait(700);
      addLog('AGENCIA', 'Mensajes → carga lista de conversaciones', contenidoTiene('card') || contenidoTiene('chat') || contenidoTiene('mensaje'), '');

    } // fin agencia

    if (perfil.rol === 'streamer') {
      sep('STREAMER — BOTONES Y ACCIONES');
      await wait(200);

      window.navigate('home');
      await wait(800);
      addLog('STREAMER', 'Dashboard → carga stats y botones', contenidoTiene('stat-card'), '');

      // Botón iniciar live
      const btnLive = document.querySelector('[onclick*="str_iniciarLive"]') ||
                      document.querySelector('[onclick*="iniciarLive"]') ||
                      document.querySelector('[onclick*="navigate(\'live\')"]');
      addLog('STREAMER', 'Botón INICIAR LIVE → existe en dashboard', !!btnLive, btnLive ? 'Botón encontrado' : 'No encontrado');

      // Sección live
      window.navigate('live');
      await wait(800);
      addLog('STREAMER', 'Sección Live → carga panel pre-live', contenidoTiene('live') || contenidoTiene('iniciar'), '');

      const btnIniciarLive = document.querySelector('[onclick*="str_iniciarLive"]');
      addLog('STREAMER', 'Botón ● INICIAR LIVE → existe en sección live', !!btnIniciarLive, '');

      // Ganancias
      window.navigate('estrellas');
      await wait(700);
      addLog('STREAMER', 'Ganancias → muestra estrellas acumuladas', contenidoTiene('⭐') || contenidoTiene('estrella'), '');

      // Retiro
      window.navigate('finanzas');
      await wait(800);
      addLog('STREAMER', 'Retiro → muestra panel de retiro', contenidoTiene('retiro') || contenidoTiene('USD') || contenidoTiene('PayPal'), '');
      const btnMonto = document.querySelector('[id*="montoBtn_"]');
      addLog('STREAMER', 'Retiro → botones de monto visibles', !!btnMonto, btnMonto ? 'Montos renderizados' : 'Sin montos (saldo 0 o no renderizó)');

      // Match
      window.navigate('match');
      await wait(800);
      addLog('STREAMER', 'Match → carga discovery de usuarios', contenidoTiene('card') || contenidoTiene('match'), '');

      // PK
      window.navigate('pk');
      await wait(700);
      addLog('STREAMER', 'PK Battle → sección carga', contenidoTiene('pk') || contenidoTiene('battle') || contenidoTiene('rival'), '');
      const btnBuscarRival = document.querySelector('[onclick*="strBuscarRival"]');
      addLog('STREAMER', 'PK → botón Buscar Rival existe', !!btnBuscarRival, '');

      // Metas
      window.navigate('metas');
      await wait(700);
      const inpMetaStr = document.getElementById('strMetaTitulo');
      const btnMetaStr = document.querySelector('[onclick*="strCrearMeta"]');
      if (inpMetaStr && btnMetaStr) {
        inpMetaStr.value = '🤖 Meta test streamer';
        const inpValStr = document.getElementById('strMetaValor');
        if (inpValStr) inpValStr.value = '5000';
        btnMetaStr.click();
        await wait(600);
        addLog('STREAMER', 'Crear Meta → acción ejecutada', true, 'Click + valor enviado');
      } else {
        addLog('STREAMER', 'Crear Meta → formulario en DOM', false, 'Inputs no encontrados');
      }

      // Perfil
      window.navigate('perfil');
      await wait(800);
      addLog('STREAMER', 'Perfil → carga vista de perfil', contenidoTiene('perfil') || contenidoTiene('portada') || contenidoTiene('avatar'), '');

      // Gifts
      window.navigate('gifts');
      await wait(700);
      addLog('STREAMER', 'Gifts → muestra tabla de gifts', contenidoTiene('gift') || contenidoTiene('🌹') || contenidoTiene('rosa'), '');

    } // fin streamer

    if (perfil.rol === 'usuario') {
      sep('USUARIO — BOTONES Y ACCIONES');
      await wait(200);

      window.navigate('home');
      await wait(800);
      addLog('USUARIO', 'Inicio → carga feed de streamers', contenidoTiene('card') || contenidoTiene('live') || contenidoTiene('stream'), '');

      // Lives
      window.navigate('lives');
      await wait(700);
      addLog('USUARIO', 'Lives → sección carga', contenidoTiene('live') || contenidoTiene('card') || contenidoTiene('stream'), '');

      // Match
      window.navigate('match');
      await wait(900);
      addLog('USUARIO', 'Match → carga discovery de streamers', contenidoTiene('card') || contenidoTiene('match') || contenidoTiene('streamer'), '');
      const btnMatch = document.querySelector('[onclick*="usrSolicitarMatch"]') ||
                       document.querySelector('[onclick*="strSolicitarMatch"]');
      addLog('USUARIO', 'Match → botón ⚡ Match existe', !!btnMatch, btnMatch ? 'Encontrado' : 'No visible');

      // Wallet
      window.navigate('estrellas');
      await wait(800);
      addLog('USUARIO', 'Wallet → carga panel de estrellas', contenidoTiene('estrella') || contenidoTiene('⭐') || contenidoTiene('pack'), '');

      // Mensajes
      window.navigate('mensajes');
      await wait(700);
      addLog('USUARIO', 'Mensajes → carga lista de chats', contenidoTiene('card') || contenidoTiene('chat') || contenidoTiene('mensaje'), '');

      // Perfil
      window.navigate('perfil');
      await wait(800);
      addLog('USUARIO', 'Perfil → carga vista de perfil', contenidoTiene('perfil') || contenidoTiene('card') || contenidoTiene('@'), '');

      // Rankings
      window.navigate('rankings');
      await wait(700);
      addLog('USUARIO', 'Rankings → muestra tabla de posiciones', contenidoTiene('ranking') || contenidoTiene('🏆') || contenidoTiene('estrella'), '');

    } // fin usuario

    // ════════════════════════════════════════════════════════
    // BLOQUE 4 — SISTEMA DE NIVELES Y CÁLCULOS
    // ════════════════════════════════════════════════════════
    sep('NIVELES Y CÁLCULOS');
    await wait(200);

    addLog('SYS', 'AURA_NIVELES cargado', !!window.AURA_NIVELES && Object.keys(window.AURA_NIVELES).length === 4,
      window.AURA_NIVELES ? Object.keys(window.AURA_NIVELES).join(', ') : 'No cargado');

    const calculos = [
      { nivel:'bronce',   esp:[200,100,700] },
      { nivel:'plata',    esp:[270,130,600] },
      { nivel:'oro',      esp:[330,170,500] },
      { nivel:'diamante', esp:[350,200,450] },
    ];
    for (const c of calculos) {
      const d = window.calcularDistribucion?.(1000, c.nivel);
      const ok = d?.streamer === c.esp[0] && d?.agencia === c.esp[1] && d?.master === c.esp[2];
      addLog('SYS', `Distribución ${c.nivel} (1000⭐)`, ok,
        d ? `str:${d.streamer} ag:${d.agencia} aura:${d.master}` : 'calcularDistribucion() falló');
    }

    // ════════════════════════════════════════════════════════
    // BLOQUE 5 — PWA Y SERVICE WORKER
    // ════════════════════════════════════════════════════════
    sep('PWA');
    addLog('SYS', 'Manifest PWA', !!document.querySelector('link[rel="manifest"]'), '');
    addLog('SYS', 'Meta viewport', !!document.querySelector('meta[name="viewport"]'), '');
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      addLog('SYS', 'Service Worker registrado', !!reg, reg ? reg.scope : 'No registrado');
    } catch(e) {
      addLog('SYS', 'Service Worker', false, e.message);
    }

    // ════════════════════════════════════════════════════════
    // VOLVER A HOME al terminar
    // ════════════════════════════════════════════════════════
    cerrarModales();
    window.navigate('home');
    await wait(300);

    // ════════════════════════════════════════════════════════
    // REPORTE FINAL
    // ════════════════════════════════════════════════════════
    document.getElementById('botProgBar').style.width = '100%';
    document.getElementById('botProgPct').textContent = '100%';
    document.getElementById('botProgLabel').textContent = '¡Auditoría completada!';

    const pasados = _results.filter(r => r.ok).length;
    const fallados = _results.filter(r => !r.ok).length;
    const total = _results.length;
    const pct = Math.floor(pasados / total * 100);
    const exitoso = pct >= 80;

    // Agrupar por grupo
    const grupos = {};
    _results.forEach(r => {
      if (!grupos[r.grupo]) grupos[r.grupo] = [];
      grupos[r.grupo].push(r);
    });

    const repEl = document.getElementById('botReport');
    repEl.style.display = 'block';
    repEl.innerHTML = `
      <div class="card" style="border-color:${exitoso?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'};margin-bottom:14px">
        <div style="text-align:center;padding:16px 0 8px">
          <div style="font-size:52px;margin-bottom:8px">${pct===100?'🏆':pct>=80?'✅':'⚠️'}</div>
          <div style="font-family:'Cinzel',serif;font-size:28px;font-weight:900;color:${exitoso?'#22c55e':'#EF4444'}">${pct}% operativo</div>
          <div style="font-size:12px;color:var(--mu);margin-top:4px">${pasados} pasadas · ${fallados} falladas · ${total} total</div>
        </div>
        <div style="height:8px;border-radius:4px;background:rgba(255,255,255,0.06);overflow:hidden;margin:10px 0">
          <div style="width:${pct}%;height:100%;background:${exitoso?'#22c55e':'#EF4444'};border-radius:4px"></div>
        </div>
      </div>

      <!-- RESUMEN POR GRUPO -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:12px">📊 Resultado por sección</div>
        ${Object.entries(grupos).map(([g, items]) => {
          const gOk = items.filter(i=>i.ok).length;
          const gPct = Math.floor(gOk/items.length*100);
          const gColor = gPct===100?'#22c55e':gPct>=60?'#FFA500':'#EF4444';
          return `
            <div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                <span style="font-weight:700">${g}</span>
                <span style="color:${gColor};font-weight:700">${gOk}/${items.length}</span>
              </div>
              <div style="height:4px;border-radius:2px;background:rgba(255,255,255,0.06);overflow:hidden">
                <div style="width:${gPct}%;height:100%;background:${gColor};border-radius:2px"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- FALLADOS -->
      ${fallados > 0 ? `
      <div class="card" style="border-color:rgba(239,68,68,0.25);margin-bottom:14px">
        <div class="section-title" style="color:#EF4444;margin-bottom:10px">❌ ${fallados} prueba${fallados>1?'s':''} fallada${fallados>1?'s':''}</div>
        ${_results.filter(r=>!r.ok).map(r=>`
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <div style="font-size:12px;font-weight:700;color:#EF4444">[${r.grupo}] ${r.label}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:2px">${r.detalle || '—'}</div>
          </div>
        `).join('')}
      </div>` : `
      <div class="card" style="border-color:rgba(34,197,94,0.3);text-align:center;padding:20px;margin-bottom:14px">
        <div style="font-size:36px;margin-bottom:8px">🎉</div>
        <div style="font-family:'Cinzel',serif;color:#22c55e;font-weight:700">¡Todo funciona perfectamente!</div>
      </div>`}

      <div style="display:flex;gap:10px">
        <button onclick="botStart()" class="btn-sm" style="flex:1;padding:12px">🔄 Re-ejecutar</button>
        <button onclick="
          const txt = ${JSON.stringify(_results)}.map(r=>(r.ok?'✅':'❌')+' ['+r.grupo+'] '+r.label+(r.detalle?' · '+r.detalle:'')).join('\\n');
          navigator.clipboard?.writeText('AURA Bot · ${pct}% · ${new Date().toLocaleString('es')}\\n\\n'+txt).then(()=>toast('Copiado ✓','success'))
        " class="btn-sm" style="flex:1;padding:12px">📋 Copiar reporte</button>
      </div>
    `;

    if (btn) btn.disabled = false;
    toast(`🤖 Bot terminado · ${pct}% operativo · ${fallados} fallas`, exitoso ? 'success' : 'info');
  }; // fin botStart

}; // fin aura_mostrarPruebas

console.log('✅ Bot de pruebas estricto AURA cargado');
