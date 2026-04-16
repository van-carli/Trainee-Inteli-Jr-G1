/* =====================================================
    CONFIGURAÇÃO INICIAL - CONEXÃO COM A API
    ===================================================== 
    Aqui guardamos o endereço da API, que é o local de onde
    vamos buscar os dados, e o token da equipe, que funciona
    como uma senha obrigatória para a API aceitar a requisição.
*/

const API_BASE_URL = 'https://api-ij-treinee.onrender.com';
const TEAM_TOKEN = 'equipe-alpha-2026';
let currentCalendarDate = new Date();
let allTasks = [];
let currentDeadlineFilter = 'all';
let currentProjectFilter = 'all';
let projectsById = new Map();
let allProjects = [];

/* =====================================================
    SELETORES DO DOM - REFERÊNCIAS AOS ELEMENTOS HTML
    ===================================================== 
    Aqui pegamos os elementos da página pelo id para poder
    mudar texto, esconder, mostrar e atualizar a interface.
*/

const calendarElements = {
    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    currentMonthLabel: document.getElementById('currentMonthLabel'),
    feedbackArea: document.getElementById('feedbackArea'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    emptyState: document.getElementById('emptyState'),
    retryBtn: document.getElementById('retryBtn'),
    alertOverdueCount: document.getElementById('alertOverdueCount'),
    alertSoonCount: document.getElementById('alertSoonCount'),
    alertOkCount: document.getElementById('alertOkCount'),
    alertDoneCount: document.getElementById('alertDoneCount'),
    dayTasksModal: document.getElementById('dayTasksModal'),
    closeDayTasksModalBtn: document.getElementById('closeDayTasksModalBtn'),
    dayTasksModalSubtitle: document.getElementById('dayTasksModalSubtitle'),
    dayTasksModalList: document.getElementById('dayTasksModalList'),
    deadlineFilterSelect: document.getElementById('deadlineFilterSelect'),
    projectFilterSelect: document.getElementById('projectFilterSelect')
};

function getTaskProjectId(task) {
    return normalizeProjectId(task?.projectId ?? task?.project_id ?? task?.project?.id);
}

function isTaskInSelectedProject(task) {
    const taskProjectId = getTaskProjectId(task);

    // Filtro de projeto com switch-case simples.
    switch (currentProjectFilter) {
        case 'all':
            return true;
        default:
            return taskProjectId === currentProjectFilter;
    }
}

function getFilteredTasks(tasks) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
        if (!isTaskInSelectedProject(task)) {
            return false;
        }

        const urgency = getTaskUrgency(task, today);

        // Filtro de prazo com switch-case para manter o código simples e didático.
        switch (currentDeadlineFilter) {
            case 'overdue':
                return urgency === 'red';
            case 'soon':
                return urgency === 'yellow';
            case 'ok':
                return urgency === 'blue';
            case 'done':
                return urgency === 'green';
            case 'all':
            default:
                return true;
        }
    });
}

function getFilteredProjects(projects) {
    return projects.filter((project) => {
        const projectId = normalizeProjectId(project?.id ?? project?.projectId ?? project?.project_id);

        // Mesmo padrão de switch-case para manter consistência.
        switch (currentProjectFilter) {
            case 'all':
                return true;
            default:
                return projectId === currentProjectFilter;
        }
    });
}

function renderProjectFilterOptions() {
    if (!calendarElements.projectFilterSelect) return;

    const currentValue = currentProjectFilter;
    const select = calendarElements.projectFilterSelect;
    select.innerHTML = '<option value="all">Todos os projetos</option>';

    allProjects.forEach((project) => {
        const projectId = normalizeProjectId(project?.id ?? project?.projectId ?? project?.project_id);
        const projectName = project?.name || project?.title || project?.projectName;

        if (!projectId || typeof projectName !== 'string' || projectName.trim() === '') {
            return;
        }

        const option = document.createElement('option');
        option.value = projectId;
        option.textContent = projectName.trim();
        select.appendChild(option);
    });

    const hasCurrentValue = Array.from(select.options).some((option) => option.value === currentValue);
    currentProjectFilter = hasCurrentValue ? currentValue : 'all';
    select.value = currentProjectFilter;
}

