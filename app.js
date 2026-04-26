// MAESTRO Dashboard Logic

const projectsData = [
    {
        id: 'radio',
        name: 'Radio La Nueva 540',
        icon: '📻',
        status: 'online',
        lastUpdate: 'Hace 2 min',
        balance: 12450.50,
        path: '../radio-la-nueva-540'
    },
    {
        id: 'cosmos',
        name: 'COSMOS Neflix',
        icon: '🎬',
        status: 'online',
        lastUpdate: 'En vivo',
        balance: 8900.00,
        path: '../NEFLIX'
    },
    {
        id: 'cerebro',
        name: 'CEREBRO ERP',
        icon: '🧠',
        status: 'online',
        lastUpdate: 'Sincronizado',
        balance: 45600.75,
        path: '../CEREBRO ERP'
    },
    {
        id: 'gorras',
        name: 'TODO PARA GORRA',
        icon: '🧢',
        status: 'offline',
        lastUpdate: 'Hace 1 hora',
        balance: 3200.20,
        path: '../TODO PARA GORRA'
    },
    {
        id: 'crm-textil',
        name: 'CRM IA Textil',
        icon: '🧵',
        status: 'online',
        lastUpdate: 'Procesando',
        balance: 15700.00,
        path: '../crm con ia textil'
    },
    {
        id: 'entrust',
        name: 'Catalogo Entrust',
        icon: '📋',
        status: 'online',
        lastUpdate: 'Actualizado',
        balance: 0.00,
        path: '../catalogo entrust'
    },
    {
        id: 'word-capas',
        name: 'Word Capas',
        icon: '🌍',
        status: 'manual',
        lastUpdate: 'Manual',
        balance: 5600.00,
        path: '#',
        isManual: true
    }
];

let manualTransactions = [
    { client: 'García Hermanos', type: 'entrega', amount: 1500, date: '2026-04-25' },
    { client: 'Textiles del Sur', type: 'cobranza', amount: 800, date: '2026-04-26' }
];

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
    document.getElementById('total-balance').textContent = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(total);
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
                    ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(project.balance)}
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
        
        // Update balance of Word Capas
        const wc = projectsData.find(p => p.id === 'word-capas');
        if (newTx.type === 'cobranza') wc.balance += newTx.amount;
        else wc.balance -= newTx.amount;

        form.reset();
        renderTransactions();
        renderProjects();
        calculateGlobalBalance();
    };
}

function renderTransactions() {
    const list = document.getElementById('transaction-list');
    list.innerHTML = manualTransactions.map(tx => `
        <li class="transaction-item">
            <span class="t-date">${tx.date}</span>
            <span class="t-client">${tx.client}</span>
            <span class="t-type-${tx.type}">${tx.type === 'entrega' ? 'Entrega' : 'Cobro'}</span>
            <span class="t-amount">$${tx.amount.toFixed(2)}</span>
        </li>
    `).join('');
}

// Initial Call
document.addEventListener('DOMContentLoaded', initDashboard);

// Mock dynamic updates
setInterval(() => {
    const randomProject = projectsData[Math.floor(Math.random() * projectsData.length)];
    if (randomProject.status === 'online') {
        randomProject.balance += (Math.random() * 10);
        calculateGlobalBalance();
        renderProjects();
    }
}, 5000);
