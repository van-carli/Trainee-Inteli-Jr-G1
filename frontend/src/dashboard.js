// Configurações da sua API Local
const API_URL = 'http://localhost:3000';
const TEAM_TOKEN = 'equipe-alpha-2026';

let allProjects = [];
let filteredProjects = [];

// 1. Função que BUSCA os projetos REAIS na API (GET)
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

// 2. Função que CRIA um projeto REAL na API (POST)
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

// 3. Função que desenha os projetos na tela (AGORA SEM A BARRA LATERAL E MAIS BONITO)
function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    
    // Limpa a tela antes de desenhar
    grid.innerHTML = '';

    filteredProjects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Define a cor da "pílula" de status baseada no texto
        let statusColor = '#8D97B4'; // Padrão cinza
        let statusBg = '#F3F4F6';
        
        if(project.status === 'Em andamento') {
            statusColor = '#FF8655'; // Laranja
            statusBg = '#FFF2EC';
        } else if (project.status === 'Concluído') {
            statusColor = '#10B981'; // Verde
            statusBg = '#ECFDF5';
        } else if (project.status === 'Em revisão') {
            statusColor = '#3B82F6'; // Azul
            statusBg = '#EFF6FF';
        }

        // HTML interno do Card (com visual premium)
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <span style="color: var(--text-secondary); font-size: 0.85rem; font-weight: bold;">#${project.id}</span>
                <span style="color: ${statusColor}; background-color: ${statusBg}; font-size: 0.75rem; font-weight: bold; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">${project.status}</span>
            </div>
            
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">${project.name}</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">🏢 ${project.client} &nbsp;•&nbsp; 👤 ${project.owner}</p>
            
            <p style="font-size: 0.9rem; color: var(--card-text); margin-bottom: 24px; height: 42px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${project.description}</p>
            
            <div style="margin-top: auto;">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 8px; font-weight: 600; color: var(--text-secondary);">
                    <span>Progresso</span>
                    <span>${project.progress}%</span>
                </div>
                <div style="background: #F3F4F6; border-radius: 8px; height: 8px; width: 100%; overflow: hidden;">
                    <div style="background: var(--accent-primary); height: 100%; width: ${project.progress}%; border-radius: 8px; transition: width 0.5s ease-in-out;"></div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openModal() { document.getElementById('projectModal').classList.add('active'); }
function closeModal() { document.getElementById('projectModal').classList.remove('active'); }

// 4. Lógica que roda quando a página carrega
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
    // Lógica de Salvar um Novo Projeto (Atualizada)
    document.getElementById('projectForm').addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const formData = new FormData(e.target);
        const newProjectData = Object.fromEntries(formData.entries());
        
        // Simula os dados que a API geraria
        newProjectData.id = Math.floor(Math.random() * 1000) + 10; // ID falso
        newProjectData.progress = 0; // Começa zerado
        
        // O PULO DO GATO: Como a API não tem POST /projects, 
        // a gente adiciona na lista local para aparecer na tela!
        allProjects.unshift(newProjectData); // Coloca no início da lista
        filteredProjects = [...allProjects]; 
        
        // Desenha os cards de novo
        renderProjects();
        
        // Fecha e limpa
        closeModal();
        e.target.reset(); 
    });
});