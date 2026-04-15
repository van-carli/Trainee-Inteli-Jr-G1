/**
 * Kanban Alpha - Core Logic
 */

const API_BASE_URL = 'https://trainee-projetos-api.vercel.app';
const TEAM_TOKEN = 'equipe-alpha-2026';

const headers = {
    'Content-Type': 'application/json',
    'x-team-token': TEAM_TOKEN
};

// State
let tasks = [];
let draggedTaskId = null;

// DOM Elements
const colTodo = document.getElementById('col-todo');
const colDoing = document.getElementById('col-doing');
const colReview = document.getElementById('col-review');
const colDone = document.getElementById('col-done');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const searchInput = document.getElementById('search-input');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    setupEventListeners();
});

/**
 * Fetch all tasks from API
 */
async function fetchTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, { headers });
        if (!response.ok) throw new Error('Falha ao buscar tarefas');
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar tarefas. Verifique a conexão.');
    }
}

/**
 * Render tasks into columns
 */
function renderTasks(filter = '') {
    // Clear columns
    [colTodo, colDoing, colReview, colDone].forEach(col => col.innerHTML = '');

    const filteredTasks = tasks.filter(task => {
        const search = filter.toLowerCase();

        const matchesText =
            (task.title?.toLowerCase() || '').includes(search) ||
            (task.assignee?.toLowerCase() || '').includes(search);

        const matchesPriority =
            (task.priority?.toLowerCase() || '').includes(search);

        return matchesText || matchesPriority;
    });

    filteredTasks.forEach(task => {
        const card = createTaskCard(task);

        switch (task.status) {
            case 'A fazer':
                colTodo.appendChild(card);
                break;
            case 'Em andamento':
                colDoing.appendChild(card);
                break;
            case 'Em revisão':
                colReview.appendChild(card);
                break;
            case 'Concluída':
                colDone.appendChild(card);
                break;
        }
    });

    // Re-initialize Lucide icons for new elements
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Create a task card element
 */
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.id = task.id;

    const priority = task.priority || 'Média';
    const priorityClass = `priority-${priority
        .toLowerCase()
        .normalize("NFD")
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

    // Drag
    card.addEventListener('dragstart', () => {
        card.classList.add('dragging');
        draggedTaskId = task.id;
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        draggedTaskId = null;
    });

    // DELETE com confirmação
    card.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();

    const confirmBox = card.querySelector('.delete-confirm');

    if (confirmBox) return;

    card.innerHTML += `
        <div class="delete-confirm">
            Excluir tarefa?

            <div class="delete-actions">
                <button class="cancel">Cancelar</button>
                <button class="confirm">Excluir</button>
            </div>
        </div>
    `;

    card.querySelector('.cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        renderTasks(searchInput.value);
    });

    card.querySelector('.confirm').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });
});

    return card;
}
/**
 * Update task status via API
 */
async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Falha ao atualizar status');
        
        // Update local state
        const taskIndex = tasks.findIndex(t => t.id == taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].status = newStatus;
        }
        
        renderTasks(searchInput.value);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar tarefa.');
        fetchTasks(); // Revert to server state
    }
}

/**
 * Create new task via API (POST /tasks)
 */
async function createTask(taskData) {
    // 3. Validação: Não permitir envio se o título estiver vazio
    if (!taskData.title || taskData.title.trim() === '') {
        console.error('Erro: O título da tarefa é obrigatório.');
        alert('O título da tarefa é obrigatório.');
        return;
    }

    try {
        // 1. Garantir que o fetch está correto (method, headers)
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers,
            // 2. Garantir que o body contém TODOS os campos obrigatórios
            body: JSON.stringify({
                projectId: 1, // Fixo conforme requisito
                title: taskData.title,
                description: taskData.description,
                status: 'A fazer', // Fixo conforme requisito
                priority: taskData.priority,
                assignee: taskData.assignee,
                dueDate: taskData.dueDate,
                estimatedHours: Number(taskData.estimatedHours) // Garantir que é número
            })
        });

        // 4. Tratar resposta da API corretamente usando res.ok
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro retornado pela API:', errorData);
            throw new Error(`Falha ao criar tarefa: ${response.statusText}`);
        }
        
        const responseData = await response.json();

        console.log('Tarefa criada com sucesso:', responseData);

        // 👇 pega só o objeto task
        const newTask = responseData.task;

        tasks.push(newTask);
        renderTasks(searchInput.value);
        closeModal();
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao criar tarefa. Verifique o console para mais detalhes.');
    }
}

async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) throw new Error('Erro ao deletar tarefa');

        // remove do estado local
        tasks = tasks.filter(t => t.id != taskId);

        renderTasks(searchInput.value);

    } catch (error) {
        console.error(error);
        alert('Erro ao excluir tarefa');
    }
}

/**
 * Event Listeners
 */
function setupEventListeners() {
    // Modal toggle
    openModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModal();
    });

    // Form submission
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            priority: document.getElementById('priority').value,
            assignee: document.getElementById('assignee').value,
            dueDate: document.getElementById('dueDate').value,
            estimatedHours: document.getElementById('estimatedHours').value
        };
        createTask(formData);
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        renderTasks(e.target.value);
    });

    // Drag and Drop for columns
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(column => {
        const dropZone = column.querySelector('.column-cards');
        const status = column.dataset.status;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            if (draggedTaskId) {
                updateTaskStatus(draggedTaskId, status);
            }
        });
    });
}

function openModal() {
    taskModal.classList.remove('hidden');
    document.getElementById('title').focus();
}

function closeModal() {
    taskModal.classList.add('hidden');
    taskForm.reset();
}
