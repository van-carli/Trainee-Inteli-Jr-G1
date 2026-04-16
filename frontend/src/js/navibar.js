// frontend/src/js/sidebar.js

function initSidebar() {
    // 1. Identifica a localização atual para calcular os caminhos
    const path = window.location.pathname;
    const isInSrcFolder = path.includes('/frontend/src/');
    
    // Se estiver dentro de /src/, o link para index está 2 níveis acima (../../)
    // Se estiver na raiz, o link para src está em ./frontend/src/
    const toRoot = isInSrcFolder ? "../../" : "./";
    const toSrc = isInSrcFolder ? "./" : "./frontend/src/";
    const toAssets = isInSrcFolder ? "../" : "./frontend/";

    const sidebarHTML = `
    <nav class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="logo-container">
                <img src="${toAssets}assets/logo-ij.svg" alt="Logo">
            </div>
            <button class="toggle-btn" id="toggle-btn">
                <i class="fa-solid fa-columns"></i>
            </button>
        </div>

        <ul class="nav-links">
            <li class="nav-item">
                <a href="${toSrc}dashboardQuantitativo.html" class="nav-link">
                    <i class="fa-solid fa-chart-line"></i>
                    <span>Dashboard</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="${toRoot}index.html" class="nav-link" id="link-projetos">
                    <i class="fa-solid fa-briefcase"></i>
                    <span>Projetos IJ</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="${toSrc}calendar.html" class="nav-link">
                    <i class="fa-solid fa-calendar-days"></i>
                    <span>Calendário</span>
                </a>
            </li>
        </ul>

        <div class="status-container">
            <div class="status-dot" id="api-status"></div>
            <div class="status-info">
                <span>API <b id="status-text">...</b></span>
            </div>
        </div>
    </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    // --- Lógica de interação (Toggle, Active Link, etc) ---
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });

    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
    }

    // Marcar link ativo
    document.querySelectorAll('.nav-link').forEach(link => {
        // Pega apenas o nome do arquivo (ex: calendar.html) para comparar
        const linkPage = link.getAttribute('href').split('/').pop();
        const currentPage = path.split('/').pop() || 'index.html';
        
        if (linkPage === currentPage) {
            link.closest('.nav-item').classList.add('active');
        }
    });

    // SE estiver no kanban, ativa "Projetos IJ"
    if (window.location.pathname.includes("khanban")) {
        const linkProjetos = document.getElementById("link-projetos");
        
        if (linkProjetos) {
            linkProjetos.closest('.nav-item').classList.add('active');
        }
    }

    checkApiHealth();
}

async function checkApiHealth() {
    const dot = document.getElementById('api-status');
    const txt = document.getElementById('status-text');
    try {
        const res = await fetch('https://trainee-projetos-api.vercel.app/health');
        if(res.ok) {
            dot.className = 'status-dot online';
            txt.innerText = 'Online';
        }
    } catch {
        dot.className = 'status-dot offline';
        txt.innerText = 'Offline';
    }
}

// Inicializa a sidebar
initSidebar();