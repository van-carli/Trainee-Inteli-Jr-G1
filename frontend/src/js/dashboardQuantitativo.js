const BASE_URL = 'https://trainee-projetos-api.vercel.app';
const ALL_TOKENS = ['equipe-alpha-2026', 'equipe-beta-2026', 'equipe-gamma-2026', 'equipe-delta-2026', 'equipe-epsilon-2026'];
let chartInstances = {};

async function changeTeam() {
    const val = document.getElementById('teamSelect').value;
    const teamNameDisplay = document.getElementById('team-name');
    
    // Limpa o nome e os gráficos antes de carregar o novo
    teamNameDisplay.innerText = val === "TODAS" ? "VISÃO GERAL DA EMPRESA" : val.replace(/-/g, ' ').toUpperCase();
    
    val === "TODAS" ? await fetchAllTeams() : await fetchDashboard(val);
}

// BUSCA DADOS DE UMA EQUIPE ISOLADA
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
            const projs = await resProjs.json();
            
            // Aqui passamos 'false' para indicar que não é a visão geral
            updateUI(dash, projs, false);
            processAndRenderActivity(tasks);
        }
    } catch (e) { console.error("Erro ao carregar equipe:", e); }
}

// BUSCA E CONSOLIDA TUDO (VISÃO GERAL)
async function fetchAllTeams() {
    let globalDash = { totalProjects: 0, totalTasks: 0, overdueTasks: 0, highPriorityTasks: 0, tasksByStatus: {} };
    let allTasks = [], allProjs = [];

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
            if (rP.ok) allProjs = allProjs.concat(await rP.json());
        } catch (e) { console.warn("Token falhou:", t); }
    }
    // Passamos 'true' para indicar Visão Geral
    updateUI(globalDash, allProjs, true);
    processAndRenderActivity(allTasks);
}

function updateUI(dash, projetos, isGeral) {
    // Atualiza Cards
    document.getElementById('totalProjects').innerText = dash.totalProjects;
    document.getElementById('totalTasks').innerText = dash.totalTasks;
    document.getElementById('overdueTasks').innerText = dash.overdueTasks;
    document.getElementById('highPriorityTasks').innerText = dash.highPriorityTasks;

    const container = document.getElementById('projects-canvas-container');
    container.innerHTML = ''; // LIMPA TUDO ANTES DE DESENHAR

    if (isGeral) {
        // VISÃO GERAL: Média total
        const media = Math.round(projetos.reduce((a, b) => a + (b.progress || 0), 0) / (projetos.length || 1));
        const div = document.createElement('div');
        div.className = 'gauge-item-geral';
        div.innerHTML = `<canvas id="gauge-geral"></canvas>`;
        container.appendChild(div);
        renderGauge('gauge-geral', media, "MÉDIA DE TODAS AS EQUIPES", true);
    } else {
        // VISÃO ISOLADA: Mostra apenas os projetos do Token selecionado
        projetos.forEach((p, i) => {
            const div = document.createElement('div');
            div.className = 'gauge-item';
            div.innerHTML = `<canvas id="g-${i}"></canvas><span>${p.name}</span>`;
            container.appendChild(div);
            renderGauge(`g-${i}`, p.progress, "", false);
        });
    }

    // Gráfico de Barras de Status
    const labels = Object.keys(dash.tasksByStatus);
    const cores = labels.map(l => l==='Concluída'?'#00ff7f':l==='Em revisão'?'#ff4d4d':l==='Em andamento'?'#ffa500':'#3179dd');
    renderChart('tasksChart', 'bar', labels, Object.values(dash.tasksByStatus), cores);
}

function renderGauge(id, percent, sub, isBig) {
    const ctx = document.getElementById(id).getContext('2d');
    if (chartInstances[id]) chartInstances[id].destroy();
    
    // Cores baseadas na sua imagem: <35 Vermelho, <80 Laranja, >80 Verde
    let col = percent > 80 ? '#00ff7f' : percent >= 35 ? '#ffa500' : '#ff4d4d';
    
    chartInstances[id] = new Chart(ctx, {
        type: 'doughnut',
        data: { 
            datasets: [{ 
                data: [percent, 100 - percent], 
                backgroundColor: [col, '#1a1c2e'], 
                circumference: 180, 
                rotation: 270, 
                cutout: isBig ? '85%' : '75%', 
                borderRadius: 5 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false }, tooltip: { enabled: false } } 
        },
        plugins: [{
            afterDraw: (chart) => {
                const { ctx, chartArea: { top, bottom, left, right } } = chart;
                const cX = (left + right) / 2, cY = (top + bottom) * 0.85;
                ctx.save();
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${isBig ? '36px' : '18px'} "JetBrains Mono"`;
                ctx.textAlign = 'center'; ctx.fillText(`${percent}%`, cX, cY);
                if (sub) { 
                    ctx.fillStyle = '#9ca3af'; 
                    ctx.font = '10px "JetBrains Mono"'; 
                    ctx.fillText(sub, cX, cY + 25); 
                }
                ctx.restore();
            }
        }]
    });
}

// Funções de Barras e Linha continuam iguais...
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

document.addEventListener('DOMContentLoaded', () => { 
    lucide.createIcons();
    fetchDashboard(ALL_TOKENS[0]); 
});