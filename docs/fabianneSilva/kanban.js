/**
 * Kanban Alpha - Core Logic
 */

const API_BASE_URL = 'https://api-ij-treinee.onrender.com';
const TEAM_TOKEN = 'equipe-alpha-2026';

const headers = {
    'Content-Type': 'application/json',
    'x-team-token': TEAM_TOKEN
};

// Configuracao da IA Gemini: chave de acesso e modelo usados para gerar texto.
const GEMINI_API_KEY = 'AIzaSyD3u2RFRgeTAN1fIK16GA2H9WxQBrdq7uU';
const GEMINI_MODEL = 'gemini-2.5-flash';

let currentCalendarDate = new Date()

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
// Referencias dos campos do modal para ler o titulo e preencher a descricao com IA.
const aiDescriptionBtn = document.getElementById('btn-ai-description');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');

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

        // pega só o objeto task
        const newTask = responseData.task;

        tasks.push(newTask);
        renderTasks(searchInput.value);
        closeModal();
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao criar tarefa. Verifique o console para mais detalhes.');
    }
}

// Faz a chamada para o Gemini e retorna uma descricao curta para a tarefa.
async function generateDescriptionWithGemini(taskTitle) {
    if (!GEMINI_API_KEY) {
        throw new Error('Defina sua chave do Gemini em GEMINI_API_KEY.');
    }

    const prompt = `
Voce e um assistente de gestao de projetos.
Escreva uma descricao para um card de Kanban com base no titulo informado.
Responda somente em portugues, em 2 frases completas, sem listas e sem quebrar linha.
A descricao deve explicar objetivo e resultado esperado da tarefa.
Titulo: ${taskTitle}
`.trim();

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 180
                }
            })
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = errorBody;

        try {
            const parsedError = JSON.parse(errorBody);
            errorMessage = parsedError?.error?.message || parsedError?.message || errorBody;
        } catch (_) {
            // Mantem o texto original quando a resposta nao for JSON.
        }

        throw new Error(`Gemini retornou erro ${response.status}: ${errorMessage}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];

    const rawText = parts
        .map((part) => part?.text || '')
        .join('')
        .replace(/\s+/g, ' ')
        .trim();

    const sentenceParts = (rawText.match(/[^.!?]+[.!?]?/g) || [])
        .map((item) => item.trim())
        .filter(Boolean);

    const uniqueSentences = [];
    sentenceParts.forEach((item) => {
        const normalized = item.toLowerCase();
        const alreadyExists = uniqueSentences.some((existing) => existing.toLowerCase() === normalized);
        if (!alreadyExists) {
            uniqueSentences.push(item);
        }
    });

    let text = uniqueSentences.join(' ').replace(/\s+/g, ' ').trim();

    const isBadText = !text || text.length < 40 || text.split(/\s+/).filter(Boolean).length < 8;
    if (isBadText) {
        text = `Esta tarefa tem como objetivo ${taskTitle.toLowerCase()} de forma organizada. Ao final, o card deve entregar uma implementacao funcional e validada para o fluxo do projeto.`;
    }

    if (!/[.!?]$/.test(text)) {
        text = `${text}.`;
    }

    return text;
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

    aiDescriptionBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();

        if (!title) {
            alert('Digite o título da tarefa antes de gerar a descrição com IA.');
            titleInput.focus();
            return;
        }

        const originalButtonText = aiDescriptionBtn.textContent;

        try {
            aiDescriptionBtn.disabled = true;
            aiDescriptionBtn.textContent = 'Gerando descrição...';

            const generatedDescription = await generateDescriptionWithGemini(title);
            descriptionInput.value = generatedDescription;
            descriptionInput.focus();
        } catch (error) {
            console.error('Erro ao gerar descrição com Gemini:', error);
            alert(error.message || 'Não foi possível gerar a descrição agora. Verifique a chave e tente novamente.');
        } finally {
            aiDescriptionBtn.disabled = false;
            aiDescriptionBtn.textContent = originalButtonText;
        }
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
