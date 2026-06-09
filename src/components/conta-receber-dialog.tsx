"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Modal } from "./modal";
import { Field, inputClass } from "./ui";
import { formatBRL } from "@/lib/format";
import { FORMAS_PAGAMENTO } from "@/lib/types";
import {
  criarContaReceber,
  type FormState,
} from "@/app/(app)/contas-receber/actions";

const initial: FormState = {};

type ClienteOpcao = { id: string; nome: string };

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function ContaReceberForm({
  clientes,
  onDone,
}: {
  clientes: ClienteOpcao[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    criarContaReceber,
    initial,
  );
  const [valor, setValor] = useState("");
  const [parcelas, setParcelas] = useState("1");

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  const previa = useMemo(() => {
    const v = Number(valor) || 0;
    const n = Math.max(1, Math.trunc(Number(parcelas) || 1));
    if (v <= 0) return null;
    return { n, porParcela: Math.floor((v * 100) / n) / 100 };
  }, [valor, parcelas]);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Cliente" htmlFor="cliente_id">
        <select
          id="cliente_id"
          name="cliente_id"
          defaultValue=""
          className={inputClass}
        >
          <option value="">Sem cliente (avulso)</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Descrição *" htmlFor="descricao">
        <input
          id="descricao"
          name="descricao"
          required
          placeholder="Ex.: Venda de produto, serviço prestado..."
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Valor total (R$) *" htmlFor="valor_total">
          <input
            id="valor_total"
            name="valor_total"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Forma de pagamento *" htmlFor="forma_pagamento">
          <select
            id="forma_pagamento"
            name="forma_pagamento"
            defaultValue="pix"
            className={inputClass}
          >
            {FORMAS_PAGAMENTO.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nº de parcelas *" htmlFor="num_parcelas">
          <input
            id="num_parcelas"
            name="num_parcelas"
            type="number"
            min="1"
            max="360"
            required
            value={parcelas}
            onChange={(e) => setParcelas(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="1º vencimento *" htmlFor="primeiro_vencimento">
          <input
            id="primeiro_vencimento"
            name="primeiro_vencimento"
            type="date"
            required
            defaultValue={hojeISO()}
            className={inputClass}
          />
        </Field>
      </div>

      {previa && (
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          {previa.n === 1
            ? `À vista: ${formatBRL(previa.porParcela)}`
            : `${previa.n}x de aprox. ${formatBRL(previa.porParcela)}`}
        </p>
      )}

      <Field label="Observações" htmlFor="observacoes">
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          className={inputClass}
        />
      </Field>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </button>
      </div>
    </form>
  );
}

export function ContaReceberDialog({ clientes }: { clientes: ClienteOpcao[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
        Nova conta a receber
      </button>
      {open && (
        <Modal title="Nova conta a receber" onClose={() => setOpen(false)}>
          <ContaReceberForm clientes={clientes} onDone={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
