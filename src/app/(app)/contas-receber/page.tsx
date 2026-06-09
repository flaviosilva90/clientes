import { Check, RotateCcw, Trash2, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ContaReceberDialog } from "@/components/conta-receber-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/ui";
import {
  marcarParcelaPaga,
  marcarParcelaPendente,
  removerConta,
} from "./actions";
import { formatBRL, formatDate } from "@/lib/format";
import {
  statusExibicaoParcela,
  labelFormaPagamento,
  type ParcelaComConta,
} from "@/lib/types";

function nomeCliente(p: ParcelaComConta): string {
  const c = p.conta?.cliente as
    | { nome: string }
    | { nome: string }[]
    | null
    | undefined;
  if (!c) return "—";
  return Array.isArray(c) ? (c[0]?.nome ?? "—") : c.nome;
}

export default async function ContasReceberPage() {
  const supabase = await createClient();

  const { data: parcelasData } = await supabase
    .from("parcelas")
    .select(
      "*, conta:contas_receber(descricao, forma_pagamento, num_parcelas, cliente:clientes(nome))",
    )
    .order("vencimento");
  const parcelas = (parcelasData ?? []) as ParcelaComConta[];

  const { data: clientesData } = await supabase
    .from("clientes")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");
  const clientes = clientesData ?? [];

  const ativas = parcelas.filter((p) => p.status !== "cancelado");
  const total = ativas.reduce((s, p) => s + Number(p.valor), 0);
  const recebido = ativas
    .filter((p) => p.status === "pago")
    .reduce((s, p) => s + Number(p.valor), 0);
  const emAberto = total - recebido;

  const resumo = [
    { label: "Total lançado", valor: total, cls: "text-slate-900" },
    { label: "Recebido", valor: recebido, cls: "text-emerald-600" },
    { label: "Em aberto", valor: emAberto, cls: "text-amber-600" },
  ];

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Contas a receber
          </h1>
          <p className="text-sm text-slate-500">
            Lançamentos avulsos e parcelados
          </p>
        </div>
        <ContaReceberDialog clientes={clientes} />
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {resumo.map((r) => (
          <div
            key={r.label}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <p className="text-xs text-slate-500">{r.label}</p>
            <p className={`text-lg font-bold ${r.cls}`}>{formatBRL(r.valor)}</p>
          </div>
        ))}
      </div>

      {parcelas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Wallet className="h-6 w-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-700">Nenhuma conta a receber</p>
          <p className="mt-1 text-sm text-slate-500">
            Use &quot;Nova conta a receber&quot; para lançar uma cobrança
            avulsa.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Parcela</th>
                <th className="px-4 py-3 font-medium">Pagamento</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parcelas.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {p.conta?.descricao ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{nomeCliente(p)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.numero}/{p.conta?.num_parcelas ?? 1}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {labelFormaPagamento(p.conta?.forma_pagamento)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(p.vencimento)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatBRL(p.valor)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={statusExibicaoParcela(p)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {p.status === "pago" ? (
                        <form action={marcarParcelaPendente}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            title="Reabrir (marcar como pendente)"
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reabrir
                          </button>
                        </form>
                      ) : (
                        <form action={marcarParcelaPaga}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            title="Marcar como pago"
                            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Marcar pago
                          </button>
                        </form>
                      )}
                      <ConfirmDialog
                        action={removerConta}
                        hidden={{ conta_id: p.conta_id }}
                        triggerClassName="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        trigger={<Trash2 className="h-4 w-4" />}
                        title="Remover lançamento"
                        message={`Remover o lançamento "${p.conta?.descricao ?? ""}" e todas as suas ${p.conta?.num_parcelas ?? 1} parcela(s)? Esta ação não pode ser desfeita.`}
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
            {parcelas.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-slate-900">
                      {p.conta?.descricao ?? "—"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {nomeCliente(p)} · {p.numero}/{p.conta?.num_parcelas ?? 1}{" "}
                      · {labelFormaPagamento(p.conta?.forma_pagamento)}
                    </div>
                    <div className="text-sm text-slate-500">
                      Vence {formatDate(p.vencimento)}
                    </div>
                  </div>
                  <StatusBadge status={statusExibicaoParcela(p)} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {formatBRL(p.valor)}
                  </span>
                  <div className="flex items-center gap-1">
                    {p.status === "pago" ? (
                      <form action={marcarParcelaPendente}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reabrir
                        </button>
                      </form>
                    ) : (
                      <form action={marcarParcelaPaga}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Pago
                        </button>
                      </form>
                    )}
                    <ConfirmDialog
                      action={removerConta}
                      hidden={{ conta_id: p.conta_id }}
                      triggerClassName="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      trigger={<Trash2 className="h-4 w-4" />}
                      title="Remover lançamento"
                      message={`Remover o lançamento "${p.conta?.descricao ?? ""}" e todas as suas ${p.conta?.num_parcelas ?? 1} parcela(s)? Esta ação não pode ser desfeita.`}
                      confirmLabel="Remover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
