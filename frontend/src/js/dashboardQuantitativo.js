// dashboardQuantitativo.js
const BASE_URL = 'https://api-ij-treinee.onrender.com';
const ALL_TOKENS = ['equipe-alpha-2026', 'equipe-beta-2026', 'equipe-gamma-2026', 'equipe-delta-2026', 'equipe-epsilon-2026'];

// Mapeamento solicitado: Token -> Nome da Empresa (campo 'client' na API)
const MAPEAMENTO_EMPRESAS = {
    'equipe-alpha-2026': 'Empresa Alpha',
    'equipe-beta-2026': 'Empresa Beta',
    'equipe-gamma-2026': 'Clinica Central',
    'equipe-delta-2026': 'Grupo Horizonte',
    'equipe-epsilon-2026': 'Tech Support Co.' // Ajustado para bater com o dataset padrão
};

let chartInstances = {};

async function changeTeam() {
    const val = document.getElementById('teamSelect').value;
    
    // SINCRONIZAÇÃO: Salva o token para Kanban e Calendário
    if (val !== "TODAS") {
        localStorage.setItem('selectedTeamToken', val);
    }

    document.getElementById('team-name').innerText = val === "TODAS" ? "VISÃO GERAL DA EMPRESA" : val.replace(/-/g, ' ').toUpperCase();
    
    val === "TODAS" ? await fetchAllTeams() : await fetchDashboard(val);
}

// BUSCA DADOS DE UMA EQUIPE E FILTRA PELO NOME DA EMPRESA
async function fetchDashboard(token) {
    try {
        const [resDash, resTasks, resProjs] = await Promise.all([
            fetch(`${BASE_URL}/dashboard`, { headers: { 'x-team-token': token } }),
            fetch(`${BASE_URL}/tasks`, { headers: { 'x-team-token': token } }),
            fetch(`${BASE_URL}/projects`, { headers: { 'x-team-token': token } })
        ]);

        if (resDash.ok && resTasks.ok && resProjs.ok) {
            const dash = await resDash.json();
            const tasks = await resTasks.json();
            const projects = await resProjs.json();
            
            // FILTRO CRUCIAL: Pega apenas o projeto que pertence à empresa do token
            const empresaAlvo = MAPEAMENTO_EMPRESAS[token];
            const projetosFiltrados = projects.filter(p => p.client === empresaAlvo);
            
            updateUI(dash, projetosFiltrados, false);
            processAndRenderActivity(tasks);
        }
    } catch (e) { console.error("Erro ao carregar dashboard:", e); }
}

// BUSCA E CONSOLIDA TUDO (VISÃO GERAL)
async function fetchAllTeams() {
    let globalDash = { totalProjects: 0, totalTasks: 0, overdueTasks: 0, highPriorityTasks: 0, tasksByStatus: {} };
    let allTasks = [];
    let allProjsFiltrados = [];

    for (const t of ALL_TOKENS) {
        try {
            const [rD, rT, rP] = await Promise.all([
                fetch(`${BASE_URL}/dashboard`, { headers: { 'x-team-token': t } }),
                fetch(`${BASE_URL}/tasks`, { headers: { 'x-team-token': t } }),
                fetch(`${BASE_URL}/projects`, { headers: { 'x-team-token': t } })
            ]);

            if (rD.ok) {
                const d = await rD.json();
                globalDash.totalProjects += d.totalProjects;
                globalDash.totalTasks += d.totalTasks;
                globalDash.overdueTasks += d.overdueTasks;
                globalDash.highPriorityTasks += d.highPriorityTasks;
                for (let k in d.tasksByStatus) globalDash.tasksByStatus[k] = (globalDash.tasksByStatus[k] || 0) + d.tasksByStatus[k];
            }
            if (rT.ok) allTasks = allTasks.concat(await rT.json());
            
            // Na visão geral, também aplicamos o mapeamento para não duplicar projetos base
            if (rP.ok) {
                const projs = await rP.json();
                const pFiltrado = projs.find(p => p.client === MAPEAMENTO_EMPRESAS[t]);
                if (pFiltrado) allProjsFiltrados.push(pFiltrado);
            }
        } catch (e) { console.warn("Falha no token:", t); }
    }
    updateUI(globalDash, allProjsFiltrados, true);
    processAndRenderActivity(allTasks);
}

function updateUI(dash, projetos, isGeral) {
    document.getElementById('totalProjects').innerText = isGeral ? projetos.length : dash.totalProjects;
    document.getElementById('totalTasks').innerText = dash.totalTasks;
    document.getElementById('overdueTasks').innerText = dash.overdueTasks;
    document.getElementById('highPriorityTasks').innerText = dash.highPriorityTasks;

    const container = document.getElementById('projects-canvas-container');
    container.innerHTML = ''; 

    if (isGeral) {
        const media = Math.round(projetos.reduce((acc, p) => acc + p.progress, 0) / (projetos.length || 1));
        const div = document.createElement('div');
        div.className = 'gauge-item-geral'; // Agora tem o mesmo tamanho no CSS
        div.innerHTML = `<canvas id="gauge-geral"></canvas>`;
        container.appendChild(div);
        renderGauge('gauge-geral', media, "MÉDIA DE PROGRESSO GERAL"); // Removi o parâmetro isBig
    } else {
        projetos.forEach((p, i) => {
            const div = document.createElement('div');
            div.className = 'gauge-item';
            div.innerHTML = `<canvas id="g-${i}"></canvas><span>${p.name}</span>`;
            container.appendChild(div);
            renderGauge(`g-${i}`, p.progress, ""); // Todos serão "grandes" por padrão
        });
    }

    // Gráfico de barras (mantém igual)
    const labels = Object.keys(dash.tasksByStatus);
    const cores = labels.map(l => l==='Concluída'?'#00ff7f':l==='Em revisão'?'#ff4d4d':l==='Em andamento'?'#ffa500':'#3179dd');
    renderChart('tasksChart', 'bar', labels, Object.values(dash.tasksByStatus), cores);
}
// --- FUNÇÕES DE RENDERIZAÇÃO (Mantidas conforme o padrão Alpha Red) ---

