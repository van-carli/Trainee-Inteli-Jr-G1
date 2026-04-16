// Configurações da API
const API_URL = 'https://trainee-projetos-api.vercel.app';
// Pega o token da equipe selecionada (ou padrão Alpha)
const TEAM_TOKEN = localStorage.getItem('selectedTeamToken') || 'equipe-alpha-2026';

let allProjects = [];
let filteredProjects = [];

// Função que busca os projetos na API (GET)
async function fetchProjects() {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'GET',
            headers: {
                'x-team-token': TEAM_TOKEN
            }
        });
        
        if (!response.ok) throw new Error("Erro na resposta da API");
        return await response.json();
    } catch (error) {
        console.error("Erro ao buscar projetos:", error);
        return []; 
    }
}

// Função que cria um projeto na API (POST)
async function createProject(projectData) {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-team-token': TEAM_TOKEN
            },
            body: JSON.stringify(projectData)
        });
        return await response.json();
    } catch (error) {
        console.error("Erro ao criar projeto:", error);
    }
}

// Função que desenha os projetos na tela
function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '';

    filteredProjects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'pointer';

        // SALVA O ID E NOME DO PROJETO PARA O KANBAN LER
        card.onclick = () => {
            localStorage.setItem('currentProjectId', project.id);
            localStorage.setItem('currentProjectName', project.name);
                window.location.href = './frontend/src/kanban.html'; 
        };

        // Lógica das cores dos Status
        let badgeClass = 'badge-planejamento';
        if (project.status === 'Em andamento') badgeClass = 'badge-media';
        else if (project.status === 'Concluído') badgeClass = 'badge-concluido';
        else if (project.status === 'Em revisão') badgeClass = 'badge-alta';

        // Lógica da Prioridade
        let priorityClass = 'badge-baixa';
        let priorityIcon = '🔽';
        if (project.priority === 'Alta') {
            priorityClass = 'badge-alta';
            priorityIcon = '🚩'; 
        } else if (project.priority === 'Média') {
            priorityClass = 'badge-media';
            priorityIcon = '🔶'; 
        }

        card.innerHTML = `
            <div class="card-header">
                <span class="card-id">#${project.id}</span>
                <div style="display: flex; gap: 8px;">
                    <span class="badge ${priorityClass}">${priorityIcon} ${project.priority}</span>
                    <span class="badge ${badgeClass}">${project.status}</span>
                </div>
            </div>
            
            <h3 class="card-title">${project.name}</h3>
            
            <div class="card-subtitle">
                <span>🏢 ${project.client}</span>
                <span>👤 ${project.owner}</span>
            </div>
            
            <p class="card-desc">${project.description}</p>
            
            <div class="progress-container">
                <div class="progress-info">
                    <span>Progresso</span>
                    <span>${project.progress}%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${project.progress}%;"></div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openModal() { document.getElementById('projectModal').classList.add('active'); }
function closeModal() { document.getElementById('projectModal').classList.remove('active'); }

// Lógica de Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    allProjects = await fetchProjects();
    filteredProjects = [...allProjects];
    renderProjects();

    document.getElementById('btnOpenModal').addEventListener('click', openModal);
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancel').addEventListener('click', closeModal);

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        filteredProjects = allProjects.filter(p => 
            p.name.toLowerCase().includes(termo) || p.owner.toLowerCase().includes(termo)
        );
        renderProjects();
    });

    document.getElementById('projectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.progress = 0;

        await createProject(data);
        allProjects = await fetchProjects(); // Recarrega da API
        filteredProjects = [...allProjects];
        renderProjects();
        closeModal();
        e.target.reset();
    });
});