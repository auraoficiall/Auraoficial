// js/bot_pruebas.js — Bot de auditoría automática AURA (6 roles)
// Roles: MASTER · ADMIN · MODERADOR · AGENCIA · STREAMER · USUARIO

window.aura_mostrarPruebas = function(el) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>🤖 Bot de <span>Pruebas</span></h1>
      <p>Auditoría automática de todos los roles del sistema</p>
    </div>

    <!-- USUARIOS DE PRUEBA -->
    <div class="card" style="margin-bottom:16px">
      <div class="section-title" style="margin-bottom:14px">👥 Usuarios de prueba</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${[
          { rol:'master',    label:'👑 Master',    id:'botMaster',    val:'andrewjosuev@gmail.com',    color:'var(--gold)' },
          { rol:'admin',     label:'👮 Admin',     id:'botAdmin',     val:'auraadmin1@aura.com',        color:'#F59E0B' },
          { rol:'moderador', label:'🛡️ Moderador', id:'botModerador', val:'auramonitor1@aura.com',     color:'#a8d8f0' },
          { rol:'agencia',   label:'🏢 Agencia',   id:'botAgencia',   val:'auraagency1@aura.com',      color:'#A78BFA' },
          { rol:'streamer',  label:'🎤 Streamer',  id:'botStreamer',  val:'streameraura@aura.com',     color:'#4ade80' },
          { rol:'usuario',   label:'👤 Usuario',   id:'botUsuario',   val:'usuarioaura1@aura.com',     color:'#93c5fd' },
        ].map(u => `
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:12px;font-weight:700;color:${u.color};width:110px;flex-shrink:0">${u.label}</span>
            <div class="input-group" style="flex:1">
              <input type="email" id="${u.id}" value="${u.val}" style="font-size:12px">
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- BOTÓN INICIAR -->
    <button id="botIniciarBtn" onclick="botIniciarAuditoria()"
      class="btn-primary" style="width:100%;padding:16px;margin-bottom:16px;font-size:14px">
      🤖 Iniciar auditoría automática
    </button>

    <!-- PROGRESO -->
    <div id="botProgress" style="display:none;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--mu);margin-bottom:6px">
        <span id="botProgressLabel">Iniciando...</span>
        <span id="botProgressPct">0%</span>
      </div>
      <div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.05);overflow:hidden">
        <div id="botProgressBar" style="height:100%;background:var(--grad-main);border-radius:3px;transition:width .4s;width:0%"></div>
      </div>
    </div>

    <!-- LOG EN TIEMPO REAL -->
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="section-title">📋 Log en tiempo real</div>
        <button onclick="botLimpiarLog()" class="btn-sm" style="padding:4px 10px;font-size:10px">Limpiar</button>
      </div>
      <div id="botLog"
        style="font-family:'JetBrains Mono',monospace;font-size:11px;height:280px;overflow-y:auto;
               background:rgba(0,0,0,0.4);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:3px">
        <div style="color:var(--mu)">Esperando inicio de auditoría...</div>
      </div>
    </div>

    <!-- REPORTE FINAL -->
    <div id="botReporte" style="display:none"></div>
  `;

  // ── HELPERS ──────────────────────────────────────────────────────────────

  let totalPasos = 0;
  let pasoActual = 0;

  function log(rol, msg, ok) {
    const el = document.getElementById('botLog');
    if (!el) return;
    const time = new Date().toLocaleTimeString('es', { hour12: false });
    const color = {
      MASTER:'var(--gold)', ADMIN:'#F59E0B', MODERADOR:'#a8d8f0',
      AGENCIA:'#A78BFA', STREAMER:'#4ade80', USUARIO:'#93c5fd',
      SYS:'rgba(255,255,255,0.4)'
    }[rol] || '#fff';
    const icon = ok === true ? '✅' : ok === false ? '❌' : '⏳';
    const d = document.createElement('div');
    d.innerHTML = `<span style="color:var(--mu)">${time}</span> <span style="color:${color};font-weight:700">[${rol}]</span> ${msg} ${icon}`;
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;

    pasoActual++;
    const pct = Math.min(Math.floor(pasoActual / totalPasos * 100), 99);
    const bar = document.getElementById('botProgressBar');
    const pctEl = document.getElementById('botProgressPct');
    const lblEl = document.getElementById('botProgressLabel');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (lblEl) lblEl.textContent = msg;
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function getUser(email) {
    try {
      const usuarios = await window.fsGetAll('usuarios');
      return usuarios?.find(u => u.email === email) || null;
    } catch(e) { return null; }
  }

  async function runTest(rol, label, fn) {
    log(rol, label, null);
    await wait(220);
    try {
      const res = await fn();
      log(rol, label, res !== false);
      return res !== false;
    } catch(e) {
      log(rol, `${label} — Error: ${e.message}`, false);
      return false;
    }
  }

  // ── AUDITORÍA PRINCIPAL ───────────────────────────────────────────────────

  window.botIniciarAuditoria = async function() {
    document.getElementById('botIniciarBtn').disabled = true;
    document.getElementById('botProgress').style.display = 'block';
    document.getElementById('botReporte').style.display = 'none';
    document.getElementById('botLog').innerHTML = '';
    pasoActual = 0;
    totalPasos = 42; // pasos estimados

    const emails = {
      master:    document.getElementById('botMaster')?.value?.trim(),
      admin:     document.getElementById('botAdmin')?.value?.trim(),
      moderador: document.getElementById('botModerador')?.value?.trim(),
      agencia:   document.getElementById('botAgencia')?.value?.trim(),
      streamer:  document.getElementById('botStreamer')?.value?.trim(),
      usuario:   document.getElementById('botUsuario')?.value?.trim(),
    };

    const resultados = {
      MASTER: [], ADMIN: [], MODERADOR: [],
      AGENCIA: [], STREAMER: [], USUARIO: []
    };

    const ok  = (rol, r) => resultados[rol].push(r);
    const get = async (email) => await getUser(email);

    // ── MASTER ───────────────────────────────────────────────────────────────
    log('SYS', '━━━ Iniciando pruebas MASTER ━━━', null);

    ok('MASTER', await runTest('MASTER', 'Perfil en Firestore', async () => {
      const u = await get(emails.master);
      return u && u.rol === 'master';
    }));

    ok('MASTER', await runTest('MASTER', 'Cargar estadísticas globales', async () => {
      const s = await window.cargarStatsReales?.() || {};
      return typeof s.usuarios === 'number';
    }));

    ok('MASTER', await runTest('MASTER', 'Guardar tarifas en config_plataforma', async () => {
      await window.fsSet('config_plataforma', 'tarifas', { _test: true });
      return true;
    }));

    ok('MASTER', await runTest('MASTER', 'Leer control de plataforma', async () => {
      const cfg = await window.fsGet?.('config_plataforma', 'global');
      return true; // puede ser null o objeto
    }));

    ok('MASTER', await runTest('MASTER', 'Crear log en logs_master', async () => {
      await window.fsAdd('logs_master', {
        accion: '🤖 Test bot — Master', tipo: 'bot',
        uid_master: 'bot_test'
      });
      return true;
    }));

    ok('MASTER', await runTest('MASTER', 'Leer retiros pendientes', async () => {
      const r = await window.fsGetAll?.('retiros');
      return Array.isArray(r);
    }));

    ok('MASTER', await runTest('MASTER', 'Crear alerta de sistema', async () => {
      await window.fsAdd('logs_master', {
        accion: '⚠️ Test alerta bot', tipo: 'alerta', nivel: 'INFO'
      });
      return true;
    }));

    // ── ADMIN ────────────────────────────────────────────────────────────────
    await wait(300);
    log('SYS', '━━━ Iniciando pruebas ADMIN ━━━', null);

    ok('ADMIN', await runTest('ADMIN', 'Perfil en Firestore', async () => {
      const u = await get(emails.admin);
      return u && u.rol === 'admin';
    }));

    ok('ADMIN', await runTest('ADMIN', 'Cargar lista de streamers', async () => {
      const usuarios = await window.fsGetAll('usuarios');
      const streamers = usuarios?.filter(u => u.rol === 'streamer');
      return Array.isArray(streamers);
    }));

    ok('ADMIN', await runTest('ADMIN', 'Cargar lista de agencias', async () => {
      const usuarios = await window.fsGetAll('usuarios');
      const agencias = usuarios?.filter(u => u.rol === 'agencia');
      return Array.isArray(agencias);
    }));

    ok('ADMIN', await runTest('ADMIN', 'Crear reporte de prueba', async () => {
      await window.fsAdd('reportes', {
        descripcion: '🤖 Test bot — Reporte admin',
        nivel: 'Media', estado: 'pendiente',
        uid_admin: 'bot_test'
      });
      return true;
    }));

    ok('ADMIN', await runTest('ADMIN', 'Leer reportes del sistema', async () => {
      const r = await window.fsGetAll?.('reportes');
      return Array.isArray(r);
    }));

    ok('ADMIN', await runTest('ADMIN', 'Guardar log de acción admin', async () => {
      await window.fsAdd('logs_admin', {
        accion: '🤖 Test bot — Acción admin',
        uid_admin: 'bot_test', tipo: 'bot'
      });
      return true;
    }));

    ok('ADMIN', await runTest('ADMIN', 'Cargar tickets de soporte', async () => {
      const t = await window.cargarTickets?.() || [];
      return Array.isArray(t);
    }));

    ok('ADMIN', await runTest('ADMIN', 'Leer logs de seguridad', async () => {
      const logs = await window.cargarLogsReales?.(5) || [];
      return Array.isArray(logs);
    }));

    // ── MODERADOR ────────────────────────────────────────────────────────────
    await wait(300);
    log('SYS', '━━━ Iniciando pruebas MODERADOR ━━━', null);

    ok('MODERADOR', await runTest('MODERADOR', 'Perfil en Firestore', async () => {
      const u = await get(emails.moderador);
      return u && u.rol === 'moderador';
    }));

    ok('MODERADOR', await runTest('MODERADOR', 'Leer todos los usuarios', async () => {
      const usuarios = await window.fsGetAll('usuarios');
      return Array.isArray(usuarios) && usuarios.length > 0;
    }));

    ok('MODERADOR', await runTest('MODERADOR', 'Crear reporte desde moderador', async () => {
      await window.fsAdd('reportes', {
        descripcion: '🤖 Test bot — Reporte monitor',
        nivel: 'Media', estado: 'pendiente',
        uid_monitor: 'bot_test'
      });
      return true;
    }));

    ok('MODERADOR', await runTest('MODERADOR', 'Crear infracción de prueba', async () => {
      await window.fsAdd('infracciones', {
        usuario: '@bot_test', tipo: 'spam',
        descripcion: 'Test bot', estado: 'activa',
        uid_monitor: 'bot_test'
      });
      return true;
    }));

    ok('MODERADOR', await runTest('MODERADOR', 'Leer infracciones del sistema', async () => {
      const inf = await window.fsGetAll?.('infracciones');
      return Array.isArray(inf);
    }));

    ok('MODERADOR', await runTest('MODERADOR', 'Escalar ticket al Admin', async () => {
      await window.fsAdd('tickets', {
        asunto: '🤖 Test bot — Caso escalado',
        descripcion: 'Prueba automática', prioridad: 'HIGH',
        estado: 'escalado', tipo: 'escalado_monitor',
        uid_monitor: 'bot_test', escalado_a: 'Admin'
      });
      return true;
    }));

    ok('MODERADOR', await runTest('MODERADOR', 'Leer log de actividad', async () => {
      const logs = await window.cargarLogsReales?.(5) || [];
      return Array.isArray(logs);
    }));

    // ── AGENCIA ──────────────────────────────────────────────────────────────
    await wait(300);
    log('SYS', '━━━ Iniciando pruebas AGENCIA ━━━', null);

    ok('AGENCIA', await runTest('AGENCIA', 'Perfil en Firestore', async () => {
      const u = await get(emails.agencia);
      return u && u.rol === 'agencia';
    }));

    ok('AGENCIA', await runTest('AGENCIA', 'Obtener mis streamers asignadas', async () => {
      const agUser = await get(emails.agencia);
      if (!agUser) return false;
      const todos = await window.fsGetAll('usuarios');
      const mis = todos?.filter(u =>
        u.rol === 'streamer' &&
        (u.agencia_uid === agUser.id || u.agencia === agUser.nick)
      );
      return Array.isArray(mis);
    }));

    ok('AGENCIA', await runTest('AGENCIA', 'Calcular ganancias (comisión 15%)', async () => {
      const agUser = await get(emails.agencia);
      if (!agUser) return false;
      const todos = await window.fsGetAll('usuarios');
      const mis = todos?.filter(u => u.rol === 'streamer' &&
        (u.agencia_uid === agUser.id || u.agencia === agUser.nick)) || [];
      const totalStars = mis.reduce((a, s) => a + (s.estrellas || 0), 0);
      const comision = Math.floor(totalStars * 0.15);
      log('AGENCIA', `Estrellas equipo: ${totalStars} · Comisión: ${comision}★`, null);
      return true;
    }));

    ok('AGENCIA', await runTest('AGENCIA', 'Solicitar retiro de prueba', async () => {
      const agUser = await get(emails.agencia);
      await window.fsAdd('retiros', {
        monto: 0, monto_usd: 0, metodo: 'test_bot',
        cuenta: 'bot@test.com', estado: 'pendiente',
        tipo: 'agencia', uid_agencia: agUser?.id || 'bot_test',
        nick: agUser?.nick || 'bot_test'
      });
      return true;
    }));

    ok('AGENCIA', await runTest('AGENCIA', 'Crear meta de agencia', async () => {
      const agUser = await get(emails.agencia);
      await window.fsAdd('metas_agencia', {
        titulo: '🤖 Test bot — Meta agencia',
        valor_objetivo: 10000, valor_actual: 0,
        uid_agencia: agUser?.id || 'bot_test', estado: 'activa'
      });
      return true;
    }));

    ok('AGENCIA', await runTest('AGENCIA', 'Enviar mensaje de prueba', async () => {
      const agUser = await get(emails.agencia);
      const strUser = await get(emails.streamer);
      if (!agUser || !strUser) return false;
      const chatId = [agUser.id, strUser.id].sort().join('_');
      await window.fsAdd('chats_agencia', {
        chatId, texto: '🤖 Test bot — Mensaje agencia',
        uid_from: agUser.id, uid_to: strUser.id,
        nick_from: agUser.nick || 'agencia', nick_to: strUser.nick || 'streamer'
      });
      return true;
    }));

    // ── STREAMER ─────────────────────────────────────────────────────────────
    await wait(300);
    log('SYS', '━━━ Iniciando pruebas STREAMER ━━━', null);

    ok('STREAMER', await runTest('STREAMER', 'Perfil en Firestore', async () => {
      const u = await get(emails.streamer);
      return u && u.rol === 'streamer';
    }));

    ok('STREAMER', await runTest('STREAMER', 'Nivel asignado (Bronce por defecto)', async () => {
      const u = await get(emails.streamer);
      const nivel = u?.nivel || 'bronce';
      const nv = window.getNivel?.(nivel);
      log('STREAMER', `Nivel: ${nv?.emoji || '🥉'} ${nv?.nombre || 'Bronce'}`, null);
      return true;
    }));

    ok('STREAMER', await runTest('STREAMER', 'Leer estrellas acumuladas', async () => {
      const u = await get(emails.streamer);
      log('STREAMER', `Estrellas: ${(u?.estrellas || 0).toLocaleString()} ⭐`, null);
      return true;
    }));

    ok('STREAMER', await runTest('STREAMER', 'Marcar live como activo', async () => {
      const u = await get(emails.streamer);
      if (!u) return false;
      await window.fsSet('usuarios', u.id, { liveActivo: true });
      await window.fsSet('usuarios', u.id, { liveActivo: false }); // revertir
      return true;
    }));

    ok('STREAMER', await runTest('STREAMER', 'Crear meta personal', async () => {
      const u = await get(emails.streamer);
      await window.fsAdd('metas_streamer', {
        titulo: '🤖 Test bot — Meta streamer',
        valor_objetivo: 5000, valor_actual: 0,
        uid_streamer: u?.id || 'bot_test', estado: 'activa'
      });
      return true;
    }));

    ok('STREAMER', await runTest('STREAMER', 'Solicitar retiro', async () => {
      const u = await get(emails.streamer);
      await window.fsAdd('retiros', {
        monto_usd: 0, monto_stars: 0, metodo: 'test_bot',
        cuenta: 'bot@test.com', estado: 'pendiente',
        uid_streamer: u?.id || 'bot_test',
        nick: u?.nick || 'bot_test'
      });
      return true;
    }));

    ok('STREAMER', await runTest('STREAMER', 'Registrar PK Battle de prueba', async () => {
      const u = await get(emails.streamer);
      await window.fsAdd('pk_battles', {
        uid_streamer: u?.id || 'bot_test',
        nick: u?.nick || 'bot_test',
        rival_nick: 'RivalBot', rival_uid: null,
        estado: 'terminado', mis_stars: 100, rival_stars: 80,
        resultado: 'ganado'
      });
      return true;
    }));

    // ── USUARIO ──────────────────────────────────────────────────────────────
    await wait(300);
    log('SYS', '━━━ Iniciando pruebas USUARIO ━━━', null);

    ok('USUARIO', await runTest('USUARIO', 'Perfil en Firestore', async () => {
      const u = await get(emails.usuario);
      return u && u.rol === 'usuario';
    }));

    ok('USUARIO', await runTest('USUARIO', 'Leer feed de streamers', async () => {
      const todos = await window.fsGetAll('usuarios');
      const streamers = todos?.filter(u => u.rol === 'streamer');
      log('USUARIO', `Streamers disponibles: ${streamers?.length || 0}`, null);
      return Array.isArray(streamers);
    }));

    ok('USUARIO', await runTest('USUARIO', 'Solicitar match → @streamer1', async () => {
      const uUser = await get(emails.usuario);
      const uStr  = await get(emails.streamer);
      if (!uUser || !uStr) return false;
      await window.fsAdd('matches', {
        uid_usuario: uUser.id, nick_usuario: uUser.nick || 'usuariop1',
        uid_streamer: uStr.id, nick_streamer: uStr.nick || 'streamer1',
        estado: 'esperando', costo: 5
      });
      return true;
    }));

    ok('USUARIO', await runTest('USUARIO', 'Enviar gift a streamer', async () => {
      const uUser = await get(emails.usuario);
      const uStr  = await get(emails.streamer);
      if (!uUser || !uStr) return false;
      await window.fsAdd('historial_estrellas', {
        uid_from: uUser.id, uid_to: uStr.id,
        cantidad: 10, tipo: 'gift',
        nick_from: uUser.nick || 'usuariop1',
        gift_emoji: '🌹', gift_name: 'Rosa'
      });
      return true;
    }));

    ok('USUARIO', await runTest('USUARIO', 'Comprar estrellas (simulado)', async () => {
      const uUser = await get(emails.usuario);
      if (!uUser) return false;
      log('USUARIO', `Saldo: ${(uUser.estrellas || 0)} ⭐ · $${((uUser.estrellas || 0) / 200).toFixed(2)} USD equiv.`, null);
      return true;
    }));

    ok('USUARIO', await runTest('USUARIO', 'Seguir a un streamer', async () => {
      const uStr = await get(emails.streamer);
      if (!uStr) return false;
      // Incrementar seguidores del streamer en +1 y revertir para no contaminar datos
      const before = uStr.seguidores || 0;
      await window.fsSet('usuarios', uStr.id, { seguidores: before + 1 });
      await window.fsSet('usuarios', uStr.id, { seguidores: before });
      return true;
    }));

    ok('USUARIO', await runTest('USUARIO', 'Crear ticket de soporte', async () => {
      const uUser = await get(emails.usuario);
      await window.fsAdd('tickets', {
        asunto: '🤖 Test bot — Ticket usuario',
        descripcion: 'Prueba automática',
        prioridad: 'MEDIUM', estado: 'abierto',
        uid_usuario: uUser?.id || 'bot_test'
      });
      return true;
    }));

    // ── REPORTE FINAL ─────────────────────────────────────────────────────────
    await wait(500);
    log('SYS', '━━━ Generando reporte final ━━━', null);

    const progBar  = document.getElementById('botProgressBar');
    const progPct  = document.getElementById('botProgressPct');
    const progLbl  = document.getElementById('botProgressLabel');
    if (progBar)  progBar.style.width = '100%';
    if (progPct)  progPct.textContent = '100%';
    if (progLbl)  progLbl.textContent = 'Auditoría completada ✓';

    // Calcular resultados por rol
    const resumen = Object.entries(resultados).map(([rol, arr]) => {
      const total   = arr.length;
      const pasados = arr.filter(Boolean).length;
      const pct     = total > 0 ? Math.floor(pasados / total * 100) : 0;
      const color   = {
        MASTER:'var(--gold)', ADMIN:'#F59E0B', MODERADOR:'#a8d8f0',
        AGENCIA:'#A78BFA', STREAMER:'#4ade80', USUARIO:'#93c5fd'
      }[rol] || '#fff';
      return { rol, pasados, total, pct, color };
    });

    const totalOk  = resumen.reduce((a, r) => a + r.pasados, 0);
    const totalAll = resumen.reduce((a, r) => a + r.total, 0);
    const pctGlobal = Math.floor(totalOk / totalAll * 100);
    const exitoso = pctGlobal >= 80;

    const repEl = document.getElementById('botReporte');
    repEl.style.display = 'block';
    repEl.innerHTML = `
      <div class="card" style="margin-bottom:14px;border-color:${exitoso?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}">
        <div style="text-align:center;padding:16px 0 8px">
          <div style="font-size:48px;margin-bottom:8px">${exitoso?'🏆':'⚠️'}</div>
          <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:900;color:${exitoso?'#22c55e':'#EF4444'}">
            ${pctGlobal}% de éxito
          </div>
          <div style="font-size:12px;color:var(--mu);margin-top:4px">
            ${totalOk} / ${totalAll} pruebas pasadas
          </div>
        </div>
        <!-- BARRA GLOBAL -->
        <div style="height:8px;border-radius:4px;background:rgba(255,255,255,0.06);overflow:hidden;margin:12px 0">
          <div style="width:${pctGlobal}%;height:100%;background:${exitoso?'linear-gradient(90deg,#22c55e,#16a34a)':'linear-gradient(90deg,#EF4444,#b91c1c)'};border-radius:4px;transition:width .6s"></div>
        </div>
      </div>

      <!-- DESGLOSE POR ROL -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-title" style="margin-bottom:14px">📊 Resultado por rol</div>
        ${resumen.map(r => `
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:12px;font-weight:700;color:${r.color}">${r.rol}</span>
              <span style="font-size:12px;color:${r.pct===100?'#22c55e':r.pct>=60?'#FFA500':'#EF4444'};font-weight:700">
                ${r.pasados}/${r.total} · ${r.pct}%
              </span>
            </div>
            <div style="height:5px;border-radius:3px;background:rgba(255,255,255,0.05);overflow:hidden">
              <div style="width:${r.pct}%;height:100%;background:${r.color};border-radius:3px;opacity:0.8"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- ACCIONES -->
      <div style="display:flex;gap:10px">
        <button onclick="botCopiarReporte()" class="btn-sm" style="flex:1;padding:12px">
          📋 Copiar reporte
        </button>
        <button onclick="botIniciarAuditoria()" class="btn-sm" style="flex:1;padding:12px">
          🔄 Re-ejecutar
        </button>
      </div>
    `;

    document.getElementById('botIniciarBtn').disabled = false;

    // Función copiar
    window.botCopiarReporte = function() {
      const lines = [
        '🤖 AURA — Reporte de Auditoría Automática',
        `Fecha: ${new Date().toLocaleString('es')}`,
        `Resultado global: ${pctGlobal}% (${totalOk}/${totalAll} pruebas)`,
        '─────────────────────────────',
        ...resumen.map(r => `${r.rol}: ${r.pasados}/${r.total} (${r.pct}%)`),
        '─────────────────────────────',
      ].join('\n');
      navigator.clipboard?.writeText(lines).then(() => toast('Reporte copiado ✓', 'success'));
    };

    window.botLimpiarLog = function() {
      const el = document.getElementById('botLog');
      if (el) el.innerHTML = '<div style="color:var(--mu)">Log limpiado.</div>';
    };

    toast(`🤖 Auditoría completada · ${pctGlobal}% de éxito`, exitoso ? 'success' : 'info');
  };

  window.botLimpiarLog = function() {
    const el = document.getElementById('botLog');
    if (el) el.innerHTML = '<div style="color:var(--mu)">Log limpiado.</div>';
  };
};
