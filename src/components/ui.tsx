import { type StatusExibicao } from "@/lib/types";

export const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const STATUS_STYLE: Record<StatusExibicao, { label: string; cls: string }> = {
  pago: { label: "Pago", cls: "bg-emerald-100 text-emerald-700" },
  pendente: { label: "Pendente", cls: "bg-amber-100 text-amber-700" },
  atrasado: { label: "Atrasado", cls: "bg-red-100 text-red-700" },
  cancelado: { label: "Cancelado", cls: "bg-slate-100 text-slate-500" },
};

export function StatusBadge({ status }: { status: StatusExibicao }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
