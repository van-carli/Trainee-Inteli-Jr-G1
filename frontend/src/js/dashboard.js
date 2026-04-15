// Configurações da sua API Local
const API_URL = 'https://trainee-projetos-api.vercel.app';
const TEAM_TOKEN = 'equipe-alpha-2026';

let allProjects = [];
let filteredProjects = [];

// Função que BUSCA os projetos na API (GET)
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

// Função que CRIA um projeto na API (POST)
async function createProject(projectData) {
    try {
        projectData.progress = 0; 
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
// 3. Função que desenha os projetos na tela
function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    
    // Limpa a tela antes de desenhar
    grid.innerHTML = '';

    filteredProjects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // --- LÓGICA DO STATUS ---
        let badgeClass = 'badge-planejamento'; // Começa com cinza por padrão
        if (project.status === 'Em andamento') {
            badgeClass = 'badge-media'; // Laranja
        } else if (project.status === 'Concluído') {
            badgeClass = 'badge-concluido'; // Verde
        } else if (project.status === 'Em revisão') {
            badgeClass = 'badge-alta'; // Vermelho
        }

        // --- LÓGICA DA PRIORIDADE ---
        let priorityClass = 'badge-baixa'; // Padrão azul
        let priorityIcon = '🔽';
        
        if (project.priority === 'Alta') {
            priorityClass = 'badge-alta';
            priorityIcon = '🚩'; // ou ⚡
        } else if (project.priority === 'Média') {
            priorityClass = 'badge-media';
            priorityIcon = '🔶'; 
        } else if (project.priority === 'Baixa') {
            priorityClass = 'badge-baixa';
            priorityIcon = '🔷';
        }

        // HTML interno do Card
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

// Lógica que roda quando a página carrega
document.addEventListener('DOMContentLoaded', async () => {
    // Busca os dados e renderiza
    allProjects = await fetchProjects();
    filteredProjects = [...allProjects];
    renderProjects();

    // Botões do Modal
    document.getElementById('btnOpenModal').addEventListener('click', openModal);
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancel').addEventListener('click', closeModal);

    // Filtro de Pesquisa
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const termoPesquisa = e.target.value.toLowerCase();
        filteredProjects = allProjects.filter(project => {
            return project.name.toLowerCase().includes(termoPesquisa) || 
                   project.owner.toLowerCase().includes(termoPesquisa);
        });
        renderProjects();
    });

    // Salvar novo projeto
    document.getElementById('projectForm').addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const formData = new FormData(e.target);
        const newProjectData = Object.fromEntries(formData.entries());
        
        // Simula os dados que a API geraria
        newProjectData.id = Math.floor(Math.random() * 1000) + 10; // ID falso
        newProjectData.progress = 0; // Começa zerado
         
        allProjects.unshift(newProjectData); // Coloca no início da lista
        filteredProjects = [...allProjects]; 
        
        // Desenha os cards de novo
        renderProjects();
        
        // Fecha e limpa
        closeModal();
        e.target.reset(); 
    });
});