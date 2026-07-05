// MAESTRO — Command Center Dashboard

function localDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// === SUPABASE (Radio La Nueva 540) ===
const supabaseClient = window.supabase.createClient(
    'https://zplvreuiuosmmeoeaeaz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwbHZyZXVpdW9zbW1lb2VhZWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc1MDcsImV4cCI6MjA4NTIyMzUwN30.NZE9qW4rKuZ_GZ2Xu2W3qo_vnKwO1Tud6OOAypnRg14'
);

// === UTILIDADES ===
function formatSoles(amount) {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount || 0);
}

// === DATOS DE PROYECTOS ===
const projectsData = [
    {
        id: 'radio',
        name: 'Radio La Nueva 540',
        icon: '📻',
        status: 'online',
        lastUpdate: 'Cargando...',
        balance: 0,
        path: 'https://la-nueva-540.com/',
        modalId: 'modal-radio'
    },
    {
        id: 'cosmos',
        name: 'COSMOS Netflix',
        icon: '🎬',
        status: 'building',
        lastUpdate: 'En construcción',
        balance: 0,
        path: '#'
    },
    {
        id: 'cerebro',
        name: 'CEREBRO ERP',
        icon: '🧠',
        status: 'online',
        lastUpdate: 'Sin conectar',
        balance: 0,
        path: 'https://cerebro-erp.vercel.app',
        modalId: 'modal-cerebro'
    },
    {
        id: 'gorras',
        name: 'TODO PARA GORRA',
        icon: '🧢',
        status: 'online',
        lastUpdate: 'Sin conectar',
        balance: 0,
        path: 'https://todo-para-gorra-crm.vercel.app/login',
        modalId: 'modal-gorras'
    },
    {
        id: 'crm-textil',
        name: 'CRM IA Textil',
        icon: '🧵',
        status: 'online',
        lastUpdate: 'Cargando...',
        balance: 0,
        path: '#',
        modalId: 'modal-crm'
    },
    {
        id: 'entrust',
        name: 'Catálogo Entrust',
        icon: '📋',
        status: 'building',
        lastUpdate: 'Sin backend aún',
        balance: 0,
        path: '#'
    },
    {
        id: 'word-caps',
        name: 'Word Caps',
        icon: '🌍',
        status: 'manual',
        lastUpdate: 'Manual',
        balance: 0,
        isManual: true,
        path: '#'
    },
    {
        id: 'planillas',
        name: 'Talleres y Planillas',
        icon: '🏭',
        status: 'online',
        lastUpdate: 'Cargando...',
        balance: 0,
        path: '#',
        modalId: 'modal-planillas'
    },
    {
        id: 'cuentas-generales',
        name: 'Cuentas Generales',
        icon: '📊',
        status: 'online',
        lastUpdate: 'Google Sheets',
        balance: 0,
        path: '#',
        modalId: 'modal-cuentas-generales'
    }
];

// === WORD CAPS — Sistema de Reventa (Premium) ===
let wcSelectedClient = null;
let wcAllData        = [];   // cache global
let wcChartDonut     = null;
let wcChartBars      = null;

async function wcLoadData() {
    try {
        const res = await fetch('https://la-nueva-540.com/api/wordcaps');
        if (!res.ok) throw new Error('Fallo al conectar con Cloudflare');
        const data = await res.json();
        wcAllData = data || [];
        return wcAllData;
    } catch (error) {
        console.error('WC error:', error.message);
        return null;
    }
}

async function wcSaveMov(mov) {
    try {
        const res = await fetch('https://la-nueva-540.com/api/wordcaps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mov)
        });
        if (!res.ok) throw new Error('Error en el servidor');
        return true;
    } catch (error) {
        alert('Error al guardar: ' + error.message);
        return false;
    }
}

async function wcDeleteMov(id) {
    if (!confirm('¿Eliminar este movimiento?')) return;
    try {
        const res = await fetch(`https://la-nueva-540.com/api/wordcaps?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar en el servidor');
        await wcRender();
    } catch (error) {
        alert('Error al eliminar: ' + error.message);
    }
}

function wcBuildClients(data) {
    const map = {};
    data.filter(m => m.tipo !== 'compra').forEach(m => {
        const key = (m.cliente || '').toUpperCase().trim();
        if (!key) return;
        if (!map[key]) map[key] = { entregado: 0, cobrado: 0, movs: [] };
        if (m.tipo === 'entrega') map[key].entregado += parseFloat(m.monto);
        else                      map[key].cobrado   += parseFloat(m.monto);
        map[key].movs.push(m);
    });
    Object.values(map).forEach(cl => { cl.saldo = cl.entregado - cl.cobrado; });
    return map;
}

function wcGetTotals(data) {
    const invertido = data.filter(m => m.tipo === 'compra').reduce((a, m) => a + parseFloat(m.monto), 0);
    const entregado = data.filter(m => m.tipo === 'entrega').reduce((a, m) => a + parseFloat(m.monto), 0);
    const cobrado   = data.filter(m => m.tipo === 'cobro').reduce((a, m)  => a + parseFloat(m.monto), 0);
    return { invertido, entregado, cobrado, porCobrar: entregado - cobrado, ganancia: cobrado - invertido };
}

// --- TAB SWITCHING ---
function wcSwitchTab(tab, btn) {
    document.querySelectorAll('.wc-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.wc-tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`wc-tab-${tab}`).classList.add('active');
    if (tab === 'resumen') wcRenderCharts();
    if (tab === 'historial') wcRenderHistorial();
}

// --- CHARTS ---
function wcRenderCharts() {
    const data    = wcAllData;
    const clients = wcBuildClients(data);
    const entries = Object.entries(clients)
        .filter(([, cl]) => cl.saldo > 0)
        .sort((a, b) => b[1].saldo - a[1].saldo)
        .slice(0, 8);

    const COLORS = [
        'rgba(239,68,68,0.8)','rgba(245,158,11,0.8)','rgba(99,102,241,0.8)',
        'rgba(168,85,247,0.8)','rgba(34,197,94,0.8)','rgba(6,182,212,0.8)',
        'rgba(251,191,36,0.8)','rgba(236,72,153,0.8)'
    ];

    // Donut — saldo por cliente
    const donutCtx = document.getElementById('wc-chart-donut');
    if (donutCtx) {
        if (wcChartDonut) wcChartDonut.destroy();
        wcChartDonut = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: entries.map(([n]) => n),
                datasets: [{ data: entries.map(([,c]) => c.saldo.toFixed(2)), backgroundColor: COLORS, borderWidth: 2, borderColor: 'rgba(15,23,42,0.8)' }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11, family: 'Outfit' }, boxWidth: 12 } },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.label}: S/ ${parseFloat(ctx.raw).toLocaleString('es-PE',{minimumFractionDigits:2})}` } }
                },
                cutout: '65%'
            }
        });
    }

    // Bars — entregas vs cobros
    const barCtx = document.getElementById('wc-chart-bars');
    const top6   = Object.entries(clients).sort((a,b) => b[1].entregado - a[1].entregado).slice(0,6);
    if (barCtx) {
        if (wcChartBars) wcChartBars.destroy();
        wcChartBars = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: top6.map(([n]) => n.length > 10 ? n.slice(0,10)+'…' : n),
                datasets: [
                    { label: 'Entregado', data: top6.map(([,c]) => c.entregado.toFixed(2)), backgroundColor: 'rgba(245,158,11,0.7)', borderRadius: 4 },
                    { label: 'Cobrado',   data: top6.map(([,c]) => c.cobrado.toFixed(2)),   backgroundColor: 'rgba(34,197,94,0.7)',  borderRadius: 4 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11, family: 'Outfit' } } } },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => 'S/'+Number(v).toLocaleString() }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }

    // Ranking
    const maxSaldo = entries[0]?.[1].saldo || 1;
    const medals   = ['🥇','🥈','🥉'];
    const rankEl   = document.getElementById('wc-ranking-list');
    if (rankEl) {
        if (entries.length === 0) {
            rankEl.innerHTML = '<p class="wc-empty">✅ Sin deudas pendientes</p>';
        } else {
            rankEl.innerHTML = entries.map(([name, cl], i) => `
            <div class="wc-rank-item">
                <span class="wc-rank-pos">${medals[i] || i+1}</span>
                <span class="wc-rank-name">${name}</span>
                <div class="wc-rank-bar-wrap"><div class="wc-rank-bar" style="width:${(cl.saldo/maxSaldo*100).toFixed(1)}%"></div></div>
                <span class="wc-rank-amount">${formatSoles(cl.saldo)}</span>
            </div>`).join('');
        }
    }
}

// --- HISTORIAL GLOBAL con filtros y reporte ---
function wcRenderHistorial() {
    const list = document.getElementById('wc-historial-global');
    if (!list) return;
    const search = (document.getElementById('wc-hist-search')?.value || '').toLowerCase();
    const tipo   = document.getElementById('wc-hist-tipo')?.value  || '';
    const desde  = document.getElementById('wc-hist-desde')?.value || '';
    const hasta  = document.getElementById('wc-hist-hasta')?.value || '';

    let filtered = wcAllData.filter(m => {
        if (tipo   && m.tipo   !== tipo)                   return false;
        if (desde  && m.fecha  < desde)                    return false;
        if (hasta  && m.fecha  > hasta)                    return false;
        if (search && !(
            (m.cliente     || '').toLowerCase().includes(search) ||
            (m.descripcion || '').toLowerCase().includes(search) ||
            (m.proveedor   || '').toLowerCase().includes(search)
        )) return false;
        return true;
    });

    // Resumen del período filtrado
    const repEnt  = filtered.filter(m => m.tipo === 'entrega').reduce((a,m) => a + parseFloat(m.monto), 0);
    const repCob  = filtered.filter(m => m.tipo === 'cobro').reduce((a,m)   => a + parseFloat(m.monto), 0);
    const repComp = filtered.filter(m => m.tipo === 'compra').reduce((a,m)  => a + parseFloat(m.monto), 0);
    const repBal  = repCob - repEnt;

    document.getElementById('wc-rep-count').textContent  = filtered.length;
    document.getElementById('wc-rep-ent').textContent    = formatSoles(repEnt);
    document.getElementById('wc-rep-cob').textContent    = formatSoles(repCob);
    document.getElementById('wc-rep-comp').textContent   = formatSoles(repComp);
    const balEl = document.getElementById('wc-rep-bal');
    balEl.textContent = formatSoles(Math.abs(repBal));
    balEl.className   = repBal >= 0 ? 'text-success' : 'text-warning';

    if (filtered.length === 0) {
        list.innerHTML = '<li class="tx-empty">Sin movimientos con estos filtros.</li>';
        return;
    }

    const iconMap  = { entrega: '📦', cobro: '💰', compra: '🛍️' };
    const classMap = { cobro: 'pos', entrega: 'neg', compra: 'buy' };

    list.innerHTML = filtered.map(m => {
        const pago = [m.tipo_pago, m.banco].filter(Boolean).join(' · ');
        const sn   = (m.id||'').toString();
        const histTags = (m.tipo === 'entrega' && (m.codigo || m.modelo || m.responsable)) ? `
            <span class="wc-mov-tags" style="margin-top:1px;">
                ${m.codigo ? `<span class="wc-tag wc-tag-code">${m.codigo}</span>` : ''}
                ${m.modelo ? `<span class="wc-tag wc-tag-model">${m.modelo}</span>` : ''}
                ${m.responsable ? `<span class="wc-tag wc-tag-resp">${m.responsable}</span>` : ''}
                ${m.cantidad ? `<span class="wc-tag wc-tag-qty">${m.cantidad} × S/${parseFloat(m.precio||0).toFixed(2)}</span>` : ''}
            </span>` : '';
        return `
        <li class="wc-hist-item">
            <span class="wc-hist-icon">${iconMap[m.tipo] || '📄'}</span>
            <div class="wc-hist-body">
                <span class="wc-hist-client">${m.cliente || m.proveedor || '—'}</span>
                <span class="wc-hist-desc">${m.descripcion || m.tipo}</span>
                ${histTags}
            </div>
            <div class="wc-hist-meta">
                ${pago ? `<span class="wc-hist-pago">${pago}</span>` : ''}
                <span class="wc-hist-date">${m.fecha}</span>
                <span class="wc-hist-amount ${classMap[m.tipo]||''}">${m.tipo==='cobro'?'+':'−'}${formatSoles(parseFloat(m.monto))}</span>
                <button class="btn-delete-tx" onclick="wcDeleteMov('${sn}')" title="Eliminar">✕</button>
            </div>
        </li>`;
    }).join('');
}

function wcFilterHistorial() { wcRenderHistorial(); }

