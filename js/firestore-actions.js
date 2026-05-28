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


// ── FLUJO CENTRAL DE ESTRELLAS ─────────────────────────────────────────────
// Todas las transacciones de estrellas pasan por aquí

window.transferirEstrellas = async function({ de, para, cantidad, concepto, tipo }) {
  if (!de || !para || !cantidad || cantidad <= 0) return;
  try {
    // 1. Verificar saldo del emisor
    const emisor = await window.fsGet('usuarios', de);
    if (!emisor) throw new Error('Emisor no encontrado');
    if ((emisor.estrellas||0) < cantidad) throw new Error('Saldo insuficiente');

    // 2. Cargar tarifas para calcular comisiones
    const tarifas = await window.fsGet('config_plataforma', 'tarifas').catch(()=>null);
    const pctStreamer = tarifas?.comision_streamer || 85;
    const pctAgencia = tarifas?.comision_agencia || 15;

    // 3. Descontar al emisor
    await window.fsSet('usuarios', de, {
      estrellas: Math.max(0, (emisor.estrellas||0) - cantidad),
      gifts_enviados: (emisor.gifts_enviados||0) + 1
    });

    // 4. Acreditar al receptor (streamer)
    const receptor = await window.fsGet('usuarios', para).catch(()=>null);
    if (receptor) {
      const esCon_agencia = receptor.agencia_uid;
      let paraStreamer = cantidad;
      let paraAgencia = 0;

      if (esCon_agencia) {
        paraStreamer = Math.floor(cantidad * pctStreamer / 100);
        paraAgencia = Math.floor(cantidad * pctAgencia / 100);
        // Acreditar agencia
        const agencia = await window.fsGet('usuarios', esCon_agencia).catch(()=>null);
        if (agencia) {
          await window.fsSet('usuarios', esCon_agencia, {
            estrellas: (agencia.estrellas||0) + paraAgencia
          });
        }
      }

      await window.fsSet('usuarios', para, {
        estrellas: (receptor.estrellas||0) + paraStreamer
      });
    }

    // 5. Registrar transacción en historial
    await window.fsAdd('historial_estrellas', {
      uid_from: de, uid_to: para,
      cantidad, concepto, tipo,
      nick_from: emisor.nick||emisor.nombre,
      estado: 'completado'
    });

    return true;
  } catch(e) {
    console.error('transferirEstrellas error:', e);
    throw e;
  }
};

// Cargar tarifas globales (cachear en memoria)
window.cargarTarifas = async function() {
  if (window._tarifasCache) return window._tarifasCache;
  try {
    const t = await window.fsGet('config_plataforma', 'tarifas');
    window._tarifasCache = t || {
      mensaje: 2, llamada: 6, videollamada: 10, match: 5,
      foto: 15, video_premium: 30, audio: 3,
      comision_streamer: 85, comision_agencia: 15
    };
    return window._tarifasCache;
  } catch(e) {
    return { mensaje:2, llamada:6, videollamada:10, match:5, foto:15, video_premium:30, audio:3, comision_streamer:85, comision_agencia:15 };
  }
};

// Estadísticas de economía para Master/Admin
window.cargarEstadisticasEconomia = async function() {
  try {
    const [usuarios, historial] = await Promise.all([
      window.fsGetAll('usuarios'),
      window.fsGetAll('historial_estrellas').catch(()=>[])
    ]);

    const streamers = usuarios.filter(u => u.rol === 'streamer');
    const usrs = usuarios.filter(u => u.rol === 'usuario');
    const agencias = usuarios.filter(u => u.rol === 'agencia');

    const totalEstrellas = usuarios.reduce((a,u) => a+(u.estrellas||0), 0);
    const estrellasStreamers = streamers.reduce((a,s) => a+(s.estrellas||0), 0);
    const estrellasUsuarios = usrs.reduce((a,u) => a+(u.estrellas||0), 0);
    const transacciones = historial?.length || 0;
    const volumen = historial?.reduce((a,h) => a+(h.cantidad||0), 0) || 0;

    return {
      totalEstrellas, estrellasStreamers, estrellasUsuarios,
      transacciones, volumen,
      topStreamers: streamers.sort((a,b)=>(b.estrellas||0)-(a.estrellas||0)).slice(0,5),
      topUsuarios: usrs.sort((a,b)=>(b.gifts_enviados||0)-(a.gifts_enviados||0)).slice(0,5)
    };
  } catch(e) {
    return { totalEstrellas:0, estrellasStreamers:0, estrellasUsuarios:0, transacciones:0, volumen:0, topStreamers:[], topUsuarios:[] };
  }
};

// Reiniciar metas semanales (se llama automáticamente los lunes)
window.verificarReinicioMetas = async function() {
  const ahora = new Date();
  if (ahora.getDay() !== 1) return; // Solo lunes

  const ultimoReinicio = localStorage.getItem('aura_metas_reinicio');
  const hoyStr = ahora.toDateString();
  if (ultimoReinicio === hoyStr) return; // Ya se reinició hoy

  try {
    const metas = await window.fsGetAll('metas_semanales');
    const activas = metas?.filter(m => m.estado === 'activa') || [];
    for (const meta of activas) {
      // Reiniciar progreso de todas las streamers
      const streamers = await window.fsGetAll('usuarios');
      const misStreamers = streamers.filter(u => u.rol === 'streamer');
      for (const s of misStreamers) {
        await window.fsSet('metas_streamer', `${meta.id}_${s.id}`, {
          meta_id: meta.id, uid_streamer: s.id,
          valor_actual: 0, completada: false
        }).catch(()=>{});
      }
    }
    localStorage.setItem('aura_metas_reinicio', hoyStr);
    console.log('✅ Metas semanales reiniciadas');
  } catch(e) { console.error('Error reiniciando metas:', e); }
};

// Ejecutar verificación de metas al cargar
window.verificarReinicioMetas?.();

console.log('✅ Firestore Actions listo');
