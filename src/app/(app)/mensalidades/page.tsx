import { Check, RotateCcw, Trash2, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SeletorMes } from "@/components/seletor-mes";
import { GerarMesButton } from "@/components/gerar-mes-button";
import { MensalidadeDialog } from "@/components/mensalidade-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/ui";
import {
  marcarPago,
  marcarPendente,
  removerMensalidade,
} from "./actions";
import { formatBRL, formatDate, formatCompetencia } from "@/lib/format";
import { statusExibicao, type MensalidadeComCliente } from "@/lib/types";

function nomeCliente(m: MensalidadeComCliente): string {
  const c = m.cliente as { nome: string } | { nome: string }[] | null;
  if (!c) return "Cliente removido";
  return Array.isArray(c) ? (c[0]?.nome ?? "—") : c.nome;
}

function mesAtual(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

export default async function MensalidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const competenciaMes = /^\d{4}-\d{2}$/.test(mes ?? "") ? mes! : mesAtual();
  const competencia = `${competenciaMes}-01`;

  const supabase = await createClient();

  const { data: mensData } = await supabase
    .from("mensalidades")
    .select("*, cliente:clientes(nome)")
    .eq("competencia", competencia)
    .order("vencimento");
  const mensalidades = (mensData ?? []) as MensalidadeComCliente[];

  const { data: clientesData } = await supabase
    .from("clientes")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");
  const clientes = clientesData ?? [];

  const ativos = mensalidades.filter((m) => m.status !== "cancelado");
  const total = ativos.reduce((s, m) => s + Number(m.valor), 0);
  const recebido = ativos
    .filter((m) => m.status === "pago")
    .reduce((s, m) => s + Number(m.valor), 0);
  const emAberto = total - recebido;

  const resumo = [
    { label: "Total do mês", valor: total, cls: "text-slate-900" },
    { label: "Recebido", valor: recebido, cls: "text-emerald-600" },
    { label: "Em aberto", valor: emAberto, cls: "text-amber-600" },
  ];

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mensalidades</h1>
          <p className="text-sm capitalize text-slate-500">
            {formatCompetencia(competencia)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GerarMesButton competenciaMes={competenciaMes} />
          <MensalidadeDialog
            clientes={clientes}
            competenciaMes={competenciaMes}
          />
        </div>
      </header>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SeletorMes competenciaMes={competenciaMes} />
        <div className="grid grid-cols-3 gap-3">
          {resumo.map((r) => (
            <div
              key={r.label}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <p className="text-xs text-slate-500">{r.label}</p>
              <p className={`text-lg font-bold ${r.cls}`}>
                {formatBRL(r.valor)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {mensalidades.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Receipt className="h-6 w-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-700">
            Nenhuma mensalidade neste mês
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Use &quot;Gerar mês&quot; para criar as mensalidades dos clientes
            ativos.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mensalidades.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {nomeCliente(m)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(m.vencimento)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatBRL(m.valor)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={statusExibicao(m)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {m.status === "pago" ? (
                        <form action={marcarPendente}>
                          <input type="hidden" name="id" value={m.id} />
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
                        <form action={marcarPago}>
                          <input type="hidden" name="id" value={m.id} />
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
                        action={removerMensalidade}
                        hidden={{ id: m.id }}
                        triggerClassName="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        trigger={<Trash2 className="h-4 w-4" />}
                        title="Remover mensalidade"
                        message={`Remover a mensalidade de ${nomeCliente(m)} (${formatBRL(m.valor)})?`}
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
            {mensalidades.map((m) => (
              <div key={m.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-slate-900">
                      {nomeCliente(m)}
                    </div>
                    <div className="text-sm text-slate-500">
                      Vence {formatDate(m.vencimento)}
                    </div>
                  </div>
                  <StatusBadge status={statusExibicao(m)} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {formatBRL(m.valor)}
                  </span>
                  <div className="flex items-center gap-1">
                    {m.status === "pago" ? (
                      <form action={marcarPendente}>
                        <input type="hidden" name="id" value={m.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reabrir
                        </button>
                      </form>
                    ) : (
                      <form action={marcarPago}>
                        <input type="hidden" name="id" value={m.id} />
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
                      action={removerMensalidade}
                      hidden={{ id: m.id }}
                      triggerClassName="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      trigger={<Trash2 className="h-4 w-4" />}
                      title="Remover mensalidade"
                      message={`Remover a mensalidade de ${nomeCliente(m)} (${formatBRL(m.valor)})?`}
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
