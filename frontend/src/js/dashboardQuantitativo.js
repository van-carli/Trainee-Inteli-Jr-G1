// frontend/src/js/dashboardQuantitativo.js
const BASE_URL = 'https://trainee-projetos-api.vercel.app';
const ALL_TOKENS = ['equipe-alpha-2026', 'equipe-beta-2026', 'equipe-gamma-2026', 'equipe-delta-2026', 'equipe-epsilon-2026'];

let chartInstances = {};
let masterProjects = [];
let refreshInterval;
let currentLoadedTasks = []; // Armazena as tarefas do filtro atual (equipe ou projeto)

// 1. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    await loadDashboardProjects();
    startAutoRefresh();
});

function handleAssigneeChange() {
    const selectedPerson = document.getElementById('assigneeSelect').value;
    
    if (selectedPerson === "TODOS") {
        processAndRenderActivity(currentLoadedTasks);
    } else {
        const filteredTasks = currentLoadedTasks.filter(t => t.assignee === selectedPerson);
        processAndRenderActivity(filteredTasks);
    }
}

function populateAssigneeFilter(tasks) {
    const select = document.getElementById('assigneeSelect');
    const currentValue = select.value; // Salva quem estava selecionado
    
    // Pega nomes únicos de responsáveis
    const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];
    
    select.innerHTML = '<option value="TODOS">Todos os Responsáveis</option>';
    
    assignees.sort().forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });

    // Tenta manter a seleção anterior se ela ainda existir na lista nova
    if (assignees.includes(currentValue)) {
        select.value = currentValue;
    }
}

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
        await fetchAllData();
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
// 4. BUSCA DADOS DE UM PROJETO ESPECÍFICO
async function fetchSingleProjectData(project) {
    try {
        const resTasks = await fetch(`${BASE_URL}/tasks?projectId=${project.id}`, {
            headers: { 'x-team-token': project.token }
        });

        if (resTasks.ok) {
            const tasks = await resTasks.json();
            currentLoadedTasks = tasks; // SALVA AS TASKS
            populateAssigneeFilter(tasks); // ATUALIZA O FILTRO DE PESSOAS
            
            const metrics = calculateMetricsFromTasks(tasks, 1, project.progress);
            updateUI(metrics, [project], false);
            
            // Se houver alguém selecionado no filtro de pessoas, aplica o filtro antes de renderizar
            handleAssigneeChange(); 
        }
    } catch (e) { console.error(e); }
}

// 5. VISÃO GERAL
async function fetchAllData() {
    let rawAllTasks = [];
    for (const token of ALL_TOKENS) {
        try {
            const res = await fetch(`${BASE_URL}/tasks`, { headers: { 'x-team-token': token } });
            if (res.ok) {
                const tasks = await res.json();
                rawAllTasks = rawAllTasks.concat(tasks);
            }
        } catch (e) { console.warn(e); }
    }

    const tasksUnicasMap = new Map();
    rawAllTasks.forEach(task => {
        const chaveTask = `${task.title}-${task.projectId}`;
        if (!tasksUnicasMap.has(chaveTask)) tasksUnicasMap.set(chaveTask, task);
    });

    const tasksConsolidadas = Array.from(tasksUnicasMap.values());
    
    currentLoadedTasks = tasksConsolidadas;
    populateAssigneeFilter(tasksConsolidadas);

    const mediaGeral = Math.round(masterProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / (masterProjects.length || 1));
    const metrics = calculateMetricsFromTasks(tasksConsolidadas, masterProjects.length, mediaGeral);

    updateUI(metrics, masterProjects, true);
    handleAssigneeChange(); // Aplica filtro de pessoa se houver
    processAndRenderActivity(tasksConsolidadas);
}

