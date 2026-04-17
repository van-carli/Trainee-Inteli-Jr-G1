# Documentação Individual: Tela Dashboard Quantitativo
**Responsável:** Gabriel Silva Domingos

---

## 1. Wireframe
> Descreva aqui a estrutura visual pensada para o componente antes da implementação.

### Descrição do Design
* **Ferramenta utilizada:** Figma
* **Conceito:** O dashboard foi estruturado para oferecer uma visão analítica e centralizada da saúde do projeto. A organização prioriza o método "Top-Down", onde os indicadores macro (KPIs de status, total de tarefas e urgências) aparecem no topo para uma leitura imediata. Abaixo, utilizei gráficos de progresso (gauge) e distribuição (barras) para fornecer profundidade visual ao fluxo de entregas, permitindo que o gestor identifique gargalos em segundos. A seção inferior de "Histórico de Atividade" foi desenhada com gráficos de área suavizados para monitorar o ritmo da equipe de forma orgânica e intuitiva.
    * **Hierarquia de Dados:** Os cards superiores funcionam como um resumo executivo, destacando em cores contrastantes (verde para sucesso, vermelho para atrasos) o que exige atenção imediata.
    * **Visualização de Fluxo:** O gráfico de barras "Distribuição de Tarefas" espelha as etapas do Kanban (A fazer, Em andamento, Em revisão, Concluída), criando uma ponte direta entre a operação e a gestão.
    * **Identidade Visual:** Aplicação de um tema dark mode com paleta baseada na Inteli Júnior (tons de azul profundo e preto), utilizando cores semânticas vibrantes para garantir que os dados "saltem" da tela.
    * **Navegação e Filtros:** Inclusão de seletores de projeto e responsáveis no topo de cada seção para permitir uma exploração dinâmica e personalizada dos dados.

### Visual do Wireframe
![Rascunho Dashboard Quantitativo](rascunho%20dashboard%20quantitativo.png)

---

## 2. Funcionalidades do Componente

* **Ação principal:** O componente tem como principal objetivo demonstrar de maneira gráfica, dados quantitativos de cada projeto.
* **Interações:**
    * Selecionar projeto - Filtrar visualização de dados
    * Selecionar responsável - Filtrar fluxo de atividades
* **Funcionalidades detalhadas**
    * Filtro de projetos
        * Através dele a página exibe dados diferentes que condizem com cada projeto
        * Além de permitir ter uma visão geral de todos os projetos
    * Saúde do projeto
        * É um indicador que analisa a porcentagem de tarefas atrasadas dentro do projeto
        * Caso 1/5 das tarefas estejam atrasadas, é exibido "Crítico".
        * Caso Menos de 1/5 das tarefas estejam atrasadas, apesar de serem poucas, ou o projeto possuir muitas tarefas com alta prioridade é exibido "Em Risco".
        * Caso esteja tudo certo, sem atrasos e um volume normal de tarefas como alta prioridade, é exibido "No Prazo".
        * Caso o projeto tenha sido finalizado, é exibido "Concluído".
    * Quantidades de tarefas
        * Possui 3 indicadores:
            * Total de tarefas: Mostra todas as tarefas que determinado projeto possui
            * Tarefas Atrasadas: Mostra a quantidade de tarefas do projeto que estão atrasadas
            * Alta prioridade: Mostra a quantidade de tarefas que foram marcadas como alta prioridade.
    * Status do projeto
        * Através de um gráfico gauge é exibido o progresso do projeto, no caso a porcentagem de conclusão dele
        * Além disso é exibido esse valor através de um texto com a porcentagem, tornando esse dado mais visível.
        * E também é identificado qual é o projeto que está sendo mostrado
    * Distribuição de tarefas
        * Esse é basicamente um gráfico de barras que mostra de forma estatisticas as tarefas presentes no kanban de cada projeto
        * Ele utiliza de 4 colunas: A fazer, Em andamento, Em revisão e Concluída
        * Esses dados são puxados com base no que for alterado no kanban
        * Mostrando a quantidade de tarefas presente em cada divisão.
    * Histórico de Atividade
        * Um gráfico que mostra a quantidade de tarefas ao longo do tempo
        * Ele é filtrado considerando os dias de cada mês
        * E mostra também o mês em que se encontra
        * Ao decorrer deste tempo tem-se um gráfico de linha que mostra as entregas feitas neste período.
    * Filtro de Responsável
        * Este filtro está ligado diretamente ao histórico de atividade
        * Ele serve para filtrar o fluxo de trabalho de uma pessoa específica dentro do projeto
        * Ou também para ver o fluxo de trabalho completo da equipe

