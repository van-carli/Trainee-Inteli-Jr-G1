/**
 * Kanban Alpha - Versão Integrada e Funcional com Gemini
 */

const API_BASE_URL = 'https://trainee-projetos-api.vercel.app';

// PEGA DADOS DO PROJETO SELECIONADO NA TELA INDEX
const TEAM_TOKEN = localStorage.getItem('selectedTeamToken') || 'equipe-alpha-2026';
const CURRENT_PROJECT_ID = localStorage.getItem('currentProjectId');
const CURRENT_PROJECT_NAME = localStorage.getItem('currentProjectName') || 'Projeto';

const headers = {
    'Content-Type': 'application/json',
    'x-team-token': TEAM_TOKEN
};

// CONFIGURAÇÃO GEMINI (Copiada da versão funcional)
const GEMINI_MODELS = ['gemini-2.5-flash'];
const GEMINI_API_VERSIONS = ['v1beta', 'v1'];

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
const aiDescriptionBtn = document.getElementById('btn-ai-description');
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyForm = document.getElementById('api-key-form');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeyError = document.getElementById('api-key-error');
const apiKeyCancelBtn = document.getElementById('api-key-cancel');
const apiKeyCancelButton = document.getElementById('api-key-cancel-btn');

let apiKeyResolver = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!CURRENT_PROJECT_ID) {
        alert("Nenhum projeto selecionado! Voltando para a galeria.");
        window.location.href = '../../index.html';
        return;
    }

    document.querySelector('.app-title').innerText = CURRENT_PROJECT_NAME;
    fetchTasks();
    setupEventListeners();
});