function wcClearFilters() {
    document.getElementById('wc-hist-search').value = '';
    document.getElementById('wc-hist-tipo').value   = '';
    document.getElementById('wc-hist-desde').value  = '';
    document.getElementById('wc-hist-hasta').value  = '';
    wcRenderHistorial();
}

// --- RENDER PRINCIPAL ---
async function wcRender() {
    const data = await wcLoadData();
    if (data === null) return;

    const totals  = wcGetTotals(data);
    const clients = wcBuildClients(data);

    document.getElementById('wc-inv').textContent = formatSoles(totals.invertido);
    document.getElementById('wc-ent').textContent = formatSoles(totals.entregado);
    document.getElementById('wc-cob').textContent = formatSoles(totals.cobrado);
    document.getElementById('wc-pen').textContent = formatSoles(totals.porCobrar);
    const ganEl = document.getElementById('wc-gan');
    ganEl.textContent = formatSoles(totals.ganancia);
    ganEl.className   = `wc-kpi-data strong ${totals.ganancia >= 0 ? 'text-success' : 'text-danger'}`;

    const wc = projectsData.find(p => p.id === 'word-caps');
    wc.balance    = totals.porCobrar;
    wc.lastUpdate = `${Object.keys(clients).length} cliente${Object.keys(clients).length !== 1 ? 's' : ''}`;
    calculateGlobalBalance();
    renderProjects();

    // Tab activo actualmente
    const activeTab = document.querySelector('.wc-tab-btn.active');
    const tabName   = activeTab?.getAttribute('onclick')?.match(/'(\w+)'/)?.[1] || 'resumen';

    // Render clientes
    const container = document.getElementById('wc-clients-list');
    if (container) {
        const entries = Object.entries(clients).sort((a, b) => b[1].saldo - a[1].saldo);
        if (entries.length === 0) {
            container.innerHTML = '<p class="wc-empty">Sin clientes aún.<br>Registra una entrega para comenzar.</p>';
        } else {
            container.innerHTML = entries.map(([name, cl]) => {
                const dc  = cl.saldo > 200 ? 'wc-debt-high' : cl.saldo > 0 ? 'wc-debt-med' : 'wc-debt-ok';
                const ico = cl.saldo > 200 ? '🔴' : cl.saldo > 0 ? '🟡' : '🟢';
                const sel = wcSelectedClient === name ? 'wc-card-selected' : '';
                const sn  = name.replace(/'/g, "\\'");
                return `
                <div class="wc-client-card ${dc} ${sel}" onclick="wcSelectClient('${sn}')">
                    <div class="wc-card-top">
                        <span class="wc-client-name">${ico} ${name}</span>
                        <span class="${cl.saldo > 0 ? 'text-warning' : 'text-success'}" style="font-weight:700;font-size:0.85rem;">
                            ${cl.saldo > 0 ? 'Debe ' : '✅ '}${formatSoles(Math.abs(cl.saldo))}
                        </span>
                    </div>
                    <div class="wc-card-detail">
                        <span>📦 ${formatSoles(cl.entregado)}</span>
                        <span>✅ ${formatSoles(cl.cobrado)}</span>
                    </div>
                    ${cl.saldo > 0 ? `<button class="btn-cobrar-rapido" onclick="event.stopPropagation();wcOpenForm('cobro','${sn}')">💰 Cobrar ahora</button>` : ''}
                </div>`;
            }).join('');
        }
    }

    if (wcSelectedClient && clients[wcSelectedClient]) {
        wcRenderDetail(wcSelectedClient, clients[wcSelectedClient]);
    }

    if (tabName === 'resumen') wcRenderCharts();
    if (tabName === 'historial') wcRenderHistorial();
}

function wcSelectClient(name) {
    wcSelectedClient = name;
    // Switch to clientes tab if not already there
    const tabBtn = document.querySelector('.wc-tab-btn:nth-child(2)');
    if (tabBtn && !document.getElementById('wc-tab-clientes').classList.contains('active')) {
        wcSwitchTab('clientes', tabBtn);
    }
    wcRender();
}

function wcRenderDetail(name, cl) {
    const panel = document.getElementById('wc-right-panel');
    const sn = name.replace(/'/g, "\\'");
    panel.innerHTML = `
        <div class="wc-detail-header">
            <h3>${name}</h3>
            <div class="wc-detail-stats">
                <span>📦 Entregado: <strong>${formatSoles(cl.entregado)}</strong></span>
                <span>✅ Cobrado: <strong class="text-success">${formatSoles(cl.cobrado)}</strong></span>
                <span class="${cl.saldo > 0 ? 'text-warning' : 'text-success'}">
                    ${cl.saldo > 0 ? '⏳ Debe:' : '🟢'} <strong>${formatSoles(Math.abs(cl.saldo))}</strong>
                </span>
            </div>
            <div class="wc-detail-btns">
                <button class="btn-wc" onclick="wcOpenForm('entrega','${sn}')">📦 Nueva Entrega</button>
                <button class="btn-wc btn-wc-cobro" onclick="wcOpenForm('cobro','${sn}')">💰 Cobrar</button>
            </div>
        </div>
        <p class="section-label" style="margin-top:1rem;margin-bottom:0.6rem;">Historial completo</p>
        <ul class="wc-movs-list">
            ${cl.movs.map(m => {
                const pago = [m.tipo_pago, m.banco].filter(Boolean).join(' · ');
                const entregaTags = (m.tipo === 'entrega' && (m.codigo || m.modelo || m.responsable)) ? `
                    <span class="wc-mov-tags">
                        ${m.codigo ? `<span class="wc-tag wc-tag-code">${m.codigo}</span>` : ''}
                        ${m.modelo ? `<span class="wc-tag wc-tag-model">${m.modelo}</span>` : ''}
                        ${m.responsable ? `<span class="wc-tag wc-tag-resp">${m.responsable}</span>` : ''}
                        ${m.cantidad ? `<span class="wc-tag wc-tag-qty">${m.cantidad} uds × S/${parseFloat(m.precio||0).toFixed(2)}</span>` : ''}
                    </span>` : '';
                return `
            <li class="wc-mov-item ${m.tipo === 'cobro' ? 'wc-mov-cobro' : 'wc-mov-entrega'}">
                <span class="wc-mov-icon">${m.tipo === 'cobro' ? '💰' : '📦'}</span>
                <div class="wc-mov-info">
                    <span class="wc-mov-desc">${m.descripcion || (m.tipo === 'cobro' ? 'Cobro' : 'Entrega')}</span>
                    ${entregaTags}
                    <span class="wc-mov-date">${m.fecha}${pago ? ' · ' + pago : ''}</span>
                </div>
                <span class="wc-mov-amount ${m.tipo === 'cobro' ? 'text-success' : 'text-warning'}">
                    ${m.tipo === 'cobro' ? '+' : '-'}${formatSoles(parseFloat(m.monto))}
                </span>
                <button class="btn-delete-tx" onclick="wcDeleteMov('${m.id}')" title="Eliminar">✕</button>
            </li>`; }).join('')}
        </ul>`;
}

function wcOpenForm(tipo, clientePrefill = '') {
    // Switch to clientes tab
    const tabBtn = document.querySelector('.wc-tab-btn:nth-child(2)');
    if (tabBtn) wcSwitchTab('clientes', tabBtn);

    const panel  = document.getElementById('wc-right-panel');
    const today  = localDateStr();
    const safeV  = clientePrefill.replace(/"/g, '&quot;');
    const labels = { entrega: 'Registrar Entrega', cobro: 'Registrar Cobro', compra: 'Registrar Compra' };
    const titulo = tipo === 'entrega' ? '📦 Nueva Entrega' : tipo === 'cobro' ? '💰 Registrar Cobro / Abono' : '🛍️ Compra de Stock';

    const clienteField = tipo !== 'compra' ? `
        <div class="form-group">
            <label>Cliente</label>
            <input type="text" id="wc-f-cliente" value="${safeV}" placeholder="Nombre del cliente" required>
        </div>` : '';

    const provField = tipo === 'compra' ? `
        <div class="form-group">
            <label>Proveedor</label>
            <input type="text" id="wc-f-prov" placeholder="Ej: Gamarra, Distribuidora López">
        </div>` : '';

    // === CAMPOS ESPECIALES PARA ENTREGAS (formato Excel) ===
    const entregaFields = tipo === 'entrega' ? `
        <div class="form-row">
            <div class="form-group" style="flex:1;">
                <label>📅 Fecha de Entrega</label>
                <input type="date" id="wc-f-fecha" value="${today}" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Código de Producción</label>
                <input type="text" id="wc-f-codigo" placeholder="Ej: D115, D122" style="text-transform:uppercase;">
            </div>
            <div class="form-group">
                <label>Modelo</label>
                <select id="wc-f-modelo">
                    <option value="">— Seleccionar —</option>
                    <option value="CURVO">Curvo</option>
                    <option value="CLASICO">Clásico</option>
                    <option value="TRUCKER">Trucker</option>
                    <option value="SNAPBACK">Snapback</option>
                    <option value="DAD HAT">Dad Hat</option>
                    <option value="BUCKET">Bucket</option>
                    <option value="POLO">Polo</option>
                    <option value="OTRO">Otro</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Responsable</label>
                <select id="wc-f-responsable">
                    <option value="">— Seleccionar —</option>
                    <option value="RICHAR">Richar</option>
                    <option value="MILY">Mily</option>
                    <option value="PIERO">Piero</option>
                    <option value="WILIAM">Wiliam</option>
                    <option value="DANIEL">Daniel</option>
                    <option value="HERNAN">Hernan</option>
                    <option value="OTRO">Otro</option>
                </select>
            </div>
            <div class="form-group">
                <label>Cantidad Entregada</label>
                <input type="number" id="wc-f-cantidad" placeholder="0" min="1" oninput="wcCalcTotal()" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Precio Unitario (S/)</label>
                <input type="number" id="wc-f-precio" placeholder="20.00" step="0.01" min="0" value="20" oninput="wcCalcTotal()" required>
            </div>
            <div class="form-group">
                <label>Total (S/) <span style="font-size:0.7rem;opacity:0.6;">auto-calculado</span></label>
                <input type="number" id="wc-f-monto" placeholder="0.00" step="0.01" min="0" readonly
                    style="background:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.4); font-weight:700; font-size:1.1rem; color:var(--warning);">
            </div>
        </div>` : '';

    // === CAMPOS PARA COBRO / COMPRA (sin cambios) ===
    const descPlaceholder = tipo === 'cobro' ? 'Ej: Abono, pago completo, adelanto'
        : tipo === 'compra' ? 'Ej: 50 gorras Gamarra, 20 polos Jirón'
        : '';

    const descField = tipo !== 'entrega' ? `
        <div class="form-group">
            <label>Descripción</label>
            <input type="text" id="wc-f-desc" placeholder="${descPlaceholder}">
        </div>` : `
        <div class="form-group">
            <label>Descripción / Notas</label>
            <input type="text" id="wc-f-desc" placeholder="Observaciones opcionales">
        </div>`;

    // Para entrega: fecha ya está en entregaFields (visible al inicio del form)
    const montoCobroCampo = tipo !== 'entrega' ? `
                <div class="form-row">
                    <div class="form-group">
                        <label>Monto (S/)</label>
                        <input type="number" id="wc-f-monto" placeholder="0.00" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date" id="wc-f-fecha" value="${today}" required>
                    </div>
                </div>` : '';

    const pagoFields = tipo !== 'entrega' ? `
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de Pago</label>
                        <select id="wc-f-tipopago">
                            <option value="">— Seleccionar —</option>
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                            <option value="YAPE">Yape</option>
                            <option value="PLIN">Plin</option>
                            <option value="IZIPAY">Izipay</option>
                            <option value="WESTER">Western Union</option>
                            <option value="TELAS">Telas (especie)</option>
                            <option value="OTRO">Otro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Banco</label>
                        <select id="wc-f-banco">
                            <option value="">— Ninguno —</option>
                            <option value="BCP">BCP</option>
                            <option value="INTERBANK">Interbank</option>
                            <option value="BBVA">BBVA</option>
                            <option value="SCOTIABANK">Scotiabank</option>
                            <option value="GHC">GHC</option>
                            <option value="OTRO">Otro</option>
                        </select>
                    </div>
                </div>` : '';

    panel.innerHTML = `
        <div class="wc-form-block">
            <h4>${titulo}</h4>
            <form id="form-wc-active">
                ${clienteField}
                ${entregaFields}
                ${descField}
                ${provField}
                ${pagoFields}
                ${montoCobroCampo}
                <button type="submit" class="btn-primary">${labels[tipo]}</button>
            </form>
        </div>`;

    document.getElementById('form-wc-active').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type=submit]');
        btn.disabled = true; btn.textContent = 'Guardando...';
        const clienteVal = document.getElementById('wc-f-cliente')?.value?.trim()?.toUpperCase() || null;

        const mov = {
            tipo,
            monto:       parseFloat(document.getElementById('wc-f-monto').value),
            descripcion: document.getElementById('wc-f-desc')?.value?.trim() || null,
            fecha:       document.getElementById('wc-f-fecha').value,
            cliente:     clienteVal,
            proveedor:   document.getElementById('wc-f-prov')?.value?.trim() || null,
            tipo_pago:   document.getElementById('wc-f-tipopago')?.value || null,
            banco:       document.getElementById('wc-f-banco')?.value || null,
        };

        // Campos adicionales para entregas (formato Excel)
        if (tipo === 'entrega') {
            mov.codigo      = document.getElementById('wc-f-codigo')?.value?.trim()?.toUpperCase() || null;
            mov.modelo      = document.getElementById('wc-f-modelo')?.value || null;
            mov.responsable = document.getElementById('wc-f-responsable')?.value || null;
            mov.cantidad    = parseInt(document.getElementById('wc-f-cantidad')?.value) || null;
            mov.precio      = parseFloat(document.getElementById('wc-f-precio')?.value) || null;
            // Auto-generar descripción si no se puso
            if (!mov.descripcion && mov.cantidad && mov.modelo) {
                mov.descripcion = `${mov.cantidad} ${mov.modelo}${mov.responsable ? ' (' + mov.responsable + ')' : ''}`;
            }
        }

        if (clienteVal) wcSelectedClient = clienteVal;
        const ok = await wcSaveMov(mov);
        if (ok) {
            btn.textContent = '✅ Guardado';
            const savedCliente = clienteVal;
            e.target.reset();
            document.getElementById('wc-f-fecha').value = today;
            if (tipo === 'entrega' && document.getElementById('wc-f-precio')) {
                document.getElementById('wc-f-precio').value = '20';
            }
            if (savedCliente && document.getElementById('wc-f-cliente')) {
                document.getElementById('wc-f-cliente').value = savedCliente;
            }
            setTimeout(() => { btn.textContent = labels[tipo]; btn.disabled = false; }, 1200);
        } else {
            btn.disabled = false; btn.textContent = labels[tipo];
        }
        await wcRender();
    };
}

// Calcula total automático: cantidad × precio
function wcCalcTotal() {
    const cant   = parseFloat(document.getElementById('wc-f-cantidad')?.value) || 0;
    const precio = parseFloat(document.getElementById('wc-f-precio')?.value) || 0;
    const total  = cant * precio;
    const montoEl = document.getElementById('wc-f-monto');
    if (montoEl) montoEl.value = total > 0 ? total.toFixed(2) : '';
}

async function openManualModal() {
    document.getElementById('modal-manual').classList.add('active');
    wcSelectedClient = null;
    document.getElementById('wc-right-panel').innerHTML =
        '<p class="wc-hint">← Selecciona un cliente para ver su historial<br>o usa los botones de arriba para registrar</p>';
    // Reset to resumen tab
    document.querySelectorAll('.wc-tab-btn').forEach((b,i) => b.classList.toggle('active', i===0));
    document.querySelectorAll('.wc-tab-content').forEach((t,i) => t.classList.toggle('active', i===0));
    await wcRender();
}

async function loadWordCapsBalance() {
    const data = await wcLoadData();
    if (!data) return;
    const totals  = wcGetTotals(data);
    const clients = wcBuildClients(data);
    const wc = projectsData.find(p => p.id === 'word-caps');
    wc.balance    = totals.porCobrar;
    wc.lastUpdate = `${Object.keys(clients).length} cliente${Object.keys(clients).length !== 1 ? 's' : ''}`;
    calculateGlobalBalance();
    renderProjects();
}

// === DASHBOARD CORE ===

function renderDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-ES', options);
}

