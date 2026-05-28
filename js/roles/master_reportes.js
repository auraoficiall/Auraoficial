// js/roles/master_reportes.js — Reportes y contabilidad del Master

window.render_master_reportes = async function(el, p) {
  el.innerHTML = `
    <div class="dash-welcome aura-fade-up">
      <h1>📊 <span>Contabilidad</span></h1>
      <p>Reportes financieros de la plataforma AURA</p>
    </div>

    <!-- FILTROS DE FECHA -->
    <div class="card" style="margin-bottom:16px">
      <div class="section-title" style="margin-bottom:14px">📅 Rango de fechas</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div>
          <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Desde</div>
          <input type="date" id="repDesde" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#fff;font-size:13px;outline:none;box-sizing:border-box">
        </div>
        <div>
          <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Hasta</div>
          <input type="date" id="repHasta" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:#fff;font-size:13px;outline:none;box-sizing:border-box">
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
        ${[
          {l:'Hoy',d:0},{l:'7 días',d:7},{l:'15 días',d:15},{l:'30 días',d:30},{l:'Todo',d:365}
        ].map(r=>`
          <button onclick="repSetRango(${r.d})" style="padding:7px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);font-size:12px;cursor:pointer">${r.l}</button>
        `).join('')}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
        <div style="font-size:12px;color:var(--mu);align-self:center">Ver:</div>
        ${[
          {id:'repFiltroTodos',l:'Todos',v:true},
          {id:'repFiltroStreamers',l:'Solo streamers',v:false},
          {id:'repFiltroAgencias',l:'Solo agencias',v:false},
        ].map((f,i)=>`
          <button id="${f.id}" onclick="repSetFiltro('${f.id}')" style="padding:7px 14px;border-radius:20px;background:${i===0?'rgba(212,175,55,0.1)':'rgba(255,255,255,0.04)'};border:1px solid ${i===0?'rgba(212,175,55,0.4)':'rgba(255,255,255,0.08)'};color:${i===0?'var(--gold)':'rgba(255,255,255,0.7)'};font-size:12px;cursor:pointer">${f.l}</button>
        `).join('')}
      </div>
      <button onclick="repGenerar()" class="btn-primary" style="width:100%;padding:14px">
        🔍 Generar reporte
      </button>
    </div>

    <!-- RESULTADO -->
    <div id="repResultado"></div>
  `;

  // Establecer fechas por defecto (últimos 30 días)
  repSetRango(30);

  window.repSetRango = function(dias) {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    document.getElementById('repDesde').value = desde.toISOString().split('T')[0];
    document.getElementById('repHasta').value = hasta.toISOString().split('T')[0];
  };

  window.repSetFiltro = function(id) {
    ['repFiltroTodos','repFiltroStreamers','repFiltroAgencias'].forEach(f => {
      const btn = document.getElementById(f);
      if (!btn) return;
      const active = f === id;
      btn.style.background = active?'rgba(212,175,55,0.1)':'rgba(255,255,255,0.04)';
      btn.style.borderColor = active?'rgba(212,175,55,0.4)':'rgba(255,255,255,0.08)';
      btn.style.color = active?'var(--gold)':'rgba(255,255,255,0.7)';
    });
    window._repFiltroActual = id;
  };
  window._repFiltroActual = 'repFiltroTodos';

  window.repGenerar = async function() {
    const desdeStr = document.getElementById('repDesde')?.value;
    const hastaStr = document.getElementById('repHasta')?.value;
    if (!desdeStr || !hastaStr) { toast('Selecciona el rango de fechas','error'); return; }

    const desde = new Date(desdeStr + 'T00:00:00');
    const hasta = new Date(hastaStr + 'T23:59:59');
    const filtro = window._repFiltroActual || 'repFiltroTodos';

    const cont = document.getElementById('repResultado');
    if (cont) cont.innerHTML = `<div style="text-align:center;padding:30px;color:var(--mu)">
      <div style="font-size:32px;margin-bottom:12px">⏳</div>Generando reporte...
    </div>`;

    try {
      const [usuarios, historial, retiros] = await Promise.all([
        window.fsGetAll('usuarios'),
        window.fsGetAll('historial_estrellas').catch(()=>[]),
        window.fsGetAll('retiros').catch(()=>[]),
      ]);

      // Filtrar historial por fechas
      const hist = (historial||[]).filter(h => {
        const fecha = h.createdAt?.toDate?.() || new Date(h.createdAt || 0);
        return fecha >= desde && fecha <= hasta;
      });

      const streamers = usuarios.filter(u => u.rol==='streamer');
      const agencias = usuarios.filter(u => u.rol==='agencia');

      // Calcular ganancias por streamer en el período
      const gananciasPorStreamer = {};
      hist.forEach(h => {
        if (!h.uid_to) return;
        if (!gananciasPorStreamer[h.uid_to]) {
          gananciasPorStreamer[h.uid_to] = { bruto:0, streamer_part:0, agencia_part:0, master_part:0, transacciones:0 };
        }
        const g = gananciasPorStreamer[h.uid_to];
        g.bruto += h.cantidad||0;
        g.streamer_part += h.dist_streamer||0;
        g.agencia_part += h.dist_agencia||0;
        g.master_part += h.dist_master||0;
        g.transacciones++;
      });

      // Calcular ganancias por agencia
      const gananciasPorAgencia = {};
      streamers.forEach(s => {
        if (!s.agencia_uid) return;
        const g = gananciasPorStreamer[s.id];
        if (!g) return;
        if (!gananciasPorAgencia[s.agencia_uid]) gananciasPorAgencia[s.agencia_uid] = { total:0, streamers:[] };
        gananciasPorAgencia[s.agencia_uid].total += g.agencia_part;
        gananciasPorAgencia[s.agencia_uid].streamers.push({ uid:s.id, nick:s.nick||s.nombre, ganancia:g.agencia_part });
      });

      // Totales
      const totalBruto = Object.values(gananciasPorStreamer).reduce((a,g)=>a+g.bruto,0);
      const totalStreamers = Object.values(gananciasPorStreamer).reduce((a,g)=>a+g.streamer_part,0);
      const totalAgencias = Object.values(gananciasPorStreamer).reduce((a,g)=>a+g.agencia_part,0);
      const totalMaster = Object.values(gananciasPorStreamer).reduce((a,g)=>a+g.master_part,0);
      const totalTx = hist.length;

      // Retiros en el período
      const retirosP = (retiros||[]).filter(r => {
        const fecha = r.createdAt?.toDate?.() || new Date(r.createdAt||0);
        return fecha >= desde && fecha <= hasta;
      });

      // Guardar datos para PDF
      window._repData = { desde:desdeStr, hasta:hastaStr, totalBruto, totalStreamers, totalAgencias, totalMaster, totalTx, streamers, agencias, gananciasPorStreamer, gananciasPorAgencia, retirosP };

      if (!document.getElementById('repResultado')) return;
      document.getElementById('repResultado').innerHTML = `
        <!-- RESUMEN EJECUTIVO -->
        <div style="padding:20px;border-radius:16px;background:linear-gradient(135deg,#0d0d0d,#1a0800);border:1px solid rgba(212,175,55,0.3);margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
            <div>
              <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:var(--gold)">📊 Reporte AURA</div>
              <div style="font-size:11px;color:var(--mu);margin-top:3px">${desdeStr} → ${hastaStr}</div>
            </div>
            <button onclick="repImprimir()" style="display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:var(--gold);font-size:13px;font-weight:700;cursor:pointer">
              🖨️ Imprimir / PDF
            </button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
            <div style="padding:14px;background:rgba(0,0,0,0.4);border-radius:12px;border:1px solid rgba(255,255,255,0.05)">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--mu);margin-bottom:6px">Total Bruto</div>
              <div style="font-family:'Cinzel',serif;font-size:24px;font-weight:900;color:#fff">${totalBruto.toLocaleString()} ⭐</div>
              <div style="font-size:11px;color:var(--mu)">≈ $${(totalBruto/200).toFixed(2)} USD</div>
            </div>
            <div style="padding:14px;background:rgba(212,175,55,0.06);border-radius:12px;border:1px solid rgba(212,175,55,0.2)">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--mu);margin-bottom:6px">AURA Recibe</div>
              <div style="font-family:'Cinzel',serif;font-size:24px;font-weight:900;color:var(--gold)">${totalMaster.toLocaleString()} ⭐</div>
              <div style="font-size:11px;color:var(--mu)">≈ $${(totalMaster/200).toFixed(2)} USD</div>
            </div>
            <div style="padding:14px;background:rgba(34,197,94,0.06);border-radius:12px;border:1px solid rgba(34,197,94,0.2)">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--mu);margin-bottom:6px">Streamers</div>
              <div style="font-family:'Cinzel',serif;font-size:24px;font-weight:900;color:#22c55e">${totalStreamers.toLocaleString()} ⭐</div>
              <div style="font-size:11px;color:var(--mu)">≈ $${(totalStreamers/200).toFixed(2)} USD</div>
            </div>
            <div style="padding:14px;background:rgba(167,139,250,0.06);border-radius:12px;border:1px solid rgba(167,139,250,0.2)">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--mu);margin-bottom:6px">Agencias</div>
              <div style="font-family:'Cinzel',serif;font-size:24px;font-weight:900;color:#A78BFA">${totalAgencias.toLocaleString()} ⭐</div>
              <div style="font-size:11px;color:var(--mu)">≈ $${(totalAgencias/200).toFixed(2)} USD</div>
            </div>
          </div>
          <div style="margin-top:12px;text-align:center;font-size:12px;color:var(--mu)">${totalTx} transacciones en el período</div>
        </div>

        ${(filtro==='repFiltroTodos'||filtro==='repFiltroStreamers') ? `
        <!-- STREAMERS -->
        <div class="card" style="margin-bottom:16px">
          <div class="section-title" style="margin-bottom:12px">🎤 Desglose por Streamer</div>
          ${streamers.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--mu)">No hay streamers registradas.</div>' :
            streamers.map(s => {
              const g = gananciasPorStreamer[s.id] || {bruto:0,streamer_part:0,agencia_part:0,master_part:0,transacciones:0};
              const nv = window.getNivel?.(s.nivel||'bronce');
              return `
                <div style="padding:12px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);margin-bottom:8px">
                  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;cursor:pointer" onclick="repToggleStreamer('${s.id}')">
                    <div class="card-avatar" style="width:36px;height:36px;font-size:14px;flex-shrink:0">${(s.nick||s.nombre||'?')[0].toUpperCase()}</div>
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:700;font-size:13px">@${s.nick||s.nombre} <span style="font-size:11px">${nv?.emoji||'🥉'}</span></div>
                      <div style="font-size:10px;color:var(--mu)">${s.pais||'—'} · ${g.transacciones} transacciones</div>
                    </div>
                    <div style="text-align:right">
                      <div style="font-weight:700;color:var(--gold);font-size:14px">${g.bruto.toLocaleString()} ⭐</div>
                      <div style="font-size:10px;color:#22c55e">≈ $${(g.bruto/200).toFixed(2)}</div>
                    </div>
                    <span style="color:var(--mu);font-size:16px" id="repArrow_${s.id}">›</span>
                  </div>
                  <div id="repDetalle_${s.id}" style="display:none;padding:10px;background:rgba(0,0,0,0.3);border-radius:10px;font-size:12px">
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
                      <div style="text-align:center">
                        <div style="color:var(--mu);margin-bottom:2px">Streamer (${nv?.streamer||20}%)</div>
                        <div style="font-weight:700;color:#22c55e">${g.streamer_part.toLocaleString()}⭐</div>
                        <div style="color:var(--mu);font-size:10px">$${(g.streamer_part/200).toFixed(2)}</div>
                      </div>
                      <div style="text-align:center">
                        <div style="color:var(--mu);margin-bottom:2px">Agencia (${nv?.agencia||10}%)</div>
                        <div style="font-weight:700;color:#A78BFA">${g.agencia_part.toLocaleString()}⭐</div>
                        <div style="color:var(--mu);font-size:10px">$${(g.agencia_part/200).toFixed(2)}</div>
                      </div>
                      <div style="text-align:center">
                        <div style="color:var(--mu);margin-bottom:2px">AURA (${nv?.master||70}%)</div>
                        <div style="font-weight:700;color:var(--gold)">${g.master_part.toLocaleString()}⭐</div>
                        <div style="color:var(--mu);font-size:10px">$${(g.master_part/200).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')
          }
        </div>` : ''}

        ${(filtro==='repFiltroTodos'||filtro==='repFiltroAgencias') ? `
        <!-- AGENCIAS -->
        <div class="card" style="margin-bottom:16px">
          <div class="section-title" style="margin-bottom:12px">🏢 Desglose por Agencia</div>
          ${agencias.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--mu)">No hay agencias registradas.</div>' :
            agencias.map(a => {
              const ga = gananciasPorAgencia[a.id] || { total:0, streamers:[] };
              return `
                <div style="padding:12px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);margin-bottom:8px">
                  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;cursor:pointer" onclick="repToggleAgencia('${a.id}')">
                    <div class="card-avatar" style="width:36px;height:36px;font-size:14px;background:rgba(167,139,250,0.15);border-color:rgba(167,139,250,0.3);flex-shrink:0">${(a.nick||a.nombre||'?')[0].toUpperCase()}</div>
                    <div style="flex:1">
                      <div style="font-weight:700;font-size:13px">@${a.nick||a.nombre}</div>
                      <div style="font-size:10px;color:var(--mu)">${ga.streamers.length} streamers</div>
                    </div>
                    <div style="text-align:right">
                      <div style="font-weight:700;color:#A78BFA;font-size:14px">${ga.total.toLocaleString()} ⭐</div>
                      <div style="font-size:10px;color:var(--mu)">≈ $${(ga.total/200).toFixed(2)}</div>
                    </div>
                    <span style="color:var(--mu);font-size:16px" id="repArrowA_${a.id}">›</span>
                  </div>
                  <div id="repDetalleA_${a.id}" style="display:none;padding:10px;background:rgba(0,0,0,0.3);border-radius:10px;font-size:12px">
                    ${ga.streamers.length === 0 ? '<div style="color:var(--mu);text-align:center">Sin streamers con actividad en este período</div>' :
                      ga.streamers.map(s=>`
                        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                          <span>@${s.nick}</span>
                          <span style="color:#A78BFA;font-weight:700">${s.ganancia.toLocaleString()}⭐ · $${(s.ganancia/200).toFixed(2)}</span>
                        </div>
                      `).join('')
                    }
                  </div>
                </div>
              `;
            }).join('')
          }
        </div>` : ''}

        <!-- RETIROS EN EL PERÍODO -->
        <div class="card" style="margin-bottom:16px">
          <div class="section-title" style="margin-bottom:12px">💳 Retiros en el período</div>
          ${retirosP.length === 0
            ? '<div style="text-align:center;padding:16px;color:var(--mu)">No hubo retiros en este período.</div>'
            : retirosP.map(r=>`
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px">
                <div>
                  <div style="font-weight:600">@${r.nick||'—'}</div>
                  <div style="color:var(--mu)">${r.metodo} · ${r.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Reciente'}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:700;color:var(--gold)">${r.monto_usd?'$'+r.monto_usd+' USD':r.monto+'★'}</div>
                  <span class="badge ${r.estado==='pagado'?'badge-green':r.estado==='rechazado'?'badge-red':'badge-orange'}" style="font-size:9px">${r.estado}</span>
                </div>
              </div>
            `).join('')
          }
        </div>

        <!-- BOTÓN IMPRIMIR ABAJO -->
        <button onclick="repImprimir()" style="width:100%;padding:16px;border-radius:var(--r-lg);background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:var(--gold);font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:20px">
          🖨️ Imprimir reporte completo / Descargar PDF
        </button>
      `;

      // Toggle detalles
      window.repToggleStreamer = function(id) {
        const d = document.getElementById('repDetalle_'+id);
        const a = document.getElementById('repArrow_'+id);
        if (!d) return;
        const open = d.style.display !== 'none';
        d.style.display = open ? 'none' : 'block';
        if (a) a.textContent = open ? '›' : '⌄';
      };
      window.repToggleAgencia = function(id) {
        const d = document.getElementById('repDetalleA_'+id);
        const a = document.getElementById('repArrowA_'+id);
        if (!d) return;
        const open = d.style.display !== 'none';
        d.style.display = open ? 'none' : 'block';
        if (a) a.textContent = open ? '›' : '⌄';
      };

    } catch(e) {
      const cont2 = document.getElementById('repResultado');
      if (cont2) cont2.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--mu)">Error generando reporte: ${e.message}</div>`;
    }
  };

  // ── IMPRIMIR / PDF ──
  window.repImprimir = function() {
    const d = window._repData;
    if (!d) { toast('Primero genera el reporte','error'); return; }

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte AURA ${d.desde} - ${d.hasta}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; color: #1a1a1a; padding: 24px; font-size: 13px; }
          h1 { font-size: 22px; color: #8B6914; margin-bottom: 4px; }
          .sub { color: #666; font-size: 12px; margin-bottom: 24px; }
          .grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
          .stat { padding: 14px; border-radius: 10px; border: 1px solid #e0e0e0; text-align: center; }
          .stat .label { font-size: 10px; text-transform: uppercase; color: #999; margin-bottom: 6px; }
          .stat .value { font-size: 20px; font-weight: 900; }
          .gold { color: #B8860B; } .green { color: #16a34a; } .purple { color: #7c3aed; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f5f5f5; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          tr:hover td { background: #fafafa; }
          .section-title { font-size: 16px; font-weight: 700; margin: 20px 0 10px; color: #333; border-bottom: 2px solid #B8860B; padding-bottom: 6px; }
          .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 14px; }
          @media print { body { padding: 16px; } button { display: none; } }
        </style>
      </head>
      <body>
        <h1>📊 Reporte Financiero AURA</h1>
        <div class="sub">Período: ${d.desde} → ${d.hasta} · Generado: ${new Date().toLocaleString('es')}</div>

        <div class="grid">
          <div class="stat"><div class="label">Total Bruto</div><div class="value">${d.totalBruto.toLocaleString()}⭐</div><div style="color:#999;font-size:11px">$${(d.totalBruto/200).toFixed(2)} USD</div></div>
          <div class="stat"><div class="label">AURA Recibe</div><div class="value gold">${d.totalMaster.toLocaleString()}⭐</div><div style="color:#999;font-size:11px">$${(d.totalMaster/200).toFixed(2)} USD</div></div>
          <div class="stat"><div class="label">Streamers</div><div class="value green">${d.totalStreamers.toLocaleString()}⭐</div><div style="color:#999;font-size:11px">$${(d.totalStreamers/200).toFixed(2)} USD</div></div>
          <div class="stat"><div class="label">Agencias</div><div class="value purple">${d.totalAgencias.toLocaleString()}⭐</div><div style="color:#999;font-size:11px">$${(d.totalAgencias/200).toFixed(2)} USD</div></div>
        </div>

        <div class="section-title">🎤 Desglose por Streamer</div>
        <table>
          <thead><tr><th>Streamer</th><th>Nivel</th><th>País</th><th>Bruto (⭐)</th><th>Su parte (⭐)</th><th>Agencia (⭐)</th><th>AURA (⭐)</th><th>USD estimado</th></tr></thead>
          <tbody>
            ${d.streamers.map(s=>{
              const g = d.gananciasPorStreamer[s.id]||{bruto:0,streamer_part:0,agencia_part:0,master_part:0};
              const nv = window.getNivel?.(s.nivel||'bronce');
              return `<tr>
                <td><b>@${s.nick||s.nombre}</b></td>
                <td>${nv?.emoji||'🥉'} ${nv?.nombre||'Bronce'}</td>
                <td>${s.pais||'—'}</td>
                <td>${g.bruto.toLocaleString()}</td>
                <td style="color:#16a34a">${g.streamer_part.toLocaleString()}</td>
                <td style="color:#7c3aed">${g.agencia_part.toLocaleString()}</td>
                <td style="color:#B8860B">${g.master_part.toLocaleString()}</td>
                <td>$${(g.bruto/200).toFixed(2)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        <div class="section-title">🏢 Desglose por Agencia</div>
        <table>
          <thead><tr><th>Agencia</th><th>Streamers</th><th>Total ganado (⭐)</th><th>USD estimado</th></tr></thead>
          <tbody>
            ${d.agencias.map(a=>{
              const ga = d.gananciasPorAgencia[a.id]||{total:0,streamers:[]};
              return `<tr>
                <td><b>@${a.nick||a.nombre}</b></td>
                <td>${ga.streamers.length}</td>
                <td style="color:#7c3aed">${ga.total.toLocaleString()}</td>
                <td>$${(ga.total/200).toFixed(2)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        <div class="section-title">💳 Retiros en el período</div>
        <table>
          <thead><tr><th>Streamer</th><th>Método</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            ${d.retirosP.map(r=>`<tr>
              <td>@${r.nick||'—'}</td>
              <td>${r.metodo||'—'}</td>
              <td>${r.monto_usd?'$'+r.monto_usd+' USD':r.monto+'★'}</td>
              <td>${r.estado}</td>
              <td>${r.createdAt?.toDate?.()?.toLocaleDateString?.() || '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>

        <div class="footer">
          AURA Platform · Reporte generado el ${new Date().toLocaleString('es')} · Confidencial
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(()=> win.print(), 500);
  };
};
