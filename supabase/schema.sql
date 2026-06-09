-- ============================================================
--  Schema do sistema de Clientes e Mensalidades
--  Rode este script no SQL Editor do seu projeto Supabase.
-- ============================================================

-- ----------------------------------------------------------------
-- Tabela: clientes
-- ----------------------------------------------------------------
create table if not exists public.clientes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome              text not null,
  email             text,
  telefone          text,
  documento         text,                              -- CPF/CNPJ (opcional)
  cep               text,
  logradouro        text,
  numero            text,
  complemento       text,
  bairro            text,
  cidade            text,
  uf                text,
  valor_mensalidade numeric(10, 2) not null default 0,
  dia_vencimento    int not null default 10 check (dia_vencimento between 1 and 31),
  data_inicio       date not null default current_date,
  ativo             boolean not null default true,
  observacoes       text,
  created_at        timestamptz not null default now()
);

-- Campos de endereço — rode caso a tabela "clientes" já exista sem eles.
alter table public.clientes add column if not exists cep         text;
alter table public.clientes add column if not exists logradouro  text;
alter table public.clientes add column if not exists numero      text;
alter table public.clientes add column if not exists complemento text;
alter table public.clientes add column if not exists bairro      text;
alter table public.clientes add column if not exists cidade      text;
alter table public.clientes add column if not exists uf          text;

-- ----------------------------------------------------------------
-- Tabela: mensalidades
-- ----------------------------------------------------------------
create table if not exists public.mensalidades (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id      uuid not null references public.clientes (id) on delete cascade,
  competencia     date not null,                       -- primeiro dia do mes de referencia
  vencimento      date not null,
  valor           numeric(10, 2) not null default 0,
  status          text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  data_pagamento  date,
  forma_pagamento text,
  observacoes     text,
  created_at      timestamptz not null default now(),
  unique (cliente_id, competencia)                     -- 1 mensalidade por cliente/mes
);

-- ----------------------------------------------------------------
-- Indices
-- ----------------------------------------------------------------
create index if not exists idx_clientes_user on public.clientes (user_id);
create index if not exists idx_mensalidades_user on public.mensalidades (user_id);
create index if not exists idx_mensalidades_cliente on public.mensalidades (cliente_id);
create index if not exists idx_mensalidades_competencia on public.mensalidades (competencia);
create index if not exists idx_mensalidades_status on public.mensalidades (status);

-- ----------------------------------------------------------------
-- Row Level Security: cada usuario so enxerga os proprios dados.
-- (Ja deixa o sistema pronto para multiplos usuarios no futuro.)
-- ----------------------------------------------------------------
alter table public.clientes enable row level security;
alter table public.mensalidades enable row level security;

drop policy if exists "clientes_proprios" on public.clientes;
create policy "clientes_proprios" on public.clientes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "mensalidades_proprias" on public.mensalidades;
create policy "mensalidades_proprias" on public.mensalidades
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
--  Contas a receber (lançamentos avulsos) + parcelas
--  Roda este bloco no SQL Editor para habilitar a nova tela.
-- ============================================================

-- ----------------------------------------------------------------
-- Tabela: contas_receber
--   Um lançamento único com valor total, forma de pagamento e
--   número de parcelas. As parcelas ficam na tabela "parcelas".
-- ----------------------------------------------------------------
create table if not exists public.contas_receber (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id      uuid references public.clientes (id) on delete set null,  -- opcional (avulso)
  descricao       text not null,
  valor_total     numeric(10, 2) not null default 0,
  forma_pagamento text not null default 'pix',
  num_parcelas    int not null default 1 check (num_parcelas between 1 and 360),
  data_lancamento date not null default current_date,
  observacoes     text,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- Tabela: parcelas (uma linha por parcela de uma conta a receber)
-- ----------------------------------------------------------------
create table if not exists public.parcelas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  conta_id        uuid not null references public.contas_receber (id) on delete cascade,
  numero          int not null,                        -- 1, 2, 3, ...
  vencimento      date not null,
  valor           numeric(10, 2) not null default 0,
  status          text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  data_pagamento  date,
  created_at      timestamptz not null default now()
);

-- Indices
create index if not exists idx_contas_user on public.contas_receber (user_id);
create index if not exists idx_contas_cliente on public.contas_receber (cliente_id);
create index if not exists idx_parcelas_user on public.parcelas (user_id);
create index if not exists idx_parcelas_conta on public.parcelas (conta_id);
create index if not exists idx_parcelas_vencimento on public.parcelas (vencimento);
create index if not exists idx_parcelas_status on public.parcelas (status);

-- Row Level Security
alter table public.contas_receber enable row level security;
alter table public.parcelas enable row level security;

drop policy if exists "contas_receber_proprias" on public.contas_receber;
create policy "contas_receber_proprias" on public.contas_receber
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "parcelas_proprias" on public.parcelas;
create policy "parcelas_proprias" on public.parcelas
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