function calculateGlobalBalance() {
    const total = projectsData.reduce((acc, p) => acc + (p.balance || 0), 0);
    document.getElementById('total-balance').textContent = formatSoles(total);
}

function getStatusColor(status) {
    if (status === 'online') return 'var(--success)';
    if (status === 'manual') return 'var(--warning)';
    return 'var(--text-dim)';
}

function getStatusLabel(status) {
    if (status === 'online') return 'Activo';
    if (status === 'manual') return 'Manual';
    if (status === 'building') return 'En construcción';
    return 'Inactivo';
}

function renderProjects() {
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '';

    projectsData.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'project-card glass';
        card.style.animationDelay = `${index * 0.08}s`;

        let btnHtml;
        if (project.modalId) {
            btnHtml = `<button class="btn-view" onclick="openProjectModal('${project.modalId}')">Gestionar →</button>`;
        } else if (project.isManual) {
            btnHtml = `<button class="btn-view" onclick="openManualModal()">Gestionar →</button>`;
        } else if (project.path && project.path !== '#') {
            btnHtml = `<a href="${project.path}" class="btn-view" target="_blank" rel="noopener">Abrir →</a>`;
        } else {
            btnHtml = `<span class="btn-view btn-disabled">Próximamente</span>`;
        }

        card.innerHTML = `
            <div class="project-icon">${project.icon}</div>
            <h3 class="project-title">${project.name}</h3>
            <div class="project-status">
                <span class="status-dot" style="background: ${getStatusColor(project.status)}"></span>
                ${getStatusLabel(project.status)} · ${project.lastUpdate}
            </div>
            <div class="project-footer">
                <div class="project-account">${formatSoles(project.balance)}</div>
                ${btnHtml}
            </div>
        `;

        grid.appendChild(card);
    });
}

// === MODALES (genérico) ===
function openProjectModal(modalId) {
    if (modalId === 'modal-radio') {
        openRadioModal();
    } else if (modalId === 'modal-cerebro') {
        openCerebroModal();
    } else if (modalId === 'modal-gorras') {
        openGorrasModal();
    } else if (modalId === 'modal-crm') {
        openCrmModal();
    } else {
        document.getElementById(modalId)?.classList.add('active');
    }
}

function initModalClose() {
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.onclick = () => btn.closest('.modal')?.classList.remove('active');
    });
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// === MÓDULO: CEREBRO ERP (Firebase) ===
const ERP_FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBkuj8-5is0EY7VPq_1-ilGeL-QayUGcqw',
    authDomain: 'cerebro-erp.firebaseapp.com',
    projectId: 'cerebro-erp',
    storageBucket: 'cerebro-erp.firebasestorage.app',
    messagingSenderId: '857696146386',
    appId: '1:857696146386:web:04e9b94a52670a193cee0b',
};

let erpDb, erpAuth;

function initFirebase() {
    const erpApp = firebase.initializeApp(ERP_FIREBASE_CONFIG, 'cerebro');
    erpDb = firebase.firestore(erpApp);
    erpAuth = firebase.auth(erpApp);

    erpAuth.onAuthStateChanged(async (user) => {
        if (user) {
            const result = await loadERPData();
            if (result) updateERPCard(result);
        }
    });
}

async function openCerebroModal() {
    document.getElementById('modal-cerebro').classList.add('active');
    if (erpAuth && erpAuth.currentUser) {
        showERPData(erpAuth.currentUser);
        await renderERPData();
    } else {
        showERPConnect();
    }
}

function showERPConnect() {
    document.getElementById('cerebro-connect-form').style.display = 'block';
    document.getElementById('cerebro-data').style.display = 'none';
}

function showERPData(user) {
    document.getElementById('cerebro-connect-form').style.display = 'none';
    document.getElementById('cerebro-data').style.display = 'block';
    document.getElementById('cerebro-user-email').textContent = user.email;
}

async function loadERPData() {
    try {
        const snapshot = await erpDb.collection('orders').get();
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalVentas = orders.reduce((acc, o) => acc + (o.financials?.totalPrice || 0), 0);
        const cobrado    = orders.reduce((acc, o) => acc + (o.financials?.paidAmount || 0), 0);
        const gastos     = orders.reduce((acc, o) => acc + (o.financials?.totalExpenses || 0), 0);
        const pendiente  = totalVentas - cobrado;
        const activas    = orders.filter(o => o.status !== 'Cobrado');
        return { orders, activas, totalVentas, cobrado, gastos, pendiente };
    } catch (e) {
        console.error('Error leyendo ERP:', e);
        return null;
    }
}

function updateERPCard(result) {
    const erp = projectsData.find(p => p.id === 'cerebro');
    erp.balance = result.cobrado;
    erp.lastUpdate = `${result.activas.length} orden${result.activas.length !== 1 ? 'es' : ''} activa${result.activas.length !== 1 ? 's' : ''}`;
    calculateGlobalBalance();
    renderProjects();
}

async function renderERPData() {
    const list = document.getElementById('erp-orders-list');
    list.innerHTML = '<li class="tx-empty">Cargando...</li>';

    const result = await loadERPData();
    if (!result) {
        list.innerHTML = '<li class="tx-empty error-msg">⚠️ Error al leer datos del ERP.</li>';
        return;
    }

    const { activas, totalVentas, cobrado, gastos, pendiente } = result;
    document.getElementById('erp-total-ventas').textContent = formatSoles(totalVentas);
    document.getElementById('erp-cobrado').textContent      = formatSoles(cobrado);
    document.getElementById('erp-pendiente').textContent    = formatSoles(pendiente);
    document.getElementById('erp-gastos').textContent       = formatSoles(gastos);
    updateERPCard(result);

    if (activas.length === 0) {
        list.innerHTML = '<li class="tx-empty">Sin órdenes en producción.</li>';
        return;
    }

    const statusColor = {
        'Cotización': 'estado-inactivo', 'Coordinación': 'estado-inactivo',
        'Revisión Stock': 'estado-inactivo', 'Compras': 'estado-inactivo',
        'Corte': 'estado-activo', 'Bordado': 'estado-activo',
        'Confección': 'estado-activo', 'Control Calidad': 'estado-activo',
        'Entrega': 'estado-vencido',
    };

    list.innerHTML = activas.slice(0, 10).map(o => `
        <li class="sponsor-item">
            <div class="sponsor-left">
                <span class="sponsor-name">${o.clientName || 'Cliente'}</span>
                <span class="sponsor-detail">#${o.id?.slice(-6) || '—'}</span>
            </div>
            <div class="sponsor-right">
                <span class="sponsor-badge ${statusColor[o.status] || 'estado-inactivo'}">${o.status}</span>
                <span class="sponsor-amount">${formatSoles(o.financials?.totalPrice || 0)}</span>
            </div>
        </li>
    `).join('');
}

function initCerebroForm() {
    const form    = document.getElementById('form-cerebro-auth');
    const errorEl = document.getElementById('cerebro-auth-error');
    const btn     = document.getElementById('btn-cerebro-connect');

    form.onsubmit = async (e) => {
        e.preventDefault();
        btn.disabled = true;
        btn.textContent = 'Conectando...';
        errorEl.style.display = 'none';

        try {
            const result = await erpAuth.signInWithEmailAndPassword(
                document.getElementById('erp-email').value,
                document.getElementById('erp-password').value
            );
            showERPData(result.user);
            await renderERPData();
        } catch (err) {
            const msg = err.code === 'auth/unauthorized-domain'
                ? '⚠️ Dominio no autorizado. Agrega maetro.netlify.app en Firebase Console → Authentication → Settings → Authorized domains.'
                : err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
                ? 'Contraseña incorrecta.'
                : err.code === 'auth/user-not-found'
                ? 'No existe una cuenta con ese correo.'
                : `Error: ${err.message}`;
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        }

        btn.textContent = 'Conectar CEREBRO ERP';
        btn.disabled = false;
    };

    document.getElementById('btn-cerebro-disconnect').onclick = async () => {
        await erpAuth.signOut();
        showERPConnect();
        const erp = projectsData.find(p => p.id === 'cerebro');
        erp.balance = 0;
        erp.lastUpdate = 'Sin conectar';
        calculateGlobalBalance();
        renderProjects();
    };
}

// === MÓDULO: TODO PARA GORRA (Firebase) ===
const GORRAS_FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCcqj26gP720MgumMws-Nyx4bLrFpIwtyA',
    authDomain: 'todoparagorras-5968e.firebaseapp.com',
    projectId: 'todoparagorras-5968e',
    storageBucket: 'todoparagorras-5968e.firebasestorage.app',
    messagingSenderId: '765727380045',
    appId: '1:765727380045:web:2c0ee1d03c3c435dc70204',
};

let gorrasDb, gorrasAuth;

function initGorrasFirebase() {
    const gorrasApp = firebase.initializeApp(GORRAS_FIREBASE_CONFIG, 'gorras');
    gorrasDb   = firebase.firestore(gorrasApp);
    gorrasAuth = firebase.auth(gorrasApp);

    gorrasAuth.onAuthStateChanged(async (user) => {
        if (user) {
            const result = await loadGorrasData();
            if (result) updateGorrasCard(result);
        }
    });
}

