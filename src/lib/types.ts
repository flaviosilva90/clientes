export type Cliente = {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento: string | null;
  valor_mensalidade: number;
  dia_vencimento: number;
  data_inicio: string;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
};

export type StatusMensalidade = "pendente" | "pago" | "cancelado";

export type Mensalidade = {
  id: string;
  user_id: string;
  cliente_id: string;
  competencia: string; // primeiro dia do mes de referencia (YYYY-MM-DD)
  vencimento: string;
  valor: number;
  status: StatusMensalidade;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
};

export type MensalidadeComCliente = Mensalidade & {
  cliente: Pick<Cliente, "nome"> | null;
};

// Status derivado para exibicao: uma mensalidade pendente cujo vencimento
// ja passou e considerada "atrasada".
export type StatusExibicao = StatusMensalidade | "atrasado";

export function statusExibicao(m: Mensalidade): StatusExibicao {
  if (m.status === "pendente") {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const venc = new Date(m.vencimento + "T00:00:00");
    if (venc < hoje) return "atrasado";
  }
  return m.status;
}