function renderCurrentView() {
    const filteredTasks = getFilteredTasks(allTasks);
    const filteredProjects = getFilteredProjects(allProjects);
    renderTaskCounters(filteredTasks);
    renderDeadlineAlerts(filteredTasks);
    renderProjectDeadlineMarkers(filteredProjects);
}

/* =====================================================
    FUNÇÃO: ATUALIZAR RÓTULO DO MÊS
    ===================================================== 
    Mostra o mês e o ano que estão sendo exibidos na tela.
    O valor vem de currentCalendarDate, que representa o mês
    atual do calendário.
*/

function updateMonthLabel() {
    const monthName = currentCalendarDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
    });

    calendarElements.currentMonthLabel.textContent = monthName;
}

/* =====================================================
    FUNÇÃO: RENDERIZAR DIAS DO MÊS
    ===================================================== 
    Cria os dias do mês exibido na tela.
    Como funciona:
    - Lê o ano e o mês de currentCalendarDate
    - Calcula quantos dias existem naquele mês
    - Cria um <li> para cada dia
    - Coloca cada dia dentro do container calendarDays
*/

function renderCalendarDays() {
    const calendarDaysContainer = document.getElementById('calendarDays');
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    calendarDaysContainer.innerHTML = '';

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('li');
        dayElement.id = `day-${day}`;
        dayElement.innerHTML = `
            <span class="day-number">${day}</span>
            <span class="task-count hidden"></span>
        `;

        dayElement.addEventListener('click', () => {
            openDayTasksModal(day);
        });

        calendarDaysContainer.appendChild(dayElement);
    }
}

/* =====================================================
    FUNÇÃO: MUDAR O MÊS EXIBIDO
    ===================================================== 
    Recebe um valor positivo ou negativo e avança ou volta
    o calendário. Depois atualiza título, dias e contadores.
*/

function changeCalendarMonth(offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    updateMonthLabel();
    renderCalendarDays();
    renderCurrentView();
}

updateMonthLabel();
renderCalendarDays();

/* =====================================================
    FUNÇÃO: CONTROLAR ESTADOS DA TELA
    ===================================================== 
    Mostra apenas o estado necessário por vez.
    Estados possíveis:
    - loading: carregando dados da API
    - error: erro na requisição
    - empty: sem tarefas para exibir
    - success: dados carregados com sucesso
*/

function setViewState(state) {
    const isLoading = state === 'loading';
    const isError = state === 'error';
    const isEmpty = state === 'empty';
    const shouldShowFeedback = isLoading || isError || isEmpty;

    calendarElements.loadingState.classList.toggle('hidden', !isLoading);
    calendarElements.errorState.classList.toggle('hidden', !isError);
    calendarElements.emptyState.classList.toggle('hidden', !isEmpty);
    calendarElements.feedbackArea.classList.toggle('hidden', !shouldShowFeedback);
}

/* =====================================================
    FUNÇÃO: LIMPAR CONTADORES DOS DIAS
    ===================================================== 
    Remove contadores antigos antes de renderizar novamente.
*/

function clearTaskCounters() {
    const counters = document.querySelectorAll('.task-count');
    counters.forEach((counter) => {
        counter.textContent = '';
        counter.classList.remove('task-count--red', 'task-count--yellow', 'task-count--green', 'task-count--blue');
        counter.classList.add('hidden');
    });

    const selectedDay = document.querySelector('.day-selected');
    if (selectedDay) {
        selectedDay.classList.remove('day-selected');
    }
}