async function openGorrasModal() {
    document.getElementById('modal-gorras').classList.add('active');
    if (gorrasAuth && gorrasAuth.currentUser) {
        showGorrasData(gorrasAuth.currentUser);
        await renderGorrasData();
    } else {
        showGorrasConnect();
    }
}

function showGorrasConnect() {
    document.getElementById('gorras-connect-form').style.display = 'block';
    document.getElementById('gorras-data').style.display = 'none';
}

function showGorrasData(user) {
    document.getElementById('gorras-connect-form').style.display = 'none';
    document.getElementById('gorras-data').style.display = 'block';
    document.getElementById('gorras-user-email').textContent = user.email;
}

async function loadGorrasData() {
    try {
        const [proformasSnap, clientsSnap] = await Promise.all([
            gorrasDb.collection('proformas').get(),
            gorrasDb.collection('clients').get(),
        ]);

        const proformas = proformasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const totalClientes = clientsSnap.size;

        const activas   = proformas.filter(p => !['Entregado', 'Cancelado'].includes(p.status));
        const cobradas  = proformas.filter(p => p.status === 'Entregado');
        const totalVentas  = proformas.filter(p => p.status !== 'Cancelado').reduce((a, p) => a + (p.total || 0), 0);
        const cobrado      = cobradas.reduce((a, p) => a + (p.total || 0), 0);
        const porCobrar    = activas.reduce((a, p) => a + (p.total || 0), 0);

        return { proformas, activas, totalVentas, cobrado, porCobrar, totalClientes };
    } catch (e) {
        console.error('Error leyendo GORRA:', e);
        return null;
    }
}

function updateGorrasCard(result) {
    const gorras = projectsData.find(p => p.id === 'gorras');
    gorras.balance = result.porCobrar;
    gorras.lastUpdate = `${result.activas.length} proforma${result.activas.length !== 1 ? 's' : ''} activa${result.activas.length !== 1 ? 's' : ''}`;
    calculateGlobalBalance();
    renderProjects();
}

async function renderGorrasData() {
    const list = document.getElementById('gorras-proformas-list');
    list.innerHTML = '<li class="tx-empty">Cargando...</li>';

    const result = await loadGorrasData();
    if (!result) {
        list.innerHTML = '<li class="tx-empty error-msg">⚠️ Error al leer datos de GORRA.</li>';
        return;
    }

    const { activas, totalVentas, cobrado, porCobrar, totalClientes } = result;
    document.getElementById('gorras-total-ventas').textContent = formatSoles(totalVentas);
    document.getElementById('gorras-cobrado').textContent     = formatSoles(cobrado);
    document.getElementById('gorras-pendiente').textContent   = formatSoles(porCobrar);
    document.getElementById('gorras-clientes').textContent    = totalClientes;
    updateGorrasCard(result);

    if (activas.length === 0) {
        list.innerHTML = '<li class="tx-empty">Sin proformas activas.</li>';
        return;
    }

    const statusColor = {
        'Cotización':       'estado-inactivo',
        'Pendiente de Pago':'estado-vencido',
        'Procesando':       'estado-activo',
        'Enviado':          'estado-activo',
    };

    list.innerHTML = activas.slice(0, 10).map(p => `
        <li class="sponsor-item">
            <div class="sponsor-left">
                <span class="sponsor-name">${p.clientName || 'Cliente'}</span>
                <span class="sponsor-detail">${p.number || p.id?.slice(-6)} · ${p.createdAt?.slice(0, 10) || ''}</span>
            </div>
            <div class="sponsor-right">
                <span class="sponsor-badge ${statusColor[p.status] || 'estado-inactivo'}">${p.status}</span>
                <span class="sponsor-amount">${formatSoles(p.total || 0)}</span>
            </div>
        </li>
    `).join('');
}

function initGorrasForm() {
    const form    = document.getElementById('form-gorras-auth');
    const errorEl = document.getElementById('gorras-auth-error');
    const btn     = document.getElementById('btn-gorras-connect');

    form.onsubmit = async (e) => {
        e.preventDefault();
        btn.disabled = true;
        btn.textContent = 'Conectando...';
        errorEl.style.display = 'none';

        try {
            const result = await gorrasAuth.signInWithEmailAndPassword(
                document.getElementById('gorras-email').value,
                document.getElementById('gorras-password').value
            );
            showGorrasData(result.user);
            await renderGorrasData();
        } catch (err) {
            const msg = err.code === 'auth/unauthorized-domain'
                ? '⚠️ Dominio no autorizado. Agrega maetro.netlify.app en Firebase Console → Authentication → Settings → Authorized domains.'
                : err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
                ? 'Contraseña incorrecta.'
                : err.code === 'auth/user-not-found'
                ? 'No existe una cuenta con ese correo.'
                : `Error: ${err.message}`;
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        }

        btn.textContent = 'Conectar TODO PARA GORRA';
        btn.disabled = false;
    };

    document.getElementById('btn-gorras-disconnect').onclick = async () => {
        await gorrasAuth.signOut();
        showGorrasConnect();
        const gorras = projectsData.find(p => p.id === 'gorras');
        gorras.balance = 0;
        gorras.lastUpdate = 'Sin conectar';
        calculateGlobalBalance();
        renderProjects();
    };
}

// === MÓDULO: CRM IA Textil (mismo Supabase que Radio) ===
const CRM_ETAPA_LABEL = {
    new_lead:    'Nuevo Lead',
    quote:       'Cotización',
    negotiation: 'Negociación',
    logistics:   'Logística',
    closed_won:  'Ganado',
    closed_lost: 'Perdido',
};

const CRM_ETAPA_COLOR = {
    new_lead:    'estado-inactivo',
    quote:       'estado-inactivo',
    negotiation: 'estado-vencido',
    logistics:   'estado-activo',
    closed_won:  'estado-activo',
    closed_lost: 'estado-inactivo',
};

async function openCrmModal() {
    document.getElementById('modal-crm').classList.add('active');
    await renderCrmData();
}

async function loadCrmNegocios() {
    const { data, error } = await supabaseClient
        .from('crm_negocios')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) { console.error('Error CRM:', error.message); return null; }
    return data || [];
}

async function renderCrmData() {
    const list = document.getElementById('crm-negocios-list');
    list.innerHTML = '<li class="tx-empty">Cargando...</li>';

    const data = await loadCrmNegocios();
    if (data === null) {
        list.innerHTML = '<li class="tx-empty error-msg">⚠️ Error al conectar. Verifica que la tabla exista.</li>';
        return;
    }

    const activos    = data.filter(n => n.etapa !== 'closed_lost');
    const ganados    = data.filter(n => n.etapa === 'closed_won');
    const negociando = data.filter(n => n.etapa === 'negotiation');

    const pipelineTotal = activos.reduce((a, n) => a + (parseFloat(n.valor) || 0), 0);
    const totalGanado   = ganados.reduce((a, n) => a + (parseFloat(n.valor) || 0), 0);
    const totalNeg      = negociando.reduce((a, n) => a + (parseFloat(n.valor) || 0), 0);

    document.getElementById('crm-pipeline-total').textContent = formatSoles(pipelineTotal);
    document.getElementById('crm-ganado').textContent         = formatSoles(totalGanado);
    document.getElementById('crm-negociacion').textContent    = formatSoles(totalNeg);
    document.getElementById('crm-count').textContent          = activos.length;

    const crm = projectsData.find(p => p.id === 'crm-textil');
    crm.balance    = pipelineTotal;
    crm.lastUpdate = `${activos.length} negocio${activos.length !== 1 ? 's' : ''} activo${activos.length !== 1 ? 's' : ''}`;
    calculateGlobalBalance();
    renderProjects();

    if (data.length === 0) {
        list.innerHTML = '<li class="tx-empty">Sin negocios registrados aún.</li>';
        return;
    }

    list.innerHTML = activos.slice(0, 10).map(n => `
        <li class="sponsor-item">
            <div class="sponsor-left">
                <span class="sponsor-name">${n.cliente}${n.empresa ? ` — ${n.empresa}` : ''}</span>
                ${n.producto ? `<span class="sponsor-detail">${n.producto}</span>` : ''}
                ${n.telefono ? `<span class="sponsor-detail">📞 ${n.telefono}</span>` : ''}
            </div>
            <div class="sponsor-right">
                <span class="sponsor-badge ${CRM_ETAPA_COLOR[n.etapa] || 'estado-inactivo'}">${CRM_ETAPA_LABEL[n.etapa] || n.etapa}</span>
                <span class="sponsor-amount">${formatSoles(parseFloat(n.valor) || 0)}</span>
                <button class="btn-delete-tx" onclick="deleteCrmNegocio('${n.id}')" title="Eliminar">✕</button>
            </div>
        </li>
    `).join('');
}

async function deleteCrmNegocio(id) {
    if (!confirm('¿Eliminar este negocio?')) return;
    const { error } = await supabaseClient.from('crm_negocios').delete().eq('id', id);
    if (error) { alert('Error al eliminar: ' + error.message); return; }
    await renderCrmData();
}

function initCrmForm() {
    const form = document.getElementById('form-crm-negocio');
    const btn  = document.getElementById('btn-add-negocio');

    form.onsubmit = async (e) => {
        e.preventDefault();
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        const negocio = {
            cliente:  document.getElementById('crm-cliente').value.trim(),
            producto: document.getElementById('crm-producto').value.trim() || null,
            valor:    parseFloat(document.getElementById('crm-valor').value) || 0,
            etapa:    document.getElementById('crm-etapa').value,
            telefono: document.getElementById('crm-telefono').value.trim() || null,
            prioridad:document.getElementById('crm-prioridad').value,
            notas:    document.getElementById('crm-notas').value.trim() || null,
        };

        const { error } = await supabaseClient.from('crm_negocios').insert([negocio]);
        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            btn.textContent = '✅ Guardado';
            form.reset();
            await renderCrmData();
            setTimeout(() => { btn.textContent = '+ Registrar Negocio'; btn.disabled = false; }, 1500);
            return;
        }
        btn.textContent = '+ Registrar Negocio';
        btn.disabled = false;
    };
}

async function loadCrmBalance() {
    const data = await loadCrmNegocios();
    if (!data) return;
    const activos = data.filter(n => n.etapa !== 'closed_lost');
    const total   = activos.reduce((a, n) => a + (parseFloat(n.valor) || 0), 0);
    const crm = projectsData.find(p => p.id === 'crm-textil');
    crm.balance    = total;
    crm.lastUpdate = `${activos.length} negocio${activos.length !== 1 ? 's' : ''} activo${activos.length !== 1 ? 's' : ''}`;
    calculateGlobalBalance();
    renderProjects();
}

// === MÓDULO: Radio La Nueva 540 ===
async function openRadioModal() {
    document.getElementById('modal-radio').classList.add('active');
    await renderAuspiciadores();
}

async function loadAuspiciadores() {
    try {
        const res = await fetch('https://la-nueva-540.com/api/auspiciadores');
        if (!res.ok) throw new Error('Fallo al cargar datos');
        return await res.json();
    } catch (error) {
        console.error('Error Cloudflare API:', error.message);
        return null;
    }
}

async function renderAuspiciadores() {
    const list = document.getElementById('auspiciadores-list');
    const totalEl = document.getElementById('radio-total-mensual');
    const countEl = document.getElementById('radio-count-activos');

    list.innerHTML = '<li class="tx-empty">Cargando datos...</li>';

    const data = await loadAuspiciadores();

    if (data === null) {
        list.innerHTML = '<li class="tx-empty error-msg">⚠️ Error al conectar con Cloudflare API. (Probablemente la tabla no exista aún en D1).</li>';
        return;
    }

    if (data.length === 0) {
        list.innerHTML = '<li class="tx-empty">No hay auspiciadores registrados aún.</li>';
        totalEl.textContent = formatSoles(0);
        countEl.textContent = '0';
        updateRadioCard(0, 0);
        return;
    }

    const activos = data.filter(a => a.estado === 'activo');
    const totalMensual = activos.reduce((acc, a) => acc + (parseFloat(a.monto_mensual) || 0), 0);

    totalEl.textContent = formatSoles(totalMensual);
    countEl.textContent = activos.length;
    updateRadioCard(totalMensual, data.length);

    const estadoLabel = { activo: 'Activo', inactivo: 'Inactivo', vencido: 'Vencido' };

    list.innerHTML = data.map(a => `
        <li class="sponsor-item">
            <div class="sponsor-left">
                <span class="sponsor-name">${a.nombre}</span>
                ${a.tipo_pauta ? `<span class="sponsor-detail">${a.tipo_pauta}</span>` : ''}
                ${a.telefono ? `<span class="sponsor-detail">📞 ${a.telefono}</span>` : ''}
                ${a.notas ? `<span class="sponsor-detail sponsor-notes">${a.notas}</span>` : ''}
            </div>
            <div class="sponsor-right">
                <span class="sponsor-badge estado-${a.estado}">${estadoLabel[a.estado] || a.estado}</span>
                <span class="sponsor-amount">${formatSoles(parseFloat(a.monto_mensual) || 0)}/mes</span>
                <button class="btn-delete-tx" onclick="deleteAuspiciador('${a.id}')" title="Eliminar">✕</button>
            </div>
        </li>
    `).join('');
    
    // Refresh the logs automatically
    renderRadioLogs();
}

