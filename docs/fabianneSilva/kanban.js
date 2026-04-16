// ===== CONFIG DA API =====
const API_BASE_URL = 'https://trainee-projetos-api.vercel.app';
const TEAM_TOKEN = 'equipe-alpha-2026';

// Headers padrão para todas as requisições
const headers = {
    'Content-Type': 'application/json',
    'x-team-token': TEAM_TOKEN
};

// ===== ESTADO =====
// Lista de tarefas carregadas da API
let tasks = [];
// Guarda o id da tarefa sendo arrastada (drag and drop)
let draggedTaskId = null;

// ===== DOM =====
const colTodo = document.getElementById('col-todo');
const colDoing = document.getElementById('col-doing');
const colReview = document.getElementById('col-review');
const colDone = document.getElementById('col-done');

const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');

const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

const searchInput = document.getElementById('search-input');

// ===== INIT =====
// Carrega tarefas e eventos ao abrir a página
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    setupEventListeners();
});

// ===== API =====
// Busca todas as tarefas
async function fetchTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, { headers });

        if (!response.ok) throw new Error('Falha ao buscar tarefas');

        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar tarefas.');
    }
}

// ===== RENDER =====
// Renderiza tarefas nas colunas (com filtro opcional)
function renderTasks(filter = '') {
    // Limpa colunas antes de renderizar
    [colTodo, colDoing, colReview, colDone].forEach(col => col.innerHTML = '');

    const filteredTasks = tasks.filter(task => {
        const search = filter.toLowerCase();

        // Filtra por título, responsável ou prioridade
        return (
            (task.title?.toLowerCase() || '').includes(search) ||
            (task.assignee?.toLowerCase() || '').includes(search) ||
            (task.priority?.toLowerCase() || '').includes(search)
        );
    });

    filteredTasks.forEach(task => {
        const card = createTaskCard(task);

        // Envia para coluna correta pelo status
        switch (task.status) {
            case 'A fazer': colTodo.appendChild(card); break;
            case 'Em andamento': colDoing.appendChild(card); break;
            case 'Em revisão': colReview.appendChild(card); break;
            case 'Concluída': colDone.appendChild(card); break;
        }
    });

    // Reaplica ícones (necessário após innerHTML)
    if (window.lucide) window.lucide.createIcons();
}

// Cria o card HTML de uma tarefa
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.id = task.id;

    // Gera classe CSS da prioridade (ex: priority-alta)
    const priority = task.priority || 'Média';
    const priorityClass = `priority-${priority
        .toLowerCase()
        .normalize("NFD") // remove acentos
        .replace(/[\u0300-\u036f]/g, "")}`;

    card.innerHTML = `
        <div class="card-header">
            <span class="priority-badge ${priorityClass}">
                ${priority}
            </span>

            <button class="delete-btn">
                <i data-lucide="trash-2"></i>
            </button>
        </div>

        <h4 class="card-title">${task.title}</h4>
        <p class="card-description">${task.description || ''}</p>

        <div class="card-footer">
            <div class="assignee-info">
                <div class="assignee-avatar">
                    ${task.assignee?.charAt(0).toUpperCase() || '?'}
                </div>
                <span class="assignee-name">
                    ${task.assignee || 'Sem responsável'}
                </span>
            </div>
        </div>
    `;

    // ===== DRAG =====
    card.addEventListener('dragstart', () => {
        card.classList.add('dragging');
        draggedTaskId = task.id;
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        draggedTaskId = null;
    });

    // ===== DELETE COM CONFIRMAÇÃO =====
    card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();

        // Evita duplicar caixa de confirmação
        if (card.querySelector('.delete-confirm')) return;

        card.innerHTML += `
            <div class="delete-confirm">
                Excluir tarefa?
                <div class="delete-actions">
                    <button class="cancel">Cancelar</button>
                    <button class="confirm">Excluir</button>
                </div>
            </div>
        `;

        // Cancela exclusão (re-renderiza)
        card.querySelector('.cancel').addEventListener('click', (e) => {
            e.stopPropagation();
            renderTasks(searchInput.value);
        });

        // Confirma exclusão
        card.querySelector('.confirm').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });
    });

    return card;
}

// Atualiza status (drag and drop)
async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error();

        // Atualiza localmente para evitar novo fetch
        const task = tasks.find(t => t.id == taskId);
        if (task) task.status = newStatus;

        renderTasks(searchInput.value);
    } catch {
        alert('Erro ao atualizar tarefa.');
        fetchTasks(); // fallback
    }
}

// Cria nova tarefa
async function createTask(taskData) {
    // Validação básica
    if (!taskData.title?.trim()) {
        alert('Título obrigatório');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                projectId: 1,
                title: taskData.title,
                description: taskData.description,
                status: 'A fazer',
                priority: taskData.priority,
                assignee: taskData.assignee,
                dueDate: taskData.dueDate,
                estimatedHours: Number(taskData.estimatedHours)
            })
        });

        if (!response.ok) throw new Error();

        const newTask = (await response.json()).task;

        // Atualiza estado local
        tasks.push(newTask);

        renderTasks(searchInput.value);
        closeModal();
    } catch {
        alert('Erro ao criar tarefa.');
    }
}

// Deleta tarefa
async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) throw new Error();

        // Remove do estado local
        tasks = tasks.filter(t => t.id != taskId);

        renderTasks(searchInput.value);
    } catch {
        alert('Erro ao excluir tarefa');
    }
}

// ===== EVENTOS =====
function setupEventListeners() {
    // Modal (abrir/fechar)
    openModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);

    // Fecha clicando fora
    taskModal.addEventListener('click', e => {
        if (e.target === taskModal) closeModal();
    });

    // Submit do formulário
    taskForm.addEventListener('submit', e => {
        e.preventDefault();

        createTask({
            title: title.value,
            description: description.value,
            priority: priority.value,
            assignee: assignee.value,
            dueDate: dueDate.value,
            estimatedHours: estimatedHours.value
        });
    });

    // Busca dinâmica
    searchInput.addEventListener('input', e => {
        renderTasks(e.target.value);
    });

    // Drag & drop nas colunas
    document.querySelectorAll('.kanban-column').forEach(column => {
        const dropZone = column.querySelector('.column-cards');
        const status = column.dataset.status;

        dropZone.addEventListener('dragover', e => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');

            if (draggedTaskId) {
                updateTaskStatus(draggedTaskId, status);
            }
        });
    });
}

// ===== MODAL =====
function openModal() {
    taskModal.classList.remove('hidden');
    document.getElementById('title').focus();
}

function closeModal() {
    taskModal.classList.add('hidden');
    taskForm.reset();
}