// FUNÇÃO AUXILIAR PARA CALCULAR MÉTRICAS
// FUNÇÃO AUXILIAR PARA CALCULAR MÉTRICAS (Atualizada com status Concluído)
function calculateMetricsFromTasks(tasks, totalProjs, progressPercent) {
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

    // Nova Regra: Se o progresso for 100%
    if (progressPercent >= 100) {
        healthText = "Concluído";
        healthClass = "health-prazo"; // Mantém verde
    } 
    else if (overdue > 0 && taxaAtraso > 0.2) { 
        healthText = "Crítico";
        healthClass = "health-critico";
    } else if (overdue > 0 || highPriority > (tasks.length * 0.4)) {
        healthText = "Em Risco";
        healthClass = "health-risco";
    }

    return {
        totalProjects: totalProjs,
        totalTasks: tasks.length,
        overdueTasks: overdue,
        highPriorityTasks: highPriority,
        tasksByStatus: tasksByStatus,
        health: { text: healthText, class: healthClass }
    };
}

// 6. ATUALIZA INTERFACE
function updateUI(metrics, projetos, isGeral) {
    // Atualiza os cards
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
    const validTasks = tasks.filter(t => t.dueDate);
    
    if (validTasks.length === 0) {
        if (chartInstances['activityChart']) chartInstances['activityChart'].destroy();
        return;
    }

    // 1. Encontrar a primeira e última data
    const dates = validTasks.map(t => new Date(t.dueDate + 'T00:00:00')); // Adicionado T00:00:00 para evitar erro de fuso
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    // 2. Criar margem de 3 dias antes e 3 dias depois para o gráfico não "bater na parede"
    let iterDate = new Date(minDate);
    iterDate.setDate(iterDate.getDate() - 3);
    
    const endDate = new Date(maxDate);
    endDate.setDate(endDate.getDate() + 3);

    const labels = [];
    const counts = {};

    // 3. Gerar a sequência de TODOS os dias entre o início e o fim
    while (iterDate <= endDate) {
        const dayLabel = iterDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        labels.push(dayLabel);
        counts[dayLabel] = 0;
        iterDate.setDate(iterDate.getDate() + 1);
    }

    // 4. Preencher as tarefas nos dias correspondentes
    validTasks.forEach(t => {
        const taskDate = new Date(t.dueDate + 'T00:00:00');
        const label = taskDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (counts[label] !== undefined) counts[label]++;
    });

    const dataValues = labels.map(l => counts[l]);
    renderActivityChart('activityChart', labels, dataValues);
}

function renderActivityChart(canvasId, labels, dataValues) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const COR_TEXTO = '#9ca3af';
    const COR_ACENTO = '#ff4d4d';

    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, 'rgba(255, 77, 77, 0.5)'); 
    grad.addColorStop(1, 'rgba(255, 77, 77, 0)');   

    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels, // Ex: ["10/04", "11/04"...]
            datasets: [{
                data: dataValues,
                borderColor: COR_ACENTO,
                backgroundColor: grad,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: COR_ACENTO,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0e1021',
                    titleFont: { family: 'JetBrains Mono' },
                    bodyFont: { family: 'JetBrains Mono' },
                    callbacks: {
                        title: (context) => `Data: ${context[0].label}`,
                        label: (context) => ` Entregas: ${context.parsed.y}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: COR_TEXTO, font: { family: 'JetBrains Mono', size: 10 }, stepSize: 1 },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                // EIXO 1: Mostra os DIAS
                x: {
                    ticks: { 
                        color: COR_TEXTO, 
                        font: { family: 'JetBrains Mono', size: 9 },
                        autoSkip: true,
                        maxTicksLimit: 20,
                        callback: function(value, index) {
                            // Retorna apenas o dia (remove o mês da label principal para não poluir)
                            const fullLabel = this.getLabelForValue(value);
                            return fullLabel.split('/')[0]; 
                        }
                    },
                    grid: { display: false }
                },
                // EIXO 2: Mostra o MÊS (Descrição adicional)
                xMonth: {
                    grid: { drawOnChartArea: false, color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: COR_ACENTO,
                        font: { family: 'JetBrains Mono', size: 11, weight: 'bold' },
                        autoSkip: false,
                        callback: function(value, index) {
                            const fullLabel = this.getLabelForValue(index);
                            const [dia, mesNum] = fullLabel.split('/');
                            
                            // Mapeamento de nomes de meses
                            const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
                            const nomeMes = meses[parseInt(mesNum) - 1];

                            // Só exibe o nome do mês no dia 01 ou no primeiro ponto do gráfico
                            if (dia === "01" || index === 0) {
                                return nomeMes;
                            }
                            return "";
                        }
                    }
                }
            }
        }
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