function getTaskUrgency(task, todayDate) {
    if (!task || task.status === 'Concluída') {
        return 'green';
    }

    if (!task.dueDate) {
        return 'blue';
    }

    const dueDate = new Date(`${task.dueDate}T00:00:00`);
    if (Number.isNaN(dueDate.getTime())) {
        return 'blue';
    }

    const diffDays = Math.floor((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return 'red';
    }

    if (diffDays <= 3) {
        return 'yellow';
    }

    return 'blue';
}

function renderTaskCounters(tasks) {
    clearTaskCounters();

    const currentYear = currentCalendarDate.getFullYear();
    const currentMonth = currentCalendarDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const urgencyPriority = {
        blue: 0,
        green: 1,
        yellow: 2,
        red: 3
    };

    const daySummary = new Map();

    tasks.forEach((task) => {
        if (!task || !task.dueDate) return;

        const dueDate = new Date(`${task.dueDate}T00:00:00`);
        if (Number.isNaN(dueDate.getTime())) return;

        const sameYear = dueDate.getFullYear() === currentYear;
        const sameMonth = dueDate.getMonth() === currentMonth;

        if (!sameYear || !sameMonth) return;

        const day = dueDate.getDate();
        const urgency = getTaskUrgency(task, today);

        if (!daySummary.has(day)) {
            daySummary.set(day, {
                count: 1,
                urgency,
                priority: urgencyPriority[urgency]
            });
            return;
        }

        const summary = daySummary.get(day);
        summary.count += 1;

        const currentPriority = urgencyPriority[urgency];
        if (currentPriority > summary.priority) {
            summary.urgency = urgency;
            summary.priority = currentPriority;
        }
    });

    daySummary.forEach((summary, day) => {
        const dayCell = document.getElementById(`day-${day}`);
        if (!dayCell) return;

        const counter = dayCell.querySelector('.task-count');
        if (!counter) return;

        counter.textContent = String(summary.count);
        counter.classList.remove('task-count--red', 'task-count--yellow', 'task-count--green', 'task-count--blue');
        counter.classList.add(`task-count--${summary.urgency}`);
        counter.classList.remove('hidden');
    });
}

function getTasksForDate(year, month, day) {
    const filteredTasks = getFilteredTasks(allTasks);

    return filteredTasks.filter((task) => {
        if (!task || !task.dueDate) return false;

        const dueDate = new Date(`${task.dueDate}T00:00:00`);
        if (Number.isNaN(dueDate.getTime())) return false;

        return dueDate.getFullYear() === year
            && dueDate.getMonth() === month
            && dueDate.getDate() === day;
    });
}

function getProjectsForDate(year, month, day) {
    const filteredProjects = getFilteredProjects(allProjects);

    return filteredProjects.filter((project) => {
        if (!project || !project.dueDate) return false;

        const dueDate = new Date(`${project.dueDate}T00:00:00`);
        if (Number.isNaN(dueDate.getTime())) return false;

        return dueDate.getFullYear() === year
            && dueDate.getMonth() === month
            && dueDate.getDate() === day;
    });
}

function clearProjectDeadlineMarkers() {
    document.querySelectorAll('.days-grid li').forEach((dayCell) => {
        dayCell.classList.remove('has-project-deadline');

        const marker = dayCell.querySelector('.project-deadline-marker');
        if (marker) {
            marker.remove();
        }
    });
}

function renderProjectDeadlineMarkers(projects) {
    clearProjectDeadlineMarkers();

    const currentYear = currentCalendarDate.getFullYear();
    const currentMonth = currentCalendarDate.getMonth();
    const deadlinesByDay = new Map();

    projects.forEach((project) => {
        if (!project || !project.dueDate) return;

        const dueDate = new Date(`${project.dueDate}T00:00:00`);
        if (Number.isNaN(dueDate.getTime())) return;

        if (dueDate.getFullYear() !== currentYear || dueDate.getMonth() !== currentMonth) {
            return;
        }

        const day = dueDate.getDate();
        if (!deadlinesByDay.has(day)) {
            deadlinesByDay.set(day, []);
        }

        deadlinesByDay.get(day).push(project.name || 'Projeto sem nome');
    });

    deadlinesByDay.forEach((projectNames, day) => {
        const dayCell = document.getElementById(`day-${day}`);
        if (!dayCell) return;

        dayCell.classList.add('has-project-deadline');
        dayCell.title = `Entrega de projeto: ${projectNames.join(', ')}`;

        const marker = document.createElement('span');
        marker.className = 'project-deadline-marker';
        marker.textContent = projectNames.length > 1 ? `${projectNames.length}P` : 'P';
        marker.setAttribute('aria-label', 'Dia com entrega de projeto');

        dayCell.appendChild(marker);
    });
}

function normalizeProjectId(projectId) {
    if (projectId === null || projectId === undefined) {
        return null;
    }

    const normalized = String(projectId).trim();
    return normalized === '' ? null : normalized;
}

async function loadProjectsMap() {
    try {
        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: 'GET',
            headers: {
                'x-team-token': TEAM_TOKEN
            }
        });

        if (!response.ok) {
            projectsById = new Map();
            allProjects = [];
            return;
        }

        const projects = await response.json();
        if (!Array.isArray(projects)) {
            projectsById = new Map();
            allProjects = [];
            return;
        }

        allProjects = projects;
        renderProjectFilterOptions();

        const mappedProjects = new Map();

        projects.forEach((project) => {
            const projectId = normalizeProjectId(project?.id ?? project?.projectId ?? project?.project_id);
            const projectName = project?.name || project?.title || project?.projectName;

            if (projectId && typeof projectName === 'string' && projectName.trim() !== '') {
                mappedProjects.set(projectId, projectName.trim());
            }
        });

        projectsById = mappedProjects;
    } catch (error) {
        console.error('Falha ao buscar projetos:', error);
        projectsById = new Map();
        allProjects = [];
    }
}