function renderGauge(id, percent, sub) {
    const ctx = document.getElementById(id).getContext('2d');
    if (chartInstances[id]) chartInstances[id].destroy();
    
    let col = percent > 80 ? '#00ff7f' : percent >= 35 ? '#ffa500' : '#ff4d4d';
    
    chartInstances[id] = new Chart(ctx, {
        type: 'doughnut',
        data: { 
            datasets: [{ 
                data: [percent, 100 - percent], 
                backgroundColor: [col, '#1a1c2e'], 
                circumference: 180, 
                rotation: 270, 
                cutout: '85%', // Aro mais fino para parecer maior
                borderRadius: 5 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            layout: { padding: { bottom: 20 } },
            plugins: { legend: { display: false }, tooltip: { enabled: false } } 
        },
        plugins: [{
            afterDraw: (chart) => {
                const { ctx, chartArea: { left, right, top, bottom } } = chart;
                const cX = (left + right) / 2, cY = (top + bottom) * 0.85;
                ctx.save();
                ctx.fillStyle = '#fff';
                // Fonte grandona para todos:
                ctx.font = 'bold 40px "JetBrains Mono"'; 
                ctx.textAlign = 'center'; 
                ctx.fillText(`${percent}%`, cX, cY);
                
                if (sub) { 
                    ctx.fillStyle = '#9ca3af'; 
                    ctx.font = '12px "JetBrains Mono"'; 
                    ctx.fillText(sub, cX, cY + 25); 
                }
                ctx.restore();
            }
        }]
    });
}

function renderChart(id, type, labels, vals, colors) {
    const ctx = document.getElementById(id).getContext('2d');
    if (chartInstances[id]) chartInstances[id].destroy();
    chartInstances[id] = new Chart(ctx, {
        type: type,
        data: { labels: labels, datasets: [{ data: vals, backgroundColor: colors, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { y: { ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                      x: { ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono' } }, grid: { display: false } } } }
    });
}

function processAndRenderActivity(tasks) {
    const mNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const map = {}; mNames.forEach(m => map[m] = 0);
    tasks.forEach(t => { if(t.dueDate) map[mNames[new Date(t.dueDate).getMonth()]]++; });
    const ctx = document.getElementById('activityChart').getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 400); 
    grad.addColorStop(0, 'rgba(255, 77, 77, 0.4)'); 
    grad.addColorStop(1, 'rgba(255, 77, 77, 0)');
    if (chartInstances['activityChart']) chartInstances['activityChart'].destroy();
    chartInstances['activityChart'] = new Chart(ctx, {
        type: 'line',
        data: { labels: Object.keys(map), datasets: [{ data: Object.values(map), borderColor: '#ff4d4d', backgroundColor: grad, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#ff4d4d' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { y: { ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                      x: { ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono' } }, grid: { display: false } } } }
    });
}


// --- LÓGICA DE ATUALIZAÇÃO AUTOMÁTICA ---

let autoRefreshTimer; // Variável que guardará o temporizador

function startAutoRefresh() {
    // Limpa qualquer temporizador existente para não duplicar
    stopAutoRefresh();

    // Define um intervalo de 5 segundos (5000ms)
    // Você pode aumentar para 10000 (10s) se achar muito rápido
    autoRefreshTimer = setInterval(() => {
        const val = document.getElementById('teamSelect').value;
        console.log("🔄 Atualizando dados automaticamente...");
        
        // Chama a função de busca dependendo do filtro atual
        if (val === "TODAS") {
            fetchAllTeams();
        } else {
            fetchDashboard(val);
        }
    }, 5000); 
}

function stopAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
    }
}

// Detector de Visibilidade: Só atualiza se o usuário estiver vendo a página
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log("👋 Bem-vindo de volta! Retomando atualização.");
        changeTeam(); // Atualiza na hora ao voltar
        startAutoRefresh(); // Reinicia o loop
    } else {
        console.log("💤 Aba em segundo plano. Pausando atualização.");
        stopAutoRefresh(); // Para o loop
    }
});

document.addEventListener('DOMContentLoaded', () => { 
    lucide.createIcons();
    
    // Recupera o token salvo
    const saved = localStorage.getItem('selectedTeamToken') || ALL_TOKENS[0];
    document.getElementById('teamSelect').value = saved;
    
    // Carrega os dados pela primeira vez
    changeTeam(); 

    // INICIA O LOOP DE ATUALIZAÇÃO AUTOMÁTICA
    startAutoRefresh();
});