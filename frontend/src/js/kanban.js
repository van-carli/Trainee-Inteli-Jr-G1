/**
 * Kanban Alpha - Project Specific Logic
 */

const API_BASE_URL = 'https://api-ij-treinee.onrender.com';

// PEGA DADOS DO PROJETO SELECIONADO NA TELA INDEX
const TEAM_TOKEN = localStorage.getItem('selectedTeamToken');
const CURRENT_PROJECT_ID = localStorage.getItem('currentProjectId');
const CURRENT_PROJECT_NAME = localStorage.getItem('currentProjectName') || 'Projeto';

const headers = {
    'Content-Type': 'application/json',
    'x-team-token': TEAM_TOKEN
};

// IA Gemini
const GEMINI_API_KEY = 'AIzaSyD3u2RFRgeTAN1fIK16GA2H9WxQBrdq7uU'; 
const GEMINI_MODEL = 'gemini-1.5-flash'; 

let tasks = [];
let draggedTaskId = null;

// DOM
const colTodo = document.getElementById('col-todo');
const colDoing = document.getElementById('col-doing');
const colReview = document.getElementById('col-review');
const colDone = document.getElementById('col-done');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const searchInput = document.getElementById('search-input');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');

document.addEventListener('DOMContentLoaded', () => {
    if (!CURRENT_PROJECT_ID || !TEAM_TOKEN) {
        alert("Nenhum projeto selecionado! Voltando para a galeria.");
        window.location.href = '../../index.html';
        return;
    }

    document.querySelector('.app-title').innerText = CURRENT_PROJECT_NAME;
    fetchTasks();
    setupEventListeners();
});

async function fetchTasks() {
    try {
        // FILTRADO PELO PROJETO VINDO DA INDEX
        const response = await fetch(`${API_BASE_URL}/tasks?projectId=${CURRENT_PROJECT_ID}`, { headers });
        if (!response.ok) throw new Error('Falha ao buscar tarefas');
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error('Erro:', error);
    }
}

function renderTasks(filter = '') {
    [colTodo, colDoing, colReview, colDone].forEach(col => col.innerHTML = '');

    const filtered = tasks.filter(task => {
        const search = filter.toLowerCase();
        return (task.title?.toLowerCase() || '').includes(search) || 
               (task.assignee?.toLowerCase() || '').includes(search);
    });

    filtered.forEach(task => {
        const card = createTaskCard(task);
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

    const priorityClass = `priority-${task.priority.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;

    card.innerHTML = `
        <div class="card-header">
            <span class="priority-badge ${priorityClass}">${task.priority}</span>
            <button class="delete-btn" onclick="deleteTask(${task.id})">
                <i data-lucide="trash-2"></i>
            </button>
        </div>
        <h4 class="card-title">${task.title}</h4>
        <p class="card-description">${task.description || ''}</p>
        <div class="card-footer">
            <div class="assignee-info">
                <div class="assignee-avatar">${task.assignee?.charAt(0).toUpperCase() || '?'}</div>
                <span class="assignee-name">${task.assignee}</span>
            </div>
        </div>
    `;

    card.addEventListener('dragstart', () => { card.classList.add('dragging'); draggedTaskId = task.id; });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); draggedTaskId = null; });
    return card;
}

async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
            const task = tasks.find(t => t.id == taskId);
            if (task) task.status = newStatus;
            renderTasks(searchInput.value);
        }
    } catch (error) { console.error(error); }
}

async function createTask(taskData) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                projectId: Number(CURRENT_PROJECT_ID),
                title: taskData.title,
                description: taskData.description,
                status: 'A fazer',
                priority: taskData.priority,
                assignee: taskData.assignee,
                dueDate: taskData.dueDate,
                estimatedHours: Number(taskData.estimatedHours)
            })
        });
        if (response.ok) {
            const res = await response.json();
            tasks.push(res.task);
            renderTasks();
            closeModal();
        }
    } catch (error) { alert('Erro ao criar tarefa.'); }
}

async function generateDescriptionWithGemini(taskTitle) {
    const prompt = `Escreva uma descrição de 2 frases para a tarefa: ${taskTitle}. Foco em objetivo e resultado.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function setupEventListeners() {
    document.getElementById('open-modal-btn').onclick = () => taskModal.classList.remove('hidden');
    document.getElementById('close-modal-btn').onclick = closeModal;
    
    document.getElementById('btn-ai-description').onclick = async () => {
        const title = titleInput.value;
        if (!title) return alert("Insira um título.");
        const btn = document.getElementById('btn-ai-description');
        btn.innerText = "Gerando...";
        const desc = await generateDescriptionWithGemini(title);
        descriptionInput.value = desc;
        btn.innerText = "✨ Gerar descrição com Gemini";
    };

    taskForm.onsubmit = (e) => {
        e.preventDefault();
        const data = {
            title: titleInput.value,
            description: descriptionInput.value,
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

async function deleteTask(taskId) {
    if(!confirm("Excluir?")) return;
    await fetch(`${API_BASE_URL}/tasks/${taskId}`, { method: 'DELETE', headers });
    tasks = tasks.filter(t => t.id != taskId);
    renderTasks();
}

function closeModal() { taskModal.classList.add('hidden'); taskForm.reset(); }