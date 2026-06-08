"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

function traduzErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar.";
  if (m.includes("user already registered"))
    return "Este e-mail já está cadastrado.";
  if (m.includes("password should be at least"))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (m.includes("unable to validate email address")) return "E-mail inválido.";
  if (m.includes("signups not allowed"))
    return "Cadastro desativado no projeto Supabase.";
  return msg;
}

export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const intent = String(formData.get("intent") ?? "login");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Informe e-mail e senha." };

  const supabase = await createClient();

  if (intent === "signup") {
    if (password.length < 6)
      return { error: "A senha deve ter pelo menos 6 caracteres." };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: traduzErro(error.message) };
    if (!data.session) {
      return {
        message:
          "Conta criada! Verifique seu e-mail para confirmar e depois faça login.",
      };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: traduzErro(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
