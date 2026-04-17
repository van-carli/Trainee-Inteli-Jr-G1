# Documentação Individual: Tela do Calendário do Projeto e geração automática de descrição no Kanban
**Responsável:** Gabriel Gomes Pimentel 

---

## 1. Wireframe
> Aqui eu descrevo como pensei a estrutura da tela antes de começar a codar.

### Descrição do Design
* **Ferramenta utilizada:** Papel e caneta para esboçar as ideias.
* **Conceito:** eu organizei a tela do calendário para que a leitura fosse rápida e direta, porque essa funcionalidade serve principalmente para enxergar prazos e tarefas sem demandar muito esforço. A ideia foi deixar o usuário entender o mês atual logo de cara, identificar os dias com mais atenção e acessar os detalhes de forma simples, sem precisar abrir várias páginas ou fazer caminhos longos dentro do sistema.
* **Pensamento de organização:** eu coloquei no topo os filtros e o título da tela porque isso ajuda na navegação desde o primeiro olhar. No centro, deixei a grade do calendário como foco principal, já que é ali que a pessoa realmente consulta as datas. Na parte de baixo, adicionei um resumo de alertas para destacar rapidamente o que está atrasado, o que está em andamento e o que já foi concluído, devidamente representados pelas suas perspectivas cores em uma legenda clara e intuitiva.
* **Outra decisão importante:** na parte do Kanban, eu pensei em uma solução que economiza tempo do usuário. Em vez da pessoa ter que escrever uma descrição inteira do zero, a ideia foi usar o título da tarefa como base para gerar automaticamente uma sugestão de texto, deixando a criação de tarefas mais ágil e menos repetitivo.

### Visual do Wireframe
Imagem do wireframe do calendário feita no Figma ou desenhada à mão.

Não se aplica: fiz um esboço bem rápido no papel para facilitar a organização das ideias, mas não cheguei a criar um wireframe digitalizado.

---

## 2. Funcionalidades do Componente

* **Ação principal:** mostrar o calendário do projeto de forma clara, com tarefas distribuídas por dia, filtros por prazo e por projeto, além de um resumo visual dos alertas mais importantes. Na parte do Kanban, a funcionalidade principal foi gerar uma descrição automática com base no título da tarefa.

* **Interações:**
    * Navegar entre os meses com os botões de anterior e próximo, sem recarregar a página.
    * Filtrar tarefas por situação de prazo, como atrasadas, em andamento e concluídas.
    * Filtrar também por projeto, o que ajuda quando existem várias entregas acontecendo ao mesmo tempo.
    * Clicar em um dia do calendário para abrir um modal com as tarefas e projetos relacionados àquela data.
    * Visualizar contadores e alertas coloridos para entender rapidamente onde estão os pontos mais críticos.
    * No Kanban, apertar o botão de gerar descrição para criar automaticamente um texto com base no título informado.
    * Se a chave da API não estiver disponível ou se a requisição falhar, o sistema usa uma descrição local de apoio para não travar o fluxo do usuário.

* **O que eu quis priorizar:** eu pensei bastante na experiência de uso. Fiz questão de deixar os elementos grandes, legíveis e organizados em uma única tela, porque na minha visão isso facilita muito a análise de prazos e evita confusão. Também passei essa mesma preocupação para o grupo, porque achei importante que a solução inteira tivesse a mesma lógica de clareza e cuidado com quem vai usar.

### Recorte da lógica usada no calendário
Para mostrar que eu realmente entendi a implementação, segue um recorte da ideia principal que usei no calendário:

```javascript
const response = await fetch(`${API_BASE_URL}/tasks`, { headers });
const tasks = await response.json();

renderTaskCounters(tasks);
renderDeadlineAlerts(tasks);
```

O que esse trecho faz, de forma resumida, é buscar os dados já salvos na API e depois usar esses dados para montar a visualização do mês. A partir daí, o JavaScript identifica o campo de data de entrega, organiza as tarefas por dia e atualiza os alertas visuais que aparecem na tela. Isso foi importante porque eu quis que o calendário não fosse só uma grade bonita, mas uma ferramenta realmente funcional para leitura de prazo.

Além disso, a lógica do calendário também considera o projeto selecionado e o status da tarefa. Ou seja, a mesma tarefa pode aparecer de forma diferente dependendo do filtro aplicado, o que torna a leitura mais útil para quem está acompanhando várias entregas ao mesmo tempo.

---

## 3. Dependências Necessárias
> O que o componente precisa para existir e funcionar corretamente?

* **Estrutura:** HTML5 semântico, usando elementos como `main`, `section`, `header`, `article` e `modal` para manter a tela organizada e fácil de entender.
* **Estilização:** CSS3 com uso de variáveis, Flexbox e Grid para montar uma interface responsiva, limpa e com boa hierarquia visual.
* **Comportamento:** JavaScript puro para controlar o calendário, os filtros, o modal de tarefas, a navegação entre meses e a atualização dos contadores em tempo real.
* **Dados da API:** a tela do calendário depende da API do projeto para buscar tarefas e projetos, principalmente com informações como `id`, `title`, `description`, `status`, `dueDate` e `projectId`.
* **Como eu consumi essa API no calendário:** nessa tela eu usei principalmente o método GET, porque o objetivo ali é mostrar informações que já existem e organizar a visualização de acordo com as datas salvas. Então, o calendário lê os dados da API, identifica os prazos e exibe os dias com alertas e contadores. O POST não é a base dessa tela; ele aparece em outras partes do projeto, como na criação de tarefas específicas do Kanban de cada projeto. Depois que esses dados são criados, o calendário consegue usar os campos de prazo para fazer a leitura correta no futuro e manter a lógica de acompanhamento das entregas.
* **Integração com API externa:** na parte do Kanban, a geração automática de descrição usa a API do Gemini, com entrada baseada no título da tarefa.
* **Armazenamento local:** a chave da API do Gemini é solicitada no navegador e fica guardada localmente para evitar expor esse dado direto no código-fonte.
* **Bibliotecas externas:** Font Awesome para os ícones usados na interface.

---

## 4. Uso de IA

* **Ferramenta utilizada:** Gemini.
* **Finalidade:** eu usei a IA principalmente para apoiar a parte de geração automática de descrição no Kanban, usando o título da tarefa como base para criar um texto inicial mais completo. Também utilizei como apoio em momentos de revisão de ideias e organização do texto técnico da documentação.
* **Reflexão:** eu vejo a IA como uma ferramenta de apoio, não como substituta do trabalho. Na prática, ela ajudou a economizar tempo em uma parte repetitiva e mostrou uma possibilidade real de automatização dentro do projeto, mas a implementação de verdade precisou de ajustes meus para funcionar do jeito certo. No caso da chave da API, eu tive o cuidado de não deixar esse dado exposto no código principal, porque segurança também faz parte de um desenvolvimento bem feito.

---