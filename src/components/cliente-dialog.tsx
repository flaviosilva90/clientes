"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Modal } from "./modal";
import { Field, inputClass } from "./ui";
import {
  criarCliente,
  atualizarCliente,
  type FormState,
} from "@/app/(app)/clientes/actions";
import { type Cliente } from "@/lib/types";

const initial: FormState = {};
const hoje = () => new Date().toISOString().slice(0, 10);

function ClienteForm({
  cliente,
  onDone,
}: {
  cliente?: Cliente;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    cliente ? atualizarCliente : criarCliente,
    initial,
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <Field label="Nome *" htmlFor="nome">
        <input
          id="nome"
          name="nome"
          required
          defaultValue={cliente?.nome ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="E-mail" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={cliente?.email ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Telefone" htmlFor="telefone">
          <input
            id="telefone"
            name="telefone"
            defaultValue={cliente?.telefone ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="CPF / CNPJ" htmlFor="documento">
        <input
          id="documento"
          name="documento"
          defaultValue={cliente?.documento ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Mensalidade (R$)" htmlFor="valor_mensalidade">
          <input
            id="valor_mensalidade"
            name="valor_mensalidade"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            defaultValue={cliente?.valor_mensalidade ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Dia venc." htmlFor="dia_vencimento">
          <input
            id="dia_vencimento"
            name="dia_vencimento"
            type="number"
            min="1"
            max="31"
            defaultValue={cliente?.dia_vencimento ?? 10}
            className={inputClass}
          />
        </Field>
        <Field label="Início" htmlFor="data_inicio">
          <input
            id="data_inicio"
            name="data_inicio"
            type="date"
            defaultValue={cliente?.data_inicio ?? hoje()}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Observações" htmlFor="observacoes">
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          defaultValue={cliente?.observacoes ?? ""}
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={cliente ? cliente.ativo : true}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
        />
        Cliente ativo
      </label>

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

export function ClienteDialog({ cliente }: { cliente?: Cliente }) {
  const [open, setOpen] = useState(false);
  const editing = !!cliente;

  return (
    <>
      {editing ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Editar"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </button>
      )}
      {open && (
        <Modal
          title={editing ? "Editar cliente" : "Novo cliente"}
          onClose={() => setOpen(false)}
        >
          <ClienteForm cliente={cliente} onDone={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