async function renderRadioLogs() {
    const list = document.getElementById('radio-logs-list');
    if (!list) return;
    
    list.innerHTML = '<li class="tx-empty">Cargando bitácora...</li>';
    
    try {
        const res = await fetch('https://la-nueva-540.com/api/ads?logs=true');
        if (!res.ok) throw new Error('Fallo al obtener bitácora');
        const logs = await res.json();
        
        if (!logs || logs.length === 0) {
            list.innerHTML = '<li class="tx-empty">Aún no hay registros de spots emitidos.</li>';
            return;
        }
        
        list.innerHTML = logs.map(log => {
            // Asume que la fecha viene en formato UTC o ISO
            // Si viene sin "Z", le forzamos a ser interpretada según convenga, pero Date() de JS lo intentará.
            let dateObj = new Date(log.played_at);
            if (isNaN(dateObj.getTime()) && log.played_at) {
               dateObj = new Date(log.played_at + 'Z'); 
            }
            
            let timeStr = log.played_at;
            let dateStr = '';
            if (!isNaN(dateObj.getTime())) {
                timeStr = dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                dateStr = dateObj.toLocaleDateString('es-PE');
            }
            
            return `
                <li class="log-item">
                    <div class="log-item-left">
                        <div class="log-item-status-glow"></div>
                        <div class="log-item-content">
                            <span class="log-item-title">${log.ad_title || 'SPOT'}</span>
                            <span class="log-item-sub">EMISIÓN EXITOSA</span>
                        </div>
                    </div>
                    <div class="log-item-right">
                        <div class="log-time-pill">${timeStr}</div>
                        <div class="log-date">${dateStr}</div>
                    </div>
                </li>
            `;
        }).join('');
    } catch (err) {
        list.innerHTML = '<li class="tx-empty error-msg">⚠️ Error al cargar la bitácora.</li>';
        console.error(err);
    }
}

function updateRadioCard(totalMensual, totalCount) {
    const radio = projectsData.find(p => p.id === 'radio');
    radio.balance = totalMensual;
    radio.lastUpdate = totalCount > 0
        ? `${totalCount} auspiciador${totalCount !== 1 ? 'es' : ''}`
        : 'Sin auspiciadores';
    calculateGlobalBalance();
    renderProjects();
}

