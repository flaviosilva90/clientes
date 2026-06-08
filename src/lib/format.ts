export function formatBRL(value: number | null | undefined): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d =
    typeof date === "string"
      ? new Date(date.length === 10 ? date + "T00:00:00" : date)
      : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Recebe "YYYY-MM-DD" (ou "YYYY-MM") e devolve "Mês de AAAA".
export function formatCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  const idx = parseInt(mes, 10) - 1;
  return `${MESES[idx] ?? mes} de ${ano}`;
}
