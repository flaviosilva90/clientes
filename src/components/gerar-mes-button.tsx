"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import {
  gerarMensalidades,
  type GerarState,
} from "@/app/(app)/mensalidades/actions";

const initial: GerarState = {};

function AutoToast({ ok, msg }: { ok: boolean; msg: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
        ok ? "bg-slate-900 text-white" : "bg-red-600 text-white"
      }`}
    >
      {msg}
    </div>
  );
}

export function GerarMesButton({ competenciaMes }: { competenciaMes: string }) {
  const [state, formAction, pending] = useActionState(
    gerarMensalidades,
    initial,
  );

  const toast = state.ok
    ? {
        ok: true,
        msg: state.criadas
          ? `${state.criadas} mensalidade(s) gerada(s).`
          : "As mensalidades deste mês já estavam geradas.",
      }
    : state.error
      ? { ok: false, msg: state.error }
      : null;

  return (
    <>
      <form action={formAction}>
        <input type="hidden" name="competencia" value={competenciaMes} />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CalendarPlus className="h-4 w-4" />
          )}
          Gerar mês
        </button>
      </form>

      {toast && (
        <AutoToast key={JSON.stringify(state)} ok={toast.ok} msg={toast.msg} />
      )}
    </>
  );
}
