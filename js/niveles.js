// js/niveles.js — Sistema de niveles y comisiones de AURA

window.AURA_NIVELES = {
  bronce:   { id:'bronce',   nombre:'Bronce',   emoji:'🥉', streamer:20, agencia:10, master:70, orden:1 },
  plata:    { id:'plata',    nombre:'Plata',    emoji:'🥈', streamer:27, agencia:13, master:60, orden:2 },
  oro:      { id:'oro',      nombre:'Oro',      emoji:'🥇', streamer:33, agencia:17, master:50, orden:3 },
  diamante: { id:'diamante', nombre:'Diamante', emoji:'💎', streamer:35, agencia:20, master:45, orden:4 },
};

// Obtener nivel de una streamer
window.getNivel = function(nivel_id) {
  return window.AURA_NIVELES[nivel_id] || window.AURA_NIVELES.bronce;
};

// Calcular distribución de estrellas según nivel
window.calcularDistribucion = function(estrellas, nivel_id) {
  const nivel = window.getNivel(nivel_id);
  return {
    streamer: Math.floor(estrellas * nivel.streamer / 100),
    agencia:  Math.floor(estrellas * nivel.agencia  / 100),
    master:   Math.floor(estrellas * nivel.master   / 100),
    nivel:    nivel
  };
};

// Subir nivel
window.subirNivel = function(nivel_actual) {
  const orden = window.getNivel(nivel_actual).orden;
  const siguiente = Object.values(window.AURA_NIVELES).find(n => n.orden === orden + 1);
  return siguiente?.id || 'diamante';
};

// Bajar nivel
window.bajarNivel = function(nivel_actual) {
  const orden = window.getNivel(nivel_actual).orden;
  const anterior = Object.values(window.AURA_NIVELES).find(n => n.orden === orden - 1);
  return anterior?.id || 'bronce';
};

// Transferencia real con niveles y comisiones
window.transferirConNivel = async function({ de, para, cantidad, concepto, tipo }) {
  if (!de || !para || !cantidad || cantidad <= 0) return;
  try {
    const emisor = await window.fsGet('usuarios', de);
    if (!emisor) throw new Error('Emisor no encontrado');
    if ((emisor.estrellas||0) < cantidad) throw new Error('Saldo insuficiente');

    const receptor = await window.fsGet('usuarios', para);
    if (!receptor) throw new Error('Receptor no encontrado');

    // Calcular distribución según nivel de la streamer
    const dist = window.calcularDistribucion(cantidad, receptor.nivel || 'bronce');

    // 1. Descontar al emisor
    await window.fsSet('usuarios', de, {
      estrellas: Math.max(0, (emisor.estrellas||0) - cantidad),
      gifts_enviados: (emisor.gifts_enviados||0) + 1
    });

    // 2. Acreditar a la streamer
    await window.fsSet('usuarios', para, {
      estrellas: (receptor.estrellas||0) + dist.streamer,
      estrellas_brutas: (receptor.estrellas_brutas||0) + cantidad
    });

    // 3. Acreditar a la agencia si tiene
    if (receptor.agencia_uid) {
      const agencia = await window.fsGet('usuarios', receptor.agencia_uid).catch(()=>null);
      if (agencia) {
        await window.fsSet('usuarios', receptor.agencia_uid, {
          estrellas: (agencia.estrellas||0) + dist.agencia
        });
      }
    }

    // 4. Las estrellas del Master van a config_plataforma/cartera
    const cartera = await window.fsGet('config_plataforma', 'cartera').catch(()=>null);
    await window.fsSet('config_plataforma', 'cartera', {
      total_estrellas: ((cartera?.total_estrellas||0) + dist.master),
      total_usd: ((cartera?.total_usd||0) + dist.master * 0.005) // 200★ = $1
    });

    // 5. Registrar transacción
    await window.fsAdd('historial_estrellas', {
      uid_from: de, uid_to: para,
      cantidad, concepto, tipo,
      nick_from: emisor.nick||emisor.nombre,
      nick_to: receptor.nick||receptor.nombre,
      dist_streamer: dist.streamer,
      dist_agencia: dist.agencia,
      dist_master: dist.master,
      nivel: receptor.nivel || 'bronce',
      estado: 'completado'
    });

    return dist;
  } catch(e) {
    console.error('transferirConNivel error:', e);
    throw e;
  }
};

// Evaluar nivel al final de semana (llamar cada lunes)
window.evaluarNivelStreamer = async function(uid_streamer, cumplioMeta) {
  try {
    const perfil = await window.fsGet('usuarios', uid_streamer);
    if (!perfil || perfil.rol !== 'streamer') return;

    const nivelActual = perfil.nivel || 'bronce';
    const nuevoNivel = cumplioMeta
      ? window.subirNivel(nivelActual)
      : window.bajarNivel(nivelActual);

    if (nivelActual !== nuevoNivel) {
      await window.fsSet('usuarios', uid_streamer, { nivel: nuevoNivel });
      await window.fsAdd('logs_master', {
        accion: `Nivel ${cumplioMeta?'subido':'bajado'}: @${perfil.nick} ${nivelActual} → ${nuevoNivel}`,
        uid_streamer, tipo: 'nivel'
      });
    }

    // Verificar modo prueba
    if (perfil.modo_prueba) {
      const semanasPrueba = (perfil.semanas_prueba || 0) + 1;
      if (!cumplioMeta && semanasPrueba >= 2) {
        // Perder estrellas
        await window.fsSet('usuarios', uid_streamer, {
          estrellas: 0,
          modo_prueba: false,
          semanas_prueba: 0,
          estado: 'suspendido'
        });
        await window.fsAdd('logs_master', {
          accion: `Modo prueba fallido: @${perfil.nick} perdió sus estrellas`,
          uid_streamer, tipo: 'prueba'
        });
      } else {
        await window.fsSet('usuarios', uid_streamer, {
          semanas_prueba: cumplioMeta ? 0 : semanasPrueba
        });
      }
    }

    return nuevoNivel;
  } catch(e) { console.error(e); }
};

console.log('✅ Sistema de niveles AURA cargado');