function getTaskProjectName(task) {
    if (!task) {
        return 'Não informado';
    }

    if (typeof task.projectName === 'string' && task.projectName.trim() !== '') {
        return task.projectName;
    }

    if (typeof task.project === 'string' && task.project.trim() !== '') {
        return task.project;
    }

    if (task.project && typeof task.project === 'object') {
        if (typeof task.project.name === 'string' && task.project.name.trim() !== '') {
            return task.project.name;
        }

        if (typeof task.project.title === 'string' && task.project.title.trim() !== '') {
            return task.project.title;
        }
    }

    const projectId = normalizeProjectId(task.projectId || task.project_id || task.project?.id);
    if (projectId && projectsById.has(projectId)) {
        return projectsById.get(projectId);
    }

    if (projectId) {
        return 'Projeto não encontrado';
    }

    return 'Não informado';
}

function openDayTasksModal(day) {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const tasksForDay = getTasksForDate(year, month, day);
    const projectsForDay = getProjectsForDate(year, month, day);

    const selectedDay = document.querySelector('.day-selected');
    if (selectedDay) selectedDay.classList.remove('day-selected');

    const currentDayCell = document.getElementById(`day-${day}`);
    if (currentDayCell) currentDayCell.classList.add('day-selected');

    const monthLabel = currentCalendarDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
    });

    calendarElements.dayTasksModalSubtitle.textContent = `Dia ${day} - ${monthLabel}`;
    calendarElements.dayTasksModalList.innerHTML = '';

    if (projectsForDay.length > 0) {
        const projectsItem = document.createElement('li');
        projectsItem.className = 'task-modal-item project-deadline-item';

        const projectsTitle = document.createElement('strong');
        projectsTitle.textContent = 'Entrega de projeto neste dia';

        const projectsNames = document.createElement('p');
        projectsNames.className = 'task-modal-project';
        projectsNames.textContent = projectsForDay
            .map((project) => project.name || 'Projeto sem nome')
            .join(' | ');

        projectsItem.appendChild(projectsTitle);
        projectsItem.appendChild(projectsNames);
        calendarElements.dayTasksModalList.appendChild(projectsItem);
    }

    if (tasksForDay.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = projectsForDay.length > 0
            ? 'Não há tarefas para este dia, apenas entrega de projeto.'
            : 'Nenhuma tarefa para este dia.';
        calendarElements.dayTasksModalList.appendChild(emptyItem);
    } else {
        tasksForDay.forEach((task) => {
            const item = document.createElement('li');
            item.className = 'task-modal-item';

            const title = document.createElement('strong');
            title.textContent = task.title || 'Tarefa sem título';

            const projectName = getTaskProjectName(task);
            const project = document.createElement('p');
            project.className = 'task-modal-project';
            project.textContent = `Projeto: ${projectName}`;

            const meta = document.createElement('p');
            meta.className = 'task-modal-meta';
            meta.textContent = `Status: ${task.status || 'N/A'} | Prioridade: ${task.priority || 'N/A'} | Responsável: ${task.assignee || 'Não informado'}`;

            item.appendChild(title);
            item.appendChild(project);
            item.appendChild(meta);
            calendarElements.dayTasksModalList.appendChild(item);
        });
    }

    calendarElements.dayTasksModal.classList.remove('hidden');
}

