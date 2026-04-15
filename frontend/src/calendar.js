/* =====================================================
    CONFIGURAÇÃO INICIAL - CONEXÃO COM A API
    ===================================================== 
    Aqui guardamos o endereço da API, que é o local de onde
    vamos buscar os dados, e o token da equipe, que funciona
    como uma senha obrigatória para a API aceitar a requisição.
*/

const API_BASE_URL = 'https://trainee-projetos-api.vercel.app';
const TEAM_TOKEN = 'equipe-alpha-2026';
let currentCalendarDate = new Date();
let allTasks = [];

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
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    emptyState: document.getElementById('emptyState'),
    retryBtn: document.getElementById('retryBtn')
};

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
    renderTaskCounters(allTasks);
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

    calendarElements.loadingState.classList.toggle('hidden', !isLoading);
    calendarElements.errorState.classList.toggle('hidden', !isError);
    calendarElements.emptyState.classList.toggle('hidden', !isEmpty);
}

/* =====================================================
    FUNÇÃO: LIMPAR CONTADORES DOS DIAS
    ===================================================== 
    Remove contadores antigos antes de renderizar novamente.
*/

function clearTaskCounters() {
    const oldCounters = document.querySelectorAll('.task-count');
    oldCounters.forEach((counter) => counter.remove());
}

function renderTaskCounters(tasks) {
    clearTaskCounters();

    const currentYear = currentCalendarDate.getFullYear();
    const currentMonth = currentCalendarDate.getMonth();

    tasks.forEach((task) => {
        if (!task || !task.dueDate) return;

        const dueDate = new Date(`${task.dueDate}T00:00:00`);
        if (Number.isNaN(dueDate.getTime())) return;

        const sameYear = dueDate.getFullYear() === currentYear;
        const sameMonth = dueDate.getMonth() === currentMonth;

        if (!sameYear || !sameMonth) return;

        const day = dueDate.getDate();
        const dayCell = document.getElementById(`day-${day}`);
        if (!dayCell) return;

        let counter = dayCell.querySelector('.task-count');

        if (!counter) {
            counter = document.createElement('span');
            counter.className = 'task-count';
            counter.textContent = '1';
            dayCell.appendChild(counter);
        } else {
            counter.textContent = String(Number(counter.textContent) + 1);
        }

        counter.classList.remove('hidden');
    });
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
            setViewState('empty');
            return [];
        }

        // Se deu tudo certo e vieram dados
        allTasks = data;
        setViewState('success');
        renderTaskCounters(allTasks);
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