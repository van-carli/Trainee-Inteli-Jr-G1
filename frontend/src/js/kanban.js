/**
 * Kanban Alpha - Core Logic (Versão com Gemini AI)
 */

const API_BASE_URL = 'https://api-ij-treinee.onrender.com';

// Integração com LocalStorage (Suas configurações atuais)
const TEAM_TOKEN = localStorage.getItem('selectedTeamToken') || 'equipe-alpha-2026';
const CURRENT_PROJECT_ID = localStorage.getItem('currentProjectId');
const CURRENT_PROJECT_NAME = localStorage.getItem('currentProjectName') || 'Projeto Selecionado';

const headers = {
    'Content-Type': 'application/json',
    'x-team-token': TEAM_TOKEN
};

// Configuração Gemini (vinda dos arquivos de referência)
// Dica: Altere para 'gemini-1.5-flash' se o modelo 2.5 não estiver disponível na sua região.
const GEMINI_API_KEY = 'AIzaSyD3u2RFRgeTAN1fIK16GA2H9WxQBrdq7uU'; 
const GEMINI_MODEL = 'gemini-1.5-flash'; 

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

// Elementos da IA
const aiDescriptionBtn = document.getElementById('btn-ai-description');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');

document.addEventListener('DOMContentLoaded', () => {
    const titleElem = document.querySelector('.app-title');
    if (titleElem) titleElem.innerText = CURRENT_PROJECT_NAME;

    fetchTasks();
    setupEventListeners();
});

// --- LÓGICA DA IA GEMINI ---

async function generateDescriptionWithGemini(taskTitle) {
    if (!GEMINI_API_KEY) throw new Error('Chave API não configurada.');

    const prompt = `Você é um assistente de gestão de projetos experiente. Escreva uma descrição curta para um card de Kanban baseada no título: "${taskTitle}". Responda em português, no máximo 2 frases, sem listas. Foco no objetivo da tarefa.`.trim();

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 150 }
            })
        }
    );

    if (!response.ok) throw new Error('Falha na comunicação com o Gemini');

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
}

// --- RESTO DA LÓGICA DO KANBAN ---

async function fetchTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, { headers });
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
        fetchTasks();
    }
}

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
        alert('Erro ao criar tarefa.');
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
    
    // NOVO: Evento do Botão de IA
    aiDescriptionBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        if (!title) {
            alert('Digite o título da tarefa primeiro.');
            return;
        }

        try {
            aiDescriptionBtn.disabled = true;
            aiDescriptionBtn.innerText = '✨ Processando...';
            const description = await generateDescriptionWithGemini(title);
            descriptionInput.value = description;
        } catch (error) {
            alert('Erro ao gerar descrição: ' + error.message);
        } finally {
            aiDescriptionBtn.disabled = false;
            aiDescriptionBtn.innerText = '✨ Gerar descrição com Gemini';
        }
    });

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

function closeModal() {
    taskModal.classList.add('hidden');
    taskForm.reset();
}
