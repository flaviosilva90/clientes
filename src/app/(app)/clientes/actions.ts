"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { ok?: boolean; error?: string };

function parseClienteForm(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    telefone: String(formData.get("telefone") ?? "").trim() || null,
    documento: String(formData.get("documento") ?? "").trim() || null,
    valor_mensalidade: Number(formData.get("valor_mensalidade") ?? 0) || 0,
    dia_vencimento: Number(formData.get("dia_vencimento") ?? 10) || 10,
    data_inicio:
      String(formData.get("data_inicio") ?? "") ||
      new Date().toISOString().slice(0, 10),
    ativo: formData.get("ativo") != null,
    observacoes: String(formData.get("observacoes") ?? "").trim() || null,
  };
}

export async function criarCliente(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const dados = parseClienteForm(formData);
  if (!dados.nome) return { error: "O nome é obrigatório." };
  if (dados.dia_vencimento < 1 || dados.dia_vencimento > 31)
    return { error: "Dia de vencimento deve estar entre 1 e 31." };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").insert(dados);
  if (error) return { error: error.message };

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function atualizarCliente(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Cliente inválido." };

  const dados = parseClienteForm(formData);
  if (!dados.nome) return { error: "O nome é obrigatório." };
  if (dados.dia_vencimento < 1 || dados.dia_vencimento > 31)
    return { error: "Dia de vencimento deve estar entre 1 e 31." };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update(dados).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removerCliente(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("clientes").delete().eq("id", id);

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  revalidatePath("/mensalidades");
}
