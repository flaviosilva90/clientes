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
  valor_mensalidade numeric(10, 2) not null default 0,
  dia_vencimento    int not null default 10 check (dia_vencimento between 1 and 31),
  data_inicio       date not null default current_date,
  ativo             boolean not null default true,
  observacoes       text,
  created_at        timestamptz not null default now()
);

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
