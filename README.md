# Gestão de Clientes e Mensalidades

Sistema web para cadastrar clientes e controlar mensalidades, com tela de login.
Feito com **Next.js + Supabase**, pronto para publicar na **Vercel**.

## Funcionalidades

- 🔐 **Login** com e-mail e senha (Supabase Auth)
- 👥 **Clientes**: cadastro, edição e exclusão (nome, contato, documento, valor da mensalidade, dia de vencimento)
- 🧾 **Mensalidades**: geração mensal em lote, marcar como pago/pendente, lançamento avulso, controle de atrasos
- 📊 **Dashboard**: clientes ativos, receita prevista, recebido no mês, em aberto e pagamentos em atraso
- 🔒 Dados isolados por usuário (Row Level Security), já preparado para múltiplos usuários

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com) (Postgres + Auth)

---

## 1. Criar o banco no Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e clique em **New project**.
2. Defina um nome e uma senha para o banco (guarde a senha). Aguarde alguns minutos até o projeto ficar pronto.
3. No menu lateral, abra **SQL Editor** → **New query**.
4. Copie todo o conteúdo do arquivo [`supabase/schema.sql`](supabase/schema.sql) deste projeto, cole e clique em **Run**.
   Isso cria as tabelas `clientes` e `mensalidades` com as regras de segurança.

## 2. Criar seu usuário de acesso

Por padrão, o Supabase pede confirmação de e-mail. Para uso pessoal, escolha **uma** das opções:

- **Opção A — desativar confirmação (mais simples):**
  Vá em **Authentication → Sign In / Providers → Email** e desative **Confirm email**. Salve.
  Depois é só usar o botão **Criar conta** na tela de login do sistema.

- **Opção B — criar o usuário direto no painel:**
  Vá em **Authentication → Users → Add user**, informe e-mail e senha e marque para confirmar automaticamente.

## 3. Pegar as credenciais

No Supabase, vá em **Project Settings → API** (ou **Data API**) e copie:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Edite o arquivo `.env.local` na raiz do projeto com esses valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

---

## 4. Rodar localmente

Pré-requisito: **Node.js** instalado.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Você será levado à tela de login.

## 5. Publicar na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione as duas variáveis do `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Clique em **Deploy**.
5. (Opcional) Em **Authentication → URL Configuration** no Supabase, adicione a URL de produção
   da Vercel em **Site URL** / **Redirect URLs**.

---

## Como usar

1. **Entre** com seu e-mail e senha.
2. Em **Clientes**, cadastre seus clientes com o valor da mensalidade e o dia de vencimento.
3. Em **Mensalidades**, escolha o mês e clique em **Gerar mês** para criar as cobranças de
   todos os clientes ativos. Use **Nova mensalidade** para lançamentos avulsos.
4. Marque cada mensalidade como **paga** quando receber. As pendentes vencidas aparecem como
   **atrasadas** e no painel do **Dashboard**.

## Estrutura

```
src/
  app/
    login/                 # tela de login + ações de autenticação
    (app)/                 # área autenticada
      dashboard/           # painel com indicadores
      clientes/            # CRUD de clientes
      mensalidades/        # gestão de mensalidades
    auth/signout/          # logout
  components/              # UI (sidebar, modal, formulários, etc.)
  lib/
    supabase/              # clientes Supabase (browser, server) + proxy de sessão
    types.ts, format.ts    # tipos e formatação (R$, datas)
  proxy.ts                 # proteção de rotas (sessão)
supabase/schema.sql        # script do banco de dados
```

## Próximo passo: cobrança automática (futuro)

O controle hoje é **manual**. A estrutura já está preparada para integrar um gateway de
pagamento (ex.: Mercado Pago ou Stripe) e dar baixa automática nas mensalidades, quando quiser
evoluir nessa direção.
