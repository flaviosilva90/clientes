"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Modal } from "./modal";
import { Field, inputClass } from "./ui";
import {
  criarMensalidade,
  type FormState,
} from "@/app/(app)/mensalidades/actions";

const initial: FormState = {};

type ClienteOpcao = { id: string; nome: string };

function MensalidadeForm({
  clientes,
  competenciaMes,
  onDone,
}: {
  clientes: ClienteOpcao[];
  competenciaMes: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    criarMensalidade,
    initial,
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Cliente *" htmlFor="cliente_id">
        <select
          id="cliente_id"
          name="cliente_id"
          required
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>
            Selecione...
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Competência *" htmlFor="competencia">
          <input
            id="competencia"
            name="competencia"
            type="month"
            required
            defaultValue={competenciaMes}
            className={inputClass}
          />
        </Field>
        <Field label="Vencimento *" htmlFor="vencimento">
          <input
            id="vencimento"
            name="vencimento"
            type="date"
            required
            defaultValue={`${competenciaMes}-10`}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Valor (R$) *" htmlFor="valor">
          <input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0,00"
            className={inputClass}
          />
        </Field>
        <Field label="Status" htmlFor="status">
          <select
            id="status"
            name="status"
            defaultValue="pendente"
            className={inputClass}
          >
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
          </select>
        </Field>
      </div>

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

export function MensalidadeDialog({
  clientes,
  competenciaMes,
}: {
  clientes: ClienteOpcao[];
  competenciaMes: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
        Nova mensalidade
      </button>
      {open && (
        <Modal title="Nova mensalidade" onClose={() => setOpen(false)}>
          {clientes.length === 0 ? (
            <p className="text-sm text-slate-600">
              Cadastre um cliente ativo antes de lançar mensalidades.
            </p>
          ) : (
            <MensalidadeForm
              clientes={clientes}
              competenciaMes={competenciaMes}
              onDone={() => setOpen(false)}
            />
          )}
        </Modal>
      )}
    </>
  );
}
