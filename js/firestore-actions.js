// js/firestore-actions.js — Acciones reales usando helpers de firebase.js

// ── ESTADÍSTICAS REALES ───────────────────
window.cargarStatsReales = async function() {
  try {
    const usuarios = await window.fsGetAll('usuarios');
    return {
      usuarios: usuarios.length,
      streamers: usuarios.filter(u => u.rol === 'streamer').length,
      agencias: usuarios.filter(u => u.rol === 'agencia').length,
      admins: usuarios.filter(u => ['admin','moderador'].includes(u.rol)).length,
      pendientes: usuarios.filter(u => u.estado === 'pendiente').length,
      suspendidos: usuarios.filter(u => u.estado === 'suspendido').length,
    };
  } catch(e) { return { usuarios:0, streamers:0, agencias:0, admins:0, pendientes:0, suspendidos:0 }; }
};

window.cargarUsuariosReales = async function() {
  try { return await window.fsGetAll('usuarios'); }
  catch(e) { return []; }
};

// ── GESTIONAR USUARIO ─────────────────────
window.masterGestionarUsuario = async function(uid, accion) {
  try {
    const estado = accion === 'suspender' ? 'suspendido' : 'activo';
    await window.fsSet('usuarios', uid, { estado });
    await window.fsAdd('logs_master', {
      accion: `Usuario ${accion}do`, uid_objetivo: uid,
      uid_master: window._currentUser?.uid, tipo: 'usuario'
    });
    toast(`Usuario ${accion}do ✓`, 'success');
    navigate('streamers');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

window.masterAprobarStreamer = async function(uid) {
  try {
    await window.fsSet('usuarios', uid, { estado: 'activo' });
    await window.fsAdd('logs_master', {
      accion: 'Streamer aprobada', uid_objetivo: uid,
      uid_master: window._currentUser?.uid, tipo: 'streamer'
    });
    toast('Streamer aprobada ✓', 'success');
    navigate('streamers');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

window.masterCambiarRol = async function(uid, nuevoRol) {
  if (!nuevoRol) return;
  try {
    await window.fsSet('usuarios', uid, { rol: nuevoRol });
    await window.fsAdd('logs_master', {
      accion: `Rol cambiado a ${nuevoRol}`, uid_objetivo: uid,
      uid_master: window._currentUser?.uid, tipo: 'rol'
    });
    toast(`Rol cambiado a ${nuevoRol} ✓`, 'success');
    navigate('streamers');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

window.masterCrearAdmin = async function() {
  const email = prompt('Email del nuevo admin:');
  if (!email) return;
  try {
    const usuarios = await window.fsGetAll('usuarios');
    const user = usuarios.find(u => u.email === email);
    if (!user) { toast('Usuario no encontrado. Debe registrarse primero.', 'error'); return; }
    await window.fsSet('usuarios', user.id, { rol: 'admin' });
    await window.fsAdd('logs_master', {
      accion: `Nuevo admin: ${email}`, uid_master: window._currentUser?.uid, tipo: 'admin'
    });
    toast(`✓ ${email} es ahora Admin`, 'success');
    navigate('admins');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

// ── TICKETS ───────────────────────────────
window.cargarTickets = async function() {
  try { return await window.fsGetAll('tickets'); }
  catch(e) { return []; }
};

window.crearTicket = async function(datos) {
  try {
    await window.fsAdd('tickets', { ...datos, estado: 'abierto', uid: window._currentUser?.uid });
    toast('Ticket creado ✓', 'success');
  } catch(e) { toast('Error', 'error'); }
};

window.resolverTicket = async function(ticketId) {
  try {
    await window.fsSet('tickets', ticketId, { estado: 'resuelto' });
    toast('Ticket resuelto ✓', 'success');
  } catch(e) { toast('Error', 'error'); }
};

// ── ALERTAS ───────────────────────────────
window.crearAlerta = async function(tipo, mensaje, nivel) {
  try {
    await window.fsAdd('alertas', { tipo, mensaje, nivel, resuelta: false });
  } catch(e) { console.error(e); }
};

window.resolverAlerta = async function(id) {
  try {
    await window.fsSet('alertas', id, { resuelta: true });
    toast('Alerta resuelta ✓', 'success');
  } catch(e) { toast('Error', 'error'); }
};

// ── BLOQUEOS IP ───────────────────────────
window.bloquearIP = async function(ip, motivo) {
  try {
    const id = ip.replace(/\./g, '_');
    await window.fsSet('bloqueos_ip', id, {
      ip, motivo, bloqueadoPor: window._currentUser?.uid, activo: true
    });
    toast(`IP ${ip} bloqueada ✓`, 'success');
  } catch(e) { toast('Error', 'error'); }
};

// ── LOGS ──────────────────────────────────
window.cargarLogsReales = async function(limite) {
  try { return await window.fsLogsRecientes('logs_master', limite || 20); }
  catch(e) { return []; }
};

// ── CONTROL PLATAFORMA ────────────────────
window.masterControl = async function(accion) {
  const labels = {
    mantenimiento:'Modo mantenimiento', registros:'Registros bloqueados',
    lives:'Lives pausados', payouts:'Payouts pausados',
    stars:'Recargas bloqueadas', chat:'Chat silenciado',
    workers:'Workers reiniciados', cache:'Caché purgado',
    deploy:'Deploy forzado', killswitch:'🚨 Kill switch activado',
  };
  try {
    await window.fsSet('config_plataforma', 'global', { [accion]: true });
    await window.fsAdd('logs_master', {
      accion: labels[accion] || accion,
      uid_master: window._currentUser?.uid, tipo: 'control'
    });
    toast(labels[accion] || 'Acción ejecutada ✓', 'success');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

console.log('✅ Firestore Actions listo');
