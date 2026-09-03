# Poker Home Game

App de apoio para home games de poker: automatiza a conversão fichas → dinheiro e a conciliação entre o total investido (buy-ins + rebuys) e o total declarado ao final da partida, dividindo o resultado de forma justa mesmo quando há divergência.

**Deploy**: [poker-home-game-gray.vercel.app](https://poker-home-game-gray.vercel.app)

> Projeto pessoal de portfólio. Especificação completa (problema, regras de negócio, modelo de dados, roadmap por fase) em [`docs/especificacao.md`](docs/especificacao.md).

## O problema

Jogadores de home game erram na hora de dividir o dinheiro ao final da partida — principalmente por conversão manual de fichas com valores fracionados entre cores diferentes. O app resolve isso automatizando a conversão e conciliando o total declarado pelos jogadores contra o total efetivamente investido (buy-ins + rebuys), sinalizando divergências e oferecendo uma correção proporcional matematicamente neutra quando os números não batem.

## Funcionalidades

- **Grupos**: criação, entrada por código com aprovação de dono/admin, papéis (dono/admin/membro)
- **Configuração de fichas por grupo**: cada cor vale um número de *unidades*; existe um valor de unidade único que reprecifica o set inteiro de uma vez
- **Partidas**: snapshot imutável da config de fichas no momento da criação (edições futuras no grupo nunca reescrevem partidas já criadas), buy-in/rebuy registrados pelo líder, declaração de fichas com conversão automática (pelo líder ou pelo próprio jogador)
- **Conciliação**: ao fechar a partida, se o total declarado não bate com o investido, o líder vê a diferença e escolhe entre corrigir as declarações ou aplicar uma **correção proporcional** (`total investido ÷ total declarado`, preservando quem ganhou/perdeu mais)
- **Ranking**: saldo líquido acumulado por jogador, abas mês/ano/total, desempate por *standard competition ranking* (empatados dividem posição — 1º, 2º, 2º, 4º)
- **Histórico** de partidas fechadas, com flag de divergência
- **Calculadora avulsa**: converte fichas em dinheiro sem afetar ranking/histórico

## Decisões técnicas

- **Lógica de domínio isolada e testada primeiro**: a conciliação (`src/lib/poker/reconciliation.ts`) e o ranking (`src/lib/poker/ranking.ts`) são funções puras com testes unitários (Vitest) escritos antes da UI — é a parte mais sensível a bug silencioso do produto.
- **Segurança via RLS, não via código de aplicação**: toda tabela no Postgres tem Row Level Security própria (quem pode ver/editar o quê é decidido no banco, não confiado à UI). Funções `security definer` evitam recursão nas políticas que precisam checar associações de grupo.
- **Snapshot imutável por partida**: fichas e buy-in são copiados para a partida no momento da criação; mudar a config do grupo depois nunca reescreve histórico.
- **Modelo de fichas por unidades**: cada cor guarda um multiplicador (`units`), e existe um valor de unidade único por grupo — reprecificar o set inteiro é editar um número, não cada cor manualmente.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Server Actions)
- [Supabase](https://supabase.com) — Postgres + Auth (Google OAuth + magic link) + Row Level Security
- [Tailwind CSS](https://tailwindcss.com) v4
- [Vitest](https://vitest.dev) — testes unitários da lógica de domínio
- Deploy: [Vercel](https://vercel.com), CI no GitHub Actions (lint + testes a cada push)

## Desenvolvimento

```bash
npm install
cp .env.example .env.local # preencher com as credenciais do seu projeto Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

As migrations em [`supabase/migrations`](supabase/migrations) precisam ser aplicadas no seu projeto Supabase (via SQL Editor ou `supabase db push`) antes do app funcionar. [`supabase/seed.sql`](supabase/seed.sql) tem dados de teste para desenvolvimento local com `supabase start` (requer Docker).

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (Vitest) |

## Status

Em desenvolvimento ativo. Fases 0–5 do roadmap completas (fundação, schema/RLS, autenticação e grupos, partidas e conciliação, ranking/histórico, calculadora). Em andamento: polimento de UI/UX. Detalhe fase a fase em [`docs/especificacao.md`](docs/especificacao.md#11-roadmap-de-implementação-do-zero-ao-deploy).
