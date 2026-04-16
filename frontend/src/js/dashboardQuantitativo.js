const BASE_URL = 'https://api-ij-treinee.onrender.com';
const ALL_TOKENS = ['equipe-alpha-2026', 'equipe-beta-2026', 'equipe-gamma-2026', 'equipe-delta-2026', 'equipe-epsilon-2026'];

let chartInstances = {};
let masterProjects = [];
let refreshInterval;

// 1. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Carrega a lista de projetos APENAS UMA VEZ
    await loadDashboardProjects();
    
    // Inicia a atualização automática (5 segundos) apenas dos dados
    startAutoRefresh();
});

// 2. CARREGA LISTA GLOBAL DE PROJETOS (SEM REPETIÇÃO)
async function loadDashboardProjects() {
    const select = document.getElementById('teamSelect');
    if (!select) return;

    select.innerHTML = '<option value="TODOS">Visão Geral (Todos os Projetos)</option>';
    masterProjects = [];

    // Conjunto para rastrear nomes de projetos já adicionados e evitar duplicatas
    const projetosAdicionados = new Set();

    for (const token of ALL_TOKENS) {
        try {
            const res = await fetch(`${BASE_URL}/projects`, { headers: { 'x-team-token': token } });
            if (res.ok) {
                const projs = await res.json();
                projs.forEach(p => {
                    // CHAVE ÚNICA: Nome do Projeto + Nome do Cliente
                    const chaveUnica = `${p.name}-${p.client}`;

                    if (!projetosAdicionados.has(chaveUnica)) {
                        projetosAdicionados.add(chaveUnica);
                        
                        // Guardamos o token junto com o projeto
                        masterProjects.push({ ...p, token });
                        
                        const opt = document.createElement('option');
                        opt.value = p.id;
                        opt.textContent = `${p.name} (${p.client})`;
                        select.appendChild(opt);
                    }
                });
            }
        } catch (e) {
            console.error(`Erro ao carregar projetos do token ${token}:`, e);
        }
    }
    
    const saved = localStorage.getItem('currentProjectId');
    if (saved) {
        select.value = saved;
    }
    
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
        await fetchAllData();
    } else {
        const proj = masterProjects.find(p => p.id == val);
        if (!proj) return;

        titleDisp.innerText = proj.name.toUpperCase();
        
        localStorage.setItem('currentProjectId', proj.id);
        localStorage.setItem('currentProjectName', proj.name);
        localStorage.setItem('selectedTeamToken', proj.token);
        
        await fetchSingleProjectData(proj);
    }
}

// ... (As funções fetchSingleProjectData, fetchAllData e updateUI permanecem iguais)

async function fetchSingleProjectData(project) {
    try {
        const resTasks = await fetch(`${BASE_URL}/tasks?projectId=${project.id}`, {
            headers: { 'x-team-token': project.token }
        });

        if (resTasks.ok) {
            const tasks = await resTasks.json();
            const metrics = {
                totalProjects: 1,
                totalTasks: tasks.length,
                overdueTasks: tasks.filter(t => t.status !== "Concluída" && new Date(t.dueDate) < new Date()).length,
                highPriorityTasks: tasks.filter(t => t.priority === "Alta").length,
                tasksByStatus: tasks.reduce((acc, t) => {
                    acc[t.status] = (acc[t.status] || 0) + 1;
                    return acc;
                }, {})
            };
            updateUI(metrics, [project], false);
            processAndRenderActivity(tasks);
        }
    } catch (e) { console.error(e); }
}

async function fetchAllData() {
    let globalDash = { totalProjects: 0, totalTasks: 0, overdueTasks: 0, highPriorityTasks: 0, tasksByStatus: {} };
    let allTasks = [];

    for (const t of ALL_TOKENS) {
        try {
            const [resD, resT] = await Promise.all([
                fetch(`${BASE_URL}/dashboard`, { headers: { 'x-team-token': t } }),
                fetch(`${BASE_URL}/tasks`, { headers: { 'x-team-token': t } })
            ]);
            if (resD.ok) {
                const d = await resD.json();
                globalDash.totalProjects += d.totalProjects;
                globalDash.totalTasks += d.totalTasks;
                globalDash.overdueTasks += d.overdueTasks;
                globalDash.highPriorityTasks += d.highPriorityTasks;
                for (let k in d.tasksByStatus) {
                    globalDash.tasksByStatus[k] = (globalDash.tasksByStatus[k] || 0) + d.tasksByStatus[k];
                }
            }
            if (resT.ok) {
                const tasksList = await resT.json();
                allTasks = allTasks.concat(tasksList);
            }
        } catch (e) { console.warn(e); }
    }
    updateUI(globalDash, masterProjects, true);
    processAndRenderActivity(allTasks);
}

function updateUI(dash, projetos, isGeral) {
    document.getElementById('totalProjects').innerText = dash.totalProjects;
    document.getElementById('totalTasks').innerText = dash.totalTasks;
    document.getElementById('overdueTasks').innerText = dash.overdueTasks;
    document.getElementById('highPriorityTasks').innerText = dash.highPriorityTasks;

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

    const labels = Object.keys(dash.tasksByStatus);
    const cores = labels.map(l => l==='Concluída'?'#00ff7f':l==='Em revisão'?'#ff4d4d':l==='Em andamento'?'#ffa500':'#448aec');
    renderChart('tasksChart', 'bar', labels, Object.values(dash.tasksByStatus), cores);
}

// ... (Manter as funções renderGauge, renderChart e processAndRenderActivity iguais ao seu código anterior)

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