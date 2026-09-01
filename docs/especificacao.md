# Especificação — App de Apoio para Home Games de Poker

## 1. Problema

Jogadores de home game de poker cometem erros ao calcular a divisão do dinheiro ao final da partida, principalmente por causa de conversão manual de fichas com valores fracionados (ex: ficha = R$0,40, múltiplas cores com denominações diferentes). O problema central não é a contagem física das fichas, é a **conversão e o cálculo** dessa contagem em valores monetários corretos.

## 2. Objetivo do produto

Automatizar o cálculo de conversão fichas → dinheiro, com conciliação entre o total investido (buy-ins + rebuys) e o total declarado ao final, dividindo o resultado de forma justa mesmo quando há divergência.

## 3. Escopo de v1 (MVP)

- Web app, mobile-first
- Público-alvo real da v1: grupos com confiança pré-existente (amigos, grupo fixo) — **não** desconhecidos via convite público, devido ao modelo de custódia centralizada no líder
- Uma partida ativa por vez, por grupo (múltiplas simultâneas fica para versão futura)

### Fora do MVP (backlog)
- App nativo iOS/Android (React Native, reaproveitando lógica do web)
- Aba de mãos de poker (v2 — estática, sem animação/cálculo dinâmico de probabilidade)
- Pagamento integrado ao app
- Modelo de custódia configurável (peer-to-peer vs. líder-centraliza)
- Múltiplas partidas simultâneas por grupo

## 4. Papéis e permissões

| Papel | Escopo | Poderes |
|---|---|---|
| **Dono do grupo** | Grupo | Cria o grupo, promove/rebaixa admins, remove qualquer membro, define configuração padrão de fichas |
| **Admin do grupo** | Grupo | Aceita novos membros, remove membros comuns (não o dono) |
| **Membro** | Grupo | Participa, cria e lidera partidas, vê ranking e histórico completo do grupo |
| **Líder de partida** | Partida (temporário) | Qualquer membro pode assumir ao criar uma partida. Define/confirma configuração de fichas daquela partida, seleciona participantes, custodia e distribui o dinheiro ao final, resolve divergências |

## 5. Modelo de dados (entidades principais)

### Usuário
- Conta única, participa de N grupos, estatísticas não se cruzam entre grupos
- Perfil: nome, apelido, foto

### Grupo
- Nome, código de entrada (aprovação obrigatória por dono/admin)
- Lista de membros com papel (dono/admin/membro)
- **Configuração padrão de fichas**: cores, unidades por cor, valor da unidade — editável pelo dono a qualquer momento, afeta apenas partidas futuras (nunca retroativo)

### Partida
- Pertence a um grupo, tem um líder (membro que a criou)
- Participantes: subconjunto dos membros do grupo, selecionado pelo líder na criação
- **Snapshot de configuração de fichas** próprio e imutável (herdado da config do grupo no momento da criação, editável só para aquela partida específica) — nunca referencia a config atual do grupo
- Status geral: aberta / fechada
- Log de todas as intervenções do líder (edições, resets), visível no histórico

### Participação (jogador em uma partida)
- Status: jogando / cash-out declarado / pendente
- Buy-in inicial + contador de rebuys (unidade fixa = 1 stack)
- Declaração final: quantidade de fichas por cor (conversão automática para valor em dinheiro via snapshot da partida)
- Pode declarar cash-out a qualquer momento (saída antecipada), inclusive com valor 0

## 6. Regras de negócio — cálculo e conciliação

1. **Conversão automática**: dado o snapshot de fichas da partida (cores, valor por unidade, valor da ficha), a declaração de "quantas fichas de cada cor" é convertida automaticamente em valor monetário. Jogador nunca faz conta manual.

2. **Conciliação**: ao fechar a partida, soma de todas as declarações é comparada ao total investido (soma de buy-ins + rebuys de todos os participantes).
   - Se bater: fecha normalmente, valores vão para o ranking sem flag.
   - Se divergir: líder recebe alerta com o valor da diferença e duas opções:
     - **Fechar com correção proporcional**: aplica um fator de correção (total investido ÷ total declarado) sobre o valor de cada jogador, preservando a proporção de quem ganhou/perdeu mais. Partida é marcada com flag `divergente: true` e o valor da diferença, visível no histórico.
     - **Pedir correção**: reset geral (todos os que ainda podem recontam) ou edição pontual pelo líder na tela de controle (toda edição fica registrada e visível).

3. **Jogador que sai sem declarar**: líder pode, pela tela de controle, inserir a declaração no lugar do jogador (mesmo rastro de auditoria de qualquer edição do líder).

4. **Saída do cálculo final**: saldo líquido de cada jogador em relação ao líder (não é matriz peer-to-peer) — decorrência direta do modelo de custódia centralizada. Líder recebe fisicamente todo o dinheiro e distribui conforme indicado pelo app.

## 7. Ranking

- Modelo: **líquido acumulado** (soma do resultado de cada partida, positivo ou negativo) — nunca "total adquirido bruto", que mascararia perdas.
- Abas: por mês, por ano, total.
- Ordenação por saldo acumulado. **Critério de desempate**: *standard competition ranking* (padrão olímpico) — jogadores com saldo idêntico ocupam a mesma posição; a posição seguinte pula o número de empatados (ex: 1º, 2º, 2º, 4º).
- Atualiza ao final de cada partida fechada.
- Apenas em dinheiro (ranking de fichas descartado por não ser comparável entre partidas com valores de ficha diferentes).

