# Trainee Inteli - Sistema de Gestão de Projetos

## Resumo do Projeto

#### Em grupo:

O projeto é um sistema de gestão dos projetos realizados pelo Inteli Junior, com dados disponibilizados por uma API, que contém informações sobre os projetos e tarefas.

O sistema é dividido em algumas partes:

- Dashboard quantitativo:
    Todas informações quantitativas dos projetos gerenciados pela IJ no momento, como quantidade de projetos e tarefas ativas, divisão por prioridade, etc...
- Dashboard de projetos:
    Tela com todos os projetos ativos da IJ, com informações sobre cada projeto.
- Kanban de projetos:
    Quadro kanban acessado pela tela de projetos, ao clicar em um projeto, suas tarefas são mostradas de acordo com cada status.
- Calendário:
    Calendário com todas as tarefas ativas da IJ, coloradas por dias faltando para o prazo da tarefa.

filtros:
Algumas telas como o dashboard de projetos e o calendário possuem filtros, que permitem filtrar as tarefas por status, prioridade, etc...
    

#### Individual:

Cada integrante também fez uma entrega individual, com documentação e uma tela ou componente feito pelo mesmo.

---

## Estrutura do Sistema

```

docs/
├── eduardoThome/
├── fabianneSilva/
├── gabrielDomingos/
├── gabrielGomes/
└── VanessaCarli/

frontend/
├── src/
│   ├── components/
... (a ser feito)
├── .gitignore
├── index.html
└── README.md
```

---

## Decisões Técnicas

O projeto utiliza html, css e js puro, sem frameworks.

---

## Uso de Inteligência Artificial

**Ferramenta:** Google AI Studio Build e agente vscode

**Para quê:** Suporte na construção das telas e documentação

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

**Atuações:**

- Organização das tarefas
- Dailys
- Fechamentos
- Ideação
- Componente: barra de navegação
