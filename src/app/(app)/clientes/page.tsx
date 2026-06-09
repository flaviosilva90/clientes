import { Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ClienteDialog } from "@/components/cliente-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { removerCliente } from "./actions";
import { formatBRL } from "@/lib/format";
import { type Cliente } from "@/lib/types";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("*").order("nome");
  const clientes = (data ?? []) as Cliente[];

  return (
    <div>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">
            {clientes.length} cliente(s) cadastrado(s)
          </p>
        </div>
        <ClienteDialog />
      </header>

      {clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Users className="h-6 w-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-700">Nenhum cliente ainda</p>
          <p className="mt-1 text-sm text-slate-500">
            Clique em &quot;Novo cliente&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Tabela - desktop */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Mensalidade</th>
                <th className="px-4 py-3 font-medium">Venc.</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{c.nome}</div>
                    {c.documento && (
                      <div className="text-xs text-slate-500">{c.documento}</div>
                    )}
                    {[c.cidade, c.uf].filter(Boolean).length > 0 && (
                      <div className="text-xs text-slate-400">
                        {[c.cidade, c.uf].filter(Boolean).join(" / ")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{c.email ?? "—"}</div>
                    <div className="text-xs text-slate-500">
                      {c.telefone ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatBRL(c.valor_mensalidade)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    Dia {c.dia_vencimento}
                  </td>
                  <td className="px-4 py-3">
                    {c.ativo ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <ClienteDialog cliente={c} />
                      <ConfirmDialog
                        action={removerCliente}
                        hidden={{ id: c.id }}
                        triggerClassName="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        trigger={<Trash2 className="h-4 w-4" />}
                        title="Remover cliente"
                        message={`Remover "${c.nome}"? Todas as mensalidades vinculadas também serão excluídas.`}
                        confirmLabel="Remover"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cards - mobile */}
          <div className="divide-y divide-slate-100 md:hidden">
            {clientes.map((c) => (
              <div key={c.id} className="flex items-start justify-between p-4">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900">{c.nome}</div>
                  <div className="truncate text-sm text-slate-500">
                    {c.email ?? c.telefone ?? "—"}
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    {formatBRL(c.valor_mensalidade)} · vence dia{" "}
                    {c.dia_vencimento}
                  </div>
                  {[c.cidade, c.uf].filter(Boolean).length > 0 && (
                    <div className="truncate text-xs text-slate-400">
                      {[c.cidade, c.uf].filter(Boolean).join(" / ")}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <ClienteDialog cliente={c} />
                  <ConfirmDialog
                    action={removerCliente}
                    hidden={{ id: c.id }}
                    triggerClassName="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    trigger={<Trash2 className="h-4 w-4" />}
                    title="Remover cliente"
                    message={`Remover "${c.nome}"? Todas as mensalidades vinculadas também serão excluídas.`}
                    confirmLabel="Remover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
