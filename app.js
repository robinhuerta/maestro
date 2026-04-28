// MAESTRO — Command Center Dashboard

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
        path: 'https://radioficial540.netlify.app',
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
    }
];

// === WORD CAPS — Sistema de Reventa (Premium) ===
let wcSelectedClient = null;
let wcAllData        = [];   // cache global
let wcChartDonut     = null;
let wcChartBars      = null;

async function wcLoadData() {
    const { data, error } = await supabaseClient
        .from('wc_movimientos')
        .select('*')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });
    if (error) { console.error('WC error:', error.message); return null; }
    wcAllData = data || [];
    return wcAllData;
}

async function wcSaveMov(mov) {
    const { error } = await supabaseClient.from('wc_movimientos').insert([mov]);
    if (error) { alert('Error al guardar: ' + error.message); return false; }
    return true;
}

async function wcDeleteMov(id) {
    if (!confirm('¿Eliminar este movimiento?')) return;
    const { error } = await supabaseClient.from('wc_movimientos').delete().eq('id', id);
    if (error) { alert('Error al eliminar: ' + error.message); return; }
    await wcRender();
}

function wcBuildClients(data) {
    const map = {};
    data.filter(m => m.tipo !== 'compra').forEach(m => {
        if (!map[m.cliente]) map[m.cliente] = { entregado: 0, cobrado: 0, movs: [] };
        if (m.tipo === 'entrega') map[m.cliente].entregado += parseFloat(m.monto);
        else                      map[m.cliente].cobrado   += parseFloat(m.monto);
        map[m.cliente].movs.push(m);
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
        return `
        <li class="wc-hist-item">
            <span class="wc-hist-icon">${iconMap[m.tipo] || '📄'}</span>
            <div class="wc-hist-body">
                <span class="wc-hist-client">${m.cliente || m.proveedor || '—'}</span>
                <span class="wc-hist-desc">${m.descripcion || m.tipo}</span>
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
                return `
            <li class="wc-mov-item ${m.tipo === 'cobro' ? 'wc-mov-cobro' : 'wc-mov-entrega'}">
                <span class="wc-mov-icon">${m.tipo === 'cobro' ? '💰' : '📦'}</span>
                <div class="wc-mov-info">
                    <span class="wc-mov-desc">${m.descripcion || (m.tipo === 'cobro' ? 'Cobro' : 'Entrega')}</span>
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
    const today  = new Date().toISOString().split('T')[0];
    const safeV  = clientePrefill.replace(/"/g, '&quot;');
    const labels = { entrega: 'Registrar Entrega', cobro: 'Registrar Cobro', compra: 'Registrar Compra' };
    const titulo = tipo === 'entrega' ? '📦 Nueva Entrega' : tipo === 'cobro' ? '💰 Registrar Cobro / Abono' : '🛍️ Compra de Stock';
    const descPlaceholder = tipo === 'entrega' ? 'Ej: 3 gorras snapback, 2 polos talla M'
        : tipo === 'cobro' ? 'Ej: Abono, pago completo, adelanto'
        : 'Ej: 50 gorras Gamarra, 20 polos Jirón';

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

    panel.innerHTML = `
        <div class="wc-form-block">
            <h4>${titulo}</h4>
            <form id="form-wc-active">
                ${clienteField}
                <div class="form-group">
                    <label>Descripción</label>
                    <input type="text" id="wc-f-desc" placeholder="${descPlaceholder}">
                </div>
                ${provField}
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
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Monto (S/)</label>
                        <input type="number" id="wc-f-monto" placeholder="0.00" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date" id="wc-f-fecha" value="${today}" required>
                    </div>
                </div>
                <button type="submit" class="btn-primary">${labels[tipo]}</button>
            </form>
        </div>`;

    document.getElementById('form-wc-active').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type=submit]');
        btn.disabled = true; btn.textContent = 'Guardando...';
        const clienteVal = document.getElementById('wc-f-cliente')?.value?.trim() || null;
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
        if (clienteVal) wcSelectedClient = clienteVal;
        const ok = await wcSaveMov(mov);
        if (ok) {
            btn.textContent = '✅ Guardado';
            const savedCliente = clienteVal;
            e.target.reset();
            document.getElementById('wc-f-fecha').value = today;
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
    const { data, error } = await supabaseClient
        .from('radio_auspiciadores')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error Supabase:', error.message);
        return null;
    }
    return data || [];
}

async function renderAuspiciadores() {
    const list = document.getElementById('auspiciadores-list');
    const totalEl = document.getElementById('radio-total-mensual');
    const countEl = document.getElementById('radio-count-activos');

    list.innerHTML = '<li class="tx-empty">Cargando datos...</li>';

    const data = await loadAuspiciadores();

    if (data === null) {
        list.innerHTML = '<li class="tx-empty error-msg">⚠️ Error al conectar con Supabase. Verifica que la tabla exista.</li>';
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
    const { error } = await supabaseClient
        .from('radio_auspiciadores')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error al eliminar: ' + error.message);
        return;
    }
    await renderAuspiciadores();
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

        const { error } = await supabaseClient
            .from('radio_auspiciadores')
            .insert([newSponsor]);

        if (error) {
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

async function plLoadData() {
    const { data, error } = await supabaseClient
        .from('maestro_planillas')
        .select('*')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });
    if (error) { console.error('Planillas error:', error.message); return null; }
    plAllData = data || [];
    return plAllData;
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
    
    if (taller === 'CORTE' || taller === 'CONFECCION') {
        cantGroup.style.display = 'block';
        montoEl.readOnly = true;
        document.getElementById('pl-trab-cantidad').required = true;
    } else {
        cantGroup.style.display = 'none';
        montoEl.readOnly = false;
        document.getElementById('pl-trab-cantidad').required = false;
        document.getElementById('pl-trab-cantidad').value = '';
        if (taller === 'TIENDA') montoEl.value = '420.00';
        else montoEl.value = '';
    }

    if (taller === 'CORTE' || taller === 'CONFECCION' || taller === 'BORDADO') {
        descLabel.textContent = 'Orden de Trabajo / Lote';
        descInput.placeholder = 'Ej: OP-001, M003';
    } else if (taller === 'CONTADOR' || taller === 'ADMINISTRACION' || taller === 'TIENDA') {
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

    if (taller === 'CORTE' || taller === 'CONFECCION' || taller === 'BORDADO') {
        descLabel.textContent = 'A cuenta de Orden / Lote';
        descInput.placeholder = 'Ej: Pago por M003';
    } else if (taller === 'CONTADOR' || taller === 'ADMINISTRACION' || taller === 'TIENDA') {
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
}

async function plRender() {
    const data = await plLoadData();
    if (!data) return;

    let ghcDeuda = 0, confDeuda = 0, borDeuda = 0, totalDeuda = 0;

    data.forEach(m => {
        const monto = parseFloat(m.monto_total);
        const factor = m.tipo_registro === 'trabajo_realizado' ? 1 : -1;
        const val = monto * factor;
        
        totalDeuda += val;
        if (m.taller === 'CORTE' || m.taller === 'TIENDA' || m.taller === 'OTROS' || m.taller === 'CONTADOR' || m.taller === 'ADMINISTRACION') ghcDeuda += val;
        else if (m.taller === 'CONFECCION') confDeuda += val;
        else if (m.taller === 'BORDADO') borDeuda += val;
    });

    document.getElementById('planillas-total-deuda').textContent = formatSoles(totalDeuda);
    document.getElementById('planillas-ghc').textContent = formatSoles(ghcDeuda);
    document.getElementById('planillas-confeccion').textContent = formatSoles(confDeuda);
    document.getElementById('planillas-bordados').textContent = formatSoles(borDeuda);

    // Update global project
    const proj = projectsData.find(p => p.id === 'planillas');
    if (proj) {
        proj.balance = -totalDeuda; // Resta del balance global
        proj.lastUpdate = `${data.length} registros`;
    }
    calculateGlobalBalance();
    renderProjects();

    // Render list
    const list = document.getElementById('planillas-list');
    if (data.length === 0) {
        list.innerHTML = '<li class="tx-empty">Sin historial de planillas aún.</li>';
    } else {
        const iconos = { CORTE: '✂️', CONFECCION: '🧵', BORDADO: '🪡', TIENDA: '🏪', OTROS: '📄', CONTADOR: '📊', ADMINISTRACION: '💼' };
        list.innerHTML = data.slice(0, 15).map(m => `
            <li class="wc-hist-item">
                <span class="wc-hist-icon">${iconos[m.taller] || '📄'}</span>
                <div class="wc-hist-body">
                    <span class="wc-hist-client">${m.personal} <small style="color:var(--text-dim);">(${m.taller})</small></span>
                    <span class="wc-hist-desc">${m.descripcion || (m.tipo_registro==='trabajo_realizado'?'Trabajo (Deuda)':'Pago Adelanto')} ${m.cantidad ? `[${m.cantidad} uds]` : ''}</span>
                </div>
                <div class="wc-hist-meta">
                    <span class="wc-hist-date">${m.fecha}</span>
                    <span class="wc-hist-amount ${m.tipo_registro === 'trabajo_realizado' ? 'neg' : 'pos'}">
                        ${m.tipo_registro === 'trabajo_realizado' ? '−' : '+'}${formatSoles(parseFloat(m.monto_total))}
                    </span>
                </div>
            </li>
        `).join('');
    }
}

function initPlanillasForms() {
    const formTrab = document.getElementById('form-planillas-trabajo');
    const formPago = document.getElementById('form-planillas-pago');
    const today = new Date().toISOString().split('T')[0];

    if (formTrab) formTrab.onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.textContent = 'Guardando...';

        const mov = {
            fecha: today,
            taller: document.getElementById('pl-trab-taller').value,
            personal: document.getElementById('pl-trab-personal').value.trim(),
            tipo_registro: 'trabajo_realizado',
            cantidad: parseInt(document.getElementById('pl-trab-cantidad').value || 0),
            monto_total: parseFloat(document.getElementById('pl-trab-monto').value),
            descripcion: document.getElementById('pl-trab-desc').value.trim() || null
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
            monto_total: parseFloat(document.getElementById('pl-pago-monto').value),
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
