// js/auditoria.js — Auditoría automática de todos los roles y botones
// CORREGIDO: window.aura_mostrarPruebas ELIMINADA de aquí (la define test_sistema.js)

window.AURA_AUDITORIA = {

  resultados: [],

  async ejecutar() {
    this.resultados = [];
    console.log('🔍 Iniciando auditoría completa de AURA...');

    const r = this.resultados;
    const check = (grupo, boton, ok, detalle, fix) => {
      r.push({ rol: grupo, boton, ok: !!ok, detalle: detalle || '', fix: fix || '' });
    };
    this.check = check;

    // ── CORE ───────────────────────────────────────────────────────────────
    check('CORE', 'Firebase inicializado',       typeof window._db   === 'object',   null, 'Verificar firebase.js');
    check('CORE', 'Auth inicializado',            typeof window._auth === 'object',   null, 'Verificar firebase.js');
    check('CORE', 'Helper fsGet disponible',      typeof window.fsGet === 'function', null, 'Verificar firebase.js');
    check('CORE', 'Helper fsSet disponible',      typeof window.fsSet === 'function', null, 'Verificar firebase.js');
    check('CORE', 'Helper fsAdd disponible',      typeof window.fsAdd === 'function', null, 'Verificar firebase.js');
    check('CORE', 'Helper fsGetAll disponible',   typeof window.fsGetAll === 'function', null, 'Verificar firebase.js');
    check('CORE', 'navigate() disponible',        typeof window.navigate === 'function', null, 'Verificar app.js');
    check('CORE', 'renderSidebar() disponible',   typeof window.renderSidebar === 'function', null, 'Verificar app.js');
    check('CORE', 'renderStats() disponible',     typeof window.renderStats === 'function', null, 'Verificar app.js');
    check('CORE', 'renderActions() disponible',   typeof window.renderActions === 'function', null, 'Verificar app.js');
    check('CORE', 'toast() disponible',           typeof window.toast === 'function', null, 'Verificar app.js / index.html');
    check('CORE', 'showLoader() disponible',      typeof window.showLoader === 'function', null, 'Verificar index.html');

    // ── MASTER ─────────────────────────────────────────────────────────────
    check('MASTER', 'render_master()',            typeof window.render_master === 'function', null, 'Verificar master.js');
    check('MASTER', 'masterEditarUsuario()',       typeof window.masterEditarUsuario === 'function', null, 'Verificar master.js');
    check('MASTER', 'masterGuardarEdicion()',      typeof window.masterGuardarEdicion === 'function', null, 'Verificar master.js');
    check('MASTER', 'masterFiltrarUsers()',        typeof window.masterFiltrarUsers === 'function', null, 'Verificar master.js');
    check('MASTER', 'masterAprobarStreamer()',     typeof window.masterAprobarStreamer === 'function', null, 'Verificar firestore-actions.js');
    check('MASTER', 'masterGestionarUsuario()',    typeof window.masterGestionarUsuario === 'function', null, 'Verificar firestore-actions.js');
    check('MASTER', 'masterCambiarRol()',          typeof window.masterCambiarRol === 'function', null, 'Verificar firestore-actions.js');
    check('MASTER', 'masterCrearAdmin()',          typeof window.masterCrearAdmin === 'function', null, 'Verificar firestore-actions.js');
    check('MASTER', 'masterControl()',             typeof window.masterControl === 'function', null, 'Verificar firestore-actions.js');
    check('MASTER', 'masterAsignarAgencia()',      typeof window.masterAsignarAgencia === 'function', null, 'FALTA DEFINIR en master.js');

    // ── ADMIN ──────────────────────────────────────────────────────────────
    check('ADMIN', 'render_admin()',              typeof window.render_admin === 'function', null, 'Verificar admin.js');
    check('ADMIN', 'adminAprobar()',              typeof window.adminAprobar === 'function', null, 'Verificar admin.js');
    check('ADMIN', 'adminRechazar()',             typeof window.adminRechazar === 'function', null, 'Verificar admin.js');
    check('ADMIN', 'adminSuspender()',            typeof window.adminSuspender === 'function', null, 'Verificar admin.js');
    check('ADMIN', 'adminVerPerfil()',            typeof window.adminVerPerfil === 'function', null, 'Verificar admin.js');

    // ── MODERADOR ──────────────────────────────────────────────────────────
    check('MODERADOR', 'render_moderador()',      typeof window.render_moderador === 'function', null, 'Verificar moderador.js');

    // ── AGENCIA ────────────────────────────────────────────────────────────
    check('AGENCIA', 'render_agencia()',          typeof window.render_agencia === 'function', null, 'Verificar agencia.js');
    check('AGENCIA', 'agGenerarLink()',           typeof window.agGenerarLink === 'function', null, 'FALTA DEFINIR en agencia.js');

    // ── STREAMER ───────────────────────────────────────────────────────────
    check('STREAMER', 'render_streamer()',         typeof window.render_streamer === 'function', null, 'Verificar streamer.js');
    check('STREAMER', 'str_iniciarLive()',         typeof window.str_iniciarLive === 'function', null, 'Verificar streamer.js');
    check('STREAMER', 'str_terminarLive()',        typeof window.str_terminarLive === 'function', null, 'Verificar streamer.js');
    check('STREAMER', 'strLanzarPK()',             typeof window.strLanzarPK === 'function', null, 'Verificar streamer.js');
    check('STREAMER', 'strMicRoom() / strCamRoom()', typeof window.strMicRoom === 'function', null, 'FALTA strMicRoom y strCamRoom en streamer.js');

    // ── USUARIO ────────────────────────────────────────────────────────────
    check('USUARIO', 'render_usuario()',           typeof window.render_usuario === 'function', null, 'Verificar usuario.js');
    check('USUARIO', 'usr_verLive()',              typeof window.usr_verLive === 'function', null, 'Verificar usuario.js');
    check('USUARIO', 'usrEnviarGiftLive()',        typeof window.usrEnviarGiftLive === 'function', null, 'Verificar usuario.js');

    // ── FLUJO ⭐ ────────────────────────────────────────────────────────────
    check('FLUJO ⭐', 'transferirEstrellas()',     typeof window.transferirEstrellas === 'function', null, 'Verificar firestore-actions.js');
    check('FLUJO ⭐', 'transferirConNivel()',      typeof window.transferirConNivel === 'function', null, 'Verificar niveles.js');
    check('FLUJO ⭐', 'AURA_NIVELES definido',     typeof window.AURA_NIVELES === 'object', null, 'Verificar niveles.js');
    check('FLUJO ⭐', 'calcularDistribucion()',    typeof window.calcularDistribucion === 'function', null, 'Verificar niveles.js');
    check('FLUJO ⭐', 'evaluarNivelStreamer()',     typeof window.evaluarNivelStreamer === 'function', null, 'Verificar niveles.js');
    check('FLUJO ⭐', 'Bot de pruebas (test_sistema)', typeof window.aura_mostrarPruebas === 'function', null, 'Verificar test_sistema.js');

    console.log(`✅ Auditoría completada: ${r.filter(x=>x.ok).length}/${r.length}`);
    return r;
  }
};

// Auto-ejecutar auditoría al cargar (para que esté lista cuando la pidan)
window.AURA_AUDITORIA.ejecutar().then(r => {
  const ok = r.filter(x=>x.ok).length;
  const total = r.length;
  console.log(`🔍 AURA Auditoría: ${ok}/${total} (${Math.floor(ok/total*100)}%)`);
});

console.log('✅ Sistema de auditoría AURA cargado');
