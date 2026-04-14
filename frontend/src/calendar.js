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
    loadingState: document.getElementById('loadingState')
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
   FUNÇÃO: Carregar Tarefas da API
   ===================================================== 
   O que faz: Busca tarefas reais do servidor (sem inventar dados).
   Como funciona: Envia um pedido (GET) para a API com nossa senha.
   Tratamento: Se der erro, captura e mostra no console.
   Resultado: Mostra no console os dados que vieram.
*/

async function loadTasks() {
    try {
        // Fazer requisição GET para obter tarefas
        // fetch() = faz o pedido para a API
        // await = espera a resposta chegar
        // response = é o que a API devolveu
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',  // ler dados (não criar, não deletar)
            headers: {
                'x-team-token': TEAM_TOKEN  // mostra nossa senha
            }
        });

        console.log('Status da resposta:', response.status);
        console.log('Resposta completa:', response);

        // Verificar se a resposta foi "ok" (status 200-299)
        // Se não foi ok, significa que algo deu errado
        if (!response.ok) {
            throw new Error('Erro ao buscar tarefas');
        }

        // response.json() = abre a "caixa" da API
        // A API envia os dados embrulhados em JSON
        // Essa linha desembrulha e transforma em objeto JavaScript
        const data = await response.json();
        console.log('Dados recebidos da API:', data);

    } catch (error) {
        // Se algo deu errado em qualquer lugar acima, cai aqui
        // console.error() = escreve o erro lindo no console
        // Assim a page não quebra, só mostra o erro
        console.error('Falha na conexão com a API:', error);
    }
}

// Chamar a função para carregar tarefas assim que a página inicia
// Sem isso, nada acontece automaticamente
loadTasks();