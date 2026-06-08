"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SeletorMes({ competenciaMes }: { competenciaMes: string }) {
  const router = useRouter();
  const [ano, mes] = competenciaMes.split("-").map(Number);

  const irPara = (valor: string) => router.push(`/mensalidades?mes=${valor}`);

  const navegar = (delta: number) => {
    const d = new Date(ano, mes - 1 + delta, 1);
    const novo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    irPara(novo);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => navegar(-1)}
        className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <input
        type="month"
        value={competenciaMes}
        onChange={(e) => e.target.value && irPara(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
      />
      <button
        type="button"
        onClick={() => navegar(1)}
        className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
