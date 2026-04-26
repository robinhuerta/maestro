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
        path: 'https://radio-la-nueva-540.netlify.app',
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
        lastUpdate: 'Firebase conectado',
        balance: 0,
        path: 'https://cerebro-erp.vercel.app'
    },
    {
        id: 'gorras',
        name: 'TODO PARA GORRA',
        icon: '🧢',
        status: 'online',
        lastUpdate: 'Firebase conectado',
        balance: 0,
        path: 'https://todo-para-gorra.vercel.app'
    },
    {
        id: 'crm-textil',
        name: 'CRM IA Textil',
        icon: '🧵',
        status: 'online',
        lastUpdate: 'Supabase conectado',
        balance: 0,
        path: '#'
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
    }
];

// === WORD CAPS (localStorage) ===
function loadTransactions() {
    const saved = localStorage.getItem('maestro_word_capas_tx');
    return saved ? JSON.parse(saved) : [];
}

function saveTransactions() {
    localStorage.setItem('maestro_word_capas_tx', JSON.stringify(manualTransactions));
}

function recalcWordCapsBalance() {
    const wc = projectsData.find(p => p.id === 'word-caps');
    wc.balance = manualTransactions.reduce((acc, tx) => {
        return tx.type === 'cobranza' ? acc + tx.amount : acc - tx.amount;
    }, 0);
}

let manualTransactions = loadTransactions();
recalcWordCapsBalance();

// === DASHBOARD CORE ===
function renderDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-ES', options);
}

function calculateGlobalBalance() {
    const total = projectsData.reduce((acc, p) => acc + (p.balance || 0), 0);
    document.getElementById('total-balance').textContent = formatSoles(total);

    const online = projectsData.filter(p => p.status === 'online').length;
    document.getElementById('insight-projects').textContent = online;
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

// === MODAL: Word Caps ===
function openManualModal() {
    document.getElementById('modal-manual').classList.add('active');
    renderTransactions();
}

function initManualForm() {
    const form = document.getElementById('form-manual');
    form.onsubmit = (e) => {
        e.preventDefault();
        const newTx = {
            client: document.getElementById('m-client').value,
            type: document.getElementById('m-type').value,
            amount: parseFloat(document.getElementById('m-amount').value),
            date: document.getElementById('m-date').value
        };
        manualTransactions.unshift(newTx);
        saveTransactions();
        recalcWordCapsBalance();

        const btn = form.querySelector('button[type="submit"]');
        btn.textContent = '✅ Registrado';
        setTimeout(() => btn.textContent = 'Registrar Movimiento', 1500);

        form.reset();
        renderTransactions();
        renderProjects();
        calculateGlobalBalance();
    };

    document.getElementById('transaction-list').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete-tx');
        if (!btn) return;
        const idx = parseInt(btn.dataset.index);
        manualTransactions.splice(idx, 1);
        saveTransactions();
        recalcWordCapsBalance();
        renderTransactions();
        renderProjects();
        calculateGlobalBalance();
    });
}

function renderTransactions() {
    const list = document.getElementById('transaction-list');
    const wc = projectsData.find(p => p.id === 'word-caps');

    if (manualTransactions.length === 0) {
        list.innerHTML = '<li class="tx-empty">Sin movimientos registrados.</li>';
        document.getElementById('wc-total').textContent = formatSoles(0);
        return;
    }

    list.innerHTML = manualTransactions.map((tx, idx) => `
        <li class="transaction-item">
            <span class="t-date">${tx.date}</span>
            <span class="t-client">${tx.client}</span>
            <span class="t-type-${tx.type}">${tx.type === 'entrega' ? '📦 Entrega' : '💰 Cobro'}</span>
            <span class="t-amount ${tx.type === 'cobranza' ? 'positive' : 'negative'}">
                ${tx.type === 'cobranza' ? '+' : '-'}${formatSoles(tx.amount)}
            </span>
            <button class="btn-delete-tx" data-index="${idx}" title="Eliminar">✕</button>
        </li>
    `).join('');

    document.getElementById('wc-total').textContent = formatSoles(wc.balance);
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

// === INIT ===
function initDashboard() {
    renderDate();
    renderProjects();
    calculateGlobalBalance();
    initModalClose();
    initManualForm();
    initRadioForm();
    loadRadioBalance();
}

document.addEventListener('DOMContentLoaded', initDashboard);
