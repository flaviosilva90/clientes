export type Cliente = {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
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

// ============================================================
//  Contas a receber (lançamentos avulsos) + parcelas
// ============================================================

export const FORMAS_PAGAMENTO = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "cartao_credito", label: "Cartão de crédito" },
  { value: "cartao_debito", label: "Cartão de débito" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
] as const;

export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number]["value"];

export function labelFormaPagamento(valor: string | null | undefined): string {
  return FORMAS_PAGAMENTO.find((f) => f.value === valor)?.label ?? "—";
}

export type StatusParcela = "pendente" | "pago" | "cancelado";

export type ContaReceber = {
  id: string;
  user_id: string;
  cliente_id: string | null;
  descricao: string;
  valor_total: number;
  forma_pagamento: string;
  num_parcelas: number;
  data_lancamento: string;
  observacoes: string | null;
  created_at: string;
};

export type Parcela = {
  id: string;
  user_id: string;
  conta_id: string;
  numero: number;
  vencimento: string;
  valor: number;
  status: StatusParcela;
  data_pagamento: string | null;
  created_at: string;
};

// Parcela com os dados do lançamento (e do cliente) embutidos para exibição.
export type ParcelaComConta = Parcela & {
  conta:
    | (Pick<ContaReceber, "descricao" | "forma_pagamento" | "num_parcelas"> & {
        cliente: Pick<Cliente, "nome"> | null;
      })
    | null;
};

export function statusExibicaoParcela(p: Parcela): StatusExibicao {
  if (p.status === "pendente") {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const venc = new Date(p.vencimento + "T00:00:00");
    if (venc < hoje) return "atrasado";
  }
  return p.status;
}
