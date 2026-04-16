# Trainee Inteli - Sistema de Gestão de Projetos

## Resumo do Projeto

O **Sistema de Gestão de Projetos - IJ** é uma solução centralizada desenvolvida para otimizar o acompanhamento e a execução dos projetos reais da Inteli Júnior. O sistema atua como um hub administrativo que consome dados em tempo real de uma API dedicada, transformando dados brutos em inteligência visual para gestores e consultores.

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
    

#### Individual:

Cada integrante também fez uma entrega individual, com documentação e uma tela ou componente feito pelo mesmo.

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
│   │   ├── js/                # Scripts de integração e componentes (NaviBar)
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
- **Arquitetura de Componentes Dinâmicos**: Criamos um sistema de injeção via JavaScript (`navibar.js`) para garantir que a barra de navegação seja consistente em todas as telas sem duplicação de HTML.
- **Design Tokens com CSS Variables**: Utilizamos variáveis no `:root` para centralizar a paleta de cores e garantir facilidade em futuras alterações de tema.
- **Bibliotecas de Terceiros**:
  - **Chart.js**: Para visualização de métricas no dashboard.
  - **Lucide/FontAwesome**: Para uma interface rica em ícones.
  - **Google Fonts (JetBrains Mono)**: Para uma estética moderna e legível.

---

## Uso de Inteligência Artificial

- **Google AI Studio (Gemini)**: Utilizado para brainstorming da arquitetura do projeto e geração de ideias para a funcionalidade de "Geração de Descrições" no Kanban.
- **Antigravity (VS Code Agent)**: Utilizado para refatoração de código, unificação de estilos CSS e auditoria de requisitos técnicos.
- **Prompt Engineering**: Focamos em prompts estruturados para garantir que o código gerado seguisse as boas práticas de semântica HTML e acessibilidade.

---

## Atuação dos Membros na Entrega em Grupo

| Pessoa | Tela/Componente | Endpoints |
|--------|---|---|
| Vanessa | Dashboard Projetos | `GET /projects` |
| Fabianne | Kanban + manipulação de Cards | `GET /tasks`, `PATCH /tasks/{id}/status` |
| Gabriel Domingos | Dashboard Quantitativo | `GET /dashboard` |
| Gabriel Gomes | Calendário | `GET /tasks` |
| Eduardo | NaviBar + Documentação | `GET /health` |

---

## Divisão de Tarefas do Projeto

**Segunda (13/04):** Alinhamento do que precisava ser feito e definição de tarefas

**Terça (14/04)** Desenvolvimento em paralelo (cada um em sua tela) + inicio da documentação

**Quarta (15/04):** finalização das telas e inicio da integração

**Quinta (16/04):** integração completa, testes com integrantes de projetos da IJ e ajustes finais

**Sexta (17/04):** revisão e entrega

---

## Scrum Master

**Nome:** Eduardo Totti Thomé

**Atuações e Organização do Time:**

- **Divisão de Tarefas**: O projeto foi dividido por telas de afinidade, onde cada membro assumiu a responsabilidade total por um endpoint principal e sua respectiva interface.
- **Dailys e Alinhamento**: Realizamos reuniões rápidas diárias às 9h para identificar bloqueios (ex: divergências em caminhos de arquivos ou URLs de API).
- **Gestão de Integração**: Como Scrum Master, atuei na consolidação dos repositórios individuais para a pasta `frontend/`, garantindo que o CSS global (`navibar.css`) não quebrasse os layouts individuais.
- **Ideação**: Facilitação de dinâmicas de design para garantir que as telas conversassem visualmente entre si.
