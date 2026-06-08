"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "./modal";

export function ConfirmDialog({
  action,
  hidden,
  trigger,
  triggerClassName,
  title,
  message,
  confirmLabel = "Confirmar",
}: {
  action: (formData: FormData) => Promise<void>;
  hidden: Record<string, string>;
  trigger: React.ReactNode;
  triggerClassName?: string;
  title: string;
  message: string;
  confirmLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {trigger}
      </button>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)}>
          <p className="text-sm text-slate-600">{message}</p>
          <form
            action={(fd) =>
              startTransition(async () => {
                await action(fd);
                setOpen(false);
              })
            }
            className="mt-6 flex justify-end gap-3"
          >
            {Object.entries(hidden).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmLabel}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
