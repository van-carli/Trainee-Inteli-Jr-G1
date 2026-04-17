const BASE_URL = 'https://api-ij-treinee.onrender.com';
const ALL_TOKENS = ['equipe-alpha-2026', 'equipe-beta-2026', 'equipe-gamma-2026', 'equipe-delta-2026', 'equipe-epsilon-2026'];

let chartInstances = {};
let masterProjects = [];
let refreshInterval;

// 1. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    await loadDashboardProjects();
    startAutoRefresh();
});

// 2. CARREGA LISTA DE PROJETOS (SEM DUPLICATAS)
async function loadDashboardProjects() {
    const select = document.getElementById('teamSelect');
    if (!select) return;

    select.innerHTML = '<option value="TODOS">Visão Geral (Todos os Projetos)</option>';
    masterProjects = [];
    const projetosAdicionados = new Set();

    for (const token of ALL_TOKENS) {
        try {
            const res = await fetch(`${BASE_URL}/projects`, { headers: { 'x-team-token': token } });
            if (res.ok) {
                const projs = await res.json();
                projs.forEach(p => {
                    const chaveUnica = `${p.name}-${p.client}`;
                    if (!projetosAdicionados.has(chaveUnica)) {
                        projetosAdicionados.add(chaveUnica);
                        masterProjects.push({ ...p, token });
                        
                        const opt = document.createElement('option');
                        opt.value = p.id;
                        opt.textContent = `${p.name} (${p.client})`;
                        select.appendChild(opt);
                    }
                });
            }
        } catch (e) { console.error(e); }
    }
    
    const saved = localStorage.getItem('currentProjectId');
    if (saved) select.value = saved;
    changeTeam();
}

// 3. MUDANÇA DE FILTRO
async function changeTeam() {
    const select = document.getElementById('teamSelect');
    if (!select) return;
    
    const val = select.value;
    const titleDisp = document.getElementById('team-name');

    if (val === "TODOS") {
        titleDisp.innerText = "VISÃO GERAL DA EMPRESA";
        localStorage.removeItem('currentProjectId');
        await fetchAllData(); // <--- Lógica corrigida abaixo
    } else {
        const proj = masterProjects.find(p => p.id == val);
        if (!proj) return;
        titleDisp.innerText = proj.name.toUpperCase();
        localStorage.setItem('currentProjectId', proj.id);
        localStorage.setItem('selectedTeamToken', proj.token);
        await fetchSingleProjectData(proj);
    }
}

// 4. BUSCA DADOS DE UM PROJETO ESPECÍFICO
async function fetchSingleProjectData(project) {
    try {
        const resTasks = await fetch(`${BASE_URL}/tasks?projectId=${project.id}`, {
            headers: { 'x-team-token': project.token }
        });

        if (resTasks.ok) {
            const tasks = await resTasks.json();
            const metrics = calculateMetricsFromTasks(tasks, 1);
            updateUI(metrics, [project], false);
            processAndRenderActivity(tasks);
        }
    } catch (e) { console.error(e); }
}

// 5. VISÃO GERAL CORRIGIDA: Consolidando por Projetos e não por Equipes
async function fetchAllData() {
    let rawAllTasks = [];

    // Busca todas as tarefas de todas as equipes
    for (const token of ALL_TOKENS) {
        try {
            const res = await fetch(`${BASE_URL}/tasks`, { headers: { 'x-team-token': token } });
            if (res.ok) {
                const tasks = await res.json();
                rawAllTasks = rawAllTasks.concat(tasks);
            }
        } catch (e) { console.warn(e); }
    }

    // REMOVER DUPLICATAS DE TAREFAS (Pois a API repete as mesmas tasks em cada token)
    // Usamos o título + ID do projeto como chave única
    const tasksUnicasMap = new Map();
    rawAllTasks.forEach(task => {
        const chaveTask = `${task.title}-${task.projectId}`;
        if (!tasksUnicasMap.has(chaveTask)) {
            tasksUnicasMap.set(chaveTask, task);
        }
    });

    const tasksConsolidadas = Array.from(tasksUnicasMap.values());
    
    // Calcula métricas baseadas na lista única de tarefas
    const metrics = calculateMetricsFromTasks(tasksConsolidadas, masterProjects.length);
    
    updateUI(metrics, masterProjects, true);
    processAndRenderActivity(tasksConsolidadas);
}

// FUNÇÃO AUXILIAR PARA CALCULAR MÉTRICAS
function calculateMetricsFromTasks(tasks, totalProjs) {
    const hoje = new Date();
    const tasksByStatus = {};
    let overdue = 0;
    let highPriority = 0;

    tasks.forEach(t => {
        tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
        if (t.dueDate && t.status !== "Concluída" && new Date(t.dueDate) < hoje) {
            overdue++;
        }
        if (t.priority === "Alta") highPriority++;
    });

    // --- LÓGICA DE SAÚDE (HEALTH SCORE) ---
    let healthText = "No Prazo";
    let healthClass = "health-prazo";

    const taxaAtraso = overdue / (tasks.length || 1);

    if (overdue > 0 && taxaAtraso > 0.2) { 
        // Se houver mais de 20% de tarefas atrasadas
        healthText = "Crítico";
        healthClass = "health-critico";
    } else if (overdue > 0 || highPriority > (tasks.length * 0.4)) {
        // Se houver qualquer atraso OU muitas tarefas de alta prioridade acumuladas
        healthText = "Em Risco";
        healthClass = "health-risco";
    }

    return {
        totalProjects: totalProjs,
        totalTasks: tasks.length,
        overdueTasks: overdue,
        highPriorityTasks: highPriority,
        tasksByStatus: tasksByStatus,
        health: { text: healthText, class: healthClass } // Retorna a saúde
    };
}