// --- LÓGICA DO GEMINI (IGUAL À VERSÃO FUNCIONAL) ---
async function generateDescriptionWithGemini(taskTitle) {
    const geminiApiKey = await getGeminiApiKey();
    if (!geminiApiKey) {
        return generateLocalDescription(taskTitle);
    }

    const prompt = `Você é um assistente de gestão de projetos. Escreva uma descrição para um card de Kanban com base no título informado. Responda somente em português, com exatamente 2 frases completas, sem listas e sem quebrar linha. A resposta deve ter no mínimo 140 caracteres e terminar com ponto final. Título: ${taskTitle}`.trim();

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 260 }
    };

    let lastErrorMessage = '';
    const fallbackDescription = generateLocalDescription(taskTitle);

    for (const apiVersion of GEMINI_API_VERSIONS) {
        for (const model of GEMINI_MODELS) {
            const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${geminiApiKey}`;

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    lastErrorMessage = `Gemini (${model}, ${apiVersion}) retornou ${response.status}.`;

                    // 404 geralmente indica modelo/versão inválidos; tenta o próximo fallback
                    if (response.status === 404) {
                        continue;
                    }

                    // 429 = quota estourada. Retorna fallback local para não travar o fluxo.
                    if (response.status === 429) {
                        console.warn('Gemini sem cota no momento. Usando descrição local.', errorText);
                        return fallbackDescription;
                    }

                    // 401/403 = chave inválida ou sem permissão. Retorna fallback local.
                    if (response.status === 401 || response.status === 403) {
                        console.warn('Gemini sem autorização/permissão. Usando descrição local.', errorText);
                        return fallbackDescription;
                    }

                    // Para outros status, continua tentando fallback também
                    continue;
                }

                const data = await response.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

                let text = rawText.replace(/\s+/g, ' ').trim();
                if (!isDescriptionComplete(text)) {
                    text = fallbackDescription;
                }
                return text;
            } catch (error) {
                lastErrorMessage = error?.message || 'Erro de rede ao chamar o Gemini.';
            }
        }
    }
    
    console.warn(`Gemini indisponível. Usando descrição local. ${lastErrorMessage}`.trim());
    return fallbackDescription;
}

function generateLocalDescription(taskTitle) {
    const cleanTitle = taskTitle.trim().toLowerCase();
    return `Esta tarefa tem como objetivo realizar ${cleanTitle} de forma organizada e alinhada aos critérios do projeto. Ao final, o resultado deve ser validado com o time para garantir qualidade e aderência ao prazo.`;
}

function getGeminiApiKey() {
    const storedKey = localStorage.getItem('geminiApiKey');

    if (storedKey && storedKey.trim()) {
        return Promise.resolve(storedKey.trim());
    }

    return new Promise((resolve) => {
        apiKeyResolver = resolve;
        apiKeyError.classList.add('hidden');
        apiKeyInput.value = '';
        apiKeyModal.classList.remove('hidden');

        setTimeout(() => {
            apiKeyInput.focus();
        }, 0);

        apiKeyInput.onkeydown = (event) => {
            if (event.key === 'Escape') {
                closeApiKeyModal('');
            }
        };

        apiKeyModal.onclick = (event) => {
            if (event.target === apiKeyModal) {
                closeApiKeyModal('');
            }
        };
    });
}

function closeApiKeyModal(value = '') {
    apiKeyModal.classList.add('hidden');
    apiKeyForm.reset();
    apiKeyError.classList.add('hidden');

    if (apiKeyResolver) {
        apiKeyResolver(value);
        apiKeyResolver = null;
    }
}

function isDescriptionComplete(text) {
    if (!text || text.length < 80) return false;
    return /[.!?]$/.test(text);
}

// --- LÓGICA DO KANBAN ---
async function fetchTasks() {
    try {
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
               (task.assignee?.toLowerCase() || '').includes(search) ||
               (task.priority?.toLowerCase() || '').includes(search);
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

    const p = task.priority || 'Média';
    const priorityClass = `priority-${p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;

    card.innerHTML = `
        <div class="card-header">
            <span class="priority-badge ${priorityClass}">${p}</span>
            <button class="delete-btn">
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

function setupEventListeners() {
    document.getElementById('open-modal-btn').onclick = () => taskModal.classList.remove('hidden');
    document.getElementById('close-modal-btn').onclick = closeModal;
    apiKeyCancelBtn.onclick = () => closeApiKeyModal('');
    apiKeyCancelButton.onclick = () => closeApiKeyModal('');

    apiKeyForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const normalizedKey = apiKeyInput.value.trim();

        if (!normalizedKey) {
            apiKeyError.classList.remove('hidden');
            apiKeyInput.focus();
            return;
        }

        localStorage.setItem('geminiApiKey', normalizedKey);
        closeApiKeyModal(normalizedKey);
    });
    
    // Configuração do Botão de IA (Lógica corrigida)
    aiDescriptionBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        if (!title) return alert("Digite o título primeiro.");

        try {
            aiDescriptionBtn.disabled = true;
            aiDescriptionBtn.innerText = "Gerando...";
            const desc = await generateDescriptionWithGemini(title);
            descriptionInput.value = desc;
        } catch (error) {
            alert(error.message || 'Erro ao gerar descrição com Gemini.');
        } finally {
            aiDescriptionBtn.disabled = false;
            aiDescriptionBtn.innerText = "✨ Gerar descrição com Gemini";
        }
    });

    taskForm.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            title: titleInput.value,
            description: descriptionInput.value,
            priority: document.getElementById('priority').value,
            assignee: document.getElementById('assignee').value,
            dueDate: document.getElementById('dueDate').value,
            estimatedHours: document.getElementById('estimatedHours').value
        };
        await createTask(data);
    };

    searchInput.oninput = (e) => renderTasks(e.target.value);

    // Configuração do Drag and Drop
    document.querySelectorAll('.kanban-column').forEach(column => {
        const dropZone = column.querySelector('.column-cards');
        dropZone.addEventListener('dragover', (e) => e.preventDefault());
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedTaskId) updateTaskStatus(draggedTaskId, column.dataset.status);
        });
    });
}

async function updateTaskStatus(taskId, newStatus) {
    await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
    });
    const task = tasks.find(t => t.id == taskId);
    if (task) task.status = newStatus;
    renderTasks(searchInput.value);
}

async function createTask(taskData) {
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

function closeModal() { taskModal.classList.add('hidden'); taskForm.reset(); }