async function deleteAuspiciador(id) {
    if (!confirm('¿Eliminar este auspiciador?')) return;
    try {
        const res = await fetch(`https://la-nueva-540.com/api/auspiciadores?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Fallo al eliminar');
        await renderAuspiciadores();
    } catch (error) {
        alert('Error al eliminar: ' + error.message);
    }
}

function initRadioForm() {
    const form = document.getElementById('form-auspiciador');
    const btn = document.getElementById('btn-add-sponsor');

    form.onsubmit = async (e) => {
        e.preventDefault();
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        const newSponsor = {
            nombre: document.getElementById('sp-nombre').value.trim(),
            ruc: document.getElementById('sp-ruc').value.trim() || null,
            telefono: document.getElementById('sp-telefono').value.trim() || null,
            monto_mensual: parseFloat(document.getElementById('sp-monto').value) || 0,
            tipo_pauta: document.getElementById('sp-pauta').value.trim() || null,
            estado: document.getElementById('sp-estado').value,
            notas: document.getElementById('sp-notas').value.trim() || null,
        };

        try {
            const res = await fetch('https://la-nueva-540.com/api/auspiciadores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSponsor)
            });
            const result = await res.json();
            if (!res.ok || result.error) throw new Error(result.error || 'Fallo al guardar');
        } catch (error) {
            alert('Error al guardar: ' + error.message);
            btn.textContent = '+ Agregar Auspiciador';
            btn.disabled = false;
            return;
        }

        btn.textContent = '✅ Guardado';
        form.reset();
        await renderAuspiciadores();

        setTimeout(() => {
            btn.textContent = '+ Agregar Auspiciador';
            btn.disabled = false;
        }, 1500);
    };
}

// Carga el balance de Radio al iniciar (sin abrir modal)
async function loadRadioBalance() {
    const data = await loadAuspiciadores();
    if (!data) return;
    const activos = data.filter(a => a.estado === 'activo');
    const totalMensual = activos.reduce((acc, a) => acc + (parseFloat(a.monto_mensual) || 0), 0);
    updateRadioCard(totalMensual, data.length);
}

// === NAVEGACIÓN ===
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('page-active'));
    document.getElementById(`page-${pageId}`).classList.add('page-active');
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    document.getElementById(`nav-${pageId}`).classList.add('active');
    if (pageId === 'accounts') renderAccountsPage();
    if (pageId === 'projects') renderProjectsPage();
    if (pageId === 'settings') renderSettingsPage();
}

// === PAGE: Cuentas Globales ===
function renderAccountsPage() {
    const total    = projectsData.reduce((acc, p) => acc + (p.balance || 0), 0);
    const active   = projectsData.filter(p => p.status === 'online' || p.status === 'manual').length;
    const building = projectsData.filter(p => p.status === 'building').length;

    document.getElementById('acc-total-balance').textContent  = formatSoles(total);
    document.getElementById('acc-active-count').textContent   = active;
    document.getElementById('acc-building-count').textContent = building;
    document.getElementById('accounts-total-row').textContent = formatSoles(total);

    document.getElementById('accounts-rows').innerHTML = projectsData.map(p => `
        <tr>
            <td><span style="margin-right:8px;">${p.icon}</span>${p.name}</td>
            <td>
                <span class="status-dot" style="background:${getStatusColor(p.status)};display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>
                ${getStatusLabel(p.status)}
            </td>
            <td class="acc-dim">${p.lastUpdate}</td>
            <td class="acc-amount">${formatSoles(p.balance)}</td>
        </tr>
    `).join('');

    const list = document.getElementById('acc-transactions');
    list.innerHTML = '<li class="tx-empty">Cargando movimientos...</li>';
    wcLoadData().then(data => {
        if (!data || data.length === 0) {
            list.innerHTML = '<li class="tx-empty">Sin movimientos en Word Caps.</li>';
            return;
        }
        const movs = data.filter(m => m.tipo !== 'compra').slice(0, 6);
        list.innerHTML = movs.map(m => `
            <li class="transaction-item">
                <span class="t-date">${m.fecha}</span>
                <span class="t-client">${m.cliente || '—'}</span>
                <span class="t-type-${m.tipo === 'cobro' ? 'cobranza' : 'entrega'}">${m.tipo === 'cobro' ? '💰 Cobro' : '📦 Entrega'}</span>
                <span class="t-amount ${m.tipo === 'cobro' ? 'positive' : 'negative'}">
                    ${m.tipo === 'cobro' ? '+' : '-'}${formatSoles(parseFloat(m.monto))}
                </span>
            </li>
        `).join('');
    });
}

// === PAGE: Mis Negocios ===
const PROJECT_DESC = {
    'radio':     'Gestión de auspiciadores, eventos y saludos en vivo.',
    'cosmos':    'Plataforma de streaming tipo Netflix. En construcción.',
    'cerebro':   'ERP completo: órdenes de producción, inventario, finanzas y cobros.',
    'gorras':    'Importación y venta de gorras y maquinaria textil.',
    'crm-textil':'CRM con IA para leads y pipeline de ventas del sector textil.',
    'entrust':   'Catálogo de productos. Sin backend aún.',
    'word-caps': 'Registro manual de entregas y cobranzas.',
};

function renderProjectsPage() {
    const total    = projectsData.length;
    const active   = projectsData.filter(p => p.status === 'online' || p.status === 'manual').length;
    const building = projectsData.filter(p => p.status === 'building').length;

    document.getElementById('biz-total').textContent    = total;
    document.getElementById('biz-active').textContent   = active;
    document.getElementById('biz-building').textContent = building;

    document.getElementById('biz-list').innerHTML = projectsData.map(p => {
        let btn;
        if (p.modalId)      btn = `<button class="btn-view" onclick="navigateTo('dashboard');setTimeout(()=>openProjectModal('${p.modalId}'),50)">Gestionar →</button>`;
        else if (p.isManual) btn = `<button class="btn-view" onclick="navigateTo('dashboard');setTimeout(()=>openManualModal(),50)">Gestionar →</button>`;
        else if (p.path && p.path !== '#') btn = `<a href="${p.path}" class="btn-view" target="_blank" rel="noopener">Abrir →</a>`;
        else btn = `<span class="btn-view btn-disabled">Próximamente</span>`;

        return `
        <div class="biz-row glass">
            <div class="biz-row-left">
                <span class="biz-icon">${p.icon}</span>
                <div>
                    <h3 class="biz-name">${p.name}</h3>
                    <p class="biz-desc">${PROJECT_DESC[p.id] || ''}</p>
                </div>
            </div>
            <div class="biz-row-right">
                <span class="sponsor-badge ${p.status === 'online' ? 'estado-activo' : p.status === 'manual' ? 'estado-inactivo' : 'estado-inactivo'}">${getStatusLabel(p.status)}</span>
                <span class="biz-balance">${formatSoles(p.balance)}</span>
                ${btn}
            </div>
        </div>`;
    }).join('');
}

// === PAGE: Configuración ===
function renderSettingsPage() {
    const savedName = localStorage.getItem('maestro_admin_name') || '';
    document.getElementById('settings-name').value = savedName;

    const erpUser    = typeof erpAuth !== 'undefined' ? erpAuth.currentUser : null;
    const gorrasUser = typeof gorrasAuth !== 'undefined' ? gorrasAuth.currentUser : null;

    document.getElementById('settings-connections').innerHTML = `
        <div class="conn-row">
            <span>🧠 CEREBRO ERP</span>
            ${erpUser
                ? `<span class="connect-badge">✅ ${erpUser.email}</span><button class="btn-disconnect" onclick="erpAuth.signOut();renderSettingsPage();renderProjects();">Desconectar</button>`
                : `<span class="sponsor-badge estado-inactivo">Sin conectar</span><button class="btn-primary" style="padding:4px 14px;font-size:0.8rem;" onclick="navigateTo('dashboard');setTimeout(openCerebroModal,50)">Conectar</button>`}
        </div>
        <div class="conn-row">
            <span>🧢 TODO PARA GORRA</span>
            ${gorrasUser
                ? `<span class="connect-badge">✅ ${gorrasUser.email}</span><button class="btn-disconnect" onclick="gorrasAuth.signOut();renderSettingsPage();renderProjects();">Desconectar</button>`
                : `<span class="sponsor-badge estado-inactivo">Sin conectar</span><button class="btn-primary" style="padding:4px 14px;font-size:0.8rem;" onclick="navigateTo('dashboard');setTimeout(openGorrasModal,50)">Conectar</button>`}
        </div>
    `;

    document.getElementById('settings-links').innerHTML = projectsData
        .filter(p => p.path && p.path !== '#' && !p.isManual)
        .map(p => `
            <a href="${p.path}" class="quick-link" target="_blank" rel="noopener">
                <span>${p.icon}</span><span>${p.name}</span><span style="color:var(--primary);">→</span>
            </a>
        `).join('');

    document.getElementById('btn-save-settings').onclick = () => {
        const name = document.getElementById('settings-name').value.trim();
        if (!name) return;
        localStorage.setItem('maestro_admin_name', name);
        applyAdminName(name);
        const btn = document.getElementById('btn-save-settings');
        btn.textContent = '✅ Guardado';
        setTimeout(() => btn.textContent = 'Guardar', 1500);
    };
}

function applyAdminName(name) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos Días' : hour < 18 ? 'Buenas Tardes' : 'Buenas Noches';
    const initials = name.slice(0, 2).toUpperCase();
    document.getElementById('welcome-title').textContent  = `${greeting}, ${name}`;
    document.getElementById('avatar-initials').textContent = initials;
}

// === MÓDULO: TALLERES Y PLANILLAS ===
let plAllData = [];
let plVerArchivados = false;

async function plLoadData() {
    let query = supabaseClient
        .from('maestro_planillas')
        .select('*')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });
    if (!plVerArchivados) query = query.or('archivado.eq.false,archivado.is.null');
    const { data, error } = await query;
    if (error) { console.error('Planillas error:', error.message); return null; }
    plAllData = data || [];
    return plAllData;
}

function plToggleArchivados() {
    plVerArchivados = !plVerArchivados;
    const btn = document.getElementById('btn-ver-archivados');
    if (btn) btn.textContent = plVerArchivados ? '📂 Ocultar archivados' : '📂 Ver archivados';
    plRender();
}

async function plCerrarPeriodo() {
    const periodo = prompt('Nombre del periodo a cerrar (ej: "Mayo 2026 - 1ra quincena"):');
    if (!periodo) return;
    const ids = plAllData.filter(m => m.pagado === true && !m.archivado).map(m => m.id);
    if (ids.length === 0) { alert('No hay deudas pagadas para archivar.'); return; }
    if (!confirm(`Se archivarán ${ids.length} registros pagados del periodo "${periodo}". ¿Continuar?`)) return;
    const { error } = await supabaseClient
        .from('maestro_planillas')
        .update({ archivado: true, periodo })
        .in('id', ids);
    if (error) { alert('Error: ' + error.message); return; }
    alert(`✓ ${ids.length} registros archivados como "${periodo}".`);
    await plRender();
}

function plVerKardex(personal) {
    const registros = plAllData.filter(m => m.personal === personal)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const iconos = { CORTE: '✂️', CONFECCION: '🧵', CONFECCION_4: '🧵', BORDADO: '🪡', TIENDA: '🏪', OTROS: '📄', CONTADOR: '📊', ADMINISTRACION: '💼', CONTROL_CALIDAD: '🔎' };
    let totalDeuda = 0, totalPagado = 0;
    registros.forEach(m => {
        const monto = Math.abs(parseFloat(m.monto_total) || 0);
        if (m.tipo_registro === 'trabajo_realizado') totalDeuda += monto;
        totalPagado += Math.abs(parseFloat(m.monto_pagado) || 0);
    });
    const saldo = totalDeuda - totalPagado;
    const filas = registros.map(m => {
        const monto = Math.abs(parseFloat(m.monto_total));
        const pagado = Math.abs(parseFloat(m.monto_pagado) || 0);
        const esDeuda = m.tipo_registro === 'trabajo_realizado';
        const estado = m.pagado ? '<span style="color:#16a34a;font-weight:700;">PAGADO</span>' : pagado > 0 ? '<span style="color:#ca8a04;font-weight:700;">A CUENTA</span>' : '<span style="color:#dc2626;font-weight:700;">PENDIENTE</span>';
        return `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 6px;">${m.fecha}</td>
            <td style="padding:8px 6px;">${iconos[m.taller] || ''} ${m.taller}</td>
            <td style="padding:8px 6px;max-width:160px;font-size:0.82rem;">${m.descripcion || '—'}${m.cantidad ? ` [${m.cantidad} uds]` : ''}</td>
            <td style="padding:8px 6px;text-align:right;color:#dc2626;font-weight:600;">${esDeuda ? `S/ ${monto.toFixed(2)}` : '—'}</td>
            <td style="padding:8px 6px;text-align:right;color:#16a34a;font-weight:600;">${pagado > 0 ? `S/ ${pagado.toFixed(2)}` : '—'}</td>
            <td style="padding:8px 6px;text-align:center;">${estado}</td>
            <td style="padding:8px 6px;text-align:center;font-size:0.78rem;color:#94a3b8;">${m.fecha_pago || '—'}</td>
        </tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Kardex — ${personal}</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;padding:30px}
.card{background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;max-width:900px;margin:0 auto}
.header{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:24px 30px}
.header .brand{font-size:0.7rem;letter-spacing:3px;text-transform:uppercase;opacity:0.6}
.header h1{font-size:1.5rem;font-weight:700;margin:4px 0}
.header .sub{font-size:0.85rem;opacity:0.7}
.summary{display:flex;gap:0;border-bottom:1px solid #f1f5f9}
.sum-item{flex:1;padding:16px 20px;text-align:center;border-right:1px solid #f1f5f9}
.sum-item:last-child{border-right:none}
.sum-item .lbl{font-size:0.7rem;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;margin-bottom:4px}
.sum-item .val{font-size:1.3rem;font-weight:800}
.danger{color:#dc2626}.success{color:#16a34a}.warning{color:#ca8a04}
table{width:100%;border-collapse:collapse;font-size:0.88rem}
th{background:#f8fafc;padding:10px 6px;text-align:left;font-size:0.72rem;letter-spacing:1px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0}
.btn-print{display:block;width:calc(100% - 60px);margin:20px 30px;padding:12px;background:#1a1a2e;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:600}
.footer{text-align:center;color:#94a3b8;font-size:0.72rem;padding:12px 30px 20px}
@media print{.btn-print{display:none}body{background:#fff;padding:0}.card{box-shadow:none;border-radius:0}}
</style></head><body><div class="card">
<div class="header">
  <div class="brand">Sistema Maestro · Kardex Individual</div>
  <h1>${personal}</h1>
  <div class="sub">Generado el ${new Date().toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
</div>
<div class="summary">
  <div class="sum-item"><div class="lbl">Total Trabajado</div><div class="val danger">S/ ${totalDeuda.toFixed(2)}</div></div>
  <div class="sum-item"><div class="lbl">Total Pagado</div><div class="val success">S/ ${totalPagado.toFixed(2)}</div></div>
  <div class="sum-item"><div class="lbl">Saldo Pendiente</div><div class="val ${saldo > 0 ? 'warning' : 'success'}">S/ ${saldo.toFixed(2)}</div></div>
  <div class="sum-item"><div class="lbl">Registros</div><div class="val" style="color:#475569;">${registros.length}</div></div>
</div>
<div style="padding:0 0 10px;">
<table>
  <thead><tr>
    <th style="padding:10px 6px;">Fecha</th><th>Taller</th><th>Descripción</th>
    <th style="text-align:right;">Deuda</th><th style="text-align:right;">Pagado</th>
    <th style="text-align:center;">Estado</th><th style="text-align:center;">F. Pago</th>
  </tr></thead>
  <tbody>${filas}</tbody>
</table>
</div>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
<div class="footer">Sistema MAESTRO · Documento generado el ${new Date().toLocaleDateString('es-PE')}</div>
</div></body></html>`;
    const w = window.open('', '_blank', 'width=960,height=750');
    w.document.write(html); w.document.close();
}

function plExportarResumen() {
    const iconos = { CORTE: '✂️', CONFECCION: '🧵', CONFECCION_4: '🧵', BORDADO: '🪡', TIENDA: '🏪', OTROS: '📄', CONTADOR: '📊', ADMINISTRACION: '💼', CONTROL_CALIDAD: '🔎' };
    const pendientes = plAllData.filter(m => m.tipo_registro === 'trabajo_realizado' && !m.pagado);
    let totalPendiente = 0;
    const porPersona = {};
    pendientes.forEach(m => {
        const pend = Math.max(0, Math.abs(parseFloat(m.monto_total)||0) - Math.abs(parseFloat(m.monto_pagado)||0));
        totalPendiente += pend;
        if (!porPersona[m.personal]) porPersona[m.personal] = { taller: m.taller, deudas: [], total: 0 };
        porPersona[m.personal].deudas.push(m);
        porPersona[m.personal].total += pend;
    });
    const ranking = Object.entries(porPersona).sort((a, b) => b[1].total - a[1].total);
    const filas = ranking.map(([nombre, info]) =>
        info.deudas.map((m, i) => {
            const pend = Math.max(0, Math.abs(parseFloat(m.monto_total)||0) - Math.abs(parseFloat(m.monto_pagado)||0));
            return `<tr style="border-bottom:1px solid #f1f5f9;">
                ${i === 0 ? `<td rowspan="${info.deudas.length}" style="padding:8px;font-weight:700;vertical-align:top;border-right:1px solid #e2e8f0;">${iconos[info.taller]||''} ${nombre}</td>` : ''}
                <td style="padding:8px;font-size:0.82rem;">${m.descripcion||'—'}${m.cantidad?` [${m.cantidad} uds]`:''}</td>
                <td style="padding:8px;">${m.fecha}</td>
                <td style="padding:8px;text-align:right;color:#dc2626;font-weight:600;">S/ ${pend.toFixed(2)}</td>
            </tr>`;
        }).join('')
    ).join('');
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Resumen de Planillas</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;padding:30px}
.card{background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:800px;margin:0 auto;overflow:hidden}
.header{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:24px 30px}
.header .brand{font-size:0.7rem;letter-spacing:3px;text-transform:uppercase;opacity:0.6}
.header h1{font-size:1.4rem;font-weight:700;margin:4px 0}
.total-box{background:#fef2f2;border-bottom:2px solid #dc2626;padding:16px 30px;display:flex;justify-content:space-between;align-items:center}
.total-box .lbl{color:#64748b;font-size:0.85rem}
.total-box .val{font-size:1.8rem;font-weight:800;color:#dc2626}
table{width:100%;border-collapse:collapse;font-size:0.88rem}
th{background:#f8fafc;padding:10px 8px;text-align:left;font-size:0.7rem;letter-spacing:1px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0}
.btn-print{display:block;width:calc(100% - 60px);margin:20px 30px;padding:12px;background:#1a1a2e;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:600}
.footer{text-align:center;color:#94a3b8;font-size:0.72rem;padding:0 30px 20px}
@media print{.btn-print{display:none}body{background:#fff;padding:0}.card{box-shadow:none;border-radius:0}}
</style></head><body><div class="card">
<div class="header">
  <div class="brand">Sistema Maestro · Resumen de Planillas</div>
  <h1>Deudas Pendientes al ${new Date().toLocaleDateString('es-PE',{year:'numeric',month:'long',day:'numeric'})}</h1>
</div>
<div class="total-box">
  <span class="lbl">Total adeudado al personal</span>
  <span class="val">S/ ${totalPendiente.toFixed(2)}</span>
</div>
<table>
  <thead><tr><th>Persona / Área</th><th>Descripción</th><th>Fecha</th><th style="text-align:right;">Pendiente</th></tr></thead>
  <tbody>${filas}</tbody>
</table>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
<div class="footer">Sistema MAESTRO · Generado el ${new Date().toLocaleDateString('es-PE')}</div>
</div></body></html>`;
    const w = window.open('', '_blank', 'width=860,height=750');
    w.document.write(html); w.document.close();
}

async function plSaveMov(mov) {
    const { error } = await supabaseClient.from('maestro_planillas').insert([mov]);
    if (error) { alert('Error al guardar: ' + error.message); return false; }
    return true;
}

function plUpdateFormUI() {
    const taller = document.getElementById('pl-trab-taller').value;
    const cantGroup = document.getElementById('pl-trab-cant-group');
    const montoEl = document.getElementById('pl-trab-monto');
    const descLabel = document.getElementById('pl-trab-desc-label');
    const descInput = document.getElementById('pl-trab-desc');
    
    if (taller === 'CORTE' || taller === 'CONFECCION' || taller === 'CONFECCION_4') {
        cantGroup.style.display = 'block';
        montoEl.readOnly = true;
        document.getElementById('pl-trab-cantidad').required = true;
    } else {
        cantGroup.style.display = 'none';
        montoEl.readOnly = false;
        document.getElementById('pl-trab-cantidad').required = false;
        document.getElementById('pl-trab-cantidad').value = '';
        if (taller === 'TIENDA') montoEl.value = '420.00';
        else if (taller === 'CONTROL_CALIDAD') montoEl.value = '760.00';
        else montoEl.value = '';
    }

    if (taller === 'CORTE' || taller === 'CONFECCION' || taller === 'CONFECCION_4' || taller === 'BORDADO') {
        descLabel.textContent = 'Orden de Trabajo / Lote';
        descInput.placeholder = 'Ej: OP-001, M003';
    } else if (taller === 'CONTADOR' || taller === 'ADMINISTRACION' || taller === 'TIENDA' || taller === 'CONTROL_CALIDAD') {
        descLabel.textContent = 'Periodo de Pago';
        descInput.placeholder = 'Ej: Del 01/Abr al 15/Abr';
    } else {
        descLabel.textContent = 'Descripción / Notas';
        descInput.placeholder = 'Detalles opcionales';
    }
}

function plUpdatePagoUI() {
    const taller = document.getElementById('pl-pago-taller').value;
    const descLabel = document.getElementById('pl-pago-desc-label');
    const descInput = document.getElementById('pl-pago-desc');

    if (taller === 'CORTE' || taller === 'CONFECCION' || taller === 'CONFECCION_4' || taller === 'BORDADO') {
        descLabel.textContent = 'A cuenta de Orden / Lote';
        descInput.placeholder = 'Ej: Pago por M003';
    } else if (taller === 'CONTADOR' || taller === 'ADMINISTRACION' || taller === 'TIENDA' || taller === 'CONTROL_CALIDAD') {
        descLabel.textContent = 'Periodo Pagado';
        descInput.placeholder = 'Ej: Pago quincena Abr';
    } else {
        descLabel.textContent = 'Descripción / Notas';
        descInput.placeholder = 'Detalles opcionales';
    }
}

function plCalcMonto() {
    const taller = document.getElementById('pl-trab-taller').value;
    const cant = parseInt(document.getElementById('pl-trab-cantidad').value || 0);
    const montoEl = document.getElementById('pl-trab-monto');
    
    if (taller === 'CORTE') montoEl.value = (cant * 0.5).toFixed(2);
    else if (taller === 'CONFECCION') montoEl.value = (cant * 5.0).toFixed(2);
    else if (taller === 'CONFECCION_4') montoEl.value = (cant * 4.0).toFixed(2);
}

function plCheckAlerts() {
    const today = new Date();
    const d = today.getDate();
    const dow = today.getDay(); // 0 = Domingo, 6 = Sabado
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    let alertas = [];

    // Contador: Dia 1 o 2
    if (d === 1 || d === 2) alertas.push("Contador (Mensual)");
    
    // Control Calidad: 1, 2 y 15, 16
    if (d === 1 || d === 2 || d === 15 || d === 16) alertas.push("Control Calidad (Quincenal)");
    
    // Administradora: 15, 16 y Fin de mes
    if (d === 15 || d === 16 || d === lastDay || d === lastDay - 1) alertas.push("Administración (Quincenal)");
    
    // Tienda: Sabado o Domingo
    if (dow === 6 || dow === 0) alertas.push("Tienda (Semanal)");

    // Vencimientos dinamicos
    if (typeof plAllData !== 'undefined' && plAllData.length > 0) {
        const deudasPersonales = {};
        plAllData.forEach(m => {
            if (m.tipo_registro !== 'trabajo_realizado' || m.pagado) return;
            if (!deudasPersonales[m.personal]) deudasPersonales[m.personal] = { balance: 0, vencimientos: [] };
            deudasPersonales[m.personal].balance += parseFloat(m.monto_total);
            if (m.descripcion && m.descripcion.includes('[Vence:')) {
                const match = m.descripcion.match(/\[Vence: (.*?)\]/);
                if (match) deudasPersonales[m.personal].vencimientos.push(match[1]);
            }
        });

        Object.keys(deudasPersonales).forEach(persona => {
            if (deudasPersonales[persona].balance > 1) { // Deuda pendiente > 1 sol
                deudasPersonales[persona].vencimientos.forEach(vDate => {
                    const vTime = new Date(vDate + 'T00:00:00').getTime();
                    const nowTime = today.getTime();
                    const diffDays = (vTime - nowTime) / (1000 * 60 * 60 * 24);
                    // Avisar 3 dias antes, el mismo dia, o si ya se pasó (hasta 5 dias despues)
                    if (diffDays <= 3 && diffDays >= -5) {
                        alertas.push(`${persona} (Vence el ${vDate})`);
                    }
                });
            }
        });
    }

    const alertsBox = document.getElementById('planillas-alerts');
    if (alertas.length > 0) {
        const unicas = [...new Set(alertas)];
        alertsBox.style.display = 'block';
        alertsBox.innerHTML = `<strong>🔔 ¡Recordatorio de Pagos!</strong><br>Hoy vence (o está por vencer) la planilla de: ${unicas.join(', ')}.`;
    } else {
        alertsBox.style.display = 'none';
    }
}

let plPagoActual = null;

function plAbrirModalPago(id, montoTotal, montoPagadoAcum, personal, taller, descripcion, cantidad, fecha) {
    plPagoActual = { id, montoTotal, montoPagadoAcum, personal, taller, descripcion, cantidad, fecha };
    const restante = montoTotal - montoPagadoAcum;
    document.getElementById('cp-nombre').textContent = personal;
    document.getElementById('cp-taller').textContent = taller;
    document.getElementById('cp-descripcion').textContent = descripcion || '—';
    document.getElementById('cp-deuda-total').textContent = formatSoles(montoTotal);
    const rowAcum = document.getElementById('cp-row-acum');
    if (montoPagadoAcum > 0) {
        rowAcum.style.display = 'flex';
        document.getElementById('cp-acum').textContent = formatSoles(montoPagadoAcum);
    } else {
        rowAcum.style.display = 'none';
    }
    document.getElementById('cp-restante').textContent = formatSoles(restante);
    document.getElementById('cp-monto').value = restante.toFixed(2);
    document.getElementById('cp-monto').removeAttribute('max');
    document.getElementById('cp-fecha').value = localDateStr();
    document.getElementById('modal-confirmar-pago').style.display = 'flex';
    setTimeout(() => document.getElementById('cp-monto').focus(), 100);
}

function plCheckMontoExceso() {
    if (!plPagoActual) return;
    const val = parseFloat(document.getElementById('cp-monto').value) || 0;
    const restante = plPagoActual.montoTotal - plPagoActual.montoPagadoAcum;
    document.getElementById('cp-exceso').style.display = val > restante ? 'block' : 'none';
}

function plCerrarModalPago() {
    document.getElementById('modal-confirmar-pago').style.display = 'none';
    plPagoActual = null;
}

async function plConfirmarPago() {
    if (!plPagoActual) return;
    const montoPagadoAhora = parseFloat(document.getElementById('cp-monto').value);
    if (!montoPagadoAhora || montoPagadoAhora <= 0) { alert('Ingresa un monto válido.'); return; }

    const { id, montoTotal, montoPagadoAcum, personal, taller, descripcion, cantidad, fecha } = plPagoActual;
    const nuevoTotalPagado = montoPagadoAcum + montoPagadoAhora;
    const pagoCompleto = nuevoTotalPagado >= montoTotal - 0.01;
    const today = document.getElementById('cp-fecha').value || localDateStr();

    const btn = document.getElementById('cp-btn-confirmar');
    btn.disabled = true; btn.textContent = 'Guardando...';

    const { error } = await supabaseClient
        .from('maestro_planillas')
        .update({ pagado: pagoCompleto, monto_pagado: nuevoTotalPagado, fecha_pago: today })
        .eq('id', id);

    btn.disabled = false; btn.textContent = '✓ Confirmar Pago';
    if (error) { alert('Error: ' + error.message); return; }

    plCerrarModalPago();
    await plRender();

    plGenerarRecibo({ personal, taller, descripcion, cantidad, fecha,
        monto_total: montoTotal, monto_pagado_ahora: montoPagadoAhora,
        monto_pagado_total: nuevoTotalPagado, fecha_pago: today, pagado: pagoCompleto });
}

function plGenerarRecibo(d) {
    const restante = d.monto_total - d.monto_pagado_total;
    const fechaLarga = new Date(d.fecha_pago + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Recibo — ${d.personal}</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;display:flex;justify-content:center;padding:30px}
.card{background:#fff;width:400px;border-radius:12px;box-shadow:0 4px 30px rgba(0,0,0,0.12);overflow:hidden}
.header{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:24px;text-align:center}
.header .brand{font-size:0.75rem;letter-spacing:3px;text-transform:uppercase;opacity:0.7;margin-bottom:4px}
.header h1{font-size:1.4rem;font-weight:700}
.badge{display:inline-block;margin-top:10px;padding:4px 14px;border-radius:20px;font-size:0.72rem;font-weight:700;letter-spacing:1px;text-transform:uppercase}
.badge.completo{background:#dcfce7;color:#15803d}
.badge.parcial{background:#fef9c3;color:#92400e}
.body{padding:24px}
.section-title{font-size:0.65rem;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:16px 0 8px}
.row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f1f5f9}
.row .lbl{color:#64748b;font-size:0.85rem}
.row .val{font-weight:600;color:#1e293b;font-size:0.9rem;text-align:right;max-width:60%}
.monto-box{margin:20px 0;padding:18px;background:#f0fdf4;border-radius:10px;border:2px solid #16a34a;text-align:center}
.monto-box .lbl{font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:#16a34a;margin-bottom:4px}
.monto-box .monto{font-size:2.2rem;font-weight:800;color:#15803d}
.monto-box .fecha{font-size:0.8rem;color:#64748b;margin-top:4px}
.alerta{background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 14px;font-size:0.82rem;color:#92400e;text-align:center;margin-bottom:16px}
.footer{padding:16px 24px;border-top:1px solid #f1f5f9;text-align:center;color:#94a3b8;font-size:0.72rem}
.btn-print{display:block;width:calc(100% - 48px);margin:0 24px 20px;padding:12px;background:#1a1a2e;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;font-weight:600;transition:background 0.2s}
.btn-print:hover{background:#16213e}
@media print{.btn-print{display:none}body{background:#fff;padding:0}.card{box-shadow:none;border-radius:0;width:100%}}
</style></head><body><div class="card">
<div class="header">
  <div class="brand">Sistema Maestro</div>
  <h1>Comprobante de Pago</h1>
  <span class="badge ${d.pagado ? 'completo' : 'parcial'}">${d.pagado ? '✓ Pago Completo' : '⚠ Pago Parcial — A Cuenta'}</span>
</div>
<div class="body">
  <div class="section-title">Datos del Trabajador</div>
  <div class="row"><span class="lbl">Nombre / Local</span><span class="val">${d.personal}</span></div>
  <div class="row"><span class="lbl">Taller / Área</span><span class="val">${d.taller}</span></div>
  <div class="section-title">Detalle del Trabajo</div>
  <div class="row"><span class="lbl">Descripción</span><span class="val">${d.descripcion || '—'}</span></div>
  ${d.cantidad ? `<div class="row"><span class="lbl">Cantidad</span><span class="val">${d.cantidad} gorras</span></div>` : ''}
  <div class="row"><span class="lbl">Fecha de Trabajo</span><span class="val">${d.fecha}</span></div>
  <div class="row"><span class="lbl">Monto Total de Deuda</span><span class="val">S/ ${parseFloat(d.monto_total).toFixed(2)}</span></div>
  <div class="section-title">Pago Realizado</div>
  <div class="monto-box">
    <div class="lbl">Monto Pagado Ahora</div>
    <div class="monto">S/ ${d.monto_pagado_ahora.toFixed(2)}</div>
    <div class="fecha">${fechaLarga}</div>
  </div>
  ${!d.pagado ? `<div class="alerta">⚠ Saldo pendiente: <strong>S/ ${restante.toFixed(2)}</strong></div>` : restante < 0 ? `<div style="background:#f0fdf4;border:1px solid #16a34a;border-radius:8px;padding:10px 14px;font-size:0.82rem;color:#15803d;text-align:center;margin-bottom:16px;">✓ Saldo a favor (adelanto): <strong>S/ ${Math.abs(restante).toFixed(2)}</strong></div>` : ''}
</div>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
<div class="footer">Documento generado el ${new Date().toLocaleDateString('es-PE')} · Sistema MAESTRO</div>
</div></body></html>`;
    const w = window.open('', '_blank', 'width=480,height=750');
    w.document.write(html); w.document.close();
}

async function plRender() {
    const data = await plLoadData();
    if (!data) return;

    let ghcDeuda = 0, confDeuda = 0, borDeuda = 0, totalDeuda = 0;

    data.forEach(m => {
        if (m.tipo_registro !== 'trabajo_realizado' || m.pagado) return;
        const monto = Math.abs(parseFloat(m.monto_total) || 0);
        const acum = Math.abs(parseFloat(m.monto_pagado) || 0);
        const pendiente = Math.max(0, monto - acum);
        totalDeuda += pendiente;
        if (['CORTE','TIENDA','OTROS','CONTADOR','ADMINISTRACION','CONTROL_CALIDAD'].includes(m.taller)) ghcDeuda += pendiente;
        else if (['CONFECCION','CONFECCION_4'].includes(m.taller)) confDeuda += pendiente;
        else if (m.taller === 'BORDADO') borDeuda += pendiente;
    });

    document.getElementById('planillas-total-deuda').textContent = formatSoles(totalDeuda);
    document.getElementById('planillas-ghc').textContent = formatSoles(ghcDeuda);
    document.getElementById('planillas-confeccion').textContent = formatSoles(confDeuda);
    document.getElementById('planillas-bordados').textContent = formatSoles(borDeuda);

    plCheckAlerts();

    // Update global project
    // totalDeuda > 0 means we OWE money to workers (pending payroll debt)
    // We store it as positive so it shows in the global balance
    const proj = projectsData.find(p => p.id === 'planillas');
    if (proj) {
        proj.balance = totalDeuda; // Deuda pendiente neta (positivo = debemos pagar)
        proj.lastUpdate = `${data.length} registros`;
    }
    calculateGlobalBalance();
    renderProjects();

    plRenderRanking();
    plRenderHistorial();
    plRenderPagosRealizados();
}

async function plDeleteMov(id) {
    if (!confirm('¿Eliminar este registro?')) return;
    const { error } = await supabaseClient.from('maestro_planillas').delete().eq('id', id);
    if (error) { alert('Error al eliminar: ' + error.message); return; }
    await plRender();
}

let plFiltroActivo = 'todas';

function plSetFiltro(filtro) {
    plFiltroActivo = filtro;
    document.querySelectorAll('.pl-filtro-btn').forEach(b => b.classList.remove('pl-filtro-active'));
    document.getElementById('plf-' + filtro).classList.add('pl-filtro-active');
    plRenderHistorial(document.getElementById('pl-search')?.value || '');
}

function plRenderHistorial(searchTerm = '') {
    const list = document.getElementById('planillas-list');
    let filteredData = plAllData.filter(m => m.tipo_registro === 'trabajo_realizado');

    if (plFiltroActivo === 'pendientes') filteredData = filteredData.filter(m => !m.pagado);
    else if (plFiltroActivo === 'pagadas') filteredData = filteredData.filter(m => m.pagado);

    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filteredData = filteredData.filter(m =>
            m.personal.toLowerCase().includes(lowerSearch) ||
            m.taller.toLowerCase().includes(lowerSearch) ||
            (m.descripcion && m.descripcion.toLowerCase().includes(lowerSearch))
        );
    }

    if (filteredData.length === 0) {
        list.innerHTML = '<li class="tx-empty">No se encontraron registros.</li>';
    } else {
        const iconos = { CORTE: '✂️', CONFECCION: '🧵', CONFECCION_4: '🧵', BORDADO: '🪡', TIENDA: '🏪', OTROS: '📄', CONTADOR: '📊', ADMINISTRACION: '💼', CONTROL_CALIDAD: '🔎' };
        const limit = searchTerm ? 50 : 20;
        list.innerHTML = filteredData.slice(0, limit).map(m => {
            const montoTotal = Math.abs(parseFloat(m.monto_total));
            const montoPagadoAcum = Math.abs(parseFloat(m.monto_pagado) || 0);
            const esDeuda = m.tipo_registro === 'trabajo_realizado';
            const pagada = m.pagado === true;
            const aCuenta = esDeuda && !pagada && montoPagadoAcum > 0;
            const pendiente = Math.max(0, montoTotal - montoPagadoAcum);
            const liStyle = pagada ? 'opacity:0.4;' : '';
            const descEscape = (m.descripcion || '').replace(/'/g, "\\'");
            const persEscape = m.personal.replace(/'/g, "\\'");
            let accionBtn = '';
            if (esDeuda && !pagada) {
                accionBtn = `<button class="btn-pagar-deuda" onclick="plAbrirModalPago('${m.id}',${montoTotal},${montoPagadoAcum},'${persEscape}','${m.taller}','${descEscape}',${m.cantidad||0},'${m.fecha}')" title="Registrar pago">✓ Pagar</button>`;
            } else if (pagada) {
                accionBtn = `<span class="badge-pagada">✓ PAGADA</span>`;
            }
            const estadoBadge = aCuenta ? `<span class="badge-acuenta">A CUENTA · Resta ${formatSoles(pendiente)}</span>` : '';
            return `
            <li class="wc-hist-item" style="${liStyle}">
                <span class="wc-hist-icon">${iconos[m.taller] || '📄'}</span>
                <div class="wc-hist-body">
                    <span class="wc-hist-client">${m.personal} <small style="color:var(--text-dim);">(${m.taller})</small></span>
                    <span class="wc-hist-desc">${m.descripcion || (esDeuda ? 'Trabajo' : 'Pago')} ${m.cantidad ? `[${m.cantidad} uds]` : ''}</span>
                    ${estadoBadge}
                </div>
                <div class="wc-hist-meta">
                    <span class="wc-hist-date">${m.fecha}</span>
                    <span class="wc-hist-amount ${esDeuda && !pagada ? 'neg' : 'pos'}">
                        ${esDeuda && !pagada ? '−' : '+'}${formatSoles(esDeuda && !pagada ? pendiente : montoTotal)}
                    </span>
                    ${accionBtn}
                    <button class="btn-delete-tx" onclick="plDeleteMov('${m.id}')" title="Eliminar">✕</button>
                </div>
            </li>`;
        }).join('');
    }
}

function plRenderRanking() {
    const el = document.getElementById('planillas-ranking');
    if (!el) return;
    const porPersona = {};
    plAllData.forEach(m => {
        if (m.tipo_registro !== 'trabajo_realizado' || m.pagado) return;
        const pendiente = Math.max(0, Math.abs(parseFloat(m.monto_total)||0) - Math.abs(parseFloat(m.monto_pagado)||0));
        if (pendiente <= 0) return;
        if (!porPersona[m.personal]) porPersona[m.personal] = { total: 0, taller: m.taller };
        porPersona[m.personal].total += pendiente;
    });
    const ranking = Object.entries(porPersona).sort((a, b) => b[1].total - a[1].total);
    if (ranking.length === 0) { el.innerHTML = ''; return; }
    const max = ranking[0][1].total;
    const iconos = { CORTE: '✂️', CONFECCION: '🧵', CONFECCION_4: '🧵', BORDADO: '🪡', TIENDA: '🏪', OTROS: '📄', CONTADOR: '📊', ADMINISTRACION: '💼', CONTROL_CALIDAD: '🔎' };
    el.innerHTML = `
        <h3 class="section-label" style="margin-bottom:0.75rem;">A quién se le debe más</h3>
        <div style="display:flex; flex-direction:column; gap:8px;">
            ${ranking.map(([nombre, info], i) => {
                const pct = Math.round((info.total / max) * 100);
                const color = i === 0 ? 'var(--danger)' : i === 1 ? 'var(--warning)' : 'var(--text-dim)';
                const nombreEsc = nombre.replace(/'/g, "\\'");
                return `
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:0.8rem; width:18px; text-align:right; color:${color}; font-weight:700;">#${i+1}</span>
                    <span style="font-size:0.85rem; min-width:18px;">${iconos[info.taller] || '📄'}</span>
                    <button onclick="plVerKardex('${nombreEsc}')" style="font-size:0.85rem; font-weight:600; min-width:100px; color:white; background:none; border:none; cursor:pointer; text-align:left; padding:0; text-decoration:underline dotted; text-underline-offset:3px;">${nombre}</button>
                    <div style="flex:1; background:rgba(255,255,255,0.07); border-radius:4px; height:8px; overflow:hidden;">
                        <div style="width:${pct}%; height:100%; background:${color}; border-radius:4px; transition:width 0.4s;"></div>
                    </div>
                    <span style="font-size:0.85rem; font-weight:700; color:${color}; min-width:80px; text-align:right;">${formatSoles(info.total)}</span>
                </div>`;
            }).join('')}
        </div>`;
}

function plRenderPagosRealizados(searchTerm = '') {
    const list = document.getElementById('planillas-pagos-list');
    if (!list) return;
    let data = plAllData.filter(m => m.tipo_registro === 'trabajo_realizado' && (m.pagado || (parseFloat(m.monto_pagado) || 0) > 0));
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        data = data.filter(m => m.personal.toLowerCase().includes(q) || m.taller.toLowerCase().includes(q) || (m.descripcion && m.descripcion.toLowerCase().includes(q)));
    }
    document.getElementById('planillas-pagos-count').textContent = data.length;
    if (data.length === 0) {
        list.innerHTML = '<li class="tx-empty">Sin pagos registrados aún.</li>';
        return;
    }
    const iconos = { CORTE: '✂️', CONFECCION: '🧵', CONFECCION_4: '🧵', BORDADO: '🪡', TIENDA: '🏪', OTROS: '📄', CONTADOR: '📊', ADMINISTRACION: '💼', CONTROL_CALIDAD: '🔎' };
    list.innerHTML = data.slice(0, 60).map(m => {
        const montoTotal = Math.abs(parseFloat(m.monto_total));
        const montoPagado = Math.abs(parseFloat(m.monto_pagado) || 0);
        const restante = Math.max(0, montoTotal - montoPagado);
        const completo = m.pagado === true;
        const persEscape = m.personal.replace(/'/g, "\\'");
        const descEscape = (m.descripcion || '').replace(/'/g, "\\'");
        return `
        <li class="wc-hist-item pl-pago-item">
            <span class="wc-hist-icon">${iconos[m.taller] || '📄'}</span>
            <div class="wc-hist-body">
                <span class="wc-hist-client">${m.personal} <small style="color:var(--text-dim);">(${m.taller})</small></span>
                <span class="wc-hist-desc">${m.descripcion || '—'} ${m.cantidad ? `[${m.cantidad} uds]` : ''}</span>
                <span style="font-size:0.7rem;color:var(--text-dim);">Trabajo: ${m.fecha} ${m.fecha_pago ? `· Pago: ${m.fecha_pago}` : ''}</span>
            </div>
            <div class="wc-hist-meta" style="gap:6px;">
                <div style="text-align:right;">
                    <div style="font-size:0.8rem;color:var(--success);font-weight:700;">Pagado: ${formatSoles(montoPagado)}</div>
                    ${!completo ? `<div style="font-size:0.7rem;color:var(--warning);">Resta: ${formatSoles(restante)}</div>` : ''}
                </div>
                <span class="${completo ? 'badge-pagada' : 'badge-acuenta'}">${completo ? '✓ COMPLETO' : 'A CUENTA'}</span>
                <button class="btn-recibo" onclick="plVerRecibo('${persEscape}','${m.taller}','${descEscape}',${m.cantidad||0},'${m.fecha}',${montoTotal},${montoPagado},'${m.fecha_pago||''}',${completo})" title="Ver recibo">🖨️</button>
            </div>
        </li>`;
    }).join('');
}

function plVerRecibo(personal, taller, descripcion, cantidad, fecha, montoTotal, montoPagado, fechaPago, completo) {
    plGenerarRecibo({ personal, taller, descripcion, cantidad, fecha,
        monto_total: montoTotal, monto_pagado_ahora: montoPagado,
        monto_pagado_total: montoPagado, fecha_pago: fechaPago, pagado: completo });
}

function initPlanillasForms() {
    const formTrab = document.getElementById('form-planillas-trabajo');
    const formPago = document.getElementById('form-planillas-pago');
    const today = localDateStr();

    if (formTrab) formTrab.onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.textContent = 'Guardando...';

        let desc = document.getElementById('pl-trab-desc').value.trim();
        const venc = document.getElementById('pl-trab-venc').value;
        if (venc) {
            desc = desc ? `${desc} [Vence: ${venc}]` : `[Vence: ${venc}]`;
        }

        const mov = {
            fecha: today,
            taller: document.getElementById('pl-trab-taller').value,
            personal: document.getElementById('pl-trab-personal').value.trim(),
            tipo_registro: 'trabajo_realizado',
            cantidad: parseInt(document.getElementById('pl-trab-cantidad').value || 0),
            monto_total: Math.abs(parseFloat(document.getElementById('pl-trab-monto').value)),
            descripcion: desc || null
        };

        const ok = await plSaveMov(mov);
        if (ok) {
            e.target.reset();
            plUpdateFormUI();
        }
        await plRender();
        btn.disabled = false; btn.textContent = '+ Agregar Deuda';
    };

    if (formPago) formPago.onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.textContent = 'Guardando...';

        const mov = {
            fecha: today,
            taller: document.getElementById('pl-pago-taller').value,
            personal: document.getElementById('pl-pago-personal').value.trim(),
            tipo_registro: 'pago_realizado',
            cantidad: 0,
            monto_total: Math.abs(parseFloat(document.getElementById('pl-pago-monto').value)),
            descripcion: document.getElementById('pl-pago-desc').value.trim() || 'Abono/Pago'
        };

        const ok = await plSaveMov(mov);
        if (ok) {
            e.target.reset();
            plUpdatePagoUI();
        }
        await plRender();
        btn.disabled = false; btn.textContent = '✓ Registrar Pago';
    };
}

// === INIT ===
function initDashboard() {
    renderDate();
    renderProjects();
    calculateGlobalBalance();
    initModalClose();
    initFirebase();
    initCerebroForm();
    initGorrasFirebase();
    initGorrasForm();
    initCrmForm();
    initRadioForm();
    initPlanillasForms();
    loadRadioBalance();
    loadCrmBalance();
    loadWordCapsBalance();
    plRender();
    const savedName = localStorage.getItem('maestro_admin_name');
    if (savedName) applyAdminName(savedName);
}

document.addEventListener('DOMContentLoaded', initDashboard);