## 8. Navegação (estrutura de telas)

```
Login
└── Tela inicial
    ├── Lista de grupos do usuário (ou estado vazio + botão criar/entrar)
    └── Menu inferior: Home | Ajuda (v2 - mãos de poker) | Perfil

Dentro de um grupo
├── Partida ativa (ou botão "iniciar partida" com seleção de participantes)
├── Ranking (mês / ano / total)
├── Histórico de partidas (com flag de divergência quando houver)
├── Configurações do grupo (somente dono — membros, nome, config padrão de fichas)
└── Calculadora avulsa (usa config do grupo, não afeta ranking)

Dentro de uma partida ativa
├── Status dos jogadores (jogando / cash-out / pendente) — tela de controle do líder
├── Calculadora
└── Declaração de fichas (por participante)
```

## 9. Stack técnica

- **Next.js (React)** — ponte natural para React Native quando/se for para app nativo
- **Supabase** (tier gratuito) — Postgres (modelo relacional adequado às entidades e agregações do ranking) + Auth pronto + Realtime nativo (resolve a tela de controle do líder em tempo real sem implementação manual de WebSocket)
  - **Autenticação**: Google OAuth como método principal (menor fricção em contexto mobile, sem senha para gerenciar); magic link por e-mail como fallback. Ambos nativos do Supabase Auth.
- **Vercel** (tier gratuito) — deploy, integração nativa com Next.js
- **Testes unitários** — cobertura obrigatória da lógica de conciliação (conversão fichas → dinheiro, cálculo de correção proporcional, detecção de divergência), por ser a parte mais sensível a bug silencioso

## 10. Riscos e limitações conhecidas (aceitos conscientemente)

- **Modelo de custódia centralizada no líder** pressupõe confiança entre os membros — adequado para grupos fechados/conhecidos, não para desconhecidos via convite público. Decisão consciente de escopo de v1, não bug.
- **Conciliação não identifica quem errou**, apenas detecta que o total não bate — resolução depende de intervenção humana (líder), com correção proporcional como fallback matemático neutro.
- **Snapshot de fichas por partida é obrigatório** — configuração do grupo nunca reescreve histórico de partidas já criadas.

## 11. Roadmap de implementação (do zero ao deploy)

### Fase 0 — Fundação do projeto
- Criar repositório no GitHub, estrutura de pastas, README inicial (contexto do problema)
- `create-next-app` (App Router, TypeScript, ESLint)
- Criar projeto no Supabase (tier gratuito) e no Vercel, linkar Vercel ao repo
- Configurar variáveis de ambiente (local + Vercel)
- Configurar Google OAuth: criar credenciais no Google Cloud Console, habilitar provider no Supabase Auth; habilitar magic link como fallback
- Setup de testes (Vitest) + GitHub Actions rodando lint + testes a cada push

### Fase 1 — Modelagem de dados
- Desenhar schema Postgres: `users`, `groups`, `group_members`, `chip_configs`, `matches`, `match_chip_snapshot`, `participations`, `buyins_rebuys`, `declarations`, `audit_log`
- Escrever migrations (Supabase CLI)
- Definir e testar **RLS (Row Level Security)** em cada tabela — crítico: membro só acessa dados dos grupos em que participa
- Seed de dados de teste para desenvolvimento local

### Fase 2 — Autenticação e grupo
- Tela de login (Google OAuth + magic link)
- Criar grupo, código de entrada, aprovação de membros por dono/admin
- Gestão de papéis (promover/rebaixar admin, remover membro)
- Configuração padrão de fichas do grupo (CRUD, só dono)

### Fase 3 — Núcleo: partida (o coração do produto)
- Criar partida: líder seleciona participantes + confirma/edita snapshot de fichas
- Buy-in inicial e rebuys por jogador
- **Lógica de conciliação primeiro, com testes unitários** (conversão fichas→dinheiro, correção proporcional, detecção de divergência) — é a parte mais sensível a bug silencioso, vale escrever antes da tela
- Tela de controle do líder (status jogando/cash-out/pendente) com Supabase Realtime
- Declaração de fichas por participante (conversão automática)
- Fluxo de fechamento: bate → fecha normal; diverge → alerta + escolha (correção proporcional ou pedir correção/reset)
- Log de auditoria de toda intervenção do líder

### Fase 4 — Ranking e histórico
- Cálculo de saldo líquido acumulado por jogador
- Desempate (standard competition ranking) — cobrir com teste unitário dado o exemplo já discutido
- Abas mês / ano / total
- Histórico de partidas com flag de divergência

### Fase 5 — Calculadora avulsa
- Tela usando a config do grupo, sem gravar nada que afete ranking/histórico

### Fase 6 — Polimento para portfólio
- Revisão de responsividade mobile-first e estados vazios/erro
- README final: problema, decisões técnicas (por que Supabase, por que correção proporcional, etc.), gif/screenshots do fluxo
- Conta/dados de demonstração para quem for avaliar o projeto (recrutador) sem precisar criar grupo do zero
- Deploy final revisado na Vercel

### Backlog (pós-MVP, já fora de escopo v1)
- App nativo (React Native), aba de mãos de poker, pagamento integrado, custódia configurável, múltiplas partidas simultâneas — ver seção 3.
