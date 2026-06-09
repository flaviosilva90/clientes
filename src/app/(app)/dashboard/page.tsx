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
  const hoje = hojeISO();
  const mesAtual = hoje.slice(0, 7);
  const competencia = `${mesAtual}-01`;

  // Primeiro dia do próximo mês (para delimitar as parcelas do mês atual).
  const [anoN, mesN] = mesAtual.split("-").map(Number);
  const prox = new Date(anoN, mesN, 1);
  const inicioProxMes = `${prox.getFullYear()}-${String(
    prox.getMonth() + 1,
  ).padStart(2, "0")}-01`;

  // --- Clientes ativos / receita recorrente prevista ---
  const { data: clientesAtivos } = await supabase
    .from("clientes")
    .select("valor_mensalidade")
    .eq("ativo", true);
  const totalClientes = clientesAtivos?.length ?? 0;
  const receitaPrevista = (clientesAtivos ?? []).reduce(
    (s, c) => s + Number(c.valor_mensalidade),
    0,
  );

  // --- Mensalidades do mês ---
  const { data: mensMes } = await supabase
    .from("mensalidades")
    .select("valor, status")
    .eq("competencia", competencia);
  const ativosMes = (mensMes ?? []).filter((m) => m.status !== "cancelado");
  let recebidoMes = ativosMes
    .filter((m) => m.status === "pago")
    .reduce((s, m) => s + Number(m.valor), 0);
  let emAbertoMes = ativosMes
    .filter((m) => m.status !== "pago")
    .reduce((s, m) => s + Number(m.valor), 0);

  // --- Parcelas (contas a receber) com vencimento no mês atual ---
  const { data: parcMes } = await supabase
    .from("parcelas")
    .select("valor, status")
    .gte("vencimento", competencia)
    .lt("vencimento", inicioProxMes);
  const parcAtivasMes = (parcMes ?? []).filter((p) => p.status !== "cancelado");
  recebidoMes += parcAtivasMes
    .filter((p) => p.status === "pago")
    .reduce((s, p) => s + Number(p.valor), 0);
  emAbertoMes += parcAtivasMes
    .filter((p) => p.status !== "pago")
    .reduce((s, p) => s + Number(p.valor), 0);

  // --- Mensalidades em atraso ---
  const { data: atrasadas } = await supabase
    .from("mensalidades")
    .select("id, valor, vencimento, cliente:clientes(nome)")
    .eq("status", "pendente")
    .lt("vencimento", hoje)
    .order("vencimento")
    .limit(8);

  // --- Contas a receber em aberto (parcelas ainda não pagas) ---
  const { data: parcelasAbertas } = await supabase
    .from("parcelas")
    .select("id, valor, vencimento, conta:contas_receber(descricao)")
    .eq("status", "pendente")
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

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mensalidades em atraso */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h2 className="font-semibold text-slate-900">
                Mensalidades em atraso
              </h2>
            </div>
            <Link
              href="/mensalidades"
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Ver
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {!atrasadas || atrasadas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              Nenhuma mensalidade em atraso. 🎉
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

        {/* Contas a receber em aberto */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-slate-900">
                Contas a receber em aberto
              </h2>
            </div>
            <Link
              href="/contas-receber"
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Ver
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {!parcelasAbertas || parcelasAbertas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              Nenhuma conta a receber em aberto. 🎉
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {parcelasAbertas.map((p) => {
                const c = p.conta as unknown as
                  | { descricao: string }
                  | { descricao: string }[]
                  | null;
                const descricao = !c
                  ? "—"
                  : Array.isArray(c)
                    ? (c[0]?.descricao ?? "—")
                    : c.descricao;
                const atrasada = p.vencimento < hoje;
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{descricao}</p>
                      <p
                        className={`text-sm ${
                          atrasada ? "text-red-600" : "text-slate-500"
                        }`}
                      >
                        {atrasada ? "Venceu" : "Vence"} em{" "}
                        {formatDate(p.vencimento)}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {formatBRL(p.valor)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
