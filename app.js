// MAESTRO Dashboard Logic

// Formato de moneda en Soles Peruanos
function formatSoles(amount) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount);
}

const projectsData = [
    {
        id: 'radio',
        name: 'Radio La Nueva 540',
        icon: '📻',
        status: 'online',
        lastUpdate: 'Hace 2 min',
        balance: 12450.50,
        path: 'https://radio-la-nueva-540.netlify.app'
    },
    {
        id: 'cosmos',
        name: 'COSMOS Netflix',
        icon: '🎬',
        status: 'online',
        lastUpdate: 'En vivo',
        balance: 8900.00,
        path: 'https://cosmos-netflix.netlify.app'
    },
    {
        id: 'cerebro',
        name: 'CEREBRO ERP',
        icon: '🧠',
        status: 'online',
        lastUpdate: 'Sincronizado',
        balance: 45600.75,
        path: '#'
    },
    {
        id: 'gorras',
        name: 'TODO PARA GORRA',
        icon: '🧢',
        status: 'offline',
        lastUpdate: 'Hace 1 hora',
        balance: 3200.20,
        path: '#'
    },
    {
        id: 'crm-textil',
        name: 'CRM IA Textil',
        icon: '🧵',
        status: 'online',
        lastUpdate: 'Procesando',
        balance: 15700.00,
        path: '#'
    },
    {
        id: 'entrust',
        name: 'Catálogo Entrust',
        icon: '📋',
        status: 'online',
        lastUpdate: 'Actualizado',
        balance: 0.00,
        path: '#'
    },
    {
        id: 'word-capas',
        name: 'Word Capas',
        icon: '🌍',
        status: 'manual',
        lastUpdate: 'Manual',
        balance: 0,
        path: '#',
        isManual: true
    }
];

// Persistencia con localStorage
function loadTransactions() {
    const saved = localStorage.getItem('maestro_word_capas_tx');
    return saved ? JSON.parse(saved) : [
        { client: 'García Hermanos', type: 'entrega', amount: 1500, date: '2026-04-25' },
        { client: 'Textiles del Sur', type: 'cobranza', amount: 800, date: '2026-04-26' }
    ];
}

function saveTransactions() {
    localStorage.setItem('maestro_word_capas_tx', JSON.stringify(manualTransactions));
}

function recalcWordCapasBalance() {
    const wc = projectsData.find(p => p.id === 'word-capas');
    wc.balance = manualTransactions.reduce((acc, tx) => {
        return tx.type === 'cobranza' ? acc + tx.amount : acc - tx.amount;
    }, 0);
}

let manualTransactions = loadTransactions();
recalcWordCapasBalance();

function initDashboard() {
    renderDate();
    renderProjects();
    calculateGlobalBalance();
    initModalEvents();
}

function renderDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today  = new Date();
    document.getElementById('current-date').textContent = today.toLocaleDateString('es-ES', options);
}

function calculateGlobalBalance() {
    const total = projectsData.reduce((acc, curr) => acc + curr.balance, 0);
    document.getElementById('total-balance').textContent = formatSoles(total);
}

function renderProjects() {
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '';

    projectsData.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'project-card glass';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="project-icon">${project.icon}</div>
            <h3 class="project-title">${project.name}</h3>
            <div class="project-status">
                <span class="status-dot" style="background: ${project.status === 'online' ? 'var(--success)' : 'var(--danger)'}"></span>
                ${project.status === 'online' ? 'Activo' : 'Inactivo'} • ${project.lastUpdate}
            </div>
            <div class="project-footer">
                <div class="project-account">
                    ${formatSoles(project.balance)}
                </div>
                ${project.isManual ? 
                    `<button class="btn-view" onclick="openManualModal('${project.id}')">Gestionar →</button>` : 
                    `<a href="${project.path}" class="btn-view" onclick="alert('Abriendo ${project.name}...')">Gestionar →</a>`
                }
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function openManualModal(projectId) {
    const modal = document.getElementById('modal-manual');
    modal.classList.add('active');
    renderTransactions();
}

function initModalEvents() {
    const modal = document.getElementById('modal-manual');
    const closeBtn = document.querySelector('.close-btn');
    const form = document.getElementById('form-manual');

    closeBtn.onclick = () => modal.classList.remove('active');
    window.onclick = (e) => { if (e.target == modal) modal.classList.remove('active'); };

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
        recalcWordCapasBalance();

        // Feedback visual
        const btn = form.querySelector('button[type="submit"]');
        btn.textContent = '✅ Registrado';
        setTimeout(() => btn.textContent = 'Registrar Movimiento', 1500);

        form.reset();
        renderTransactions();
        renderProjects();
        calculateGlobalBalance();
    };

    // Botón eliminar transacción (delegación de eventos)
    document.getElementById('transaction-list').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete-tx');
        if (!btn) return;
        const idx = parseInt(btn.dataset.index);
        manualTransactions.splice(idx, 1);
        saveTransactions();
        recalcWordCapasBalance();
        renderTransactions();
        renderProjects();
        calculateGlobalBalance();
    });
}

function renderTransactions() {
    const list = document.getElementById('transaction-list');

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
            <span class="t-amount ${tx.type === 'cobranza' ? 'positive' : 'negative'}">${tx.type === 'cobranza' ? '+' : '-'}${formatSoles(tx.amount)}</span>
            <button class="btn-delete-tx" data-index="${idx}" title="Eliminar">✕</button>
        </li>
    `).join('');

    // Resumen de balance
    const wc = projectsData.find(p => p.id === 'word-capas');
    document.getElementById('wc-total').textContent = formatSoles(wc.balance);
}

// Initial Call
document.addEventListener('DOMContentLoaded', initDashboard);

// Mock dynamic updates (solo proyectos online, excluye Word Capas)
setInterval(() => {
    const onlineProjects = projectsData.filter(p => p.status === 'online' && !p.isManual);
    if (onlineProjects.length === 0) return;
    const randomProject = onlineProjects[Math.floor(Math.random() * onlineProjects.length)];
    randomProject.balance += (Math.random() * 50);
    calculateGlobalBalance();
    renderProjects();
}, 5000);
