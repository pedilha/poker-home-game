# Poker Home Game

App de apoio para home games de poker: automatiza a conversão fichas → dinheiro e a conciliação entre o total investido (buy-ins + rebuys) e o total declarado ao final da partida, dividindo o resultado de forma justa mesmo quando há divergência.

> Projeto pessoal de portfólio. Especificação completa em [`docs/especificacao.md`](docs/especificacao.md).

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Supabase](https://supabase.com) — Postgres + Auth (Google OAuth + magic link) + Realtime
- [Tailwind CSS](https://tailwindcss.com)
- [Vitest](https://vitest.dev) — testes unitários (foco na lógica de conciliação)
- Deploy: [Vercel](https://vercel.com)

## Desenvolvimento

```bash
npm install
cp .env.example .env.local # preencher com as credenciais do seu projeto Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (Vitest) |
