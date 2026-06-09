"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { ok?: boolean; error?: string };

// Data de hoje (YYYY-MM-DD) no fuso de Brasília.
function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function revalidar() {
  revalidatePath("/contas-receber");
  revalidatePath("/dashboard");
}

// Soma "meses" a uma data YYYY-MM-DD, ajustando ao último dia do mês
// quando o dia não existe (ex.: 31/jan + 1 mês => 28/fev).
function somarMeses(dataISO: string, meses: number): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const alvo = new Date(ano, mes - 1 + meses, 1);
  const a = alvo.getFullYear();
  const m = alvo.getMonth() + 1;
  const ultimoDia = new Date(a, m, 0).getDate();
  const d = Math.min(dia, ultimoDia);
  return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Divide o valor total em "n" parcelas (em centavos), sem perder nem
// sobrar centavos: as primeiras parcelas absorvem o arredondamento.
function dividirParcelas(total: number, n: number): number[] {
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / n);
  const resto = totalCents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i < resto ? 1 : 0)) / 100);
}

export async function criarContaReceber(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const cliente_id = String(formData.get("cliente_id") ?? "") || null;
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor_total = Number(formData.get("valor_total") ?? 0) || 0;
  const forma_pagamento = String(formData.get("forma_pagamento") ?? "pix");
  const num_parcelas = Math.min(
    360,
    Math.max(1, Math.trunc(Number(formData.get("num_parcelas") ?? 1)) || 1),
  );
  const primeiro_vencimento = String(formData.get("primeiro_vencimento") ?? "");
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  if (!descricao) return { error: "Informe uma descrição." };
  if (valor_total <= 0) return { error: "Informe um valor maior que zero." };
  if (!primeiro_vencimento)
    return { error: "Informe a data do primeiro vencimento." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { data: conta, error: erroConta } = await supabase
    .from("contas_receber")
    .insert({
      user_id: user.id,
      cliente_id,
      descricao,
      valor_total,
      forma_pagamento,
      num_parcelas,
      data_lancamento: hojeISO(),
      observacoes,
    })
    .select("id")
    .single();

  if (erroConta || !conta)
    return { error: erroConta?.message ?? "Erro ao criar o lançamento." };

  const valores = dividirParcelas(valor_total, num_parcelas);
  const parcelas = valores.map((valor, i) => ({
    user_id: user.id,
    conta_id: conta.id as string,
    numero: i + 1,
    vencimento: somarMeses(primeiro_vencimento, i),
    valor,
    status: "pendente",
  }));

  const { error: erroParcelas } = await supabase
    .from("parcelas")
    .insert(parcelas);
  if (erroParcelas) {
    // Evita deixar um lançamento órfão sem parcelas.
    await supabase.from("contas_receber").delete().eq("id", conta.id);
    return { error: erroParcelas.message };
  }

  revalidar();
  return { ok: true };
}

export async function marcarParcelaPaga(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("parcelas")
    .update({ status: "pago", data_pagamento: hojeISO() })
    .eq("id", id);
  revalidar();
}

export async function marcarParcelaPendente(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("parcelas")
    .update({ status: "pendente", data_pagamento: null })
    .eq("id", id);
  revalidar();
}

export async function removerConta(formData: FormData): Promise<void> {
  const id = String(formData.get("conta_id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  // Remove o lançamento; as parcelas saem junto (on delete cascade).
  await supabase.from("contas_receber").delete().eq("id", id);
  revalidar();
}
