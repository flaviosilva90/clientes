import Link from "next/link";
import {
  Users,
  Wallet,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, formatCompetencia } from "@/lib/format";

function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function nomeDe(c: unknown): string {
  if (!c) return "Cliente removido";
  if (Array.isArray(c)) return (c[0] as { nome: string })?.nome ?? "—";
  return (c as { nome: string }).nome;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const competencia = `${hojeISO().slice(0, 7)}-01`;

  const { data: clientesAtivos } = await supabase
    .from("clientes")
    .select("valor_mensalidade")
    .eq("ativo", true);
  const totalClientes = clientesAtivos?.length ?? 0;
  const receitaPrevista = (clientesAtivos ?? []).reduce(
    (s, c) => s + Number(c.valor_mensalidade),
    0,
  );

  const { data: mensMes } = await supabase
    .from("mensalidades")
    .select("valor, status")
    .eq("competencia", competencia);
  const ativosMes = (mensMes ?? []).filter((m) => m.status !== "cancelado");
  const recebidoMes = ativosMes
    .filter((m) => m.status === "pago")
    .reduce((s, m) => s + Number(m.valor), 0);
  const emAbertoMes = ativosMes
    .filter((m) => m.status !== "pago")
    .reduce((s, m) => s + Number(m.valor), 0);

  const { data: atrasadas } = await supabase
    .from("mensalidades")
    .select("id, valor, vencimento, cliente:clientes(nome)")
    .eq("status", "pendente")
    .lt("vencimento", hojeISO())
    .order("vencimento")
    .limit(8);

  const cards: {
    label: string;
    valor: string;
    icon: LucideIcon;
    cls: string;
  }[] = [
    {
      label: "Clientes ativos",
      valor: String(totalClientes),
      icon: Users,
      cls: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Receita prevista/mês",
      valor: formatBRL(receitaPrevista),
      icon: Wallet,
      cls: "bg-violet-50 text-violet-600",
    },
    {
      label: "Recebido no mês",
      valor: formatBRL(recebidoMes),
      icon: TrendingUp,
      cls: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Em aberto no mês",
      valor: formatBRL(emAbertoMes),
      icon: Clock,
      cls: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm capitalize text-slate-500">
          {formatCompetencia(competencia)}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${c.cls}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-500">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {c.valor}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h2 className="font-semibold text-slate-900">
              Pagamentos em atraso
            </h2>
          </div>
          <Link
            href="/mensalidades"
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Ver mensalidades
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!atrasadas || atrasadas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            Nenhum pagamento em atraso. 🎉
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {atrasadas.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {nomeDe(m.cliente)}
                  </p>
                  <p className="text-sm text-red-600">
                    Venceu em {formatDate(m.vencimento)}
                  </p>
                </div>
                <span className="font-semibold text-slate-900">
                  {formatBRL(m.valor)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
