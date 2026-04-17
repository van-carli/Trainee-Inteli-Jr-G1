# Trainee Inteli - Sistema de Gestão de Projetos

## Resumo do Projeto

O **Sistema de Gestão de Projetos - IJ** é uma solução centralizada desenvolvida para otimizar o acompanhamento e a execução dos projetos reais da Inteli Júnior. O sistema atua como um hub administrativo que consome dados em tempo real de uma API dedicada, transformando dados brutos em inteligência visual para gestores e consultores.

[Link do projeto deployado](<link_aqui>)

O projeto foi estruturado em quatro pilares fundamentais de visualização:

- **Dashboard Quantitativo (Analytics)**:
    Uma visão executiva que consolida as métricas de saúde de todo o portfólio da IJ. Através de gráficos dinâmicos (Chart.js), permite monitorar o volume de tarefas, identificar gargalos por prioridade e visualizar a distribuição de status de forma instantânea.
- **Galeria de Projetos (Portfolio)**:
    Interface de entrada que lista todos os projetos ativos, permitindo o acompanhamento do progresso percentual, prazos de entrega e responsáveis. Funciona como o ponto de partida para o detalhamento individual de cada iniciativa.
- **Kanban de Tarefas (Operacional)**:
    Focado na agilidade, este quadro permite o gerenciamento do fluxo de trabalho. Inclui uma **integração com a IA do Gemini** para automação de descrições de tarefas, facilitando o dia a dia dos membros.
- **Calendário Estratégico (Timeline)**:
    Uma visualização temporal crucial para o controle de *deadlines*. O calendário sinaliza de forma visual (escala de cores por urgência) os prazos críticos e as datas de entrega de projetos, garantindo que nenhum compromisso seja esquecido.

### Diferenciais de Experiência

Para garantir a usabilidade, implementamos **filtros avançados** (por projeto, status e prioridade) e uma **Barra de Navegação Inteligente** que mantém o contexto do usuário em todas as telas, integrando perfeitamente a visão macro e micro do ecossistema de projetos.

#### Individual

Cada integrante também fez uma entrega individual, com documentação e uma tela ou componente feito pelo mesmo.

---

## Atuação dos Membros na Entrega em Grupo

| Pessoa | Tela/Componente |
|--------|---|
| Vanessa | Dashboard Projetos + add cards |
| Fabianne | Kanban + manipulação de Cards |
| Gabriel Domingos | Dashboard Quantitativo + integração das telas |
| Gabriel Gomes | Calendário + Integração com IA |
| Eduardo | navBar + Documentação |


---

## Estrutura do Sistema

```text
.
├── docs/                      # Entregas individuais e documentação técnica
│   ├── eduardoThome/
│   ├── fabianneSilva/
│   ├── gabrielDomingos/
│   ├── gabrielGomes/
│   └── vanessaCarli/
├── frontend/                  # Código fonte da aplicação em grupo
│   ├── assets/                # Logos e recursos visuais
│   ├── src/                   # Telas (HTML) e lógica (JS)
│   │   ├── js/                # Scripts de integração e componentes
│   │   ├── calendar.html
│   │   ├── dashboardQuantitativo.html
│   │   └── kanban.html
│   └── style/                 # Estilização global e das telas
├── index.html                 # Página principal (Dashboard de Projetos)
└── README.md                  # Documentação principal
```

---

## Decisões Técnicas

- **Vanilla HTML, CSS e JS**: Optamos por não utilizar frameworks (como React ou Vue) para demonstrar o domínio dos fundamentos da web e garantir que a aplicação seja leve, sem necessidade de processos de build complexos.
- **Arquitetura de Componentes Dinâmicos**: Criamos um sistema de injeção via JavaScript (`navbar.js`) para garantir que a barra de navegação seja consistente em todas as telas sem duplicação de HTML.
- **Design Tokens com CSS Variables**: Utilizamos variáveis no `:root` para centralizar a paleta de cores e garantir facilidade em futuras alterações de tema.
- **Bibliotecas de Terceiros**:
  - **Chart.js**: Para visualização de métricas no dashboard.
  - **Lucide/FontAwesome**: Para uma interface rica em ícones.
  - **Google Fonts (JetBrains Mono)**: Para uma estética moderna e legível.
- **Mais de um arquivo css**: Um css isolado para cada tela/componente. Decidimos isso por uma breve comparação entre pontos positivos e negativos:
  - **Pontos positivos**: Para a dinamica do desenvolvimento, onde cada um do grupo fez uma tela e nem todos tinham experiéncias técnicas. Mas também evita conflitos de sobrescrição de arquivo e facilita a correção de detalhes de uma tela específica.
  - **Pontos negativos**: Não é o padrão utilizado no mercado e limita a escalabilidade além de gerar muita repetição de código.


---

## Uso de Inteligência Artificial

- **Google AI Studio (Gemini)**: Utilizado para brainstorming da arquitetura do projeto e geração de ideias para a funcionalidade de "Geração de Descrições" no Kanban.
- **Antigravity & VS Code Agent**: Utilizado para refatoração de código, unificação de estilos CSS e auditoria de requisitos técnicos.
- **Prompt Engineering**: Focamos em prompts estruturados para garantir que o código gerado seguisse as boas práticas de semântica HTML e acessibilidade.

---

## Divisão de Tarefas do Projeto

**Segunda (13/04):** Alinhamento do que precisava ser feito e definição de tarefas

**Terça (14/04)** Desenvolvimento em paralelo (cada um em sua tela) + inicio da documentação

