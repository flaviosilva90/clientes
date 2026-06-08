"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GerarState = { ok?: boolean; error?: string; criadas?: number };
export type FormState = { ok?: boolean; error?: string };

// Data de hoje (YYYY-MM-DD) no fuso de Brasilia.
function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

// Vencimento ajustado ao ultimo dia do mes quando o dia nao existe.
function calcVencimento(ano: number, mes: number, dia: number): string {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const d = Math.min(dia, ultimoDia);
  return `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function revalidar() {
  revalidatePath("/mensalidades");
  revalidatePath("/dashboard");
}

export async function gerarMensalidades(
  _prev: GerarState,
  formData: FormData,
): Promise<GerarState> {
  const competenciaMes = String(formData.get("competencia") ?? "");
  if (!/^\d{4}-\d{2}$/.test(competenciaMes))
    return { error: "Competência inválida." };

  const [ano, mes] = competenciaMes.split("-").map(Number);
  const competencia = `${competenciaMes}-01`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, valor_mensalidade, dia_vencimento")
    .eq("ativo", true);
  if (!clientes || clientes.length === 0)
    return { error: "Nenhum cliente ativo para gerar mensalidades." };

  const { data: existentes } = await supabase
    .from("mensalidades")
    .select("cliente_id")
    .eq("competencia", competencia);
  const jaTem = new Set((existentes ?? []).map((m) => m.cliente_id));

  const novas = clientes
    .filter((c) => !jaTem.has(c.id))
    .map((c) => ({
      user_id: user.id,
      cliente_id: c.id,
      competencia,
      vencimento: calcVencimento(ano, mes, c.dia_vencimento),
      valor: c.valor_mensalidade,
      status: "pendente",
    }));

  if (novas.length === 0) return { ok: true, criadas: 0 };

  const { error } = await supabase.from("mensalidades").insert(novas);
  if (error) return { error: error.message };

  revalidar();
  return { ok: true, criadas: novas.length };
}

export async function criarMensalidade(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const cliente_id = String(formData.get("cliente_id") ?? "");
  const competenciaMes = String(formData.get("competencia") ?? "");
  const valor = Number(formData.get("valor") ?? 0) || 0;
  const vencimento = String(formData.get("vencimento") ?? "");
  const status = String(formData.get("status") ?? "pendente");

  if (!cliente_id) return { error: "Selecione um cliente." };
  if (!/^\d{4}-\d{2}$/.test(competenciaMes))
    return { error: "Competência inválida." };
  if (!vencimento) return { error: "Informe a data de vencimento." };

  const supabase = await createClient();
  const { error } = await supabase.from("mensalidades").insert({
    cliente_id,
    competencia: `${competenciaMes}-01`,
    valor,
    vencimento,
    status,
    data_pagamento: status === "pago" ? hojeISO() : null,
  });

  if (error) {
    if (error.code === "23505")
      return { error: "Já existe mensalidade desse cliente nesta competência." };
    return { error: error.message };
  }

  revalidar();
  return { ok: true };
}

export async function marcarPago(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("mensalidades")
    .update({ status: "pago", data_pagamento: hojeISO() })
    .eq("id", id);
  revalidar();
}

export async function marcarPendente(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("mensalidades")
    .update({ status: "pendente", data_pagamento: null })
    .eq("id", id);
  revalidar();
}

export async function removerMensalidade(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("mensalidades").delete().eq("id", id);
  revalidar();
}