function closeDayTasksModal() {
    calendarElements.dayTasksModal.classList.add('hidden');
}

function renderDeadlineAlerts(tasks) {
    if (!calendarElements.alertOverdueCount
        || !calendarElements.alertSoonCount
        || !calendarElements.alertOkCount
        || !calendarElements.alertDoneCount) {
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alerts = {
        red: 0,
        yellow: 0,
        green: 0,
        blue: 0
    };

    tasks.forEach((task) => {
        const urgency = getTaskUrgency(task, today);
        alerts[urgency] += 1;
    });

    calendarElements.alertOverdueCount.textContent = String(alerts.red);
    calendarElements.alertSoonCount.textContent = String(alerts.yellow);
    calendarElements.alertOkCount.textContent = String(alerts.blue);
    calendarElements.alertDoneCount.textContent = String(alerts.green);
}

/* =====================================================
    FUNÇÃO: CARREGAR TAREFAS DA API
    ===================================================== 
    Busca tarefas reais do servidor, sem usar dados mockados.
    A requisição usa o método GET e envia o token da equipe.
    Se acontecer erro, a função entra no catch e mostra no console.
*/

async function loadTasks() {
    // Começa em loading toda vez que tenta buscar tarefas
    setViewState('loading');

    try {
        await loadProjectsMap();

        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',
            headers: {
                'x-team-token': TEAM_TOKEN
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar tarefas');
        }

        const data = await response.json();

        // Se a API respondeu, mas veio sem tarefas
        if (!Array.isArray(data) || data.length === 0) {
            allTasks = [];
            renderTaskCounters([]);
            renderDeadlineAlerts([]);
            setViewState('empty');
            return [];
        }

        // Se deu tudo certo e vieram dados
        allTasks = data;
        setViewState('success');
        renderCurrentView();
        return data;
    } catch (error) {
        console.error('Falha na conexão com a API:', error);
        setViewState('error');
        return [];
    }
}

// Chama a função para carregar tarefas assim que a página inicia.
// Sem isso, nada acontece automaticamente.
loadTasks();

// Se der erro na API, o botão tenta carregar novamente.
calendarElements.retryBtn.addEventListener('click', () => {
    loadTasks();
});

// Navegação entre meses do calendário.
calendarElements.prevMonthBtn.addEventListener('click', () => {
    changeCalendarMonth(-1);
});

calendarElements.nextMonthBtn.addEventListener('click', () => {
    changeCalendarMonth(1);
});

if (calendarElements.deadlineFilterSelect) {
    calendarElements.deadlineFilterSelect.addEventListener('change', (event) => {
        currentDeadlineFilter = event.target.value;
        renderCurrentView();
    });
}

if (calendarElements.projectFilterSelect) {
    calendarElements.projectFilterSelect.addEventListener('change', (event) => {
        currentProjectFilter = event.target.value;
        renderCurrentView();
    });
}

// Atualiza as tarefas quando o usuário volta para esta aba.
// Isso garante que alterações feitas em outra tela apareçam no calendário.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        loadTasks();
    }
});

// Fecha modal de tarefas do dia.
calendarElements.closeDayTasksModalBtn.addEventListener('click', () => {
    closeDayTasksModal();
});

calendarElements.dayTasksModal.addEventListener('click', (event) => {
    if (event.target === calendarElements.dayTasksModal) {
        closeDayTasksModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !calendarElements.dayTasksModal.classList.contains('hidden')) {
        closeDayTasksModal();
    }
});