---

## 3. Dependências Necessárias
> O que o componente precisa para existir e funcionar corretamente?

* **Estrutura:** HTML5 semântico, utilizando containers dinâmicos (div com IDs específicos) para a injeção de múltiplos gráficos e elementos de grid para organização dos cards.
* **Estilização:** CSS3 avançado utilizando:
    * Variáveis de Cores (Theming): Paleta "Alpha Red" (--bg, --card, --accent, --text-gray).
    * Layout: CSS Grid (especialmente grid-template-columns: repeat(auto-fit...)) para responsividade dos velocímetros e Flexbox para os cards de métricas.
    * Efeitos: Pseudo-elementos (body::before) para o fundo de pontos (dots-bg) e text-shadow para estados de saúde.
* **Dados (API):** O componente consome os seguintes campos da API:
    * GET /projects: id, name, client, progress. (Usado para a lista de seleção e cálculo de progresso real).
    * GET /tasks: projectId, title, status, priority, dueDate. (Usado para cálculo de saúde, gráfico de barras e histórico de atividade).
    * GET /dashboard: (Opcional, usado na visão geral para soma rápida de métricas de equipe).
* **Bibliotecas Externas:** * Chart.js (v4+): Biblioteca principal para renderização dos gráficos de Velocímetro (Doughnut), Colunas (Bar) e Histórico (Line).
    * Lucide Icons: Para ícones vetoriais modernos nos cards e navegação.
    * FontAwesome (v6+): Utilizado especificamente na integração da barra lateral (Navibar).
    * Google Fonts: Fonte JetBrains Mono para manter o aspecto "tech/industrial" e Inter para leitura de apoio.
* **Persistência e Integração:**
    * LocalStorage: Dependência de chaves específicas (selectedTeamToken, currentProjectId) para sincronização de dados entre as telas de Projetos, Kanban e Dashboard.
    * Polling (JavaScript): Uso de setInterval para atualização em tempo real sem necessidade de refresh manual.

---

## 4. Uso de IA

* **Ferramenta utilizada:** Google AI Studio + Gemini
* **Finalidade:** * Estrutura Base HTML: A IA foi utilizada para gerar uma estrutura base dentro do html para organizar os elementos necessários para criação do dashboard.
    * Estrutura Base CSS + Auxilio na responsividade: A IA foi utilizada para ter uma base de organização do estilo visual e ajuda para padronizar as cores com o restante do site. Além de ser de grande ajuda para aplicar a responsividade da página para telas menores (apenas computador)
    * Transformação da lógica pensada em código JS: Foi utilizado principalmente na parte de código JavaScript como uma ferramenta de auxilio para implementar a lógica que formulei em minha cabeça em código para que o site funcionasse.
    * Integração: A IA auxiliou na integração de todas as telas e funcionalidades, principalmente o fluxo de dados entre o Kanban, Dashboard Quantitativo e Calendário.
* **Reflexão:** A IA foi de grande ajuda para o desenvolvimento rápido do projeto e a implementação base do visual do site (HTML + CSS), mas sendo necessário modificações manuais posteriores para adaptar o site e chegar ao resultado desejado. Além de contribuir muito na lógica do código, permitindo um desenvolvimento preciso e acelerado do código e integração da API, mas sendo necessário revisão manual e alterações de certas partes do código para condizer com o projeto. Como fator final a IA permitiu uma integração rápida de todos os trabalhos realizados pelo grupo e a linkagem de dados dentro da API para que tudo funcionasse devidamente e evitando erros que atrasariam o projeto, mas novamente sendo necessário alguns ajustes na quebra de visual em algumas partes e em alguns fluxos de dados.
    * A IA contribuiu como um todo para agilizar o projeto, mas servindo sempre como ferramenta, sendo necessário intervenção de minha parte para correções de lógica, bugs, visual e estrutura. Buscando sempre compreender o que estava sendo desenvolvido e aplicado dentro do projeto.