// 6. ATUALIZA INTERFACE
function updateUI(metrics, projetos, isGeral) {
    // Atualiza os cards (Note que totalProjects foi removido em favor do Health)
    const healthElem = document.getElementById('projectHealth');
    healthElem.innerText = metrics.health.text;
    healthElem.className = metrics.health.class; // Aplica a cor (Vermelho, Laranja ou Verde)

    const ordemFixa = ['A fazer', 'Em andamento', 'Em revisão', 'Concluída'];
    const dadosOrdenados = ordemFixa.map(status => metrics.tasksByStatus[status] || 0);

    document.getElementById('totalTasks').innerText = metrics.totalTasks;
    document.getElementById('overdueTasks').innerText = metrics.overdueTasks;
    document.getElementById('highPriorityTasks').innerText = metrics.highPriorityTasks;

    const container = document.getElementById('projects-canvas-container');
    if (!container) return;
    container.innerHTML = ''; 

    if (isGeral) {
        const media = Math.round(projetos.reduce((acc, p) => acc + (p.progress || 0), 0) / (projetos.length || 1));
        const div = document.createElement('div');
        div.className = 'gauge-item-geral';
        div.innerHTML = `<canvas id="gauge-geral"></canvas>`;
        container.appendChild(div);
        renderGauge('gauge-geral', media, "MÉDIA DE PROGRESSO TOTAL");
    } else {
        projetos.forEach((p, i) => {
            const div = document.createElement('div');
            div.className = 'gauge-item';
            div.innerHTML = `<canvas id="g-${i}"></canvas><span>${p.name}</span>`;
            container.appendChild(div);
            renderGauge(`g-${i}`, p.progress, "");
        });
    }

    const labels = Object.keys(metrics.tasksByStatus);
    const coresOrdenadas = ordemFixa.map(status => {
    switch(status) {
        case 'A fazer': return '#3179dd';      // Cinza
        case 'Em andamento': return '#ffa500'; // Laranja
        case 'Em revisão': return '#ff4d4d';   // Vermelho Alpha
        case 'Concluída': return '#00ff7f';    // Verde Neon
        default: return '#504a4a';
    }
    });
    renderChart('tasksChart', 'bar', ordemFixa, dadosOrdenados, coresOrdenadas);
}

function renderGauge(id, percent, sub) {
    const ctx = document.getElementById(id).getContext('2d');
    if (chartInstances[id]) chartInstances[id].destroy();
    let col = percent > 80 ? '#00ff7f' : percent >= 35 ? '#ffa500' : '#ff4d4d';
    chartInstances[id] = new Chart(ctx, {
        type: 'doughnut',
        data: { datasets: [{ data: [percent, 100 - percent], backgroundColor: [col, '#1a1c2e'], circumference: 180, rotation: 270, cutout: '85%', borderRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, layout: { padding: { bottom: 20 } }, plugins: { legend: { display: false }, tooltip: { enabled: false } } },
        plugins: [{
            afterDraw: (chart) => {
                const { ctx, chartArea: { left, right, top, bottom } } = chart;
                const cX = (left + right) / 2, cY = (top + bottom) * 0.85;
                ctx.save();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 40px "JetBrains Mono"';
                ctx.textAlign = 'center'; ctx.fillText(`${percent}%`, cX, cY);
                if (sub) { ctx.fillStyle = '#9ca3af'; ctx.font = '12px "JetBrains Mono"'; ctx.fillText(sub, cX, cY + 25); }
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
    const grad = ctx.createLinearGradient(0, 0, 0, 400); grad.addColorStop(0, 'rgba(255, 77, 77, 0.4)'); grad.addColorStop(1, 'rgba(255, 77, 77, 0)');
    if (chartInstances['activityChart']) chartInstances['activityChart'].destroy();
    chartInstances['activityChart'] = new Chart(ctx, {
        type: 'line',
        data: { labels: Object.keys(map), datasets: [{ data: Object.values(map), borderColor: '#ff4d4d', backgroundColor: grad, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#ff4d4d' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { y: { ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                      x: { ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono' } }, grid: { display: false } } } }
    });
}

// 8. AUTO-REFRESH
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        // Atualiza apenas os DADOS, não a lista do dropdown
        changeTeam();
    }, 5000);
}

document.addEventListener('visibilitychange', () => {
    document.visibilityState === 'visible' ? startAutoRefresh() : clearInterval(refreshInterval);
});