/**
 * Kanban Alpha - Core Logic
 */

const API_BASE_URL = 'https://api-ij-treinee.onrender.com';

// Pegamos o token e os dados do projeto do localStorage
const TEAM_TOKEN = localStorage.getItem('selectedTeamToken') || 'equipe-alpha-2026';
const CURRENT_PROJECT_ID = localStorage.getItem('currentProjectId');
const CURRENT_PROJECT_NAME = localStorage.getItem('currentProjectName') || 'Projeto Selecionado';

const headers = {
    'Content-Type': 'application/json',
    'x-team-token': TEAM_TOKEN
};

let tasks = [];
let draggedTaskId = null;

// Elementos do DOM
const colTodo = document.getElementById('col-todo');
const colDoing = document.getElementById('col-doing');
const colReview = document.getElementById('col-review');
const colDone = document.getElementById('col-done');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const searchInput = document.getElementById('search-input');

document.addEventListener('DOMContentLoaded', () => {
    // Atualiza o título com o nome do projeto/equipe
    const titleElem = document.querySelector('.app-title');
    if (titleElem) titleElem.innerText = CURRENT_PROJECT_NAME;

    fetchTasks();
    setupEventListeners();
});

/**
 * BUSCA DE TAREFAS
 * Alterado para remover o filtro de ID de projeto e trazer as 20 tasks da equipe
 */
async function fetchTasks() {
    try {
        console.log(`Buscando todas as tasks para: ${TEAM_TOKEN}`);
        
        // REMOVIDO o ?projectId=... para carregar as 20 tarefas da equipe inteira
        const response = await fetch(`${API_BASE_URL}/tasks`, { headers });
        
        if (!response.ok) throw new Error('Falha ao buscar tarefas');
        
        tasks = await response.json();
        console.log("Tasks carregadas:", tasks.length);
        
        renderTasks();
    } catch (error) {
        console.error('Erro:', error);
    }
}

/**
 * RENDERIZAÇÃO
 */
function renderTasks(filter = '') {
    [colTodo, colDoing, colReview, colDone].forEach(col => col.innerHTML = '');

    const filtered = tasks.filter(task => {
        const search = filter.toLowerCase();
        return (task.title?.toLowerCase() || '').includes(search) || 
               (task.assignee?.toLowerCase() || '').includes(search);
    });

    filtered.forEach(task => {
        const card = createTaskCard(task);
        // Distribui nas colunas baseada no status da API
        if (task.status === 'A fazer') colTodo.appendChild(card);
        else if (task.status === 'Em andamento') colDoing.appendChild(card);
        else if (task.status === 'Em revisão') colReview.appendChild(card);
        else if (task.status === 'Concluída') colDone.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.id = task.id;

    const priority = task.priority || 'Média';
    const priorityClass = `priority-${priority.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;

    card.innerHTML = `
        <div class="card-header">
            <span class="priority-badge ${priorityClass}">${priority}</span>
            <button class="delete-btn" onclick="deleteTask(${task.id})">
                <i data-lucide="trash-2"></i>
            </button>
        </div>
        <h4 class="card-title">${task.title}</h4>
        <p class="card-description">${task.description || ''}</p>
        <div class="card-footer">
            <div class="assignee-info">
                <div class="assignee-avatar">${task.assignee?.charAt(0).toUpperCase() || '?'}</div>
                <span class="assignee-name">${task.assignee || 'Sem responsável'}</span>
            </div>
        </div>
    `;

    card.addEventListener('dragstart', () => { card.classList.add('dragging'); draggedTaskId = task.id; });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); draggedTaskId = null; });
    return card;
}

/**
 * ATUALIZAR STATUS (DRAG AND DROP)
 */
async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Falha ao atualizar status');

        const task = tasks.find(t => t.id == taskId);
        if (task) task.status = newStatus;
        renderTasks(searchInput.value);
    } catch (error) {
        console.error('Erro:', error);
        fetchTasks(); // Recarrega em caso de erro para sincronizar
    }
}

/**
 * CRIAR TAREFA
 */
async function createTask(taskData) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                projectId: Number(CURRENT_PROJECT_ID) || 1,
                title: taskData.title,
                description: taskData.description,
                status: 'A fazer',
                priority: taskData.priority,
                assignee: taskData.assignee,
                dueDate: taskData.dueDate,
                estimatedHours: Number(taskData.estimatedHours)
            })
        });

        if (!response.ok) throw new Error('Erro ao criar tarefa');
        const res = await response.json();
        tasks.push(res.task);
        renderTasks();
        closeModal();
    } catch (error) {
        alert('Erro ao criar tarefa. Verifique os campos.');
    }
}

async function deleteTask(taskId) {
    if(!confirm("Deseja excluir esta tarefa?")) return;
    try {
        await fetch(`${API_BASE_URL}/tasks/${taskId}`, { method: 'DELETE', headers });
        tasks = tasks.filter(t => t.id != taskId);
        renderTasks();
    } catch (error) {
        console.error(error);
    }
}

function setupEventListeners() {
    openModalBtn.onclick = () => taskModal.classList.remove('hidden');
    closeModalBtn.onclick = () => taskModal.classList.add('hidden');
    
    taskForm.onsubmit = (e) => {
        e.preventDefault();
        const data = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            priority: document.getElementById('priority').value,
            assignee: document.getElementById('assignee').value,
            dueDate: document.getElementById('dueDate').value,
            estimatedHours: document.getElementById('estimatedHours').value
        };
        createTask(data);
    };

    searchInput.oninput = (e) => renderTasks(e.target.value);

    document.querySelectorAll('.kanban-column').forEach(column => {
        const dropZone = column.querySelector('.column-cards');
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (draggedTaskId) updateTaskStatus(draggedTaskId, column.dataset.status);
        });
    });
}

function closeModal() {
    taskModal.classList.add('hidden');
    taskForm.reset();
}