**Quarta (15/04):** finalização das telas e inicio da integração

**Quinta (16/04):** integração completa, testes com integrantes de projetos da IJ e ajustes finais

**Sexta (17/04):** revisão e entrega

**Board KANBAN da equipe**:
Utilizamos o projeto do github de kanban para organizar-mos as tarefas de cada um e quando seriam feitas

---

## Scrum Master

**Nome:** Eduardo Totti Thomé

**Atuações e Organização do Time:**

- **Divisão de Tarefas**: O projeto foi dividido por telas de afinidade, onde cada membro assumiu a responsabilidade total por um endpoint principal e sua respectiva interface.
- **Dailys e Alinhamento**: Realizamos reuniões rápidas diárias às 9h para identificar bloqueios (ex: divergências em caminhos de arquivos ou URLs de API).
- **Gestão de Integração**: Como Scrum Master, atuei na consolidação dos repositórios individuais para a pasta `frontend/`, garantindo que o CSS global (`navBar.css`) não quebrasse os layouts individuais.
- **Ideação**: Facilitação de dinâmicas de design para garantir que as telas conversassem visualmente entre si.

---

## Relatório de Testes de Usabilidade e Backlog de Melhorias

### **1. Objetivo dos Testes**

Os testes de usabilidade foram conduzidos com o objetivo de validar a interface do sistema (Dashboard, Kanban e Calendário) com usuários reais. O foco foi identificar o que já funciona bem na experiência do usuário e mapear atritos na interpretação de gráficos, navegação e clareza dos filtros.

### **2. Pontos Positivos (O que funcionou bem)**

Durante as avaliações, os usuários destacaram elementos muito fortes no projeto atual:

- **Identidade Visual Consistente:** O uso do Dark Mode com detalhes em vermelho remete muito bem à marca da Inteli Júnior, criando uma interface moderna e profissional.
- **Inovação no Cadastro:** A funcionalidade de gerar a descrição da tarefa com auxílio de Inteligência Artificial (IA) foi muito elogiada e vista como um grande diferencial que poupa tempo.
- **Estrutura Base:** A disposição em colunas do Kanban e a organização em abas do sistema são intuitivas e seguem bons padrões de mercado.

## **3. Oportunidades de Melhoria (Feedbacks Coletados)**

Apesar dos pontos positivos, os testes revelaram atritos específicos que afetam a clareza da informação. Os apontamentos foram divididos por tela:

### 3.1. Dashboard Quantitativo

- Ambiguidade no Gráfico "Projetos por Status": O gráfico atual é pouco intuitivo. O usuário não consegue identificar se os dados ali se referem à quantidade de tarefas concluídas ou ao nível de conclusão geral do projeto. Foi pontuado que uma simples mudança de título ou legenda pode resolver isso.
- Falta de Clareza Geral: Os gráficos, de maneira geral, precisam ser mais autoexplicativos para que a leitura dos dados seja instantânea.
- Falta de Filtros Específicos: Os usuários sentiram falta de poder filtrar as tarefas por semana e por pessoa, o que daria uma visão muito melhor e mais tática das atribuições de cada membro da equipe.

### 3.2. Tela de Kanban

- Limitação de Horas: O campo de "horas estimadas" nas tarefas permite entradas irreais. Foi sugerido que esse campo tenha um limite máximo (trava de validação).
- Inputs Manuais no Formulário: Foi identificado um atrito na criação de tarefas. O usuário precisa digitar manualmente o nome do "Responsável" (Owner) e a "Prioridade". Sugeriram que o nome do responsável já estivesse lá ou que pudesse ter um campo de seleção do responsável ao criar um tarefa dentro de um projeto específico.
- Responsividade (Mobile): O layout em Grid do Dashboard e do Kanban dificulta a navegação quando acessado pelo celular.

### 3.3. Calendário

- Confusão nos Filtros de Prazo: A diferença entre os filtros "Em dia" e "Até 3 dias" não ficou clara para os usuários, gerando dúvidas sobre o que exatamente cada um exibe.
- Estética dos Filtros: O design da barra de filtros e seleção de projetos (como o botão "Todos os Projetos") foi considerado esteticamente abaixo do restante do sistema, precisando de um refinamento visual (deixá-lo "mais bonito" e integrado).

### 4. Backlog de Melhorias (Plano de Ação)

Com base na transcrição dos feedbacks, as próximas iterações devem priorizar:

1. Ajustes Rápidos:

    - Renomear Gráficos: Alterar o título do gráfico "Projetos por Status" para algo mais descritivo e melhorar a clareza das legendas dos demais gráficos no Dashboard.
    - Clarificar Filtros do Calendário: Renomear as tags de "Em dia" e "Até 3 dias" para nomenclaturas inequívocas (ex: "No prazo" e "Vence em breve").
    - Validação de Input: Adicionar um limite de valor máximo (ex: max="99") no campo numérico de horas estimadas no Kanban.

2. Melhorias de Funcionalidade e UI:

    - Novos Filtros no Dashboard: Implementar dropdowns no topo do Dashboard para filtrar a visão de dados por "Semana" e "Responsável/Membro".
    - Redesign dos Filtros do Calendário: Refatorar o CSS dos botões de filtro no calendário para que fiquem mais atraentes e alinhados com o design moderno dos cards do Kanban.
    - Adaptação Mobile: Aplicar Media Queries no CSS para tornar as telas utilizáveis em smartphones.

3. Melhorias técnicas:

    - Isolar todo css em um único arquivo global.
