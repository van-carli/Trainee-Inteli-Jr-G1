/* =====================================================
   CONFIGURAÇÃO INICIAL - Conexão com API
   ===================================================== 
   Aqui guardamos o endereço da API (como um URL de um site)
   e o token de acesso (como uma senha que prova que temos 
   direito de pedir dados). Sem isso, a API não nos deixa pedir.
*/

const API_BASE_URL = 'https://trainee-projetos-api.vercel.app';
const TEAM_TOKEN = 'equipe-alpha-2026';

/* =====================================================
   SELETORES DO DOM - Referências aos elementos HTML
   ===================================================== 
   Aqui a gente "pega" os elementos da página pelo id,
   para depois a gente conseguir trabalhar com eles
   (mudar texto, esconder, mostrar, etc).
   É como apontar para coisas que estão no HTML.
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
   FUNÇÃO: Atualizar Rótulo do Mês
   ===================================================== 
   O que faz: Pega a data de hoje e exibe mês + ano
   lindo e bem formatado (ex: "abril de 2026").
   Onde aparece: Na tela, no lugar que diz "Mês/Ano".
*/

function updateMonthLabel() {
    const currentDate = new Date();
    const monthName = currentDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
    });

    calendarElements.currentMonthLabel.textContent = monthName;
}

updateMonthLabel();

/* =====================================================
   FUNÇÃO: Renderizar Dias do Mês
   ===================================================== 
   O que faz: Calcula quantos dias tem o mês de hoje
   e cria um "blocão" para cada dia (ex: 1, 2, 3... 30).
   Como funciona:
   - Pega o primeiro dia do mês (pode começar em qualquer dia da semana)
   - Calcula quantos dias tem o mês (28, 29, 30 ou 31)
   - Cria um <li> (item de lista) para cada dia
   - Coloca no HTML no lugar do id "calendarDays"
*/

function renderCalendarDays() {
    const calendarDaysContainer = document.getElementById('calendarDays');
    const today = new Date();

    // Pega o primeiro dia do mês
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    // Calcula quantos dias tem este mês
    // Faz isso pegando o dia anterior do próximo mês
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Limpa o que tinha antes (se houver)
    calendarDaysContainer.innerHTML = '';

    // Cria um <li> para cada dia do mês
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('li');
        dayElement.textContent = day;
        dayElement.id = `day-${day}`;

        calendarDaysContainer.appendChild(dayElement);
    }
}

renderCalendarDays();

/* =====================================================
   FUNÇÃO: Controlar Estados da Tela
   ===================================================== 
   O que faz: Mostra apenas o estado necessário por vez.
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
   FUNÇÃO: Carregar Tarefas da API
   ===================================================== 
   O que faz: Busca tarefas reais do servidor (sem inventar dados).
   Como funciona: Envia um pedido (GET) para a API com nossa senha.
   Tratamento: Se der erro, captura e mostra no console.
   Resultado: Mostra no console os dados que vieram.
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

        // Se API respondeu, mas veio sem tarefas
        if (!Array.isArray(data) || data.length === 0) {
            setViewState('empty');
            return [];
        }

        // Se deu tudo certo e tem dados
        setViewState('success');
        return data;
    } catch (error) {
        console.error('Falha na conexão com a API:', error);
        setViewState('error');
        return [];
    }
}

// Chamar a função para carregar tarefas assim que a página inicia
// Sem isso, nada acontece automaticamente
loadTasks();

// Se der erro na API, o botão tenta carregar de novo
calendarElements.retryBtn.addEventListener('click', () => {
    loadTasks();
});